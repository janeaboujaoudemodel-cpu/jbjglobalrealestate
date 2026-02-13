import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BASE_URL = "https://www.providentestate.com";

function normalizeTitle(t: string): string {
  return t.toLowerCase().replace(/[^a-z0-9\s]/g, "").trim().split(/\s+/).slice(0, 6).join(" ");
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/\s+/g, " ").trim();
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
    const limit = body.limit || 20;

    // Step 1: Fetch sitemap to discover blog slugs
    console.log("Fetching sitemap...");
    const sitemapResp = await fetch(`${BASE_URL}/sitemap-pages.xml`);
    if (!sitemapResp.ok) throw new Error(`Sitemap fetch failed: ${sitemapResp.status}`);
    const sitemapXml = await sitemapResp.text();

    // Extract blog URLs from sitemap
    const blogUrls: string[] = [];
    const locRegex = /<loc>([^<]+)<\/loc>/g;
    let match;
    while ((match = locRegex.exec(sitemapXml)) !== null) {
      const url = match[1];
      if (url.includes("/blog/") && !url.endsWith("/blog/") && !url.endsWith("/blog")) {
        blogUrls.push(url);
      }
    }

    console.log(`Found ${blogUrls.length} blog URLs in sitemap`);

    // Step 2: Get existing articles to deduplicate
    const { data: existing } = await supabase
      .from("market_news")
      .select("title, source_url")
      .eq("source", "Provident Estate");

    const existingTitles = new Set((existing || []).map((e) => normalizeTitle(e.title)));
    const existingUrls = new Set((existing || []).map((e) => e.source_url).filter(Boolean));

    const results: { slug: string; status: string; title?: string }[] = [];
    let imported = 0;
    let skipped = 0;

    // Filter to only new URLs first
    const newUrls = blogUrls.filter((url) => {
      const slugMatch = url.match(/\/blog\/([^/]+)\/?$/);
      if (!slugMatch) return false;
      return !existingUrls.has(url) && !existingUrls.has(`${BASE_URL}/blog/${slugMatch[1]}/`);
    });

    console.log(`${newUrls.length} new URLs to process (limit: ${limit})`);
    const toProcess = newUrls.slice(0, limit);

    for (const blogUrl of toProcess) {
      const slugMatch = blogUrl.match(/\/blog\/([^/]+)\/?$/);
      if (!slugMatch) continue;
      const slug = slugMatch[1];

      try {
        // Fetch page-data.json
        const pageDataUrl = `${BASE_URL}/page-data/blog/${slug}/page-data.json`;
        const pdResp = await fetch(pageDataUrl);
        if (!pdResp.ok) {
          results.push({ slug, status: `page_data_${pdResp.status}` });
          skipped++;
          continue;
        }

        const pageData = await pdResp.json();
        // Provident uses strapiBlog structure
        const postData =
          pageData?.result?.data?.strapiBlog ||
          pageData?.result?.data?.wpPost ||
          pageData?.result?.data?.post;

        if (!postData) {
          results.push({ slug, status: "no_post_data" });
          skipped++;
          continue;
        }

        const title = postData.title || slug.replace(/-/g, " ");

        // Deduplicate by normalized title
        if (existingTitles.has(normalizeTitle(title))) {
          results.push({ slug, status: "already_exists_title", title });
          skipped++;
          continue;
        }

        // Extract content from modules (Strapi rich text blocks)
        let content = "";
        if (postData.modules && Array.isArray(postData.modules)) {
          content = postData.modules
            .filter((m: any) => m.strapi_component === "components.rich-text-block" && m.text?.data?.text)
            .map((m: any) => stripHtml(m.text.data.text))
            .join("\n\n");
        } else if (postData.content) {
          content = stripHtml(postData.content);
        }

        if (!content && postData.short_description) {
          content = postData.short_description;
        }

        // Extract image - use banner_image or tile_image from Provident S3
        let imageUrl: string | null = null;
        if (postData.banner_image?.url) {
          imageUrl = postData.banner_image.url;
        } else if (postData.tile_image?.url) {
          imageUrl = postData.tile_image.url;
        }
        // Also check ggfx_results for optimized versions
        if (postData.ggfx_results && postData.ggfx_results.length > 0) {
          const transforms = postData.ggfx_results[0]?.transforms;
          if (transforms && transforms.length > 0) {
            // Pick the largest transform
            const largest = transforms.reduce((a: any, b: any) => {
              const aSize = parseInt(a.transform) || 0;
              const bSize = parseInt(b.transform) || 0;
              return aSize > bSize ? a : b;
            });
            if (largest?.url) {
              imageUrl = largest.url;
            }
          }
        }

        // Extract date
        const publishedDate = postData.date
          ? new Date(postData.date).toISOString()
          : postData.createdAt || new Date().toISOString();

        // Extract category from strapi_json_value
        const categoryValues = postData.category?.strapi_json_value || [];
        let newsCategory = "Market Update";
        if (Array.isArray(categoryValues) && categoryValues.length > 0) {
          const cat = categoryValues[0];
          if (typeof cat === "string") {
            const catLower = cat.toLowerCase();
            if (catLower.includes("developer") || catLower.includes("project")) newsCategory = "Developer News";
            else if (catLower.includes("guide") || catLower.includes("tip")) newsCategory = "Regulatory";
            else if (catLower.includes("invest")) newsCategory = "Investment";
          }
        }

        // Insert
        const { error: insertErr } = await supabase.from("market_news").insert({
          title,
          content: content.substring(0, 5000),
          excerpt: content.substring(0, 300),
          image_url: imageUrl,
          source: "Provident Estate",
          source_url: blogUrl,
          category: newsCategory,
          published_date: publishedDate,
          is_featured: false,
        });

        if (insertErr) {
          results.push({ slug, status: `insert_error: ${insertErr.message}`, title });
          continue;
        }

        imported++;
        existingTitles.add(normalizeTitle(title));
        existingUrls.add(blogUrl);
        results.push({ slug, status: "imported", title });
        console.log(`✅ Imported: ${title}`);

        await new Promise((r) => setTimeout(r, 300));
      } catch (err) {
        results.push({
          slug,
          status: `error: ${err instanceof Error ? err.message : String(err)}`,
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        blog_urls_found: blogUrls.length,
        new_urls: newUrls.length,
        processed: toProcess.length,
        imported,
        skipped,
        results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("import-provident-blog error:", err);
    return new Response(
      JSON.stringify({ success: false, error: err instanceof Error ? err.message : String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
