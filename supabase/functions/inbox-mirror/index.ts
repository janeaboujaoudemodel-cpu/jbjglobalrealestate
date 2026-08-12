// inbox-mirror — generic single-action mirror endpoint (star/read/trash/archive/…).
import { requireInboxAdmin, inboxCors, jsonResponse } from "../_shared/inbox-auth.ts";
import { mirrorAction, type MirrorAction } from "../_shared/inbox-mirror.ts";

const ALLOWED: MirrorAction[] = [
  "star", "unstar", "read", "unread", "trash", "untrash", "archive", "spam", "inbox",
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: inboxCors });

  const auth = await requireInboxAdmin(req);
  if (auth.response) return auth.response;
  const admin = auth.admin;

  let body: { emailIds?: string[]; action?: MirrorAction } = {};
  try { body = await req.json(); } catch { /* noop */ }
  const ids = body.emailIds ?? [];
  if (!ids.length || !body.action || !ALLOWED.includes(body.action)) {
    return jsonResponse({ error: "emailIds and a valid action are required" }, 400);
  }

  const { data: emails } = await admin
    .from("inbox_emails")
    .select("id, gmail_id, provider, account_id, folder, subject")
    .in("id", ids);

  const results = [];
  for (const email of emails ?? []) {
    results.push({
      id: email.id,
      ...(await mirrorAction(admin, email as never, body.action!, auth.userId || null)),
    });
  }

  return jsonResponse({ success: true, action: body.action, results });
});
