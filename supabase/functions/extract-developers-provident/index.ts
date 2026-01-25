import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ProvidentDeveloper {
  name: string;
  slug: string;
  description: string;
  feature_image_url: string;
  logo_url: string;
  provident_link: string;
  display_order: number;
}

const PROVIDENT_DEVELOPERS_URL = "https://providentestate.com/developers/";
const PROVIDENT_PAGE_SIZE = 24; // Provident loads 24 developers per page

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[&]/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function normalizeUrl(url: string): string {
  const trimmed = url?.trim() ?? "";
  if (!trimmed) return "";
  if (trimmed.startsWith("//")) return `https:${trimmed}`;
  if (trimmed.startsWith("/")) return `https://providentestate.com${trimmed}`;
  return trimmed;
}

function decodeHtmlEntities(input: string): string {
  return input
    .replace(/&amp;nbsp;/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#x27;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function deslugify(slug: string): string {
  return slug
    .replace(/-/g, " ")
    .replace(/\band\b/gi, "&")
    .split(" ")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function pickBestImageFromImgTag(imgTag: string): string {
  const srcsetMatch = imgTag.match(/srcset="([^"]+)"/);
  if (srcsetMatch?.[1]) {
    const parts = srcsetMatch[1].split(",").map((s) => s.trim()).filter(Boolean);
    const candidates = parts.map((p) => {
      const segments = p.split(/\s+/);
      const url = segments[0] || "";
      const descriptor = segments[1] || "";
      const width = descriptor.endsWith("w") ? Number(descriptor.replace("w", "")) : 0;
      return { url: normalizeUrl(url), width: Number.isFinite(width) ? width : 0 };
    });
    candidates.sort((a, b) => b.width - a.width);
    const best = candidates[0];
    if (best?.url) return best.url;
  }
  const srcMatch = imgTag.match(/src="([^"]+)"/);
  return srcMatch?.[1] ? normalizeUrl(srcMatch[1]) : "";
}

function extractDeveloperCards(html: string): ProvidentDeveloper[] {
  const developers: ProvidentDeveloper[] = [];
  let displayOrder = 0;

  const startRegex = /<div\s+class="developer-card[^"]*">/gi;
  const starts: number[] = [];
  let m: RegExpExecArray | null;
  while ((m = startRegex.exec(html)) !== null) {
    starts.push(m.index);
  }

  console.log(`  Found ${starts.length} developer-card starts`);

  for (let i = 0; i < starts.length; i++) {
    const start = starts[i];
    const end = i + 1 < starts.length ? starts[i + 1] : html.length;
    const cardHtml = html.slice(start, end);
    displayOrder++;

    let featureImage = "";
    const featureBlockMatch = cardHtml.match(/<div\s+class="img-section"[^>]*>([\s\S]*?)<\/div>/i);
    if (featureBlockMatch) {
      const imgMatch = featureBlockMatch[1].match(/<img[^>]*>/i);
      if (imgMatch) featureImage = pickBestImageFromImgTag(imgMatch[0]);
    }

    let logo = "";
    const logoBlockMatch = cardHtml.match(/<div\s+class="logo-section"[^>]*>([\s\S]*?)<\/div>/i);
    if (logoBlockMatch) {
      const imgMatch = logoBlockMatch[1].match(/<img[^>]*>/i);
      if (imgMatch) logo = pickBestImageFromImgTag(imgMatch[0]);
    }

    const nameMatch = cardHtml.match(/<a\s+class="name"[^>]*>\s*<span>([^<]+)<\/span>/i);
    const name = nameMatch ? decodeHtmlEntities(nameMatch[1]).trim() : "";

    const linkMatch = cardHtml.match(/<a\s+[^>]*class="(?:img-section-wrap|name)"[^>]*href="([^"]+)"/i);
    const providentLink = linkMatch?.[1] ? normalizeUrl(linkMatch[1]) : "";

    const descMatch = cardHtml.match(/<p\s+class="description"[^>]*>([\s\S]*?)<\/p>/i);
    let description = descMatch ? descMatch[1] : "";
    description = decodeHtmlEntities(description).replace(/<[^>]+>/g, "").trim();

    if (!name) continue;
    if (!featureImage && !logo) continue;

    developers.push({
      name,
      slug: slugify(name),
      description,
      feature_image_url: featureImage,
      logo_url: logo,
      provident_link: providentLink,
      display_order: displayOrder,
    });

    console.log(`  ✅ [${displayOrder}] ${name} | Logo: ${logo ? "✓" : "✗"} | Image: ${featureImage ? "✓" : "✗"}`);
  }

  return developers;
}

