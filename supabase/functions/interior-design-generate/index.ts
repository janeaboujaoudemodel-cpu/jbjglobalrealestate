import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

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

// Input validation schema
const RequestSchema = z.object({
  propertyType: z.string().max(100).trim().optional(),
  propertyName: z.string().max(200).trim().optional(),
  propertySize: z.string().max(100).trim().optional(),
  designStyle: z.string().max(100).trim().optional(),
  colorPalette: z.string().max(200).trim().optional(),
  purpose: z.string().max(200).trim().optional(),
  customNotes: z.string().max(1000).trim().optional(),
  photos: z.array(z.string().max(5000000)).max(4).optional(), // Base64 images, max 5MB each
  floorPlan: z.string().max(5000000).optional(), // Base64 image, max 5MB
});

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse and validate input
    const rawBody = await req.json();
    const parseResult = RequestSchema.safeParse(rawBody);

    if (!parseResult.success) {
      console.log('Validation failed:', parseResult.error.errors);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Invalid request format. Please check your inputs.",
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

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
    } = parseResult.data;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const safe = (v: string | undefined) => (v ? v.slice(0, 800) : "Not specified");

    const content: any[] = [
      {
        type: "text",
        text: `Generate ONE premium, photorealistic interior design render (a single viewpoint) based on the inputs.

CONTEXT:
- Property type: ${safe(propertyType)}
- Property name: ${safe(propertyName)}
- Size: ${safe(propertySize)}
- Style: ${safe(designStyle)}
- Color palette: ${safe(colorPalette)}
- Purpose: ${safe(purpose)}
- Notes: ${safe(customNotes)}

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
        error: error instanceof Error ? error.message : "An error occurred",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
