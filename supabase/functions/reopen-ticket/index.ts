import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ReopenTicketRequest {
  ticketNumber: string;
  token: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { ticketNumber, token }: ReopenTicketRequest = await req.json();

    if (!ticketNumber || !token) {
      return new Response(
        JSON.stringify({ error: "Missing ticket number or token" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Find the ticket and validate token
    const { data: ticket, error: fetchError } = await supabaseClient
      .from("support_tickets")
      .select("id, ticket_number, reopen_token, status, reopen_count, full_name, email, subject, user_id")
      .eq("ticket_number", ticketNumber)
      .single();

    if (fetchError || !ticket) {
      console.error("Ticket not found:", fetchError);
      return new Response(
        JSON.stringify({ error: "Ticket not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate the reopen token
    if (ticket.reopen_token !== token) {
      console.error("Invalid reopen token for ticket:", ticketNumber);
      return new Response(
        JSON.stringify({ error: "Invalid reopen token" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if ticket is already open
    if (ticket.status === "open" || ticket.status === "in_progress") {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Ticket is already open",
          ticketNumber: ticket.ticket_number,
          status: ticket.status
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Reopen the ticket
    const { error: updateError } = await supabaseClient
      .from("support_tickets")
      .update({
        status: "open",
        is_reopened: true,
        reopened_at: new Date().toISOString(),
        reopen_count: (ticket.reopen_count || 0) + 1,
        updated_at: new Date().toISOString()
      })
      .eq("id", ticket.id);

    if (updateError) {
      console.error("Failed to reopen ticket:", updateError);
      return new Response(
        JSON.stringify({ error: "Failed to reopen ticket" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Add a system message to the ticket thread
    await supabaseClient
      .from("support_ticket_messages")
      .insert({
        ticket_id: ticket.id,
        sender_type: "user",
        message: `🔄 Ticket reopened by customer via email link. The customer indicated their issue was not resolved.`,
        attachment_urls: []
      });

    // Create notification for the customer if they have a user_id
    if (ticket.user_id) {
      await supabaseClient.from("user_notifications").insert({
        user_id: ticket.user_id,
        type: "support_ticket",
        title: `Ticket ${ticket.ticket_number} Reopened`,
        message: `Your support ticket "${ticket.subject}" has been reopened. Our team will review it again.`,
        metadata: { ticket_number: ticket.ticket_number, ticket_id: ticket.id, action: "reopened" }
      });
    }

    // Send reopened confirmation email to customer
    try {
      const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
      await fetch(`${supabaseUrl}/functions/v1/send-ticket-status-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
        },
        body: JSON.stringify({ ticketId: ticket.id, newStatus: "open" }),
      });
    } catch (emailErr) {
      console.error("Reopen email failed (non-critical):", emailErr);
    }

    console.log(`Ticket ${ticketNumber} reopened successfully`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Ticket reopened successfully",
        ticketNumber: ticket.ticket_number,
        status: "open"
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error reopening ticket:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
