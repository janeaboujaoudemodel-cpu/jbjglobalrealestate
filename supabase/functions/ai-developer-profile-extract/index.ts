// Extracts developer-level fields from an uploaded PDF company profile /
// brochure using Lovable AI (Gemini multimodal) and writes them into
// enrichment_review_drafts with status='pending' for owner review.
//
// Never overwrites existing developer fields — the review UI only fills empties.
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
  "total_projects": number|null,
  "completed_projects": number|null,
  "units_delivered": number|null,
  "years_of_experience": number|null,
  "specializations": string[]|null,
  "signature_projects": string[]|null,
  "awards": string[]|null,
  "leadership": string[]|null,
  "tagline": string|null,
  "mission": string|null
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
            { type: "text", text: `You are a strict UAE property developer company-profile extractor. Read the uploaded file for developer "${dev.name}" and return ONLY the JSON per schema. Never fabricate — unknown = null.\n\n${SCHEMA}` },
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

    // Snapshot current developer values (only for the extracted keys) so the UI can diff.
    const current: Record<string, unknown> = {};
    for (const k of Object.keys(extracted)) current[k] = (dev as any)[k] ?? null;

    const { data: draft, error: dErr } = await admin.from("enrichment_review_drafts").insert({
      target_type: "developer",
      target_id: developerId,
      target_slug: dev.slug,
      source_document_id: documentId ?? null,
      source_file_url: fileUrl,
      source_file_name: fileName ?? null,
      extracted_fields: extracted,
      current_snapshot: current,
      ai_model: "google/gemini-2.5-flash",
      status: "pending",
    }).select("id").single();
    if (dErr) return json({ error: dErr.message }, 500);

    if (documentId) {
      await admin.from("developer_documents").update({ extracted_at: new Date().toISOString() }).eq("id", documentId);
    }

    return json({ ok: true, draftId: draft.id, extracted });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "unknown" }, 500);
  }
});
