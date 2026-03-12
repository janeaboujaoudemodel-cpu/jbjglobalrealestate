import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const { propertyName, location, price, features, type, developerName, developerDescription, fullPrompt } = body;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const featureList = Array.isArray(features) && features.length > 0
      ? features.slice(0, 8).join(", ")
      : "premium finishes, modern amenities";

    let systemPrompt: string;
    let userPrompt: string;

    // ── Full-generation mode: AI creates everything from a single prompt ──
    if (type === "full-generation" && fullPrompt) {
      systemPrompt = `You are an elite real estate marketing director creating luxury property brochures and presentations for the UAE market. You produce compelling, aspirational content that appeals to high-net-worth investors.

When given a prompt, generate ALL brochure content as structured JSON.`;

      const devContext = developerName
        ? `\nDeveloper context: ${developerName}${developerDescription ? ` — ${developerDescription}` : ''}`
        : '';

      userPrompt = `Based on this brief, generate complete brochure content:

"${fullPrompt}"
${devContext}

Return ONLY valid JSON with these keys:
{
  "title": "Property/project title",
  "headline": "Hero headline for cover",
  "tagline": "Cover tagline/subtitle",
  "description": "3-4 sentence premium property description",
  "features": ["feature1", "feature2", ...] (8-12 key features/amenities)
}

Rules:
- Write in aspirational luxury tone
- Focus on lifestyle, investment value, exclusivity
- No generic phrases like "dream home" or "don't miss out"
- Return ONLY JSON, no markdown or code fences`;

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
            { role: "user", content: userPrompt },
          ],
          max_tokens: 800,
        }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
            status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        if (response.status === 402) {
          return new Response(JSON.stringify({ error: "AI credits exhausted. Please top up your workspace." }), {
            status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        throw new Error(`AI gateway error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content?.trim() || "";

      // Parse JSON from response
      let parsed: Record<string, any> = {};
      try {
        const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        parsed = JSON.parse(cleaned);
      } catch {
        const match = content.match(/\{[\s\S]*\}/);
        if (match) {
          try { parsed = JSON.parse(match[0]); } catch { /* fallback */ }
        }
      }

      return new Response(JSON.stringify({
        title: parsed.title || "",
        headline: parsed.headline || "",
        tagline: parsed.tagline || "",
        description: parsed.description || content,
        features: Array.isArray(parsed.features) ? parsed.features : [],
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Standard description generation ──
    systemPrompt = type === "profile"
      ? "You are an expert real estate marketing copywriter specializing in luxury real estate in the UAE. Write premium, professional marketing copy."
      : "You are an elite real estate marketing specialist creating luxury property brochures for the UAE market. Write compelling, aspirational descriptions that appeal to high-net-worth buyers.";

    const devContext = developerName
      ? `\nDeveloper: ${developerName}${developerDescription ? ` (${developerDescription.slice(0, 200)})` : ''}`
      : '';

    userPrompt = type === "profile"
      ? `Write a premium professional bio (3 sentences) for a real estate agent named "${propertyName}" ${location ? `based in ${location}` : ""}. It should be confident, professional, and highlight expertise.`
      : `Write a premium 3-sentence property description for a real estate brochure:
Property: ${propertyName}
Location: ${location || "UAE"}
${price ? `Price: ${price}` : ""}
Key Features: ${featureList}${devContext}

Write in an aspirational, luxury tone. Focus on lifestyle, investment value, and exclusivity. Keep it concise but impactful. Do NOT use generic phrases like "dream home" or "don't miss out".`;

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
          { role: "user", content: userPrompt },
        ],
        max_tokens: 300,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please top up your workspace." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const description = data.choices?.[0]?.message?.content?.trim() || "";

    return new Response(JSON.stringify({ description }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("brochure-ai error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
