// Extracts structured project fields from uploaded brochure/document URLs
// using Lovable AI Gateway (Gemini multimodal). Never fabricates: unknown => null.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface FileRef { url: string; name: string; type?: string; role?: "cover" | "gallery" | "fact_sheet" | "brochure" | "document" }

const MAX_FILE_BYTES = 20 * 1024 * 1024;
const AI_TIMEOUT_MS = 95_000;

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
  "furnished_status": string|null,       // full phrase if stated: "fully furnished", "fully furnished and fully serviced", "unfurnished", etc.
  "is_serviced": boolean|null,
  "is_managed": boolean|null,
  "management_type": string|null,        // "yearly" | "short_term" | "both" | null
  "owner_can_use": boolean|null,
  "amenities": string[]|null,
  "developer_description": string|null,  // concise factual profile from the brochure if available; otherwise short generated summary from stated facts
  "listing_title": string|null,
  "key_highlights": string[]|null
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

function extractJson(value: string): string {
  const stripped = value.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "").trim();
  const first = stripped.indexOf("{");
  const last = stripped.lastIndexOf("}");
  if (first >= 0 && last > first) return stripped.slice(first, last + 1);
  return stripped;
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

function filePriority(file: FileRef) {
  const name = `${file.role || ""} ${file.name}`.toLowerCase();
  if (/fact|factsheet|fact sheet/.test(name)) return 0;
  if (/brochure|presentation|launch|payment/.test(name)) return 1;
  if (file.role === "document") return 2;
  if (/floor|plan|spec|sheet/.test(name)) return 3;
  if (file.role === "gallery" || file.role === "cover") return 99;
  return 4;
}

function shouldExtract(file: FileRef) {
  if (file.role === "cover" || file.role === "gallery") return false;
  return true;
}

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 72) || "developer";
}

function normalizeName(value: string) {
  return value.toLowerCase().replace(/\b(llc|l\.l\.c|pjsc|properties|property|development|developments|developer|real estate|limited)\b/g, "").replace(/[^a-z0-9]+/g, "").trim();
}

async function resolveDeveloper(authHeader: string, developerName: unknown, developerDescription: unknown) {
  if (typeof developerName !== "string" || developerName.trim().length < 2) {
    return { developer_name: null, developer_id: null, developer_created: false, developer_logo_needed: true };
  }

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const ANON = Deno.env.get("SUPABASE_ANON_KEY");
  const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!SUPABASE_URL || !ANON || !SERVICE || !authHeader) {
    return { developer_name: developerName.trim(), developer_id: null, developer_created: false, developer_logo_needed: false };
  }

  const userClient = createClient(SUPABASE_URL, ANON, { global: { headers: { Authorization: authHeader } } });
  const { data: userData } = await userClient.auth.getUser();
  if (!userData?.user) {
    return { developer_name: developerName.trim(), developer_id: null, developer_created: false, developer_logo_needed: false };
  }

  const admin = createClient(SUPABASE_URL, SERVICE);
  const wanted = normalizeName(developerName);
  const { data: developers } = await admin.from("developers").select("id,name,logo_url,description").limit(1000);
  const match = (developers || []).find((d: { name: string }) => normalizeName(d.name) === wanted || normalizeName(d.name).includes(wanted) || wanted.includes(normalizeName(d.name)));
  if (match) {
    if (!match.description && typeof developerDescription === "string" && developerDescription.trim()) {
      await admin.from("developers").update({ description: developerDescription.trim(), updated_at: new Date().toISOString() }).eq("id", match.id);
    }
    return { developer_name: match.name, developer_id: match.id, developer_created: false, developer_logo_needed: !match.logo_url };
  }

  const OWNER_BACKEND_EMAILS = new Set([
    "janeaboujaoudemodel@gmail.com",
    "janeaboujaoudenails@gmail.com",
    "contact@janeaboujaoude.net",
    "infoo.jane@gmail.com",
  ]);
  const userEmail = (userData.user.email || "").toLowerCase().trim();
  const { data: roles } = await admin.from("user_roles").select("role").eq("user_id", userData.user.id);
  const canCreate = OWNER_BACKEND_EMAILS.has(userEmail) || (roles || []).some((r: { role: string }) => r.role === "owner" || r.role === "admin");
  if (!canCreate) {
    return { developer_name: developerName.trim(), developer_id: null, developer_created: false, developer_logo_needed: true };
  }

  const cleanName = developerName.trim();
  const uniqueSlug = `${slugify(cleanName)}-${Date.now().toString(36)}`;
  const { data: created, error } = await admin.from("developers").insert({
    name: cleanName,
    slug: uniqueSlug,
    description: typeof developerDescription === "string" && developerDescription.trim() ? developerDescription.trim() : null,
    trust_level: "auto_publish",
  }).select("id,name").single();
  if (error || !created) {
    return { developer_name: cleanName, developer_id: null, developer_created: false, developer_logo_needed: true };
  }
  return { developer_name: created.name, developer_id: created.id, developer_created: true, developer_logo_needed: true };
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
      model: "google/gemini-2.5-flash",
      messages: [{
        role: "user",
        content: [
          {
            type: "text",
            text: `You are a strict UAE off-plan project brochure data extractor. Read this single uploaded file: "${file.name}".
Rules:
- Never fabricate. If a field is not clearly stated, use null.
- Never return "N/A", "unknown", guessed names, guessed dates, or placeholder values.
- Identify the actual project being marketed in this file. Do not use unrelated examples, nearby communities, platform names, or other project names unless they are the main project title.
- Developer name must be the real developer/company, not the community, not Emerald, not an AI/platform/tool name.
- For furnished_status, keep the full stated phrase such as "fully furnished", "fully serviced apartments", or "fully furnished and fully serviced".
- Generate description/listing_title only from facts found in the document, with the project name in the first sentence.
- Include every important selling point from the pages/slides as key_highlights.
- Prefer AED numeric values for prices. Strip commas/currency.
- amenities = deduplicated short names.
${SCHEMA_HINT}`,
          },
          filePart,
        ],
      }],
      response_format: { type: "json_object" },
      max_tokens: 8000,
      temperature: 0.1,
    }),
  });

  if (!aiRes.ok) {
    const detail = await aiRes.text();
    throw new Error(`AI gateway ${aiRes.status}: ${detail.slice(0, 400)}`);
  }

  const data = await aiRes.json();
  const raw = extractJson(data?.choices?.[0]?.message?.content ?? "{}");
  try {
    return sanitizeExtracted(JSON.parse(raw));
  } catch {
    throw new Error("AI returned invalid JSON for this file");
  }
}

