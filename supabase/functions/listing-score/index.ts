import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("AI service not configured");

    const { listing } = await req.json();
    if (!listing) throw new Error("Missing listing data");

    const prompt = `You are a real estate listing quality assessor for JBJ Global Real Estate in the UAE. 
Analyze this property listing submission and provide a quality score and recommendation.

LISTING DATA:
${JSON.stringify(listing, null, 2)}

Evaluate on these criteria (each scored 0-100):
1. COMPLETENESS: Are all essential fields filled? (title, description, price, location, property type, bedrooms, bathrooms, area, images)
2. MARKET_FIT: Is the price reasonable for the area and property type in UAE? Does the description match the property details?
3. DESCRIPTION_QUALITY: Is the description professional, detailed, and free of red flags (spam, unrealistic claims)?
4. MEDIA_QUALITY: Are there sufficient images? Are documents provided?
5. DATA_CONSISTENCY: Do the details make sense together? (e.g., price per sqft in reasonable range, bedrooms match property type)

Return ONLY valid JSON with this exact structure:
{
  "overall_score": <number 0-100>,
  "completeness_score": <number 0-100>,
  "market_fit_score": <number 0-100>,
  "description_quality_score": <number 0-100>,
  "media_score": <number 0-100>,
  "consistency_score": <number 0-100>,
  "recommendation": "<APPROVE or REJECT or NEEDS_REVIEW>",
  "recommendation_reason": "<1-2 sentence explanation>",
  "improvement_suggestions": ["<suggestion 1>", "<suggestion 2>"],
  "red_flags": ["<any concerns>"]
}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You are a professional real estate listing quality assessor. Return ONLY valid JSON, no markdown." },
          { role: "user", content: prompt },
        ],
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI error:", response.status, errText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded, please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      return new Response(JSON.stringify({ error: "AI scoring failed" }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await response.json();
    let rawContent = aiData.choices?.[0]?.message?.content?.trim() || "";
    rawContent = rawContent.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "").trim();

    let scoreData;
    try {
      scoreData = JSON.parse(rawContent);
    } catch {
      return new Response(JSON.stringify({ error: "Failed to parse AI score", raw: rawContent }), {
        status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, score: scoreData }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Listing score error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Scoring failed" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
