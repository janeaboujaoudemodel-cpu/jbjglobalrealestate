// inbox-sla-check — recomputes SLA state and raises alerts for breaches.
import { requireInboxAdmin, inboxCors, jsonResponse } from "../_shared/inbox-auth.ts";
import { logInboxActivity } from "../_shared/inbox-activity.ts";

const DEFAULTS: Record<string, number> = { critical: 1, high: 4, normal: 24, low: 72 };

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: inboxCors });

  const auth = await requireInboxAdmin(req);
  if (auth.response) return auth.response;
  const admin = auth.admin;

  const { data: rules } = await admin
    .from("inbox_sla_rules")
    .select("urgency, hours_to_reply, is_active")
    .eq("is_active", true);

  const hoursFor: Record<string, number> = { ...DEFAULTS };
  for (const rule of rules ?? []) {
    if (rule.urgency && rule.hours_to_reply) hoursFor[rule.urgency] = rule.hours_to_reply;
  }

  const { data: emails } = await admin
    .from("inbox_emails")
    .select("id, urgency, received_at, sla_state, subject, from_email, account_id")
    .eq("is_responded", false)
    .eq("is_ignored", false)
    .in("folder", ["inbox"])
    .limit(1000);

  let breached = 0;
  let atRisk = 0;

  for (const email of emails ?? []) {
    const limit = hoursFor[email.urgency ?? "normal"] ?? 24;
    const ageHours = (Date.now() - new Date(email.received_at).getTime()) / 3600000;
    const state = ageHours >= limit ? "breached" : ageHours >= limit * 0.75 ? "at_risk" : "on_track";
    if (state !== email.sla_state) {
      await admin.from("inbox_emails").update({
        sla_state: state,
        sla_due_at: new Date(new Date(email.received_at).getTime() + limit * 3600000).toISOString(),
      }).eq("id", email.id);
      if (state === "breached") {
        breached++;
        await admin.from("inbox_notification_events").insert({
          event_type: "sla_breach",
          title: "SLA breached",
          body: `${email.subject ?? "(no subject)"} — ${email.from_email ?? ""}`,
          email_id: email.id,
          account_id: email.account_id,
        });
      }
      if (state === "at_risk") atRisk++;
    }
  }

  await logInboxActivity(admin, {
    event_type: "sla_check", status: "ok",
    message: `SLA sweep: ${breached} newly breached, ${atRisk} at risk`,
    detail: { breached, atRisk, scanned: emails?.length ?? 0 },
    actor: auth.userId || null,
  });

  return jsonResponse({ success: true, breached, atRisk, scanned: emails?.length ?? 0 });
});
