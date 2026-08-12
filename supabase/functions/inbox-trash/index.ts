// inbox-trash — move to trash / restore from trash, mirrored to the provider.
import { requireInboxAdmin, inboxCors, jsonResponse } from "../_shared/inbox-auth.ts";
import { mirrorAction } from "../_shared/inbox-mirror.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: inboxCors });

  const auth = await requireInboxAdmin(req);
  if (auth.response) return auth.response;
  const admin = auth.admin;

  let body: { emailIds?: string[]; restore?: boolean } = {};
  try { body = await req.json(); } catch { /* noop */ }
  const ids = body.emailIds ?? [];
  if (!ids.length) return jsonResponse({ error: "emailIds is required" }, 400);

  const { data: emails } = await admin
    .from("inbox_emails")
    .select("id, gmail_id, provider, account_id, folder, subject")
    .in("id", ids);

  const results = [];
  for (const email of emails ?? []) {
    results.push({
      id: email.id,
      ...(await mirrorAction(
        admin,
        email as never,
        body.restore ? "untrash" : "trash",
        auth.userId || null,
      )),
    });
  }

  return jsonResponse({ success: true, results });
});
