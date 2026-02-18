import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { propertyName, location, price, features, type } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const featureList = Array.isArray(features) && features.length > 0
      ? features.slice(0, 8).join(", ")
      : "premium finishes, modern amenities";

    const systemPrompt = type === "profile"
      ? "You are an expert real estate marketing copywriter specializing in luxury real estate in the UAE. Write premium, professional marketing copy."
      : "You are an elite real estate marketing specialist creating luxury property brochures for the UAE market. Write compelling, aspirational descriptions that appeal to high-net-worth buyers.";

    const userPrompt = type === "profile"
      ? `Write a premium professional bio (3 sentences) for a real estate agent named "${propertyName}" ${location ? `based in ${location}` : ""}. It should be confident, professional, and highlight expertise.`
      : `Write a premium 3-sentence property description for a real estate brochure:
Property: ${propertyName}
Location: ${location || "UAE"}
${price ? `Price: ${price}` : ""}
Key Features: ${featureList}

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
