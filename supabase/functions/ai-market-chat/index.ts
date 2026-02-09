import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // ========================================
    // AUTHENTICATION REQUIRED
    // ========================================
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized - missing authentication" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Verify the JWT and get user
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims?.sub) {
      console.error("Auth verification failed:", claimsError);
      return new Response(
        JSON.stringify({ error: "Unauthorized - invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = claimsData.claims.sub;
    console.log(`AI Market Chat request from user: ${userId}`);
    // ========================================

    const { question, context } = await req.json();

    if (!question) {
      return new Response(
        JSON.stringify({ error: "Question is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are an expert Dubai real estate market analyst assistant. You provide helpful, accurate information about Dubai's property market, areas, developers, and investment opportunities.

Current Context:
- Property: ${context?.propertyName || 'Not specified'}
- Location: ${context?.location || 'Not specified'}
- Price: ${context?.totalPrice ? `AED ${context.totalPrice.toLocaleString()}` : 'Not specified'}
- Price per sqft: ${context?.pricePerSqft ? `AED ${context.pricePerSqft}` : 'Not specified'}
- Size: ${context?.size ? `${context.size} sqft` : 'Not specified'}
- Bedrooms: ${context?.bedrooms || 'Not specified'}
- Developer: ${context?.developer || 'Not specified'}
- Handover: ${context?.handoverDate || 'Not specified'}
- Amenities: ${context?.amenities?.join(', ') || 'Not specified'}

${context?.insights ? `
AI Analysis Results:
- Investment Rating: ${context.insights.investmentRating}
- Supply/Demand Score: ${context.insights.supplyDemandScore}/10 (${context.insights.supplyDemandLabel})
- Price vs Market: ${context.insights.priceComparisonPercent}% (${context.insights.priceComparisonLabel})
- Area Average per sqft: AED ${context.insights.avgAreaPriceSqft}
- Key Insights: ${context.insights.keyInsights?.join('; ')}
- Risk Factors: ${context.insights.riskFactors?.join('; ')}
` : ''}

Guidelines:
1. Provide accurate, helpful information about Dubai real estate
2. Reference the context when relevant
3. Be concise but thorough
4. Include specific data points when available
5. Always clarify this is general information, not financial advice`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: question },
        ],
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Service temporarily unavailable. Please try again later." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("Failed to get AI response");
    }

    const data = await response.json();
    const answer = data.choices?.[0]?.message?.content || "I couldn't generate a response. Please try again.";

    return new Response(
      JSON.stringify({ answer }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("AI Market Chat error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "An error occurred" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
