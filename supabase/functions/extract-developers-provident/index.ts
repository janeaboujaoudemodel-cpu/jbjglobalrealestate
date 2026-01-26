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

const PROVIDENT_BASE_URL = "https://providentestate.com";
const FIRECRAWL_API_URL = "https://api.firecrawl.dev/v1";

/**
 * PROVIDENT PAGINATION LIMITATION:
 * 
 * Provident Estate uses infinite scroll WITHOUT URL changes.
 * When you click "page 2", the URL stays the same (e.g., /developers/)
 * and new content is loaded dynamically via JavaScript.
 * 
 * This means:
 * - We can only extract the initial 24 developers visible on page load
 * - URL-based pagination strategies don't work
 * - Firecrawl scroll actions timeout before all ~160 developers load
 * - Browser automation would be required to extract all pages
 * 
 * Current approach extracts 24 developers with complete images/logos
 * from the first page, which is reliable and consistently working.
 */

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
  if (trimmed.startsWith("/")) return `${PROVIDENT_BASE_URL}${trimmed}`;
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

// Parse developer data from the listing page HTML
function parseDeveloperCards(html: string): Map<string, ProvidentDeveloper> {
  const developersMap = new Map<string, ProvidentDeveloper>();
  let displayOrder = 0;

  const cardRegex = /<div class="developer-card">([\s\S]*?)(?=<div class="developer-card">|<\/div><\/div><\/div><\/div><\/div>)/g;
  
  let match;
  while ((match = cardRegex.exec(html)) !== null) {
    const cardHtml = match[1];
    displayOrder++;

    const nameMatch = cardHtml.match(/<a class="name"[^>]*>[\s\S]*?<span>([^<]+)<\/span>/i);
    const name = nameMatch ? decodeHtmlEntities(nameMatch[1]).trim() : "";

    const linkMatch = cardHtml.match(/href="([^"]*developed-by-[^"]+)"/i);
    const providentLink = linkMatch ? normalizeUrl(linkMatch[1]) : "";

    const featureMatch = cardHtml.match(/<div class="img-section">[\s\S]*?<img[^>]*src="([^"]+)"/i);
    const featureImage = featureMatch ? normalizeUrl(featureMatch[1]) : "";

    const logoMatch = cardHtml.match(/<div class="logo-section">[\s\S]*?<img[^>]*src="([^"]+)"/i);
    const logo = logoMatch ? normalizeUrl(logoMatch[1]) : "";

    const descMatch = cardHtml.match(/<p class="description">([\s\S]*?)<\/p>/i);
    let description = descMatch ? decodeHtmlEntities(descMatch[1]).trim() : "";
    description = description.replace(/<[^>]+>/g, "").trim().substring(0, 500);

    if (!name) continue;

    const slug = slugify(name);
    developersMap.set(slug, {
      name,
      slug,
      description,
      feature_image_url: featureImage,
      logo_url: logo,
      provident_link: providentLink,
      display_order: displayOrder,
    });
  }

  return developersMap;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const firecrawlApiKey = Deno.env.get("FIRECRAWL_API_KEY");
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log(`🔄 Starting Provident Developers Extraction v20 (Map + Scrape)...`);
    console.log(`🔄 Starting Provident Developers Extraction v21 (Enhanced Scroll)...`);

    if (!firecrawlApiKey) {
      throw new Error("FIRECRAWL_API_KEY not configured");
    }

    // Step 1: Use Firecrawl with scroll actions to load ALL developers
    console.log("📡 Scraping developers page with scroll actions...");
    
    const scrapeResponse = await fetch(`${FIRECRAWL_API_URL}/scrape`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${firecrawlApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url: `${PROVIDENT_BASE_URL}/developers/`,
        formats: ["html"],
        onlyMainContent: false,
        waitFor: 3000,
        timeout: 90000,
        actions: [
          { type: "wait", milliseconds: 3000 },
          { type: "scroll", direction: "down", amount: 1000 },
          { type: "wait", milliseconds: 3000 },
          { type: "scroll", direction: "down", amount: 1000 },
          { type: "wait", milliseconds: 3000 },
          { type: "scroll", direction: "down", amount: 1000 },
          { type: "wait", milliseconds: 3000 },
          { type: "scroll", direction: "down", amount: 1000 },
          { type: "wait", milliseconds: 3000 },
          { type: "scroll", direction: "down", amount: 1000 },
          { type: "wait", milliseconds: 3000 },
          { type: "scroll", direction: "down", amount: 1000 },
          { type: "wait", milliseconds: 3000 },
          { type: "scroll", direction: "down", amount: 1000 },
          { type: "wait", milliseconds: 3000 },
          { type: "scroll", direction: "down", amount: 1000 },
        ],
      }),
    });

    if (!scrapeResponse.ok) {
      const errorText = await scrapeResponse.text();
      console.error("Firecrawl scrape error:", errorText);
      throw new Error(`Firecrawl scrape failed: ${scrapeResponse.status}`);
    }

    const scrapeData = await scrapeResponse.json();
    const html = scrapeData.data?.html || scrapeData.html || "";
    console.log(`📊 Scraped ${html.length} bytes with scroll actions`);

    // Step 2: Parse ALL developers from scrolled page
    const scrapedDevelopers = parseDeveloperCards(html);
    console.log(`📊 Extracted ${scrapedDevelopers.size} developers with complete data`);

    // Step 3: Convert to array
    const allDevelopers = Array.from(scrapedDevelopers.values());

    // Step 4: Save to database
    console.log(`💾 Saving ${allDevelopers.length} developers to database...`);

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

    const { error: insertError } = await supabase
      .from("pending_developer_imports")
      .insert(rows);

    if (insertError) throw new Error(`Failed to store: ${insertError.message}`);

    // Log the extraction job
    await supabase.from("extraction_job_logs").insert({
      source_id: null,
      job_type: "developer_extraction",
      status: "completed",
      started_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
      records_found: allDevelopers.length,
      records_matched: allDevelopers.filter(d => d.feature_image_url && d.logo_url).length,
      records_pending: allDevelopers.length,
      metadata: { source: "provident_estate", version: "v21-scroll-enhanced" },
    });

    console.log(`✅ Successfully extracted ${allDevelopers.length} developers with complete media`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Extracted ${allDevelopers.length} developers`,
        count: allDevelopers.length,
        developers: allDevelopers.slice(0, 30).map(d => ({ name: d.name, hasImage: !!d.feature_image_url, hasLogo: !!d.logo_url })),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("❌ Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
