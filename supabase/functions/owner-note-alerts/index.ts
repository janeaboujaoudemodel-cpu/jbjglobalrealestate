/**
 * owner-note-alerts — fires due note reminders for the owner.
 *
 * Notes stay OUT of the calendar by design (owner rule): a note reminder
 * raises an in-app bell alert and/or an email, never a calendar event.
 *
 * Actions:
 *   dispatch  — find every note whose alert time has passed, alert once,
 *               then advance repeating reminders to their next occurrence.
 *   snooze    — push a note's alert forward by N minutes.
 */
import { createClient } from "npm:@supabase/supabase-js@2";
import { requireOwnerAuth } from "../_shared/owner-auth-middleware.ts";
import { sendViaResend } from "../_shared/resendClient.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const FROM = "JBJ Global Real Estate <contact@jbj.ae>";
const APP_URL = "https://www.jbj.ae";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const esc = (s: unknown) =>
  String(s ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!)
  );

function admin() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );
}

/** Next occurrence of a repeating reminder, strictly after `from`. */
function nextOccurrence(current: Date, rule: string, from: Date): Date | null {
  if (rule === "none") return null;
  const next = new Date(current);
  let guard = 0;
  while (next <= from && guard++ < 1000) {
    switch (rule) {
      case "daily":
        next.setUTCDate(next.getUTCDate() + 1);
        break;
      case "weekdays":
        do {
          next.setUTCDate(next.getUTCDate() + 1);
        } while (next.getUTCDay() === 0 || next.getUTCDay() === 6);
        break;
      case "weekly":
        next.setUTCDate(next.getUTCDate() + 7);
        break;
      case "biweekly":
        next.setUTCDate(next.getUTCDate() + 14);
        break;
      case "monthly":
        next.setUTCMonth(next.getUTCMonth() + 1);
        break;
      case "yearly":
        next.setUTCFullYear(next.getUTCFullYear() + 1);
        break;
      default:
        return null;
    }
  }
  return guard >= 1000 ? null : next;
}

function emailHtml(note: any) {
  return `<!doctype html><html><body style="margin:0;background:#f6f4ef;font-family:Georgia,'Cormorant Garamond',serif">
  <div style="max-width:560px;margin:24px auto;background:#ffffff;border-radius:14px;overflow:hidden">
    <div style="background:linear-gradient(135deg,#064E3B 0%,#042c1c 55%,#000000 100%);padding:22px 26px;color:#ffffff">
      <div style="font-size:12px;letter-spacing:.18em;text-transform:uppercase;opacity:.8">JBJ Global Real Estate</div>
      <div style="font-size:22px;margin-top:6px">Note reminder</div>
    </div>
    <div style="padding:26px;color:#111111">
      <div style="font-size:19px;font-weight:600;margin-bottom:10px">${esc(note.title)}</div>
      <div style="font-size:15px;line-height:1.6;white-space:pre-wrap;color:#333333">${esc(note.content || "—")}</div>
      <div style="margin-top:18px;font-size:13px;color:#555555">
        Due: ${esc(new Date(note.reminder_at).toUTCString())}${
          note.repeat_rule !== "none" ? ` · repeats ${esc(note.repeat_rule)}` : ""
        }
      </div>
      <a href="${APP_URL}/owner/crm/notes" style="display:inline-block;margin-top:22px;background:#064E3B;color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:999px;font-size:14px">Open notes</a>
    </div>
  </div></body></html>`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const auth = await requireOwnerAuth(req, corsHeaders);
  if (auth.response) return auth.response;
  const ownerId = auth.userId;
  const ownerEmail = auth.email;
  const db = admin();

  let payload: any = {};
  try {
    payload = await req.json();
  } catch {
    payload = {};
  }
  const action = typeof payload.action === "string" ? payload.action : "dispatch";

  try {
    if (action === "snooze") {
      const noteId = String(payload.note_id ?? "");
      const minutes = Math.min(Math.max(Number(payload.minutes ?? 10), 1), 10080);
      if (!/^[0-9a-f-]{36}$/i.test(noteId)) return json({ error: "note_id required" }, 400);
      const { data, error } = await db
        .from("owner_notes")
        .update({ snoozed_until: new Date(Date.now() + minutes * 60000).toISOString() })
        .eq("id", noteId)
        .eq("owner_id", ownerId)
        .select("id, next_alert_at")
        .maybeSingle();
      if (error) throw error;
      return json({ ok: true, note: data });
    }

    if (action !== "dispatch") return json({ error: `unknown action: ${action}` }, 400);

    const now = new Date();
    const { data: due, error } = await db
      .from("owner_notes")
      .select("*")
      .eq("owner_id", ownerId)
      .eq("is_done", false)
      .eq("is_archived", false)
      .not("next_alert_at", "is", null)
      .lte("next_alert_at", now.toISOString())
      .order("next_alert_at", { ascending: true })
      .limit(50);
    if (error) throw error;

    const fired: any[] = [];

    for (const note of due ?? []) {
      const firedFor = note.snoozed_until ?? note.reminder_at;
      const channels: string[] = Array.isArray(note.alert_channels) ? note.alert_channels : ["in_app"];

      // idempotency guard — never alert twice for the same occurrence
      const { error: logErr } = await db.from("owner_note_alert_log").insert({
        note_id: note.id,
        owner_id: ownerId,
        fired_for: firedFor,
        channels,
      });
      if (logErr) {
        if (logErr.code !== "23505") console.error("[owner-note-alerts] log error:", logErr);
        else continue; // already fired
      }

      if (channels.includes("in_app")) {
        await db.from("notifications").insert({
          user_id: ownerId,
          title: `Reminder: ${note.title}`,
          body: (note.content || "").slice(0, 400),
          notification_type: "note_reminder",
          action_url: "/owner/crm/notes",
          metadata: { note_id: note.id, repeat_rule: note.repeat_rule, fired_for: firedFor },
        });
      }

      if (channels.includes("email") && ownerEmail) {
        const res = await sendViaResend({
          from: FROM,
          to: ownerEmail,
          subject: `Reminder · ${note.title}`,
          html: emailHtml(note),
        });
        if (!res.ok) console.error("[owner-note-alerts] email failed:", res.error);
      }

      // advance or retire the reminder
      const base = new Date(note.reminder_at);
      const next = nextOccurrence(base, note.repeat_rule, now);
      const withinLimit =
        next && (!note.repeat_until || next <= new Date(note.repeat_until)) ? next : null;

      // Repeating -> move to the next occurrence. One-off -> clear the reminder
      // so the trigger blanks next_alert_at and it never fires again.
      await db
        .from("owner_notes")
        .update({
          snoozed_until: null,
          last_alerted_at: now.toISOString(),
          alert_count: (note.alert_count ?? 0) + 1,
          reminder_at: withinLimit ? withinLimit.toISOString() : null,
        })
        .eq("id", note.id)
        .eq("owner_id", ownerId);

      fired.push({ id: note.id, title: note.title, channels, next: withinLimit?.toISOString() ?? null });
    }

    return json({ ok: true, fired_count: fired.length, fired });
  } catch (e) {
    console.error("[owner-note-alerts] failure:", e);
    return json({ error: String((e as Error).message).slice(0, 800) }, 500);
  }
});
