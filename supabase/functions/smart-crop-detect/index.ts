import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const { imageBase64 } = await req.json();
    if (!imageBase64) {
      return new Response(JSON.stringify({ error: "imageBase64 is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `You are an expert image composition analyst for a professional photo cropping tool.

Analyze this image in detail and identify:
1. The PRIMARY focal point — the single most important subject or area of interest
2. ALL secondary subjects worth preserving when cropping
3. The overall composition style
4. A confidence score for your detection

Consider these visual elements in priority order:
- Human faces and eyes (highest priority)
- People / full body poses
- Text, logos, branding elements
- Architectural focal points (vanishing points, key structures)
- Product placement / hero objects
- Animals
- Natural landmarks
- Rule-of-thirds intersection points
- Leading lines convergence

For real estate / property images specifically:
- Identify the hero feature (pool, view, facade, interior highlight)
- Preserve key selling points (balcony views, kitchen islands, etc.)

Return your analysis using the provided tool.`,
              },
              {
                type: "image_url",
                image_url: { url: imageBase64 },
              },
            ],
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "set_smart_crop",
              description: "Set the detected focal point and composition analysis for smart cropping",
              parameters: {
                type: "object",
                properties: {
                  x: { type: "number", description: "Primary focal point horizontal position 0-100 (0=left, 100=right)" },
                  y: { type: "number", description: "Primary focal point vertical position 0-100 (0=top, 100=bottom)" },
                  subject: { type: "string", description: "Brief description of the primary subject (e.g., 'woman's face', 'building facade', 'product bottle')" },
                  confidence: { type: "number", description: "Detection confidence 0-100" },
                  composition: {
                    type: "string",
                    enum: ["center", "rule-of-thirds", "golden-ratio", "symmetrical", "diagonal", "frame-within-frame", "leading-lines", "scattered"],
                    description: "Detected composition style"
                  },
                  secondary_subjects: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        x: { type: "number" },
                        y: { type: "number" },
                        label: { type: "string" },
                      },
                      required: ["x", "y", "label"],
                      additionalProperties: false,
                    },
                    description: "Up to 3 secondary subjects worth preserving"
                  },
                  safe_zone: {
                    type: "object",
                    properties: {
                      top: { type: "number", description: "Percentage from top that should be preserved (0-50)" },
                      bottom: { type: "number", description: "Percentage from bottom that should be preserved (0-50)" },
                      left: { type: "number", description: "Percentage from left that should be preserved (0-50)" },
                      right: { type: "number", description: "Percentage from right that should be preserved (0-50)" },
                    },
                    required: ["top", "bottom", "left", "right"],
                    additionalProperties: false,
                    description: "Safe zone margins - the area containing all important content"
                  },
                },
                required: ["x", "y", "subject", "confidence", "composition"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "set_smart_crop" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();

    // Extract from tool call
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      const args = JSON.parse(toolCall.function.arguments);
      const result = {
        x: Math.max(0, Math.min(100, Math.round(args.x ?? 50))),
        y: Math.max(0, Math.min(100, Math.round(args.y ?? 50))),
        subject: args.subject || "detected subject",
        confidence: Math.max(0, Math.min(100, Math.round(args.confidence ?? 70))),
        composition: args.composition || "center",
        secondary_subjects: (args.secondary_subjects || []).slice(0, 3).map((s: any) => ({
          x: Math.max(0, Math.min(100, Math.round(s.x))),
          y: Math.max(0, Math.min(100, Math.round(s.y))),
          label: s.label || "subject",
        })),
        safe_zone: args.safe_zone ? {
          top: Math.max(0, Math.min(50, Math.round(args.safe_zone.top ?? 10))),
          bottom: Math.max(0, Math.min(50, Math.round(args.safe_zone.bottom ?? 10))),
          left: Math.max(0, Math.min(50, Math.round(args.safe_zone.left ?? 10))),
          right: Math.max(0, Math.min(50, Math.round(args.safe_zone.right ?? 10))),
        } : { top: 10, bottom: 10, left: 10, right: 10 },
      };

      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fallback: try parsing content as JSON
    const content = data.choices?.[0]?.message?.content || "";
    const match = content.match(/\{[^}]*"x"\s*:\s*(\d+)[^}]*"y"\s*:\s*(\d+)[^}]*/);
    if (match) {
      return new Response(JSON.stringify({
        x: Math.max(0, Math.min(100, parseInt(match[1]))),
        y: Math.max(0, Math.min(100, parseInt(match[2]))),
        subject: "detected subject",
        confidence: 60,
        composition: "center",
        secondary_subjects: [],
        safe_zone: { top: 10, bottom: 10, left: 10, right: 10 },
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Default to center
    return new Response(JSON.stringify({
      x: 50, y: 50,
      subject: "center (fallback)",
      confidence: 30,
      composition: "center",
      secondary_subjects: [],
      safe_zone: { top: 10, bottom: 10, left: 10, right: 10 },
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("smart-crop-detect error:", err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
