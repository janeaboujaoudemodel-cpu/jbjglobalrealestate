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
    const { prompt, templateType, size, referenceImage } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build the prompt based on template type and user input
    let enhancedPrompt = `Create a professional ${templateType} design for JBJ Global Real Estate. `;
    enhancedPrompt += `Size: ${size}. `;
    enhancedPrompt += `Brand colors: Gold (#D4AF37), Black (#000000), White (#FFFFFF). `;
    enhancedPrompt += `Style: Luxurious, minimalist, premium real estate branding. `;
    enhancedPrompt += `User request: ${prompt}`;

    // Build messages array
    const messages: any[] = [
      {
        role: "user",
        content: referenceImage 
          ? [
              { type: "text", text: enhancedPrompt },
              { type: "image_url", image_url: { url: referenceImage } }
            ]
          : enhancedPrompt
      }
    ];

    console.log("Generating design with prompt:", enhancedPrompt);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image-preview",
        messages,
        modalities: ["image", "text"]
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const assistantMessage = data.choices?.[0]?.message;
    const textContent = assistantMessage?.content || "";
    const images = assistantMessage?.images || [];

    // Extract the first image if available
    const generatedImageUrl = images[0]?.image_url?.url || null;

    return new Response(
      JSON.stringify({ 
        success: true, 
        imageUrl: generatedImageUrl,
        message: textContent,
        templateType,
        size
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Design generation error:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Failed to generate design" 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
