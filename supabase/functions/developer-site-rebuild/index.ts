// developer-site-rebuild
// Scrapes a developer's official site via Firecrawl (homepage + best-matching
// about/contact/projects sub-pages), extracts structured fields via Lovable AI,
// then STAGES the result into developer_enrichment_log (preview=true) or APPLIES
// it directly (preview=false). Logo fallback chain: branding -> favicon -> Clearbit.
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
  preview?: boolean;
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

async function firecrawlScrape(url: string, withRawHtml = false) {
  const key = Deno.env.get("FIRECRAWL_API_KEY");
  if (!key) throw new Error("FIRECRAWL_API_KEY not configured");
  const formats: unknown[] = ["markdown", "branding", "links"];
  if (withRawHtml) formats.push("rawHtml");
  const r = await fetch(`${FIRECRAWL_BASE}/scrape`, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ url, formats, onlyMainContent: true }),
  });
  const j = await r.json();
  if (!r.ok) throw new Error(`firecrawl scrape ${r.status}: ${JSON.stringify(j).slice(0, 200)}`);
  return j.data ?? j;
}

/** Pick up to 2 sub-page URLs whose path looks like about/contact/projects. */
function pickSubPages(homepage: string, links: string[]): string[] {
  if (!Array.isArray(links) || !links.length) return [];
  const host = (() => { try { return new URL(homepage).hostname; } catch { return ""; } })();
  const score = (u: string) => {
    try {
      const url = new URL(u);
      if (host && url.hostname !== host) return -1;
      const p = url.pathname.toLowerCase();
      if (/\b(about|company|who-we-are|about-us)\b/.test(p)) return 4;
      if (/\b(contact|reach-us|get-in-touch|locations?)\b/.test(p)) return 3;
      if (/\b(projects?|portfolio|developments?|properties)\b/.test(p)) return 2;
      return -1;
    } catch { return -1; }
  };
  const ranked = links
    .map((u) => ({ u, s: score(u) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s);
  const seen = new Set<string>();
  const out: string[] = [];
  for (const { u } of ranked) {
    if (out.length >= 2) break;
    if (seen.has(u) || u === homepage) continue;
    seen.add(u);
    out.push(u);
  }
  return out;
}

async function aiExtract(name: string, combinedMarkdown: string) {
  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");
  const prompt =
`You are extracting structured information about a real estate developer named "${name}".
Below are excerpts from the developer's homepage and (when available) their About / Contact / Projects pages.
Return a STRICT JSON object with these keys. Use null when the value is not clearly stated. Never invent.

{
  "description": "2-4 sentence company overview written as institutional third-person copy",
  "founded_year": <integer or null>,
  "years_active": <integer or null, computed only if founded_year is present>,
  "headquarters": "City, Country or null",
  "ceo_name": "Full name or null",
  "specialization": "Short phrase (e.g. luxury off-plan, hospitality, master communities) or null",
  "instagram_url": "https URL or null",
  "linkedin_url": "https URL or null",
  "office_phone": "+international format or null",
  "whatsapp": "+international format (digits only with leading +) or null",
  "office_address": "Full street address or null",
  "google_maps_url": "https://maps... or https://goo.gl/maps/... or null",
  "completed_projects": <integer or null>,
  "total_units_delivered": <integer or null>,
  "notable_projects": "Comma-separated list of up to 10 project names or null"
}

No markdown. No commentary. JUST the JSON.

CONTENT:
${combinedMarkdown.slice(0, 24000)}`;

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
  try { return JSON.parse(txt); } catch { return {}; }
}

async function downloadAndHostLogo(
  supa: ReturnType<typeof admin>,
  devSlug: string,
  logoUrl: string,
): Promise<string | null> {
  try {
    const r = await fetch(logoUrl);
    if (!r.ok) return null;
    const ct = r.headers.get("content-type") ?? "image/png";
    if (!/image\//.test(ct)) return null;
    const ext = ct.includes("svg") ? "svg"
      : ct.includes("webp") ? "webp"
      : ct.includes("jpeg") || ct.includes("jpg") ? "jpg"
      : ct.includes("png") ? "png"
      : "img";
    const buf = new Uint8Array(await r.arrayBuffer());
    if (buf.byteLength < 200) return null; // likely a 1x1 placeholder
    const path = `${devSlug}/${Date.now()}.${ext}`;
    const { error } = await supa.storage.from("developer-logos").upload(path, buf, {
      contentType: ct,
      upsert: true,
    });
    if (error) { console.error("logo upload failed", error.message); return null; }
    const { data } = supa.storage.from("developer-logos").getPublicUrl(path);
    return data.publicUrl;
  } catch (e) {
    console.error("logo host failed", e);
    return null;
  }
}

/** Extract the best <link rel="icon"> href from raw HTML. */
function extractFaviconFromHtml(html: string, baseUrl: string): string | null {
  if (!html) return null;
  const rx = /<link[^>]+rel=["']?([^"'>\s]+)["']?[^>]*>/gi;
  const matches: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = rx.exec(html))) {
    const tag = m[0];
    const rel = m[1].toLowerCase();
    if (!/icon|apple-touch-icon/.test(rel)) continue;
    const href = /href=["']([^"']+)["']/i.exec(tag)?.[1];
    if (href) matches.push(href);
  }
  if (!matches.length) return null;
  // Prefer apple-touch-icon (larger), fall back to first
  const pick = matches.find((h) => /apple-touch-icon/.test(h)) ?? matches[0];
  try { return new URL(pick, baseUrl).toString(); } catch { return null; }
}

async function resolveLogo(
  supa: ReturnType<typeof admin>,
  devSlug: string,
  website: string,
  branding: { logo?: string; images?: { logo?: string } } | undefined,
  rawHtml: string,
): Promise<string | null> {
  // 1. branding.logo
  const candidates: string[] = [];
  if (branding?.logo) candidates.push(branding.logo);
  if (branding?.images?.logo) candidates.push(branding.images.logo);
  // 2. favicon / apple-touch-icon from raw HTML
  const fav = extractFaviconFromHtml(rawHtml, website);
  if (fav) candidates.push(fav);
  // 3. Clearbit fallback
  try {
    const h = new URL(website).hostname.replace(/^www\./, "");
    candidates.push(`https://logo.clearbit.com/${h}`);
  } catch { /* ignore */ }

  for (const c of candidates) {
    const hosted = await downloadAndHostLogo(supa, devSlug, c);
    if (hosted) return hosted;
  }
  return null;
}

async function processOne(supa: ReturnType<typeof admin>, developerId: string, preview: boolean) {
  const { data: dev, error } = await supa
    .from("developers")
    .select("id, name, slug, logo_url, logo_locked, description, website_url, founded_year, headquarters, ceo_name, specialization, instagram_url, linkedin_url, office_phone, whatsapp, office_address, google_maps_url, completed_projects, total_units_delivered, notable_projects")
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

  // 2. Scrape homepage (with raw HTML for favicon fallback)
  const home = await firecrawlScrape(website, true);
  const homeMarkdown: string = home?.markdown ?? "";
  const branding = home?.branding ?? {};
  const rawHtml: string = home?.rawHtml ?? home?.html ?? "";
  const links: string[] = home?.links ?? [];

  // 3. Scrape up to 2 sub-pages (about / contact / projects)
  const subUrls = pickSubPages(website, links);
  const subMarkdowns: string[] = [];
  const sourceUrls: string[] = [website];
  for (const su of subUrls) {
    try {
      const s = await firecrawlScrape(su, false);
      const md: string = s?.markdown ?? "";
      if (md) {
        subMarkdowns.push(`\n\n--- PAGE: ${su} ---\n${md}`);
        sourceUrls.push(su);
      }
      await new Promise((r) => setTimeout(r, 600));
    } catch (e) {
      console.error("sub-page scrape failed", su, e);
    }
  }
  const combined = `--- HOMEPAGE: ${website} ---\n${homeMarkdown}${subMarkdowns.join("")}`;

  // 4. AI extraction
  const ai = await aiExtract(dev.name, combined);

  // 5. Logo (fallback chain)
  let hostedLogo: string | null = null;
  if (!dev.logo_locked) {
    hostedLogo = await resolveLogo(supa, dev.slug, website, branding, rawHtml);
  }

  // 6. Build after_jsonb — only fields where AI returned a non-null value
  const after: Record<string, unknown> = {};
  const setIf = (k: string, v: unknown) => {
    if (v === null || v === undefined) return;
    if (typeof v === "string" && !v.trim()) return;
    after[k] = v;
  };
  setIf("description", ai.description);
  if (Number.isInteger(ai.founded_year)) after.founded_year = ai.founded_year;
  if (Number.isInteger(ai.completed_projects)) after.completed_projects = ai.completed_projects;
  if (Number.isInteger(ai.total_units_delivered)) after.total_units_delivered = ai.total_units_delivered;
  setIf("headquarters", ai.headquarters);
  setIf("ceo_name", ai.ceo_name);
  setIf("specialization", ai.specialization);
  setIf("instagram_url", ai.instagram_url);
  setIf("linkedin_url", ai.linkedin_url);
  setIf("office_phone", ai.office_phone);
  setIf("whatsapp", ai.whatsapp);
  setIf("office_address", ai.office_address);
  setIf("google_maps_url", ai.google_maps_url);
  if (Array.isArray(ai.notable_projects)) {
    after.notable_projects = ai.notable_projects.filter(Boolean).join(", ");
  } else {
    setIf("notable_projects", ai.notable_projects);
  }
  if (hostedLogo) after.logo_url = hostedLogo;
  after.website_url = website;
  after.last_enriched_at = new Date().toISOString();
  after.enrichment_source = "developer-site-rebuild";

  // 7. Stage to log
  const { data: logRow, error: logErr } = await supa
    .from("developer_enrichment_log")
    .insert({
      developer_id: dev.id,
      source_urls: sourceUrls,
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

  // 8. If not preview, apply via merge (never null-out existing values)
  if (!preview) {
    const merged: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(after)) {
      if (v !== null && v !== undefined && v !== "") merged[k] = v;
    }
    const { error: upErr } = await supa.from("developers").update(merged).eq("id", dev.id);
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

  const preview = body.preview !== false;
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
    await new Promise((r) => setTimeout(r, 1100));
  }

  return new Response(JSON.stringify({ ok: true, preview, results }), {
    status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
