/**
 * process-meeting-reminders
 *
 * Runs on a cron schedule. For each upcoming owner_calendar_events row with
 * a linked meeting booking, fires reminders at 24h and 30min before start to
 * BOTH the visitor and the owner inbox. Tracks already-sent offsets in
 * metadata.sent_reminders to avoid duplicates.
 *
 * Cadence is locked to [1440, 30] (24h + 30m). The previous 1-hour slot is
 * intentionally removed.
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { renderBrandedEmail, SITE_URL, htmlEscape } from "../_shared/booking-email.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") || "";

const OWNER_EMAIL = "janeaboujaoudenails@gmail.com";
const FROM_ADDRESS = "JBJ GLOBAL REAL ESTATE <bookings@jbj.ae>";
const REPLY_TO = "contact@jbj.ae";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface EventMeta {
  booking_id?: string;
  portal?: string;
  portal_type?: string;
  attendee_name?: string;
  attendee_phone?: string;
  attendee_email?: string;
  owner_email?: string;
  agenda?: string;
  reminders?: number[];
  sent_reminders?: number[];
}

function fmtDubai(iso: string) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Dubai", weekday: "long", year: "numeric", month: "long",
    day: "numeric", hour: "2-digit", minute: "2-digit", hour12: false,
  }).format(new Date(iso));
}

function humanOffset(min: number) {
  if (min >= 1440) return `${Math.round(min / 1440)} day${min >= 2880 ? "s" : ""}`;
  if (min >= 60) return `${Math.round(min / 60)} hour${min >= 120 ? "s" : ""}`;
  return `${min} minutes`;
}

async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  if (!RESEND_API_KEY) { console.warn("RESEND_API_KEY missing"); return false; }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: FROM_ADDRESS, to: [to], reply_to: REPLY_TO, subject, html }),
  });
  if (!res.ok) { console.error("Resend failed", res.status, await res.text()); return false; }
  return true;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
  const now = Date.now();
  const horizon = new Date(now + 48 * 60 * 60 * 1000).toISOString();
  const fromTs = new Date(now - 5 * 60 * 1000).toISOString();

  const { data: events, error } = await admin
    .from("owner_calendar_events")
    .select("id,title,description,location,start_at,end_at,metadata")
    .gte("start_at", fromTs)
    .lte("start_at", horizon);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let sent = 0;
  for (const ev of events || []) {
    const meta = (ev.metadata || {}) as EventMeta;
    const attendee = (meta.attendee_email || "").trim();
    if (!attendee) continue;
    // Locked cadence: 24h + 30m.
    const reminders = [1440, 30];
    const already = new Set(meta.sent_reminders || []);
    const startMs = new Date(ev.start_at).getTime();
    const minutesUntil = (startMs - now) / 60000;

    const dueOffsets = reminders.filter(
      (off) => !already.has(off) && minutesUntil <= off && minutesUntil > -2,
    );
    if (dueOffsets.length === 0) continue;
    if (!RESEND_API_KEY) continue;

    const offset = Math.max(...dueOffsets);
    const when = fmtDubai(ev.start_at);
    const isInvestorPortalEvent = meta.portal === "investor" || String(meta.portal_type || "").includes("investor");

    // Pull the booking for location_link, status, cancel_token, etc.
    let locationLink: string | null = null;
    let locationLabel: string | null = null;
    let cancelToken: string | null = null;
    if (meta.booking_id) {
      const { data: bk } = await admin
        .from("meeting_bookings")
        .select("location_link, location_label, cancel_token, status")
        .eq("id", meta.booking_id).maybeSingle();
      if (bk) {
        locationLink = bk.location_link;
        locationLabel = bk.location_label;
        cancelToken = bk.cancel_token;
      }
    }
    const cancelUrl = cancelToken ? `${SUPABASE_URL}/functions/v1/cancel-meeting?token=${cancelToken}` : null;

    // Visitor reminder
    const visitorHtml = renderBrandedEmail({
      title: `Meeting reminder · in ${humanOffset(offset)}`,
      status: "REMINDER",
      preheader: `${ev.title} — ${when} (Dubai)`,
      greeting: `Dear ${meta.attendee_name || "guest"},`,
      intro: isInvestorPortalEvent
        ? `A friendly reminder about your upcoming JBJ calendar event in ${humanOffset(offset)}.`
        : `A friendly reminder about your meeting with Jane Bou Jaoude in ${humanOffset(offset)}.`,
      detailRows: [
        { label: "Subject",  value: ev.title },
        { label: "When",     value: `${when} (Dubai time)` },
        ...(ev.location ? [{ label: "Location", value: ev.location }] : []),
        ...(meta.agenda ? [{ label: "Agenda", value: meta.agenda }] : []),
      ],
      ctaText: locationLink ? (locationLabel || "Open meeting link") : undefined,
      ctaUrl:  locationLink ?? undefined,
      altCtaText: cancelUrl ? "Cancel meeting" : undefined,
      altCtaUrl:  cancelUrl ?? undefined,
      closing: "Looking forward to it.",
    });

    const ownerHtml = renderBrandedEmail({
      title: `Reminder · ${meta.attendee_name} in ${humanOffset(offset)}`,
      status: "REMINDER",
      preheader: `${ev.title} — ${when} (Dubai)`,
      greeting: isInvestorPortalEvent ? `Dear ${meta.attendee_name || "investor"},` : "Jane,",
      intro: isInvestorPortalEvent
        ? `Reminder for your upcoming JBJ calendar event.`
        : `Reminder for your upcoming meeting with ${meta.attendee_name} (${meta.attendee_email}).`,
      detailRows: [
        { label: "Visitor",  value: meta.attendee_name || "—" },
        { label: "Email",    value: meta.attendee_email || "—" },
        { label: "Phone",    value: meta.attendee_phone || "—" },
        { label: "When",     value: `${when} (Dubai time)` },
        ...(ev.location ? [{ label: "Location", value: ev.location }] : []),
        ...(meta.agenda ? [{ label: "Agenda", value: meta.agenda }] : []),
      ],
      ctaText: locationLink ? (locationLabel || "Open meeting link") : undefined,
      ctaUrl:  locationLink ?? undefined,
      closing: isInvestorPortalEvent
        ? `Manage this booking in your Investor Portal calendar at ${SITE_URL}/investor-dashboard?tab=calendar.`
        : `Manage this booking at ${SITE_URL}/owner/meetings.`,
    });

    const subjectVisitor = `Reminder · ${ev.title} in ${humanOffset(offset)}`;
    const subjectOwner   = `Reminder · ${htmlEscape(meta.attendee_name || "guest")} in ${humanOffset(offset)}`;

    const ownerRecipient = meta.owner_email || OWNER_EMAIL;
    const ownerSameAsAttendee = ownerRecipient.trim().toLowerCase() === attendee.trim().toLowerCase();
    const [v, o] = await Promise.all([
      sendEmail(attendee, subjectVisitor, visitorHtml),
      ownerSameAsAttendee ? Promise.resolve(false) : sendEmail(ownerRecipient, subjectOwner, ownerHtml),
    ]);
    if (v || o) sent++;

    const newSent = [...already, ...dueOffsets];
    await admin
      .from("owner_calendar_events")
      .update({ metadata: { ...meta, sent_reminders: newSent } })
      .eq("id", ev.id);
  }

  return new Response(JSON.stringify({ ok: true, processed: events?.length || 0, sent }), {
    status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
