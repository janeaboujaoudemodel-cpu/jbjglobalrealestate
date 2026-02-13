import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/*,*/*;q=0.8",
};

function extractOgImage(html: string): string | null {
  const patterns = [
    /property="og:image"\s+content="([^"]+)"/i,
    /content="([^"]+)"\s+property="og:image"/i,
    /name="twitter:image"\s+content="([^"]+)"/i,
    /content="([^"]+)"\s+name="twitter:image"/i,
  ];
  for (const p of patterns) {
    const m = html.match(p);
    if (m?.[1] && m[1].startsWith("http")) return m[1];
  }
  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Fetch all news articles with image URLs
    const { data: articles, error } = await supabase
      .from("market_news")
      .select("id, title, image_url, source_url")
      .not("image_url", "is", null)
      .order("published_date", { ascending: false });

    if (error) throw error;

    const results: { title: string; status: string; old_url?: string; new_url?: string | null }[] = [];
    let fixed = 0;
    let broken = 0;

    for (const article of (articles || [])) {
      try {
        // HEAD check on existing image URL
        const headResp = await fetch(article.image_url!, {
          method: "HEAD",
          headers: HEADERS,
          redirect: "follow",
        });

        if (headResp.ok) {
          results.push({ title: article.title, status: "ok" });
          continue;
        }

        console.log(`Broken image (${headResp.status}): ${article.title}`);
        broken++;

        // Try to re-fetch OG image from source URL
        let newImageUrl: string | null = null;
        if (article.source_url) {
          try {
            const pageResp = await fetch(article.source_url, {
              headers: HEADERS,
              redirect: "follow",
            });
            if (pageResp.ok) {
              const html = await pageResp.text();
              const ogImg = extractOgImage(html);
              if (ogImg && ogImg !== article.image_url) {
                // Verify the new OG image works
                const verifyResp = await fetch(ogImg, { method: "HEAD", headers: HEADERS });
                if (verifyResp.ok) {
                  newImageUrl = ogImg;
                }
              }
            }
          } catch (_) { /* skip */ }
        }

        // Update the article
        await supabase
          .from("market_news")
          .update({ image_url: newImageUrl })
          .eq("id", article.id);

        if (newImageUrl) {
          fixed++;
          results.push({ title: article.title, status: "fixed", old_url: article.image_url!, new_url: newImageUrl });
        } else {
          results.push({ title: article.title, status: "set_null", old_url: article.image_url! });
        }

        await new Promise(r => setTimeout(r, 500));
      } catch (err) {
        results.push({ title: article.title, status: `error: ${err instanceof Error ? err.message : String(err)}` });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        total: articles?.length || 0,
        broken,
        fixed,
        set_null: results.filter(r => r.status === "set_null").length,
        ok: results.filter(r => r.status === "ok").length,
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
