import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Enrich area images:
 * 1. Try to find a project image from projects in that area
 * 2. If no project image exists, use Firecrawl Search to find real community photos
 * 3. Use Gemini AI to pick the best community-level photo from candidates
 * 4. Upload to Supabase Storage and update the area record
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const firecrawlApiKey = Deno.env.get("FIRECRAWL_API_KEY");
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    const supabase = createClient(supabaseUrl, serviceKey);

    const body = await req.json().catch(() => ({}));
    const batchSize = body.batch_size || 5;

    // Get areas missing images OR with unsplash/pexels/AI-generated images
    const { data: areas, error: fetchErr } = await supabase
      .from("areas")
      .select("id, name, slug")
      .eq("is_active", true)
      .or("image_url.is.null,image_url.ilike.%unsplash%,image_url.ilike.%pexels%,hero_image_url.is.null,hero_image_url.ilike.%unsplash%,hero_image_url.ilike.%pexels%")
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
      .or("image_url.is.null,image_url.ilike.%unsplash%,image_url.ilike.%pexels%,hero_image_url.is.null,hero_image_url.ilike.%unsplash%,hero_image_url.ilike.%pexels%");

    const results: { area: string; image_url: string | null; status: string; source: string }[] = [];

    for (const area of areas) {
      let imageUrl: string | null = null;
      let source = "none";

      // Step 1: Try project images
      const { data: projects } = await supabase
        .from("projects")
        .select("id, main_image_url")
        .eq("area_name", area.name)
        .not("main_image_url", "is", null)
        .limit(1);

      if (projects && projects.length > 0 && projects[0].main_image_url) {
        imageUrl = projects[0].main_image_url;
        source = "project";
      } else {
        // Try project_images table
        const { data: projectsInArea } = await supabase
          .from("projects")
          .select("id")
          .eq("area_name", area.name)
          .limit(5);

        if (projectsInArea && projectsInArea.length > 0) {
          const projectIds = projectsInArea.map(p => p.id);
          const { data: images } = await supabase
            .from("project_images")
            .select("image_url, display_order")
            .in("project_id", projectIds)
            .order("display_order", { ascending: true })
            .limit(1);

          if (images && images.length > 0) {
            imageUrl = images[0].image_url;
            source = "project_images";
          }
        }
      }

      // Step 2: Firecrawl Search for real community photos
      if (!imageUrl && firecrawlApiKey && lovableApiKey) {
        try {
          const searchQuery = `${area.name} Dubai community aerial panoramic view neighborhood real estate`;
          console.log(`Searching for area image: ${searchQuery}`);

          const searchResp = await fetch("https://api.firecrawl.dev/v1/search", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${firecrawlApiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ query: searchQuery, limit: 5 }),
          });

          if (!searchResp.ok) {
            console.error(`Firecrawl search failed for ${area.name}: ${searchResp.status}`);
          } else {
            const searchData = await searchResp.json();
            const searchResults = searchData.data || [];

            // Collect all image URLs from search results
            const allImageUrls: string[] = [];
            for (const r of searchResults) {
              const mdImages = (r.markdown || "").match(/https?:\/\/[^\s)"']+\.(jpg|jpeg|png|webp|gif)[^\s)"']*/gi) || [];
              allImageUrls.push(...mdImages);
              const mdImgSyntax = (r.markdown || "").match(/!\[.*?\]\((https?:\/\/[^\s)]+)\)/gi) || [];
              for (const m of mdImgSyntax) {
                const urlMatch = m.match(/\((https?:\/\/[^\s)]+)\)/);
                if (urlMatch) allImageUrls.push(urlMatch[1]);
              }
              if (r.links && Array.isArray(r.links)) {
                for (const link of r.links) {
                  if (typeof link === 'string' && link.match(/\.(jpg|jpeg|png|webp|gif)/i)) {
                    allImageUrls.push(link);
                  }
                }
              }
              if (r.metadata?.ogImage) allImageUrls.push(r.metadata.ogImage);
              if (r.metadata?.image) allImageUrls.push(r.metadata.image);
              if (r.metadata?.og_image) allImageUrls.push(r.metadata.og_image);
            }

            // Deduplicate and filter
            const uniqueImageUrls = [...new Set(allImageUrls)]
              .filter(u => !u.includes('favicon') && !u.includes('icon-') && !u.includes('/icons/') && !u.includes('logo') && !u.includes('unsplash') && !u.includes('pexels') && u.length < 500)
              .slice(0, 30);

            console.log(`Found ${uniqueImageUrls.length} candidate images for ${area.name}`);

            if (uniqueImageUrls.length > 0) {
              // Use Gemini to pick the best community photo
              const aiPrompt = `You are selecting a REAL photo for the "${area.name}" community/neighborhood in Dubai, UAE.

Candidate image URLs:
${uniqueImageUrls.map((u, i) => `${i + 1}. ${u}`).join("\n")}

TASK: Pick the ONE best image URL that shows a REAL photo of the ${area.name} community or neighborhood.

REQUIREMENTS:
- MUST be a real photograph (NOT a render, CGI, or illustration)
- MUST show the COMMUNITY or NEIGHBORHOOD level view: aerial view, skyline, panorama, master plan view, community streetscape
- Must NOT be a single building facade, apartment interior, floor plan, or logo
- Must NOT contain "unsplash", "pexels", "placeholder", or "stock" in the URL
- Prefer wide/panoramic shots showing multiple buildings or the overall area
- If no URL meets these criteria, respond with exactly "NONE"

Respond with ONLY the URL or "NONE". Nothing else.`;

              const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
                method: "POST",
                headers: {
                  "Authorization": `Bearer ${lovableApiKey}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  model: "google/gemini-2.5-flash",
                  messages: [{ role: "user", content: aiPrompt }],
                }),
              });

              if (aiResp.ok) {
                const aiData = await aiResp.json();
                const chosenUrl = aiData.choices?.[0]?.message?.content?.trim();
                if (chosenUrl && chosenUrl !== "NONE" && chosenUrl.startsWith("http")) {
                  imageUrl = chosenUrl;
                  source = "firecrawl_search";
                  console.log(`AI selected community photo for ${area.name}: ${chosenUrl}`);
                } else {
                  console.log(`AI found no suitable community photo for ${area.name}`);
                }
              } else {
                console.error(`AI selection failed for ${area.name}: ${aiResp.status}`);
              }
            }
          }
        } catch (searchErr) {
          console.error(`Search error for ${area.name}:`, searchErr);
        }
      }

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
          status: updateErr ? `error: ${updateErr.message}` : "updated",
          source,
        });
      } else {
        results.push({ area: area.name, image_url: null, status: "no_image_source", source: "none" });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed: results.length,
        updated: results.filter(r => r.status === "updated").length,
        no_image: results.filter(r => r.status === "no_image_source").length,
        remaining: (remaining || 0) - results.filter(r => r.status === "updated").length,
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
