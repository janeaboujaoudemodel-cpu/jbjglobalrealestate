// Extracts developer-level fields from an uploaded PDF company profile /
// brochure using Lovable AI (Gemini multimodal) and writes them DIRECTLY
// into the `developers` table (owner-driven upload = trusted source).
//
// Rules (per owner instruction):
//   - Description is ALWAYS replaced when the AI returns one (owner uploaded
//     the official profile — it is the source of truth).
//   - Other non-null extracted fields are written too. Nulls never wipe existing values.
//   - An audit row is still written to `enrichment_review_drafts` with
//     status='applied' so the change is traceable in Enrichment Review.
//
// The owner can still manually edit any field afterwards from the developer
// admin page — this function only fills / replaces, never locks.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const AI_TIMEOUT_MS = 180_000;
// No hard file-size cap for owner-uploaded company profiles. Some developer
// profile PDFs are large — the AI gateway itself is the only real ceiling.

const SCHEMA = `Return ONLY valid minified JSON. Use null when the field is not stated. Never invent values.
{
  "name": string|null,
  "legal_name": string|null,
  "description": string|null,
  "short_description": string|null,
  "founded_year": number|null,
  "headquarters": string|null,
  "website": string|null,
  "email": string|null,
  "phone": string|null,
  "whatsapp": string|null,
  "whatsapp_group_url": string|null,
  "telegram_group_url": string|null,
  "ceo_name": string|null,
  "founder_name": string|null,
  "parent_company": string|null,
  "license_number": string|null,
  "total_projects": number|null,
  "completed_projects": number|null,
  "offplan_projects": number|null,
  "upcoming_units": number|null,
  "units_delivered": number|null,
  "portfolio_worth": number|null,
  "years_of_experience": number|null,
  "specializations": string[]|null,
  "signature_projects": string[]|null,
  "awards": string[]|null,
  "leadership": string[]|null,
  "tagline": string|null,
  "mission": string|null,
  "linkedin_url": string|null,
  "instagram_url": string|null,
  "custom_fields": { [key: string]: string|number|string[]|null } | null,
  "proposed_new_fields": [ { "key": string, "label": string, "field_type": "text"|"longtext"|"number"|"url"|"list"|"date", "value": string|number|string[]|null } ] | null
}

Notes:
- "custom_fields" — put values for any key listed in KNOWN_CUSTOM_FIELDS below.
- "proposed_new_fields" — for any material piece of information you find in the
  document that is NOT covered by the schema above AND NOT in KNOWN_CUSTOM_FIELDS
  (e.g. "sister_companies", "projects_by_country", "number_of_employees",
  "sustainability_certifications"), propose it with a stable snake_case key,
  a human label, a field type, and the extracted value. Do not propose fields
  for trivia or marketing fluff — only durable facts that would apply to any
  developer.`;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function toBase64(bytes: Uint8Array): string {
  let bin = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) bin += String.fromCharCode(...bytes.subarray(i, i + chunk));
  return btoa(bin);
}

function extractJson(v: string): string {
  const s = v.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "").trim();
  const a = s.indexOf("{"); const b = s.lastIndexOf("}");
  return a >= 0 && b > a ? s.slice(a, b + 1) : s;
}

async function fetchFile(url: string) {
  const r = await fetch(url, { signal: AbortSignal.timeout(60_000) });
  if (!r.ok) throw new Error(`File fetch failed (${r.status})`);
  const buf = new Uint8Array(await r.arrayBuffer());
  return { b64: toBase64(buf), mime: r.headers.get("content-type") || "application/pdf" };
}

/** POST to the AI gateway with retries for transient upstream failures (429/500/502/503/504). */
async function callGatewayWithRetry(body: unknown, key: string) {
  const attempts = 4;
  let lastStatus = 0;
  let lastText = "";
  for (let i = 0; i < attempts; i++) {
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      signal: AbortSignal.timeout(AI_TIMEOUT_MS),
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": key,
        "X-Lovable-AIG-SDK": "supabase-edge-function",
      },
      body: JSON.stringify(body),
    });
    if (res.ok) return res;
    lastStatus = res.status;
    lastText = await res.text().catch(() => "");
    if (![429, 500, 502, 503, 504].includes(res.status)) {
      return new Response(lastText, { status: res.status });
    }
    // Exponential backoff: 1.5s, 3s, 6s
    await new Promise((r) => setTimeout(r, 1500 * Math.pow(2, i)));
  }
  return new Response(lastText || "upstream unavailable", { status: lastStatus || 502 });
}

