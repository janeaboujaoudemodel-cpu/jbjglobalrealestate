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

    const { file_base64, file_type, extraction_type } = await req.json();

    if (!file_base64 || !extraction_type) {
      throw new Error("Missing required fields: file_base64, extraction_type");
    }

    const mimeType = file_type || "image/jpeg";
    const dataUrl = `data:${mimeType};base64,${file_base64}`;

    const schemas: Record<string, string> = {
      business_card: `Extract all text from this business card image and return ONLY valid JSON:
{
  "name": "full name",
  "title": "job title / role",
  "company": "company or organization name",
  "phone": "phone number",
  "email": "email address",
  "website": "website URL",
  "address": "physical address if present"
}
Use empty string "" for fields not found. No explanation, just the JSON object.`,

      cv: `Extract all information from this CV/Resume and return ONLY valid JSON:
{
  "name": "full name",
  "title": "professional title",
  "email": "email",
  "phone": "phone number",
  "location": "city/country",
  "linkedin": "linkedin URL or username",
  "website": "personal website",
  "summary": "professional summary paragraph",
  "experience": [
    {"title": "job title", "company": "company name", "period": "date range", "description": "role description"}
  ],
  "education": [
    {"degree": "degree name", "institution": "school name", "year": "year"}
  ],
  "skills": "comma-separated list of skills",
  "languages": "comma-separated list of languages"
}
Use empty string "" or [] for fields not found. No explanation, just the JSON.`,

      cover_letter: `Extract information from this cover letter and return ONLY valid JSON:
{
  "yourName": "applicant name",
  "yourTitle": "applicant title/role",
  "jobTitle": "position being applied for",
  "companyName": "company being applied to",
  "skills": "key skills mentioned",
  "experience": "experience summary mentioned"
}
Use empty string "" for fields not found. No explanation, just the JSON.`,

      company_profile: `Extract all information from this company profile, brochure, or business document and return ONLY valid JSON:
{
  "companyName": "company name",
  "tagline": "tagline or slogan",
  "aboutUs": "about us or company overview text",
  "services": [{"title": "service name", "description": "service description"}],
  "team": [{"name": "person full name", "role": "job title or role"}],
  "phone": "phone number",
  "email": "email address",
  "website": "website URL",
  "address": "physical address",
  "linkedin": "LinkedIn URL or handle",
  "instagram": "Instagram handle"
}
Use empty string "" for missing text fields and [] for missing arrays. No explanation, just the JSON.`,
    };

    const prompt = schemas[extraction_type];
    if (!prompt) throw new Error(`Unknown extraction_type: ${extraction_type}`);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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

    // Strip markdown code blocks if present
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

    return new Response(JSON.stringify({ data: parsed, extraction_type }), {
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
