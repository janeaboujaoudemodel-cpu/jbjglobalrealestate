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
 * PROVIDENT DEVELOPERS EXTRACTION v2
 * 
 * Extracts ALL developers from https://providentestate.com/developers/
 * Using precise HTML structure matching for developer-card elements
 * 
 * Structure per card:
 * <div class="developer-card">
 *   <a class="img-section-wrap" href="LINK">
 *     <div class="img-section">
 *       <img src="FEATURE_IMAGE" />
 *       <div class="logo-section">
 *         <img src="LOGO" />
 *       </div>
 *     </div>
 *   </a>
 *   <a class="name" href="LINK"><span>NAME</span></a>
 *   <p class="description">DESCRIPTION</p>
 * </div>
 */
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log("🔄 Starting Provident Developers Extraction v2...");

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

    // Extract developers using precise developer-card matching
    const extractedDevelopers: ProvidentDeveloper[] = [];

    // Split by developer-card to process each card individually
    const cardPattern = /<div class="developer-card">([\s\S]*?)(?=<div class="developer-card">|<\/div>\s*<\/div>\s*<\/div>\s*<footer)/g;
    
    let cardMatch;
    while ((cardMatch = cardPattern.exec(html)) !== null) {
      const cardHtml = cardMatch[1];
      
      // Extract feature image - first img in img-section
      const featureImgMatch = cardHtml.match(/<div class="img-section">\s*<img[^>]*src="([^"]+)"/);
      const featureImage = featureImgMatch ? featureImgMatch[1] : "";
      
      // Extract logo - img inside logo-section
      const logoMatch = cardHtml.match(/<div class="logo-section">\s*<img[^>]*src="([^"]+)"/);
      const logo = logoMatch ? logoMatch[1] : "";
      
      // Extract name - span inside a.name
      const nameMatch = cardHtml.match(/<a class="name"[^>]*>\s*<span>([^<]+)<\/span>/);
      const name = nameMatch ? nameMatch[1].trim() : "";
      
      // Extract link - href from a.img-section-wrap or a.name
      const linkMatch = cardHtml.match(/<a class="(?:img-section-wrap|name)"[^>]*href="([^"]+)"/);
      const link = linkMatch ? linkMatch[1] : "";
      
      // Extract description - p.description content
      const descMatch = cardHtml.match(/<p class="description">([^]*?)<\/p>/);
      let description = descMatch ? descMatch[1] : "";
      
      // Clean description
      description = description
        .replace(/&amp;nbsp;/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&#x27;/g, "'")
        .replace(/&quot;/g, '"')
        .replace(/<[^>]+>/g, '')
        .trim();
      
      if (name && (featureImage || logo)) {
        const slug = name.toLowerCase()
          .replace(/[&]/g, 'and')
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '');

        extractedDevelopers.push({
          name,
          slug,
          description,
          feature_image_url: featureImage,
          logo_url: logo,
          provident_link: link,
        });
        
        console.log(`✅ Extracted: ${name} | Logo: ${logo ? '✓' : '✗'} | Image: ${featureImage ? '✓' : '✗'} | Desc: ${description.length} chars`);
      }
    }

    console.log(`📊 Total extracted: ${extractedDevelopers.length} developers`);

    if (extractedDevelopers.length === 0) {
      throw new Error("NO DEVELOPERS EXTRACTED - Aborting to prevent data loss");
    }

    // Validate minimum expected count
    if (extractedDevelopers.length < 15) {
      console.warn(`⚠️ Warning: Only ${extractedDevelopers.length} developers found. Expected 15+.`);
    }

    // Clear old pending imports and insert fresh data
    await supabase
      .from("pending_developer_imports")
      .delete()
      .eq("status", "pending");

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

    const { error: insertError } = await supabase
      .from("pending_developer_imports")
      .insert(pendingImports);

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
          version: "v2",
        },
      });

    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully extracted ${extractedDevelopers.length} developers`,
        count: extractedDevelopers.length,
        developers: extractedDevelopers.map(d => ({
          name: d.name,
          logo: d.logo_url ? "✓" : "✗",
          image: d.feature_image_url ? "✓" : "✗",
          description: d.description ? `${d.description.substring(0, 50)}...` : "✗",
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
