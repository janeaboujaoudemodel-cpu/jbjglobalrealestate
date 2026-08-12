// inbox-send-reply — sends a reply (or reply-all) from the mailbox that received the mail.
import { requireInboxAdmin, inboxCors, jsonResponse } from "../_shared/inbox-auth.ts";
import { logInboxActivity } from "../_shared/inbox-activity.ts";
import { sendEmail, resolveAccount } from "../_shared/inbox-send.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: inboxCors });

  const auth = await requireInboxAdmin(req);
  if (auth.response) return auth.response;
  const admin = auth.admin;

  let body: {
    emailId?: string;
    html?: string;
    subject?: string;
    replyAll?: boolean;
    accountId?: string;
  } = {};
  try { body = await req.json(); } catch { /* noop */ }
  if (!body.emailId || !body.html) {
    return jsonResponse({ error: "emailId and html are required" }, 400);
  }

  const { data: email } = await admin
    .from("inbox_emails")
    .select("id, subject, from_email, cc_email, to_email, thread_id, provider, account_id")
    .eq("id", body.emailId)
    .maybeSingle();
  if (!email) return jsonResponse({ error: "Email not found" }, 404);

  const account = await resolveAccount(
    admin,
    body.accountId ?? email.account_id,
    email.provider as never,
  );
  if (!account) return jsonResponse({ error: "No connected mailbox available" }, 400);

  try {
    const subject = body.subject ?? `Re: ${email.subject ?? ""}`.trim();
    const cc = body.replyAll ? (email.cc_email ?? undefined) : undefined;

    await sendEmail({
      provider: account.provider,
      secretRef: account.secret_ref,
      from: `${account.display_name ?? account.email_address} <${account.email_address}>`,
      to: email.from_email,
      cc,
      subject,
      html: body.html,
      threadId: account.provider === "gmail" ? email.thread_id : null,
    });

    await admin.from("inbox_emails").update({
      is_responded: true,
      is_unread: false,
    }).eq("id", email.id);

    await logInboxActivity(admin, {
      event_type: "reply_sent",
      account_id: account.id,
      email_id: email.id,
      status: "ok",
      message: `Reply sent to ${email.from_email}`,
      detail: { replyAll: Boolean(body.replyAll) },
      actor: auth.userId || null,
    });

    return jsonResponse({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await logInboxActivity(admin, {
      event_type: "reply_sent",
      account_id: account.id,
      email_id: email.id,
      status: "error",
      message: `Reply failed: ${message}`,
      detail: { error: message },
      actor: auth.userId || null,
    });
    return jsonResponse({ error: message }, 502);
  }
});
