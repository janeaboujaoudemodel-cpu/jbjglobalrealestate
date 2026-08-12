// inbox-auto-acknowledge — sends an instant acknowledgement to new inbound mail when enabled.
import { requireInboxAdmin, inboxCors, jsonResponse } from "../_shared/inbox-auth.ts";
import { logInboxActivity } from "../_shared/inbox-activity.ts";
import { sendEmail, resolveAccount } from "../_shared/inbox-send.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: inboxCors });

  const auth = await requireInboxAdmin(req);
  if (auth.response) return auth.response;
  const admin = auth.admin;

  const { data: rules } = await admin
    .from("inbox_auto_ack")
    .select("id, account_id, match_type, pattern, subject_template, body_template, enabled, sent_count")
    .eq("enabled", true);

  if (!rules?.length) return jsonResponse({ success: true, sent: 0, reason: "No active auto-ack rules" });

  let sent = 0;
  for (const rule of rules) {
    const query = admin
      .from("inbox_emails")
      .select("id, subject, from_email, account_id, category, received_at")
      .eq("folder", "inbox")
      .eq("auto_acked", false)
      .eq("is_ignored", false)
      .order("received_at", { ascending: false })
      .limit(25);
    if (rule.account_id) query.eq("account_id", rule.account_id);
    if (rule.match_type === "category" && rule.pattern) query.eq("category", rule.pattern);
    if (rule.match_type === "sender" && rule.pattern) query.ilike("from_email", `%${rule.pattern}%`);

    const { data: emails } = await query;
    for (const email of emails ?? []) {
      const account = await resolveAccount(admin, email.account_id);
      if (!account) continue;
      try {
        await sendEmail({
          provider: account.provider,
          secretRef: account.secret_ref,
          from: `${account.display_name ?? account.email_address} <${account.email_address}>`,
          to: email.from_email,
          subject: rule.subject_template ?? `Re: ${email.subject ?? ""}`.trim(),
          html: rule.body_template ?? "<p>Thank you for contacting JBJ Global Real Estate. Our team will respond shortly.</p>",
        });
        await admin.from("inbox_emails").update({
          auto_acked: true,
          auto_acked_at: new Date().toISOString(),
        }).eq("id", email.id);
        await admin.from("inbox_auto_ack")
          .update({ sent_count: (rule.sent_count ?? 0) + 1 })
          .eq("id", rule.id);
        sent++;
      } catch (err) {
        await logInboxActivity(admin, {
          event_type: "auto_ack", email_id: email.id, account_id: account.id, status: "error",
          message: `Auto-acknowledgement failed: ${err instanceof Error ? err.message : String(err)}`,
        });
      }
    }
  }

  await logInboxActivity(admin, {
    event_type: "auto_ack", status: "ok",
    message: `Auto-acknowledged ${sent} email(s)`, detail: { sent },
    actor: auth.userId || null,
  });

  return jsonResponse({ success: true, sent });
});
