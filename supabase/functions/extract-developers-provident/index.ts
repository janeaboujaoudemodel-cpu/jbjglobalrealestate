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

/**
 * PROVIDENT DEVELOPERS EXTRACTION v4
 * 
 * • Fetches ALL developers from https://providentestate.com/developers/
 * • Uses srcset and upgrades images to max resolution (1600w).
 * • Clears existing pending rows (upsert‑style) before inserting to avoid duplicates.
 * • Preserves source ordering via display_order column.
 */
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log("🔄 Starting Provident Developers Extraction v4...");

    // Fetch the developers page
    const response = await fetch("https://providentestate.com/developers/", {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch Provident developers page: ${response.status}`);
    }

    const html = await response.text();
    console.log(`📄 Fetched HTML: ${html.length} characters`);

    // Helper: upgrade image URL to highest resolution
    const upgradeImageUrl = (url: string | null): string => {
      if (!url) return "";
      // Provident cloudfront pattern: /x/WIDTHxHEIGHT/ or /x/WIDTHx/
      // Replace with large version
      let upgraded = url.replace(/\/x\/\d+x\d*\//g, "/x/1600x1200/");
      // fallback if pattern not matched
      if (!upgraded.includes("/x/1600x")) {
        upgraded = url.replace(/\/x\/\d+x\d*\//g, "/x/1200x800/");
      }
      return upgraded;
    };

    // Extract developers using developer-card class
    const extractedDevelopers: ProvidentDeveloper[] = [];

    // Match each developer-card block
    const cardPattern = /<div class="developer-card">([\s\S]*?)<\/div>\s*<\/div>\s*<\/div>/g;
    let cardMatch;
    let displayOrder = 0;

    while ((cardMatch = cardPattern.exec(html)) !== null) {
      const cardHtml = cardMatch[0];
      displayOrder++;

      // Feature image (first img tag inside img-section)
      // Try srcset for highest res, else fallback to src
      let featureImage = "";
      const featureImgMatch = cardHtml.match(/<div class="img-section">\s*<img[^>]*>/);
      if (featureImgMatch) {
        const imgTag = featureImgMatch[0];
        const srcsetMatch = imgTag.match(/srcset="([^"]+)"/);
        if (srcsetMatch) {
          // srcset format: "url1 480w, url2 960w, url3 1600w"
          const srcsetParts = srcsetMatch[1].split(",").map(s => s.trim());
          // Pick the largest (last) or one with 1600w
          const best = srcsetParts.find(p => p.includes("1600w")) || srcsetParts[srcsetParts.length - 1];
          featureImage = best?.split(" ")[0] || "";
        } else {
          const srcMatch = imgTag.match(/src="([^"]+)"/);
          featureImage = srcMatch ? srcMatch[1] : "";
        }
      }
      featureImage = upgradeImageUrl(featureImage);

      // Logo image (inside logo-section)
      let logo = "";
      const logoMatch = cardHtml.match(/<div class="logo-section">\s*<img[^>]*>/);
      if (logoMatch) {
        const logoTag = logoMatch[0];
        const logoSrcset = logoTag.match(/srcset="([^"]+)"/);
        if (logoSrcset) {
          const parts = logoSrcset[1].split(",").map(s => s.trim());
          const best = parts.find(p => p.includes("1600w")) || parts[parts.length - 1];
          logo = best?.split(" ")[0] || "";
        } else {
          const srcMatch = logoTag.match(/src="([^"]+)"/);
          logo = srcMatch ? srcMatch[1] : "";
        }
      }
      logo = upgradeImageUrl(logo);

      // Name (inside a.name span)
      const nameMatch = cardHtml.match(/<a class="name"[^>]*>\s*<span>([^<]+)<\/span>/);
      const name = nameMatch ? nameMatch[1].trim() : "";

      // Link
      const linkMatch = cardHtml.match(/<a class="(?:img-section-wrap|name)"[^>]*href="([^"]+)"/);
      const link = linkMatch ? linkMatch[1] : "";

      // Description
      const descMatch = cardHtml.match(/<p class="description">([^]*?)<\/p>/);
      let description = descMatch ? descMatch[1] : "";
      description = description
        .replace(/&amp;nbsp;/g, " ")
        .replace(/&nbsp;/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/&#x27;/g, "'")
        .replace(/&quot;/g, '"')
        .replace(/<[^>]+>/g, "")
        .trim();

      if (name && (featureImage || logo)) {
        const slug = name
          .toLowerCase()
          .replace(/[&]/g, "and")
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "");

        extractedDevelopers.push({
          name,
          slug,
          description,
          feature_image_url: featureImage,
          logo_url: logo,
          provident_link: link.startsWith("http") ? link : `https://providentestate.com${link}`,
          display_order: displayOrder,
        });

        console.log(`✅ [${displayOrder}] ${name} | Logo: ${logo ? "✓" : "✗"} | Image: ${featureImage ? "✓" : "✗"}`);
      }
    }

    console.log(`📊 Total extracted: ${extractedDevelopers.length} developers`);

    if (extractedDevelopers.length === 0) {
      throw new Error("NO DEVELOPERS EXTRACTED - aborting to prevent data loss");
    }

    // Clear ALL existing rows before insert (fresh full sync, avoid duplicate slug errors)
    const { error: delErr } = await supabase
      .from("pending_developer_imports")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000"); // delete all rows

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
        url: "https://providentestate.com/developers/",
        version: "v4",
      },
    });

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
