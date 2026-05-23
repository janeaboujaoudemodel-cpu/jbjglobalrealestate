/**
 * submit-meeting-booking  (PUBLIC, verify_jwt = false)
 *
 * Single entry point used by the /book landing page.
 *  1. Validates payload
 *  2. Inserts into public.meeting_bookings (slot trigger enforces Tue–Fri 11–17 Dubai)
 *  3. Creates the matching public.owner_calendar_events row so the existing
 *     `process-meeting-reminders` cron sends 24h / 1h / 15m reminders to the visitor
 *  4. Captures a CRM lead via the existing `capture-lead` function
 *  5. Sends a confirmation email to the visitor + a notification email to the owner
 */
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") || "";

// Owner identity (resolved once)
const OWNER_USER_ID = "72ca2405-b4ca-48df-9b47-623ee260a3cc";
const OWNER_EMAIL = "janeaboujaoudenails@gmail.com";
const FROM_ADDRESS = "JBJ GLOBAL REAL ESTATE <bookings@jbj.ae>";
const REPLY_TO = "janeaboujaoudenails@gmail.com";

const BookingSchema = z.object({
  fullName:   z.string().trim().min(2).max(120),
  email:      z.string().trim().email().max(255),
  phone:      z.string().trim().min(6).max(40),
  nationality:z.string().trim().min(2).max(80),
  language:   z.string().trim().min(2).max(40),
  company:    z.string().trim().min(1).max(160),
  bookedForAt:z.string().min(10), // ISO with offset, e.g. 2026-05-26T11:00:00+04:00
  durationMin:z.number().int().refine((n) => [30, 45, 60, 90].includes(n)),
  locationType: z.enum(["office", "online"]),
  onlinePlatform: z.enum(["zoom", "google_meet"]).optional().nullable(),
  notes:        z.string().trim().max(2000).optional().nullable(),
  websiteUrl:   z.string().trim().url().max(400).optional().nullable().or(z.literal("")),
  socialLinks:  z.array(z.string().trim().url().max(400)).max(6).optional(),
  attachmentUrl:  z.string().trim().url().max(800).optional().nullable(),
  attachmentName: z.string().trim().max(255).optional().nullable(),
  refToken:     z.string().trim().max(120).optional().nullable(),
  source:       z.enum(["public_landing", "branded_email"]).optional(),
});

type Booking = z.infer<typeof BookingSchema>;

function htmlEscape(s: string) {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" } as Record<string, string>)[c]
  );
}

function formatDubai(iso: string) {
  const d = new Date(iso);
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Dubai",
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d);
}

