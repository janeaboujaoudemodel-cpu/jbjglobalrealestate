// parse-title-deed — extracts structured property fields from an uploaded
// Dubai Title Deed / Oqood using the Lovable AI Gateway (vision model).
// Returns { success, data: { community, subCommunity, tower, unitNumber,
// bedrooms, sizeSqft, floor, view, handoverYear, ownerName } }.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("AI service not configured");

    const { files } = await req.json();
    if (!files || !Array.isArray(files) || files.length === 0) {
      return new Response(JSON.stringify({ error: "No files provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const parts: any[] = [
      {
        type: "text",
        text: `You are a Dubai real-estate document analyst. Extract structured data from the attached Title Deed / Oqood / SPA pages.

Return ONLY strict JSON with this shape (use null for unknowns, never empty strings):
{
  "community": "e.g. Business Bay",
  "subCommunity": "e.g. Executive Towers or null",
  "tower": "Tower / building name, e.g. Aykon City Tower B",
  "unitNumber": "e.g. 2508",
  "bedrooms": 0-10 or null (0 for studio),
  "bathrooms": 0-10 or null,
  "sizeSqft": number (converted from sqm if needed),
  "floor": integer or null,
  "view": "e.g. Burj Khalifa View, Canal View, Community View",
  "handoverYear": 4-digit year or null,
  "propertyType": "apartment|villa|townhouse|penthouse|studio|office|retail",
  "ownerName": "primary owner as printed",
  "titleDeedNumber": "title deed / Oqood reference number",
  "developerName": "developer as printed or null",
  "projectName": "project as printed or null",
  "confidence": 1-100
}

Rules:
- Convert sqm to sqft (× 10.7639) and round to nearest int.
- Community MUST match common DXB names (Business Bay, Downtown Dubai, Dubai Marina, JVC, JVT, Palm Jumeirah, etc.).
- If document shows "Executive Tower B, Business Bay", set community="Business Bay", subCommunity="Executive Towers", tower="Executive Tower B".
- Do NOT invent fields. Prefer null.`,
      },
    ];

    for (const f of files) {
      if (f?.base64 && f?.mime_type) {
        // Both images and PDFs are supported via the OpenAI-compatible image_url block
        // (Gemini vision accepts application/pdf as file input via image_url too).
        if (f.mime_type === "application/pdf") {
          parts.push({
            type: "file",
            file: {
              filename: f.name || "title-deed.pdf",
              file_data: `data:application/pdf;base64,${f.base64}`,
            },
          });
        } else {
          parts.push({
            type: "image_url",
            image_url: { url: `data:${f.mime_type};base64,${f.base64}` },
          });
        }
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
        messages: [{ role: "user", content: parts }],
        max_tokens: 2000,
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("parse-title-deed AI error", response.status, errText);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Try again shortly." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits required." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("AI extraction failed");
    }

    const aiData = await response.json();
    let raw = aiData.choices?.[0]?.message?.content?.trim() || "";
    raw = raw.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "").trim();

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return new Response(JSON.stringify({ error: "Failed to parse extraction", raw: raw.substring(0, 500) }), {
        status: 422,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, data: parsed }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("parse-title-deed error", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Extraction failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
