/**
 * suggest-meeting-reply  (PROTECTED — owner only)
 *
 * Given a bookingId + intended action (approve | decline | rescheduled),
 * returns a tone-matched suggested message the owner can edit before sending.
 * Uses Lovable AI Gateway (no API key required).
 */
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY") || "";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: corsHeaders });
  }

  // AuthN — must be the owner
  const auth = req.headers.get("Authorization") ?? "";
  if (!auth.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
  const userClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: auth } },
  });
  const { data: { user } } = await userClient.auth.getUser();
  if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  let body: any;
  try { body = await req.json(); } catch { body = {}; }
  const { bookingId, action } = body ?? {};
  if (!bookingId || !["approve", "decline", "rescheduled"].includes(action)) {
    return new Response(JSON.stringify({ error: "bookingId and action required" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
  const { data: booking } = await admin
    .from("meeting_bookings")
    .select("visitor_name, visitor_company, meeting_topic, service_type, language, notes, proposal_text, booked_for_at, duration_min, location_type, online_platform")
    .eq("id", bookingId)
    .maybeSingle();

  if (!booking) {
    return new Response(JSON.stringify({ error: "Booking not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  const tone = action === "approve" ? "warm, confirming, professional"
            : action === "decline" ? "polite, regretful but firm, suggesting future contact"
            : "warm, suggesting a new time, leaving the door fully open";

  const userPrompt = `Compose a short personal note (4–6 sentences) from Jane Bou Jaoude, Founder of JBJ Global Real Estate, to a meeting requester. Tone: ${tone}. Address them by first name. Reference their meeting topic naturally. Do NOT include a greeting line or sign-off (those are added automatically). Output plain text only.

Visitor: ${booking.visitor_name} (${booking.visitor_company})
Service type: ${booking.service_type ?? "—"}
Meeting topic: ${booking.meeting_topic ?? "—"}
Requested time: ${booking.booked_for_at} (Dubai)
Duration: ${booking.duration_min} min
Notes from visitor: ${booking.notes ?? "—"}
Proposal text: ${booking.proposal_text ?? "—"}`;

  if (!LOVABLE_API_KEY) {
    // Fallback canned text if AI gateway not configured
    const fallback = action === "approve"
      ? `Thank you for your interest in meeting. I'm pleased to confirm our session — I look forward to discussing your topic in person.`
      : action === "decline"
      ? `Thank you very much for reaching out. Unfortunately I'm not able to take this meeting at the requested time. I'd love to stay in touch and welcome you to write again when you're next in Dubai.`
      : `Thank you for your request. The original slot won't work on my side — I'd like to propose a slightly different time so we can give your topic the attention it deserves.`;
    return new Response(JSON.stringify({ body: fallback, source: "fallback" }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${LOVABLE_API_KEY}` },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You write brief, refined, ink-on-champagne business correspondence on behalf of a luxury Dubai real estate founder." },
          { role: "user", content: userPrompt },
        ],
      }),
    });
    if (!aiRes.ok) throw new Error(`AI ${aiRes.status}`);
    const json = await aiRes.json();
    const text = (json.choices?.[0]?.message?.content ?? "").trim();
    return new Response(JSON.stringify({ body: text || "(no suggestion)", source: "ai" }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ body: "", source: "error", error: String(e) }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