/**
 * Deterministic safety net after the model response: owner-uploaded company
 * profiles are often written in first person, but JBJ presents developers in
 * third person. Never save "we / our / us" language into the profile.
 */
function enforceThirdPersonVoice(text: unknown, developerName?: string): string | null {
  if (typeof text !== "string") return null;
  const name = developerName || "The developer";
  let out = text.trim();
  if (!out) return null;

  out = out
    .replace(/\bwe\s+have\s+always\s+envisioned\b/gi, `${name} has always envisioned`)
    .replace(/\bwe\s+have\s+earned\b/gi, `${name} has earned`)
    .replace(/\bwe\s+are\b/gi, `${name} is`)
    .replace(/\bwe\s+were\b/gi, `${name} was`)
    .replace(/\bwe\s+have\b/gi, `${name} has`)
    .replace(/\bwe\s+do\b/gi, `${name} does`)
    .replace(/\bwe\s+understand\b/gi, `${name} understands`)
    .replace(/\bwe\s+know\b/gi, `${name} knows`)
    .replace(/\bwe\s+apply\b/gi, `${name} applies`)
    .replace(/\bwe\s+proudly\s+stand\b/gi, `${name} stands`)
    .replace(/\bwe\s+passionately\s+develop\b/gi, `${name} develops`)
    .replace(/\bwe\s+develop\b/gi, `${name} develops`)
    .replace(/\bwe\s+build\b/gi, `${name} builds`)
    .replace(/\bwe\s+create\b/gi, `${name} creates`)
    .replace(/\bwe\s+deliver\b/gi, `${name} delivers`)
    .replace(/\bwe\s+offer\b/gi, `${name} offers`)
    .replace(/\bwe\s+provide\b/gi, `${name} provides`)
    .replace(/\bwe\s+believe\b/gi, `${name} believes`)
    .replace(/\bwe\s+envision(?:ed)?\b/gi, `${name} envisions`)
    .replace(/\bwe\s+earned\b/gi, `${name} earned`)
    .replace(/\bour\s+leadership\s+team\b/gi, `${name}'s leadership team`)
    .replace(/\bour\s+residents\b/gi, "their residents")
    .replace(/\bour\s+investors\b/gi, "their investors")
    .replace(/\bour\s+clients\b/gi, "their clients")
    .replace(/\bour\s+customers\b/gi, "their customers")
    .replace(/\bour\s+vision\b/gi, "the company's vision")
    .replace(/\bour\s+mission\b/gi, "the company's mission")
    .replace(/\bour\s+foundation\b/gi, "the company's foundation")
    .replace(/\bour\s+currency\b/gi, "the company's currency")
    .replace(/\bour\s+portfolio\b/gi, "their portfolio")
    .replace(/\bour\s+projects\b/gi, "their projects")
    .replace(/\bour\s+communities\b/gi, "their communities")
    .replace(/\bour\s+([a-z])/gi, "their $1")
    .replace(/\bus\b/gi, "them")
    .replace(/\bjoin\s+(?:us|them)\s+on\s+this\s+journey[^.]*\.?/gi, "");

  out = out.replace(/(^|[.!?]\s+)We\s+/g, `$1${name} `);
  return out.replace(/[ \t]{2,}/g, " ").replace(/\n{3,}/g, "\n\n").trim();
}

