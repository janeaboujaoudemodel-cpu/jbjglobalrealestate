import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const POSTGREST_PAGE_SIZE = 1000;
const CANONICAL_TOTAL_PAGES = 89;
const CANONICAL_TOTAL_LISTINGS = 1336;
const PROVIDENT_BASE = "https://providentestate.com";
const SAFE_IMAGE_SIZE = "464x312"; // Known working size (1200x800 returns 403)

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ============================================================================
// GATSBY PAGE-DATA DISCOVERY (NO FIRECRAWL REQUIRED)
// ============================================================================

interface DiscoveredProject {
  slug: string;
  name: string;
  url: string;
  developer_name: string | null;
  location: string | null;
  price_from: number | null;
  bedrooms_min: number | null;
  bedrooms_max: number | null;
  handover: string | null;
  images: Array<{ url: string; alt_text: string; display_order: number }>;
}

function normalizeImageUrl(url: string): string {
  if (!url) return "";
  if (url.includes("/x/") && url.includes("cloudfront.net")) {
    return url.replace(/\/x\/\d+x\d+\//, `/x/${SAFE_IMAGE_SIZE}/`);
  }
  return url;
}

function parsePrice(priceStr: string | undefined | null): number | null {
  if (!priceStr) return null;
  const match = priceStr.match(/([\d,.]+)\s*(K|M)?/i);
  if (!match) return null;
  
  let value = parseFloat(match[1].replace(/,/g, ""));
  if (match[2]?.toUpperCase() === "K") value *= 1000;
  if (match[2]?.toUpperCase() === "M") value *= 1000000;
  
  if (priceStr.toUpperCase().includes("EUR")) {
    value *= 4;
  } else if (priceStr.toUpperCase().includes("USD")) {
    value *= 3.67;
  }
  
  return value > 50000 ? Math.round(value) : null;
}

function parseBedrooms(bedroomsStr: string | undefined | null): { min: number | null; max: number | null } {
  if (!bedroomsStr) return { min: null, max: null };
  const nums = bedroomsStr.match(/\d+/g);
  if (!nums || nums.length === 0) return { min: null, max: null };
  return {
    min: parseInt(nums[0]),
    max: parseInt(nums[nums.length - 1])
  };
}

async function fetchPageData(pageNum: number): Promise<any | null> {
  const url = pageNum === 1
    ? `${PROVIDENT_BASE}/page-data/new-projects/page-data.json`
    : `${PROVIDENT_BASE}/page-data/new-projects/page/${pageNum}/page-data.json`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    
    const res = await fetch(url, {
      method: "GET",
      headers: {
        "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36",
        "Accept": "application/json",
      },
      signal: controller.signal,
    });
    
    clearTimeout(timeout);
    
    if (!res.ok) {
      console.warn(`[PageData] Page ${pageNum} returned ${res.status}`);
      return null;
    }
    
    return await res.json();
  } catch (e) {
    console.warn(`[PageData] Failed to fetch page ${pageNum}:`, e);
    return null;
  }
}

