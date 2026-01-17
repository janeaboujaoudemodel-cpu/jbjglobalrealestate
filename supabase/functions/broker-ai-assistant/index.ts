import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// AI Broker Assistant - Internal Use Only
// Provides market explanations, conversation framing, and compliant language suggestions

const SYSTEM_PROMPT = `You are an internal AI assistant for licensed real estate brokers at JBJ GLOBAL REAL ESTATE in Dubai.

Your role is to help brokers:
1. Explain market trends in plain language
2. Suggest compliant conversation framing
3. Provide area-specific narratives based on data
4. Help handle client objections professionally

CRITICAL RULES - YOU MUST FOLLOW:
- NEVER predict future prices or market movements
- NEVER give financial or investment advice
- NEVER promise returns or guarantees
- NEVER use language like "guaranteed", "sure investment", "prices will definitely"
- ALWAYS use descriptive language: "data shows", "historical trends indicate", "market activity suggests"
- ALWAYS reference that insights are based on official Open Data
- ALWAYS remind brokers to let clients make their own decisions

You are helping BROKERS communicate with clients - not advising clients directly.

Response format:
- Keep responses concise and actionable
- Use bullet points for talking points
- Include a "Compliance Check" at the end confirming the response is advice-free

Dubai market terminology:
- Use "RENT" not "lease" or "leasing"
- Reference "BUY · SELL · RENT" as the three transaction types
- Mention specific Dubai areas when relevant`;

interface RequestBody {
  type: "market_explanation" | "objection_handling" | "area_narrative" | "conversation_frame";
  area?: string;
  context?: string;
  clientObjection?: string;
  transactionType?: "buy" | "sell" | "rent";
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Authorization required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized - broker access required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body: RequestBody = await req.json();
    const { type, area, context, clientObjection, transactionType } = body;

    // Build the prompt based on request type
    let userPrompt = "";

    switch (type) {
      case "market_explanation":
        userPrompt = `Help me explain the current market situation in ${area || "Dubai"} to a client interested in ${transactionType || "buy"}ing. 

Current context: ${context || "General market inquiry"}

Provide:
1. A brief market summary (2-3 sentences)
2. Key talking points for the conversation
3. What data sources to reference`;
        break;

      case "objection_handling":
        userPrompt = `A client in ${area || "Dubai"} has raised this objection: "${clientObjection}"

They are interested in ${transactionType || "buy"}ing.

Provide:
1. Understanding of their concern
2. Data-backed response framework
3. Suggested talking points (compliant language only)
4. How to transition the conversation positively`;
        break;

      case "area_narrative":
        userPrompt = `Create a compliant market narrative for ${area || "Dubai"} for a ${transactionType || "buy"} conversation.

Include:
1. Historical context (what has happened)
2. Current market dynamics
3. What makes this area unique
4. Approved phrases to use

Remember: Descriptive only, no predictions.`;
        break;

      case "conversation_frame":
        userPrompt = `Help me frame a conversation with a client about ${transactionType || "buy"}ing in ${area || "Dubai"}.

Context: ${context || "Initial meeting"}

Provide:
1. Opening statements that establish expertise without promises
2. Questions to understand their needs
3. How to present market data professionally
4. Transition phrases for next steps`;
        break;

      default:
        return new Response(
          JSON.stringify({ error: "Invalid request type" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }

    // Call Lovable AI Gateway
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "AI service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI Gateway error:", aiResponse.status, errorText);

      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limits exceeded, please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please contact admin." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ error: "AI service temporarily unavailable" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiData = await aiResponse.json();
    const assistantResponse = aiData.choices?.[0]?.message?.content;

    if (!assistantResponse) {
      return new Response(
        JSON.stringify({ error: "No response generated" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Log usage for audit
    try {
      const supabaseAdmin = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );

      await supabaseAdmin.from("ai_usage_logs").insert({
        function_name: "broker-ai-assistant",
        model: "google/gemini-3-flash-preview",
        success: true,
        user_id: user.id,
      });
    } catch (logErr) {
      console.error("Usage logging error:", logErr);
    }

    return new Response(
      JSON.stringify({
        response: assistantResponse,
        type,
        area,
        transactionType,
        timestamp: new Date().toISOString(),
        disclaimer: "Internal broker guidance based on Open Data. Descriptive only, not financial advice.",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Broker AI Assistant error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
