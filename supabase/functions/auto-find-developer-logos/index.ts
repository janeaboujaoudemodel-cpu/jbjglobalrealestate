/**
 * auto-find-developer-logos
 *
 * For each developer with logo_status='missing' (or explicit ids passed in),
 * uses Firecrawl to find the official site, scrapes branding, validates the
 * candidate logo with strict checks, downloads it to the developer-logos
 * bucket, and writes logo_url + logo_status='approved' in one shot.
 *
 * Approved logos are protected by the DB trigger trg_protect_approved_logos
 * so this function can NEVER overwrite them — it only touches 'missing' rows.
 *
 * Never guesses. If no candidate passes all checks, marks the developer as
 * logo_status='unavailable' so the queue can move on.
 */
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const FIRECRAWL_V2 = "https://api.firecrawl.dev/v2";

// Mirror of src/utils/developerLogo.ts FORBIDDEN_LOGO_PATTERNS (subset relevant to scraping)
const FORBIDDEN_LOGO_PATTERNS: RegExp[] = [
  /screenshot/i,
  /whatsapp/i,
  /convert\.io/i,
  /\/frame\+?\d/i,
  /1080x1080/i,
  /\/[0-9]{8,}\.(jpg|jpeg|png|webp)(\?|$)/i,
  /logo-white-1/i,
  /logodix\.com/i,
  /snapedit/i,
  /\/x\/16x16\//i,
  /\/x\/[0-9]{2,3}x[0-9]{2,3}\//i,
];

const ALLOWED_MIME = new Set([
  "image/png",
  "image/svg+xml",
  "image/webp",
  "image/jpeg",
  "image/jpg",
]);

// Competitor / portal domains to exclude as logo sources
const COMPETITOR_HOSTS = [
  "bayut", "propertyfinder", "dubizzle", "zoopla", "rightmove",
  "realtor", "trulia", "zillow", "redfin", "reidin",
  "houza", "propsearch", "driven", "fam-properties", "betterhomes",
  "huspy", "luxhabitat", "engelvoelkers", "haus-haus",
];

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "")
    .trim();
}

function isAllowedLogoUrl(url: string): boolean {
  if (!url || typeof url !== "string") return false;
  if (!/^https?:\/\//i.test(url)) return false;
  return !FORBIDDEN_LOGO_PATTERNS.some((p) => p.test(url));
}

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return "";
  }
}

function isCompetitorHost(host: string): boolean {
  return COMPETITOR_HOSTS.some((c) => host.includes(c));
}

function nameMatchesUrlOrHost(name: string, url: string): boolean {
  const slug = slugify(name);
  if (slug.length < 3) return false;
  const host = hostOf(url).replace(/[^a-z0-9]/g, "");
  const path = url.toLowerCase();
  // host contains slug, OR file path mentions the slug, OR slug fully contained in path
  if (host.includes(slug)) return true;
  if (path.includes(slug)) return true;
  // Try first significant token (e.g. "emaar" from "Emaar Properties")
  const firstToken = slugify(name.split(/\s+/)[0] || "");
  if (firstToken.length >= 4 && (host.includes(firstToken) || path.includes(firstToken))) return true;
  return false;
}

async function firecrawlSearch(apiKey: string, query: string): Promise<Array<{ url: string; title?: string }>> {
  const res = await fetch(`${FIRECRAWL_V2}/search`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query, limit: 6 }),
  });
  if (!res.ok) {
    console.warn(`[firecrawl search] ${res.status}: ${await res.text().catch(() => "")}`);
    return [];
  }
  const j = await res.json().catch(() => ({}));
  const raw = j?.data?.web ?? j?.data ?? j?.web ?? [];
  if (!Array.isArray(raw)) return [];
  return raw
    .map((r: any) => ({ url: r?.url ?? r?.link ?? "", title: r?.title }))
    .filter((r: any) => typeof r.url === "string" && r.url.startsWith("http"));
}

