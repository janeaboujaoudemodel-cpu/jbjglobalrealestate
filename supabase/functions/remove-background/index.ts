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

    const { image_base64, image_type = "image/jpeg" } = await req.json();

    if (!image_base64) {
      return new Response(JSON.stringify({ error: "Missing image_base64" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const dataUrl = `data:${image_type};base64,${image_base64}`;

    // Use Gemini Vision to analyze and create a precise mask description
    // Then we use that to generate instructions for client-side masking
    const analysisResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Analyze this image for background removal. Respond with ONLY a JSON object:
{
  "subject": "brief description of the main subject",
  "background": "description of the background (solid color/gradient/complex)",
  "bgColorApprox": "#RRGGBB hex of the dominant background color",
  "bgIsSimple": true/false (true if background is a simple solid or near-solid color),
  "bgIsTransparent": false,
  "subjectBounds": {"top": 0-100, "left": 0-100, "right": 0-100, "bottom": 0-100},
  "recommendedTolerance": 20-80 (how aggressive to be with removal),
  "hasFineDetails": true/false (hair, fur, transparent elements),
  "confidence": "high/medium/low"
}
No explanation, just valid JSON.`,
              },
              { type: "image_url", image_url: { url: dataUrl } },
            ],
          },
        ],
        max_tokens: 500,
      }),
    });

    if (!analysisResponse.ok) {
      const errText = await analysisResponse.text();
      console.error("AI analysis error:", analysisResponse.status, errText);
      // Return fallback guidance for client-side processing
      return new Response(JSON.stringify({
        success: false,
        error: "AI analysis failed",
        fallback: true,
        guidance: {
          bgColorApprox: "#FFFFFF",
          bgIsSimple: false,
          recommendedTolerance: 40,
          hasFineDetails: false,
          confidence: "low",
        }
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await analysisResponse.json();
    let rawContent = aiData.choices?.[0]?.message?.content?.trim() || "";

    // Strip markdown code blocks
    rawContent = rawContent.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "").trim();

    let guidance: Record<string, unknown>;
    try {
      guidance = JSON.parse(rawContent);
    } catch {
      guidance = {
        bgColorApprox: "#FFFFFF",
        bgIsSimple: false,
        recommendedTolerance: 40,
        hasFineDetails: false,
        confidence: "low",
      };
    }

    return new Response(JSON.stringify({
      success: true,
      guidance,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: unknown) {
    console.error("Remove background error:", error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : "Background removal failed",
      fallback: true,
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
