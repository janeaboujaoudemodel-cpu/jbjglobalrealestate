/**
 * cancel-meeting  (PUBLIC, verify_jwt = false)
 *
 * Public endpoint reached from visitor confirmation / reminder emails.
 * Validates cancel_token, enforces cancel_deadline_at (24h / 6h policy
 * computed by the meeting_bookings trigger), updates the booking to
 * "cancelled", notifies both visitor and owner.
 *
 * GET ?token=<cancel_token>  → renders branded HTML receipt.
 */
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { renderBrandedEmail } from "../_shared/booking-email.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") || "";
const OWNER_EMAIL = "janeaboujaoudenails@gmail.com";
const FROM_ADDRESS = "JBJ GLOBAL REAL ESTATE <bookings@jbj.ae>";
const REPLY_TO = "contact@jbj.ae";
const SITE = "https://www.jbj.ae";

function fmtDubai(iso: string) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Dubai", weekday: "long", day: "2-digit",
    month: "long", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: false,
  }).format(new Date(iso));
}

async function sendEmail(to: string, subject: string, html: string) {
  if (!RESEND_API_KEY) return false;
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: FROM_ADDRESS, to: [to], reply_to: REPLY_TO, subject, html }),
  });
  if (!res.ok) { console.error("Resend failed", await res.text()); return false; }
  return true;
}

function page(title: string, message: string, ok: boolean): string {
  const accent = ok ? "#B89555" : "#9b2c2c";
  return `<!doctype html><html><body style="font-family:Inter,Arial,sans-serif;background:#FDFBF7;color:#1A1A1A;padding:60px 20px;text-align:center;">
    <div style="max-width:480px;margin:auto;background:#fff;border:1px solid ${accent}55;border-radius:16px;padding:40px;">
      <div style="font-size:11px;letter-spacing:.3em;color:#B89555;">JBJ GLOBAL REAL ESTATE</div>
      <h1 style="margin:18px 0;font-size:22px;color:${accent};">${title}</h1>
      <p style="color:#1A1A1A99;font-size:13px;line-height:1.6;">${message}</p>
      <a href="${SITE}" style="display:inline-block;margin-top:18px;padding:10px 18px;background:#1A1A1A;color:#fff;text-decoration:none;border-radius:8px;font-size:13px;border:1px solid #B89555;">Return to JBJ</a>
    </div>
  </body></html>`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
  const url = new URL(req.url);
  const token = url.searchParams.get("token");

  if (!token) {
    return new Response(page("Missing token", "This cancel link is invalid.", false), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "text/html" },
    });
  }

  const { data: booking } = await admin
    .from("meeting_bookings")
    .select("*")
    .eq("cancel_token", token)
    .maybeSingle();

  if (!booking) {
    return new Response(page("Link no longer valid", "This booking may have already been cancelled. If you need help, write to contact@jbj.ae.", false), {
      status: 404, headers: { ...corsHeaders, "Content-Type": "text/html" },
    });
  }

  if (booking.status === "cancelled") {
    return new Response(page("Already cancelled", "This booking is already cancelled.", true), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "text/html" },
    });
  }

  const now = Date.now();
  const deadline = booking.cancel_deadline_at ? new Date(booking.cancel_deadline_at).getTime() : 0;
  if (deadline && now > deadline) {
    return new Response(
      page(
        "Too late to cancel online",
        `Our cancellation window has closed (24 hours before morning meetings, 6 hours before afternoon meetings). Please write to <a href="mailto:contact@jbj.ae" style="color:#B89555;">contact@jbj.ae</a> and our team will assist you personally.`,
        false,
      ),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "text/html" } },
    );
  }

  await admin.from("meeting_bookings").update({
    status: "cancelled",
    cancelled_at: new Date().toISOString(),
    cancel_token: null,
  }).eq("id", booking.id);

  if (booking.calendar_event_id) {
    await admin.from("owner_calendar_events").delete().eq("id", booking.calendar_event_id);
  }

  const when = fmtDubai(booking.booked_for_at);

  const visitorHtml = renderBrandedEmail({
    title: "Your meeting has been cancelled.",
    status: "CANCELLED",
    preheader: `Cancellation confirmed for ${when}`,
    greeting: `Dear ${booking.visitor_name},`,
    intro: `Your meeting on ${when} (Dubai time) has been cancelled as requested. We hope to welcome you another time.`,
    detailRows: [{ label: "Originally", value: when }],
    closing: "If this was a mistake, simply reply to this email and our team will rebook you.",
  });

  const ownerHtml = renderBrandedEmail({
    title: `Visitor cancelled · ${booking.visitor_name}`,
    status: "CANCELLED",
    preheader: `${booking.visitor_name} cancelled the meeting at ${when}`,
    greeting: "Jane,",
    intro: `${booking.visitor_name} (${booking.visitor_email}) has cancelled their meeting on ${when} (Dubai time).`,
    detailRows: [
      { label: "Visitor", value: `${booking.visitor_name} · ${booking.visitor_company}` },
      { label: "Email",   value: booking.visitor_email },
      { label: "Phone",   value: booking.visitor_phone },
      { label: "Originally", value: when },
    ],
  });

  await Promise.all([
    sendEmail(booking.visitor_email, "Your meeting has been cancelled — JBJ GLOBAL REAL ESTATE", visitorHtml),
    sendEmail(OWNER_EMAIL, `Cancelled · ${booking.visitor_name} · ${when}`, ownerHtml),
  ]);

  return new Response(
    page(
      "Meeting cancelled",
      `Your meeting on ${when} (Dubai time) has been cancelled. A confirmation has been emailed to you.`,
      true,
    ),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "text/html" } },
  );
});