async function firecrawlBranding(apiKey: string, url: string): Promise<{ logo?: string; favicon?: string; images?: any } | null> {
  const res = await fetch(`${FIRECRAWL_V2}/scrape`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ url, formats: ["branding"], onlyMainContent: false }),
  });
  if (!res.ok) {
    console.warn(`[firecrawl branding ${url}] ${res.status}`);
    return null;
  }
  const j = await res.json().catch(() => ({}));
  const b = j?.data?.branding ?? j?.branding ?? null;
  if (!b) return null;
  return {
    logo: b.logo,
    favicon: b?.images?.favicon,
    images: b.images,
  };
}

async function headValidate(url: string): Promise<{ ok: boolean; contentType?: string; size?: number }> {
  try {
    const r = await fetch(url, { method: "HEAD", redirect: "follow" });
    if (!r.ok) return { ok: false };
    const ct = (r.headers.get("content-type") || "").toLowerCase().split(";")[0].trim();
    const len = Number(r.headers.get("content-length") || 0);
    if (!ALLOWED_MIME.has(ct)) return { ok: false, contentType: ct };
    // 1 KB .. 3 MB
    if (len > 0 && (len < 1024 || len > 3 * 1024 * 1024)) return { ok: false, contentType: ct, size: len };
    return { ok: true, contentType: ct, size: len };
  } catch {
    return { ok: false };
  }
}

async function downloadBytes(url: string): Promise<{ bytes: Uint8Array; contentType: string } | null> {
  try {
    const r = await fetch(url, { redirect: "follow" });
    if (!r.ok) return null;
    const ct = (r.headers.get("content-type") || "image/png").toLowerCase().split(";")[0].trim();
    const buf = new Uint8Array(await r.arrayBuffer());
    if (buf.byteLength < 1024 || buf.byteLength > 3 * 1024 * 1024) return null;
    return { bytes: buf, contentType: ct };
  } catch {
    return null;
  }
}

function extFor(ct: string): string {
  if (ct.includes("svg")) return "svg";
  if (ct.includes("webp")) return "webp";
  if (ct.includes("jpeg") || ct.includes("jpg")) return "jpg";
  return "png";
}

type DevRow = { id: string; name: string; slug: string | null; website_url?: string | null };

