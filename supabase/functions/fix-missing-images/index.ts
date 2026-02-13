import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Extract OG image from HTML using regex
function extractOgImage(html: string): string | null {
  // Try og:image
  const patterns = [
    /property="og:image"\s+content="([^"]+)"/i,
    /content="([^"]+)"\s+property="og:image"/i,
    /name="twitter:image"\s+content="([^"]+)"/i,
    /content="([^"]+)"\s+name="twitter:image"/i,
    /property="og:image:secure_url"\s+content="([^"]+)"/i,
  ];
  for (const p of patterns) {
    const m = html.match(p);
    if (m?.[1] && m[1].startsWith("http")) return m[1];
  }
  return null;
}

// Bad image patterns
const BAD_PATTERNS = [
  /logo/i, /favicon/i, /sprite/i, /placeholder/i, /default[-_]?image/i,
  /no[-_]?image/i, /blank\.png/i, /pixel\.gif/i, /spacer/i, /transparent/i,
  /90x90/i, /width=200/i, /width=90/i, /newsbanner/i, /adgmo/i,
];

function isGoodImage(url: string): boolean {
  if (!url?.startsWith("http")) return false;
  if (url.length < 40) return false;
  return !BAD_PATTERNS.some(p => p.test(url));
}

// Bayut slug mapping for areas
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
  "Dubailand Residence Complex": "dubailand-residence-complex",
  "Al Jaddaf Waterfront": "al-jaddaf",
  "Dubai Design District": "dubai-design-district-d3",
  "Cherrywoods": "cherrywoods",
  "The Villa": "the-villa",
  "Maryam Island": "maryam-island",
  "Al Jazeera Al Hamra": "al-jazeera-al-hamra",
  "City Of Arabia": "dubailand",
  "Zabeel 1&2": "zabeel",
  "Sharjah": "sharjah",
  "Muwaileh Commercial": "muwailih-commercial",
  "Al Zorah City": "al-zorah",
  "Nad Al Sheba Gardens": "nad-al-sheba",
  "Al Mamzar-1": "al-mamzar",
  "Wadi Al Safa 2": "wadi-al-safa",
  "Ramhan Island": "ramhan-island",
  "Rak Central": "ras-al-khaimah-city",
};

function extractBayutCoverImage(html: string): string | null {
  const ogMatch = html.match(/property="og:image"\s+content="(https?:\/\/[^"]+)"/i)
    || html.match(/content="(https?:\/\/[^"]+)"\s+property="og:image"/i);
  if (ogMatch?.[1]) return ogMatch[1];

  const imgMatches = html.match(/https:\/\/d3ob0s3rxbjyep\.cloudfront\.net\/content\/[^"'\s)]+\.(jpg|jpeg|png|webp)/gi);
  if (imgMatches) {
    for (const url of imgMatches) {
      if (url.includes("/assets/") || /logo|icon/i.test(url)) continue;
      return url;
    }
  }
  return null;
}

const HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);
    const body = await req.json().catch(() => ({}));
    const target = body.target || "both"; // "areas", "news", or "both"
    const batchSize = body.batch_size || 5;

    const results: { name: string; type: string; image: string | null; status: string }[] = [];

    // ===== FIX AREAS =====
    if (target === "areas" || target === "both") {
      const { data: areas } = await supabase
        .from("areas")
        .select("id, name, slug, image_url")
        .eq("is_active", true)
        .is("image_url", null)
        .order("property_count", { ascending: false })
        .limit(batchSize);

      for (const area of (areas || [])) {
        let imageUrl: string | null = null;

        // Try Bayut
        const bayutSlug = BAYUT_SLUGS[area.name];
        const slugToTry = bayutSlug || area.name.toLowerCase().replace(/[()]/g, "").replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "").replace(/-+/g, "-");
        
        try {
          const resp = await fetch(`https://www.bayut.com/area-guides/${slugToTry}/`, { headers: HEADERS });
          if (resp.ok) {
            const html = await resp.text();
            const img = extractBayutCoverImage(html);
            if (img && isGoodImage(img)) imageUrl = img;
          }
        } catch (_) { /* skip */ }
        await new Promise(r => setTimeout(r, 300));

        if (imageUrl) {
          await supabase.from("areas").update({ image_url: imageUrl, hero_image_url: imageUrl, updated_at: new Date().toISOString() }).eq("id", area.id);
          results.push({ name: area.name, type: "area", image: imageUrl, status: "updated" });
        } else {
          results.push({ name: area.name, type: "area", image: null, status: "no_image_found" });
        }
      }
    }

    // ===== FIX NEWS =====
    if (target === "news" || target === "both") {
      const { data: articles } = await supabase
        .from("market_news")
        .select("id, title, source_url, image_url")
        .is("image_url", null)
        .order("published_date", { ascending: false })
        .limit(batchSize);

      for (const article of (articles || [])) {
        let imageUrl: string | null = null;

        if (article.source_url) {
          try {
            const resp = await fetch(article.source_url, { headers: HEADERS, redirect: "follow" });
            if (resp.ok) {
              const html = await resp.text();
              const ogImg = extractOgImage(html);
              if (ogImg && isGoodImage(ogImg)) imageUrl = ogImg;
            }
          } catch (_) { /* skip */ }
          await new Promise(r => setTimeout(r, 300));
        }

        if (imageUrl) {
          await supabase.from("market_news").update({ image_url: imageUrl }).eq("id", article.id);
          results.push({ name: article.title, type: "news", image: imageUrl, status: "updated" });
        } else {
          results.push({ name: article.title, type: "news", image: null, status: "no_image_found" });
        }
      }
    }

    // Count remaining
    const { count: areasRemaining } = await supabase.from("areas").select("id", { count: "exact", head: true }).eq("is_active", true).is("image_url", null);
    const { count: newsRemaining } = await supabase.from("market_news").select("id", { count: "exact", head: true }).is("image_url", null);

    return new Response(JSON.stringify({
      success: true,
      processed: results.length,
      updated: results.filter(r => r.status === "updated").length,
      areas_remaining: areasRemaining || 0,
      news_remaining: newsRemaining || 0,
      results,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err instanceof Error ? err.message : String(err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
