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
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Analyze this image and determine the focal point / main subject position.
Return ONLY a JSON object with two numbers:
- "x": horizontal position of the subject as a percentage (0 = left edge, 50 = center, 100 = right edge)
- "y": vertical position of the subject as a percentage (0 = top edge, 50 = center, 100 = bottom edge)

Consider: faces, people, main objects, architecture focal points, text, logos.
If there are multiple subjects, pick the most visually prominent one.
If the image has a clear rule-of-thirds composition, respect that.

Example response: {"x": 45, "y": 35}
Return ONLY the JSON, no markdown, no explanation.`,
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
              name: "set_focal_point",
              description: "Set the detected focal point coordinates as percentages",
              parameters: {
                type: "object",
                properties: {
                  x: { type: "number", description: "Horizontal position 0-100 (0=left, 100=right)" },
                  y: { type: "number", description: "Vertical position 0-100 (0=top, 100=bottom)" },
                  subject: { type: "string", description: "Brief description of detected subject" },
                },
                required: ["x", "y"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "set_focal_point" } },
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
      const x = Math.max(0, Math.min(100, Math.round(args.x)));
      const y = Math.max(0, Math.min(100, Math.round(args.y)));
      return new Response(JSON.stringify({ x, y, subject: args.subject || "detected subject" }), {
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
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Default to center
    return new Response(JSON.stringify({ x: 50, y: 50, subject: "center (fallback)" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("smart-crop-detect error:", err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
