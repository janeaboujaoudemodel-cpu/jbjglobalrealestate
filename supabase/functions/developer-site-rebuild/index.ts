// developer-site-rebuild
// Scrapes a developer's official site via Firecrawl, extracts structured fields
// via Lovable AI, and either STAGES the result into developer_enrichment_log
// (preview=true) or APPLIES it directly to developers row (preview=false).
//
// Never deletes any rows or media. Owner-only.

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { requireOwnerAuth } from "../_shared/owner-auth-middleware.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const FIRECRAWL_BASE = "https://api.firecrawl.dev/v2";

interface Body {
  developer_id?: string;
  developer_ids?: string[];
  preview?: boolean; // true => stage to enrichment_log; false => apply directly
}

function admin() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );
}

async function firecrawlSearch(query: string): Promise<string | null> {
  const key = Deno.env.get("FIRECRAWL_API_KEY");
  if (!key) return null;
  try {
    const r = await fetch(`${FIRECRAWL_BASE}/search`, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ query, limit: 3 }),
    });
    const j = await r.json();
    const results = j?.data ?? j?.web?.results ?? [];
    const first = Array.isArray(results) ? results[0] : null;
    return first?.url ?? null;
  } catch (e) {
    console.error("firecrawl search failed", e);
    return null;
  }
}

async function firecrawlScrape(url: string) {
  const key = Deno.env.get("FIRECRAWL_API_KEY");
  if (!key) throw new Error("FIRECRAWL_API_KEY not configured");
  const r = await fetch(`${FIRECRAWL_BASE}/scrape`, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      url,
      formats: ["markdown", "branding", "summary", "links"],
      onlyMainContent: true,
    }),
  });
  const j = await r.json();
  if (!r.ok) throw new Error(`firecrawl scrape ${r.status}: ${JSON.stringify(j).slice(0, 200)}`);
  // SDK v2 fields land on root; REST may wrap in .data
  return j.data ?? j;
}

async function aiExtract(name: string, markdown: string) {
  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");
  const prompt =
`Below is the homepage content of a real estate developer named "${name}".
Extract a STRICT JSON object with these keys (use null if not clearly stated; never invent):
{
  "description": "2-4 sentence company overview written as third-person institutional copy",
  "founded_year": <integer or null>,
  "headquarters": "City, Country or null",
  "ceo_name": "Full name or null",
  "specialization": "Short phrase (luxury, off-plan, hospitality, etc.) or null",
  "instagram_url": "https URL or null",
  "linkedin_url": "https URL or null",
  "notable_projects": "Comma-separated list of up to 6 project names or null"
}
No markdown, no commentary, JUST the JSON.

HOMEPAGE CONTENT:
${markdown.slice(0, 12000)}`;

  const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    }),
  });
  if (!r.ok) {
    const t = await r.text();
    throw new Error(`AI gateway ${r.status}: ${t.slice(0, 200)}`);
  }
  const j = await r.json();
  const txt = j?.choices?.[0]?.message?.content ?? "{}";
  try {
    return JSON.parse(txt);
  } catch {
    return {};
  }
}

async function downloadAndHostLogo(supa: ReturnType<typeof admin>, devSlug: string, logoUrl: string): Promise<string | null> {
  try {
    const r = await fetch(logoUrl);
    if (!r.ok) return null;
    const ct = r.headers.get("content-type") ?? "image/png";
    const ext = ct.includes("svg") ? "svg" : ct.includes("webp") ? "webp" : ct.includes("jpeg") || ct.includes("jpg") ? "jpg" : "png";
    const buf = new Uint8Array(await r.arrayBuffer());
    const path = `${devSlug}/${Date.now()}.${ext}`;
    const { error } = await supa.storage.from("developer-logos").upload(path, buf, {
      contentType: ct,
      upsert: true,
    });
    if (error) {
      console.error("logo upload failed", error.message);
      return null;
    }
    const { data } = supa.storage.from("developer-logos").getPublicUrl(path);
    return data.publicUrl;
  } catch (e) {
    console.error("logo host failed", e);
    return null;
  }
}

