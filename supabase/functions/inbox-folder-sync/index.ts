// inbox-folder-sync — two-way folder/label parity between the app and the mailbox.
import { requireInboxAdmin, inboxCors, jsonResponse } from "../_shared/inbox-auth.ts";
import { logInboxActivity } from "../_shared/inbox-activity.ts";
import { mirrorAction, type MirrorAction } from "../_shared/inbox-mirror.ts";
import {
  gmailFetch,
  outlookFetch,
  nativeId,
  folderFromGmailLabels,
  OUTLOOK_FOLDER_ID,
} from "../_shared/inbox-providers.ts";

const FOLDER_TO_ACTION: Record<string, MirrorAction> = {
  inbox: "inbox",
  archive: "archive",
  trash: "trash",
  spam: "spam",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: inboxCors });

  const auth = await requireInboxAdmin(req);
  if (auth.response) return auth.response;
  const admin = auth.admin;

  let body: { emailIds?: string[]; targetFolder?: string; direction?: "push" | "pull" } = {};
  try { body = await req.json(); } catch { /* noop */ }
  const direction = body.direction ?? (body.targetFolder ? "push" : "pull");

  // PUSH: move selected mail in the app and mirror the move to the provider.
  if (direction === "push") {
    const action = FOLDER_TO_ACTION[body.targetFolder ?? ""];
    if (!action) return jsonResponse({ error: "targetFolder must be inbox, archive, trash or spam" }, 400);
    const { data: emails } = await admin
      .from("inbox_emails")
      .select("id, gmail_id, provider, account_id, folder, subject")
      .in("id", body.emailIds ?? []);
    const results = [];
    for (const email of emails ?? []) {
      results.push({ id: email.id, ...(await mirrorAction(admin, email as never, action, auth.userId || null)) });
    }
    return jsonResponse({ success: true, direction, results });
  }

  // PULL: re-read provider placement for recent mail and correct local drift.
  const { data: emails } = await admin
    .from("inbox_emails")
    .select("id, gmail_id, provider, account_id, folder")
    .order("received_at", { ascending: false })
    .limit(200);

  let corrected = 0;
  for (const email of emails ?? []) {
    try {
      const id = nativeId(email.provider, email.gmail_id);
      if (email.provider === "gmail") {
        const msg = await (await gmailFetch(`/users/me/messages/${id}?format=minimal`)).json();
        const folder = folderFromGmailLabels(msg.labelIds ?? []);
        if (folder !== email.folder) {
          await admin.from("inbox_emails").update({ folder, provider_labels: msg.labelIds ?? [] }).eq("id", email.id);
          corrected++;
        }
      } else if (email.provider === "outlook") {
        const { data: account } = await admin
          .from("inbox_accounts").select("secret_ref").eq("id", email.account_id ?? "").maybeSingle();
        const msg = await (
          await outlookFetch(`/me/messages/${id}?$select=parentFolderId,isRead`, account?.secret_ref ?? null)
        ).json();
        const entry = Object.entries(OUTLOOK_FOLDER_ID).find(([, v]) => v === msg.parentFolderId);
        if (entry && entry[0] !== email.folder) {
          await admin.from("inbox_emails").update({ folder: entry[0] }).eq("id", email.id);
          corrected++;
        }
      }
    } catch (err) {
      console.warn("folder parity check failed", err);
    }
  }

  await logInboxActivity(admin, {
    event_type: "folder_parity",
    status: "ok",
    message: `Folder parity: ${corrected} correction(s)`,
    detail: { corrected },
    actor: auth.userId || null,
  });

  return jsonResponse({ success: true, direction, corrected });
});