/** Map the AI JSON to actual `developers` table columns. */
function mapToDeveloperColumns(ex: Record<string, unknown>, developerName?: string): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  const put = (col: string, val: unknown) => {
    if (val === undefined || val === null) return;
    if (typeof val === "string" && val.trim() === "") return;
    if (Array.isArray(val) && val.length === 0) return;
    out[col] = val;
  };

  put("description", enforceThirdPersonVoice(ex.description, developerName));
  put("founded_year", ex.founded_year);
  put("headquarters", ex.headquarters);
  put("website_url", ex.website);
  put("ceo_name", ex.ceo_name);
  put("parent_company", ex.parent_company);
  put("office_phone", ex.phone);
  put("admin_email", ex.email);
  put("whatsapp", ex.whatsapp);
  put("whatsapp_group_url", ex.whatsapp_group_url);
  put("telegram_group_url", ex.telegram_group_url);
  put("license_number", ex.license_number);
  put("completed_projects", ex.completed_projects);
  put("offplan_projects", ex.offplan_projects);
  put("upcoming_units", ex.upcoming_units);
  put("total_units_delivered", ex.units_delivered);
  put("portfolio_worth", ex.portfolio_worth);
  put("linkedin_url", ex.linkedin_url);
  put("instagram_url", ex.instagram_url);

  // specialization is a single TEXT column — join arrays with commas.
  if (Array.isArray(ex.specializations) && ex.specializations.length) {
    put("specialization", (ex.specializations as string[]).map((s) => String(s).trim()).filter(Boolean).join(", "));
  } else if (typeof ex.specializations === "string") {
    put("specialization", ex.specializations);
  }

  // notable_projects is also a single TEXT column — join arrays with commas.
  if (Array.isArray(ex.signature_projects) && ex.signature_projects.length) {
    put("notable_projects", (ex.signature_projects as string[]).map((s) => String(s).trim()).filter(Boolean).join(", "));
  } else if (typeof ex.signature_projects === "string") {
    put("notable_projects", ex.signature_projects);
  }

  return out;
}

/**
 * Canonical list of important developer-profile fields the owner cares about.
 * Used to build a "found vs missing" report the UI shows after extraction.
 */
const REPORT_FIELDS: Array<{ key: string; label: string }> = [
  { key: "description", label: "Company description" },
  { key: "founded_year", label: "Founded year" },
  { key: "headquarters", label: "Headquarters" },
  { key: "website", label: "Website" },
  { key: "email", label: "Email" },
  { key: "phone", label: "Office phone" },
  { key: "whatsapp", label: "WhatsApp" },
  { key: "whatsapp_group_url", label: "WhatsApp group" },
  { key: "telegram_group_url", label: "Telegram group / channel" },
  { key: "ceo_name", label: "CEO / Chairman" },
  { key: "founder_name", label: "Founder" },
  { key: "parent_company", label: "Parent company" },
  { key: "license_number", label: "License number" },
  { key: "total_projects", label: "Total projects" },
  { key: "completed_projects", label: "Completed projects" },
  { key: "offplan_projects", label: "Off-plan projects" },
  { key: "units_delivered", label: "Units delivered" },
  { key: "portfolio_worth", label: "Portfolio worth" },
  { key: "years_of_experience", label: "Years of experience" },
  { key: "specializations", label: "Specialisations" },
  { key: "signature_projects", label: "Signature projects" },
  { key: "awards", label: "Awards" },
  { key: "leadership", label: "Leadership team" },
  { key: "linkedin_url", label: "LinkedIn" },
  { key: "instagram_url", label: "Instagram" },
];

function isPresent(v: unknown): boolean {
  if (v === null || v === undefined) return false;
  if (typeof v === "string") return v.trim() !== "";
  if (Array.isArray(v)) return v.length > 0;
  if (typeof v === "number") return Number.isFinite(v);
  return true;
}

function previewValue(v: unknown): string {
  if (v === null || v === undefined) return "";
  if (Array.isArray(v)) return v.slice(0, 4).map(String).join(", ");
  const s = String(v);
  return s.length > 140 ? s.slice(0, 137) + "…" : s;
}

