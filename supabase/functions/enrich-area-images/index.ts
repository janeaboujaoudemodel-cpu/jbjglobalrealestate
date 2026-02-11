import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const firecrawlKey = Deno.env.get("FIRECRAWL_API_KEY");
    const lovableKey = Deno.env.get("LOVABLE_API_KEY");
    const supabase = createClient(supabaseUrl, serviceKey);

    const body = await req.json().catch(() => ({}));
    const batchSize = body.batch_size || 10;
    const offset = body.offset || 0;

    // Get areas missing images
    const { data: areas, error: fetchErr } = await supabase
      .from("areas")
      .select("id, name, slug, emirate, provident_url, image_url, hero_image_url")
      .is("image_url", null)
      .is("hero_image_url", null)
      .eq("is_active", true)
      .range(offset, offset + batchSize - 1);

    if (fetchErr) throw fetchErr;
    if (!areas || areas.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "No areas need images", processed: 0, remaining: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Count remaining
    const { count } = await supabase
      .from("areas")
      .select("id", { count: "exact", head: true })
      .is("image_url", null)
      .is("hero_image_url", null)
      .eq("is_active", true);

    const results: { area: string; image_url: string | null; source: string; status: string }[] = [];

    for (const area of areas) {
      let imageUrl: string | null = null;
      let source = "none";

      try {
        // Step 1: Try Provident area page
        if (firecrawlKey) {
          const providentSlug = area.slug.replace(/-/g, "-");
          const providentUrl = `https://www.provident.ae/areas/${providentSlug}`;

          const scrapeRes = await fetch("https://api.firecrawl.dev/v1/scrape", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${firecrawlKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              url: providentUrl,
              formats: ["html", "links"],
              onlyMainContent: true,
              waitFor: 3000,
              timeout: 15000,
            }),
          });

          if (scrapeRes.ok) {
            const scrapeData = await scrapeRes.json();
            const html = scrapeData.data?.html || "";
            const links: string[] = scrapeData.data?.links || [];

            // Find hero/community images from links
            const imageLinks = links.filter((l: string) =>
              /\.(jpg|jpeg|png|webp)/i.test(l) &&
              !l.includes("logo") &&
              !l.includes("icon") &&
              !l.includes("avatar") &&
              (l.includes("cloudfront") || l.includes("provident") || l.includes("s3"))
            );

            // Also extract from HTML img tags and background URLs
            const htmlImageMatches = html.match(/(?:src|data-src|background-image:\s*url\()["']?(https?:\/\/[^"'\s)]+\.(?:jpg|jpeg|png|webp))/gi) || [];
            const htmlImages = htmlImageMatches
              .map((m: string) => m.replace(/^(?:src|data-src|background-image:\s*url\()["']?/i, ""))
              .filter((u: string) => !u.includes("logo") && !u.includes("icon") && u.length > 20);

            const allImages = [...new Set([...imageLinks, ...htmlImages])];

            // Prefer larger images (community/hero type)
            const heroImage = allImages.find((u: string) =>
              u.includes("hero") || u.includes("banner") || u.includes("community") || u.includes("800x") || u.includes("1200")
            ) || allImages[0];

            if (heroImage) {
              imageUrl = heroImage;
              source = "provident";
            }
          }

          // Throttle between requests
          await new Promise(r => setTimeout(r, 2000));
        }

        // Step 2: If no image found, use Firecrawl search
        if (!imageUrl && firecrawlKey) {
          const searchQuery = `${area.name} ${area.emirate || "Dubai"} community aerial view`;
          const searchRes = await fetch("https://api.firecrawl.dev/v1/search", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${firecrawlKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              query: searchQuery,
              limit: 5,
            }),
          });

          if (searchRes.ok) {
            const searchData = await searchRes.json();
            const searchResults = searchData.data || [];

            // Use AI to pick the best community image URL from search results
            if (searchResults.length > 0 && lovableKey) {
              const summaries = searchResults.map((r: any, i: number) =>
                `Result ${i + 1}: ${r.title || ""} - ${r.url || ""}`
              ).join("\n");

              const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "Authorization": `Bearer ${lovableKey}`,
                },
                body: JSON.stringify({
                  model: "google/gemini-2.5-flash-lite",
                  messages: [{
                    role: "user",
                    content: `Find a high-quality community/aerial photo URL for "${area.name}" in ${area.emirate || "Dubai"}, UAE. I need a URL to an actual image file (jpg/png/webp) showing the full community or master plan view. Search results:\n${summaries}\n\nReturn ONLY the image URL, nothing else. If you can't find one, return "NONE".`
                  }],
                  temperature: 0.1,
                  max_tokens: 200,
                }),
              });

              if (aiRes.ok) {
                const aiData = await aiRes.json();
                const url = aiData.choices?.[0]?.message?.content?.trim();
                if (url && url !== "NONE" && url.startsWith("http")) {
                  imageUrl = url;
                  source = "search";
                }
              }
            }
          }

          await new Promise(r => setTimeout(r, 2000));
        }

        // Update area if we found an image
        if (imageUrl) {
          const { error: updateErr } = await supabase
            .from("areas")
            .update({
              image_url: imageUrl,
              hero_image_url: imageUrl,
              updated_at: new Date().toISOString(),
            })
            .eq("id", area.id);

          results.push({
            area: area.name,
            image_url: imageUrl,
            source,
            status: updateErr ? `error: ${updateErr.message}` : "updated",
          });
        } else {
          results.push({ area: area.name, image_url: null, source: "none", status: "no_image_found" });
        }
      } catch (err) {
        results.push({
          area: area.name,
          image_url: null,
          source: "error",
          status: `error: ${err instanceof Error ? err.message : String(err)}`,
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed: results.length,
        updated: results.filter(r => r.status === "updated").length,
        remaining: (count || 0) - results.filter(r => r.status === "updated").length,
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
