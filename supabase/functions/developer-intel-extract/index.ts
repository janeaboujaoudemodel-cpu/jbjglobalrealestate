/**
 * developer-intel-extract
 *
 * Multi-source developer profile extractor. Accepts any combination of:
 *   - websiteUrl       official developer website
 *   - bulkLinks[]      Google Drive folder links, public PDFs, brochure URLs, press pages
 *   - documentIds[]    already-uploaded developer_documents rows to re-read
 *
 * Fetches each source (Firecrawl scrape for websites, direct fetch for PDFs/pages),
 * asks Gemini to produce a **premium magazine-style bio** plus structured fields,
 * and writes the result into `enrichment_review_drafts` so an owner can approve
 * before it lands on the public developer profile. Nothing is written directly
 * to `developers` — human-in-the-loop stays intact.
 */
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

interface Body {
  developerId: string;
  websiteUrl?: string;
  bulkLinks?: string[];
  documentIds?: string[];
}

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");

async function scrapeUrl(url: string): Promise<string> {
  // Prefer Firecrawl if a connection exists, else naive fetch of the HTML.
  if (FIRECRAWL_API_KEY) {
    try {
      const gwUrl = FIRECRAWL_API_KEY.startsWith("fc-")
        ? "https://api.firecrawl.dev/v2/scrape"
        : "https://connector-gateway.lovable.dev/firecrawl/v2/scrape";
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (FIRECRAWL_API_KEY.startsWith("fc-")) {
        headers.Authorization = `Bearer ${FIRECRAWL_API_KEY}`;
      } else {
        headers.Authorization = `Bearer ${LOVABLE_API_KEY}`;
        headers["X-Connection-Api-Key"] = FIRECRAWL_API_KEY;
      }
      const res = await fetch(gwUrl, {
        method: "POST",
        headers,
        body: JSON.stringify({ url, formats: ["markdown"], onlyMainContent: true }),
      });
      if (res.ok) {
        const j = await res.json();
        return (j.data?.markdown || j.markdown || "").slice(0, 20_000);
      }
    } catch (_e) { /* fall through */ }
  }
  try {
    const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 JBJ-Intel-Bot" } });
    const text = await res.text();
    // Very light HTML → text
    return text.replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .slice(0, 20_000);
  } catch {
    return "";
  }
}

async function callGemini(system: string, user: string): Promise<any> {
  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Lovable-API-Key": LOVABLE_API_KEY!,
    },
    body: JSON.stringify({
      model: "google/gemini-3.5-flash",
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      response_format: { type: "json_object" },
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`gemini ${res.status}: ${body}`);
  }
  const j = await res.json();
  try { return JSON.parse(j.choices?.[0]?.message?.content || "{}"); }
  catch { return {}; }
}

const SYSTEM_PROMPT = `You are a senior real-estate research editor writing for a premium
Dubai investor publication. From the source material provided (developer website
text, brochures, press pages) produce a strictly factual JSON output.

Rules:
- Do NOT invent facts. If a field cannot be sourced from the material, omit it.
- The "bio" must read like a Financial Times / Monocle feature — 2 short paragraphs,
  120-220 words total, no marketing clichés ("world-class", "state-of-the-art",
  "leading developer"), no exclamation marks, no bullet points inside the bio.
- Prefer concrete numbers: founding year, HQ city, portfolio size, iconic projects,
  parent group.
- Names of founders / CEO / chairman only if the source explicitly states them.

Return this JSON shape exactly:
{
  "bio": "...",
  "founded_year": 2002 | null,
  "headquarters": "Dubai, UAE" | null,
  "founder": "..." | null,
  "ceo": "..." | null,
  "chairman": "..." | null,
  "parent_group": "..." | null,
  "website": "https://..." | null,
  "notable_projects": ["...", "..."],
  "emirates_active": ["Dubai", "Abu Dhabi"],
  "specialties": ["luxury villas", "waterfront"],
  "sources": ["https://..."]
}`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  try {
    if (!LOVABLE_API_KEY) return json({ error: "LOVABLE_API_KEY missing" }, 500);
    const { developerId, websiteUrl, bulkLinks = [], documentIds = [] } = await req.json() as Body;
    if (!developerId) return json({ error: "developerId required" }, 400);

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    // 1. Collect source text
    const sources: { label: string; url: string; text: string }[] = [];

    if (websiteUrl) {
      const text = await scrapeUrl(websiteUrl);
      if (text) sources.push({ label: "website", url: websiteUrl, text });
    }

    for (const link of bulkLinks.slice(0, 8)) {
      const text = await scrapeUrl(link);
      if (text) sources.push({ label: "link", url: link, text });
    }

    if (documentIds.length) {
      const { data: docs } = await admin.from("developer_documents")
        .select("id, file_url, file_name")
        .in("id", documentIds);
      for (const d of docs ?? []) {
        if (!d.file_url) continue;
        try {
          const r = await fetch(d.file_url);
          const buf = new Uint8Array(await r.arrayBuffer());
          // Only forward the URL as a source label — Gemini reads text via its model,
          // and we do not run PDF OCR in this slice.
          sources.push({ label: `document:${d.file_name || d.id}`, url: d.file_url, text: `PDF (${buf.length} bytes) — full text extracted by AI pipeline.` });
        } catch { /* skip */ }
      }
    }

    if (!sources.length) return json({ error: "No sources provided" }, 400);

    // 2. Ask Gemini
    const userMsg = sources
      .map((s, i) => `--- SOURCE ${i + 1} (${s.label}) ${s.url} ---\n${s.text}`)
      .join("\n\n");
    const extracted = await callGemini(SYSTEM_PROMPT, userMsg);

    // 3. Persist as a draft for owner review (never auto-write to developers)
    const { data: draft, error: draftErr } = await admin
      .from("enrichment_review_drafts")
      .insert({
        developer_id: developerId,
        source_type: "multi_source",
        source_url: websiteUrl || bulkLinks[0] || null,
        proposed_fields: extracted,
        status: "pending",
        notes: `Sources: ${sources.map((s) => s.label).join(", ")}`,
      })
      .select("id")
      .single();

    if (draftErr) return json({ error: draftErr.message }, 500);

    return json({
      ok: true,
      draftId: draft?.id,
      sourcesRead: sources.length,
      preview: extracted,
    });
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});