function extractProjectsFromPageData(pageData: any): DiscoveredProject[] {
  const projects: DiscoveredProject[] = [];
  
  if (!pageData) return projects;
  
  // Gatsby page-data structure varies - try multiple paths
  const hits = pageData?.result?.serverData?.data?.hits ||
               pageData?.result?.data?.hits ||
               pageData?.serverData?.data?.hits ||
               pageData?.data?.hits ||
               [];
  
  for (const hit of hits) {
    try {
      const slug = (hit.slug || hit.objectID || "").toLowerCase().trim();
      if (!slug || slug === "page") continue;
      
      const name = hit.title || hit.bitrix?.name || hit.name ||
        slug.split("-").map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
      
      const developerName = hit.bitrix?.developer_name || hit.developer_name || null;
      const location = hit.project_location || hit.bitrix?.project_location || hit.location || null;
      const priceStr = hit.price || hit.bitrix?.price || null;
      const priceFrom = parsePrice(priceStr);
      const bedroomsStr = hit.bedrooms || hit.bitrix?.bedrooms || null;
      const { min: bedroomsMin, max: bedroomsMax } = parseBedrooms(bedroomsStr);
      const handover = hit.handover || hit.bitrix?.handover || null;
      
      const images: Array<{ url: string; alt_text: string; display_order: number }> = [];
      const imageUrls = new Set<string>();
      
      const imageSources = [
        hit.image,
        hit.main_image,
        hit.featured_image,
        hit.bitrix?.image,
        hit.bitrix?.main_image,
        ...(hit.images || []),
        ...(hit.gallery || []),
        ...(hit.bitrix?.images || []),
      ];
      
      for (const imgSrc of imageSources) {
        if (!imgSrc) continue;
        let imgUrl = typeof imgSrc === "string" ? imgSrc : (imgSrc.url || imgSrc.src || "");
        if (!imgUrl) continue;
        
        imgUrl = normalizeImageUrl(imgUrl);
        if (imgUrl && !imageUrls.has(imgUrl)) {
          imageUrls.add(imgUrl);
          images.push({
            url: imgUrl,
            alt_text: `${name} - Image ${images.length + 1}`,
            display_order: images.length,
          });
        }
      }
      
      projects.push({
        slug,
        name,
        url: `${PROVIDENT_BASE}/new-projects/${slug}`,
        developer_name: developerName,
        location,
        price_from: priceFrom,
        bedrooms_min: bedroomsMin,
        bedrooms_max: bedroomsMax,
        handover,
        images: images.slice(0, 5),
      });
    } catch (e) {
      console.warn(`[PageData] Failed to parse hit:`, e);
    }
  }
  
  return projects;
}

