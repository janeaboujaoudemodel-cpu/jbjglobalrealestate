// inbox-attachment — downloads a single attachment as base64 for in-app preview/download.
import { requireInboxAdmin, inboxCors, jsonResponse } from "../_shared/inbox-auth.ts";
import { gmailFetch, outlookFetch, nativeId } from "../_shared/inbox-providers.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: inboxCors });

  const auth = await requireInboxAdmin(req);
  if (auth.response) return auth.response;
  const admin = auth.admin;

  let body: { emailId?: string; attachmentId?: string; filename?: string } = {};
  try { body = await req.json(); } catch { /* noop */ }
  if (!body.emailId || !body.attachmentId) {
    return jsonResponse({ error: "emailId and attachmentId are required" }, 400);
  }

  const { data: email } = await admin
    .from("inbox_emails")
    .select("gmail_id, provider, account_id")
    .eq("id", body.emailId)
    .maybeSingle();
  if (!email) return jsonResponse({ error: "Email not found" }, 404);

  const id = nativeId(email.provider, email.gmail_id);

  try {
    if (email.provider === "gmail") {
      const data = await (
        await gmailFetch(`/users/me/messages/${id}/attachments/${body.attachmentId}`)
      ).json();
      const base64 = String(data.data ?? "").replace(/-/g, "+").replace(/_/g, "/");
      return jsonResponse({ success: true, base64, filename: body.filename ?? "attachment" });
    }

    if (email.provider === "outlook") {
      const { data: account } = await admin
        .from("inbox_accounts").select("secret_ref").eq("id", email.account_id ?? "").maybeSingle();
      const att = await (
        await outlookFetch(
          `/me/messages/${id}/attachments/${body.attachmentId}`,
          account?.secret_ref ?? null,
        )
      ).json();
      return jsonResponse({
        success: true,
        base64: att.contentBytes ?? "",
        filename: att.name ?? body.filename ?? "attachment",
        mimeType: att.contentType ?? "application/octet-stream",
      });
    }

    return jsonResponse({ error: "Attachment download is not supported for IMAP yet" }, 400);
  } catch (err) {
    return jsonResponse({ error: err instanceof Error ? err.message : String(err) }, 502);
  }
});
