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
}

/**
 * PROVIDENT DEVELOPERS EXTRACTION
 * 
 * Extracts ALL developers from https://providentestate.com/developers/
 * with exact matching of:
 * - Feature images (project photos)
 * - Logo images
 * - Names
 * - Descriptions
 * - Links
 * 
 * NO PARTIAL EXTRACTION - ALL OR NOTHING
 */
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log("🔄 Starting Provident Developers Extraction...");

    // Fetch the developers page
    const response = await fetch("https://providentestate.com/developers/", {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch Provident developers page: ${response.status}`);
    }

    const html = await response.text();
    console.log(`📄 Fetched HTML: ${html.length} characters`);

    // Extract developers using regex patterns matching the HTML structure
    const extractedDevelopers: ProvidentDeveloper[] = [];

    // Pattern to match developer cards
    // Structure: <div class="developer-card">...<img src="FEATURE_IMAGE">...<img src="LOGO">...<a class="name">NAME</a>...<p class="description">DESC</p>
    
    const developerCardPattern = /<div class="developer-card">([\s\S]*?)<\/div>(?=\s*<div class="developer-card">|\s*<\/div>\s*<\/div>\s*<div class="category-section|$)/g;
    
    // More reliable: extract from the structured HTML
    // Find all developer sections
    const featureImagePattern = /<div class="img-section">\s*<img[^>]*src="([^"]+)"[^>]*alt="developer-([^"]+)-image/g;
    const logoPattern = /<div class="logo-section">\s*<img[^>]*src="([^"]+)"/g;
    const namePattern = /<a class="name"[^>]*href="([^"]+)"[^>]*>\s*<span>([^<]+)<\/span>/g;
    const descPattern = /<p class="description">([^<]+(?:<[^>]+>[^<]*<\/[^>]+>)?[^<]*)<\/p>/g;

    // Extract all feature images with developer names
    const featureImages: Array<{url: string, name: string}> = [];
    let match;
    while ((match = featureImagePattern.exec(html)) !== null) {
      featureImages.push({ url: match[1], name: match[2] });
    }

    // Extract all logos
    const logos: string[] = [];
    while ((match = logoPattern.exec(html)) !== null) {
      logos.push(match[1]);
    }

    // Extract all names with links
    const names: Array<{link: string, name: string}> = [];
    while ((match = namePattern.exec(html)) !== null) {
      names.push({ link: match[1], name: match[2].trim() });
    }

    // Extract all descriptions
    const descriptions: string[] = [];
    while ((match = descPattern.exec(html)) !== null) {
      // Clean HTML entities and tags
      let desc = match[1]
        .replace(/&amp;nbsp;/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/<[^>]+>/g, '')
        .trim();
      descriptions.push(desc);
    }

    console.log(`📊 Found: ${featureImages.length} images, ${logos.length} logos, ${names.length} names, ${descriptions.length} descriptions`);

    // Combine into developer objects
    const minCount = Math.min(featureImages.length, logos.length, names.length, descriptions.length);
    
    for (let i = 0; i < minCount; i++) {
      const name = names[i].name;
      const slug = name.toLowerCase()
        .replace(/[&]/g, 'and')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

      extractedDevelopers.push({
        name: name,
        slug: slug,
        description: descriptions[i],
        feature_image_url: featureImages[i].url,
        logo_url: logos[i],
        provident_link: names[i].link,
      });
    }

    console.log(`✅ Extracted ${extractedDevelopers.length} developers`);

    if (extractedDevelopers.length === 0) {
      throw new Error("NO DEVELOPERS EXTRACTED - Aborting to prevent data loss");
    }

    // Validate minimum expected count (Provident has ~20+ developers)
    if (extractedDevelopers.length < 15) {
      console.warn(`⚠️ Warning: Only ${extractedDevelopers.length} developers found. Expected 15+. Continuing with caution.`);
    }

    // Store in pending_developer_imports table for admin approval
    const pendingImports = extractedDevelopers.map(dev => ({
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

    // Upsert to avoid duplicates (based on slug)
    const { error: insertError } = await supabase
      .from("pending_developer_imports")
      .upsert(pendingImports, {
        onConflict: "slug",
        ignoreDuplicates: false,
      });

    if (insertError) {
      console.error("Insert error:", insertError);
      throw new Error(`Failed to store pending imports: ${insertError.message}`);
    }

    // Log extraction job
    await supabase
      .from("extraction_job_logs")
      .insert({
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
          url: "https://providentestate.com/developers/",
        },
      });

    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully extracted ${extractedDevelopers.length} developers`,
        count: extractedDevelopers.length,
        developers: extractedDevelopers.map(d => ({
          name: d.name,
          logo: d.logo_url,
          image: d.feature_image_url,
        })),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("❌ Extraction error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    
    return new Response(
      JSON.stringify({
        success: false,
        error: message,
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
