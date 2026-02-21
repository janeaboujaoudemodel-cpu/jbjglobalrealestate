import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      ticketNumber,
      email,
      fullName,
      phone,
      overallRating,
      easeOfSubmission,
      responseSpeed,
      resolutionQuality,
      websiteSmartness,
      wouldRecommend,
      suggestions,
    } = await req.json();

    if (!ticketNumber || !email || !overallRating) {
      return new Response(JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Validate ticket exists and email matches
    const { data: ticket, error: ticketError } = await supabaseClient
      .from("support_tickets")
      .select("id, ticket_number, email, user_id")
      .eq("ticket_number", ticketNumber)
      .single();

    if (ticketError || !ticket) {
      return new Response(JSON.stringify({ error: "Ticket not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (ticket.email.toLowerCase() !== email.toLowerCase()) {
      return new Response(JSON.stringify({ error: "Email does not match ticket" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Check for duplicate survey
    const { data: existing } = await supabaseClient
      .from("ticket_surveys")
      .select("id")
      .eq("ticket_number", ticketNumber)
      .eq("email", email.toLowerCase())
      .maybeSingle();

    if (existing) {
      return new Response(JSON.stringify({ error: "Survey already submitted for this ticket" }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const pointsAwarded = 50;

    // Insert survey
    const { error: insertError } = await supabaseClient
      .from("ticket_surveys")
      .insert({
        ticket_id: ticket.id,
        ticket_number: ticketNumber,
        user_id: ticket.user_id || null,
        full_name: fullName || ticket.email,
        email: email.toLowerCase(),
        phone: phone || null,
        overall_rating: overallRating,
        ease_of_submission: easeOfSubmission || overallRating,
        response_speed: responseSpeed || overallRating,
        resolution_quality: resolutionQuality || overallRating,
        website_smartness: websiteSmartness || overallRating,
        would_recommend: wouldRecommend ?? true,
        suggestions: suggestions || null,
        points_awarded: pointsAwarded,
      });

    if (insertError) {
      console.error("Survey insert error:", insertError);
      return new Response(JSON.stringify({ error: "Failed to submit survey" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Award points if user exists in vip_clients
    if (ticket.user_id) {
      try {
        // Add to points ledger
        await supabaseClient.from("points_ledger").insert({
          user_id: ticket.user_id,
          event_type: "survey_completed",
          event_description: `Ticket survey completed for ${ticketNumber}`,
          points_delta: pointsAwarded,
          points_balance_after: 0,
          category: "activity",
          source_name: "Ticket Survey",
          notes: `Survey for ticket ${ticketNumber}`,
        });
      } catch (e) {
        console.error("Points award error (non-critical):", e);
      }
    }

    return new Response(JSON.stringify({ success: true, pointsAwarded }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (error: unknown) {
    console.error("Error in submit-ticket-survey:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
};

serve(handler);
