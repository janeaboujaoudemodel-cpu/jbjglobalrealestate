// inbox-modify — labels, read state, star, ignore, category and division changes.
// Every state change that exists in the real mailbox is mirrored to the provider.
import { requireInboxAdmin, inboxCors, jsonResponse } from "../_shared/inbox-auth.ts";
import { logInboxActivity } from "../_shared/inbox-activity.ts";
import { mirrorAction, type MirrorAction } from "../_shared/inbox-mirror.ts";

interface ModifyBody {
  emailIds: string[];
  addLabels?: string[];
  removeLabels?: string[];
  isUnread?: boolean;
  isStarred?: boolean;
  isResponded?: boolean;
  isIgnored?: boolean;
  category?: string;
  division?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: inboxCors });

  const auth = await requireInboxAdmin(req);
  if (auth.response) return auth.response;
  const admin = auth.admin;

  let body: ModifyBody = { emailIds: [] };
  try { body = await req.json(); } catch { /* noop */ }
  if (!Array.isArray(body.emailIds) || body.emailIds.length === 0) {
    return jsonResponse({ error: "emailIds is required" }, 400);
  }
  if (body.emailIds.length > 200) {
    return jsonResponse({ error: "Maximum 200 emails per batch" }, 400);
  }

  const { data: emails } = await admin
    .from("inbox_emails")
    .select("id, gmail_id, provider, account_id, folder, labels, subject")
    .in("id", body.emailIds);

  const results: { id: string; mirrored: boolean; error?: string }[] = [];

  for (const email of emails ?? []) {
    const patch: Record<string, unknown> = {};

    if (body.addLabels?.length || body.removeLabels?.length) {
      const current = new Set<string>(email.labels ?? []);
      (body.addLabels ?? []).forEach((l) => current.add(l));
      (body.removeLabels ?? []).forEach((l) => current.delete(l));
      patch.labels = Array.from(current);
    }
    if (typeof body.isResponded === "boolean") patch.is_responded = body.isResponded;
    if (typeof body.isIgnored === "boolean") patch.is_ignored = body.isIgnored;
    if (body.category) patch.category = body.category;
    if (body.division) patch.division = body.division;

    if (Object.keys(patch).length) {
      await admin.from("inbox_emails").update(patch).eq("id", email.id);
    }

    const mirrors: MirrorAction[] = [];
    if (typeof body.isUnread === "boolean") mirrors.push(body.isUnread ? "unread" : "read");
    if (typeof body.isStarred === "boolean") mirrors.push(body.isStarred ? "star" : "unstar");

    let mirrored = true;
    let error: string | undefined;
    for (const action of mirrors) {
      const res = await mirrorAction(admin, email as never, action, auth.userId || null);
      if (!res.mirrored) { mirrored = false; error = res.error; }
    }
    results.push({ id: email.id, mirrored, error });
  }

  await logInboxActivity(admin, {
    event_type: "modify",
    status: "ok",
    message: `Updated ${results.length} email(s)`,
    detail: { ...body, emailIds: undefined, count: results.length },
    actor: auth.userId || null,
  });

  return jsonResponse({ success: true, results });
});
