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
const OFFPLANS_SITEMAP_URL = "https://providentestate.com/offplans.xml";

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
 * Extract unique developer slugs from the offplans sitemap
 */
function extractDeveloperSlugsFromSitemap(sitemapContent: string): string[] {
  const regex = /developed-by-([a-z0-9-]+)\//g;
  const slugs = new Set<string>();
  let match: RegExpExecArray | null;
  
  while ((match = regex.exec(sitemapContent)) !== null) {
    slugs.add(match[1]);
  }
  
  return Array.from(slugs).sort();
}

/**
 * Fetch developer detail page and extract info
 */
async function fetchDeveloperDetail(
  slug: string, 
  firecrawlApiKey: string,
  displayOrder: number
): Promise<ProvidentDeveloper | null> {
  const url = `https://providentestate.com/new-projects/developed-by-${slug}/`;
  
  try {
    const response = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${firecrawlApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url,
        formats: ["html"],
        onlyMainContent: false,
        waitFor: 3000,
        timeout: 30000,
      }),
    });

    if (!response.ok) {
      console.warn(`Failed to fetch ${url}: ${response.status}`);
      return null;
    }

    const data = await response.json();
    const html = data?.data?.html || data?.html || "";
    
    if (!html) {
      console.warn(`No HTML for ${slug}`);
      return null;
    }

    // Extract developer info from the page
    // Look for the developer header section
    let name = deslugify(slug);
    let description = "";
    let logoUrl = "";
    let featureImageUrl = "";

    // Try to find the developer name in a h1 or title
    const h1Match = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
    if (h1Match) {
      const extractedName = decodeHtmlEntities(h1Match[1]).trim();
      // Only use if it looks like a developer name (not too long)
      if (extractedName.length < 100 && !extractedName.toLowerCase().includes("project")) {
        name = extractedName;
      }
    }

    // Look for developer logo
    const logoMatch = html.match(/<img[^>]*class="[^"]*developer[^"]*logo[^"]*"[^>]*>/i) ||
                      html.match(/<img[^>]*alt="[^"]*logo[^"]*"[^>]*>/i) ||
                      html.match(/<div[^>]*class="[^"]*logo[^"]*"[^>]*>\s*<img[^>]*>/i);
    if (logoMatch) {
      logoUrl = pickBestImageFromImgTag(logoMatch[0]);
    }

    // Look for feature/banner image
    const bannerMatch = html.match(/<div[^>]*class="[^"]*banner[^"]*"[^>]*>[\s\S]*?<img[^>]*>/i) ||
                        html.match(/<img[^>]*class="[^"]*banner[^"]*"[^>]*>/i);
    if (bannerMatch) {
      featureImageUrl = pickBestImageFromImgTag(bannerMatch[0]);
    }

    // Try to find og:image as fallback
    if (!featureImageUrl) {
      const ogMatch = html.match(/<meta[^>]*property="og:image"[^>]*content="([^"]+)"/i);
      if (ogMatch) {
        featureImageUrl = normalizeUrl(ogMatch[1]);
      }
    }

    // Look for description
    const descMatch = html.match(/<meta[^>]*name="description"[^>]*content="([^"]+)"/i);
    if (descMatch) {
      description = decodeHtmlEntities(descMatch[1]).trim();
    }

    return {
      name,
      slug,
      description,
      feature_image_url: featureImageUrl,
      logo_url: logoUrl,
      provident_link: url,
      display_order: displayOrder,
    };
  } catch (error) {
    console.warn(`Error fetching ${slug}:`, error);
    return null;
  }
}

