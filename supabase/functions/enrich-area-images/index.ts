import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Domains that are BLOCKED — competitor branding, stock photos, low-quality sources
const BLOCKED_DOMAINS = [
  "bayut.com",
  "d3ob0s3rxbjyep.cloudfront.net",
  "static.bayut.com",
  "mybayutcdn.bayut.com",
  "unsplash.com",
  "pexels.com",
  "pinterest.com",
  "reelly-backend.s3.amazonaws.com",
  "api.reelly.io",
  "keyspacerealty.com",
  "providentestate.com",
  "d3h330vgpwpjr8.cloudfront.net",
  "shutterstock.com",
  "alamy.com",
  "gjproperties.ae",
  "documents1.worldbank.org",
  "propertyfinder.ae",
  "dreamstime.com",
  "ftcdn.net",
  "istockphoto.com",
  "goyzer.com",
  "propjunction.ae",
  "tanamiproperties.com",
  "1newhomes.ae",
  "homevy.com",
  "cdn.prod.website-files.com",
];

function isBlockedUrl(url: string): boolean {
  return BLOCKED_DOMAINS.some(d => url.includes(d));
}

function isGoodAreaImage(url: string): boolean {
  if (!url || !url.startsWith("http")) return false;
  if (url.length < 60) return false;
  if (isBlockedUrl(url)) return false;
  const bad = /logo|favicon|icon|navbar|sprite|avatar|16x16|32x32|48x48|64x64|placeholder|default|blank|spacer|transparent|pixel\.gif|thumbnail|90x90|width=200|width=90|floor.?plan|interior|apartment|bedroom|bathroom|kitchen|living.?room|provident/i;
  if (bad.test(url)) return false;
  return true;
}

/**
 * Enrich area images — REAL COMMUNITY PHOTOS ONLY
 * 
 * Priority:
 * 1. Project images from project_images table (Reelly API sourced)
 * 2. Firecrawl search for real community/aerial photos (excluding blocked domains)
 * 3. NULL (UI gradient fallback)
 * 
 * NEVER uses Bayut or any competitor source.
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const firecrawlApiKey = Deno.env.get("FIRECRAWL_API_KEY");
    const supabase = createClient(supabaseUrl, serviceKey);

    const body = await req.json().catch(() => ({}));
    const batchSize = body.batch_size || 20;

    // Get areas missing images (NULL or previously blocked sources)
    const { data: areas, error: fetchErr } = await supabase
      .from("areas")
      .select("id, name, slug, image_url")
      .eq("is_active", true)
      .is("image_url", null)
      .order("property_count", { ascending: false })
      .limit(batchSize);

    if (fetchErr) throw fetchErr;
    if (!areas || areas.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "All areas have images", processed: 0, remaining: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { count: remaining } = await supabase
      .from("areas")
      .select("id", { count: "exact", head: true })
      .eq("is_active", true)
      .is("image_url", null);

    const results: { area: string; image_url: string | null; status: string; source: string }[] = [];

    for (const area of areas) {
      let imageUrl: string | null = null;
      let source = "none";

      // Step 1: Check project_images for this area (best source — Reelly API photos)
      try {
        const { data: projectWithImages } = await supabase
          .from("projects")
          .select("id, project_images(image_url, display_order)")
          .eq("area_name", area.name)
          .eq("is_published", true)
          .limit(3);

        if (projectWithImages) {
          for (const proj of projectWithImages) {
            const imgs = (proj as any).project_images || [];
            const sorted = [...imgs].sort((a: any, b: any) => (a.display_order ?? 999) - (b.display_order ?? 999));
            for (const img of sorted) {
              if (img.image_url && isGoodAreaImage(img.image_url)) {
                imageUrl = img.image_url;
                source = "project_images";
                break;
              }
            }
            if (imageUrl) break;
          }
        }
      } catch (err) {
        console.warn(`${area.name}: project image lookup error:`, err);
      }

      // Step 2: Firecrawl search for real community/aerial photos
      if (!imageUrl && firecrawlApiKey) {
        const queries = [
          `"${area.name}" Dubai community aerial panoramic photo -site:bayut.com`,
          `"${area.name}" Dubai masterplan overview -site:bayut.com -site:propertyfinder.ae`,
        ];
        for (const searchQuery of queries) {
          if (imageUrl) break;
          try {
            console.log(`${area.name}: Firecrawl search: ${searchQuery.substring(0, 60)}`);
            const searchResp = await fetch("https://api.firecrawl.dev/v1/search", {
              method: "POST",
              headers: {
                "Authorization": `Bearer ${firecrawlApiKey}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                query: searchQuery,
                limit: 5,
                scrapeOptions: { formats: ["markdown"] },
              }),
            });

            if (searchResp.ok) {
              const searchData = await searchResp.json();
              for (const r of (searchData.data || [])) {
                // Skip results from blocked domains
                if (r.url && isBlockedUrl(r.url)) continue;

                // Check OG images
                const ogImg = r.metadata?.ogImage || r.metadata?.image || r.metadata?.["og:image"];
                if (ogImg && isGoodAreaImage(ogImg)) {
                  imageUrl = ogImg;
                  source = "firecrawl_og";
                  break;
                }
                // Check inline images in markdown
                const md = r.markdown || "";
                const imgs = md.match(/https?:\/\/[^\s)"']+\.(jpg|jpeg|png|webp)/gi) || [];
                for (const img of imgs) {
                  if (isGoodAreaImage(img) && img.length < 300) {
                    imageUrl = img;
                    source = "firecrawl_inline";
                    break;
                  }
                }
                if (imageUrl) break;
              }
            }
            await new Promise(r => setTimeout(r, 1500));
          } catch (err) {
            console.warn(`${area.name}: Firecrawl error:`, err);
          }
        }
      }

      // Step 3: Set image or leave NULL for gradient fallback
      const finalUrl = imageUrl && isGoodAreaImage(imageUrl) ? imageUrl : null;
      const { error: updateErr } = await supabase
        .from("areas")
        .update({
          image_url: finalUrl,
          hero_image_url: finalUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("id", area.id);

      results.push({
        area: area.name,
        image_url: finalUrl,
        status: updateErr ? `error: ${updateErr.message}` : (finalUrl ? "updated" : "set_null"),
        source: finalUrl ? source : "none",
      });

      console.log(`${area.name}: ${finalUrl ? source : "NULL (gradient fallback)"}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed: results.length,
        updated: results.filter(r => r.status === "updated").length,
        set_null: results.filter(r => r.status === "set_null").length,
        remaining: (remaining || 0) - results.length,
        results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, error: err instanceof Error ? err.message : String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