async function processDeveloper(
  supabase: any,
  apiKey: string,
  dev: DevRow,
): Promise<{ id: string; name: string; status: "approved" | "unavailable" | "error"; reason?: string; url?: string }> {
  // 1) discover candidate sites
  let sites: string[] = [];
  if (dev.website_url && /^https?:\/\//i.test(dev.website_url)) sites.push(dev.website_url);

  const searchHits = await firecrawlSearch(
    apiKey,
    `${dev.name} Dubai UAE real estate developer official website`,
  );
  for (const h of searchHits) {
    const host = hostOf(h.url);
    if (!host || isCompetitorHost(host)) continue;
    // Prefer the homepage of each unique host
    const root = `https://${host}/`;
    if (!sites.includes(root)) sites.push(root);
    if (sites.length >= 4) break;
  }

  if (sites.length === 0) {
    return finalizeUnavailable(supabase, dev, "no_site");
  }

  // 2) try each site, take first that yields a valid logo
  for (const site of sites) {
    const branding = await firecrawlBranding(apiKey, site);
    if (!branding) continue;

    const candidates: string[] = [];
    if (branding.logo) candidates.push(branding.logo);
    if (branding.images?.logo) candidates.push(branding.images.logo);

    for (const candidate of candidates) {
      if (!candidate || !isAllowedLogoUrl(candidate)) continue;
      // Host of candidate must match the site we just scraped (no cross-domain leak)
      const candHost = hostOf(candidate);
      const siteHost = hostOf(site);
      if (candHost && siteHost && candHost !== siteHost && !candHost.endsWith(`.${siteHost}`)) {
        // also allow CDNs of the same brand if filename matches
        if (!nameMatchesUrlOrHost(dev.name, candidate)) continue;
      }

      // Name must show up in either the site host or the candidate URL
      if (!nameMatchesUrlOrHost(dev.name, site) && !nameMatchesUrlOrHost(dev.name, candidate)) {
        continue;
      }

      const head = await headValidate(candidate);
      if (!head.ok) continue;

      const dl = await downloadBytes(candidate);
      if (!dl) continue;

      const ext = extFor(dl.contentType);
      const path = `${dev.slug || dev.id}/auto-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("developer-logos")
        .upload(path, dl.bytes, { contentType: dl.contentType, upsert: true });
      if (upErr) {
        console.warn(`[upload ${dev.name}]`, upErr.message);
        continue;
      }
      const { data: pub } = supabase.storage.from("developer-logos").getPublicUrl(path);
      const publicUrl = pub.publicUrl;

      const { error: updErr } = await supabase
        .from("developers")
        .update({
          logo_url: publicUrl,
          logo_status: "approved",
          logo_last_attempt_at: new Date().toISOString(),
          logo_candidates: [{ url: candidate, source: site, fetched_at: new Date().toISOString() }],
        })
        .eq("id", dev.id)
        .neq("logo_status", "approved"); // belt + DB trigger suspenders
      if (updErr) {
        console.warn(`[update ${dev.name}]`, updErr.message);
        continue;
      }
      console.log(`✅ ${dev.name} → ${publicUrl}`);
      return { id: dev.id, name: dev.name, status: "approved", url: publicUrl };
    }
  }

  return finalizeUnavailable(supabase, dev, "no_valid_candidate");
}

async function finalizeUnavailable(supabase: any, dev: DevRow, reason: string) {
  await supabase
    .from("developers")
    .update({
      logo_status: "unavailable",
      logo_last_attempt_at: new Date().toISOString(),
    })
    .eq("id", dev.id)
    .neq("logo_status", "approved");
  return { id: dev.id, name: dev.name, status: "unavailable" as const, reason };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");
  if (!FIRECRAWL_API_KEY) {
    return new Response(JSON.stringify({ error: "FIRECRAWL_API_KEY is not configured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  try {
    const body = await req.json().catch(() => ({}));
    const batch_size: number = Math.min(Math.max(Number(body?.batch_size) || 10, 1), 25);
    const explicit_ids: string[] = Array.isArray(body?.developer_ids) ? body.developer_ids : [];

    let q = supabase
      .from("developers")
      .select("id, name, slug, website_url, logo_status");

    if (explicit_ids.length > 0) {
      q = q.in("id", explicit_ids).neq("logo_status", "approved");
    } else {
      q = q.eq("logo_status", "missing").order("name").limit(batch_size);
    }

    const { data: devs, error } = await q;
    if (error) throw error;
    if (!devs?.length) {
      return new Response(JSON.stringify({ success: true, processed: 0, approved: 0, unavailable: 0, results: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const results: Array<{ id: string; name: string; status: string; reason?: string; url?: string }> = [];
    let approved = 0;
    let unavailable = 0;

    for (const d of devs as DevRow[]) {
      try {
        const r = await processDeveloper(supabase, FIRECRAWL_API_KEY, d);
        results.push(r);
        if (r.status === "approved") approved++;
        else if (r.status === "unavailable") unavailable++;
      } catch (e: any) {
        console.error(`[process ${d.name}]`, e?.message);
        results.push({ id: d.id, name: d.name, status: "error", reason: e?.message });
      }
    }

    const { count: still_missing } = await supabase
      .from("developers")
      .select("id", { count: "exact", head: true })
      .eq("logo_status", "missing");

    return new Response(
      JSON.stringify({
        success: true,
        processed: devs.length,
        approved,
        unavailable,
        with_candidates: approved,
        still_missing: still_missing ?? 0,
        results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e: any) {
    console.error("auto-find-developer-logos fatal:", e);
    return new Response(JSON.stringify({ success: false, error: e?.message ?? "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