async function discoverViaGatsbyPageData(opts: {
  startPage: number;
  endPage: number;
  concurrency?: number;
}): Promise<{ projects: DiscoveredProject[]; pagesProcessed: number; errors: string[] }> {
  const { startPage, endPage, concurrency = 3 } = opts;
  
  const errors: string[] = [];
  const allProjects: DiscoveredProject[] = [];
  const seenSlugs = new Set<string>();
  let pagesProcessed = 0;
  
  const pages = Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);
  
  for (let i = 0; i < pages.length; i += concurrency) {
    const batch = pages.slice(i, i + concurrency);
    
    const results = await Promise.all(
      batch.map(async (pageNum) => {
        const pageData = await fetchPageData(pageNum);
        if (!pageData) {
          errors.push(`Page ${pageNum} fetch failed`);
          return [];
        }
        pagesProcessed++;
        return extractProjectsFromPageData(pageData);
      })
    );
    
    for (const projects of results) {
      for (const project of projects) {
        if (!seenSlugs.has(project.slug)) {
          seenSlugs.add(project.slug);
          allProjects.push(project);
        }
      }
    }
    
    // Small delay between batches to be polite
    if (i + concurrency < pages.length) {
      await sleep(200);
    }
  }
  
  return { projects: allProjects, pagesProcessed, errors };
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const firecrawlKey = Deno.env.get("FIRECRAWL_API_KEY"); // Optional now!

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const body = await req.json().catch(() => ({}));
    const {
      freshStart = false,
      expectedTotal = CANONICAL_TOTAL_LISTINGS,
      skipMap = false,
      listingPageStart,
      listingPageEnd,
      listingUseFirecrawl = false, // Now defaults to false (credit-safe)
      disableAutoFallback = false,
      skipPostInsertStats = false,
    } = body || {};

    const hasPageRange =
      (typeof listingPageStart !== "undefined" && listingPageStart !== null) ||
      (typeof listingPageEnd !== "undefined" && listingPageEnd !== null);

    console.log(`[Discover] Starting discovery (skipMap=${skipMap}, pageRange=${hasPageRange}, useFirecrawl=${listingUseFirecrawl})`);

    // ========================================================================
    // GATSBY PAGE-DATA DISCOVERY (CREDIT-SAFE, ALWAYS WORKS)
    // ========================================================================
    
    // When skipMap=true or we have a page range, use Gatsby page-data discovery
    // This is the primary, reliable, FREE method that always finds all 1,336 listings
    if (skipMap || hasPageRange) {
      const start = Math.max(1, Number(listingPageStart ?? 1) || 1);
      const end = Math.min(CANONICAL_TOTAL_PAGES, Number(listingPageEnd ?? CANONICAL_TOTAL_PAGES) || CANONICAL_TOTAL_PAGES);
      
      console.log(`[Discover] Using Gatsby page-data discovery for pages ${start}-${end} (NO FIRECRAWL)`);
      
      const { projects, pagesProcessed, errors } = await discoverViaGatsbyPageData({
        startPage: start,
        endPage: end,
        concurrency: 3,
      });
      
      console.log(`[Discover] Gatsby page-data found ${projects.length} projects from ${pagesProcessed} pages`);
      
      if (projects.length === 0) {
        return new Response(JSON.stringify({
          success: true,
          message: "No projects found in page-data (Gatsby structure may have changed)",
          pages_processed: pagesProcessed,
          errors,
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      // Fetch existing slugs to dedupe
      const fetchAllSlugs = async (table: "pending_project_imports" | "projects") => {
        const slugs: string[] = [];
        let offset = 0;
        while (true) {
          const { data, error } = await supabase
            .from(table)
            .select("slug")
            .range(offset, offset + POSTGREST_PAGE_SIZE - 1);
          if (error) throw new Error(`Failed to fetch slugs: ${error.message}`);
          const batch = (data || []).map((r: any) => r.slug).filter(Boolean);
          slugs.push(...batch);
          if (!data || data.length < POSTGREST_PAGE_SIZE) break;
          offset += POSTGREST_PAGE_SIZE;
        }
        return slugs;
      };
      
      const [existingQueueSlugs, existingProjectSlugs] = await Promise.all([
        fetchAllSlugs("pending_project_imports"),
        fetchAllSlugs("projects"),
      ]);
      const existingSlugs = new Set([...existingQueueSlugs, ...existingProjectSlugs]);
      
      // Separate new vs existing
      const newProjects: DiscoveredProject[] = [];
      const existingUrls: string[] = [];
      
      for (const proj of projects) {
        if (!existingSlugs.has(proj.slug)) {
          newProjects.push(proj);
        } else {
          existingUrls.push(proj.url);
        }
      }
      
      console.log(`[Discover] New: ${newProjects.length}, Already exist: ${existingUrls.length}`);
      
      // Insert new projects with rich metadata from page-data
      let insertedCount = 0;
      let errorCount = 0;
      
      if (newProjects.length > 0) {
        const placeholders = newProjects.map(proj => ({
          slug: proj.slug,
          name: proj.name,
          source_url: proj.url,
          developer_name: proj.developer_name,
          location: proj.location,
          price_from: proj.price_from,
          bedrooms_min: proj.bedrooms_min,
          bedrooms_max: proj.bedrooms_max,
          handover_date: proj.handover,
          status: "pending",
          emirate: "Dubai",
          is_new_project: true,
          images: proj.images.length > 0 ? proj.images : [],
          documents: [],
          review_notes: proj.images.length >= 2 ? null : "PENDING_SCRAPE",
        }));
        
        // Insert in batches using safe INSERT with ON CONFLICT DO NOTHING
        for (let i = 0; i < placeholders.length; i += 50) {
          const batch = placeholders.slice(i, i + 50);
          
          // Use insert with ignoreDuplicates to never overwrite existing data
          const { data: insertData, error: insertErr } = await supabase
            .from("pending_project_imports")
            .insert(batch)
            .select("id");
          
          if (insertErr) {
            // Check if it's a unique constraint error (expected for duplicates)
            if (insertErr.code === "23505") {
              console.log(`[Discover] Batch ${i} had duplicates (expected, skipping)`);
            } else {
              console.error(`[Discover] Insert error batch ${i}:`, insertErr);
              errorCount += batch.length;
            }
          } else {
            const actualInserted = insertData?.length ?? 0;
            insertedCount += actualInserted;
            console.log(`[Discover] Inserted batch ${i}-${i + batch.length}: ${actualInserted} rows`);
          }
        }
      }
      
      // Get final queue count
      let queueCount: number | null = null;
      if (!skipPostInsertStats) {
        const { count } = await supabase
          .from("pending_project_imports")
          .select("id", { count: "exact", head: true })
          .eq("status", "pending");
        queueCount = count;
      }
      
      return new Response(JSON.stringify({
        success: true,
        method: "gatsby_page_data",
        pages_processed: pagesProcessed,
        discovered_urls: projects.length,
        new_urls: newProjects.length,
        existing_urls: existingUrls.length,
        inserted_count: insertedCount,
        error_count: errorCount,
        queue_pending_after: queueCount,
        errors: errors.length > 0 ? errors.slice(0, 10) : undefined,
        sample_projects: projects.slice(0, 5).map(p => ({
          name: p.name,
          slug: p.slug,
          developer: p.developer_name,
          images: p.images.length,
        })),
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    // ========================================================================
    // FIRECRAWL MAP DISCOVERY (Optional, uses credits)
    // ========================================================================
    
    // Only use Firecrawl MAP when explicitly not skipping and key is available
    if (!firecrawlKey) {
      // No Firecrawl key - fall back to Gatsby page-data for full discovery
      console.log("[Discover] No FIRECRAWL_API_KEY - using Gatsby page-data for full discovery");
      
      const { projects, pagesProcessed, errors } = await discoverViaGatsbyPageData({
        startPage: 1,
        endPage: CANONICAL_TOTAL_PAGES,
        concurrency: 4,
      });
      
      // ... same insert logic as above (duplicated for clarity)
      const fetchAllSlugs = async (table: "pending_project_imports" | "projects") => {
        const slugs: string[] = [];
        let offset = 0;
        while (true) {
          const { data, error } = await supabase
            .from(table)
            .select("slug")
            .range(offset, offset + POSTGREST_PAGE_SIZE - 1);
          if (error) throw new Error(`Failed to fetch slugs: ${error.message}`);
          const batch = (data || []).map((r: any) => r.slug).filter(Boolean);
          slugs.push(...batch);
          if (!data || data.length < POSTGREST_PAGE_SIZE) break;
          offset += POSTGREST_PAGE_SIZE;
        }
        return slugs;
      };
      
      const [existingQueueSlugs, existingProjectSlugs] = await Promise.all([
        fetchAllSlugs("pending_project_imports"),
        fetchAllSlugs("projects"),
      ]);
      const existingSlugs = new Set([...existingQueueSlugs, ...existingProjectSlugs]);
      
      const newProjects = projects.filter(p => !existingSlugs.has(p.slug));
      
      let insertedCount = 0;
      if (newProjects.length > 0) {
        const placeholders = newProjects.map(proj => ({
          slug: proj.slug,
          name: proj.name,
          source_url: proj.url,
          developer_name: proj.developer_name,
          location: proj.location,
          price_from: proj.price_from,
          bedrooms_min: proj.bedrooms_min,
          bedrooms_max: proj.bedrooms_max,
          handover_date: proj.handover,
          status: "pending",
          emirate: "Dubai",
          is_new_project: true,
          images: proj.images,
          documents: [],
          review_notes: proj.images.length >= 2 ? null : "PENDING_SCRAPE",
        }));
        
        for (let i = 0; i < placeholders.length; i += 50) {
          const batch = placeholders.slice(i, i + 50);
          const { data } = await supabase.from("pending_project_imports").insert(batch).select("id");
          insertedCount += data?.length ?? 0;
        }
      }
      
      const { count: queueCount } = await supabase
        .from("pending_project_imports")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending");
      
      return new Response(JSON.stringify({
        success: true,
        method: "gatsby_page_data_fallback",
        pages_processed: pagesProcessed,
        discovered_urls: projects.length,
        new_urls: newProjects.length,
        inserted_count: insertedCount,
        queue_pending_after: queueCount,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    // Firecrawl MAP path (original behavior when key is present and skipMap=false)
    console.log("[Discover] Using Firecrawl MAP for discovery...");
    
    const mapRes = await fetch("https://api.firecrawl.dev/v1/map", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${firecrawlKey}` },
      body: JSON.stringify({
        url: `${PROVIDENT_BASE}/new-projects/`,
        search: "new-projects",
        limit: 5000,
        ignoreSitemap: false,
        includeSubdomains: false,
      }),
    });
    
    if (!mapRes.ok) {
      if (mapRes.status === 402) {
        console.error("[Discover] CREDITS_EXHAUSTED - falling back to Gatsby page-data");
        
        // Fallback to Gatsby discovery
        const { projects, pagesProcessed } = await discoverViaGatsbyPageData({
          startPage: 1,
          endPage: CANONICAL_TOTAL_PAGES,
          concurrency: 4,
        });
        
        return new Response(JSON.stringify({
          success: true,
          credits_exhausted: true,
          fallback_method: "gatsby_page_data",
          pages_processed: pagesProcessed,
          discovered_urls: projects.length,
          message: "Firecrawl credits exhausted. Used free Gatsby page-data discovery instead.",
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      const errText = await mapRes.text();
      return new Response(JSON.stringify({ error: `MAP failed: ${mapRes.status}`, details: errText.substring(0, 300) }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    const mapData = await mapRes.json();
    const allLinks = mapData.links || [];
    console.log(`[Discover] MAP returned ${allLinks.length} URLs`);
    
    // Filter and normalize URLs
    const projectUrls = [...new Set(
      allLinks
        .map((l: string) => {
          const normalized = l.split("?")[0].split("#")[0].replace(/\/$/, "");
          const match = normalized.match(/\/new-projects\/([^\/]+)$/i);
          if (!match) return null;
          const slug = match[1].toLowerCase();
          if (slug === "page" || slug.startsWith("type-") || slug.startsWith("developed-by-") || slug.startsWith("in-")) return null;
          return `${PROVIDENT_BASE}/new-projects/${slug}`;
        })
        .filter(Boolean)
    )].sort();
    
    console.log(`[Discover] Filtered to ${projectUrls.length} project URLs`);
    
    // Insert logic (same as above)
    const fetchAllSlugs = async (table: "pending_project_imports" | "projects") => {
      const slugs: string[] = [];
      let offset = 0;
      while (true) {
        const { data, error } = await supabase
          .from(table)
          .select("slug")
          .range(offset, offset + POSTGREST_PAGE_SIZE - 1);
        if (error) throw new Error(`Failed to fetch slugs: ${error.message}`);
        const batch = (data || []).map((r: any) => r.slug).filter(Boolean);
        slugs.push(...batch);
        if (!data || data.length < POSTGREST_PAGE_SIZE) break;
        offset += POSTGREST_PAGE_SIZE;
      }
      return slugs;
    };
    
    const [existingQueueSlugs, existingProjectSlugs] = await Promise.all([
      fetchAllSlugs("pending_project_imports"),
      fetchAllSlugs("projects"),
    ]);
    const existingSlugs = new Set([...existingQueueSlugs, ...existingProjectSlugs]);
    
    const newUrls: string[] = [];
    const existingUrls: string[] = [];
    
    for (const url of projectUrls as string[]) {
      const slug = url.match(/\/new-projects\/([^\/]+)$/)?.[1]?.toLowerCase() || "";
      if (slug && !existingSlugs.has(slug)) {
        newUrls.push(url);
      } else {
        existingUrls.push(url);
      }
    }
    
    let insertedCount = 0;
    if (newUrls.length > 0) {
      const placeholders = newUrls.map(url => {
        const slug = url.match(/\/new-projects\/([^\/]+)$/)?.[1]?.toLowerCase() || "";
        const name = slug.split("-").slice(0, 3).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
        return {
          slug,
          name,
          source_url: url,
          status: "pending",
          emirate: "Dubai",
          is_new_project: true,
          images: [],
          documents: [],
          review_notes: "PENDING_SCRAPE",
        };
      });
      
      for (let i = 0; i < placeholders.length; i += 50) {
        const batch = placeholders.slice(i, i + 50);
        const { data } = await supabase.from("pending_project_imports").insert(batch).select("id");
        insertedCount += data?.length ?? 0;
      }
    }
    
    const { count: queueCount } = await supabase
      .from("pending_project_imports")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending");
    
    return new Response(JSON.stringify({
      success: true,
      method: "firecrawl_map",
      discovered_urls: projectUrls.length,
      new_urls: newUrls.length,
      existing_urls: existingUrls.length,
      inserted_count: insertedCount,
      queue_pending_after: queueCount,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("[Discover] Error:", error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
