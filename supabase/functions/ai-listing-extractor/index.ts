import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("AI service not configured");

    const { documents, listing_category } = await req.json();

    if (!documents || !Array.isArray(documents) || documents.length === 0) {
      throw new Error("No documents provided");
    }

    // Build content array for the AI model
    const contentParts: any[] = [];

    // System instruction
    contentParts.push({
      type: "text",
      text: `You are an expert real estate listing data extractor for the UAE property market. 
Analyze the uploaded documents (PDFs, images, brochures, floor plans, fact sheets) and extract ALL property listing information.

Category: ${listing_category || 'resale'}

Return ONLY valid JSON with this structure:
{
  "title": "Property listing title (e.g. '3BR Apartment in Dubai Marina')",
  "description": "Professional 2-3 paragraph listing description",
  "listing_type": "sale|rent|holiday_home",
  "listing_category": "resale|ready|off_plan|land|rental",
  "property_type": "apartment|villa|townhouse|penthouse|studio|land|office|warehouse|shop",
  "developer_name": "Developer name if mentioned",
  "project_name": "Project/building name",
  "location": "Area/community name",
  "emirate": "Dubai|Abu Dhabi|Sharjah|etc",
  "area": "Sub-area or community",
  "bedrooms": null or number (0 for studio),
  "bathrooms": null or number,
  "area_sqft": null or number,
  "price": null or number in AED,
  "price_per_sqft": null or number,
  "furnishing": "furnished|semi_furnished|unfurnished|unknown",
  "handover_date": "Q4 2025 or specific date if available",
  "payment_plan": "e.g. 60/40, 80/20, or detailed plan",
  "amenities": ["pool", "gym", "parking", etc],
  "key_features": ["sea view", "high floor", "corner unit", etc],
  "floor_plans_detected": number of floor plan pages/images found,
  "gallery_images_detected": number of property photos found,
  "total_pages_analyzed": number,
  "confidence_score": 1-100 how confident you are in the extraction,
  "extracted_highlights": ["key selling points extracted from documents"]
}

IMPORTANT:
- Extract EVERY detail you can find
- If a field is not found, use null (not empty string)
- For prices, always convert to AED
- Detect floor plans vs property photos vs brochure graphics
- Count how many distinct property images and floor plans you found
- Be thorough with amenities and features
- Generate a professional description even if one isn't explicitly in the document`
    });

    // Add each document
    for (const doc of documents) {
      if (doc.type === 'image' && doc.base64) {
        contentParts.push({
          type: "image_url",
          image_url: { url: `data:${doc.mime_type || 'image/jpeg'};base64,${doc.base64}` }
        });
      } else if (doc.type === 'text' && doc.content) {
        contentParts.push({
          type: "text",
          text: `[Document: ${doc.name}]\n${doc.content}`
        });
      }
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "user", content: contentParts }
        ],
        max_tokens: 3000,
        temperature: 0.2,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits required. Please add funds." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await response.text();
      console.error("AI error:", response.status, errText);
      throw new Error("AI extraction failed");
    }

    const aiData = await response.json();
    let rawContent = aiData.choices?.[0]?.message?.content?.trim() || "";

    // Strip markdown code blocks
    rawContent = rawContent.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "").trim();

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(rawContent);
    } catch {
      console.error("Failed to parse AI response:", rawContent);
      return new Response(JSON.stringify({ 
        error: "Failed to parse extraction results",
        raw: rawContent.substring(0, 500) 
      }), {
        status: 422,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ 
      success: true,
      data: parsed 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: unknown) {
    console.error("Listing extractor error:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Extraction failed" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
