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
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const body = await req.json();
    const { mode, image, backgroundColor, generationPrompt } = body;

    // ── MODE: AI Remove Background ──
    if (mode === "remove") {
      if (!image) {
        return new Response(
          JSON.stringify({ error: "No image provided" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log("AI background removal requested");

      const removeResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-image",
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: "Remove the background from this image completely. Return ONLY the subject (person or object) with a perfectly transparent background as a PNG. The cutout must be precise along the edges of the subject — no background remnants, no halo artifacts. Keep all details of the subject intact: hair, skin, clothing, accessories. Do not alter the subject in any way.",
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

      if (!removeResponse.ok) {
        if (removeResponse.status === 429) {
          return new Response(
            JSON.stringify({ error: "Rate limit exceeded. Please wait a moment and try again." }),
            { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        if (removeResponse.status === 402) {
          return new Response(
            JSON.stringify({ error: "AI credits exhausted. Please try again later." }),
            { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        const errText = await removeResponse.text();
        console.error("AI removal error:", removeResponse.status, errText);
        // Signal fallback to client-side
        return new Response(
          JSON.stringify({ success: false, fallbackToClientSide: true }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const removeResult = await removeResponse.json();
      console.log("AI removal response keys:", Object.keys(removeResult));

      // Extract generated image from response
      const choice = removeResult.choices?.[0]?.message;
      const generatedImage =
        choice?.images?.[0]?.image_url?.url ||
        choice?.content?.find?.((c: any) => c.type === "image_url")?.image_url?.url ||
        (Array.isArray(choice?.content)
          ? choice.content.find((c: any) => c.type === "image_url")?.image_url?.url
          : null);

      if (generatedImage) {
        return new Response(
          JSON.stringify({ success: true, processedImage: generatedImage, mode: "remove" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Model returned text instead of image — fall back to client-side
      const textContent = typeof choice?.content === "string"
        ? choice.content
        : choice?.content?.[0]?.text;
      console.log("Removal model returned text:", textContent?.substring(0, 200));

      return new Response(
        JSON.stringify({ success: false, fallbackToClientSide: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── MODE: AI Generate Background (composite person into AI scene) ──
    if (mode === "generate") {
      if (!image) {
        return new Response(
          JSON.stringify({ error: "No image provided for AI generation" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const prompt = generationPrompt || "A modern luxury real estate office with floor-to-ceiling windows and a city skyline view";
      console.log(`AI background generation: ${prompt}`);

      const genResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-image",
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: `Take the person from this image, remove their original background completely, and realistically composite them into this new scene: ${prompt}. Keep the person's appearance exactly the same. Match the lighting and perspective naturally. The final image should look photorealistic and professional.`,
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
      const genChoice = genResult.choices?.[0]?.message;
      const generatedImage =
        genChoice?.images?.[0]?.image_url?.url ||
        genChoice?.content?.find?.((c: any) => c.type === "image_url")?.image_url?.url ||
        (Array.isArray(genChoice?.content)
          ? genChoice.content.find((c: any) => c.type === "image_url")?.image_url?.url
          : null);

      if (generatedImage) {
        return new Response(
          JSON.stringify({ success: true, processedImage: generatedImage, mode: "generate" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Fallback: model returned text instead of image
      console.log("Generation model returned text instead of image");
      return new Response(
        JSON.stringify({
          success: false,
          error: "AI could not generate the scene image. Background removal (transparent) has been applied instead.",
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
}`,
                },
                {
                  type: "image_url",
                  image_url: { url: image },
                },
              ],
            },
          ],
          max_tokens: 500,
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
