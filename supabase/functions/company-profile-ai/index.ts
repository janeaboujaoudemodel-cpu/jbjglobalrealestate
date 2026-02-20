import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const body = await req.json();
    const { action, companyName, tagline, draft, serviceTitle, markdown, url: siteUrl } = body;

    let systemPrompt = "";
    let userPrompt = "";

    if (action === "extract_from_url") {
      const md = (typeof markdown === "string" ? markdown : "") || "";
      const su = (typeof siteUrl === "string" ? siteUrl : "") || "";
      systemPrompt = `You are a company profile extractor. Extract structured business information from website content. Return ONLY valid JSON with no explanation, no markdown fences, no extra text.`;
      userPrompt = `Extract company profile information from this website content and return ONLY valid JSON (no markdown, no explanation):
{
  "companyName": "company name",
  "tagline": "company tagline or slogan",
  "aboutUs": "about us paragraph extracted from the page",
  "services": [{"title": "service name", "description": "description"}],
  "team": [{"name": "person name", "role": "title"}],
  "phone": "phone number",
  "email": "email address",
  "website": "${su}",
  "address": "physical address",
  "linkedin": "linkedin URL",
  "instagram": "instagram handle or URL"
}
Website content:
${md.slice(0, 8000)}
Use empty string "" or [] for fields not found. Return ONLY the JSON object.`;
    } else if (action === "expand_about") {
      systemPrompt = `You are an expert business writer. Write compelling, professional company profile content. 
Be specific, results-oriented, and avoid generic filler phrases. Return ONLY the requested text, no labels or titles.`;
      userPrompt = draft
        ? `Expand this into a professional 3-paragraph "About Us" section for a company profile PDF (max 200 words).
Company: "${companyName}"${tagline ? `\nTagline: "${tagline}"` : ""}
Draft: "${draft}"
Return only the expanded text, no headings.`
        : `Write a professional "About Us" section (3 paragraphs, max 200 words) for company profile PDF.
Company: "${companyName}"${tagline ? `\nTagline: "${tagline}"` : ""}
Make it compelling and professional. Return only the text, no headings.`;
    } else if (action === "expand_service") {
      systemPrompt = `You are an expert business writer. Write concise, professional service descriptions. Return ONLY the description text.`;
      userPrompt = `Write a concise 1–2 sentence professional description for this service offered by "${companyName || "our company"}": "${serviceTitle}".
Return only the description text, no labels.`;
    } else {
      throw new Error(`Unknown action: ${action}`);
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        stream: false,
        max_tokens: 400,
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
          JSON.stringify({ error: "AI usage credits required. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      throw new Error("AI gateway error: " + response.status);
    }

    const result = await response.json();
    const content = result.choices?.[0]?.message?.content?.trim() || "";

    return new Response(
      JSON.stringify({ content }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("company-profile-ai error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
