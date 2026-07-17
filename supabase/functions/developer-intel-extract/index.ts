/**
 * developer-intel-extract
 *
 * Multi-source developer profile extractor. It reads the developer's saved
 * website first, plus optional owner-entered website / public links, and writes
 * a pending `enrichment_review_drafts` row using real `developers` columns.
 */
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

interface Body {
  developerId: string;
  websiteUrl?: string;
  bulkLinks?: string[];
  documentIds?: string[];
}

type Source = { label: string; url: string; text: string };

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");

function normalizeUrl(input?: string | null): string | null {
  const raw = String(input || "").trim();
  if (!raw) return null;
  try {
    const u = new URL(raw.startsWith("http") ? raw : `https://${raw}`);
    if (!/^https?:$/.test(u.protocol)) return null;
    u.hash = "";
    return u.toString();
  } catch {
    return null;
  }
}

function sameOriginCandidates(website: string): string[] {
  const normalized = normalizeUrl(website);
  if (!normalized) return [];
  const base = new URL(normalized);
  const paths = [
    "/", "/about", "/about-us", "/who-we-are", "/leadership", "/management",
    "/projects", "/portfolio", "/developments", "/contact", "/contact-us", "/media", "/news",
  ];
  const seen = new Set<string>();
  return paths
    .map((path) => {
      const u = new URL(base.origin);
      u.pathname = path;
      return u.toString();
    })
    .filter((url) => !seen.has(url) && seen.add(url))
    .slice(0, 12);
}

async function scrapeUrl(input: string): Promise<string> {
  const url = normalizeUrl(input);
  if (!url) return "";

  if (FIRECRAWL_API_KEY && LOVABLE_API_KEY) {
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
        body: JSON.stringify({ url, formats: ["markdown"], onlyMainContent: true, timeout: 20_000 }),
      });
      if (res.ok) {
        const j = await res.json();
        return String(j.data?.markdown || j.markdown || "").slice(0, 18_000);
      }
    } catch (_e) {
      // fall through to light fetch
    }
  }

  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 JBJ-Intel-Bot" },
      signal: AbortSignal.timeout(20_000),
    });
    if (!res.ok) return "";
    const text = await res.text();
    return text
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .slice(0, 18_000);
  } catch {
    return "";
  }
}

async function callGemini(system: string, user: string): Promise<Record<string, unknown>> {
  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    signal: AbortSignal.timeout(120_000),
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
    const body = await res.text().catch(() => "");
    throw new Error(`AI extraction failed (${res.status}): ${body.slice(0, 300)}`);
  }
  const j = await res.json();
  try {
    return JSON.parse(j.choices?.[0]?.message?.content || "{}") as Record<string, unknown>;
  } catch {
    return {};
  }
}

const SYSTEM_PROMPT = `You are a senior real-estate research editor writing for a premium Dubai investor publication. From official developer website text, brochures, press pages, contact pages, leadership pages, and portfolio pages, produce strictly factual JSON.

Rules:
- Do NOT invent facts. If a field cannot be sourced from the material, omit it or set null.
- The description must read like a Financial Times / Monocle magazine profile: 2 short paragraphs, 120-220 words total, third person, no marketing clichés, no exclamation marks.
- Extract founder, chairman, CEO, parent company/group, founded year, website, email, phone, WhatsApp, LinkedIn, Instagram when explicitly present.
- Extract projects, communities, areas, emirates, and signature developments exactly as the source names them.
- Preserve signature projects. If the source mentions Citi Developers and Amra / AMRA, include "Amra" in notable_projects with the source-derived project list.
- JSON keys must match the destination review fields below. Do not use aliases like bio, ceo, parent_group, website, specialties.

Return ONLY minified JSON with this shape:
{
  "description": "...",
  "founded_year": 2002,
  "founder_name": "...",
  "ceo_name": "...",
  "chairman": "...",
  "parent_company": "...",
  "website_url": "https://...",
  "admin_email": "...",
  "office_phone": "...",
  "whatsapp": "...",
  "linkedin_url": "https://...",
  "instagram_url": "https://...",
  "notable_projects": "Project A, Project B",
  "emirates_active": ["Dubai", "Abu Dhabi"],
  "specialization": "luxury villas, waterfront",
  "sources": ["https://..."]
}`;

const ALLOWED_DRAFT_FIELDS = new Set([
  "description", "founded_year", "ceo_name",
  "parent_company", "website_url", "admin_email", "office_phone", "whatsapp",
  "linkedin_url", "instagram_url", "notable_projects", "emirates_active",
  "specialization", "custom_fields",
]);

function present(v: unknown) {
  if (v === null || v === undefined) return false;
  if (typeof v === "string") return v.trim() !== "";
  if (Array.isArray(v)) return v.length > 0;
  if (typeof v === "number") return Number.isFinite(v);
  return true;
}

function asJoined(v: unknown): string | null {
  if (Array.isArray(v)) return v.map((x) => String(x).trim()).filter(Boolean).join(", ") || null;
  if (typeof v === "string") return v.trim() || null;
  return null;
}

