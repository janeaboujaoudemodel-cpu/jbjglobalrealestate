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

const AI_TIMEOUT_MS = 90_000;
const MAX_FILE_BYTES = 20 * 1024 * 1024;

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
  "ceo_name": string|null,
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
  "instagram_url": string|null
}`;

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
  const r = await fetch(url, { signal: AbortSignal.timeout(45_000) });
  if (!r.ok) throw new Error(`File fetch failed (${r.status})`);
  const buf = new Uint8Array(await r.arrayBuffer());
  if (buf.byteLength > MAX_FILE_BYTES) throw new Error(`File larger than 20MB`);
  return { b64: toBase64(buf), mime: r.headers.get("content-type") || "application/pdf" };
}

/** Map the AI JSON to actual `developers` table columns. */
function mapToDeveloperColumns(ex: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  const put = (col: string, val: unknown) => {
    if (val === undefined || val === null) return;
    if (typeof val === "string" && val.trim() === "") return;
    if (Array.isArray(val) && val.length === 0) return;
    out[col] = val;
  };

  put("description", ex.description);
  put("founded_year", ex.founded_year);
  put("headquarters", ex.headquarters);
  put("website_url", ex.website);
  put("ceo_name", ex.ceo_name);
  put("parent_company", ex.parent_company);
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

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      signal: AbortSignal.timeout(AI_TIMEOUT_MS),
      headers: { "Content-Type": "application/json", "Lovable-API-Key": LOVABLE_KEY, "X-Lovable-AIG-SDK": "supabase-edge-function" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{
          role: "user",
          content: [
            { type: "text", text: `You are a strict UAE property developer company-profile extractor. Read the entire uploaded document for developer "${dev.name}" and return ONLY the JSON per schema. Copy text verbatim from the document (do not paraphrase). The "description" MUST be a 2–4 paragraph verbatim / near-verbatim company overview taken from the document (About / Overview / Who We Are / Vision sections). Unknown fields = null. Never fabricate.\n\n${SCHEMA}` },
            filePart,
          ],
        }],
      }),
    });

    if (!aiRes.ok) {
      const text = await aiRes.text().catch(() => "");
      return json({ error: `AI gateway ${aiRes.status}`, detail: text.slice(0, 400) }, aiRes.status === 429 ? 429 : 502);
    }
    const data = await aiRes.json();
    const raw = data?.choices?.[0]?.message?.content || "{}";
    let extracted: Record<string, unknown> = {};
    try { extracted = JSON.parse(extractJson(raw)); } catch { extracted = {}; }

    // Snapshot of current developer values for the audit row.
    const current: Record<string, unknown> = {};
    for (const k of Object.keys(extracted)) current[k] = (dev as any)[k] ?? null;

    // Map to actual columns and apply directly. Description is always replaced
    // (when non-empty) because the owner uploaded the official profile.
    const patch = mapToDeveloperColumns(extracted);
    let updatedFields: string[] = [];
    if (Object.keys(patch).length > 0) {
      patch.last_enriched_at = new Date().toISOString();
      patch.enrichment_source = "ai_company_profile";
      const { error: updErr } = await admin.from("developers").update(patch).eq("id", developerId);
      if (updErr) return json({ error: `developer update failed: ${updErr.message}` }, 500);
      updatedFields = Object.keys(patch).filter((k) => k !== "last_enriched_at" && k !== "enrichment_source");
    }

    // Audit trail — mark as applied so it doesn't clutter the pending queue.
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

    return json({ ok: true, draftId: draft?.id ?? null, updatedFields, extracted });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "unknown" }, 500);
  }
});
