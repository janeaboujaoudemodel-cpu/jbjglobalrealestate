// Comm Hub v2: inbound message poller (called by frontend or cron)
// Pulls Gmail (via API) and Hostinger (via IMAP) inbox messages since last_sync_at,
// threads them, deduplicates, and writes into owner_comm_threads + owner_comm_messages.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { ImapClient } from "jsr:@workingdevshero/deno-imap@1.0.0";
import { logChannelAudit } from "../_shared/channelAudit.ts";
import { decryptCredential } from "../_shared/credentialCrypto.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const GATEWAY_BASE = "https://connector-gateway.lovable.dev";

/* ─── Gmail helpers ─── */
async function gmailListMessages(lovableKey: string, connectorKey: string, sinceEpoch: number) {
  const q = encodeURIComponent(`in:inbox newer_than:7d`);
  const r = await fetch(
    `${GATEWAY_BASE}/google_mail/gmail/v1/users/me/messages?maxResults=20&q=${q}`,
    { headers: { Authorization: `Bearer ${lovableKey}`, "X-Connection-Api-Key": connectorKey } }
  );
  const j = await r.json();
  if (!r.ok) throw new Error(`Gmail list failed: ${JSON.stringify(j)}`);
  return j.messages || [];
}

async function gmailGetMessage(lovableKey: string, connectorKey: string, id: string) {
  const r = await fetch(
    `${GATEWAY_BASE}/google_mail/gmail/v1/users/me/messages/${id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date`,
    { headers: { Authorization: `Bearer ${lovableKey}`, "X-Connection-Api-Key": connectorKey } }
  );
  return await r.json();
}

function pickHeader(headers: Array<{ name: string; value: string }>, name: string) {
  return headers?.find((h) => h.name?.toLowerCase() === name.toLowerCase())?.value ?? "";
}

/* ─── IMAP / Hostinger helpers ─── */
interface HostingerCreds {
  email: string;
  password: string;
  imap_host: string;
  imap_port: number;
  smtp_host: string;
  smtp_port: number;
}

async function fetchHostingerMessages(
  creds: HostingerCreds,
  sinceDate: Date
): Promise<
  Array<{
    uid: string;
    subject: string;
    from: string;
    date: string;
    bodyText: string;
  }>
