import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { tone, style, industry, seed } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const toneMap: Record<string, string> = {
      modern:  "clean lines, bold geometry, high contrast, contemporary feel",
      luxe:    "gold tones, elegant curves, refined opulence, dark rich backgrounds",
      tech:    "neon accents, circuit-like lines, futuristic grids, dark backgrounds",
      minimal: "sparse shapes, subtle transparency, maximum whitespace, muted palette",
    };
    const styleMap: Record<string, string> = {
      geometric:  "triangles, hexagons, rectangles arranged in structured layouts",
      lines:      "diagonal, horizontal and intersecting line patterns",
      futuristic: "angular paths, perspective grids, sharp corner cuts",
      organic:    "fluid curves, ellipses and soft rounded shapes",
      abstract:   "asymmetric overlapping polygons and irregular forms",
      waves:      "sine wave-like smooth curves and arcing paths",
    };
    const industryMap: Record<string, string> = {
      "real-estate": "prestige, property, architecture — dark navy or warm gold tones",
      "technology":  "innovation, digital, data — electric blue, charcoal, neon green",
      "fashion":     "elegance, luxury, style — black, blush, deep purple",
      "finance":     "trust, stability, wealth — dark green, navy, gold",
      "healthcare":  "clean, care, professional — teal, white, soft blue",
      "creative":    "vibrant, artistic, expressive — bold saturated colors",
      "law":         "authority, trust, serious — dark charcoal, burgundy, gold",
      "hospitality": "warmth, welcome, luxury — amber, cream, rich brown",
    };

    const toneDesc = toneMap[tone] || tone;
    const styleDesc = styleMap[style] || style;
    const industryDesc = industryMap[industry] || industry;

    const systemPrompt = `You are an expert SVG business card designer. Return ONLY valid JSON, no markdown, no explanation.`;

    const userPrompt = `Generate a stunning ${tone} business card design for the ${industry} industry.

Tone: ${toneDesc}
Pattern style: ${styleDesc}
Industry: ${industryDesc}
Randomness seed: ${seed}

Return ONLY a valid JSON object with this EXACT structure:
{
  "elements": [
    { "type": "rect",    "x": 0, "y": 0, "width": 350, "height": 200, "fill": "#hexcolor", "fillOpacity": 1 },
    { "type": "circle",  "cx": 290, "cy": 20, "r": 90, "fill": "#hexcolor", "fillOpacity": 0.25 },
    { "type": "polygon", "points": "0,200 80,200 0,120", "fill": "#hexcolor", "fillOpacity": 0.4 },
    { "type": "line",    "x1": 0, "y1": 160, "x2": 350, "y2": 120, "stroke": "#hexcolor", "strokeWidth": 1.5, "strokeOpacity": 0.3, "fillOpacity": 0 },
    { "type": "ellipse", "cx": 310, "cy": 160, "rx": 60, "ry": 40, "fill": "#hexcolor", "fillOpacity": 0.15 }
  ],
  "colors": ["#hexcolor1", "#hexcolor2", "#hexcolor3"],
  "bgColor": "#hexcolor",
  "textColor": "#hexcolor",
  "accentColor": "#hexcolor"
}

STRICT RULES:
1. elements: 5-9 SVG elements. Use a MIX of types: rect, circle, polygon, line, ellipse.
2. All coordinates must fit within 0-350 (x) and 0-200 (y). Elements can slightly overflow for effect.
3. bgColor is the card background — make it rich and intentional.
4. textColor must be highly readable on bgColor (high contrast).
5. Vary fillOpacity between 0.1 and 0.5 for layered depth.
6. The first element MUST be a full background rect (x:0, y:0, width:350, height:200, fillOpacity:1) set to bgColor.
7. Make it look like a real premium business card design — not random.
Return ONLY the JSON.`;

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
        max_tokens: 2048,
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
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found in AI response");

    const parsed = JSON.parse(jsonMatch[0]);
    if (!parsed.elements || !Array.isArray(parsed.elements)) {
      throw new Error("Invalid AI response: missing elements array");
    }

    return new Response(
      JSON.stringify(parsed),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("ai-card-design-generator error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
