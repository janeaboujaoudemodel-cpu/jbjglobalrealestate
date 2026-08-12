// inbox-outlook-sync — syncs every linked Microsoft 365 mailbox into the Admin Inbox.
import { requireInboxAdmin, inboxCors, jsonResponse } from "../_shared/inbox-auth.ts";
import { logInboxActivity } from "../_shared/inbox-activity.ts";
import {
  outlookFetch,
  outlookKeys,
  OUTLOOK_FOLDER_ID,
  CANONICAL_FOLDERS,
  cleanSnippet,
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
  const top = Math.min(body.maxPerFolder ?? 30, 100);
  const folders = body.folders?.length ? body.folders : CANONICAL_FOLDERS;

  const keys = outlookKeys();
  if (!keys.length) return jsonResponse({ error: "No Outlook connector linked" }, 400);

  const results: Record<string, unknown>[] = [];

  for (const { ref } of keys) {
    let accountId: string | null = null;
    try {
      const me = await (await outlookFetch("/me", ref)).json();
      const address = String(me.mail ?? me.userPrincipalName ?? "").toLowerCase();

      const { data: account } = await admin
        .from("inbox_accounts")
        .upsert(
          {
            provider: "outlook",
            email_address: address,
            display_name: me.displayName ?? address,
            status: "active",
            secret_ref: ref,
            last_sync_status: "running",
          },
          { onConflict: "provider,email_address" },
        )
        .select("id")
        .single();
      accountId = account?.id ?? null;

      let imported = 0;
      let updated = 0;

      for (const folder of folders) {
        const graphFolder = OUTLOOK_FOLDER_ID[folder];
        let messages: Record<string, any>[] = [];
        try {
          const res = await outlookFetch(
            `/me/mailFolders/${graphFolder}/messages?$top=${top}&$orderby=receivedDateTime desc&$select=id,conversationId,subject,bodyPreview,from,toRecipients,ccRecipients,receivedDateTime,isRead,flag,hasAttachments,webLink,categories`,
            ref,
          );
          const json = await res.json();
          messages = json.value ?? [];
        } catch (folderErr) {
          console.warn(`outlook folder ${graphFolder} unavailable`, folderErr);
          continue;
        }

        for (const msg of messages) {
          const storedId = prefixedId("outlook", msg.id);
          const fromAddr = msg.from?.emailAddress ?? {};
          const { data: existing } = await admin
            .from("inbox_emails")
            .select("id")
            .eq("gmail_id", storedId)
            .maybeSingle();

          const row = {
            gmail_id: storedId,
            thread_id: msg.conversationId ?? null,
            from_name: fromAddr.name ?? fromAddr.address ?? "",
            from_email: String(fromAddr.address ?? "").toLowerCase(),
            to_email: (msg.toRecipients ?? [])
              .map((r: any) => r.emailAddress?.address)
              .filter(Boolean)
              .join(", "),
            cc_email: (msg.ccRecipients ?? [])
              .map((r: any) => r.emailAddress?.address)
              .filter(Boolean)
              .join(", ") || null,
            subject: msg.subject || "(no subject)",
            snippet: cleanSnippet(msg.bodyPreview),
            received_at: msg.receivedDateTime ?? new Date().toISOString(),
            is_unread: msg.isRead === false,
            is_starred: msg.flag?.flagStatus === "flagged",
            provider: "outlook",
            account_id: accountId,
            provider_labels: msg.categories ?? [],
            folder,
            provider_folder: graphFolder,
            has_attachments: Boolean(msg.hasAttachments),
            web_link: msg.webLink ?? null,
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
            provider: "outlook",
            folder,
            last_run_at: new Date().toISOString(),
            last_status: "ok",
            imported_count: messages.length,
          },
          { onConflict: "account_id,folder" },
        );
      }

      const [unread, awaiting, drafts] = await Promise.all([
        admin.from("inbox_emails").select("id", { count: "exact", head: true })
          .eq("account_id", accountId).eq("folder", "inbox").eq("is_unread", true),
        admin.from("inbox_emails").select("id", { count: "exact", head: true })
          .eq("account_id", accountId).eq("folder", "inbox").eq("is_responded", false).eq("is_ignored", false),
        admin.from("inbox_emails").select("id", { count: "exact", head: true })
          .eq("account_id", accountId).eq("folder", "drafts"),
      ]);

      await admin.from("inbox_accounts").update({
        unread_count: unread.count ?? 0,
        awaiting_reply_count: awaiting.count ?? 0,
        draft_count: drafts.count ?? 0,
        last_synced_at: new Date().toISOString(),
        last_sync_status: "ok",
        last_sync_error: null,
        status: "active",
      }).eq("id", accountId);

      await logInboxActivity(admin, {
        event_type: "sync_run",
        account_id: accountId,
        status: "ok",
        message: `Outlook sync (${address}): ${imported} new, ${updated} updated`,
        detail: { imported, updated, secret_ref: ref },
        actor: auth.userId || null,
      });

      results.push({ mailbox: address, imported, updated });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (accountId) {
        await admin.from("inbox_accounts").update({
          status: "reconnect_required",
          last_sync_status: "error",
          last_sync_error: message,
        }).eq("id", accountId);
      }
      await logInboxActivity(admin, {
        event_type: "sync_run",
        account_id: accountId,
        status: "error",
        message: `Outlook sync failed (${ref}): ${message}`,
        detail: { error: message, secret_ref: ref },
      });
      results.push({ secret_ref: ref, error: message });
    }
  }

  return jsonResponse({ success: true, provider: "outlook", results });
});