/**
 * Fetch a specific page from Provident developers using their API
 * Provident uses Gatsby/React with infinite scroll - we can access the paginated data
 */
async function fetchDevelopersPage(
  pageNumber: number,
  firecrawlApiKey: string
): Promise<ProvidentDeveloper[]> {
  // Provident developers page uses pagination via scroll
  // Page 1 = first 24, Page 2 = 25-48, etc.
  // We use the skip parameter to get specific pages
  const skip = (pageNumber - 1) * PROVIDENT_PAGE_SIZE;
  
  // Build URL with page parameter
  const pageUrl = pageNumber === 1 
    ? PROVIDENT_DEVELOPERS_URL 
    : `${PROVIDENT_DEVELOPERS_URL}?page=${pageNumber}`;
  
  console.log(`📄 Fetching page ${pageNumber} (skip=${skip}): ${pageUrl}`);
  
  try {
    const response = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${firecrawlApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url: pageUrl,
        formats: ["html"],
        onlyMainContent: false,
        waitFor: 5000,
        timeout: 60000,
      }),
    });

    if (!response.ok) {
      console.warn(`Page ${pageNumber} fetch failed: ${response.status}`);
      return [];
    }

    const data = await response.json();
    const html = data?.data?.html || data?.html || "";
    
    if (!html || html.length < 1000) {
      console.log(`Page ${pageNumber}: No content or empty page`);
      return [];
    }

    const developers = extractDeveloperCards(html);
    console.log(`✅ Page ${pageNumber}: Found ${developers.length} developers`);
    
    // Adjust display_order based on page number
    return developers.map((dev, idx) => ({
      ...dev,
      display_order: skip + idx + 1,
    }));
  } catch (error) {
    console.warn(`Error fetching page ${pageNumber}:`, error);
    return [];
  }
}

