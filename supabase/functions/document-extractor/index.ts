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

    const { file_base64, file_type, extraction_type, schema_hint, schema_fields } = await req.json();

    if (!file_base64 || !extraction_type) {
      throw new Error("Missing required fields: file_base64, extraction_type");
    }

    const mimeType = file_type || "image/jpeg";
    const dataUrl = `data:${mimeType};base64,${file_base64}`;

    const schemas: Record<string, string> = {
      business_card: `Extract all text from this business card image and return ONLY valid JSON:
{"name":"","title":"","company":"","phone":"","email":"","website":"","address":""}
Use empty string "" for fields not found. No explanation, just the JSON.`,

      cv: `Extract all information from this CV/Resume and return ONLY valid JSON with name,title,email,phone,location,linkedin,website,summary,experience[],education[],skills,languages.`,

      cover_letter: `Extract from this cover letter and return ONLY valid JSON:
{"yourName":"","yourTitle":"","jobTitle":"","companyName":"","skills":"","experience":""}`,

      company_profile: `Extract company info as JSON: companyName, tagline, aboutUs, services[], team[], phone, email, website, address, linkedin, instagram.`,

      // ---- JBJ Property Advertising Agreement (Leasing) smart-fill ----
      jbj_paa_leasing: `You are filling a Dubai property advertising agreement. Inspect the document/photo (could be a Passport, Emirates ID, Title Deed, Ejari, unit photo, MOU, brochure or floor plan) and extract anything that fills these fields. Return ONLY valid JSON of the shape:
{
  "fields": {
    "landlord_name": "",
    "passport_number": "",
    "emirates_id": "",
    "mobile_number": "",
    "email_address": "",
    "property_type": "",
    "status_vacant_tenanted": "",
    "furnishing": "",
    "vacating_date": "",
    "building_name": "",
    "unit_number": "",
    "street_name": "",
    "community": "",
    "bua_sqft": "",
    "plot_sqft": "",
    "bedrooms": "",
    "bathrooms": "",
    "rental_amount": "",
    "sales_amount": "",
    "parking": "",
    "additional_notes": ""
  },
  "confidence": { "<field_key>": 0.0 },
  "source_doc_type": "passport|emirates_id|title_deed|ejari|unit_photo|brochure|floor_plan|other"
}
Rules:
- Only fill what you can clearly read; leave the rest as "".
- For property_type use one of: Villa, Apartment, Office, Warehouse, Other.
- For status_vacant_tenanted use Vacant or Tenanted.
- For furnishing use Furnished, Unfurnished or Semi-furnished.
- Dates as YYYY-MM-DD.
- Numbers as plain digits (no commas, no AED, no sq ft).
- mobile_number: include country code with +.
- additional_notes: short summary (e.g. "Title Deed extracted; owner is X; community Y").
No explanation, just the JSON object.`,
    };

    const prompt = schema_hint && schemas[schema_hint] ? schemas[schema_hint] : schemas[extraction_type];
    if (!prompt) throw new Error(`Unknown extraction_type: ${extraction_type}`);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              { type: "image_url", image_url: { url: dataUrl } },
            ],
          },
        ],
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI error:", response.status, errText);
      return new Response(JSON.stringify({ error: "AI extraction failed", details: errText }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await response.json();
    let rawContent = aiData.choices?.[0]?.message?.content?.trim() || "";
    rawContent = rawContent.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "").trim();

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(rawContent);
    } catch {
      return new Response(JSON.stringify({ error: "Failed to parse AI response as JSON", raw: rawContent }), {
        status: 422,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ data: parsed, extraction_type, schema_hint: schema_hint || null }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Document extractor error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Extraction failed" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
