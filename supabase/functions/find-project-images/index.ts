import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { batchSize = 5 } = await req.json().catch(() => ({}));

    const firecrawlKey = Deno.env.get("FIRECRAWL_API_KEY");
    if (!firecrawlKey) {
      return new Response(
        JSON.stringify({ success: false, error: "Firecrawl not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const sb = createClient(supabaseUrl, supabaseKey);

    // Get projects without images
    const { data: projects, error: fetchErr } = await sb
      .from("projects")
      .select("id, name, developer_name, area_name, emirate")
      .eq("is_published", true)
      .or("cover_image_url.is.null,cover_image_url.eq.")
      .limit(Math.min(batchSize, 10));

    if (fetchErr) throw fetchErr;
    if (!projects?.length) {
      return new Response(
        JSON.stringify({ success: true, message: "No projects need images", updated: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Processing ${projects.length} projects for image search`);

    const results: { id: string; name: string; imageFound: boolean; imageUrl?: string }[] = [];

    for (const project of projects) {
      try {
        // Build a targeted search query
        const developer = project.developer_name || "";
        const area = project.area_name || "";
        const searchQuery = `${project.name} ${developer} Dubai real estate project building exterior`.trim();

        console.log(`Searching images for: ${project.name}`);

        // Use Firecrawl search to find project images
        const searchRes = await fetch("https://api.firecrawl.dev/v1/search", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${firecrawlKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            query: searchQuery,
            limit: 3,
            scrapeOptions: {
              formats: ["links"],
            },
          }),
        });

        if (!searchRes.ok) {
          const errData = await searchRes.json().catch(() => ({}));
          // Check for credits exhausted
          if (searchRes.status === 402 || errData?.error?.includes("credit")) {
            console.error("Credits exhausted!");
            return new Response(
              JSON.stringify({ success: false, error: "Credits exhausted", results }),
              { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
          console.error(`Search failed for ${project.name}:`, errData);
          results.push({ id: project.id, name: project.name, imageFound: false });
          continue;
        }

        const searchData = await searchRes.json();
        
        // Now scrape one of the top results to find an image
        const topUrl = searchData?.data?.[0]?.url;
        if (!topUrl) {
          console.log(`No search results for ${project.name}`);
          results.push({ id: project.id, name: project.name, imageFound: false });
          continue;
        }

        // Scrape the page for images
        const scrapeRes = await fetch("https://api.firecrawl.dev/v1/scrape", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${firecrawlKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            url: topUrl,
            formats: ["screenshot"],
            waitFor: 3000,
            timeout: 30000,
          }),
        });

        if (!scrapeRes.ok) {
          console.error(`Scrape failed for ${project.name}`);
          results.push({ id: project.id, name: project.name, imageFound: false });
          continue;
        }

        const scrapeData = await scrapeRes.json();
        const screenshot = scrapeData?.data?.screenshot;
        const ogImage = scrapeData?.data?.metadata?.ogImage;

        // Prefer OG image (direct URL), fall back to screenshot
        let imageUrl = ogImage || null;

        if (imageUrl && imageUrl.startsWith("http")) {
          // Update the project with the found image
          const { error: updateErr } = await sb
            .from("projects")
            .update({ cover_image_url: imageUrl })
            .eq("id", project.id);

          if (updateErr) {
            console.error(`Failed to update ${project.name}:`, updateErr);
            results.push({ id: project.id, name: project.name, imageFound: false });
          } else {
            console.log(`✅ Found image for ${project.name}: ${imageUrl}`);
            results.push({ id: project.id, name: project.name, imageFound: true, imageUrl });
          }
        } else {
          console.log(`No usable image found for ${project.name}`);
          results.push({ id: project.id, name: project.name, imageFound: false });
        }

        // Small delay between requests
        await new Promise(r => setTimeout(r, 1000));
      } catch (err) {
        console.error(`Error processing ${project.name}:`, err);
        results.push({ id: project.id, name: project.name, imageFound: false });
      }
    }

    const updated = results.filter(r => r.imageFound).length;
    console.log(`Done. Updated ${updated}/${projects.length} projects with images`);

    return new Response(
      JSON.stringify({ success: true, updated, total: projects.length, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in find-project-images:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
