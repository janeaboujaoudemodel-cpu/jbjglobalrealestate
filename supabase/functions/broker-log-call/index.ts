import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface LogCallRequest {
  broker_id: string;
  lead_id: string;
  phone_number: string;
  call_type: "outbound" | "inbound";
  duration_seconds?: number;
  call_status: "completed" | "no_answer" | "busy" | "failed" | "voicemail";
  notes?: string;
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      broker_id,
      lead_id,
      phone_number,
      call_type = "outbound",
      duration_seconds,
      call_status,
      notes,
    }: LogCallRequest = await req.json();

    if (!broker_id || !lead_id || !phone_number || !call_status) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: broker_id, lead_id, phone_number, call_status" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get broker details
    const { data: broker, error: brokerError } = await supabase
      .from("ai_brokers")
      .select("id, name, email")
      .eq("id", broker_id)
      .single();

    if (brokerError || !broker) {
      return new Response(
        JSON.stringify({ error: "Broker not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Log the call in broker_call_logs (this uses user_id which is the broker's ID for AI brokers)
    const { data: callLog, error: callError } = await supabase
      .from("broker_call_logs")
      .insert({
        user_id: broker_id,
        lead_id,
        phone_number,
        call_type,
        duration_seconds: duration_seconds || 0,
        call_status,
        notes,
      })
      .select()
      .single();

    if (callError) {
      console.error("Error logging call:", callError);
      throw callError;
    }

    // Get or create conversation
    const { data: existingConv } = await supabase
      .from("broker_conversations")
      .select("*")
      .eq("broker_id", broker_id)
      .eq("lead_id", lead_id)
      .eq("channel", "call")
      .eq("status", "active")
      .single();

    let conversation = existingConv;

    if (!existingConv) {
      const { data: newConv } = await supabase
        .from("broker_conversations")
        .insert({
          broker_id,
          lead_id,
          channel: "call",
          client_identifier: phone_number,
          status: "active",
        })
        .select()
        .single();
      conversation = newConv;
    }

    // Log call as a message in broker_messages
    if (conversation) {
      const callSummary = `📞 ${call_type === "outbound" ? "Outgoing" : "Incoming"} call - ${call_status}${
        duration_seconds ? ` (${Math.floor(duration_seconds / 60)}m ${duration_seconds % 60}s)` : ""
      }${notes ? `\n\nNotes: ${notes}` : ""}`;

      await supabase.from("broker_messages").insert({
        conversation_id: conversation.id,
        broker_id,
        direction: call_type === "outbound" ? "outbound" : "inbound",
        content: callSummary,
        content_type: "call_log",
        delivery_status: "completed",
      });

      await supabase
        .from("broker_conversations")
        .update({
          last_message_at: new Date().toISOString(),
          message_count: (conversation.message_count || 0) + 1,
        })
        .eq("id", conversation.id);
    }

    // Update daily stats
    const today = new Date().toISOString().split("T")[0];
    const { data: existingStats } = await supabase
      .from("broker_daily_stats")
      .select("*")
      .eq("broker_id", broker_id)
      .eq("stat_date", today)
      .single();

    if (existingStats) {
      await supabase
        .from("broker_daily_stats")
        .update({ 
          calls_made: (existingStats.calls_made || 0) + 1,
          leads_contacted: (existingStats.leads_contacted || 0) + 1,
        })
        .eq("id", existingStats.id);
    } else {
      await supabase.from("broker_daily_stats").insert({
        broker_id,
        stat_date: today,
        calls_made: 1,
        leads_contacted: 1,
      });
    }

    // Update broker interaction count
    const { data: brokerData } = await supabase
      .from("ai_brokers")
      .select("current_daily_interactions")
      .eq("id", broker_id)
      .single();

    if (brokerData) {
      await supabase
        .from("ai_brokers")
        .update({
          current_daily_interactions: (brokerData.current_daily_interactions || 0) + 1,
          total_leads_handled: (broker as any).total_leads_handled 
            ? (broker as any).total_leads_handled + 1 
            : 1,
        })
        .eq("id", broker_id);
    }

    console.log(`Call logged successfully for broker ${broker.name} to lead ${lead_id}`);

    return new Response(
      JSON.stringify({
        success: true,
        call_id: callLog.id,
        broker_name: broker.name,
        call_status,
        duration_seconds,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Broker log call error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Failed to log call" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
