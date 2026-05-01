/**
 * breakfast-booking-lookup (PUBLIC)
 *
 * Given an invite token, returns the brokerage display name + already
 * chosen slot (if any) + active future breakfast_slots, so the public
 * booking page can render. No PII beyond the company name.
 */
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const token = url.searchParams.get("token");
    if (!token) throw new Error("token required");

    const service = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Preview / test token
    if (token.startsWith("test_")) {
      const { data: slots } = await service
        .from("breakfast_slots")
        .select("id, slot_at, capacity, notes")
        .eq("is_active", true)
        .gt("slot_at", new Date().toISOString())
        .order("slot_at", { ascending: true });
      return new Response(JSON.stringify({
        preview: true,
        brokerageName: "Sample Brokerage Group",
        status: "invited",
        slots: slots || [],
      }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: invite, error } = await service
      .from("meeting_requests")
      .select("id, brokerage_name, status, preferred_date, preferred_time, attendee_count, briefing_topics, partnership_focus")
      .eq("invite_token", token)
      .maybeSingle();
    if (error) throw error;
    if (!invite) {
      return new Response(JSON.stringify({ error: "Invitation not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: slots } = await service
      .from("breakfast_slots")
      .select("id, slot_at, capacity, notes")
      .eq("is_active", true)
      .gt("slot_at", new Date().toISOString())
      .order("slot_at", { ascending: true });

    return new Response(JSON.stringify({
      brokerageName: invite.brokerage_name,
      status: invite.status,
      chosen: invite.status === "pending" || invite.status === "completed"
        ? {
          date: invite.preferred_date,
          time: invite.preferred_time,
          attendeeCount: invite.attendee_count,
          briefingTopics: invite.briefing_topics,
          partnershipFocus: invite.partnership_focus,
        }
        : null,
      slots: slots || [],
    }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("breakfast-booking-lookup error:", e);
    return new Response(JSON.stringify({ error: e?.message || "Internal error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
