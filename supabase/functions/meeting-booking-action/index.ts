/**
 * meeting-booking-action  (PUBLIC, verify_jwt = false)
 *
 * Used by the owner email Approve / Decline / Reschedule buttons AND by the
 * /owner/meetings dashboard. The owner_action_token is the only credential —
 * once it's consumed for a non-reschedule action, it's rotated so the same
 * link can't be re-used.
 *
 * GET  ?token=&action=approve|decline|rescheduled (link from email — returns HTML page)
 * POST { token, action, ownerResponseMessage?, rescheduleNewIso? } (used by dashboard)
 */
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { renderBrandedEmail, statusLabel } from "../_shared/booking-email.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") || "";
const FROM_ADDRESS = "JBJ GLOBAL REAL ESTATE <bookings@jbj.ae>";
const REPLY_TO = "contact@jbj.ae";

type Action = "approve" | "decline" | "rescheduled";

function newToken(): string {
  return crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "");
}

function fmtDubai(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Dubai", weekday: "long", day: "2-digit",
    month: "long", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: false,
  }).format(new Date(iso));
}

async function sendEmail(to: string, subject: string, html: string, icsContent?: string) {
  if (!RESEND_API_KEY) { console.warn("RESEND_API_KEY missing — skipping email"); return false; }
  const body: Record<string, unknown> = { from: FROM_ADDRESS, to: [to], reply_to: REPLY_TO, subject, html };
  if (icsContent) {
    body.attachments = [{ filename: "meeting.ics", content: btoa(unescape(encodeURIComponent(icsContent))) }];
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) { console.error("Resend failed", res.status, await res.text()); return false; }
  return true;
}

function buildIcs(b: any, summary: string): string {
  const start = new Date(b.booked_for_at);
  const end = new Date(start.getTime() + (b.duration_min || 60) * 60 * 1000);
  const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const loc = b.location_link || b.location_label ||
    (b.location_type === "online" ? `Online · ${b.online_platform === "zoom" ? "Zoom" : "Google Meet"}` : "JBJ — Dubai office");
  return [
    "BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//JBJ//Booking//EN","METHOD:REQUEST","BEGIN:VEVENT",
    `UID:${start.getTime()}-${b.visitor_email}@jbj.ae`,
    `DTSTAMP:${fmt(new Date())}`,
    `DTSTART:${fmt(start)}`,
    `DTEND:${fmt(end)}`,
    `SUMMARY:${summary}`,
    `LOCATION:${loc}`,
    "ORGANIZER;CN=Jane Bou Jaoude:mailto:contact@jbj.ae",
    `ATTENDEE;CN=${b.visitor_name};RSVP=TRUE:mailto:${b.visitor_email}`,
    "END:VEVENT","END:VCALENDAR",
  ].join("\r\n");
}

function visitorEmailFor(action: Action, booking: any, customMessage: string | null, cancelUrl: string | null): string {
  const status = action === "approve" ? "APPROVED" : action === "decline" ? "DECLINED" : "RESCHEDULED";
  const dubai = fmtDubai(action === "rescheduled" && booking.reschedule_proposed_for
    ? booking.reschedule_proposed_for
    : booking.booked_for_at);

  const title =
    action === "approve" ? "Your meeting is confirmed."
    : action === "decline" ? "Update on your meeting request."
    : "A new time proposal for your meeting.";

  const intro =
    action === "approve"
      ? `Jane is delighted to confirm your meeting on ${dubai} (Dubai time). The details below are now final — calendar invitation is attached.`
      : action === "decline"
      ? `Thank you for your interest. Unfortunately Jane is unable to meet on ${dubai}. Please reply to this email if you would like to suggest another time and our team will assist.`
      : `Jane would like to propose a new time: ${dubai} (Dubai time). If this works, simply reply to this email to confirm.`;

  const locationValue = booking.location_link
    ? `${booking.location_label || "Meeting link"} — ${booking.location_link}`
    : booking.location_type === "online"
      ? `Online · ${booking.online_platform === "zoom" ? "Zoom" : "Google Meet"}`
      : "Dubai office";

  return renderBrandedEmail({
    title,
    status: status as any,
    preheader: customMessage ?? title,
    greeting: `Dear ${booking.visitor_name},`,
    intro,
    ownerNotes: customMessage
      ? `<strong style="color:#B89555;font-size:11px;letter-spacing:.16em;text-transform:uppercase;">Personal note from Jane</strong><br>${customMessage.replace(/\n/g, "<br>")}`
      : undefined,
    detailRows: [
      { label: "Topic", value: booking.meeting_topic ?? "—" },
      { label: "When", value: dubai + " (Dubai time)" },
      { label: "Duration", value: `${booking.duration_min} min` },
      { label: "Location", value: locationValue },
    ],
    ctaText: action === "approve" && booking.location_link ? (booking.location_label || "Open meeting / get directions") : undefined,
    ctaUrl:  action === "approve" ? booking.location_link ?? undefined : undefined,
    altCtaText: action === "approve" && cancelUrl ? "Cancel meeting" : undefined,
    altCtaUrl:  action === "approve" ? cancelUrl ?? undefined : undefined,
    closing:
      action === "approve"
        ? "You'll receive reminders 24 hours and 30 minutes before the meeting. Cancellations are accepted up to 24 hours before morning meetings or 6 hours before afternoon meetings — please write to contact@jbj.ae if you need anything sooner."
        : action === "rescheduled"
        ? "If the proposed time doesn't work, just reply and we'll find another."
        : "We hope to welcome you soon.",
  });
}

