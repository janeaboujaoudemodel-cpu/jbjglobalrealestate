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

    const { image, timestamp } = await req.json();

    if (!image) {
      throw new Error("Missing required field: image");
    }

    // The image is a data URL (data:image/...;base64,...)
    const prompt = `You are an expert OCR system specialized in business cards and contact cards (including bank cards, ID cards, etc).

Analyze this image carefully and extract ALL visible text and contact information.

Return ONLY valid JSON in this exact format:
{
  "name": "full name of the person",
  "title": "job title or position",
  "company": "company or organization name",
  "phone": "phone number(s) - include all numbers found, separated by ' / '",
  "email": "email address",
  "website": "website URL",
  "address": "physical address if visible",
  "linkedin": "LinkedIn URL or handle if visible",
  "fax": "fax number if visible",
  "mobile": "mobile number if different from phone",
  "department": "department if visible",
  "additional_info": "any other relevant text on the card"
}

Use empty string "" for fields not found. Extract EVERY piece of text visible on the card.
No explanation, no markdown, just the JSON object.`;

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
              { type: "image_url", image_url: { url: image } },
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
      console.error("Failed to parse AI response:", rawContent);
      return new Response(JSON.stringify({ error: "Failed to parse AI response", raw: rawContent }), {
        status: 422,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build contact object
    const contact = {
      name: parsed.name || "",
      title: parsed.title || "",
      company: parsed.company || "",
      phone: parsed.phone || parsed.mobile || "",
      email: parsed.email || "",
      website: parsed.website || "",
      address: parsed.address || "",
      linkedin: parsed.linkedin || "",
      fax: parsed.fax || "",
      department: parsed.department || "",
      additionalInfo: parsed.additional_info || "",
    };

    // Calculate confidence based on filled fields
    const fields = [contact.name, contact.phone, contact.email, contact.company, contact.title];
    const filledFields = fields.filter(f => f && String(f).trim().length > 0).length;
    const confidence = Math.min(0.99, 0.5 + (filledFields / fields.length) * 0.5);

    return new Response(JSON.stringify({ 
      contact, 
      confidence,
      raw_extraction: parsed,
      timestamp 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Business card OCR error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "OCR failed" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