async function processOne(supa: ReturnType<typeof admin>, developerId: string, preview: boolean) {
  const { data: dev, error } = await supa
    .from("developers")
    .select("id, name, slug, logo_url, logo_locked, description, website_url, founded_year, headquarters, ceo_name, specialization, instagram_url, linkedin_url, notable_projects")
    .eq("id", developerId)
    .maybeSingle();
  if (error || !dev) throw new Error(`developer not found: ${developerId}`);

  // 1. Resolve website
  let website = dev.website_url?.trim() || null;
  if (!website) {
    website = await firecrawlSearch(`"${dev.name}" Dubai UAE official developer site`);
  }
  if (!website) {
    await supa.from("developer_enrichment_log").insert({
      developer_id: dev.id,
      source_urls: [],
      fields_filled: {},
      after_jsonb: {},
      before_jsonb: dev,
      status: "failed",
      error: "no website found",
    });
    return { developer_id: dev.id, status: "failed", reason: "no website found" };
  }

  // 2. Scrape
  const scraped = await firecrawlScrape(website);
  const markdown: string = scraped?.markdown ?? "";
  const branding = scraped?.branding ?? {};
  const logoCandidate: string | null = branding?.logo ?? branding?.images?.logo ?? null;

  // 3. AI structured extraction
  const ai = await aiExtract(dev.name, markdown);

  // 4. Host logo
  let hostedLogo: string | null = null;
  if (logoCandidate && !dev.logo_locked) {
    hostedLogo = await downloadAndHostLogo(supa, dev.slug, logoCandidate);
  }

  // 5. Build after_jsonb (only fields we have new values for)
  const after: Record<string, unknown> = {};
  if (ai.description) after.description = ai.description;
  if (ai.founded_year && Number.isInteger(ai.founded_year)) after.founded_year = ai.founded_year;
  if (ai.headquarters) after.headquarters = ai.headquarters;
  if (ai.ceo_name) after.ceo_name = ai.ceo_name;
  if (ai.specialization) after.specialization = ai.specialization;
  if (ai.instagram_url) after.instagram_url = ai.instagram_url;
  if (ai.linkedin_url) after.linkedin_url = ai.linkedin_url;
  if (ai.notable_projects) after.notable_projects = ai.notable_projects;
  if (hostedLogo) after.logo_url = hostedLogo;
  after.website_url = website;
  after.last_enriched_at = new Date().toISOString();
  after.enrichment_source = "developer-site-rebuild";

  // 6. Stage to log
  const { data: logRow, error: logErr } = await supa
    .from("developer_enrichment_log")
    .insert({
      developer_id: dev.id,
      source_urls: [website],
      fields_filled: Object.keys(after).reduce((acc, k) => ({ ...acc, [k]: true }), {}),
      before_jsonb: dev,
      after_jsonb: after,
      source_url: website,
      status: preview ? "staged" : "applied",
      model: "google/gemini-2.5-flash",
    })
    .select("id")
    .single();
  if (logErr) throw new Error(`log insert failed: ${logErr.message}`);

  // 7. If not preview, apply
  if (!preview) {
    const { error: upErr } = await supa.from("developers").update(after).eq("id", dev.id);
    if (upErr) {
      await supa.from("developer_enrichment_log").update({ status: "failed", error: upErr.message }).eq("id", logRow.id);
      throw new Error(`developer update failed: ${upErr.message}`);
    }
    await supa.from("developer_enrichment_log").update({ applied_at: new Date().toISOString() }).eq("id", logRow.id);
  }

  return { developer_id: dev.id, status: "ok", log_id: logRow.id, website, fields: Object.keys(after) };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const gate = await requireOwnerAuth(req, corsHeaders);
  if (gate.response) return gate.response;

  let body: Body = {};
  try { body = await req.json(); } catch { /* ignore */ }

  const ids = body.developer_ids?.length
    ? body.developer_ids
    : body.developer_id
    ? [body.developer_id]
    : [];
  if (ids.length === 0) {
    return new Response(JSON.stringify({ error: "developer_id or developer_ids required" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  if (ids.length > 25) {
    return new Response(JSON.stringify({ error: "max 25 developers per run" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const preview = body.preview !== false; // default true
  const supa = admin();
  const results: unknown[] = [];

  for (const id of ids) {
    try {
      const r = await processOne(supa, id, preview);
      results.push(r);
    } catch (e) {
      console.error("processOne failed", id, e);
      results.push({ developer_id: id, status: "error", error: (e as Error).message });
    }
    // ~1 req/sec to respect Firecrawl quotas
    await new Promise((r) => setTimeout(r, 1100));
  }

  return new Response(JSON.stringify({ ok: true, preview, results }), {
    status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
