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
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const { image, backgroundColor } = await req.json();
    
    if (!image) {
      return new Response(
        JSON.stringify({ error: "No image provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Determine background instruction based on selection
    let backgroundInstruction = "Make the background completely transparent (alpha channel).";
    
    if (backgroundColor === "white") {
      backgroundInstruction = "Replace the background with pure white (#FFFFFF).";
    } else if (backgroundColor === "black") {
      backgroundInstruction = "Replace the background with pure black (#000000).";
    } else if (backgroundColor === "gold") {
      backgroundInstruction = "Replace the background with a luxurious gold color (#C8A766).";
    } else if (backgroundColor === "blur") {
      backgroundInstruction = "Keep the original background but apply a strong gaussian blur effect to it while keeping the subject sharp.";
    } else if (backgroundColor === "gradient-gold") {
      backgroundInstruction = "Replace the background with an elegant gradient from gold (#C8A766) at the top to dark amber (#8B6914) at the bottom.";
    }

    // Use Lovable AI image generation/editing capability
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
                text: `Remove the background from this image. ${backgroundInstruction} Keep the main subject (person, object, or product) perfectly intact with clean, precise edges. This is for professional real estate marketing, so quality is paramount.`
              },
              {
                type: "image_url",
                image_url: {
                  url: image
                }
              }
            ]
          }
        ],
        modalities: ["image", "text"],
        max_tokens: 1000,
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
          JSON.stringify({ error: "AI credits exhausted. Please try again later." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      const errorText = await response.text();
      console.error("AI background removal error:", response.status, errorText);
      throw new Error("Failed to process image");
    }

    const result = await response.json();
    
    // Extract the generated image from the response
    const generatedImage = result.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    
    if (!generatedImage) {
      // If no image was generated, return the original (AI couldn't process)
      console.log("No image generated, returning guidance");
      return new Response(
        JSON.stringify({ 
          success: false,
          error: "Could not process image. The AI may not support this image format or the subject is unclear.",
          originalImage: image
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        processedImage: generatedImage,
        backgroundColor: backgroundColor || "transparent"
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Background removal error:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to process image";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
