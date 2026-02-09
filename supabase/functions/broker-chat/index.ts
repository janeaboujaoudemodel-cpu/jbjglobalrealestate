import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { validateEmployeeAuth, unauthorizedResponse, forbiddenResponse, corsHeaders } from "../_shared/auth-utils.ts";

interface ChatRequest {
  broker_id: string;
  lead_id?: string;
  conversation_id?: string;
  message: string;
  channel: "whatsapp" | "email" | "sms" | "call" | "video";
  client_identifier: string;
}

interface AIBroker {
  id: string;
  name: string;
  email: string;
  personality_prompt: string;
  status: string;
  daily_interaction_limit: number;
  current_daily_interactions: number;
}

interface MessageFilter {
  filter_type: string;
  filter_value: string;
  severity: string;
  replacement_text: string | null;
}

// JBJ Knowledge base for the AI brokers
const JBJ_KNOWLEDGE_BASE = `
# JBJ Global Real Estate - Company Information

## About JBJ
JBJ Global Real Estate is a premier Dubai-based real estate brokerage founded with the mission of providing exceptional property services to local and international clients.

## Contact Information
- Official Phone: +971 56 591 1000
- Email: contact@JBJ.ae
- Privacy: privacy@JBJ.ae

## Services
- Property Sales (Off-plan and Secondary Market)
- Property Consultation
- Investment Advisory (informational only, not financial advice)
- Property Viewing Arrangements
- Market Analysis and Reports

## Dubai Real Estate Basics
- DLD Transfer Fee: 4% of property value
- Registration Fee: AED 4,000 for properties over AED 500,000
- Agency Fee: Typically 2% of property value
- Mortgage: Up to 80% LTV for residents, 50-65% for non-residents
- Freehold Areas: Dubai Marina, Downtown Dubai, Palm Jumeirah, JBR, Business Bay, etc.

## Compliance Rules
- Never guarantee returns or make investment promises
- Never provide legal or financial advice (only informational)
- Always recommend clients consult licensed professionals for legal/financial matters
- Never mention competitor names positively
- Always use official JBJ contact information

## Communication Guidelines
- Be professional yet warm
- Use formal address initially, then match client's tone
- Always confirm understanding before proceeding
- Offer to schedule calls or viewings proactively
- Follow up within 24 hours of any inquiry
`;

async function checkMessageFilters(
  supabase: any,
  message: string
): Promise<{ passed: boolean; reason?: string; severity?: string }> {
  const { data: filters, error } = await supabase
    .from("broker_message_filters")
    .select("*")
    .eq("is_active", true);

  if (error || !filters) {
    console.error("Error fetching filters:", error);
    return { passed: true };
  }

  for (const filter of filters as MessageFilter[]) {
    const lowerMessage = message.toLowerCase();
    const lowerValue = filter.filter_value.toLowerCase();

    let matches = false;
    if (filter.filter_type === "regex") {
      try {
        const regex = new RegExp(filter.filter_value, "i");
        matches = regex.test(message);
      } catch {
        matches = false;
      }
    } else {
      matches = lowerMessage.includes(lowerValue);
    }

    if (matches) {
      return {
        passed: filter.severity === "warning",
        reason: `Message contains restricted content: ${filter.filter_type} "${filter.filter_value}"`,
        severity: filter.severity,
      };
    }
  }

  return { passed: true };
}