/**
 * PROVIDENT DEVELOPERS EXTRACTION v9 - MULTI-PAGE PAGINATION
 * 
 * Strategy:
 * 1. Fetch existing pending developers to know the current state
 * 2. Check if we already have page 1 (24 developers) - if not, fetch it
 * 3. Continue fetching subsequent pages until we get an empty page
 * 4. Each page adds 24 developers
 * 
 * This allows incremental extraction across multiple runs.
 */
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const firecrawlApiKey = Deno.env.get("FIRECRAWL_API_KEY");
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body to check for specific page request
    let requestedStartPage = 1;
    let clearExisting = true;
    
    try {
      const body = await req.json();
      if (body?.startPage) requestedStartPage = body.startPage;
      if (body?.clearExisting === false) clearExisting = false;
    } catch {
      // No body, use defaults
    }

    console.log(`🔄 Starting Provident Developers Extraction v9 (Multi-Page)...`);
    console.log(`📊 Starting from page: ${requestedStartPage}, Clear existing: ${clearExisting}`);

    if (!firecrawlApiKey) {
      throw new Error("FIRECRAWL_API_KEY not configured");
    }

    // Check current state
    const { data: existingPending, error: countError } = await supabase
      .from("pending_developer_imports")
      .select("slug")
      .eq("status", "pending");
    
    const existingSlugs = new Set((existingPending || []).map(d => d.slug));
    console.log(`📊 Currently ${existingSlugs.size} pending developers in queue`);

    // Calculate which page to start from based on existing data
    let startPage = requestedStartPage;
    if (requestedStartPage === 1 && existingSlugs.size >= 24) {
      // If we already have page 1, calculate next page
      startPage = Math.floor(existingSlugs.size / PROVIDENT_PAGE_SIZE) + 1;
      console.log(`📊 Auto-calculated start page: ${startPage} (based on ${existingSlugs.size} existing)`);
    }

    // Clear existing if requested (for fresh extraction)
    if (clearExisting && startPage === 1) {
      console.log("🗑️ Clearing all existing pending_developer_imports rows...");
      const { error: delErr } = await supabase
        .from("pending_developer_imports")
        .delete()
        .not("id", "is", null);

      if (delErr) {
        console.warn("Warning: could not clear rows:", delErr.message);
      }
      existingSlugs.clear();
    }

    // Fetch pages starting from calculated start
    const allDevelopers: ProvidentDeveloper[] = [];
    const MAX_PAGES = 10; // Safety limit - Provident has ~7 pages
    let currentPage = startPage;
    let emptyPages = 0;

    while (currentPage <= startPage + MAX_PAGES && emptyPages < 2) {
      const pageDevelopers = await fetchDevelopersPage(currentPage, firecrawlApiKey);
      
      if (pageDevelopers.length === 0) {
        emptyPages++;
        console.log(`📄 Page ${currentPage}: Empty (${emptyPages}/2 consecutive empty pages)`);
      } else {
        emptyPages = 0; // Reset counter
        
        // Filter out already existing slugs
        const newDevelopers = pageDevelopers.filter(d => !existingSlugs.has(d.slug));
        
        for (const dev of newDevelopers) {
          existingSlugs.add(dev.slug);
          allDevelopers.push(dev);
        }
        
        console.log(`✅ Page ${currentPage}: Added ${newDevelopers.length} new developers (${pageDevelopers.length - newDevelopers.length} duplicates skipped)`);
      }
      
      currentPage++;
      
      // Small delay between pages to avoid rate limiting
      if (currentPage <= startPage + MAX_PAGES) {
        await new Promise(r => setTimeout(r, 1000));
      }
    }

    console.log(`📊 Total new developers extracted: ${allDevelopers.length}`);

    if (allDevelopers.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: "No new developers to add. All pages have been extracted.",
          count: 0,
          totalInQueue: existingSlugs.size,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Insert new developers
    const rows = allDevelopers.map((dev) => ({
      name: dev.name,
      slug: dev.slug,
      description: dev.description,
      feature_image_url: dev.feature_image_url,
      logo_url: dev.logo_url,
      provident_link: dev.provident_link,
      source: "provident_estate",
      status: "pending",
      extracted_at: new Date().toISOString(),
    }));

    console.log(`💾 Inserting ${rows.length} new rows...`);
    const { error: insertError } = await supabase
      .from("pending_developer_imports")
      .insert(rows);

    if (insertError) {
      console.error("Insert error:", insertError);
      throw new Error(`Failed to store pending imports: ${insertError.message}`);
    }

    // Log extraction job
    await supabase.from("extraction_job_logs").insert({
      source_id: null,
      job_type: "developer_extraction",
      status: "completed",
      started_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
      records_found: allDevelopers.length,
      records_matched: 0,
      records_pending: allDevelopers.length,
      metadata: {
        source: "provident_estate",
        url: PROVIDENT_DEVELOPERS_URL,
        version: "v9-multi-page",
        startPage,
        pagesProcessed: currentPage - startPage,
      },
    });

    console.log(`✅ Successfully extracted and stored ${allDevelopers.length} new developers`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully extracted ${allDevelopers.length} new developers from pages ${startPage}-${currentPage - 1}`,
        count: allDevelopers.length,
        totalInQueue: existingSlugs.size,
        pagesProcessed: currentPage - startPage,
        developers: allDevelopers.map((d) => ({
          name: d.name,
          order: d.display_order,
          logo: d.logo_url ? "✓" : "✗",
          image: d.feature_image_url ? "✓" : "✗",
        })),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("❌ Extraction error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";

    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
