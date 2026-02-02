import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const POSTGREST_PAGE_SIZE = 1000;

// Canonical targets matching the source portal structure
const CANONICAL_TOTAL_PAGES = 89;
const CANONICAL_TOTAL_LISTINGS = 1336;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const normalizeUrl = (raw: string): string => {
  const trimmed = (raw || "").trim();
  if (!trimmed) return "";
  // Firecrawl scrape(links) can return relative URLs (e.g. "/new-projects/...").
  // Canonicalize everything to absolute Provident URLs before filtering/deduping.
  const absolute =
    trimmed.startsWith("http://") || trimmed.startsWith("https://")
      ? trimmed
      : trimmed.startsWith("/")
        ? `https://providentestate.com${trimmed}`
        : `https://providentestate.com/${trimmed.replace(/^\.\/?/, "")}`;
  // Firecrawl MAP often returns links with tracking query params / fragments.
  // We canonicalize them so they de-dupe and pass slug filtering.
  const noQueryOrHash = absolute.split("?")[0].split("#")[0];
  const withoutTrailing = noQueryOrHash.replace(/\/$/, "");

  // Some link sources include sub-paths under a project (e.g. /new-projects/<slug>/something).
  // Canonicalize them back to the base project URL so we don't miss inventory.
  const m = withoutTrailing.match(
    /^https?:\/\/(?:www\.)?providentestate\.com\/new-projects\/([^\/\?#]+)(?:\/.*)?$/i,
  );
  const slug = (m?.[1] || "").toLowerCase();
  if (slug && slug !== "page") {
    return `https://providentestate.com/new-projects/${m![1]}`.replace(/\/$/, "");
  }

  return withoutTrailing;
};

/**
 * STRICT URL FILTER - Only accept real project detail pages.
 * Rejects taxonomy pages, filter pages, area pages, developer pages.
 */
const TAXONOMY_SLUG_PREFIXES = [
  "type-",       // e.g., type-apartment, type-villa, type-townhouse
  "developed-by-",
  "in-",         // e.g., in-dubai-marina, in-business-bay
  "status-",     // potential future filter
  "bedrooms-",   // potential future filter
];

const TAXONOMY_EXACT_SLUGS = new Set([
  "apartment", "apartments", "villa", "villas", "townhouse", "townhouses",
  "penthouse", "penthouses", "studio", "studios", "offices", "mansions",
]);

const isProjectDetailUrl = (raw: string): boolean => {
  const l = normalizeUrl(raw);
  if (!l) return false;
  if (!l.startsWith("https://providentestate.com/new-projects/")) return false;
  if (l.includes("/page/")) return false;
  if (l === "https://providentestate.com/new-projects") return false;

  // Extract the slug portion
  const match = l.match(/\/new-projects\/([^\/\?#]+)$/i);
  if (!match || !match[1]) return false;
  const slug = match[1].toLowerCase();

  // Reject taxonomy / filter slugs
  for (const prefix of TAXONOMY_SLUG_PREFIXES) {
    if (slug.startsWith(prefix)) return false;
  }
  if (TAXONOMY_EXACT_SLUGS.has(slug)) return false;

  // Additional safety: reject if slug is only one generic word
  if (slug.length < 3) return false;

  return true;
};

const extractLinksFromHtml = (html: string): string[] => {
  // Simple href extraction (fast, no DOM parser needed)
  const out: string[] = [];
  const re = /href\s*=\s*["']([^"']+)["']/gi;
  for (const m of html.matchAll(re)) {
    const href = (m?.[1] || "").trim();
    if (!href) continue;
    if (href.startsWith("mailto:") || href.startsWith("tel:") || href.startsWith("javascript:")) continue;
    if (href.startsWith("#")) continue;
    if (href.includes("/new-projects/")) out.push(href);
  }
  return out;
};

const toAbsoluteProvidentUrl = (href: string): string => {
  const h = (href || "").trim();
  if (!h) return "";
  if (h.startsWith("http://") || h.startsWith("https://")) return h;
  if (h.startsWith("/")) return `https://providentestate.com${h}`;
  // Best-effort: treat as relative to domain root
  return `https://providentestate.com/${h.replace(/^\.\/?/, "")}`;
};

const detectTotalPagesFromHtml = (html: string): number => {
  let maxPage = 1;
  const re = /\/new-projects\/page\/(\d+)\/?/gi;
  for (const m of html.matchAll(re)) {
    const n = Number(m?.[1]);
    if (Number.isFinite(n) && n > maxPage) maxPage = n;
  }
  return maxPage > 1 ? maxPage : CANONICAL_TOTAL_PAGES;
};

const mapWithConcurrency = async <T, R>(
  items: T[],
  concurrency: number,
  worker: (item: T) => Promise<R>,
): Promise<R[]> => {
  const results: R[] = new Array(items.length);
  let index = 0;
  const runners = Array.from({ length: Math.max(1, concurrency) }, async () => {
    while (index < items.length) {
      const i = index++;
      results[i] = await worker(items[i]);
    }
  });
  await Promise.all(runners);
  return results;
};

/**
 * Fetch HTML via Firecrawl scrape (rendered JS) – most reliable for SPAs.
 * Falls back to raw fetch if Firecrawl fails.
 */
const fetchHtmlViaFirecrawl = async (
  url: string,
  firecrawlKey: string,
  timeoutMs = 30000,
): Promise<{ ok: boolean; html: string }> => {
  try {
    const res = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${firecrawlKey}` },
      body: JSON.stringify({ url, formats: ["rawHtml"], waitFor: 6000, timeout: timeoutMs }),
    });
    if (!res.ok) return { ok: false, html: "" };
    const data = await res.json().catch(() => ({}));
    const html = data?.data?.rawHtml || data?.rawHtml || "";
    return { ok: html.length > 1000, html };
  } catch {
    return { ok: false, html: "" };
  }
};

const fetchHtml = async (url: string, timeoutMs = 25000): Promise<{ ok: boolean; html: string }> => {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: "GET",
      redirect: "follow",
      headers: {
        "user-agent":
          "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        accept: "text/html,application/xhtml+xml",
      },
      signal: controller.signal,
    });
    const html = await res.text().catch(() => "");
    const ok = res.ok && html.length > 1000;
    return { ok, html };
  } catch {
    return { ok: false, html: "" };
  } finally {
    clearTimeout(t);
  }
};

const firecrawlScrapeLinks = async (url: string, firecrawlKey: string): Promise<string[]> => {
  // Provident can trigger Firecrawl rate-limits; retry a few times with backoff.
  // (No `actions` parameter on purpose — stability policy.)
  const maxAttempts = 4;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const res = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${firecrawlKey}` },
      body: JSON.stringify({
        url,
        formats: ["links"],
        waitFor: 8000,
        timeout: 60000,
      }),
    });

    if (res.ok) {
      const data = await res.json().catch(() => ({}));
      return (data?.data?.links || data?.links || []) as string[];
    }

    // Retry on rate limits / transient upstream
    if (res.status === 429 || res.status >= 500) {
      const backoff = Math.min(8000, 750 * Math.pow(2, attempt - 1));
      console.log(`[Discover] Firecrawl retry ${attempt}/${maxAttempts} (${res.status}) for ${url} in ${backoff}ms`);
      await sleep(backoff);
      continue;
    }

    // Non-retriable
    return [];
  }

  return [];
};

const collectProjectUrlsFromListingPages = async (opts: {
  totalPages: number;
  firecrawlKey: string;
  concurrency?: number;
  forceFirecrawlAllPages?: boolean;
}): Promise<{ urls: string[]; pages_failed: number }> => {
  const totalPages = Math.max(1, opts.totalPages || CANONICAL_TOTAL_PAGES);
  // Lower concurrency to reduce rate limiting; correctness > speed for deterministic rebuilds.
  const concurrency = Math.max(1, Math.min(6, opts.concurrency ?? 4));

  const listingPages = Array.from({ length: totalPages }, (_, i) => {
    const page = i + 1;
    return page === 1
      ? "https://providentestate.com/new-projects/"
      : `https://providentestate.com/new-projects/page/${page}/`;
  });

  // Provident site is JS-rendered, so plain fetch() returns empty listings.
  // Use Firecrawl scrape(links) for each listing page directly (most reliable).
  const htmlResults = await mapWithConcurrency(listingPages, concurrency, async (pageUrl) => {
    // Primary: Firecrawl scrape(links) — fast, reliable for JS pages
    const links = await firecrawlScrapeLinks(pageUrl, opts.firecrawlKey);
    const projectLinks = links.map(normalizeUrl).filter(isProjectDetailUrl);
    if (projectLinks.length > 0) {
      return { pageUrl, ok: true, links: projectLinks };
    }

    // Fallback: raw fetch (unlikely to work on SPA, but cheap to try)
    const r = await fetchHtml(pageUrl);
    if (!r.ok) return { pageUrl, ok: false, links: [] as string[] };

    const hrefs = extractLinksFromHtml(r.html);
    const abs = hrefs.map(toAbsoluteProvidentUrl).map(normalizeUrl).filter(Boolean);
    const fallbackLinks = abs.filter(isProjectDetailUrl);
    return { pageUrl, ok: fallbackLinks.length > 0, links: fallbackLinks };
  });

  const urlsFromHtml = htmlResults.flatMap((r) => r.links);
  const failedPages = htmlResults.filter((r) => !r.ok).map((r) => r.pageUrl);

  // Firecrawl fallback:
  // - By default: ONLY for pages that failed direct HTML discovery.
  // - If forceFirecrawlAllPages: scrape ALL listing pages (strongest coverage).
  const pagesToScrape = opts.forceFirecrawlAllPages ? listingPages : failedPages;
  let pages_failed = failedPages.length;
  let urlsFromFirecrawl: string[] = [];

  if (pagesToScrape.length > 0) {
    console.log(
      opts.forceFirecrawlAllPages
        ? `[Discover] Running Firecrawl scrape(links) across ALL ${listingPages.length} listing pages for maximum coverage...`
        : `[Discover] Direct HTML discovery failed for ${failedPages.length} listing pages. Falling back to Firecrawl scrape(links) for those pages...`,
    );

    const firecrawlResults = await mapWithConcurrency(pagesToScrape, 3, async (pageUrl) => {
      const links = await firecrawlScrapeLinks(pageUrl, opts.firecrawlKey);
      return links.map(normalizeUrl).filter(isProjectDetailUrl);
    });
    urlsFromFirecrawl = firecrawlResults.flatMap((x) => x);
  }

  const merged = [...new Set([...urlsFromHtml, ...urlsFromFirecrawl])].sort();
  return { urls: merged, pages_failed };
};

/**
 * DISCOVER ALL PROJECTS - Uses Firecrawl MAP to find all project URLs
 * Then stores them in a queue table for batch processing
 */

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const firecrawlKey = Deno.env.get("FIRECRAWL_API_KEY");

  if (!firecrawlKey) {
    return new Response(JSON.stringify({ error: "Missing FIRECRAWL_API_KEY" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const body = await req.json().catch(() => ({}));
    const {
      freshStart = false,
      forceFullDiscovery = false,
      expectedTotal = CANONICAL_TOTAL_LISTINGS,
      skipMap = false,
      listingPageStart,
      listingPageEnd,
      listingUseFirecrawl = false,
      // NOTE: full escalation can be slow; keep disabled unless explicitly requested
      fullFirecrawlEscalation = false,
      // When running in UI-batched mode we don't want a single request to attempt full 89-page fallback.
      // The frontend will orchestrate page-range batches instead.
      disableAutoFallback = false,
      // Skip post-insert queue cardinality calculation (faster for batched runs)
      skipPostInsertStats = false,
    } = body || {};

    console.log(`[Discover] Starting project URL discovery (${skipMap ? "listing-pages" : "MAP"})...`);

    let allLinks: string[] = [];
    if (!skipMap) {
      // Use Firecrawl MAP to get ALL URLs from the site
      const mapRes = await fetch("https://api.firecrawl.dev/v1/map", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${firecrawlKey}` },
        body: JSON.stringify({
          url: "https://providentestate.com/new-projects/",
          search: "new-projects",
          // Firecrawl MAP can return up to ~5000 URLs. Need full inventory of 1335+
          limit: 5000,
          ignoreSitemap: false,
          includeSubdomains: false,
        }),
      });

      if (!mapRes.ok) {
        const errText = await mapRes.text();
        console.error("[Discover] MAP failed:", errText);
        return new Response(JSON.stringify({ error: `MAP failed: ${mapRes.status}`, details: errText.substring(0, 300) }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const mapData = await mapRes.json();
      allLinks = mapData.links || [];
      console.log(`[Discover] MAP returned ${allLinks.length} total URLs`);
    }

    // Filter to project detail URLs only
    let projectUrls = [...new Set(allLinks.map((l: string) => normalizeUrl(l)).filter(isProjectDetailUrl))]
      // Stable ordering so the queue is consistent across runs
      .sort();

    if (!skipMap) {
      console.log(`[Discover] Found ${projectUrls.length} unique project URLs (MAP)`);
    }

    // If MAP misses any listings, optionally perform a full fallback discovery.
    // This is designed to hit the canonical 1,335 inventory (89 listing pages × 15 each).
    const expected = Number(expectedTotal) || CANONICAL_TOTAL_LISTINGS;
    let usedFallback = false;
    let fallbackPagesFailed = 0;
    let detectedPages = CANONICAL_TOTAL_PAGES;

    // Optional: targeted listing-page extraction in a bounded range (safe for timeouts)
    const hasPageRange =
      (typeof listingPageStart !== "undefined" && listingPageStart !== null) ||
      (typeof listingPageEnd !== "undefined" && listingPageEnd !== null);

    if (hasPageRange) {
      usedFallback = true;

      const root = await fetchHtml("https://providentestate.com/new-projects/");
      if (root.ok) detectedPages = detectTotalPagesFromHtml(root.html);

      const start = Math.max(1, Math.min(detectedPages, Number(listingPageStart ?? 1) || 1));
      const end = Math.max(start, Math.min(detectedPages, Number(listingPageEnd ?? start) || start));
      console.log(`[Discover] Listing-page range mode: pages ${start}-${end} (useFirecrawl=${Boolean(listingUseFirecrawl)})`);

      const pages = Array.from({ length: end - start + 1 }, (_, i) => start + i);
      const pageUrls = pages.map((p) =>
        p === 1 ? "https://providentestate.com/new-projects/" : `https://providentestate.com/new-projects/page/${p}/`
      );

      let rangeUrls: string[] = [];
      if (listingUseFirecrawl) {
        const scraped = await mapWithConcurrency(pageUrls, 4, async (pageUrl) => {
          const links = await firecrawlScrapeLinks(pageUrl, firecrawlKey);
          return links.map(normalizeUrl).filter(isProjectDetailUrl);
        });
        rangeUrls = scraped.flatMap((x) => x);
      } else {
        // Use Firecrawl scrape(links) first; fallback to raw HTML for each page
        const htmlBatch = await mapWithConcurrency(pageUrls, 3, async (pageUrl) => {
          const links = await firecrawlScrapeLinks(pageUrl, firecrawlKey);
          const projectLinks = links.map(normalizeUrl).filter(isProjectDetailUrl);
          if (projectLinks.length > 0) return projectLinks;

          // Fallback raw fetch
          const r = await fetchHtml(pageUrl);
          if (!r.ok) return [] as string[];
          const hrefs = extractLinksFromHtml(r.html);
          return hrefs.map(toAbsoluteProvidentUrl).map(normalizeUrl).filter(isProjectDetailUrl);
        });
        rangeUrls = htmlBatch.flatMap((x) => x);
      }

      projectUrls = [...new Set([...projectUrls, ...rangeUrls])].sort();
      console.log(`[Discover] After listing-page range merge: ${projectUrls.length} unique project URLs`);
    }

    if (!disableAutoFallback && (forceFullDiscovery || projectUrls.length < expected)) {
      usedFallback = true;
      console.log(`[Discover] MAP returned ${projectUrls.length} < expected ${expected}. Running full listing-page discovery fallback...`);

      // Detect total pages from source HTML (best-effort); fall back to canonical 89.
      const root = await fetchHtml("https://providentestate.com/new-projects/");
      if (root.ok) {
        detectedPages = detectTotalPagesFromHtml(root.html);
      }

      const { urls: byPageUrls, pages_failed } = await collectProjectUrlsFromListingPages({
        totalPages: detectedPages,
        firecrawlKey,
        concurrency: 4,
      });
      fallbackPagesFailed = pages_failed;

      // Merge MAP + fallback results
      projectUrls = [...new Set([...projectUrls, ...byPageUrls])].sort();
      console.log(`[Discover] After fallback merge: ${projectUrls.length} unique project URLs`);

      // Optional escalation (can be slow). Prefer calling listing-page range mode in batches.
      if (fullFirecrawlEscalation && projectUrls.length < expected) {
        console.log(
          `[Discover] fullFirecrawlEscalation enabled. Scraping ALL listing pages via Firecrawl (may be slow)...`,
        );

        const { urls: fullFirecrawlUrls } = await collectProjectUrlsFromListingPages({
          totalPages: detectedPages,
          firecrawlKey,
          concurrency: 4,
          forceFirecrawlAllPages: true,
        });

        projectUrls = [...new Set([...projectUrls, ...fullFirecrawlUrls])].sort();
        console.log(`[Discover] After full Firecrawl escalation: ${projectUrls.length} unique project URLs`);
      }
    }

    if (projectUrls.length === 0) {
      return new Response(JSON.stringify({ 
        success: true, 
        message: "No project URLs discovered", 
        raw_links: allLinks.length 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // If freshStart, clear ALL non-approved queue rows.
    // (Clearing only 'pending' causes duplicates because previously rejected rows remain.)
    if (freshStart) {
      console.log("[Discover] Fresh start - clearing ALL non-approved queue rows...");
      const { error: deleteErr, count } = await supabase
        .from("pending_project_imports")
        .delete({ count: "exact" })
        .neq("status", "approved");

      if (deleteErr) {
        console.error("[Discover] Delete error:", deleteErr);
      } else {
        console.log(`[Discover] Cleared ${count ?? 0} non-approved rows`);
      }
    }

    const fetchAllSlugs = async (table: "pending_project_imports" | "projects") => {
      const slugs: string[] = [];
      let offset = 0;

      while (true) {
        const { data, error } = await supabase
          .from(table)
          .select("slug")
          .range(offset, offset + POSTGREST_PAGE_SIZE - 1);

        if (error) {
          throw new Error(`Failed to fetch slugs from ${table}: ${error.message}`);
        }

        const batch = (data || []).map((r: any) => r.slug).filter(Boolean);
        slugs.push(...batch);

        if (!data || data.length < POSTGREST_PAGE_SIZE) break;
        offset += POSTGREST_PAGE_SIZE;
      }

      return slugs;
    };

    // Get existing slugs from the queue + approved projects.
    // This prevents duplicates across repeated discovery runs.
    const [existingQueueSlugs, existingProjectSlugs] = await Promise.all([
      fetchAllSlugs("pending_project_imports"),
      fetchAllSlugs("projects"),
    ]);

    const existingSlugs = new Set([...existingQueueSlugs, ...existingProjectSlugs]);

    // Prepare new imports
    const newUrls: string[] = [];
    const existingUrls: string[] = [];

    for (const url of projectUrls) {
      const cleanUrl = normalizeUrl(url);
      const slug = cleanUrl.match(/\/new-projects\/([^\/\?#]+)/)?.[1]?.toLowerCase().replace(/\/$/, "") || "";
      if (slug && !existingSlugs.has(slug)) {
        newUrls.push(cleanUrl);
      } else {
        existingUrls.push(cleanUrl);
      }
    }

    // Insert placeholders for new URLs (will be scraped later)
    const placeholders = newUrls.map(url => {
      const slug = url.match(/\/new-projects\/([^\/\?#]+)/)?.[1]?.toLowerCase().replace(/\/$/, "") || "";
      const name = slug.split("-").slice(0, 3).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
      return {
        slug,
        name,
        source_url: url,
        status: "pending",  // Must be pending, approved, rejected, or merged
        emirate: "Dubai",
        is_new_project: true,
        images: [],
        documents: [],
        review_notes: "PENDING_SCRAPE",
      };
    });

    if (placeholders.length > 0) {
      // Insert in batches of 50
      let insertedCount = 0;
      let errorCount = 0;
      
      for (let i = 0; i < placeholders.length; i += 50) {
        const batch = placeholders.slice(i, i + 50);
        // Conflict-safe: do not fail the whole batch if a slug already exists (race/concurrent runs).
        const { error: insertErr } = await supabase
          .from("pending_project_imports")
          .upsert(batch, { onConflict: "slug", ignoreDuplicates: true });
        
        if (insertErr) {
          console.error(`[Discover] Insert batch ${i}-${i + batch.length} error:`, insertErr.message);
          errorCount += batch.length;
        } else {
          insertedCount += batch.length;
          console.log(`[Discover] Inserted batch ${i}-${i + batch.length} (${batch.length} rows)`);
        }
      }
      
      console.log(`[Discover] Total inserted: ${insertedCount}, errors: ${errorCount}`);
    }

    // Post-insert: report current queue cardinality (distinct slugs)
    let queueDistinctAfter: number | null = null;
    if (!skipPostInsertStats) {
      const queueSlugsAfter = await fetchAllSlugs("pending_project_imports");
      queueDistinctAfter = new Set(queueSlugsAfter.filter(Boolean)).size;
    }

    return new Response(JSON.stringify({
      success: true,
      expected_total: expected,
      used_fallback: usedFallback,
      detected_pages: detectedPages,
      fallback_pages_failed: fallbackPagesFailed,
      discovered_urls: projectUrls.length,
      new_urls: newUrls.length,
      existing_urls: existingUrls.length,
      queued_for_scraping: placeholders.length,
      queue_distinct_slugs_after: queueDistinctAfter,
      sample_urls: projectUrls.slice(0, 10),
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("[Discover] Error:", error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