function htmlReceipt(action: Action, ok: boolean): string {
  const word = action === "approve" ? "approved" : action === "decline" ? "declined" : "marked for reschedule";
  return `<!doctype html><html><body style="font-family:Inter,Arial,sans-serif;background:#FDFBF7;color:#1A1A1A;padding:60px 20px;text-align:center;">
    <div style="max-width:480px;margin:auto;background:#fff;border:1px solid #B8955533;border-radius:16px;padding:40px;">
      <div style="font-size:11px;letter-spacing:.3em;color:#B89555;">JBJ GLOBAL REAL ESTATE</div>
      <h1 style="margin:18px 0;font-size:22px;">${ok ? `Booking ${word}.` : "This link can no longer be used."}</h1>
      <p style="color:#1A1A1A99;font-size:13px;">${ok ? "The visitor has been notified by email." : "The booking may have already been actioned. Open the Meetings hub to see the current status."}</p>
      <a href="https://www.jbj.ae/owner/meetings" style="display:inline-block;margin-top:18px;padding:10px 18px;background:#1A1A1A;color:#fff;text-decoration:none;border-radius:8px;font-size:13px;border:1px solid #B89555;">Open Meetings hub</a>
    </div>
  </body></html>`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
  const url = new URL(req.url);

  // Parse input
  let token: string | null = null;
  let action: Action | null = null;
  let ownerResponseMessage: string | null = null;
  let rescheduleNewIso: string | null = null;
  const wantsHtml = req.method === "GET";

  let locationLink: string | null = null;
  let locationLabel: string | null = null;

  if (req.method === "GET") {
    token = url.searchParams.get("token");
    action = url.searchParams.get("action") as Action | null;
    rescheduleNewIso = url.searchParams.get("new");
  } else {
    try {
      const body = await req.json();
      token = body.token ?? null;
      action = body.action ?? null;
      ownerResponseMessage = body.ownerResponseMessage?.trim() || null;
      rescheduleNewIso = body.rescheduleNewIso ?? null;
      locationLink = body.locationLink?.trim() || null;
      locationLabel = body.locationLabel?.trim() || null;
    } catch { /* ignore */ }
  }

  if (!token || !["approve", "decline", "rescheduled"].includes(action ?? "")) {
    return wantsHtml
      ? new Response(htmlReceipt("approve", false), { status: 400, headers: { ...corsHeaders, "Content-Type": "text/html" } })
      : new Response(JSON.stringify({ error: "Missing token or action" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  const { data: booking, error: fetchErr } = await admin
    .from("meeting_bookings")
    .select("*")
    .eq("owner_action_token", token)
    .maybeSingle();

  if (fetchErr || !booking) {
    return wantsHtml
      ? new Response(htmlReceipt(action!, false), { status: 404, headers: { ...corsHeaders, "Content-Type": "text/html" } })
      : new Response(JSON.stringify({ error: "Invalid or already-used token" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  const newStatus: "approved" | "declined" | "rescheduled" =
    action === "approve" ? "approved" : action === "decline" ? "declined" : "rescheduled";

  const update: Record<string, unknown> = {
    status: newStatus,
    owner_response_message: ownerResponseMessage,
    owner_responded_at: new Date().toISOString(),
    owner_action_token: newToken(), // rotate so the link is one-shot
  };
  if (newStatus === "rescheduled") {
    update.reschedule_proposed_at = new Date().toISOString();
    if (rescheduleNewIso) update.reschedule_proposed_for = rescheduleNewIso;
  }
  // On Approve, persist the location link / label the owner pasted in the dialog.
  if (newStatus === "approved") {
    if (locationLink)  update.location_link  = locationLink;
    if (locationLabel) update.location_label = locationLabel;
    // Ensure cancel_token exists for the upcoming confirmation email
    if (!booking.cancel_token) update.cancel_token = newToken();
  }

  const { error: upErr } = await admin
    .from("meeting_bookings")
    .update(update)
    .eq("id", booking.id);

  if (upErr) {
    console.error("update failed", upErr);
    return new Response(JSON.stringify({ error: upErr.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const merged = {
    ...booking,
    ...update,
    location_link: locationLink ?? booking.location_link,
    location_label: locationLabel ?? booking.location_label,
    cancel_token:  booking.cancel_token ?? (update.cancel_token as string | undefined) ?? null,
  };

  const cancelUrl = merged.cancel_token
    ? `${SUPABASE_URL}/functions/v1/cancel-meeting?token=${merged.cancel_token}`
    : null;

  // Notify visitor (with .ics on approve)
  const subject =
    newStatus === "approved" ? "Your meeting is confirmed — JBJ GLOBAL REAL ESTATE"
    : newStatus === "declined" ? "Update on your meeting request — JBJ GLOBAL REAL ESTATE"
    : "New time proposal for your meeting — JBJ GLOBAL REAL ESTATE";

  const ics = newStatus === "approved" ? buildIcs(merged, "JBJ — Meeting with Jane Bou Jaoude") : undefined;
  const emailSent = await sendEmail(
    booking.visitor_email,
    subject,
    visitorEmailFor(action!, merged, ownerResponseMessage, cancelUrl),
    ics,
  );

  return wantsHtml
    ? new Response(htmlReceipt(action!, true), { status: 200, headers: { ...corsHeaders, "Content-Type": "text/html" } })
    : new Response(
        JSON.stringify({ ok: true, status: newStatus, statusLabel: statusLabel(newStatus), emailSent }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
});
