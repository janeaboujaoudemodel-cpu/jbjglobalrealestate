// Extracts structured project fields from uploaded brochure/document URLs
// using Lovable AI Gateway (Gemini multimodal). Never fabricates: unknown => null.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface FileRef { url: string; name: string; type?: string }

const SCHEMA_HINT = `Return ONLY valid minified JSON matching this shape. Use null when unknown. Never invent values.
{
  "name": string|null,
  "developer_name": string|null,
  "emirate": string|null,
  "location": string|null,
  "short_description": string|null,
  "description": string|null,
  "handover_date": string|null,          // ISO YYYY-MM-DD if a full date; else null
  "launch_date": string|null,            // ISO YYYY-MM-DD or null
  "price_from": number|null,             // AED
  "price_to": number|null,               // AED
  "payment_plan": string|null,           // e.g. "60/40 (10% DP, 50% during construction, 40% on handover)"
  "service_charge": string|null,         // e.g. "AED 18/sqft/year"
  "built_up_area": string|null,          // e.g. "650 - 2,400 sqft"
  "plot_area": string|null,
  "number_of_stories": number|null,
  "bedrooms_min": number|null,
  "bedrooms_max": number|null,
  "furnished_status": string|null,       // "furnished" | "unfurnished" | "semi-furnished" | null
  "is_serviced": boolean|null,
  "is_managed": boolean|null,
  "management_type": string|null,        // "yearly" | "short_term" | "both" | null
  "owner_can_use": boolean|null,
  "amenities": string[]|null
}`;

async function fileToBase64(url: string): Promise<{ b64: string; mime: string } | null> {
  try {
    const r = await fetch(url);
    if (!r.ok) return null;
    const mime = r.headers.get("content-type") || "application/pdf";
    const buf = new Uint8Array(await r.arrayBuffer());
    let bin = "";
    for (let i = 0; i < buf.length; i++) bin += String.fromCharCode(buf[i]);
    return { b64: btoa(bin), mime };
  } catch { return null; }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const { files } = await req.json() as { files: FileRef[] };
    if (!files?.length) {
      return new Response(JSON.stringify({ error: "No files provided" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Build multimodal content parts
    const contentParts: any[] = [
      {
        type: "text",
        text: `You are a strict real-estate brochure data extractor. Read every attached document/image and extract fields for a UAE off-plan project. Rules:
- Never fabricate. If a field is not clearly stated, use null.
- Prefer numbers in AED for prices. Strip commas/currency.
- Merge information across multiple files.
- If multiple values conflict, choose the most explicit/recent.
- amenities = deduplicated array of short names (e.g. "Pool", "Gym", "Concierge").
${SCHEMA_HINT}`,
      },
    ];

    for (const f of files.slice(0, 20)) {
      const fetched = await fileToBase64(f.url);
      if (!fetched) continue;
      if (fetched.mime.startsWith("image/")) {
        contentParts.push({ type: "image_url", image_url: { url: `data:${fetched.mime};base64,${fetched.b64}` } });
      } else {
        // Gemini via OpenRouter accepts PDFs as file parts
        contentParts.push({ type: "file", file: { filename: f.name, file_data: `data:${fetched.mime};base64,${fetched.b64}` } });
      }
    }

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": LOVABLE_API_KEY,
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "user", content: contentParts }],
        response_format: { type: "json_object" },
      }),
    });

    if (!aiRes.ok) {
      const txt = await aiRes.text();
      return new Response(JSON.stringify({ error: `AI gateway ${aiRes.status}`, detail: txt }), {
        status: aiRes.status === 429 || aiRes.status === 402 ? aiRes.status : 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await aiRes.json();
    const raw = data?.choices?.[0]?.message?.content ?? "{}";
    let parsed: Record<string, unknown> = {};
    try { parsed = typeof raw === "string" ? JSON.parse(raw) : raw; } catch { parsed = {}; }

    // Sanitise: strip empty strings
    for (const k of Object.keys(parsed)) {
      const v = (parsed as any)[k];
      if (v === "" || v === "unknown" || v === "N/A") (parsed as any)[k] = null;
    }

    return new Response(JSON.stringify({ extracted: parsed }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
