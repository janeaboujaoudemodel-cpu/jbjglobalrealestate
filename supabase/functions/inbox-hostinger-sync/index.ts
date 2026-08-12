// inbox-hostinger-sync — generic IMAP mailbox sync (Hostinger and any IMAP host).
import { requireInboxAdmin, inboxCors, jsonResponse } from "../_shared/inbox-auth.ts";
import { logInboxActivity } from "../_shared/inbox-activity.ts";
import {
  imapConfig,
  IMAP_FOLDER_CANDIDATES,
  CANONICAL_FOLDERS,
  cleanSnippet,
  parseAddress,
  prefixedId,
  type CanonicalFolder,
} from "../_shared/inbox-providers.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: inboxCors });

  const auth = await requireInboxAdmin(req);
  if (auth.response) return auth.response;
  const admin = auth.admin;

  let body: { maxPerFolder?: number; folders?: CanonicalFolder[] } = {};
  try { body = await req.json(); } catch { /* defaults */ }
  const limit = Math.min(body.maxPerFolder ?? 30, 100);
  const folders = body.folders?.length ? body.folders : CANONICAL_FOLDERS;

  const cfg = imapConfig();
  if (!cfg) return jsonResponse({ error: "IMAP credentials are not configured" }, 400);

  const { data: account } = await admin
    .from("inbox_accounts")
    .upsert(
      {
        provider: "imap",
        email_address: cfg.address.toLowerCase(),
        display_name: cfg.address,
        status: "active",
        secret_ref: "HOSTINGER_IMAP",
        last_sync_status: "running",
      },
      { onConflict: "provider,email_address" },
    )
    .select("id")
    .single();
  const accountId = account?.id ?? null;

  let imported = 0;
  let updated = 0;

  try {
    const { ImapFlow } = await import("npm:imapflow@1.0.164");
    const client = new ImapFlow({
      host: cfg.host,
      port: cfg.port,
      secure: cfg.secure,
      auth: { user: cfg.user, pass: cfg.pass },
      logger: false,
    });
    await client.connect();

    try {
      for (const folder of folders) {
        let opened = false;
        for (const candidate of IMAP_FOLDER_CANDIDATES[folder]) {
          try {
            const lock = await client.getMailboxLock(candidate);
            opened = true;
            try {
              const total = client.mailbox && typeof client.mailbox === "object"
                ? (client.mailbox as { exists: number }).exists
                : 0;
              if (total > 0) {
                const start = Math.max(1, total - limit + 1);
                for await (
                  const msg of client.fetch(`${start}:*`, {
                    uid: true,
                    envelope: true,
                    flags: true,
                    bodyStructure: true,
                  })
                ) {
                  const env = msg.envelope ?? {};
                  const fromRaw = env.from?.[0];
                  const from = parseAddress(
                    fromRaw ? `${fromRaw.name ?? ""} <${fromRaw.address ?? ""}>` : "",
                  );
                  const storedId = prefixedId("imap", String(msg.uid));
                  const flags: string[] = Array.from(msg.flags ?? []);
                  const { data: existing } = await admin
                    .from("inbox_emails")
                    .select("id")
                    .eq("gmail_id", storedId)
                    .maybeSingle();

                  const row = {
                    gmail_id: storedId,
                    thread_id: env.messageId ?? null,
                    from_name: from.name || from.email,
                    from_email: from.email,
                    to_email: (env.to ?? []).map((t: any) => t.address).filter(Boolean).join(", "),
                    cc_email: (env.cc ?? []).map((t: any) => t.address).filter(Boolean).join(", ") || null,
                    subject: env.subject || "(no subject)",
                    snippet: cleanSnippet(env.subject),
                    received_at: env.date ? new Date(env.date).toISOString() : new Date().toISOString(),
                    is_unread: !flags.includes("\\Seen"),
                    is_starred: flags.includes("\\Flagged"),
                    provider: "imap",
                    account_id: accountId,
                    provider_labels: flags,
                    folder,
                    provider_folder: candidate,
                    web_link: null,
                  };

                  if (existing) {
                    await admin.from("inbox_emails").update(row).eq("id", existing.id);
                    updated++;
                  } else {
                    await admin.from("inbox_emails").insert(row);
                    imported++;
                  }
                }
              }
            } finally {
              lock.release();
            }
            break;
          } catch { /* try the next folder-name candidate */ }
        }

        await admin.from("inbox_sync_state").upsert(
          {
            account_id: accountId,
            provider: "imap",
            folder,
            last_run_at: new Date().toISOString(),
            last_status: opened ? "ok" : "missing_folder",
          },
          { onConflict: "account_id,folder" },
        );
      }
    } finally {
      await client.logout().catch(() => {});
    }

    const [unread, awaiting] = await Promise.all([
      admin.from("inbox_emails").select("id", { count: "exact", head: true })
        .eq("account_id", accountId).eq("folder", "inbox").eq("is_unread", true),
      admin.from("inbox_emails").select("id", { count: "exact", head: true })
        .eq("account_id", accountId).eq("folder", "inbox").eq("is_responded", false).eq("is_ignored", false),
    ]);

    await admin.from("inbox_accounts").update({
      unread_count: unread.count ?? 0,
      awaiting_reply_count: awaiting.count ?? 0,
      last_synced_at: new Date().toISOString(),
      last_sync_status: "ok",
      last_sync_error: null,
      status: "active",
    }).eq("id", accountId);

    await logInboxActivity(admin, {
      event_type: "sync_run",
      account_id: accountId,
      status: "ok",
      message: `IMAP sync (${cfg.address}): ${imported} new, ${updated} updated`,
      detail: { imported, updated },
      actor: auth.userId || null,
    });

    return jsonResponse({ success: true, provider: "imap", accountId, imported, updated });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await admin.from("inbox_accounts").update({
      status: "reconnect_required",
      last_sync_status: "error",
      last_sync_error: message,
    }).eq("id", accountId);
    await logInboxActivity(admin, {
      event_type: "sync_run",
      account_id: accountId,
      status: "error",
      message: `IMAP sync failed: ${message}`,
      detail: { error: message },
    });
    return jsonResponse({ error: message }, 502);
  }
});
