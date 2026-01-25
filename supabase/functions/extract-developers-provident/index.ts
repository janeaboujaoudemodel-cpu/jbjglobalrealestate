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
 * Fetch ALL developers from Provident by directly accessing Gatsby's page-data.json
 * Provident uses Gatsby which stores all data in JSON files - much faster than scraping HTML
 */
async function fetchAllDevelopers(
  firecrawlApiKey: string
): Promise<ProvidentDeveloper[]> {
  console.log(`📄 Attempting to fetch Gatsby page data for: ${PROVIDENT_DEVELOPERS_URL}`);
  
  try {
    // Try Gatsby page-data.json first (common pattern for Gatsby sites)
    const pageDataUrl = "https://providentestate.com/page-data/developers/page-data.json";
    console.log(`📄 Trying Gatsby page-data: ${pageDataUrl}`);
    
    const pageDataResponse = await fetch(pageDataUrl);
    
    if (pageDataResponse.ok) {
      const pageData = await pageDataResponse.json();
      console.log(`✅ Found Gatsby page data`);
      
      // Extract developers from Gatsby data structure
      // Gatsby typically stores data in result.data or result.pageContext
      const developers: ProvidentDeveloper[] = [];
      let displayOrder = 0;
      
      // Try to find developers array in the data structure
      const findDevelopersArray = (obj: any): any[] => {
        if (Array.isArray(obj)) return obj;
        if (obj && typeof obj === 'object') {
          for (const key of Object.keys(obj)) {
            if (key.toLowerCase().includes('developer') && Array.isArray(obj[key])) {
              return obj[key];
            }
            const found = findDevelopersArray(obj[key]);
            if (found.length > 0) return found;
          }
        }
        return [];
      };
      
      const developersData = findDevelopersArray(pageData);
      console.log(`📊 Found ${developersData.length} developers in Gatsby data`);
      
      for (const dev of developersData) {
        displayOrder++;
        developers.push({
          name: dev.name || dev.title || '',
          slug: slugify(dev.name || dev.title || dev.slug || ''),
          description: dev.description || dev.excerpt || '',
          feature_image_url: normalizeUrl(dev.featuredImage?.url || dev.image || dev.featured_image || ''),
          logo_url: normalizeUrl(dev.logo?.url || dev.logoUrl || dev.logo_url || ''),
          provident_link: normalizeUrl(dev.url || dev.link || `/developers/${dev.slug || ''}`),
          display_order: displayOrder,
        });
      }
      
      if (developers.length > 0) {
        console.log(`✅ Successfully extracted ${developers.length} developers from Gatsby data`);
        return developers;
      }
    }
    
    // Fallback: Use Firecrawl to scrape with minimal actions
    console.log(`📄 Gatsby JSON not found, falling back to HTML scraping with Firecrawl`);
    const response = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${firecrawlApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url: PROVIDENT_DEVELOPERS_URL,
        formats: ["html"],
        onlyMainContent: false,
        waitFor: 5000,
        timeout: 60000,
      }),
    });

    if (!response.ok) {
      console.warn(`Fetch failed: ${response.status}`);
      return [];
    }

    const data = await response.json();
    const html = data?.data?.html || data?.html || "";
    
    if (!html || html.length < 1000) {
      console.log(`No content returned`);
      return [];
    }

    const developers = extractDeveloperCards(html);
    console.log(`✅ Total developers found from HTML: ${developers.length}`);
    
    return developers;
  } catch (error) {
    console.warn(`Error fetching developers:`, error);
    return [];
  }
}

/**
 * PROVIDENT DEVELOPERS EXTRACTION v14 - GATSBY JSON EXTRACTION
 * 
 * Strategy:
 * 1. Try to fetch Gatsby's page-data.json directly (fast, gets all data at once)
 * 2. If that fails, fall back to HTML scraping with Firecrawl
 * 3. Deduplicate by slug before saving
 * 
 * This bypasses the infinite scroll issue entirely.
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

    console.log(`🔄 Starting Provident Developers Extraction v14 (Gatsby JSON)...`);
    console.log(`🔄 Attempting direct Gatsby data fetch for maximum speed`);

    if (!firecrawlApiKey) {
      throw new Error("FIRECRAWL_API_KEY not configured");
    }

    // Clear existing PENDING queue if requested
    if (clearExisting) {
      console.log("🗑️ Clearing all existing pending_developer_imports rows...");
      const { error: delErr } = await supabase
        .from("pending_developer_imports")
        .delete()
        .not("id", "is", null);

      if (delErr) {
        console.warn("Warning: could not clear rows:", delErr.message);
      }
    }

    // Fetch ALL developers using scroll actions
    const allDevelopers = await fetchAllDevelopers(firecrawlApiKey);

    console.log(`📊 Total developers extracted: ${allDevelopers.length}`);

    if (allDevelopers.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: "No developers found on specified pages.",
          count: 0,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Deduplicate developers by slug before upserting
    console.log(`🔍 Deduplicating ${allDevelopers.length} developers by slug...`);
    const uniqueDevelopersMap = new Map<string, ProvidentDeveloper>();
    for (const dev of allDevelopers) {
      if (!uniqueDevelopersMap.has(dev.slug)) {
        uniqueDevelopersMap.set(dev.slug, dev);
      }
    }
    const uniqueDevelopers = Array.from(uniqueDevelopersMap.values());
    console.log(`✅ After deduplication: ${uniqueDevelopers.length} unique developers`);

    // Insert new developers
    const rows = uniqueDevelopers.map((dev) => ({
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

    console.log(`💾 Upserting ${rows.length} rows (insert new, update existing)...`);
    const { error: insertError } = await supabase
      .from("pending_developer_imports")
      .upsert(rows, { onConflict: 'slug' });

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
      records_found: uniqueDevelopers.length,
      records_matched: 0,
      records_pending: allDevelopers.length,
        metadata: {
          source: "provident_estate",
          url: PROVIDENT_DEVELOPERS_URL,
          version: "v14-gatsby-json",
          extractionMethod: "gatsby-page-data-or-html-fallback",
        },
    });

    console.log(`✅ Successfully extracted and stored ${allDevelopers.length} new developers`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully extracted ${uniqueDevelopers.length} unique developers using scroll actions`,
        count: uniqueDevelopers.length,
        extractionMethod: "scroll-based",
        developers: uniqueDevelopers.map((d) => ({
          name: d.name,
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
