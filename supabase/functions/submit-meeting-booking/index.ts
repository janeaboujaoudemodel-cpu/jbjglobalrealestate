/**
 * submit-meeting-booking  (PUBLIC, verify_jwt = false)  — Phase 2
 *
 *  1. Validate payload (now includes service_type, meeting_topic, proposal, structured socials, phone-meta)
 *  2. Insert into public.meeting_bookings  (status='received', owner_action_token generated)
 *  3. Mirror to owner_calendar_events so process-meeting-reminders sends 24h + 30m reminders to BOTH visitor + owner
 *  4. Capture CRM lead via capture-lead
 *  5. Send branded "Received" email to visitor + dossier-with-buttons email to owner
 *  6. Schedule a follow-up status flip received → pending after 30 s (via setTimeout — fire-and-forget)
 */
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { renderBrandedEmail, htmlEscape, SITE_URL } from "../_shared/booking-email.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") || "";

const OWNER_USER_ID = "72ca2405-b4ca-48df-9b47-623ee260a3cc";
const OWNER_EMAIL = "janeaboujaoudenails@gmail.com";
const FROM_ADDRESS = "JBJ GLOBAL REAL ESTATE <bookings@jbj.ae>";
// Reply-To on every visitor email = contact@jbj.ae per policy.
const REPLY_TO = "contact@jbj.ae";

const SocialLinkSchema = z.object({
  platform: z.enum(["linkedin","instagram","facebook","youtube","x","tiktok","other"]),
  url: z.string().trim().url().max(500),
});

const BookingSchema = z.object({
  fullName:   z.string().trim().min(2).max(120),
  email:      z.string().trim().email().max(255),
  phone:      z.string().trim().min(6).max(40), // E.164
  phoneCountry: z.string().trim().max(4).optional().nullable(),
  phoneNational: z.string().trim().max(40).optional().nullable(),
  nationality:z.string().trim().min(2).max(80),
  language:   z.string().trim().min(2).max(40),
  company:    z.string().trim().min(1).max(160),
  serviceType: z.enum(["general_inquiry","general_meeting","partnership","investment_briefing","off_market_access","other"]),
  meetingTopic: z.string().trim().min(3).max(2000),
  bookedForAt:z.string().min(10),
  durationMin:z.number().int().refine((n) => [30, 45, 60, 90].includes(n)),
  locationType: z.enum(["office", "online"]),
  onlinePlatform: z.enum(["zoom", "google_meet"]).optional().nullable(),
  notes:        z.string().trim().max(2000).optional().nullable(),
  proposalText: z.string().trim().max(5000).optional().nullable(),
  websiteUrl:   z.string().trim().url().max(400).optional().nullable().or(z.literal("")),
  socialLinks:  z.array(SocialLinkSchema).max(6).optional(),
  attachmentUrl:  z.string().trim().url().max(800).optional().nullable(),
  attachmentName: z.string().trim().max(255).optional().nullable(),
  refToken:     z.string().trim().max(120).optional().nullable(),
  source:       z.enum(["public_landing", "branded_email"]).optional(),
  authUserId:   z.string().uuid().optional().nullable(),
  agreedToCancellationTerms: z.boolean().optional(),
});
type Booking = z.infer<typeof BookingSchema>;

function newToken(): string {
  return crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "");
}
function formatDubai(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Dubai", weekday: "long", day: "2-digit",
    month: "long", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: false,
  }).format(new Date(iso));
}
function serviceLabel(s: string): string {
  return ({
    general_inquiry: "General inquiry",
    general_meeting: "General meeting",
    partnership: "Partnership",
    investment_briefing: "Investment briefing",
    off_market_access: "Off-market access",
    other: "Other",
  } as Record<string, string>)[s] ?? s;
}

