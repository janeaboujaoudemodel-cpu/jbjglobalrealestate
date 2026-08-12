// inbox-send-as — composes a new email from any connected address.
import { requireInboxAdmin, inboxCors, jsonResponse } from "../_shared/inbox-auth.ts";
import { logInboxActivity } from "../_shared/inbox-activity.ts";
import { sendEmail, resolveAccount } from "../_shared/inbox-send.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: inboxCors });

  const auth = await requireInboxAdmin(req);
  if (auth.response) return auth.response;
  const admin = auth.admin;

  let body: { accountId?: string; to?: string; cc?: string; subject?: string; html?: string } = {};
  try { body = await req.json(); } catch { /* noop */ }
  if (!body.to || !body.subject || !body.html) {
    return jsonResponse({ error: "to, subject and html are required" }, 400);
  }

  const account = await resolveAccount(admin, body.accountId);
  if (!account) return jsonResponse({ error: "No connected mailbox available" }, 400);

  try {
    await sendEmail({
      provider: account.provider,
      secretRef: account.secret_ref,
      from: `${account.display_name ?? account.email_address} <${account.email_address}>`,
      to: body.to,
      cc: body.cc,
      subject: body.subject,
      html: body.html,
    });

    await logInboxActivity(admin, {
      event_type: "send_as",
      account_id: account.id,
      status: "ok",
      message: `Sent from ${account.email_address} to ${body.to}`,
      actor: auth.userId || null,
    });

    return jsonResponse({ success: true, from: account.email_address });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await logInboxActivity(admin, {
      event_type: "send_as",
      account_id: account.id,
      status: "error",
      message: `Send failed: ${message}`,
      actor: auth.userId || null,
    });
    return jsonResponse({ error: message }, 502);
  }
});