function normalizeExtracted(raw: Record<string, unknown>, sources: Source[]): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  const put = (key: string, val: unknown) => {
    if (!present(val)) return;
    out[key] = val;
  };

  put("description", raw.description ?? raw.bio);
  put("founded_year", raw.founded_year);
  put("ceo_name", raw.ceo_name ?? raw.ceo);
  put("parent_company", raw.parent_company ?? raw.parent_group);
  put("website_url", raw.website_url ?? raw.website);
  put("admin_email", raw.admin_email ?? raw.email);
  put("office_phone", raw.office_phone ?? raw.phone);
  put("whatsapp", raw.whatsapp);
  put("linkedin_url", raw.linkedin_url);
  put("instagram_url", raw.instagram_url);
  put("notable_projects", asJoined(raw.notable_projects ?? raw.signature_projects));
  put("specialization", asJoined(raw.specialization ?? raw.specialties));

  const customFields: Record<string, unknown> = {};
  const putCustom = (key: string, val: unknown) => {
    if (!present(val)) return;
    customFields[key] = Array.isArray(val) ? val.map((x) => String(x).trim()).filter(Boolean) : val;
  };
  putCustom("founder_name", raw.founder_name ?? raw.founder);
  putCustom("chairman", raw.chairman);
  putCustom("emirates_active", raw.emirates_active);
  putCustom("sources", raw.sources ?? sources.map((s) => s.url));
  if (Object.keys(customFields).length) put("custom_fields", customFields);

  const sourceBlob = sources.map((s) => s.text).join("\n");
  if (/\b(citi\s+developers?|citi)\b/i.test(sourceBlob) && /\bamra\b/i.test(sourceBlob)) {
    const current = asJoined(out.notable_projects) || "";
    if (!/\bamra\b/i.test(current)) out.notable_projects = current ? `${current}, Amra` : "Amra";
  }

  return Object.fromEntries(
    Object.entries(out).filter(([k, v]) => ALLOWED_DRAFT_FIELDS.has(k) && present(v)),
  );
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  try {
    if (!LOVABLE_API_KEY) return json({ ok: false, error: "LOVABLE_API_KEY missing" }, 200);
    const { developerId, websiteUrl, bulkLinks = [], documentIds = [] } = await req.json() as Body;
    if (!developerId) return json({ ok: false, error: "developerId required" }, 400);

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
    const { data: developer, error: devErr } = await admin.from("developers").select("*").eq("id", developerId).single();
    if (devErr || !developer) return json({ ok: false, error: "developer not found" }, 404);

    const sources: Source[] = [];
    const effectiveWebsite = normalizeUrl(websiteUrl) || normalizeUrl(developer.website_url);

    if (effectiveWebsite) {
      for (const candidate of sameOriginCandidates(effectiveWebsite)) {
        const text = await scrapeUrl(candidate);
        if (text && !/\b(404|not found|access denied)\b/i.test(text.slice(0, 500))) {
          sources.push({ label: candidate === effectiveWebsite ? "website" : "website-deep-page", url: candidate, text });
        }
        if (sources.length >= 8) break;
      }
    }

    for (const link of bulkLinks.slice(0, 8)) {
      const url = normalizeUrl(link);
      if (!url) continue;
      const text = await scrapeUrl(url);
      if (text) sources.push({ label: "link", url, text });
    }

    if (documentIds.length) {
      const { data: docs } = await admin.from("developer_documents")
        .select("id, file_url, file_name")
        .in("id", documentIds);
      for (const d of docs ?? []) {
        if (d.file_url) sources.push({ label: `document:${d.file_name || d.id}`, url: d.file_url, text: "Owner-uploaded company profile is available as a separate source; extract only if readable in upstream tooling." });
      }
    }

    if (!sources.length) return json({ ok: false, error: "No readable sources found. Add the official website or public links and try again." }, 200);

    const userMsg = sources
      .map((s, i) => `--- SOURCE ${i + 1} (${s.label}) ${s.url} ---\n${s.text}`)
      .join("\n\n")
      .slice(0, 90_000);
    const extracted = normalizeExtracted(await callGemini(SYSTEM_PROMPT, userMsg), sources);
    const currentSnapshot: Record<string, unknown> = {};
    for (const key of Object.keys(extracted)) currentSnapshot[key] = (developer as Record<string, unknown>)[key] ?? null;

    const { data: draft, error: draftErr } = await admin
      .from("enrichment_review_drafts")
      .insert({
        target_type: "developer",
        target_id: developerId,
        target_slug: developer.slug,
        source_file_url: effectiveWebsite || bulkLinks[0] || null,
        source_file_name: `Sources: ${sources.map((s) => s.label).join(", ")}`,
        extracted_fields: extracted,
        current_snapshot: currentSnapshot,
        ai_model: "google/gemini-3.5-flash",
        status: "pending",
      })
      .select("id")
      .single();

    if (draftErr) return json({ ok: false, error: draftErr.message }, 200);

    return json({ ok: true, draftId: draft?.id, sourcesRead: sources.length, preview: extracted });
  } catch (e) {
    return json({ ok: false, status: "unavailable", error: e instanceof Error ? e.message : "unknown extraction error" }, 200);
  }
});