import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PROVIDENT_DEVELOPERS_URL = "https://providentestate.com/developers";
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
    .replace(/&#39;/g, "'")
    .replace(/<[^>]+>/g, "") // Strip HTML tags
    .trim();
}

// Extract developers directly from the /developers page HTML
function extractDevelopersFromHtml(html: string): Array<{
  name: string;
  slug: string;
  description: string;
  feature_image_url: string;
  logo_url: string;
  provident_link: string;
}> {
  const developers: Array<{
    name: string;
    slug: string;
    description: string;
    feature_image_url: string;
    logo_url: string;
    provident_link: string;
  }> = [];

  // Pattern 1: Look for developer card patterns with images
  // Each developer card typically has: feature image, logo, name link, description
  const cardPatterns = [
    // Pattern for cards with developed-by links
    /<a[^>]*href="([^"]*developed-by-[^"]*)"[^>]*>[\s\S]*?<img[^>]*src="([^"]+)"[^>]*>[\s\S]*?<img[^>]*src="([^"]+)"[^>]*>[\s\S]*?<\/a>/gi,
    // Alternative pattern
    /<div[^>]*class="[^"]*developer[^"]*"[^>]*>[\s\S]*?<a[^>]*href="([^"]+)"[^>]*>[\s\S]*?<\/div>/gi,
  ];

  // Extract all image URLs first
  const allImages: string[] = [];
  const imgPattern = /<img[^>]*src="([^"]+)"[^>]*/gi;
  let imgMatch;
  while ((imgMatch = imgPattern.exec(html)) !== null) {
    const src = normalizeUrl(imgMatch[1]);
    if (src && src.includes("cloudfront") && !src.includes("svg")) {
      allImages.push(src);
    }
  }
  console.log(`📸 Found ${allImages.length} CloudFront images`);

  // Extract all developer links
  const developerLinks: Array<{ href: string; name: string }> = [];
  const linkPattern = /<a[^>]*href="([^"]*(?:developed-by-|developer\/)[^"]*)"[^>]*>([^<]*)<\/a>/gi;
  let linkMatch;
  while ((linkMatch = linkPattern.exec(html)) !== null) {
    const href = normalizeUrl(linkMatch[1]);
    const rawName = decodeHtmlEntities(linkMatch[2]);
    if (href && rawName && rawName.length > 2 && rawName.length < 100) {
      developerLinks.push({ href, name: rawName });
    }
  }

  // Also try to find names from h2/h3/h4 tags near developer links
  const headingPattern = /<(?:h[2-4]|strong)[^>]*>([^<]{3,60})<\/(?:h[2-4]|strong)>/gi;
  let headingMatch;
  const headingNames: string[] = [];
  while ((headingMatch = headingPattern.exec(html)) !== null) {
    const name = decodeHtmlEntities(headingMatch[1]);
    if (name && !name.includes("<") && !name.includes("&") && name.length > 2 && name.length < 60) {
      headingNames.push(name);
    }
  }

  console.log(`🔗 Found ${developerLinks.length} developer links`);
  console.log(`📝 Found ${headingNames.length} potential names from headings`);

  // Extract descriptions
  const descPattern = /<p[^>]*>([^<]{30,500})<\/p>/gi;
  const descriptions: string[] = [];
  let descMatch;
  while ((descMatch = descPattern.exec(html)) !== null) {
    const desc = decodeHtmlEntities(descMatch[1]);
    if (desc && !desc.includes("cookie") && !desc.includes("privacy") && desc.length > 30) {
      descriptions.push(desc.substring(0, 500));
    }
  }

  // Build developer objects
  const seenSlugs = new Set<string>();
  
  for (const link of developerLinks) {
    // Extract slug from URL
    const slugMatch = link.href.match(/developed-by-([^\/\?#]+)/i) || 
                      link.href.match(/developer\/([^\/\?#]+)/i);
    if (!slugMatch) continue;
    
    const slug = slugify(slugMatch[1]);
    if (seenSlugs.has(slug)) continue;
    seenSlugs.add(slug);

    // Find matching images (look for images near this link in the HTML)
    const linkIndex = html.indexOf(link.href);
    const contextStart = Math.max(0, linkIndex - 2000);
    const contextEnd = Math.min(html.length, linkIndex + 2000);
    const context = html.substring(contextStart, contextEnd);

    // Find images in context
    const contextImages: string[] = [];
    const contextImgPattern = /<img[^>]*src="([^"]+)"[^>]*/gi;
    let contextImgMatch;
    while ((contextImgMatch = contextImgPattern.exec(context)) !== null) {
      const src = normalizeUrl(contextImgMatch[1]);
      if (src && src.includes("cloudfront") && !src.includes("svg")) {
        contextImages.push(src);
      }
    }

    // First image is usually feature, second is logo
    const featureImage = contextImages.find(img => img.includes("260x") || img.includes("w_260")) ||
                         contextImages[0] || "";
    const logoImage = contextImages.find(img => img.includes("w_296") || img.includes("logo")) ||
                      contextImages[1] || "";

    // Find description in context
    const contextDescPattern = /<p[^>]*>([^<]{30,500})<\/p>/i;
    const contextDescMatch = context.match(contextDescPattern);
    const description = contextDescMatch ? decodeHtmlEntities(contextDescMatch[1]).substring(0, 500) : "";

    developers.push({
      name: link.name,
      slug,
      description,
      feature_image_url: featureImage,
      logo_url: logoImage,
      provident_link: link.href,
    });
  }

  // Deduplicate and clean
  return developers.filter(d => d.name && d.slug);
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const firecrawlApiKey = Deno.env.get("FIRECRAWL_API_KEY");
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log("🔄 Starting v31: Direct page extraction");

    if (!firecrawlApiKey) throw new Error("FIRECRAWL_API_KEY not configured");

    // Step 1: Scrape the developers page directly
    console.log("📄 Scraping developers page...");
    const scrapeRes = await fetch(`${FIRECRAWL_API_URL}/scrape`, {
      method: "POST",
      headers: { 
        "Authorization": `Bearer ${firecrawlApiKey}`, 
        "Content-Type": "application/json" 
      },
      body: JSON.stringify({ 
        url: PROVIDENT_DEVELOPERS_URL, 
        formats: ["html"], 
        onlyMainContent: false,
        waitFor: 3000 // Wait for dynamic content
      }),
    });

    if (!scrapeRes.ok) {
      const errorText = await scrapeRes.text();
      console.error("Scrape API error:", errorText);
      throw new Error(`Scrape failed: ${scrapeRes.status}`);
    }

    const scrapeData = await scrapeRes.json();
    const html = scrapeData.data?.html || "";
    console.log(`📊 Received HTML: ${html.length} characters`);

    if (html.length < 1000) {
      throw new Error("Received insufficient HTML content");
    }

    // Step 2: Extract developers from HTML
    const developers = extractDevelopersFromHtml(html);
    console.log(`✅ Extracted ${developers.length} developers from page`);

    // Log sample
    developers.slice(0, 5).forEach((dev, i) => {
      console.log(`  ${i + 1}. ${dev.name} (${dev.slug})`);
      console.log(`     Feature: ${dev.feature_image_url?.substring(0, 60)}...`);
      console.log(`     Logo: ${dev.logo_url?.substring(0, 60)}...`);
    });

    if (developers.length === 0) {
      // Try alternative: Map the site for developer URLs
      console.log("🗺️ Falling back to site mapping...");
      const mapRes = await fetch(`${FIRECRAWL_API_URL}/map`, {
        method: "POST",
        headers: { 
          "Authorization": `Bearer ${firecrawlApiKey}`, 
          "Content-Type": "application/json" 
        },
        body: JSON.stringify({ 
          url: "https://providentestate.com",
          limit: 5000,
          search: "developed-by"
        }),
      });

      if (mapRes.ok) {
        const mapData = await mapRes.json();
        const devUrls = (mapData.links || []).filter((u: string) => 
          u.includes("developed-by-") && !u.includes("?")
        );
        console.log(`📊 Found ${devUrls.length} developer URLs from map`);
        
        // Scrape each developer page
        for (const url of devUrls.slice(0, 50)) {
          try {
            const pageRes = await fetch(`${FIRECRAWL_API_URL}/scrape`, {
              method: "POST",
              headers: { 
                "Authorization": `Bearer ${firecrawlApiKey}`, 
                "Content-Type": "application/json" 
              },
              body: JSON.stringify({ url, formats: ["html"], waitFor: 2000 }),
            });
            
            if (!pageRes.ok) continue;
            
            const pageData = await pageRes.json();
            const pageHtml = pageData.data?.html || "";
            
            // Extract developer info from individual page
            const nameMatch = pageHtml.match(/<h1[^>]*>([^<]+)<\/h1>/i);
            const name = nameMatch ? decodeHtmlEntities(nameMatch[1]) : "";
            if (!name || name.length < 3) continue;
            
            const slugMatch = url.match(/developed-by-([^\/\?#]+)/i);
            const slug = slugMatch ? slugify(slugMatch[1]) : slugify(name);
            
            // Find images
            const imgMatches = [...pageHtml.matchAll(/<img[^>]*src="([^"]+cloudfront[^"]+)"[^>]*/gi)];
            const images = imgMatches.map(m => normalizeUrl(m[1])).filter(Boolean);
            
            developers.push({
              name,
              slug,
              description: "",
              feature_image_url: images.find(i => i.includes("banner") || i.includes("hero")) || images[0] || "",
              logo_url: images.find(i => i.includes("logo")) || images[1] || "",
              provident_link: url,
            });
            
            await new Promise(r => setTimeout(r, 500)); // Rate limit
          } catch (e) {
            console.error(`Error scraping ${url}:`, e);
          }
        }
      }
    }

    if (developers.length === 0) {
      throw new Error("Could not extract any developers");
    }

    // Step 3: Clean existing data and save to pending_developer_imports
    console.log("💾 Saving to pending_developer_imports...");
    await supabase.from("pending_developer_imports").delete().eq("source", "provident_estate");

    const { error } = await supabase.from("pending_developer_imports").upsert(
      developers.map(d => ({
        ...d,
        source: "provident_estate",
        status: "pending",
        extracted_at: new Date().toISOString(),
      })),
      { onConflict: "slug" }
    );

    if (error) throw error;

    // Log extraction job
    await supabase.from("extraction_job_logs").insert({
      source_id: null,
      job_type: "developer_extraction",
      status: "completed",
      started_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
      records_found: developers.length,
      records_matched: developers.filter(d => d.feature_image_url && d.logo_url).length,
      records_pending: developers.length,
      metadata: { source: "provident_estate", version: "v31-direct-extraction" },
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Extracted ${developers.length} developers`, 
        count: developers.length,
        withImages: developers.filter(d => d.feature_image_url).length,
        withLogos: developers.filter(d => d.logo_url).length,
      }), 
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("❌", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error" 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
