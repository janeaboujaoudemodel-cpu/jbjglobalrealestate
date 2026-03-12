import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Auth check
    const authHeader = req.headers.get("authorization");
    if (!authHeader) throw new Error("Missing authorization header");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const sb = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authErr } = await sb.auth.getUser();
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { prompt, colorPalette, industry, tone, count } = await req.json();
    const batchSize = Math.min(count || 12, 20);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `You are an expert SVG business card designer. You MUST return ONLY a valid JSON array. No markdown, no explanation. Each item is a complete card design.`;

    const userPrompt = `Generate ${batchSize} UNIQUE, stunning business card designs.

${prompt ? `User description: "${prompt}"` : ""}
${colorPalette ? `Color palette preference: ${colorPalette}` : ""}
Industry: ${industry || "general"}
Tone: ${tone || "modern"}

Return ONLY a valid JSON array of ${batchSize} objects, each with this structure:
{
  "id": "<unique-short-id>",
  "name": "<descriptive name like 'Midnight Luxe' or 'Ocean Breeze'>",
  "elements": [
    { "type": "rect", "x": 0, "y": 0, "width": 350, "height": 200, "fill": "#hexcolor", "fillOpacity": 1 },
    { "type": "circle", "cx": 290, "cy": 20, "r": 90, "fill": "#hexcolor", "fillOpacity": 0.25 },
    ...more elements (5-8 total)
  ],
  "colors": ["#hex1", "#hex2", "#hex3"],
  "bgColor": "#hexcolor",
  "textColor": "#hexcolor",
  "accentColor": "#hexcolor",
  "category": "<one of: elegant, bold, minimal, creative, corporate, artistic>"
}

RULES:
1. Every design MUST look different — vary shapes, colors, layouts, opacity patterns.
2. All coordinates fit within 0-350 (x) and 0-200 (y).
3. First element MUST be a full background rect (x:0, y:0, width:350, height:200, fillOpacity:1).
4. textColor must contrast well against bgColor.
5. Use rich, premium color palettes — avoid generic/dull colors.
6. Mix element types: rect, circle, polygon, line, ellipse.
7. Make each look like a real premium business card background.
8. ${tone === "luxe" || tone === "luxury" ? "Use champagne gold (#C8A766), deep navy, rich burgundy, and matte black tones — NOT bright yellow." : ""}
Return ONLY the JSON array.`;

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
        stream: false,
        max_tokens: 16384,
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
          JSON.stringify({ error: "AI usage credits required. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      throw new Error("AI gateway error: " + response.status);
    }

    const result = await response.json();
    const raw: string = result.choices?.[0]?.message?.content?.trim() || "";

    // Strip markdown if present
    const cleaned = raw.replace(/```json\n?/gi, "").replace(/```\n?/gi, "").trim();
    const arrayMatch = cleaned.match(/\[[\s\S]*\]/);
    if (!arrayMatch) throw new Error("No JSON array found in AI response");

    const parsed = JSON.parse(arrayMatch[0]);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      throw new Error("Invalid AI response: not a valid array");
    }

    // Validate each design
    const validDesigns = parsed.filter((d: any) =>
      d.elements && Array.isArray(d.elements) && d.bgColor && d.textColor
    ).map((d: any, i: number) => ({
      ...d,
      id: d.id || `design-${i}-${Date.now()}`,
      name: d.name || `Design ${i + 1}`,
    }));

    return new Response(
      JSON.stringify({ designs: validDesigns, total: validDesigns.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("ai-card-gallery-generator error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
