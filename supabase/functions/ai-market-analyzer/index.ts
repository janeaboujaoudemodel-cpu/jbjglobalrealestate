import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AnalyzerRequest {
  type: 'property' | 'area' | 'community';
  name: string;
  location?: string;
  pricePerSqft?: number;
  totalPrice?: number;
  size?: number;
  bedrooms?: number;
  developer?: string;
  amenities?: string[];
  handoverDate?: string;
}

interface MarketInsight {
  supplyDemandScore: number;
  supplyDemandLabel: string;
  priceComparisonLabel: string;
  priceComparisonPercent: number;
  investmentRating: string;
  keyInsights: string[];
  riskFactors: string[];
  avgAreaPriceSqft: number;
  summary: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const request: AnalyzerRequest = await req.json();

    // Build cache key from request
    const cacheSlug = `${request.type}-${(request.name || '').toLowerCase().replace(/\s+/g, '-')}-${(request.location || '').toLowerCase().replace(/\s+/g, '-')}`;

    // Check DB cache first (24-hour TTL)
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: cached } = await supabase
      .from("project_ai_cache")
      .select("analysis_json, generated_at")
      .eq("project_slug", cacheSlug)
      .maybeSingle();

    if (cached) {
      const age = Date.now() - new Date(cached.generated_at).getTime();
      if (age < 24 * 60 * 60 * 1000) {
        return new Response(JSON.stringify(cached.analysis_json), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }
    
    // Build the analysis prompt based on request type
    const todayDate = new Date().toISOString().split('T')[0];
    const systemPrompt = `You are an expert UAE real estate market analyst. Analyze the property/area data and provide structured market insights.

IMPORTANT COMPLIANCE RULES:
- Do NOT provide specific investment advice or guarantee returns
- Do NOT predict future prices
- Present data-driven observations only
- Use phrases like "historically", "based on market data", "typically"

DELIVERY TIMELINE RULES:
- Today's date is ${todayDate}
- ONLY flag "extended delivery timeline" as a risk if the handover date is MORE than 4 years from today
- If handover is within 1-3 years, this is a NORMAL timeline — do NOT mention it as a risk
- If handover is within 1 year or already handed over, mention it as a POSITIVE factor (near-term or ready)

You must respond using the suggest_market_insights function with structured data.`;

    const userPrompt = request.type === 'property' 
      ? `Analyze this property listing in Dubai/UAE:
- Property: ${request.name}
- Location: ${request.location || 'Dubai'}
- Price per sqft: AED ${request.pricePerSqft?.toLocaleString() || 'N/A'}
- Total Price: AED ${request.totalPrice?.toLocaleString() || 'N/A'}
- Size: ${request.size?.toLocaleString() || 'N/A'} sqft
- Bedrooms: ${request.bedrooms || 'N/A'}
- Developer: ${request.developer || 'N/A'}
- Handover: ${request.handoverDate || 'N/A'}
- Amenities: ${request.amenities?.join(', ') || 'Standard'}

Provide market context including supply/demand dynamics, price comparison to similar areas, and key considerations for investors.`
      : `Analyze this area/community in Dubai/UAE for real estate investment:
- Area: ${request.name}
- Location: ${request.location || 'Dubai'}

Provide market context including supply/demand dynamics, typical price per sqft, rental yields, and key considerations for investors.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      signal: AbortSignal.timeout(20000),
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "suggest_market_insights",
              description: "Return structured market analysis data for the property or area",
              parameters: {
                type: "object",
                properties: {
                  supplyDemandScore: {
                    type: "number",
                    description: "Score from 1-10 where 10 is highest demand relative to supply"
                  },
                  supplyDemandLabel: {
                    type: "string",
                    enum: ["Low Demand", "Moderate Demand", "High Demand", "Very High Demand"],
                    description: "Human readable supply/demand status"
                  },
                  priceComparisonLabel: {
                    type: "string",
                    enum: ["Below Market", "At Market", "Slightly Above Market", "Above Market", "Premium Pricing"],
                    description: "How the price compares to similar properties/areas"
                  },
                  priceComparisonPercent: {
                    type: "number",
                    description: "Percentage difference from market average (-20 to +30 range typical)"
                  },
                  investmentRating: {
                    type: "string",
                    enum: ["Strong Consideration", "Worth Considering", "Neutral", "Monitor Closely"],
                    description: "Overall investment consideration rating (not advice)"
                  },
                  avgAreaPriceSqft: {
                    type: "number",
                    description: "Average price per sqft in AED for this area"
                  },
                  keyInsights: {
                    type: "array",
                    items: { type: "string" },
                    description: "3-5 key positive insights about this property/area"
                  },
                  riskFactors: {
                    type: "array",
                    items: { type: "string" },
                    description: "2-3 risk factors or considerations"
                  },
                  summary: {
                    type: "string",
                    description: "2-3 sentence executive summary of the market analysis"
                  }
                },
                required: ["supplyDemandScore", "supplyDemandLabel", "priceComparisonLabel", "priceComparisonPercent", "investmentRating", "avgAreaPriceSqft", "keyInsights", "riskFactors", "summary"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "suggest_market_insights" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limits exceeded, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits to your workspace." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    
    // Extract the function call result
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall || toolCall.function.name !== "suggest_market_insights") {
      throw new Error("Invalid AI response structure");
    }

    const insights: MarketInsight = JSON.parse(toolCall.function.arguments);

    // Cache result in DB
    await supabase
      .from("project_ai_cache")
      .upsert({ project_slug: cacheSlug, analysis_json: insights, generated_at: new Date().toISOString() });

    return new Response(JSON.stringify(insights), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("AI Market Analyzer error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
