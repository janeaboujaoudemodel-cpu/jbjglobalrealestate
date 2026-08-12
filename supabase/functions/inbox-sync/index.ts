// inbox-sync — Gmail mailbox sync (all canonical folders) for the Admin Inbox.
import { requireInboxAdmin, inboxCors, jsonResponse } from "../_shared/inbox-auth.ts";
import { logInboxActivity } from "../_shared/inbox-activity.ts";
import {
  gmailFetch,
  GMAIL_FOLDER_QUERY,
  CANONICAL_FOLDERS,
  folderFromGmailLabels,
  cleanSnippet,
  parseAddress,
  prefixedId,
  type CanonicalFolder,
} from "../_shared/inbox-providers.ts";

function header(headers: { name: string; value: string }[] | undefined, name: string) {
  return headers?.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value ?? "";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: inboxCors });

  const auth = await requireInboxAdmin(req);
  if (auth.response) return auth.response;
  const admin = auth.admin;

  let body: { accountId?: string; maxPerFolder?: number; folders?: CanonicalFolder[] } = {};
  try { body = await req.json(); } catch { /* defaults */ }
  const maxPerFolder = Math.min(body.maxPerFolder ?? 40, 100);
  const folders = body.folders?.length ? body.folders : CANONICAL_FOLDERS;

  try {
    // Resolve / create the Gmail account row from the connected profile.
    const profile = await (await gmailFetch("/users/me/profile")).json();
    const address = String(profile.emailAddress ?? "").toLowerCase();

    const { data: account } = await admin
      .from("inbox_accounts")
      .upsert(
        {
          provider: "gmail",
          email_address: address,
          display_name: address,
          status: "active",
          secret_ref: "GOOGLE_MAIL_API_KEY",
          last_synced_at: new Date().toISOString(),
          last_sync_status: "running",
        },
        { onConflict: "provider,email_address" },
      )
      .select("id")
      .single();

    const accountId = account?.id ?? null;
    let imported = 0;
    let updated = 0;

    for (const folder of folders) {
      const list = await (
        await gmailFetch(
          `/users/me/messages?maxResults=${maxPerFolder}&q=${encodeURIComponent(GMAIL_FOLDER_QUERY[folder])}`,
        )
      ).json();
      const ids: string[] = (list.messages ?? []).map((m: { id: string }) => m.id);

      for (const id of ids) {
        const msg = await (
          await gmailFetch(`/users/me/messages/${id}?format=metadata&metadataHeaders=From&metadataHeaders=To&metadataHeaders=Cc&metadataHeaders=Subject&metadataHeaders=Date`)
        ).json();
        const headers = msg.payload?.headers ?? [];
        const from = parseAddress(header(headers, "From"));
        const labels: string[] = msg.labelIds ?? [];
        const storedId = prefixedId("gmail", id);

        const { data: existing } = await admin
          .from("inbox_emails")
          .select("id")
          .eq("gmail_id", storedId)
          .maybeSingle();

        const row = {
          gmail_id: storedId,
          thread_id: msg.threadId ?? null,
          from_name: from.name || from.email,
          from_email: from.email,
          to_email: header(headers, "To"),
          cc_email: header(headers, "Cc") || null,
          subject: header(headers, "Subject") || "(no subject)",
          snippet: cleanSnippet(msg.snippet),
          received_at: msg.internalDate
            ? new Date(Number(msg.internalDate)).toISOString()
            : new Date().toISOString(),
          is_unread: labels.includes("UNREAD"),
          is_starred: labels.includes("STARRED"),
          provider: "gmail",
          account_id: accountId,
          provider_labels: labels,
          folder: folderFromGmailLabels(labels),
          provider_folder: labels.join(","),
          web_link: `https://mail.google.com/mail/u/0/#all/${id}`,
        };

        if (existing) {
          await admin.from("inbox_emails").update(row).eq("id", existing.id);
          updated++;
        } else {
          await admin.from("inbox_emails").insert(row);
          imported++;
        }
      }

      await admin.from("inbox_sync_state").upsert(
        {
          account_id: accountId,
          provider: "gmail",
          folder,
          last_run_at: new Date().toISOString(),
          last_status: "ok",
          last_error: null,
          imported_count: ids.length,
        },
        { onConflict: "account_id,folder" },
      );
    }

    // Refresh mailbox counters.
    const counts = await Promise.all([
      admin.from("inbox_emails").select("id", { count: "exact", head: true })
        .eq("account_id", accountId).eq("folder", "inbox").eq("is_unread", true),
      admin.from("inbox_emails").select("id", { count: "exact", head: true })
        .eq("account_id", accountId).eq("folder", "inbox").eq("is_responded", false).eq("is_ignored", false),
      admin.from("inbox_emails").select("id", { count: "exact", head: true })
        .eq("account_id", accountId).eq("folder", "drafts"),
    ]);

    await admin.from("inbox_accounts").update({
      unread_count: counts[0].count ?? 0,
      awaiting_reply_count: counts[1].count ?? 0,
      draft_count: counts[2].count ?? 0,
      last_synced_at: new Date().toISOString(),
      last_sync_status: "ok",
      last_sync_error: null,
      status: "active",
    }).eq("id", accountId);

    await logInboxActivity(admin, {
      event_type: "sync_run",
      account_id: accountId,
      status: "ok",
      message: `Gmail sync: ${imported} new, ${updated} updated`,
      detail: { imported, updated, folders },
      actor: auth.userId || null,
    });

    return jsonResponse({ success: true, provider: "gmail", accountId, imported, updated });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await admin.from("inbox_accounts").update({
      status: "reconnect_required",
      last_sync_status: "error",
      last_sync_error: message,
    }).eq("provider", "gmail");
    await logInboxActivity(admin, {
      event_type: "sync_run",
      status: "error",
      message: `Gmail sync failed: ${message}`,
      detail: { error: message },
    });
    return jsonResponse({ error: message }, 502);
  }
});
