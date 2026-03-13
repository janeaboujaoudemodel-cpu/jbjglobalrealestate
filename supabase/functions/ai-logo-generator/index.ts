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

    const body = await req.json();
    const {
      name, industry, style, font, colors, description, seed,
      mode = "generate",
      logoType = "full",
      currentSvg,
      refineInstruction,
      websiteUrl,
    } = body;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // ─── Mode: extract-colors ─────────────────────────────────────────────
    if (mode === "extract-colors" && websiteUrl) {
      const colorPrompt = `Analyze the website at ${websiteUrl} and suggest a professional 3-color brand palette. Return ONLY a JSON object with this exact format: {"primary":"#hex","secondary":"#hex","accent":"#hex"}. No explanation.`;
      
      const colorResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [{ role: "user", content: colorPrompt }],
          stream: false,
          max_tokens: 200,
        }),
      });

      if (!colorResp.ok) {
        const errText = await colorResp.text();
        console.error("Color extraction error:", errText);
        return new Response(
          JSON.stringify({ colors: null }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const colorResult = await colorResp.json();
      const raw = colorResult.choices?.[0]?.message?.content?.trim() || "";
      try {
        const jsonMatch = raw.match(/\{[\s\S]*?\}/);
        const extracted = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
        return new Response(
          JSON.stringify({ colors: extracted }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } catch {
        return new Response(
          JSON.stringify({ colors: null }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // ─── Common setup ─────────────────────────────────────────────────────
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

    const logoTypeInstructions: Record<string, string> = {
      "full": "Create BOTH a creative visual logomark AND the company name text",
      "wordmark": "Create ONLY stylized text of the company name — NO icon or symbol, just beautifully designed typography",
      "monogram": "Create ONLY a monogram using the company initials — NO full company name text, just the initials in a creative arrangement",
      "icon": "Create ONLY an abstract symbol/icon — NO text at all, just a memorable visual mark",
    };

    const systemPrompt = `You are a world-class professional SVG logo designer with 20+ years of experience. 
Your logos appear in Fortune 500 companies, prestigious brands, and award-winning agencies.
You create complete, self-contained, visually striking SVG logos.

ABSOLUTE RULES (never break these):
1. Return ONLY the raw SVG element — start with <svg and end with </svg>. Zero explanation, zero markdown, no code blocks.
2. viewBox="0 0 200 200" width="200" height="200" — always
3. Use ONLY these exact colors: Primary ${primary}, Secondary ${secondary}, Accent ${accent}
4. Use ONLY these safe generic font families: Georgia, Arial, "Courier New", Palatino, serif, sans-serif, monospace
5. ZERO external references: no <image> tags, no xlink:href to URLs, no external stylesheets
6. ${logoTypeInstructions[logoType] || logoTypeInstructions["full"]}
7. All elements must be contained within the 200×200 viewBox
8. Use <defs> with gradients or clip-paths only — no external references

DESIGN MANDATE:
- Create a UNIQUE, MEMORABLE logo (not just text in a box)
- Use the seed number to create genuine variety — different layouts, marks, and compositions each time`;

    // ─── Mode: refine ─────────────────────────────────────────────────────
    if (mode === "refine" && currentSvg && refineInstruction) {
      const refineUserPrompt = `Here is the current SVG logo:
\`\`\`
${currentSvg}
\`\`\`

The user wants to modify this logo. Their instruction: "${refineInstruction}"

Apply the requested changes to the SVG logo while maintaining the same overall style and colors (Primary ${primary}, Secondary ${secondary}, Accent ${accent}).
Return ONLY the modified SVG element — start with <svg and end with </svg>.`;

      const refineResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: refineUserPrompt },
          ],
          stream: false,
          max_tokens: 4096,
        }),
      });

      if (!refineResp.ok) {
        if (refineResp.status === 429) {
          return new Response(JSON.stringify({ error: "Rate limit exceeded. Try again in a moment." }),
            { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
        const errText = await refineResp.text();
        console.error("AI refine error:", refineResp.status, errText);
        throw new Error("AI gateway error: " + refineResp.status);
      }

      const refineResult = await refineResp.json();
      const refineRaw = refineResult.choices?.[0]?.message?.content?.trim() || "";
      const refineSvgMatch = refineRaw.match(/<svg[\s\S]*?<\/svg>/i);
      return new Response(
        JSON.stringify({ svgContent: refineSvgMatch ? refineSvgMatch[0] : "" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ─── Mode: generate (default) ─────────────────────────────────────────
    const userPrompt = `Design a professional logo for: "${name}"
Industry: ${industry} — ${industryDNA[industry] || "professional, distinctive"}
Style: ${style} — ${styleDNA[style] || "clean and modern"}
Logo Type: ${logoType} — ${logoTypeInstructions[logoType] || logoTypeInstructions["full"]}
Typography: Use ${chosenFont} for any text
Colors: Primary ${primary} | Secondary ${secondary} | Accent ${accent}
${description ? `Brand context: ${description}` : ""}
Variation seed: ${seed} (use this to create a genuinely different composition, mark shape, and layout)

The logo MUST have:
1. ${logoType === "icon" ? "A creative symbolic mark only — NO text" : logoType === "monogram" ? "Creative initials arrangement — NO full name" : logoType === "wordmark" ? "Beautifully designed typography — NO icon" : "A creative symbolic logomark AND the company name"}
2. Professional spacing and visual balance
3. Sophisticated use of the color palette with fills, strokes, and opacity variations

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
