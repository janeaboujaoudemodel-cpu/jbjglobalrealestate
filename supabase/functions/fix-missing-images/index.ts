import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Domains that are BLOCKED — competitor branding
const BLOCKED_DOMAINS = [
  "bayut.com",
  "d3ob0s3rxbjyep.cloudfront.net",
  "static.bayut.com",
  "mybayutcdn.bayut.com",
];

function isBlockedUrl(url: string): boolean {
  return BLOCKED_DOMAINS.some(d => url.includes(d));
}

// Extract OG image from HTML using regex
function extractOgImage(html: string): string | null {
  const patterns = [
    /property="og:image"\s+content="([^"]+)"/i,
    /content="([^"]+)"\s+property="og:image"/i,
    /name="twitter:image"\s+content="([^"]+)"/i,
    /content="([^"]+)"\s+name="twitter:image"/i,
    /property="og:image:secure_url"\s+content="([^"]+)"/i,
  ];
  for (const p of patterns) {
    const m = html.match(p);
    if (m?.[1] && m[1].startsWith("http") && !isBlockedUrl(m[1])) return m[1];
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
  if (isBlockedUrl(url)) return false;
  return !BAD_PATTERNS.some(p => p.test(url));
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
    const target = body.target || "both";
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

        // Try to find project images for this area
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
                if (img.image_url && isGoodImage(img.image_url)) {
                  imageUrl = img.image_url;
                  break;
                }
              }
              if (imageUrl) break;
            }
          }
        } catch (_) { /* skip */ }

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
