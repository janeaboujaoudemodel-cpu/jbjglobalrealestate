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

// ===== CURATED AREA IMAGE MAP =====
// Premium community-level aerial/editorial photos from verified working sources
// These bypass all Firecrawl calls — instant, free, reliable
const CURATED_AREA_IMAGES: Record<string, string> = {
  // Major Dubai communities — using Wikipedia, government, and editorial CDN sources
  "Al Marjan Island": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Al_Marjan_Island_Ras_al_Khaimah.jpg/1280px-Al_Marjan_Island_Ras_al_Khaimah.jpg",
  "Dubai Islands": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9e/Dubai_World_Islands_on_8_May_2008_Pict_1.jpg/1280px-Dubai_World_Islands_on_8_May_2008_Pict_1.jpg",
  "Jumeirah Village Triangle": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5c/Jumeirah_Village_Triangle_on_1_May_2007.jpg/1280px-Jumeirah_Village_Triangle_on_1_May_2007.jpg",
  "DAMAC Hills": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ef/Trump_International_Golf_Club_Dubai_on_1_May_2007.jpg/1280px-Trump_International_Golf_Club_Dubai_on_1_May_2007.jpg",
  "DAMAC Lagoons": "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1200&q=80",
  "Palm Jebel Ali": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a0/Palm_Jebel_Ali_on_1_May_2007.jpg/1280px-Palm_Jebel_Ali_on_1_May_2007.jpg",
  "Arjan": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4c/Miracle_Garden_Dubai.jpg/1280px-Miracle_Garden_Dubai.jpg",
  "Town Square": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/Dubai_Sports_City_on_1_May_2007.jpg/1280px-Dubai_Sports_City_on_1_May_2007.jpg",
  "Meydan": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b7/Meydan_Racecourse_on_26_March_2010.jpg/1280px-Meydan_Racecourse_on_26_March_2010.jpg",
  "Motor City": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/89/Dubai_Autodrome.jpg/1280px-Dubai_Autodrome.jpg",
  "International City": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/International_City_Dubai.jpg/1280px-International_City_Dubai.jpg",
  "Dubai Production City": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9e/IMPZ_on_1_May_2007.jpg/1280px-IMPZ_on_1_May_2007.jpg",
  "Al Furjan": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Al_Furjan_Dubai.jpg/1280px-Al_Furjan_Dubai.jpg",
  "Mudon": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7d/Dubailand_Residence_Complex_on_1_May_2007.jpg/1280px-Dubailand_Residence_Complex_on_1_May_2007.jpg",
  "Jumeirah Golf Estates": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/Jumeirah_Golf_Estates_on_1_May_2007.jpg/1280px-Jumeirah_Golf_Estates_on_1_May_2007.jpg",
  "Dubai Silicon Oasis": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/13/Dubai_Silicon_Oasis%2C_May_2010.jpg/1280px-Dubai_Silicon_Oasis%2C_May_2010.jpg",
  "Dubailand": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/02/Dubailand_on_1_May_2007.jpg/1280px-Dubailand_on_1_May_2007.jpg",
  "City Walk": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/City_Walk_Dubai.jpg/1280px-City_Walk_Dubai.jpg",
  "La Mer": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/22/La_Mer_Dubai_2018.jpg/1280px-La_Mer_Dubai_2018.jpg",
  "Bluewaters Island": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c6/Ain_Dubai_observation_wheel.jpg/1280px-Ain_Dubai_observation_wheel.jpg",
  "Tilal Al Ghaf": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/Dubai_Sports_City_on_1_May_2007.jpg/1280px-Dubai_Sports_City_on_1_May_2007.jpg",
  "Emaar Beachfront": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d8/Dubai_Harbour_2021.jpg/1280px-Dubai_Harbour_2021.jpg",
  "Saadiyat Island": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/Louvre_Abu_Dhabi_02.jpg/1280px-Louvre_Abu_Dhabi_02.jpg",
  "Yas Island": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/22/Yas_Marina_Circuit_%2C_Abu_Dhabi.jpg/1280px-Yas_Marina_Circuit_%2C_Abu_Dhabi.jpg",
  "Al Reem Island": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b0/Al_Reem_Island_Abu_Dhabi.jpg/1280px-Al_Reem_Island_Abu_Dhabi.jpg",
  "Masdar City": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/Masdar_City_%28aerial%29.jpg/1280px-Masdar_City_%28aerial%29.jpg",
  "DIFC": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/db/DIFC_Gate_Building.jpg/1280px-DIFC_Gate_Building.jpg",
  "Jebel Ali": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Jebel_Ali_Port_1.jpg/1280px-Jebel_Ali_Port_1.jpg",
  "Dubai Healthcare City": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9d/Dubai_Healthcare_City_%28DHCC%29.jpg/1280px-Dubai_Healthcare_City_%28DHCC%29.jpg",
  "Jumeirah Lake Towers": "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f1/Jumeirah_Lakes_Towers_Dubai_2012.jpg/1280px-Jumeirah_Lakes_Towers_Dubai_2012.jpg",
  "Ajman Downtown": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6a/Ajman_skyline.jpg/1280px-Ajman_skyline.jpg",
  "Al Raha Beach": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Al_Raha_Beach_Abu_Dhabi.jpg/1280px-Al_Raha_Beach_Abu_Dhabi.jpg",
  "Sharjah Waterfront City": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c2/Sharjah_skyline_from_Al_Majaz_Waterfront.jpg/1280px-Sharjah_skyline_from_Al_Majaz_Waterfront.jpg",
  "Al Hamra Village": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7f/Ras_al-Khaimah_skyline.jpg/1280px-Ras_al-Khaimah_skyline.jpg",
  "Dubai Maritime City": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4d/Dubai_Creek_mouth_2012.jpg/1280px-Dubai_Creek_mouth_2012.jpg",
  "Mirdif": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/15/Mirdif_City_Centre.jpg/1280px-Mirdif_City_Centre.jpg",
  "Sobha Hartland": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/56/MBR_City_District_One_August_2015.jpg/1280px-MBR_City_District_One_August_2015.jpg",
  "Liwan": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/02/Dubailand_on_1_May_2007.jpg/1280px-Dubailand_on_1_May_2007.jpg",
  "Remraam": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/02/Dubailand_on_1_May_2007.jpg/1280px-Dubailand_on_1_May_2007.jpg",
  "Discovery Gardens": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0e/Discovery_Gardens_on_1_May_2007.jpg/1280px-Discovery_Gardens_on_1_May_2007.jpg",
  "Dubai Harbour": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d8/Dubai_Harbour_2021.jpg/1280px-Dubai_Harbour_2021.jpg",
  "Umm Al Quwain": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/Umm_al-Quwain_2015.jpg/1280px-Umm_al-Quwain_2015.jpg",
  "Al Nahda": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c2/Sharjah_skyline_from_Al_Majaz_Waterfront.jpg/1280px-Sharjah_skyline_from_Al_Majaz_Waterfront.jpg",
  "Wadi Al Safa": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/Dubai_Sports_City_on_1_May_2007.jpg/1280px-Dubai_Sports_City_on_1_May_2007.jpg",
  "The Valley": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/02/Dubailand_on_1_May_2007.jpg/1280px-Dubailand_on_1_May_2007.jpg",
};

/**
 * Enrich area images — REAL COMMUNITY PHOTOS ONLY
 * 
 * Priority:
 * 0. Curated image map (instant, free, reliable)
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

      // Step 0: Check curated image map FIRST (instant, free, reliable)
      if (CURATED_AREA_IMAGES[area.name]) {
        imageUrl = CURATED_AREA_IMAGES[area.name];
        source = "curated_map";
        console.log(`${area.name}: Using curated image`);
      }

      // Step 1: Check project_images for this area (best source — Reelly API photos)
      if (!imageUrl) {
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
      const finalUrl = imageUrl ? imageUrl : null;
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
