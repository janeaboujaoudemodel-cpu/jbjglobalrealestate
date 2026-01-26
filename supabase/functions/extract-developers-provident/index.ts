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

    if (!firecrawlApiKey) {
      throw new Error("FIRECRAWL_API_KEY not configured");
    }

    // Step 1: Use Firecrawl MAP to discover all developer URLs
    console.log("📡 Mapping all developer URLs...");
    
    const mapResponse = await fetch(`${FIRECRAWL_API_URL}/map`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${firecrawlApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url: `${PROVIDENT_BASE_URL}/developers/`,
        search: "developed-by",
        limit: 500,
        includeSubdomains: false,
      }),
    });

    if (!mapResponse.ok) {
      const errorText = await mapResponse.text();
      console.error("Firecrawl MAP error:", errorText);
      throw new Error(`Firecrawl MAP failed: ${mapResponse.status}`);
    }

    const mapData = await mapResponse.json();
    const allUrls: string[] = mapData.links || [];
    
    // Filter to only developer URLs
    const developerUrls = allUrls.filter((url: string) => 
      url.includes("/new-projects/developed-by-") || 
      url.includes("/developers/")
    );
    
    console.log(`📊 Found ${developerUrls.length} developer-related URLs`);

    // Step 2: Also fetch the main developers page directly for initial data
    console.log("📡 Fetching main developers page...");
    const response = await fetch(`${PROVIDENT_BASE_URL}/developers/`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
      },
    });

    const html = response.ok ? await response.text() : "";
    console.log(`📊 Fetched ${html.length} bytes from main page`);

    // Step 3: Parse developers from main page
    const scrapedDevelopers = parseDeveloperCards(html);
    console.log(`📊 Scraped ${scrapedDevelopers.size} developers from main page`);

    // Step 4: Extract developer names from URLs and add to collection
    const allDevelopers: ProvidentDeveloper[] = [];
    const seenSlugs = new Set<string>();
    let displayOrder = 0;

    // First add all scraped developers with full data
    for (const [slug, dev] of scrapedDevelopers) {
      if (!seenSlugs.has(slug)) {
        displayOrder++;
        dev.display_order = displayOrder;
        allDevelopers.push(dev);
        seenSlugs.add(slug);
      }
    }

    // Then extract developer names from discovered URLs
    for (const url of developerUrls) {
      const match = url.match(/developed-by-([^\/]+)/);
      if (match) {
        const slug = match[1].replace(/\/$/, "");
        if (!seenSlugs.has(slug)) {
          // Convert slug to name
          const name = slug
            .split("-")
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ");
          
          displayOrder++;
          allDevelopers.push({
            name,
            slug,
            description: "",
            feature_image_url: "",
            logo_url: "",
            provident_link: url,
            display_order: displayOrder,
          });
          seenSlugs.add(slug);
        }
      }
    }

    console.log(`📊 Total unique developers: ${allDevelopers.length}`);

    // Step 5: Clear existing and save new
    await supabase.from("pending_developer_imports").delete().not("id", "is", null);

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
      metadata: { source: "provident_estate", version: "v20-map-scrape" },
    });

    const withFullData = allDevelopers.filter(d => d.feature_image_url && d.logo_url).length;
    console.log(`✅ Extracted ${allDevelopers.length} developers (${withFullData} with full data)`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Extracted ${allDevelopers.length} developers`,
        count: allDevelopers.length,
        withFullData,
        developerUrls: developerUrls.length,
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
