// inbox-daily-report — SLA + volume digest for the admin inbox.
import { requireInboxAdmin, inboxCors, jsonResponse } from "../_shared/inbox-auth.ts";
import { logInboxActivity } from "../_shared/inbox-activity.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: inboxCors });

  const auth = await requireInboxAdmin(req);
  if (auth.response) return auth.response;
  const admin = auth.admin;

  const since = new Date(Date.now() - 86400000).toISOString();

  const [{ count: received }, { count: unread }, { count: awaiting }, { count: breached }, accounts] =
    await Promise.all([
      admin.from("inbox_emails").select("id", { count: "exact", head: true })
        .gte("received_at", since).eq("folder", "inbox"),
      admin.from("inbox_emails").select("id", { count: "exact", head: true })
        .eq("is_unread", true).eq("folder", "inbox"),
      admin.from("inbox_emails").select("id", { count: "exact", head: true })
        .eq("requires_reply", true).eq("is_responded", false).eq("folder", "inbox"),
      admin.from("inbox_emails").select("id", { count: "exact", head: true })
        .eq("sla_state", "breached").eq("is_responded", false),
      admin.from("inbox_accounts")
        .select("email_address, provider, status, unread_count, last_synced_at"),
    ]);

  const report = {
    generated_at: new Date().toISOString(),
    window: "last 24 hours",
    received: received ?? 0,
    unread: unread ?? 0,
    awaiting_reply: awaiting ?? 0,
    sla_breached: breached ?? 0,
    accounts: accounts.data ?? [],
  };

  await logInboxActivity(admin, {
    event_type: "daily_report", status: "ok",
    message: `Daily digest: ${report.received} received, ${report.awaiting_reply} awaiting reply, ${report.sla_breached} SLA breached`,
    detail: report, actor: auth.userId || null,
  });

  await admin.from("inbox_notification_events").insert({
    event_type: "daily_report",
    title: "Inbox daily digest",
    body: `${report.received} received · ${report.unread} unread · ${report.sla_breached} SLA breached`,
    payload: report,
  });

  return jsonResponse({ success: true, report });
});
