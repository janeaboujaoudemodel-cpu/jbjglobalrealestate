import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized - missing authentication" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
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
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const body = await req.json();
    const { mode, image, backgroundColor, generationPrompt } = body;

    // ── MODE: AI Generate Background (composite person into AI scene) ──
    if (mode === "generate") {
      if (!image) {
        return new Response(
          JSON.stringify({ error: "No image provided for AI generation" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const prompt = generationPrompt || "A modern luxury real estate office with floor-to-ceiling windows and a city skyline view";
      console.log(`AI background generation for user ${userId}: ${prompt}`);

      // Use image generation model to create a composite
      const genResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-pro-image-preview",
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: `Take the person from this image and place them realistically into a new scene: ${prompt}. Keep the person's appearance exactly the same, remove their original background, and composite them naturally into the new environment with proper lighting and perspective. The final image should look photorealistic and professional.`
                },
                {
                  type: "image_url",
                  image_url: { url: image }
                }
              ]
            }
          ],
          max_tokens: 4096,
        }),
      });

      if (!genResponse.ok) {
        if (genResponse.status === 429) {
          return new Response(
            JSON.stringify({ error: "Rate limit exceeded. Please wait a moment and try again." }),
            { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        if (genResponse.status === 402) {
          return new Response(
            JSON.stringify({ error: "AI credits exhausted. Please try again later." }),
            { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        const errText = await genResponse.text();
        console.error("AI generation error:", genResponse.status, errText);
        throw new Error("AI generation failed");
      }

      const genResult = await genResponse.json();
      // Check for generated image in response
      const generatedImage =
        genResult.choices?.[0]?.message?.content?.find?.((c: any) => c.type === "image_url")?.image_url?.url ||
        genResult.choices?.[0]?.message?.images?.[0]?.image_url?.url ||
        genResult.choices?.[0]?.message?.content?.[0]?.image_url?.url;

      if (generatedImage) {
        return new Response(
          JSON.stringify({ success: true, processedImage: generatedImage, mode: "generate" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Fallback: model returned text description instead of image
      const textContent = typeof genResult.choices?.[0]?.message?.content === "string"
        ? genResult.choices?.[0]?.message?.content
        : genResult.choices?.[0]?.message?.content?.[0]?.text;

      console.log("Generation model returned text instead of image:", textContent?.substring(0, 200));
      return new Response(
        JSON.stringify({
          success: false,
          error: "The AI generated a description but could not produce an image directly. Background removal (transparent) has been applied instead.",
          fallbackToRemoval: true,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── MODE: Analyze image for smart removal hints ──
    if (mode === "analyze") {
      if (!image) {
        return new Response(
          JSON.stringify({ error: "No image provided" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const analyzeResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
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
                  text: `Analyze this image and respond with ONLY a valid JSON object (no markdown, no explanation):
{
  "width": <estimated width in px>,
  "height": <estimated height in px>,  
  "aspectRatio": "<e.g. 16:9 or 4:3 or 1:1 or 3:4>",
  "primarySubject": "<person | product | building | vehicle | other>",
  "backgroundComplexity": "<simple | medium | complex>",
  "recommendedBackground": "<transparent | white | blur | office | nature | city>",
  "subjectDescription": "<1 sentence describing the main subject>"
}`
                },
                {
                  type: "image_url",
                  image_url: { url: image }
                }
              ]
            }
          ],
          max_tokens: 500,
        }),
      });

      if (!analyzeResponse.ok) {
        throw new Error("Analysis failed");
      }

      const analyzeResult = await analyzeResponse.json();
      let content = analyzeResult.choices?.[0]?.message?.content || "{}";
      // Strip markdown code blocks if present
      content = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      
      let analysis = {};
      try {
        analysis = JSON.parse(content);
      } catch {
        analysis = { primarySubject: "unknown", backgroundComplexity: "medium" };
      }

      return new Response(
        JSON.stringify({ success: true, analysis }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Default: return success for client-side canvas removal ──
    // The actual background removal is done client-side via canvas API
    // This endpoint is kept for compatibility but client handles removal now
    return new Response(
      JSON.stringify({ success: true, clientSideRemoval: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Background AI error:", error);
    const errorMessage = error instanceof Error ? error.message : "Processing failed";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