/**
 * PROVIDENT DEVELOPERS EXTRACTION v8 - SITEMAP + INDIVIDUAL PAGES
 * 
 * Strategy:
 * 1. Fetch the initial /developers/ page to get the first 24 with full card data
 * 2. Fetch the sitemap to discover ALL developer slugs 
 * 3. For slugs not in initial 24, fetch individual developer pages
 * 
 * This bypasses the infinite scroll limitation.
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

    console.log("🔄 Starting Provident Developers Extraction v8 (Sitemap Strategy)...");

    if (!firecrawlApiKey) {
      throw new Error("FIRECRAWL_API_KEY not configured");
    }

    // Step 1: Get initial 24 developers from the main page (these have best quality data)
    console.log(`📄 Step 1: Scraping main developers page: ${PROVIDENT_DEVELOPERS_URL}`);
    
    const mainPageResponse = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${firecrawlApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url: PROVIDENT_DEVELOPERS_URL,
        formats: ["html"],
        onlyMainContent: false,
        waitFor: 3000,
        timeout: 60000,
      }),
    });

    if (!mainPageResponse.ok) {
      const errorText = await mainPageResponse.text();
      console.error("Firecrawl error on main page:", errorText);
      throw new Error(`Firecrawl request failed: ${mainPageResponse.status}`);
    }

    const mainPageData = await mainPageResponse.json();
    const mainHtml = mainPageData?.data?.html || mainPageData?.html || "";
    
    console.log(`📄 Main page HTML: ${mainHtml.length} characters`);
    
    // Extract initial developers
    const initialDevelopers = extractDeveloperCards(mainHtml);
    const knownSlugs = new Set(initialDevelopers.map(d => d.slug));
    
    console.log(`✅ Step 1 complete: ${initialDevelopers.length} developers from main page`);

    // Step 2: Fetch sitemap to discover ALL developer slugs
    console.log(`📄 Step 2: Fetching sitemap: ${OFFPLANS_SITEMAP_URL}`);
    
    const sitemapResponse = await fetch(OFFPLANS_SITEMAP_URL);
    if (!sitemapResponse.ok) {
      console.warn("Could not fetch sitemap, using initial developers only");
    } else {
      const sitemapContent = await sitemapResponse.text();
      const allSlugs = extractDeveloperSlugsFromSitemap(sitemapContent);
      const newSlugs = allSlugs.filter(s => !knownSlugs.has(s));
      
      console.log(`📊 Sitemap contains ${allSlugs.length} unique developer slugs`);
      console.log(`📊 ${newSlugs.length} new developers to fetch`);
      
      // Step 3: Fetch details for new developers (limit to prevent timeout)
      const MAX_ADDITIONAL = 200; // Safety limit
      const slugsToFetch = newSlugs.slice(0, MAX_ADDITIONAL);
      
      console.log(`📄 Step 3: Fetching ${slugsToFetch.length} additional developer pages...`);
      
      // Fetch in batches to avoid rate limits
      const BATCH_SIZE = 5;
      let additionalCount = 0;
      
      for (let i = 0; i < slugsToFetch.length; i += BATCH_SIZE) {
        const batch = slugsToFetch.slice(i, i + BATCH_SIZE);
        const promises = batch.map((slug, idx) => 
          fetchDeveloperDetail(slug, firecrawlApiKey, initialDevelopers.length + i + idx + 1)
        );
        
        const results = await Promise.all(promises);
        
        for (const dev of results) {
          if (dev) {
            initialDevelopers.push(dev);
            additionalCount++;
            console.log(`  ✅ [${dev.display_order}] ${dev.name}`);
          }
        }
        
        // Small delay between batches
        if (i + BATCH_SIZE < slugsToFetch.length) {
          await new Promise(r => setTimeout(r, 500));
        }
      }
      
      console.log(`✅ Step 3 complete: Added ${additionalCount} additional developers`);
    }

    // Deduplicate by slug
    const bySlug = new Map<string, ProvidentDeveloper>();
    for (const dev of initialDevelopers) {
      if (!dev.slug) continue;
      if (!bySlug.has(dev.slug)) {
        bySlug.set(dev.slug, dev);
      }
    }
    const extractedDevelopers = Array.from(bySlug.values()).sort((a, b) => a.display_order - b.display_order);

    console.log(`📊 Total extracted: ${extractedDevelopers.length} developers (deduped)`);

    // Safety check
    if (extractedDevelopers.length < 10) {
      throw new Error(
        `TOO FEW DEVELOPERS EXTRACTED (${extractedDevelopers.length}) - aborting.`
      );
    }

    // Clear all existing rows
    console.log("🗑️ Clearing all existing pending_developer_imports rows...");
    const { error: delErr } = await supabase
      .from("pending_developer_imports")
      .delete()
      .not("id", "is", null);

    if (delErr) {
      console.warn("Warning: could not clear rows:", delErr.message);
    }

    // Insert fresh data
    const rows = extractedDevelopers.map((dev) => ({
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

    console.log(`💾 Inserting ${rows.length} rows...`);
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
      records_found: extractedDevelopers.length,
      records_matched: 0,
      records_pending: extractedDevelopers.length,
      metadata: {
        source: "provident_estate",
        url: PROVIDENT_DEVELOPERS_URL,
        version: "v8-sitemap",
      },
    });

    console.log(`✅ Successfully extracted and stored ${extractedDevelopers.length} developers`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully extracted ${extractedDevelopers.length} developers`,
        count: extractedDevelopers.length,
        developers: extractedDevelopers.map((d) => ({
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