async function reconcileExtracted(apiKey: string, files: Array<{ name: string; role?: string; extracted: Record<string, unknown> }>) {
  if (files.length <= 1) return files[0]?.extracted || {};
  const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    signal: AbortSignal.timeout(45_000),
    headers: {
      "Content-Type": "application/json",
      "Lovable-API-Key": apiKey,
      "X-Lovable-AIG-SDK": "supabase-edge-function",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [{
        role: "user",
        content: [{
          type: "text",
          text: `Resolve the final project extraction from these per-file results. Return ONLY valid JSON matching the same schema.
Rules:
- The main project is usually in the fact sheet/brochure filename and repeated across official facts. Prefer fact_sheet/brochure roles over unrelated support documents.
- Do not choose unrelated project names from examples or older documents.
- If a later official fact sheet contradicts a generic/incorrect earlier name, use the fact sheet.
- Keep rich details: full furnishing phrase, service/management phrases, payment breakdown, highlights, developer description.
${SCHEMA_HINT}
Per-file results: ${JSON.stringify(files).slice(0, 28000)}`,
        }],
      }],
      response_format: { type: "json_object" },
      max_tokens: 8000,
      temperature: 0.1,
    }),
  });
  if (!aiRes.ok) return files[0]?.extracted || {};
  const data = await aiRes.json();
  const raw = extractJson(data?.choices?.[0]?.message?.content ?? "{}");
  try {
    return sanitizeExtracted(JSON.parse(raw));
  } catch {
    return files[0]?.extracted || {};
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
    const perFile: Array<{ name: string; role?: string; extracted: Record<string, unknown> }> = [];
    const filesRead: Array<{ name: string; bytes: number; mime: string }> = [];
    const filesSkipped: Array<{ name: string; reason: string }> = [];

    // Process sequentially to avoid the memory-limit crashes caused by loading
    // many PDFs into base64 at the same time. There is no count limit; each file
    // is read, extracted, merged, then released before moving to the next file.
    const orderedFiles = [...files].filter(shouldExtract).sort((a, b) => filePriority(a) - filePriority(b));
    if (orderedFiles.length === 0) {
      return response({
        error: "No brochure, fact sheet, or document file was provided for extraction. Upload the cover/gallery separately, then add a brochure or fact sheet for AI reading.",
        files_read: 0,
        files_skipped: files.map((f) => ({ name: f.name, reason: "Cover/gallery images are not sent to AI extraction" })),
      }, 422);
    }

    for (const f of orderedFiles) {
      const fetched = await fileToBase64(f.url);
      if ("error" in fetched) {
        filesSkipped.push({ name: f.name, reason: fetched.error });
        continue;
      }
      try {
        const one = await extractOneFile(LOVABLE_API_KEY, f, fetched);
        mergeExtracted(extracted, one);
        perFile.push({ name: f.name, role: f.role, extracted: one });
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

    const finalExtracted = await reconcileExtracted(LOVABLE_API_KEY, perFile);
    const developerResolution = await resolveDeveloper(req.headers.get("Authorization") ?? "", finalExtracted.developer_name, finalExtracted.developer_description);
    if (developerResolution.developer_name) finalExtracted.developer_name = developerResolution.developer_name;

    return response({ extracted: finalExtracted, files_read: filesRead.length, files_skipped: filesSkipped, developer: developerResolution });
  } catch (e) {
    return response({ error: (e as Error).message }, 500);
  }
});
