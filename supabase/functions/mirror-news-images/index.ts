import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BROWSER_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
  "Referer": "https://www.google.com/",
};

function getExtFromContentType(ct: string): string {
  if (ct.includes("jpeg") || ct.includes("jpg")) return "jpg";
  if (ct.includes("png")) return "png";
  if (ct.includes("webp")) return "webp";
  if (ct.includes("gif")) return "gif";
  if (ct.includes("svg")) return "svg";
  return "jpg";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const body = await req.json().catch(() => ({}));
    const limit = body.limit || 15;

    const storageHost = `${supabaseUrl}/storage/v1/object/public/news-images`;

    // Get news articles with external image URLs (not already mirrored)
    const { data: articles, error } = await supabase
      .from("market_news")
      .select("id, title, image_url")
      .not("image_url", "is", null)
      .order("published_date", { ascending: false });

    if (error) throw error;

    const toProcess = (articles || [])
      .filter((a) => a.image_url && !a.image_url.startsWith(storageHost))
      .slice(0, limit);

    if (toProcess.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "All news images already mirrored", processed: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const results: { title: string; status: string; new_url?: string }[] = [];
    let mirrored = 0;
    let failed = 0;

    for (const article of toProcess) {
      try {
        const imgResp = await fetch(article.image_url!, {
          headers: BROWSER_HEADERS,
          redirect: "follow",
        });

        if (!imgResp.ok) {
          await supabase.from("market_news").update({ image_url: null }).eq("id", article.id);
          results.push({ title: article.title, status: `download_failed_${imgResp.status}` });
          failed++;
          continue;
        }

        const contentType = imgResp.headers.get("content-type") || "image/jpeg";
        const ext = getExtFromContentType(contentType);
        const imageData = new Uint8Array(await imgResp.arrayBuffer());

        if (imageData.length < 1000) {
          await supabase.from("market_news").update({ image_url: null }).eq("id", article.id);
          results.push({ title: article.title, status: "too_small" });
          failed++;
          continue;
        }

        const filePath = `${article.id}.${ext}`;
        const { error: uploadErr } = await supabase.storage
          .from("news-images")
          .upload(filePath, imageData, { contentType, upsert: true });

        if (uploadErr) {
          results.push({ title: article.title, status: `upload_error: ${uploadErr.message}` });
          failed++;
          continue;
        }

        const { data: urlData } = supabase.storage.from("news-images").getPublicUrl(filePath);

        await supabase.from("market_news").update({ image_url: urlData.publicUrl }).eq("id", article.id);

        mirrored++;
        results.push({ title: article.title, status: "mirrored", new_url: urlData.publicUrl });
        console.log(`✅ Mirrored: ${article.title}`);

        await new Promise((r) => setTimeout(r, 200));
      } catch (err) {
        results.push({
          title: article.title,
          status: `error: ${err instanceof Error ? err.message : String(err)}`,
        });
        failed++;
      }
    }

    const totalRemaining = (articles || []).filter(
      (a) => a.image_url && !a.image_url.startsWith(storageHost)
    ).length - mirrored;

    return new Response(
      JSON.stringify({ success: true, processed: toProcess.length, mirrored, failed, remaining: totalRemaining, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("mirror-news-images error:", err);
    return new Response(
      JSON.stringify({ success: false, error: err instanceof Error ? err.message : String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
