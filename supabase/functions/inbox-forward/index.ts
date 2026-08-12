// inbox-forward — forwards a message with its original content.
import { requireInboxAdmin, inboxCors, jsonResponse } from "../_shared/inbox-auth.ts";
import { logInboxActivity } from "../_shared/inbox-activity.ts";
import { sendEmail, resolveAccount } from "../_shared/inbox-send.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: inboxCors });

  const auth = await requireInboxAdmin(req);
  if (auth.response) return auth.response;
  const admin = auth.admin;

  let body: { emailId?: string; to?: string; note?: string; html?: string; accountId?: string } = {};
  try { body = await req.json(); } catch { /* noop */ }
  if (!body.emailId || !body.to) {
    return jsonResponse({ error: "emailId and to are required" }, 400);
  }

  const { data: email } = await admin
    .from("inbox_emails")
    .select("id, subject, from_name, from_email, received_at, snippet, provider, account_id")
    .eq("id", body.emailId)
    .maybeSingle();
  if (!email) return jsonResponse({ error: "Email not found" }, 404);

  const account = await resolveAccount(admin, body.accountId ?? email.account_id, email.provider as never);
  if (!account) return jsonResponse({ error: "No connected mailbox available" }, 400);

  const original = body.html ?? `<p>${email.snippet ?? ""}</p>`;
  const html = `
    ${body.note ? `<p>${body.note}</p>` : ""}
    <hr />
    <p><strong>From:</strong> ${email.from_name ?? ""} &lt;${email.from_email ?? ""}&gt;<br />
    <strong>Date:</strong> ${email.received_at}<br />
    <strong>Subject:</strong> ${email.subject ?? ""}</p>
    ${original}
  `;

  try {
    await sendEmail({
      provider: account.provider,
      secretRef: account.secret_ref,
      from: `${account.display_name ?? account.email_address} <${account.email_address}>`,
      to: body.to,
      subject: `Fwd: ${email.subject ?? ""}`.trim(),
      html,
    });

    await logInboxActivity(admin, {
      event_type: "forward",
      account_id: account.id,
      email_id: email.id,
      status: "ok",
      message: `Forwarded to ${body.to}`,
      actor: auth.userId || null,
    });

    return jsonResponse({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return jsonResponse({ error: message }, 502);
  }
});
