import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

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
    
    const { createClient } = await import("npm:@supabase/supabase-js@2");
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims?.sub) {
      return new Response(
        JSON.stringify({ error: "Unauthorized - invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    const userId = claimsData.claims.sub;
    console.log(`AI Logo Generator request from user: ${userId}`);
    // ========================================

    const { name, industry, style, font, colors, description, seed } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const { primary, secondary, accent } = colors || {};

    const industryDNA: Record<string, string> = {
      "real-estate": "trustworthy, premium, architectural — use strong geometric shapes",
      "technology": "innovative, clean, forward-thinking — use sharp angles and circuits",
      "fashion": "elegant, trendy, aspirational — use flowing curves and clean type",
      "healthcare": "caring, clean, professional — use cross/shield motifs or smooth curves",
      "finance": "secure, premium, authoritative — use shields, pillars, or strong typography",
      "personal": "authentic, unique, memorable — use monogram initials or abstract mark",
      "law": "authoritative, classic, serious — use scales, columns, or bold serif lettermark",
      "creative": "bold, expressive, artistic — use abstract mark, dynamic shapes",
      "restaurant": "warm, inviting, flavorful — use fork/leaf/flame or food-inspired motifs",
    };

    const styleDNA: Record<string, string> = {
      "modern": "clean geometric shapes, sharp angles, flat design, plenty of white space",
      "minimalist": "ultra-simple mark, thin lines, significant negative space, less is more",
      "bold": "thick strokes, strong contrast, heavy geometry, powerful presence",
      "vintage": "circular badge style, distressed edges, classic serif letterforms, timeless badge layout",
      "luxury": "thin elegant lines, premium feel, fine serif or script, refined spacing",
      "playful": "rounded shapes, friendly curves, dynamic angles, energetic composition",
    };

    const fontMap: Record<string, string> = {
      "Georgia, serif": "Georgia, serif (classic, premium)",
      "Arial, sans-serif": "Arial, sans-serif (modern, clean)",
      "Courier New, monospace": "Courier New, monospace (tech, coding)",
      "Palatino, serif": "Palatino, serif (elegant, creative)",
    };

    const chosenFont = fontMap[font] || "Georgia, serif";

    const systemPrompt = `You are a world-class professional SVG logo designer with 20+ years of experience. 
Your logos appear in Fortune 500 companies, prestigious brands, and award-winning agencies.
You create complete, self-contained, visually striking SVG logos.

ABSOLUTE RULES (never break these):
1. Return ONLY the raw SVG element — start with <svg and end with </svg>. Zero explanation, zero markdown, no code blocks.
2. viewBox="0 0 200 200" width="200" height="200" — always
3. Use ONLY these exact colors: Primary ${primary}, Secondary ${secondary}, Accent ${accent}
4. Use ONLY these safe generic font families: Georgia, Arial, "Courier New", Palatino, serif, sans-serif, monospace
5. ZERO external references: no <image> tags, no xlink:href to URLs, no external stylesheets
6. The SVG MUST include BOTH a creative visual logomark AND the company name text
7. All elements must be contained within the 200×200 viewBox
8. Use <defs> with gradients or clip-paths only — no external references

DESIGN MANDATE:
- Create a UNIQUE, MEMORABLE logomark (not just text in a box)
- The logomark should be a creative geometric, abstract, or symbolic shape that represents the brand
- Use the seed number to create genuine variety — different layouts, marks, and compositions each time`;

    const userPrompt = `Design a professional logo for: "${name}"
Industry: ${industry} — ${industryDNA[industry] || "professional, distinctive"}
Style: ${style} — ${styleDNA[style] || "clean and modern"}
Typography: Use ${chosenFont} for the company name
Colors: Primary ${primary} | Secondary ${secondary} | Accent ${accent}
${description ? `Brand context: ${description}` : ""}
Variation seed: ${seed} (use this to create a genuinely different composition, mark shape, and layout)

The logo MUST have:
1. A creative symbolic logomark (geometric shape, abstract mark, or icon) — NOT just a circle with a letter
2. The company name "${name}" as styled text
3. Professional spacing and visual balance
4. Sophisticated use of the color palette with fills, strokes, and opacity variations

Return ONLY the SVG element.`;

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
        max_tokens: 4096,
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

    // Extract SVG from the response (handle cases where AI wraps in markdown)
    const svgMatch = raw.match(/<svg[\s\S]*?<\/svg>/i);
    const svgContent = svgMatch ? svgMatch[0] : "";

    return new Response(
      JSON.stringify({ svgContent }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("ai-logo-generator error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
