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

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY not configured");
      return new Response(
        JSON.stringify({ success: false, fallbackToClientSide: true, reason: "API key not configured" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();
    const { mode, image, generationPrompt } = body;

    if (!image) {
      return new Response(
        JSON.stringify({ error: "No image provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Helper to extract image URL from AI response
    function extractImageFromResponse(result: any): string | null {
      const choice = result.choices?.[0]?.message;
      if (!choice) return null;

      // Check images array (some models return this)
      if (choice.images?.[0]?.image_url?.url) return choice.images[0].image_url.url;

      // Check content array for image_url type
      if (Array.isArray(choice.content)) {
        for (const part of choice.content) {
          if (part.type === "image_url" && part.image_url?.url) return part.image_url.url;
        }
      }

      return null;
    }

    // ── MODE: AI Remove Background ──
    if (mode === "remove") {
      console.log("AI background removal requested — using gemini-3-pro-image-preview");

      const removeResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
                  text: "Remove the background from this image completely. Keep ONLY the subject (person, object, or product) with a perfectly transparent background. The cutout must be precise — no background remnants, no halo artifacts. Preserve all details: hair, skin, clothing, accessories. Do not change, alter, or retouch the subject in any way. Return the result as a PNG image with alpha transparency.",
                },
                {
                  type: "image_url",
                  image_url: { url: image },
                },
              ],
            },
          ],
          modalities: ["image", "text"],
        }),
      });

      console.log("AI remove response status:", removeResponse.status);

      if (!removeResponse.ok) {
        const errText = await removeResponse.text();
        console.error("AI removal error:", removeResponse.status, errText.substring(0, 500));

        if (removeResponse.status === 429) {
          return new Response(
            JSON.stringify({ success: false, fallbackToClientSide: true, reason: "rate_limit" }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        if (removeResponse.status === 402) {
          return new Response(
            JSON.stringify({ success: false, fallbackToClientSide: true, reason: "credits_exhausted" }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        // Any other error — fall back
        return new Response(
          JSON.stringify({ success: false, fallbackToClientSide: true, reason: `api_error_${removeResponse.status}` }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const removeResult = await removeResponse.json();
      console.log("AI removal result choices count:", removeResult.choices?.length);

      const generatedImage = extractImageFromResponse(removeResult);

      if (generatedImage) {
        console.log("AI removal succeeded — image returned");
        return new Response(
          JSON.stringify({ success: true, processedImage: generatedImage, mode: "remove" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Model returned text instead of image — log and fall back
      const choice = removeResult.choices?.[0]?.message;
      const textContent = typeof choice?.content === "string"
        ? choice.content
        : Array.isArray(choice?.content) ? choice.content.find((c: any) => c.type === "text")?.text : "";
      console.log("AI removal returned text (no image):", textContent?.substring(0, 300));

      return new Response(
        JSON.stringify({ success: false, fallbackToClientSide: true, reason: "no_image_in_response" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── MODE: AI Generate Background (composite person into AI scene) ──
    if (mode === "generate") {
      const prompt = generationPrompt || "A modern luxury real estate office with floor-to-ceiling windows and a city skyline view";
      console.log(`AI background generation requested: ${prompt.substring(0, 100)}`);

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
                  text: `Take the person from this image, completely remove their original background, and realistically composite them into this new scene: ${prompt}. Keep the person's appearance exactly the same — same face, clothes, pose. Match the lighting and perspective naturally so it looks like they are actually standing in that scene. The final image must look photorealistic and professional.`,
                },
                {
                  type: "image_url",
                  image_url: { url: image },
                },
              ],
            },
          ],
          modalities: ["image", "text"],
        }),
      });

      console.log("AI generate response status:", genResponse.status);

      if (!genResponse.ok) {
        const errText = await genResponse.text();
        console.error("AI generation error:", genResponse.status, errText.substring(0, 500));

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
        throw new Error(`AI generation failed with status ${genResponse.status}`);
      }

      const genResult = await genResponse.json();
      const generatedImage = extractImageFromResponse(genResult);

      if (generatedImage) {
        console.log("AI generation succeeded");
        return new Response(
          JSON.stringify({ success: true, processedImage: generatedImage, mode: "generate" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log("Generation model returned text instead of image");
      return new Response(
        JSON.stringify({
          success: false,
          error: "AI could not generate the scene image. Background removal has been applied instead.",
          fallbackToRemoval: true,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── MODE: Analyze image for smart removal hints ──
    if (mode === "analyze") {
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
  "primarySubject": "<person | product | building | vehicle | other>",
  "backgroundComplexity": "<simple | medium | complex>",
  "recommendedBackground": "<transparent | white | navy | gray | black | gradient-blue>",
  "subjectDescription": "<1 sentence describing the main subject>"
}`,
                },
                {
                  type: "image_url",
                  image_url: { url: image },
                },
              ],
            },
          ],
          max_tokens: 300,
        }),
      });

      if (!analyzeResponse.ok) {
        throw new Error("Analysis failed");
      }

      const analyzeResult = await analyzeResponse.json();
      let content = analyzeResult.choices?.[0]?.message?.content || "{}";
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

    return new Response(
      JSON.stringify({ success: false, fallbackToClientSide: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Background AI error:", error);
    const errorMessage = error instanceof Error ? error.message : "Processing failed";
    return new Response(
      JSON.stringify({ error: errorMessage, fallbackToClientSide: true }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
