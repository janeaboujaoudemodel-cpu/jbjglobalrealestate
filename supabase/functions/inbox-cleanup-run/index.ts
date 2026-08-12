// inbox-cleanup-run — applies retention/cleanup rules (archive or trash old, low-value mail).
import { requireInboxAdmin, inboxCors, jsonResponse } from "../_shared/inbox-auth.ts";
import { logInboxActivity } from "../_shared/inbox-activity.ts";
import { mirrorAction, type MirrorAction } from "../_shared/inbox-mirror.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: inboxCors });

  const auth = await requireInboxAdmin(req);
  if (auth.response) return auth.response;
  const admin = auth.admin;

  let body: { dryRun?: boolean; ruleId?: string } = {};
  try { body = await req.json(); } catch { /* noop */ }
  const dryRun = body.dryRun ?? false;

  const rulesQuery = admin
    .from("inbox_cleanup_rules")
    .select("id, name, action, older_than_days, match_type, pattern, paused")
    .eq("paused", false);
  if (body.ruleId) rulesQuery.eq("id", body.ruleId);
  const { data: rules } = await rulesQuery;

  const summary: { rule: string; matched: number; applied: number }[] = [];

  for (const rule of rules ?? []) {
    const cutoff = new Date(Date.now() - (rule.older_than_days ?? 90) * 86400000).toISOString();
    const query = admin
      .from("inbox_emails")
      .select("id, gmail_id, provider, account_id, folder, subject")
      .lt("received_at", cutoff)
      .in("folder", ["inbox", "spam"])
      .limit(200);
    if (rule.match_type === "category" && rule.pattern) query.eq("category", rule.pattern);
    if (rule.match_type === "sender" && rule.pattern) query.ilike("from_email", `%${rule.pattern}%`);
    if (rule.match_type === "subject" && rule.pattern) query.ilike("subject", `%${rule.pattern}%`);

    const { data: emails } = await query;
    let applied = 0;

    if (!dryRun) {
      const action = (rule.action === "trash" ? "trash" : "archive") as MirrorAction;
      for (const email of emails ?? []) {
        const res = await mirrorAction(admin, email as never, action, auth.userId || null);
        if (res.mirrored) applied++;
      }
    }

    if (!dryRun) {
      await admin.from("inbox_cleanup_rules").update({
        last_run_at: new Date().toISOString(),
        affected_count: applied,
      }).eq("id", rule.id);
    }

    summary.push({ rule: rule.name ?? rule.id, matched: emails?.length ?? 0, applied });
  }

  await logInboxActivity(admin, {
    event_type: "cleanup_run", status: "ok",
    message: dryRun ? "Cleanup preview generated" : "Cleanup rules applied",
    detail: { dryRun, summary }, actor: auth.userId || null,
  });

  return jsonResponse({ success: true, dryRun, summary });
});
