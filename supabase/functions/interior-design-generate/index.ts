import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const ALLOWED_ORIGINS = [
  "https://jjglobalcapital.com",
  "https://www.jjglobalcapital.com",
  "http://localhost:5173",
  "http://localhost:8080",
];

function getCorsHeaders(req: Request) {
  const origin = req.headers.get("origin") || "";
  const isAllowed = ALLOWED_ORIGINS.some(allowed => 
    origin === allowed || origin.endsWith(".lovableproject.com") || origin.endsWith(".lovable.app")
  );
  return {
    "Access-Control-Allow-Origin": isAllowed ? origin : ALLOWED_ORIGINS[0],
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const {
      propertyType,
      propertyName,
      propertySize,
      designStyle,
      colorPalette,
      purpose,
      customNotes,
      photos,
      floorPlan,
    } = body ?? {};

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const safe = (v: unknown) => (typeof v === "string" ? v.slice(0, 800) : "");

    const content: any[] = [
      {
        type: "text",
        text: `Generate ONE premium, photorealistic interior design render (a single viewpoint) based on the inputs.

CONTEXT:
- Property type: ${safe(propertyType) || "Not specified"}
- Property name: ${safe(propertyName) || "Not specified"}
- Size: ${safe(propertySize) || "Not specified"}
- Style: ${safe(designStyle) || "Not specified"}
- Color palette: ${safe(colorPalette) || "Not specified"}
- Purpose: ${safe(purpose) || "Not specified"}
- Notes: ${safe(customNotes) || "None"}

REQUIREMENTS:
- Make it look like a high-end Dubai interior.
- Include realistic lighting, materials, and furnishings.
- Output must include an image.
- Also return 3-5 bullet points describing the key design choices.`,
      },
    ];

    const addImage = (value: unknown) => {
      if (typeof value !== "string" || value.length < 10) return;
      const url = value.startsWith("data:") ? value : `data:image/jpeg;base64,${value}`;
      content.push({ type: "image_url", image_url: { url } });
    };

    if (Array.isArray(photos)) {
      for (const p of photos.slice(0, 4)) addImage(p);
    }
    addImage(floorPlan);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image-preview",
        messages: [{ role: "user", content }],
        modalities: ["image", "text"],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      throw new Error(`AI generation failed (${response.status})`);
    }

    const data = await response.json();
    const imageUrl = data?.choices?.[0]?.message?.images?.[0]?.image_url?.url as string | undefined;
    const notes = (data?.choices?.[0]?.message?.content as string | undefined) ?? "";

    if (!imageUrl) {
      throw new Error("No image was generated");
    }

    return new Response(
      JSON.stringify({
        success: true,
        result: {
          images: [imageUrl],
          notes,
          createdAt: new Date().toISOString(),
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("interior-design-generate error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
