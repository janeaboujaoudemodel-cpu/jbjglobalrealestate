/**
 * crm-create-breakfast-invite-token
 *
 * Owner-only. Mints (or returns the existing) breakfast booking invite
 * token for a given brokerage. Returns { token, bookingUrl } so the
 * outreach edge function can inject it into the email template.
 */
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const OWNER_EMAILS = [
  "janeaboujaoudenails@gmail.com",
  "janeaboujaoudemodel@gmail.com",
  "infoo.jane@gmail.com",
];

const SITE_URL = Deno.env.get("PUBLIC_SITE_URL") || "https://www.jbj.ae";

const randomToken = () => {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("NO_AUTH");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const userClient = createClient(
      supabaseUrl,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: { user } } = await userClient.auth.getUser();
    if (!user || !OWNER_EMAILS.includes(user.email || "")) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const service = createClient(
      supabaseUrl,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { brokerageId, isTest, preferredSlotId } = await req.json() as {
      brokerageId?: string;
      isTest?: boolean;
      preferredSlotId?: string;
    };

    // Resolve preferred slot (if any) to use as preferred_date / preferred_time
    let preferredDate: string | null = null;
    let preferredTime: string | null = null;
    if (preferredSlotId) {
      try {
        const { data: slot } = await service
          .from("breakfast_slots")
          .select("slot_at")
          .eq("id", preferredSlotId)
          .maybeSingle();
        if (slot?.slot_at) {
          const iso = String(slot.slot_at);
          preferredDate = iso.slice(0, 10);
          // HH:MM (24h, in UTC stored value — UI re-formats to Dubai)
          const t = new Date(iso);
          const hh = String(t.getUTCHours()).padStart(2, "0");
          const mm = String(t.getUTCMinutes()).padStart(2, "0");
          preferredTime = `${hh}:${mm}`;
        }
      } catch (slotErr) {
        console.warn("Preferred slot lookup failed:", slotErr);
      }
    }

    // Test sends — don't pollute meeting_requests
    if (isTest || !brokerageId) {
      const token = `test_${randomToken()}`;
      return new Response(JSON.stringify({
        token,
        bookingUrl: `${SITE_URL}/breakfast-booking?token=${token}&preview=1`,
      }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Reuse existing non-cancelled invite if present
    const { data: existing } = await service
      .from("meeting_requests")
      .select("id, invite_token, status")
      .eq("brokerage_id", brokerageId)
      .eq("booking_kind", "brokerage_breakfast")
      .not("invite_token", "is", null)
      .neq("status", "cancelled")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existing?.invite_token) {
      // If a new preferred slot was supplied, update the placeholder so the
      // booking page highlights it.
      if (preferredDate && preferredTime && existing.id) {
        await service
          .from("meeting_requests")
          .update({ preferred_date: preferredDate, preferred_time: preferredTime })
          .eq("id", existing.id);
      }
      return new Response(JSON.stringify({
        token: existing.invite_token,
        bookingUrl: `${SITE_URL}/breakfast-booking?token=${existing.invite_token}`,
        reused: true,
      }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: brk, error: brkErr } = await service
      .from("crm_brokerages").select("id, company_name, primary_contact, email")
      .eq("id", brokerageId).single();
    if (brkErr || !brk) throw new Error("Brokerage not found");

    const pc = (brk.primary_contact || {}) as Record<string, any>;
    const token = randomToken();
    const placeholderEmail = pc.email || brk.email || "pending@invite.local";

    const { error: insErr } = await service.from("meeting_requests").insert({
      booking_kind: "brokerage_breakfast",
      brokerage_id: brk.id,
      brokerage_name: brk.company_name,
      invite_token: token,
      requester_name: pc.name || brk.company_name || "Brokerage Partner",
      requester_email: placeholderEmail,
      purpose: `Private Breakfast for ${brk.company_name}`,
      preferred_date: preferredDate || new Date().toISOString().slice(0, 10),
      preferred_time: preferredTime || "TBD",
      status: "invited",
      duration_minutes: 60,
      user_id: user.id,
    });
    if (insErr) throw insErr;

    return new Response(JSON.stringify({
      token,
      bookingUrl: `${SITE_URL}/breakfast-booking?token=${token}`,
    }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("crm-create-breakfast-invite-token error:", e);
    return new Response(JSON.stringify({ error: e?.message || "Internal error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