async function generateBrokerResponse(
  broker: AIBroker,
  conversationHistory: any[],
  clientMessage: string
): Promise<string> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) {
    throw new Error("LOVABLE_API_KEY is not configured");
  }

  const systemPrompt = `${broker.personality_prompt}

${JBJ_KNOWLEDGE_BASE}

IMPORTANT RULES:
1. Never reveal you are an AI or chatbot
2. Always introduce yourself as ${broker.name} from JBJ Global Real Estate
3. Use only official contact: +971 56 591 1000, contact@JBJ.ae
4. Be helpful, professional, and knowledgeable about Dubai real estate
5. Never guarantee investment returns or provide financial advice
6. Offer to schedule viewings or calls when appropriate
7. Keep responses concise but informative (2-3 paragraphs max)
8. Ask clarifying questions about budget, preferences, timeline when needed`;

  const messages = [
    { role: "system", content: systemPrompt },
    ...conversationHistory.slice(-10).map((msg: any) => ({
      role: msg.direction === "inbound" ? "user" : "assistant",
      content: msg.content,
    })),
    { role: "user", content: clientMessage },
  ];

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages,
      max_tokens: 500,
    }),
  });

  if (!response.ok) {
    if (response.status === 429) {
      throw new Error("Rate limit exceeded. Please try again later.");
    }
    if (response.status === 402) {
      throw new Error("AI credits exhausted. Please contact admin.");
    }
    const errorText = await response.text();
    console.error("AI Gateway error:", response.status, errorText);
    throw new Error("Failed to generate response");
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "I apologize, I'm experiencing technical difficulties. Please try again.";
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // ============ AUTHENTICATION CHECK ============
  const authResult = await validateEmployeeAuth(req);
  
  if (!authResult.authenticated) {
    return unauthorizedResponse(authResult.error);
  }
  
  if (!authResult.isEmployee) {
    return forbiddenResponse(authResult.error);
  }
  // ============ END AUTH CHECK ============

  try {
    const { broker_id, lead_id, conversation_id, message, channel, client_identifier }: ChatRequest = await req.json();

    if (!broker_id || !message || !channel || !client_identifier) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: broker_id, message, channel, client_identifier" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Get broker details
    const { data: broker, error: brokerError } = await supabase
      .from("ai_brokers")
      .select("*")
      .eq("id", broker_id)
      .single();

    if (brokerError || !broker) {
      return new Response(
        JSON.stringify({ error: "Broker not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Check broker status and capacity
    if (broker.status !== "active") {
      return new Response(
        JSON.stringify({ error: "Broker is currently unavailable", status: broker.status }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (broker.current_daily_interactions >= broker.daily_interaction_limit) {
      return new Response(
        JSON.stringify({ error: "Broker has reached daily interaction limit" }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. Check message filters
    const filterResult = await checkMessageFilters(supabase, message);

    // 4. Get or create conversation
    let conversationRecord: any;
    if (conversation_id) {
      const { data } = await supabase
        .from("broker_conversations")
        .select("*")
        .eq("id", conversation_id)
        .single();
      conversationRecord = data;
    }

    if (!conversationRecord) {
      const { data, error } = await supabase
        .from("broker_conversations")
        .insert({
          broker_id,
          lead_id,
          channel,
          client_identifier,
          status: "active",
        })
        .select()
        .single();

      if (error) {
        console.error("Error creating conversation:", error);
        throw error;
      }
      conversationRecord = data;
    }

    // 5. Save inbound message
    await supabase.from("broker_messages").insert({
      conversation_id: conversationRecord.id,
      broker_id,
      direction: "inbound",
      content: message,
      was_filtered: !filterResult.passed,
      filter_reason: filterResult.reason,
      original_content: !filterResult.passed ? message : null,
    });

    // 6. If message was blocked, don't generate response
    if (!filterResult.passed && filterResult.severity === "block") {
      return new Response(
        JSON.stringify({
          success: false,
          filtered: true,
          reason: filterResult.reason,
          message: "Message contains restricted content. Please rephrase.",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 7. Get conversation history
    const { data: history } = await supabase
      .from("broker_messages")
      .select("direction, content, created_at")
      .eq("conversation_id", conversationRecord.id)
      .order("created_at", { ascending: true })
      .limit(20);

    // 8. Generate AI response
    const aiResponse = await generateBrokerResponse(broker, history || [], message);

    // 9. Check outbound message for filters
    const outboundFilterResult = await checkMessageFilters(supabase, aiResponse);

    // 10. Save outbound message
    const { data: outboundMessage } = await supabase
      .from("broker_messages")
      .insert({
        conversation_id: conversationRecord.id,
        broker_id,
        direction: "outbound",
        content: outboundFilterResult.passed ? aiResponse : "I'll need to consult with my team and get back to you shortly.",
        was_filtered: !outboundFilterResult.passed,
        filter_reason: outboundFilterResult.reason,
        original_content: !outboundFilterResult.passed ? aiResponse : null,
        delivery_status: "pending",
      })
      .select()
      .single();

    // 11. Update conversation
    await supabase
      .from("broker_conversations")
      .update({
        last_message_at: new Date().toISOString(),
        message_count: (conversationRecord.message_count || 0) + 2,
      })
      .eq("id", conversationRecord.id);

    // 12. Update broker stats
    await supabase
      .from("ai_brokers")
      .update({
        current_daily_interactions: broker.current_daily_interactions + 1,
      })
      .eq("id", broker_id);

    // 13. Update or create daily stats
    const today = new Date().toISOString().split("T")[0];
    await supabase.from("broker_daily_stats").upsert(
      {
        broker_id,
        stat_date: today,
        messages_received: 1,
        messages_sent: 1,
      },
      {
        onConflict: "broker_id,stat_date",
      }
    );

    console.log(`Broker chat initiated by employee ${authResult.email} for broker ${broker.name}`);

    return new Response(
      JSON.stringify({
        success: true,
        conversation_id: conversationRecord.id,
        response: outboundFilterResult.passed ? aiResponse : "I'll need to consult with my team and get back to you shortly.",
        broker_name: broker.name,
        message_id: outboundMessage?.id,
        filtered: !outboundFilterResult.passed,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Broker chat error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