function buildIcs(b: Booking, summary: string) {
  const start = new Date(b.bookedForAt);
  const end = new Date(start.getTime() + b.durationMin * 60 * 1000);
  const fmt = (d: Date) =>
    d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const uid = `${start.getTime()}-${b.email}@jbj.ae`;
  const loc =
    b.locationType === "online"
      ? `Online (${b.onlinePlatform === "zoom" ? "Zoom" : "Google Meet"} — link follows)`
      : "JBJ GLOBAL REAL ESTATE — Dubai office";
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//JBJ GLOBAL REAL ESTATE//Booking//EN",
    "METHOD:REQUEST",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${fmt(new Date())}`,
    `DTSTART:${fmt(start)}`,
    `DTEND:${fmt(end)}`,
    `SUMMARY:${summary}`,
    `LOCATION:${loc}`,
    `ORGANIZER;CN=Jane Bou Jaoude:mailto:${OWNER_EMAIL}`,
    `ATTENDEE;CN=${b.fullName};RSVP=TRUE:mailto:${b.email}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

async function sendEmail(to: string, subject: string, html: string, ics?: string) {
  if (!RESEND_API_KEY) {
    console.warn("RESEND_API_KEY missing — email skipped:", to, subject);
    return false;
  }
  const body: Record<string, unknown> = {
    from: FROM_ADDRESS,
    to: [to],
    reply_to: REPLY_TO,
    subject,
    html,
  };
  if (ics) {
    body.attachments = [
      {
        filename: "meeting.ics",
        content: btoa(unescape(encodeURIComponent(ics))),
      },
    ];
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const t = await res.text();
    console.error("Resend send failed", res.status, t);
    return false;
  }
  return true;
}

function visitorHtml(b: Booking, whenLocal: string) {
  const locationLine =
    b.locationType === "online"
      ? `Online — ${b.onlinePlatform === "zoom" ? "Zoom" : "Google Meet"} (link will be shared in the final confirmation).`
      : `In person at our Dubai office. Address details will be shared in the final confirmation.`;
  return `
  <div style="font-family:Inter,Arial,sans-serif;background:#ffffff;color:#1A1A1A;padding:32px;max-width:560px;margin:auto;">
    <p style="text-transform:uppercase;letter-spacing:.2em;font-size:11px;color:#B89555;margin:0 0 12px;">JBJ GLOBAL REAL ESTATE</p>
    <h1 style="font-size:22px;margin:0 0 16px;">Your meeting request is in.</h1>
    <p style="line-height:1.6;color:#1A1A1A;">Dear ${htmlEscape(b.fullName)},</p>
    <p style="line-height:1.6;color:#1A1A1A;">
      Thank you for requesting a private consultation with Jane Bou Jaoude.
      We have received your request and Jane will personally confirm the details shortly.
    </p>
    <div style="background:#F7F2EA;border:1px solid #B89555;border-radius:12px;padding:16px 18px;margin:20px 0;">
      <p style="margin:0 0 6px;font-size:13px;color:#1A1A1A;"><strong>When:</strong> ${htmlEscape(whenLocal)} (Dubai time)</p>
      <p style="margin:0 0 6px;font-size:13px;color:#1A1A1A;"><strong>Duration:</strong> ${b.durationMin} minutes</p>
      <p style="margin:0;font-size:13px;color:#1A1A1A;"><strong>Where:</strong> ${htmlEscape(locationLine)}</p>
    </div>
    <p style="line-height:1.6;color:#1A1A1A;">
      You will receive reminder emails 24 hours, 1 hour, and 15 minutes before the meeting.
      If you need to reschedule, simply reply to this email.
    </p>
    <p style="line-height:1.6;color:#1A1A1A;margin-top:24px;">
      Warm regards,<br/>
      <strong>The JBJ GLOBAL REAL ESTATE Team</strong>
    </p>
  </div>`;
}

function ownerHtml(b: Booking, whenLocal: string, bookingId: string) {
  const optional: string[] = [];
  if (b.websiteUrl) optional.push(`<li><strong>Website:</strong> <a href="${htmlEscape(b.websiteUrl)}">${htmlEscape(b.websiteUrl)}</a></li>`);
  if (b.socialLinks && b.socialLinks.length) {
    optional.push(
      `<li><strong>Social:</strong> ${b.socialLinks
        .map((l) => `<a href="${htmlEscape(l)}">${htmlEscape(l)}</a>`)
        .join(" · ")}</li>`,
    );
  }
  if (b.attachmentUrl) optional.push(`<li><strong>Company profile:</strong> <a href="${htmlEscape(b.attachmentUrl)}">${htmlEscape(b.attachmentName ?? "Download")}</a></li>`);
  return `
  <div style="font-family:Inter,Arial,sans-serif;background:#ffffff;color:#1A1A1A;padding:24px;max-width:620px;margin:auto;">
    <p style="text-transform:uppercase;letter-spacing:.2em;font-size:11px;color:#B89555;margin:0 0 8px;">New booking · /book</p>
    <h1 style="font-size:20px;margin:0 0 12px;">${htmlEscape(b.fullName)} — ${htmlEscape(b.company)}</h1>
    <p style="margin:0 0 16px;color:#1A1A1A;"><strong>${htmlEscape(whenLocal)}</strong> · ${b.durationMin} min · ${b.locationType === "online" ? `Online (${b.onlinePlatform})` : "Office"}</p>
    <table style="border-collapse:collapse;width:100%;font-size:13px;">
      <tr><td style="padding:6px 0;color:#1A1A1A;"><strong>Email</strong></td><td>${htmlEscape(b.email)}</td></tr>
      <tr><td style="padding:6px 0;color:#1A1A1A;"><strong>Phone</strong></td><td>${htmlEscape(b.phone)}</td></tr>
      <tr><td style="padding:6px 0;color:#1A1A1A;"><strong>Nationality</strong></td><td>${htmlEscape(b.nationality)}</td></tr>
      <tr><td style="padding:6px 0;color:#1A1A1A;"><strong>Language</strong></td><td>${htmlEscape(b.language)}</td></tr>
      <tr><td style="padding:6px 0;color:#1A1A1A;"><strong>Company</strong></td><td>${htmlEscape(b.company)}</td></tr>
    </table>
    ${optional.length ? `<ul style="margin:12px 0 0;padding-left:18px;font-size:13px;color:#1A1A1A;">${optional.join("")}</ul>` : ""}
    ${b.notes ? `<div style="margin-top:16px;padding:12px;background:#F7F2EA;border-radius:8px;font-size:13px;"><strong>Notes:</strong><br/>${htmlEscape(b.notes)}</div>` : ""}
    <p style="font-size:11px;color:#1A1A1A;margin-top:18px;">Booking ID: ${bookingId}</p>
  </div>`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let raw: unknown;
  try { raw = await req.json(); } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const parsed = BookingSchema.safeParse(raw);
  if (!parsed.success) {
    return new Response(
      JSON.stringify({ error: "Validation failed", details: parsed.error.flatten().fieldErrors }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
  const b = parsed.data;

  if (b.locationType === "online" && !b.onlinePlatform) {
    return new Response(JSON.stringify({ error: "online_platform required for online meetings" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

  // 1. Insert booking — trigger validates the slot
  const { data: bookingRow, error: bookErr } = await admin
    .from("meeting_bookings")
    .insert({
      booked_for_at:   b.bookedForAt,
      duration_min:    b.durationMin,
      visitor_name:    b.fullName,
      visitor_email:   b.email.toLowerCase(),
      visitor_phone:   b.phone,
      visitor_company: b.company,
      nationality:     b.nationality,
      language:        b.language,
      location_type:   b.locationType,
      online_platform: b.locationType === "online" ? b.onlinePlatform : null,
      notes:           b.notes ?? null,
      website_url:     b.websiteUrl || null,
      social_links:    b.socialLinks ?? [],
      attachment_url:  b.attachmentUrl ?? null,
      attachment_name: b.attachmentName ?? null,
      source:          b.source ?? (b.refToken ? "branded_email" : "public_landing"),
      ref_token:       b.refToken ?? null,
    })
    .select("id, booked_for_at, duration_min")
    .single();

  if (bookErr || !bookingRow) {
    const msg = bookErr?.message || "Failed to create booking";
    const isSlot = /Meeting|Tuesday|11:00|17:00|advance/i.test(msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: isSlot ? 400 : 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const whenLocal = formatDubai(bookingRow.booked_for_at);

  // 2. Mirror to owner_calendar_events so existing reminder cron picks it up
  const start = new Date(bookingRow.booked_for_at);
  const end = new Date(start.getTime() + bookingRow.duration_min * 60 * 1000);
  const { data: eventRow, error: evErr } = await admin
    .from("owner_calendar_events")
    .insert({
      owner_id: OWNER_USER_ID,
      title:    `Meeting · ${b.fullName} (${b.company})`,
      description: b.notes || null,
      location: b.locationType === "online"
        ? `Online · ${b.onlinePlatform === "zoom" ? "Zoom" : "Google Meet"}`
        : "Dubai office",
      start_at: start.toISOString(),
      end_at:   end.toISOString(),
      metadata: {
        booking_id: bookingRow.id,
        attendee_name: b.fullName,
        attendee_email: b.email.toLowerCase(),
        attendee_phone: b.phone,
        agenda: b.notes ?? "",
        reminders: [1440, 60, 15],
        sent_reminders: [],
      },
    })
    .select("id")
    .single();
  if (evErr) console.error("owner_calendar_events insert failed:", evErr.message);

  // 3. Capture CRM lead via existing function
  let leadId: string | null = null;
  try {
    const { data: leadResp } = await admin.functions.invoke("capture-lead", {
      body: {
        email: b.email.toLowerCase(),
        fullName: b.fullName,
        phone: b.phone,
        nationality: b.nationality,
        language: b.language,
        source: "meeting-booking",
        pageSource: "/book",
        contactType: "client",
        role: "buyer",
        message: [
          `Meeting requested for ${whenLocal} (${b.durationMin} min, ${b.locationType}).`,
          b.notes ? `Notes: ${b.notes}` : "",
          b.websiteUrl ? `Website: ${b.websiteUrl}` : "",
          (b.socialLinks ?? []).length ? `Social: ${(b.socialLinks ?? []).join(", ")}` : "",
        ].filter(Boolean).join("\n"),
      },
    });
    if (leadResp && typeof leadResp === "object" && "leadId" in leadResp) {
      leadId = (leadResp as { leadId?: string }).leadId ?? null;
    }
  } catch (e) {
    console.error("capture-lead failed:", e);
  }

  // 4. Back-link IDs onto the booking row
  if (eventRow?.id || leadId) {
    await admin
      .from("meeting_bookings")
      .update({
        calendar_event_id: eventRow?.id ?? null,
        lead_id: leadId,
      })
      .eq("id", bookingRow.id);
  }

  // 5. Send confirmation + owner notification (best-effort, never break booking)
  const summary = `JBJ — Meeting with Jane Bou Jaoude`;
  const ics = buildIcs(b, summary);

  const [visitorSent, ownerSent] = await Promise.all([
    sendEmail(b.email, "Your meeting request — JBJ GLOBAL REAL ESTATE", visitorHtml(b, whenLocal), ics),
    sendEmail(OWNER_EMAIL, `New booking · ${b.fullName} · ${whenLocal}`, ownerHtml(b, whenLocal, bookingRow.id), ics),
  ]);

  const stamps: Record<string, string> = {};
  if (visitorSent) stamps.visitor_confirmation_sent_at = new Date().toISOString();
  if (ownerSent)   stamps.owner_confirmation_sent_at   = new Date().toISOString();
  if (Object.keys(stamps).length) {
    await admin.from("meeting_bookings").update(stamps).eq("id", bookingRow.id);
  }

  return new Response(
    JSON.stringify({
      ok: true,
      bookingId: bookingRow.id,
      calendarEventId: eventRow?.id ?? null,
      leadId,
      visitorEmailSent: visitorSent,
      ownerEmailSent: ownerSent,
    }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});