> {
  const client = new ImapClient({ host: creds.imap_host, port: creds.imap_port, tls: true });
  try {
    await client.connect();
    // Hostinger advertises AUTH=LOGIN but not AUTH=PLAIN cleanly; LOGIN
    // mechanism uses the IMAP LOGIN verb directly and is widely supported.
    await client.authenticate({ mechanism: "LOGIN", username: creds.email, password: creds.password });
    await client.selectMailbox("INBOX");

    // Search for messages since the given date (IMAP SINCE format: 01-Jan-2024)
    const sinceStr = sinceDate.toUTCString().replace(/,.*/, ""); // e.g., "01 Jan 2024"
    // Use broader criteria if SINCE is tricky; try UNSEEN first for safety.
    const results = await client.search({ since: sinceStr });
    if (!results || results.length === 0) return [];

    const messages: Array<{
      uid: string;
      subject: string;
      from: string;
      date: string;
      bodyText: string;
    }> = [];

    for (const seq of results.slice(0, 20)) {
      try {
        const fetched = await client.fetch(String(seq), { envelope: true, body: true });
        // deno-imap returns parsed structures; adapt based on actual shape.
        const env = (fetched as any)?.envelope ?? {};
        const parts = (fetched as any)?.body ?? [];
        let bodyText = "";
        for (const part of Array.isArray(parts) ? parts : [parts]) {
          if (part?.type === "text/plain" || part?.contentType?.includes("text/plain")) {
            bodyText = part.content ?? part.text ?? "";
          }
        }
        messages.push({
          uid: String(seq),
          subject: env.subject ?? "(no subject)",
          from: env.from?.[0] ? `${env.from[0].name || ""} <${env.from[0].email || ""}>`.trim() : "unknown",
          date: env.date ?? new Date().toISOString(),
          bodyText,
        });
      } catch (e) {
        console.warn("[comm-inbound-sync] hostinger fetch item failed", e);
      }
    }

    await client.disconnect();
    return messages;
  } catch (e) {
    await client.disconnect().catch(() => {});
    throw e;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const CRED_KEY = Deno.env.get("COMM_CREDENTIAL_KEY") || Deno.env.get("HOSTINGER_CREDENTIAL_KEY");

    // Collect ALL Gmail connector secrets so multi-account inboxes
    // (GOOGLE_MAIL_API_KEY + GOOGLE_MAIL_API_KEY_2 + ...) can each be polled
    // independently and matched to the right channel by email identifier.
    const gmailKeys = Object.keys(Deno.env.toObject())
      .filter((k) => k === "GOOGLE_MAIL_API_KEY" || k.startsWith("GOOGLE_MAIL_API_KEY_"))
      .map((k) => Deno.env.get(k))
      .filter((v): v is string => !!v);

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    // Build identifier → connector key map by querying each Gmail profile.
    const gmailKeyByEmail = new Map<string, string>();
    if (LOVABLE_API_KEY) {
      for (const key of gmailKeys) {
        try {
          const r = await fetch(`${GATEWAY_BASE}/google_mail/gmail/v1/users/me/profile`, {
            headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "X-Connection-Api-Key": key },
          });
          const j = await r.json();
          if (r.ok && j.emailAddress) gmailKeyByEmail.set(String(j.emailAddress).toLowerCase(), key);
        } catch (e) {
          console.warn("[comm-inbound-sync] gmail profile fetch failed", e);
        }
      }
    }

    // Optional body: { channel_id?: string, channel_type?: string, user_id?: string }
    let body: { channel_id?: string; channel_type?: string; user_id?: string } = {};
    if (req.method === "POST") {
      try { body = await req.json(); } catch { /* empty body is fine */ }
    }

    // Build the channel query. When a specific channel_id is provided
    // (one-click resync from the UI), scope strictly to that row.
    let q = admin
      .from("owner_comm_channels")
      .select("id, user_id, channel_type, identifier, last_sync_at, credentials")
      .eq("is_active", true);
    if (body.channel_id) {
      q = q.eq("id", body.channel_id);
    } else {
      q = q.in("channel_type", ["email_gmail", "email_hostinger"]);
    }
    const { data: channels } = await q;

    let imported = 0;
    for (const ch of channels ?? []) {
      // ─── Hostinger branch ───
      if (ch.channel_type === "email_hostinger") {
        if (!CRED_KEY || !ch.credentials?.password) {
          await admin
            .from("owner_comm_channels")
            .update({ last_sync_at: new Date().toISOString(), sync_status: "synced", last_error: null })
            .eq("id", ch.id);
          await logChannelAudit(admin, {
            user_id: ch.user_id,
            channel_id: ch.id,
            channel_type: ch.channel_type,
            identifier: ch.identifier,
            event_type: "synced",
            details: { provider_supported: false, reason: "no_credentials_key" },
          });
          continue;
        }

        const sinceMs = ch.last_sync_at ? new Date(ch.last_sync_at).getTime() : Date.now() - 7 * 86400_000;
        let channelImported = 0;
        try {
          const password = await decryptCredential(ch.credentials.password, CRED_KEY);
          const creds: HostingerCreds = {
            email: ch.credentials.email || ch.identifier,
            password,
            imap_host: ch.credentials.imap_host || "imap.hostinger.com",
            imap_port: ch.credentials.imap_port || 993,
            smtp_host: ch.credentials.smtp_host || "smtp.hostinger.com",
            smtp_port: ch.credentials.smtp_port || 465,
          };

          const msgs = await fetchHostingerMessages(creds, new Date(sinceMs));
          for (const m of msgs) {
            // Deduplicate by uid + email
            const externalId = `hostinger-${creds.email}-${m.uid}`;
            const { data: dup } = await admin
              .from("owner_comm_messages")
              .select("id")
              .eq("external_message_id", externalId)
              .eq("user_id", ch.user_id)
              .maybeSingle();
            if (dup) continue;

            const fromHeader = m.from;
            const fromEmailMatch = fromHeader.match(/<([^>]+)>/) || [null, fromHeader];
            const fromEmail = (fromEmailMatch[1] || fromHeader).trim().toLowerCase();
            const fromName = fromHeader.replace(/<.*>/, "").trim().replace(/^"|"$/g, "") || fromEmail;
            const lastMessageAt = m.date ? new Date(m.date).toISOString() : new Date().toISOString();

            const { data: thread, error: threadErr } = await admin
              .from("owner_comm_threads")
              .upsert(
                {
                  user_id: ch.user_id,
                  channel_id: ch.id,
                  channel_type: "email_hostinger",
                  contact_identifier: fromEmail,
                  contact_name: fromName,
                  last_message_at: lastMessageAt,
                  last_message_preview: m.subject,
                },
                { onConflict: "user_id,channel_type,contact_identifier" }
              )
              .select("id, unread_count")
              .single();

            if (threadErr || !thread?.id) {
              console.error("[comm-inbound-sync] thread upsert failed", threadErr);
              continue;
            }
            const threadId = thread.id;

            const { data: insertedMsg, error: msgErr } = await admin
              .from("owner_comm_messages")
              .upsert(
                {
                  user_id: ch.user_id,
                  thread_id: threadId,
                  direction: "inbound",
                  content: m.subject + (m.bodyText ? "\n\n" + m.bodyText : ""),
                  content_type: "text",
                  external_message_id: externalId,
                  sender_identifier: fromEmail,
                  sender_name: fromName,
                  status: "delivered",
                },
                { onConflict: "user_id,external_message_id", ignoreDuplicates: true }
              )
              .select("id");

            if (msgErr) {
              console.error("[comm-inbound-sync] message upsert failed", msgErr);
              continue;
            }

            const wasNew = Array.isArray(insertedMsg) && insertedMsg.length > 0;
            if (wasNew) {
              await admin
                .from("owner_comm_threads")
                .update({ unread_count: (thread.unread_count ?? 0) + 1 })
                .eq("id", threadId);
              imported++;
              channelImported++;
              await logChannelAudit(admin, {
                user_id: ch.user_id,
                channel_id: ch.id,
                channel_type: ch.channel_type,
                identifier: ch.identifier,
                event_type: "inbound_received",
                details: {
                  external_message_id: externalId,
                  from: fromEmail,
                  subject: m.subject,
                  thread_id: threadId,
                },
              });
            }
          }

          await admin
            .from("owner_comm_channels")
            .update({ last_sync_at: new Date().toISOString(), sync_status: "synced", last_error: null })
            .eq("id", ch.id);
          await logChannelAudit(admin, {
            user_id: ch.user_id,
            channel_id: ch.id,
            channel_type: ch.channel_type,
            identifier: ch.identifier,
            event_type: "synced",
            details: { imported: channelImported },
          });
        } catch (chErr: unknown) {
          const errMsg = chErr instanceof Error ? chErr.message : "sync failed";
          await admin
            .from("owner_comm_channels")
            .update({ sync_status: "failed", last_error: errMsg })
            .eq("id", ch.id);
          await logChannelAudit(admin, {
            user_id: ch.user_id,
            channel_id: ch.id,
            channel_type: ch.channel_type,
            identifier: ch.identifier,
            event_type: "sync_failed",
            details: { error: errMsg },
          });
        }
        continue;
      }

      // ─── Gmail branch ───
      if (ch.channel_type !== "email_gmail") {
        await admin
          .from("owner_comm_channels")
          .update({ last_sync_at: new Date().toISOString(), sync_status: "synced", last_error: null })
          .eq("id", ch.id);
        await logChannelAudit(admin, {
          user_id: ch.user_id,
          channel_id: ch.id,
          channel_type: ch.channel_type,
          identifier: ch.identifier,
          event_type: "synced",
          details: { provider_supported: false, imported: 0 },
        });
        continue;
      }

      const sinceMs = ch.last_sync_at ? new Date(ch.last_sync_at).getTime() : Date.now() - 7 * 86400_000;
      let channelImported = 0;
      const channelEmail = (ch.identifier || "").toLowerCase();
      const connectorKey = gmailKeyByEmail.get(channelEmail) ?? gmailKeys[0];
      try {
        const list = await gmailListMessages(LOVABLE_API_KEY!, connectorKey, sinceMs);
        for (const m of list) {
          const { data: dup } = await admin
            .from("owner_comm_messages")
            .select("id")
            .eq("external_message_id", m.id)
            .eq("user_id", ch.user_id)
            .maybeSingle();
          if (dup) continue;

          const detail = await gmailGetMessage(LOVABLE_API_KEY!, connectorKey, m.id);
          const headers = detail.payload?.headers ?? [];
          const fromHeader = pickHeader(headers, "From");
          const subject = pickHeader(headers, "Subject") || "(no subject)";
          const dateHeader = pickHeader(headers, "Date");

          const fromEmailMatch = fromHeader.match(/<([^>]+)>/) || [null, fromHeader];
          const fromEmail = (fromEmailMatch[1] || fromHeader).trim().toLowerCase();
          const fromName = fromHeader.replace(/<.*>/, "").trim().replace(/^"|"$/g, "") || fromEmail;
          const lastMessageAt = dateHeader ? new Date(dateHeader).toISOString() : new Date().toISOString();

          const { data: thread, error: threadErr } = await admin
            .from("owner_comm_threads")
            .upsert(
              {
                user_id: ch.user_id,
                channel_id: ch.id,
                channel_type: "email_gmail",
                contact_identifier: fromEmail,
                contact_name: fromName,
                last_message_at: lastMessageAt,
                last_message_preview: subject,
              },
              { onConflict: "user_id,channel_type,contact_identifier" }
            )
            .select("id, unread_count")
            .single();

          if (threadErr || !thread?.id) {
            console.error("[comm-inbound-sync] thread upsert failed", threadErr);
            continue;
          }
          const threadId = thread.id;

          const { data: insertedMsg, error: msgErr } = await admin
            .from("owner_comm_messages")
            .upsert(
              {
                user_id: ch.user_id,
                thread_id: threadId,
                direction: "inbound",
                content: subject,
                content_type: "text",
                external_message_id: m.id,
                sender_identifier: fromEmail,
                sender_name: fromName,
                status: "delivered",
              },
              { onConflict: "user_id,external_message_id", ignoreDuplicates: true }
            )
            .select("id");

          if (msgErr) {
            console.error("[comm-inbound-sync] message upsert failed", msgErr);
            continue;
          }

          const wasNew = Array.isArray(insertedMsg) && insertedMsg.length > 0;
          if (wasNew) {
            await admin
              .from("owner_comm_threads")
              .update({ unread_count: (thread.unread_count ?? 0) + 1 })
              .eq("id", threadId);
            imported++;
            channelImported++;
            await logChannelAudit(admin, {
              user_id: ch.user_id,
              channel_id: ch.id,
              channel_type: ch.channel_type,
              identifier: ch.identifier,
              event_type: "inbound_received",
              details: {
                external_message_id: m.id,
                from: fromEmail,
                subject,
                thread_id: threadId,
              },
            });
          }
        }

        await admin
          .from("owner_comm_channels")
          .update({ last_sync_at: new Date().toISOString(), sync_status: "synced", last_error: null })
          .eq("id", ch.id);
        await logChannelAudit(admin, {
          user_id: ch.user_id,
          channel_id: ch.id,
          channel_type: ch.channel_type,
          identifier: ch.identifier,
          event_type: "synced",
          details: { imported: channelImported },
        });
      } catch (chErr: unknown) {
        const errMsg = chErr instanceof Error ? chErr.message : "sync failed";
        await admin
          .from("owner_comm_channels")
          .update({ sync_status: "failed", last_error: errMsg })
          .eq("id", ch.id);
        await logChannelAudit(admin, {
          user_id: ch.user_id,
          channel_id: ch.id,
          channel_type: ch.channel_type,
          identifier: ch.identifier,
          event_type: "sync_failed",
          details: { error: errMsg },
        });
      }
    }

    return new Response(JSON.stringify({ ok: true, imported }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "unknown";
    console.error("[comm-inbound-sync]", err);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
