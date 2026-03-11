import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Validate JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify the user
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check CRM access
    const { data: crmProfile } = await supabase
      .from("crm_profiles")
      .select("crm_role")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .single();

    if (!crmProfile) {
      return new Response(JSON.stringify({ error: "No CRM access" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { lead, type = "score" } = await req.json();
    if (!lead) {
      return new Response(JSON.stringify({ error: "Lead data required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "AI service not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Sanitize lead data — never send raw PII to AI
    const sanitizedLead = {
      has_email: !!lead.email_lower,
      has_phone: !!lead.phone_e164,
      nationality: lead.nationality || "unknown",
      country: lead.current_location_country || "unknown",
      source: lead.source || "unknown",
      created_days_ago: lead.created_at 
        ? Math.floor((Date.now() - new Date(lead.created_at).getTime()) / 86400000)
        : 0,
      activity_count: lead.activity_count || 0,
      pipeline_stage: lead.pipeline_stage || "new",
      tags: lead.tags || [],
      vip: lead.vip || false,
    };

    let systemPrompt = "";
    let userPrompt = "";

    if (type === "score") {
      systemPrompt = `You are a CRM lead scoring AI for a luxury real estate company in Dubai. Analyze lead data and return a JSON response using the suggest_score tool. Score from 0-100 based on engagement potential, profile completeness, and timing. Provide actionable next-best-action.`;
      userPrompt = `Analyze this lead: ${JSON.stringify(sanitizedLead)}`;
    } else if (type === "summary") {
      systemPrompt = `You are a CRM assistant for a luxury Dubai real estate company. Summarize the lead profile in one professional paragraph. Be concise and actionable.`;
      userPrompt = `Summarize this lead profile: ${JSON.stringify(sanitizedLead)}`;
    } else if (type === "next_action") {
      systemPrompt = `You are a real estate sales coach. Based on the lead data, suggest the single best next action the broker should take. Be specific and practical.`;
      userPrompt = `What should the broker do next for this lead? ${JSON.stringify(sanitizedLead)}`;
    }

    const body: Record<string, unknown> = {
      model: "google/gemini-3-flash-preview",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    };

    if (type === "score") {
      body.tools = [
        {
          type: "function",
          function: {
            name: "suggest_score",
            description: "Return lead scoring analysis",
            parameters: {
              type: "object",
              properties: {
                score: { type: "number", description: "Overall lead score 0-100" },
                engagement: { type: "number", description: "Engagement score 0-100" },
                profile: { type: "number", description: "Profile completeness 0-100" },
                timing: { type: "number", description: "Timing/urgency score 0-100" },
                qualification: { type: "string", enum: ["hot", "warm", "cold", "unqualified"] },
                next_action: { type: "string", description: "Recommended next action" },
                duplicate_risk: { type: "string", enum: ["low", "medium", "high"] },
                summary: { type: "string", description: "One-line lead summary" },
                insights: {
                  type: "array",
                  items: { type: "string" },
                  description: "Key insights about the lead"
                },
              },
              required: ["score", "qualification", "next_action", "summary", "insights"],
              additionalProperties: false,
            },
          },
        },
      ];
      body.tool_choice = { type: "function", function: { name: "suggest_score" } };
    }

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errorText);
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited, please try again later" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "AI analysis failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();

    let result;
    if (type === "score") {
      const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
      if (toolCall?.function?.arguments) {
        result = JSON.parse(toolCall.function.arguments);
      } else {
        result = { score: 50, qualification: "warm", next_action: "Follow up with a call", summary: "Lead requires further engagement", insights: ["Insufficient data for detailed analysis"] };
      }
    } else {
      result = { content: aiData.choices?.[0]?.message?.content || "Unable to generate analysis" };
    }

    // Log AI usage
    await supabase.from("ai_usage_logs").insert({
      user_id: user.id,
      function_name: "ai-lead-intelligence",
      model: "google/gemini-3-flash-preview",
      success: true,
    });

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-lead-intelligence error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
