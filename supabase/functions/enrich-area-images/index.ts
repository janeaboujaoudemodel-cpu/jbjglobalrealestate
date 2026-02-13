import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Bayut area guide slug mapping — maps DB area names to Bayut URL slugs
const BAYUT_SLUGS: Record<string, string> = {
  "Damac Hills": "damac-hills-akoya-damac",
  "Town Square": "town-square",
  "Dubai Islands": "dubai-islands",
  "Al Marjan Island": "al-marjan-island",
  "JVT (Jumeirah Village Triangle)": "jumeirah-village-triangle",
  "Arjan": "arjan",
  "Damac Lagoons": "damac-lagoons",
  "Dubai Studio City": "dubai-studio-city",
  "Dubai Silicon Oasis": "dubai-silicon-oasis",
  "The Valley": "the-valley",
  "Mina Rashid": "mina-rashid",
  "Dubai Expo City": "expo-city-dubai",
  "MJL (Madinat Jumeirah Living)": "madinat-jumeirah-living",
  "Jumeirah Islands": "jumeirah-islands",
  "City Walk": "city-walk",
  "Mudon": "mudon",
  "Dubai Motor City": "motor-city",
  "Dubai Harbour": "dubai-harbour",
  "Dubai Science Park": "dubai-science-park",
  "Dubai Production City": "dubai-production-city",
  "Dubai International City": "international-city",
  "Masdar City": "masdar-city",
  "Al Barsha": "al-barsha",
  "Al Sufouh": "al-sufouh",
  "Yas Island": "yas-island",
  "Al Reem Island, Abu Dhabi": "al-reem-island",
  "Al Saadiyat island": "saadiyat-island",
  "Al Maryah Island": "al-maryah-island",
  "Dubai Investments Park": "dubai-investments-park",
  "Dubai Industrial City": "dubai-industrial-city",
  "Meydan (Nad Al Sheba  1)": "meydan",
  "Dubailand Residence Complex": "dubailand-residence-complex",
  "Majan": "al-furjan",
  "Maritime City": "maritime-city",
  "Al Jaddaf Waterfront": "al-jaddaf",
  "Safa Park": "al-safa",
  "Jebel Ali Village": "jebel-ali",
  "Dubai Design District": "dubai-design-district-d3",
  "Cherrywoods": "cherrywoods",
  "The Villa": "the-villa",
  "Al Satwa": "al-satwa",
  "Zayed City": "zayed-city",
  "Maryam Island": "maryam-island",
  "Siniya Island": "siniya-island",
  "Al Jazeera Al Hamra": "al-jazeera-al-hamra",
  "World of Islands": "the-world-islands",
  "Grand Polo Club and Resort": "dubai-polo-and-equestrian-club",
  "City Of Arabia": "dubailand",
  "Zabeel 1&2": "zabeel",
  "The Oasis": "the-oasis",
  "Sharjah": "sharjah",
  "Muwaileh Commercial": "muwailih-commercial",
  "Al Zorah City": "al-zorah",
  "Ras Al Khor": "ras-al-khor-industrial",
  "Nad Al Sheba Gardens": "nad-al-sheba",
  "Al Mamzar-1": "al-mamzar",
  "Jumeirah Second": "jumeirah",
  "Wadi Al Safa 2": "wadi-al-safa",
  "Ramhan Island": "ramhan-island",
  "Rak Central": "ras-al-khaimah-city",
};