function buildReport(extracted: Record<string, unknown>) {
  const found: Array<{ key: string; label: string; preview: string }> = [];
  const missing: Array<{ key: string; label: string }> = [];
  for (const f of REPORT_FIELDS) {
    if (isPresent(extracted[f.key])) {
      found.push({ key: f.key, label: f.label, preview: previewValue(extracted[f.key]) });
    } else {
      missing.push({ key: f.key, label: f.label });
    }
  }
  return { found, missing };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const { developerId, fileUrl, fileName, documentId } = await req.json();
    if (!developerId || !fileUrl) return json({ error: "developerId and fileUrl required" }, 400);

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const LOVABLE_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_KEY) return json({ error: "LOVABLE_API_KEY missing" }, 500);

    const admin = createClient(SUPABASE_URL, SERVICE);
    const { data: dev } = await admin.from("developers").select("*").eq("id", developerId).single();
    if (!dev) return json({ error: "developer not found" }, 404);

    const fetched = await fetchFile(fileUrl);
    const filePart = fetched.mime.startsWith("image/")
      ? { type: "image_url", image_url: { url: `data:${fetched.mime};base64,${fetched.b64}` } }
      : { type: "file", file: { filename: fileName || "profile.pdf", file_data: `data:${fetched.mime};base64,${fetched.b64}` } };

    // Load the global custom-field registry so the AI reuses stable keys.
    const { data: registryRows } = await admin
      .from("developer_custom_field_defs")
      .select("key, label, field_type, is_active");
    const registry = (registryRows ?? []) as Array<{
      key: string; label: string; field_type: string; is_active: boolean;
    }>;
    const knownList = registry.length
      ? registry.map((r) => `- ${r.key} (${r.field_type}): ${r.label}`).join("\n")
      : "(none yet — feel free to propose new fields)";

    const aiRes = await callGatewayWithRetry({
      model: "google/gemini-2.5-flash",
      messages: [{
        role: "user",
        content: [
          { type: "text", text: `You are a strict UAE property developer company-profile extractor. Read the ENTIRE uploaded document for developer "${dev.name}" and return ONLY minified JSON per the schema below.

VOICE RULE — CRITICAL:
JBJ Global Real Estate is presenting this developer to clients. You are describing "${dev.name}" from the OUTSIDE, in the THIRD person. Never use "we", "our", "us", "I", "join us", or any first-person language in the description. Always rewrite first-person marketing copy into third person: "we understand" → "${dev.name} understands"; "we build" → "${dev.name} builds"; "our vision" → "the company's vision"; "our residents" → "their residents". Keep the facts and numbers from the document, but shift the pronouns. The "description" MUST be 2–4 paragraphs of company overview in this third-person voice, drawn from About / Overview / Who We Are / Vision sections. Unknown fields = null. Never fabricate numbers, awards, contacts, founders, CEOs, or projects.

FOUNDERS / LEADERSHIP / CONTACT RULE:
Extract founder, chairman, CEO, managing director, parent company, phone, email, WhatsApp, LinkedIn, Instagram, group links, founded year, and website ONLY when explicitly stated in the uploaded company profile. If a founder is stated but no CEO is stated, put the founder in "founder_name" and propose a durable custom field {"key":"founder_name","label":"Founder","field_type":"text","value":"..."}; do not invent a CEO. If a field is not stated, return null so the UI can show it under "Missing — please add manually".

KNOWN_CUSTOM_FIELDS (reuse these exact keys inside "custom_fields" — do NOT propose them as new):
${knownList}

${SCHEMA}` },
          filePart,
        ],
      }],
    }, LOVABLE_KEY);

    if (!aiRes.ok) {
      const text = await aiRes.text().catch(() => "");
      const transient = [429, 500, 502, 503, 504].includes(aiRes.status);
      // Return 200 with a fallback signal so the client can handle it gracefully
      // instead of crashing on a non-2xx edge function response.
      return json({
        error: `AI gateway ${aiRes.status}`,
        detail: text.slice(0, 400),
        fallback: transient,
        status: "unavailable",
      }, 200);
    }
    const data = await aiRes.json();
    const raw = data?.choices?.[0]?.message?.content || "{}";
    let extracted: Record<string, unknown> = {};
    try { extracted = JSON.parse(extractJson(raw)); } catch { extracted = {}; }
    extracted.description = enforceThirdPersonVoice(extracted.description, dev.name);

    const current: Record<string, unknown> = {};
    for (const k of Object.keys(extracted)) current[k] = (dev as any)[k] ?? null;

    // 1) Native columns
    const patch = mapToDeveloperColumns(extracted, dev.name);
    let updatedFields: string[] = [];

    // 2) Custom-field values from the AI (existing registry keys)
    const customValues: Record<string, unknown> = {};
    const knownKeys = new Set(registry.map((r) => r.key));
    const aiCustom = (extracted.custom_fields as Record<string, unknown> | null) ?? null;
    if (aiCustom && typeof aiCustom === "object") {
      for (const [k, v] of Object.entries(aiCustom)) {
        if (v === null || v === undefined) continue;
        if (typeof v === "string" && v.trim() === "") continue;
        if (Array.isArray(v) && v.length === 0) continue;
        if (knownKeys.has(k)) customValues[k] = v;
      }
    }

    // 3) Proposed new fields — register globally and store their values.
    const proposed = Array.isArray(extracted.proposed_new_fields)
      ? (extracted.proposed_new_fields as Array<any>)
      : [];
    const registeredNew: string[] = [];
    for (const p of proposed) {
      if (!p || typeof p !== "object") continue;
      const rawKey = String(p.key || "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 60);
      const label = String(p.label || "").trim();
      const allowedTypes = ["text", "longtext", "number", "url", "list", "date"];
      const ftype = allowedTypes.includes(p.field_type) ? p.field_type : "text";
      if (!rawKey || !label) continue;
      if (knownKeys.has(rawKey)) {
        // treat as value only
        if (p.value !== undefined && p.value !== null && p.value !== "") {
          customValues[rawKey] = p.value;
        }
        continue;
      }
      // Insert new registry entry (dedupe on key via unique constraint)
      const { error: insErr } = await admin
        .from("developer_custom_field_defs")
        .insert({
          key: rawKey,
          label,
          field_type: ftype,
          source: "ai_discovered",
          discovered_from_developer_id: developerId,
          sort_order: 100 + registeredNew.length,
        } as any);
      if (!insErr) {
        registeredNew.push(rawKey);
        knownKeys.add(rawKey);
      }
      if (p.value !== undefined && p.value !== null && p.value !== "") {
        customValues[rawKey] = p.value;
      }
    }

    // 4) Merge custom values into the developer's JSON column and write patch.
    if (Object.keys(customValues).length > 0) {
      const existing = ((dev as any).custom_fields as Record<string, unknown>) || {};
      patch.custom_fields = { ...existing, ...customValues };
    }

    if (Object.keys(patch).length > 0) {
      patch.last_enriched_at = new Date().toISOString();
      patch.enrichment_source = "ai_company_profile";
      const { error: updErr } = await admin.from("developers").update(patch).eq("id", developerId);
      if (updErr) return json({ error: `developer update failed: ${updErr.message}` }, 500);
      updatedFields = Object.keys(patch).filter((k) => k !== "last_enriched_at" && k !== "enrichment_source");
    }

    const { data: draft } = await admin.from("enrichment_review_drafts").insert({
      target_type: "developer",
      target_id: developerId,
      target_slug: dev.slug,
      source_document_id: documentId ?? null,
      source_file_url: fileUrl,
      source_file_name: fileName ?? null,
      extracted_fields: extracted,
      current_snapshot: current,
      ai_model: "google/gemini-2.5-flash",
      status: updatedFields.length > 0 ? "applied" : "empty",
    }).select("id").maybeSingle();

    if (documentId) {
      await admin.from("developer_documents").update({ extracted_at: new Date().toISOString() }).eq("id", documentId);
    }

    const report = buildReport(extracted);

    return json({
      ok: true,
      draftId: draft?.id ?? null,
      updatedFields,
      newCustomFields: registeredNew,
      customValues,
      extracted,
      foundFields: report.found,
      missingFields: report.missing,
    });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "unknown" }, 500);
  }
});
