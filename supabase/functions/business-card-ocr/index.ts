import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("AI service not configured");

    const { image, timestamp } = await req.json();
    if (!image) throw new Error("Missing required field: image");

    const prompt = `You are an expert OCR system specialized in business cards.
Read every visible piece of text on this card carefully and return ONLY valid JSON in this exact shape:

{
  "name": "full person name",
  "title": "job title / position",
  "company_name": "primary company name on the card",
  "agency_name": "real estate brokerage / agency name (only if the card clearly belongs to a real estate broker or brokerage)",
  "developer_name": "real estate developer name (only if the card clearly belongs to a property developer)",
  "mobile": "mobile number with country code if shown",
  "whatsapp": "WhatsApp number if explicitly labeled as WhatsApp, else empty",
  "landline": "office / landline / direct phone number, separate from mobile",
  "email": "primary email address",
  "website": "website URL",
  "linkedin": "LinkedIn URL or @handle if visible",
  "instagram": "Instagram URL or @handle if visible",
  "address": "street / building address line",
  "city": "city",
  "country": "country",
  "event_source": "event/expo/conference name if printed on card, else empty",
  "notes": "anything noteworthy not captured elsewhere",
  "raw_text": "full raw text exactly as printed, line breaks preserved with \\n",
  "confidence": 0.0
}

Rules:
- Use empty string "" for any field you cannot find. Do NOT guess or fabricate.
- Set "confidence" between 0 and 1 based on overall image legibility.
- Do not return markdown, do not return prose. Just the JSON object.`;

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

    const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");
    const contact = {
      name: str(parsed.name),
      title: str(parsed.title),
      company_name: str(parsed.company_name) || str((parsed as any).company),
      agency_name: str(parsed.agency_name),
      developer_name: str(parsed.developer_name),
      mobile: str(parsed.mobile) || str((parsed as any).phone),
      whatsapp: str(parsed.whatsapp),
      landline: str(parsed.landline) || str((parsed as any).fax),
      email: str(parsed.email),
      website: str(parsed.website),
      linkedin: str(parsed.linkedin),
      instagram: str(parsed.instagram),
      address: str(parsed.address),
      city: str(parsed.city),
      country: str(parsed.country),
      event_source: str(parsed.event_source),
      notes: str(parsed.notes),
      raw_text: str(parsed.raw_text),
    };

    const critical = [contact.name, contact.email, contact.mobile, contact.company_name];
    const filled = critical.filter((f) => f.length > 0).length;
    const confidence =
      typeof parsed.confidence === "number"
        ? Math.max(0, Math.min(1, parsed.confidence as number))
        : Math.min(0.99, 0.5 + (filled / critical.length) * 0.5);

    return new Response(JSON.stringify({ contact, confidence, raw_extraction: parsed, timestamp }), {
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