async function sendEmail(to: string, subject: string, html: string, icsContent?: string): Promise<boolean> {
  if (!RESEND_API_KEY) { console.warn("RESEND_API_KEY missing"); return false; }
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

function buildIcs(b: Booking, summary: string): string {
  const start = new Date(b.bookedForAt);
  const end = new Date(start.getTime() + b.durationMin * 60 * 1000);
  const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  return [
    "BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//JBJ//Booking//EN","METHOD:REQUEST","BEGIN:VEVENT",
    `UID:${start.getTime()}-${b.email}@jbj.ae`,
    `DTSTAMP:${fmt(new Date())}`,
    `DTSTART:${fmt(start)}`,
    `DTEND:${fmt(end)}`,
    `SUMMARY:${summary}`,
    `LOCATION:${b.locationType === "online" ? (b.onlinePlatform === "zoom" ? "Zoom" : "Google Meet") : "JBJ — Dubai office"}`,
    `ORGANIZER;CN=Jane Bou Jaoude:mailto:${OWNER_EMAIL}`,
    `ATTENDEE;CN=${b.fullName};RSVP=TRUE:mailto:${b.email}`,
    "END:VEVENT","END:VCALENDAR",
  ].join("\r\n");
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" },
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
    return new Response(JSON.stringify({ error: "Validation failed", details: parsed.error.flatten().fieldErrors }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const b = parsed.data;
  if (b.locationType === "online" && !b.onlinePlatform) {
    return new Response(JSON.stringify({ error: "online_platform required for online meetings" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  if (b.serviceType === "partnership" && !b.proposalText && !b.attachmentUrl) {
    return new Response(JSON.stringify({ error: "Partnership requests must include a proposal (typed or attached)." }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
  const token = newToken();

  // 1. Insert
  const { data: bookingRow, error: bookErr } = await admin
    .from("meeting_bookings")
    .insert({
      booked_for_at:   b.bookedForAt,
      duration_min:    b.durationMin,
      visitor_name:    b.fullName,
      visitor_email:   b.email.toLowerCase(),
      visitor_phone:   b.phone,
      phone_country_code: b.phoneCountry ?? null,
      phone_national:     b.phoneNational ?? null,
      visitor_company: b.company,
      nationality:     b.nationality,
      language:        b.language,
      service_type:    b.serviceType,
      meeting_topic:   b.meetingTopic,
      proposal_text:   b.proposalText ?? null,
      location_type:   b.locationType,
      online_platform: b.locationType === "online" ? b.onlinePlatform : null,
      notes:           b.notes ?? null,
      website_url:     b.websiteUrl || null,
      social_links:    b.socialLinks ?? [],
      attachment_url:  b.attachmentUrl ?? null,
      attachment_name: b.attachmentName ?? null,
      source:          b.source ?? (b.refToken ? "branded_email" : "public_landing"),
      ref_token:       b.refToken ?? null,
      status:          "received",
      owner_action_token: token,
      cancel_token:    newToken(),
      auth_user_id:    b.authUserId ?? null,
    })
    .select("id, booked_for_at, duration_min, cancel_token")
    .single();

  if (bookErr || !bookingRow) {
    const msg = bookErr?.message || "Failed to create booking";
    const isSlot = /Meeting|Tuesday|11:00|17:00|advance/i.test(msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: isSlot ? 400 : 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const whenLocal = formatDubai(bookingRow.booked_for_at);
  const start = new Date(bookingRow.booked_for_at);
  const end = new Date(start.getTime() + bookingRow.duration_min * 60 * 1000);

  // 2. Mirror to calendar so the existing reminder cron picks it up
  //    metadata.reminders = [1440, 30] → 24h and 30 min, sent to BOTH visitor and owner.
  const { data: eventRow } = await admin
    .from("owner_calendar_events")
    .insert({
      owner_id: OWNER_USER_ID,
      title: `Meeting · ${b.fullName} (${b.company})`,
      description: `${serviceLabel(b.serviceType)} — ${b.meetingTopic}${b.notes ? `\n\n${b.notes}` : ""}`,
      location: b.locationType === "online" ? `Online · ${b.onlinePlatform === "zoom" ? "Zoom" : "Google Meet"}` : "Dubai office",
      start_at: start.toISOString(),
      end_at:   end.toISOString(),
      metadata: {
        booking_id: bookingRow.id,
        attendee_name: b.fullName,
        attendee_email: b.email.toLowerCase(),
        attendee_phone: b.phone,
        owner_email: OWNER_EMAIL,
        agenda: b.meetingTopic,
        reminders: [1440, 30],
        sent_reminders: [],
      },
    })
    .select("id").single();

  // 3. CRM lead — source = "calendar_meeting", account_status reflects whether
  //    the visitor came with an authenticated platform account.
  let leadId: string | null = null;
  try {
    const { data: leadResp } = await admin.functions.invoke("capture-lead", {
      body: {
        email: b.email.toLowerCase(), fullName: b.fullName, phone: b.phone,
        nationality: b.nationality, language: b.language,
        source: "calendar_meeting", pageSource: "/book", contactType: "client", role: "buyer",
        message: `${serviceLabel(b.serviceType)} — ${b.meetingTopic}\nRequested ${whenLocal} (${b.durationMin} min ${b.locationType})${b.notes ? `\nNotes: ${b.notes}` : ""}`,
      },
    });
    if (leadResp && typeof leadResp === "object" && "leadId" in leadResp) {
      leadId = (leadResp as { leadId?: string }).leadId ?? null;
    }
    if (!leadId) {
      const { data: lookup } = await admin.from("crm_leads").select("id").eq("email_lower", b.email.toLowerCase()).maybeSingle();
      leadId = lookup?.id ?? null;
    }
    if (leadId) {
      await admin.from("crm_leads")
        .update({ account_status: b.authUserId ? "registered" : "form_only" })
        .eq("id", leadId);
    }
  } catch (e) { console.error("capture-lead failed:", e); }

  await admin.from("meeting_bookings").update({
    calendar_event_id: eventRow?.id ?? null,
    lead_id: leadId,
  }).eq("id", bookingRow.id);

  // 4. Emails — visitor "Received" + owner dossier with action buttons
  const fnBase = `${SUPABASE_URL}/functions/v1/meeting-booking-action`;
  const approveUrl     = `${fnBase}?token=${token}&action=approve`;
  const declineUrl     = `${fnBase}?token=${token}&action=decline`;
  const rescheduleUrl  = `${fnBase}?token=${token}&action=rescheduled`;

  const socialRows = (b.socialLinks ?? []).map(s => `<a href="${htmlEscape(s.url)}" style="color:#1A1A1A;text-decoration:underline;text-decoration-color:#B89555;margin-right:8px;">${htmlEscape(s.platform)}</a>`).join("");

  const visitorHtml = renderBrandedEmail({
    title: "Greetings from JBJ Global Real Estate.",
    status: "RECEIVED",
    preheader: "Your meeting request has been received — our team is reviewing it now.",
    greeting: `Dear ${b.fullName},`,
    intro: "Thank you for your request. We have received your details and our team is reviewing them. Jane will personally confirm shortly.",
    detailRows: [
      { label: "Service",   value: serviceLabel(b.serviceType) },
      { label: "Topic",     value: b.meetingTopic },
      { label: "When",      value: `${whenLocal} (Dubai time)` },
      { label: "Duration",  value: `${b.durationMin} min` },
      { label: "Where",     value: b.locationType === "online" ? `Online · ${b.onlinePlatform === "zoom" ? "Zoom" : "Google Meet"}` : "Dubai office" },
    ],
    closing: "You'll receive reminders 24 hours and 30 minutes before the meeting once confirmed.",
  });

  const ownerHtml = renderBrandedEmail({
    title: `New booking · ${b.fullName} — ${b.company}`,
    status: "RECEIVED",
    preheader: `${serviceLabel(b.serviceType)} · ${whenLocal}`,
    greeting: "Jane,",
    intro: `A new meeting request has just been submitted via /book.`,
    detailRows: [
      { label: "Visitor",   value: `${b.fullName} (${b.nationality})` },
      { label: "Email",     value: b.email },
      { label: "Phone",     value: b.phone },
      { label: "Company",   value: b.company },
      { label: "Language",  value: b.language },
      { label: "Service",   value: serviceLabel(b.serviceType) },
      { label: "Topic",     value: b.meetingTopic },
      { label: "When",      value: `${whenLocal} (Dubai time)` },
      { label: "Duration",  value: `${b.durationMin} min` },
      { label: "Where",     value: b.locationType === "online" ? `Online · ${b.onlinePlatform === "zoom" ? "Zoom" : "Google Meet"}` : "Dubai office" },
      ...(b.websiteUrl ? [{ label: "Website", value: b.websiteUrl }] : []),
      ...(b.attachmentName ? [{ label: "Attachment", value: b.attachmentName }] : []),
    ],
    ownerNotes:
      [b.proposalText ? `<strong>Proposal:</strong><br>${htmlEscape(b.proposalText).replace(/\n/g, "<br>")}` : "",
       b.notes ? `<strong>Notes:</strong><br>${htmlEscape(b.notes).replace(/\n/g, "<br>")}` : "",
       socialRows ? `<strong>Social:</strong><br>${socialRows}` : "",
      ].filter(Boolean).join("<br><br>") || undefined,
    ownerControls: { approveUrl, declineUrl, rescheduleUrl },
    closing: `Open the Meetings hub at ${SITE_URL}/owner/meetings to type a custom reply.`,
  });

  const ics = buildIcs(b, `JBJ — Meeting with Jane Bou Jaoude`);
  const [visitorSent, ownerSent] = await Promise.all([
    sendEmail(b.email, "We've received your meeting request — JBJ GLOBAL REAL ESTATE", visitorHtml),
    sendEmail(OWNER_EMAIL, `New booking · ${b.fullName} · ${whenLocal}`, ownerHtml, ics),
  ]);

  const stamps: Record<string, string> = {};
  if (visitorSent) stamps.visitor_confirmation_sent_at = new Date().toISOString();
  if (ownerSent)   stamps.owner_confirmation_sent_at   = new Date().toISOString();
  if (Object.keys(stamps).length) {
    await admin.from("meeting_bookings").update(stamps).eq("id", bookingRow.id);
  }

  // 5. Auto-flip received → pending after 30 s (best-effort fire-and-forget)
  setTimeout(async () => {
    try {
      await admin.from("meeting_bookings")
        .update({ status: "pending" })
        .eq("id", bookingRow.id)
        .eq("status", "received");

      const pendingHtml = renderBrandedEmail({
        title: "Your request is with Jane.",
        status: "PENDING",
        preheader: "Our team is preparing it for Jane's personal review.",
        greeting: `Dear ${b.fullName},`,
        intro: "Your meeting request has now been escalated to Jane for personal review. You will receive a confirmation as soon as she has approved it.",
        detailRows: [
          { label: "Topic",     value: b.meetingTopic },
          { label: "When",      value: `${whenLocal} (Dubai time)` },
        ],
        closing: "We appreciate your patience.",
      });
      await sendEmail(b.email, "Your meeting request is now pending — JBJ GLOBAL REAL ESTATE", pendingHtml);
    } catch (e) { console.error("auto-flip failed:", e); }
  }, 30_000);

  return new Response(JSON.stringify({
    ok: true, bookingId: bookingRow.id, calendarEventId: eventRow?.id ?? null,
    leadId, visitorEmailSent: visitorSent, ownerEmailSent: ownerSent,
  }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
});
