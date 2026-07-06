// Extracts structured project fields from uploaded brochure/document URLs
// using Lovable AI Gateway (Gemini multimodal). Never fabricates: unknown => null.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface FileRef { url: string; name: string; type?: string }

const MAX_FILE_BYTES = 20 * 1024 * 1024;
const AI_TIMEOUT_MS = 80_000;

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

function response(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function toBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

async function fileToBase64(url: string): Promise<{ b64: string; mime: string; bytes: number } | { error: string }> {
  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(45_000) });
    if (!r.ok) return { error: `File fetch failed (${r.status})` };
    const length = Number(r.headers.get("content-length") || "0");
    if (length > MAX_FILE_BYTES) return { error: `File is larger than 20MB (${Math.ceil(length / 1024 / 1024)}MB)` };
    const mime = r.headers.get("content-type") || "application/pdf";
    const buf = new Uint8Array(await r.arrayBuffer());
    if (buf.byteLength > MAX_FILE_BYTES) return { error: `File is larger than 20MB (${Math.ceil(buf.byteLength / 1024 / 1024)}MB)` };
    return { b64: toBase64(buf), mime, bytes: buf.byteLength };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "File could not be read" };
  }
}

function stripJsonFence(value: string): string {
  return value.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "").trim();
}

function sanitizeExtracted(input: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input || {})) {
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (!trimmed || /^(unknown|n\/?a|not available|null|undefined)$/i.test(trimmed)) {
        out[key] = null;
      } else {
        out[key] = trimmed;
      }
      continue;
    }
    if (Array.isArray(value)) {
      const cleaned = value
        .filter((item) => typeof item === "string")
        .map((item) => item.trim())
        .filter((item) => item && !/^(unknown|n\/?a|null|undefined)$/i.test(item));
      out[key] = cleaned.length ? Array.from(new Set(cleaned)) : null;
      continue;
    }
    out[key] = value ?? null;
  }
  return out;
}

function mergeExtracted(base: Record<string, unknown>, next: Record<string, unknown>) {
  for (const [key, value] of Object.entries(next)) {
    if (value === null || value === undefined || value === "") continue;
    if (Array.isArray(value)) {
      const existing = Array.isArray(base[key]) ? base[key] as unknown[] : [];
      base[key] = Array.from(new Set([...existing, ...value].filter(Boolean).map(String)));
      continue;
    }
    if (base[key] === null || base[key] === undefined || base[key] === "") base[key] = value;
  }
}

async function extractOneFile(apiKey: string, file: FileRef, fetched: { b64: string; mime: string }) {
  const filePart = fetched.mime.startsWith("image/")
    ? { type: "image_url", image_url: { url: `data:${fetched.mime};base64,${fetched.b64}` } }
    : { type: "file", file: { filename: file.name, file_data: `data:${fetched.mime};base64,${fetched.b64}` } };

  const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    signal: AbortSignal.timeout(AI_TIMEOUT_MS),
    headers: {
      "Content-Type": "application/json",
      "Lovable-API-Key": apiKey,
      "X-Lovable-AIG-SDK": "supabase-edge-function",
    },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [{
        role: "user",
        content: [
          {
            type: "text",
            text: `You are a strict real-estate brochure data extractor. Read this UAE off-plan project document/image and extract only facts clearly stated in it. Rules:
- Never fabricate. If a field is not clearly stated, use null.
- Never return "N/A", "unknown", guessed names, guessed dates, or placeholder values.
- Prefer AED numeric values for prices. Strip commas/currency.
- amenities = deduplicated short names.
${SCHEMA_HINT}`,
          },
          filePart,
        ],
      }],
      response_format: { type: "json_object" },
      max_tokens: 2200,
    }),
  });

  if (!aiRes.ok) {
    const detail = await aiRes.text();
    throw new Error(`AI gateway ${aiRes.status}: ${detail.slice(0, 400)}`);
  }

  const data = await aiRes.json();
  const raw = stripJsonFence(data?.choices?.[0]?.message?.content ?? "{}");
  try {
    return sanitizeExtracted(JSON.parse(raw));
  } catch {
    throw new Error("AI returned invalid JSON for this file");
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("AI extraction service is not configured");

    const { files } = await req.json() as { files: FileRef[] };
    if (!files?.length) {
      return response({ error: "No files provided" }, 400);
    }

    const extracted: Record<string, unknown> = {};
    const filesRead: Array<{ name: string; bytes: number; mime: string }> = [];
    const filesSkipped: Array<{ name: string; reason: string }> = [];

    // Process sequentially to avoid the memory-limit crashes caused by loading
    // many PDFs into base64 at the same time. There is no count limit; each file
    // is read, extracted, merged, then released before moving to the next file.
    for (const f of files) {
      const fetched = await fileToBase64(f.url);
      if ("error" in fetched) {
        filesSkipped.push({ name: f.name, reason: fetched.error });
        continue;
      }
      try {
        const one = await extractOneFile(LOVABLE_API_KEY, f, fetched);
        mergeExtracted(extracted, one);
        filesRead.push({ name: f.name, bytes: fetched.bytes, mime: fetched.mime });
      } catch (e) {
        filesSkipped.push({ name: f.name, reason: e instanceof Error ? e.message : "Extraction failed for this file" });
      }
    }

    if (filesRead.length === 0) {
      return response({
        error: "No uploaded files could be read for extraction. Please retry upload or use smaller files.",
        files_read: 0,
        files_skipped: filesSkipped,
      }, 422);
    }

    return response({ extracted, files_read: filesRead.length, files_skipped: filesSkipped });
  } catch (e) {
    return response({ error: (e as Error).message }, 500);
  }
});
