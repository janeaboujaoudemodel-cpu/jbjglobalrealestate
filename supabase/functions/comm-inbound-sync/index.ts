// Comm Hub v2: inbound message poller (called by frontend or cron)
// Pulls Gmail inbox messages since last_sync_at, threads them, deduplicates,
// and writes into owner_comm_threads + owner_comm_messages.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const GATEWAY_BASE = "https://connector-gateway.lovable.dev";

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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const GMAIL_KEY = Deno.env.get("GOOGLE_MAIL_API_KEY");

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    if (!LOVABLE_API_KEY || !GMAIL_KEY) {
      return new Response(JSON.stringify({ skipped: "no_gmail_connection" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: channels } = await admin
      .from("owner_comm_channels")
      .select("id, user_id, channel_type, identifier, last_sync_at")
      .eq("channel_type", "email_gmail")
      .eq("is_active", true);

    let imported = 0;
    for (const ch of channels ?? []) {
      const sinceMs = ch.last_sync_at ? new Date(ch.last_sync_at).getTime() : Date.now() - 7 * 86400_000;
      const list = await gmailListMessages(LOVABLE_API_KEY, GMAIL_KEY, sinceMs);
      for (const m of list) {
        // 1) Hard dedup at DB level via unique index (user_id, external_message_id).
        //    Cheap pre-check avoids a Gmail GET when we already have the message.
        const { data: dup } = await admin
          .from("owner_comm_messages")
          .select("id")
          .eq("external_message_id", m.id)
          .eq("user_id", ch.user_id)
          .maybeSingle();
        if (dup) continue;

        const detail = await gmailGetMessage(LOVABLE_API_KEY, GMAIL_KEY, m.id);
        const headers = detail.payload?.headers ?? [];
        const fromHeader = pickHeader(headers, "From");
        const subject = pickHeader(headers, "Subject") || "(no subject)";
        const dateHeader = pickHeader(headers, "Date");

        const fromEmailMatch = fromHeader.match(/<([^>]+)>/) || [null, fromHeader];
        const fromEmail = (fromEmailMatch[1] || fromHeader).trim().toLowerCase();
        const fromName = fromHeader.replace(/<.*>/, "").trim().replace(/^"|"$/g, "") || fromEmail;
        const lastMessageAt = dateHeader ? new Date(dateHeader).toISOString() : new Date().toISOString();

        // 2) Idempotent thread upsert on (user_id, channel_type, contact_identifier).
        //    Concurrent polls are safe because of owner_comm_threads_user_channel_contact_unique.
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
          .select("id")
          .single();

        if (threadErr || !thread?.id) {
          console.error("[comm-inbound-sync] thread upsert failed", threadErr);
          continue;
        }
        const threadId = thread.id;

        // Bump unread_count atomically (upsert above only sets fields; increment separately).
        await admin.rpc("increment_thread_unread", { p_thread_id: threadId }).catch(() => {
          // Fallback: best-effort update if RPC missing.
          return admin
            .from("owner_comm_threads")
            .update({ unread_count: 1 })
            .eq("id", threadId);
        });

        // 3) Idempotent message upsert on (user_id, external_message_id).
        //    If a concurrent poll already inserted this message, the unique index causes
        //    onConflict to no-op instead of producing a duplicate.
        const { error: msgErr } = await admin
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
              status: "received",
            },
            { onConflict: "user_id,external_message_id", ignoreDuplicates: true }
          );

        if (msgErr) {
          console.error("[comm-inbound-sync] message upsert failed", msgErr);
          continue;
        }
        imported++;
      }

      await admin
        .from("owner_comm_channels")
        .update({ last_sync_at: new Date().toISOString(), sync_status: "synced", last_error: null })
        .eq("id", ch.id);
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