// Extract cover image from Bayut area guide HTML
function extractBayutCoverImage(html: string): string | null {
  // Pattern 1: Look for og:image meta tag (most reliable)
  const ogMatch = html.match(/property="og:image"\s+content="(https?:\/\/[^"]+)"/i)
    || html.match(/content="(https?:\/\/d3ob0s3rxbjyep\.cloudfront\.net\/content\/[^"]+)"\s+property="og:image"/i);
  if (ogMatch && ogMatch[1]) return ogMatch[1];

  // Pattern 2: Look for the cover image in img tags from Bayut CDN
  const imgMatches = html.match(/https:\/\/d3ob0s3rxbjyep\.cloudfront\.net\/content\/[^"'\s)]+\.(jpg|jpeg|png|webp)/gi);
  if (imgMatches) {
    // Filter out logos, icons, assets
    for (const url of imgMatches) {
      if (url.includes("/assets/")) continue;
      if (url.includes("Logo") || url.includes("logo")) continue;
      if (url.includes("icon") || url.includes("Icon")) continue;
      return url;
    }
  }

  return null;
}

function isGoodAreaImage(url: string): boolean {
  if (!url || !url.startsWith("http")) return false;
  const bad = /logo|favicon|icon|navbar|sprite|avatar|16x16|32x32|48x48|64x64|placeholder|default|blank|spacer|transparent|pixel\.gif/i;
  if (bad.test(url)) return false;
  if (url.length < 60) return false;
  if (url.includes("unsplash.com") || url.includes("pexels.com")) return false;
  if (url.includes("reelly-backend.s3.amazonaws.com")) return false;
  if (url.includes("api.reelly.io")) return false;
  if (url.includes("pinterest.com")) return false;
  if (url.includes("keyspacerealty.com")) return false;
  return true;
}

/**
 * Enrich area images — REAL PHOTOS ONLY:
 * 0. Direct Bayut area guide fetch (free, no API key needed)
 * 1. Firecrawl Search fallback (for areas not on Bayut)
 * 2. Accept NULL (UI shows gradient fallback)
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

    // Get areas missing images
    const { data: areas, error: fetchErr } = await supabase
      .from("areas")
      .select("id, name, slug, image_url")
      .eq("is_active", true)
      .or("image_url.is.null,image_url.ilike.%unsplash%,image_url.ilike.%pexels%,image_url.ilike.%reelly-backend.s3%,image_url.ilike.%api.reelly.io%,image_url.ilike.%pinterest.com%,image_url.ilike.%/community/%")
      .limit(batchSize);

    if (fetchErr) throw fetchErr;
    if (!areas || areas.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "All areas have real images", processed: 0, remaining: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { count: remaining } = await supabase
      .from("areas")
      .select("id", { count: "exact", head: true })
      .eq("is_active", true)
      .or("image_url.is.null,image_url.ilike.%unsplash%,image_url.ilike.%pexels%,image_url.ilike.%reelly-backend.s3%,image_url.ilike.%api.reelly.io%,image_url.ilike.%pinterest.com%,image_url.ilike.%/community/%");

    const results: { area: string; image_url: string | null; status: string; source: string }[] = [];

    for (const area of areas) {
      let imageUrl: string | null = null;
      let source = "none";

      // Step 0: Direct Bayut area guide fetch (FREE, no API credits)
      const bayutSlug = BAYUT_SLUGS[area.name];
      if (bayutSlug) {
        try {
          const bayutUrl = `https://www.bayut.com/area-guides/${bayutSlug}/`;
          console.log(`${area.name}: fetching Bayut page ${bayutUrl}`);
          const resp = await fetch(bayutUrl, {
            headers: {
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
              "Accept": "text/html,application/xhtml+xml",
            },
          });
          if (resp.ok) {
            const html = await resp.text();
            const coverImg = extractBayutCoverImage(html);
            if (coverImg && isGoodAreaImage(coverImg)) {
              imageUrl = coverImg;
              source = "bayut_direct";
              console.log(`${area.name}: Bayut cover image found: ${coverImg.substring(0, 80)}`);
            } else {
              console.log(`${area.name}: Bayut page loaded but no cover image found`);
            }
          } else {
            console.log(`${area.name}: Bayut page returned ${resp.status}`);
          }
        } catch (err) {
          console.warn(`${area.name}: Bayut fetch error:`, err);
        }
        // Small delay to be respectful
        await new Promise(r => setTimeout(r, 500));
      }

      // Step 0b: Try auto-generated Bayut slug if no mapping exists
      if (!imageUrl && !bayutSlug) {
        const autoSlug = area.name
          .toLowerCase()
          .replace(/[()]/g, "")
          .replace(/\s+/g, "-")
          .replace(/[^a-z0-9-]/g, "")
          .replace(/-+/g, "-");
        try {
          const bayutUrl = `https://www.bayut.com/area-guides/${autoSlug}/`;
          console.log(`${area.name}: trying auto-slug ${autoSlug}`);
          const resp = await fetch(bayutUrl, {
            headers: {
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
              "Accept": "text/html",
            },
            redirect: "follow",
          });
          if (resp.ok && !resp.url.includes("/area-guides/?")) {
            const html = await resp.text();
            const coverImg = extractBayutCoverImage(html);
            if (coverImg && isGoodAreaImage(coverImg)) {
              imageUrl = coverImg;
              source = "bayut_auto";
              console.log(`${area.name}: auto-slug Bayut image found: ${coverImg.substring(0, 80)}`);
            }
          }
        } catch (err) {
          // Silently skip
        }
        await new Promise(r => setTimeout(r, 300));
      }

      // Step 1: Firecrawl Search fallback (only for areas not found on Bayut)
      if (!imageUrl && firecrawlApiKey) {
        // Try multiple search queries
        const queries = [
          `"${area.name}" Dubai community overview site:bayut.com`,
          `"${area.name}" Dubai aerial panoramic community photo`,
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
                // Check metadata OG images
                const ogImg = r.metadata?.ogImage || r.metadata?.image || r.metadata?.og_image || r.metadata?.["og:image"];
                if (ogImg && isGoodAreaImage(ogImg)) {
                  imageUrl = ogImg;
                  source = "firecrawl_og";
                  console.log(`${area.name}: Found OG image: ${ogImg.substring(0, 80)}`);
                  break;
                }
                // Check markdown for inline images
                const md = r.markdown || "";
                const imgs = md.match(/https?:\/\/[^\s)"']+\.(jpg|jpeg|png|webp)/gi) || [];
                for (const img of imgs) {
                  // Only accept clean URLs from known property/image CDNs
                  if (isGoodAreaImage(img) && !img.includes("/assets/") && img.length > 60 && img.length < 300
                    && (img.includes("cloudfront.net") || img.includes("bayut.com") || img.includes("propertyfinder") || img.includes("googleapis.com"))) {
                    imageUrl = img;
                    source = "firecrawl_inline";
                    console.log(`${area.name}: Found inline image: ${img.substring(0, 80)}`);
                    break;
                  }
                }
                if (imageUrl) break;
              }
            }
            await new Promise(r => setTimeout(r, 1500));
          } catch (err) {
            console.warn(`${area.name}: Firecrawl search error:`, err);
          }
        }
      }

      // Update DB: set real image or NULL (gradient fallback)
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
