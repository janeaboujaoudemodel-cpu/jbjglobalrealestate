import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper to check if a URL is a real area photo (not a generic template/icon)
function isGoodAreaImage(url: string): boolean {
  if (!url || !url.startsWith("http")) return false;
  const bad = /logo|favicon|icon|navbar|sprite|avatar|16x16|32x32|48x48|64x64|signature_property|placeholder|default|blank|spacer|transparent|pixel\.gif/i;
  if (bad.test(url)) return false;
  if (url.length < 60) return false;
  if (url.includes("unsplash.com") || url.includes("pexels.com")) return false;
  if (url.includes("reelly-backend.s3.amazonaws.com")) return false;
  if (url.includes("api.reelly.io")) return false;
  if (url.includes("pinterest.com")) return false;
  if (url.includes("keyspacerealty.com")) return false;
  return true;
}

// Curated premium community images for major areas (instant, free, reliable)
const CURATED_AREA_IMAGES: Record<string, string> = {
  "Dubai Islands": "https://d3h330vgpwpjr8.cloudfront.net/x/1920x1080/filters:format(webp)/community/dubai-islands.jpg",
  "Al Marjan Island": "https://d3h330vgpwpjr8.cloudfront.net/x/1920x1080/filters:format(webp)/community/al-marjan-island.jpg",
  "JVT (Jumeirah Village Triangle)": "https://d3h330vgpwpjr8.cloudfront.net/x/1920x1080/filters:format(webp)/community/jumeirah-village-triangle.jpg",
  "Arjan": "https://d3h330vgpwpjr8.cloudfront.net/x/1920x1080/filters:format(webp)/community/arjan.jpg",
  "Damac Hills": "https://d3h330vgpwpjr8.cloudfront.net/x/1920x1080/filters:format(webp)/community/damac-hills.jpg",
  "Damac Lagoons": "https://d3h330vgpwpjr8.cloudfront.net/x/1920x1080/filters:format(webp)/community/damac-lagoons.jpg",
  "Town Square": "https://d3h330vgpwpjr8.cloudfront.net/x/1920x1080/filters:format(webp)/community/town-square.jpg",
  "Meydan (Nad Al Sheba  1)": "https://d3h330vgpwpjr8.cloudfront.net/x/1920x1080/filters:format(webp)/community/meydan.jpg",
  "Dubai Production City": "https://d3h330vgpwpjr8.cloudfront.net/x/1920x1080/filters:format(webp)/community/dubai-production-city.jpg",
  "Dubai International City": "https://d3h330vgpwpjr8.cloudfront.net/x/1920x1080/filters:format(webp)/community/international-city.jpg",
  "Dubailand Residence Complex": "https://d3h330vgpwpjr8.cloudfront.net/x/1920x1080/filters:format(webp)/community/dubailand-residence-complex.jpg",
  "The Valley": "https://d3h330vgpwpjr8.cloudfront.net/x/1920x1080/filters:format(webp)/community/the-valley.jpg",
  "Majan": "https://d3h330vgpwpjr8.cloudfront.net/x/1920x1080/filters:format(webp)/community/al-furjan.jpg",
  "Dubai Silicon Oasis": "https://d3h330vgpwpjr8.cloudfront.net/x/1920x1080/filters:format(webp)/community/dubai-silicon-oasis.jpg",
  "Dubai Motor City": "https://d3h330vgpwpjr8.cloudfront.net/x/1920x1080/filters:format(webp)/community/motor-city.jpg",
  "Dubai Investments Park": "https://d3h330vgpwpjr8.cloudfront.net/x/1920x1080/filters:format(webp)/community/dubai-investments-park.jpg",
  "Dubai Studio City": "https://d3h330vgpwpjr8.cloudfront.net/x/1920x1080/filters:format(webp)/community/dubai-studio-city.jpg",
  "Dubai Science Park": "https://d3h330vgpwpjr8.cloudfront.net/x/1920x1080/filters:format(webp)/community/dubai-science-park.jpg",
  "Dubai Industrial City": "https://d3h330vgpwpjr8.cloudfront.net/x/1920x1080/filters:format(webp)/community/dubai-industrial-city.jpg",
  "Dubai Expo City": "https://d3h330vgpwpjr8.cloudfront.net/x/1920x1080/filters:format(webp)/community/expo-city.jpg",
  "Mina Rashid": "https://d3h330vgpwpjr8.cloudfront.net/x/1920x1080/filters:format(webp)/community/mina-rashid.jpg",
  "Dubai Harbour": "https://d3h330vgpwpjr8.cloudfront.net/x/1920x1080/filters:format(webp)/community/dubai-harbour.jpg",
  "City Walk": "https://d3h330vgpwpjr8.cloudfront.net/x/1920x1080/filters:format(webp)/community/city-walk.jpg",
  "MJL (Madinat Jumeirah Living)": "https://d3h330vgpwpjr8.cloudfront.net/x/1920x1080/filters:format(webp)/community/madinat-jumeirah-living.jpg",
  "Jumeirah Islands": "https://d3h330vgpwpjr8.cloudfront.net/x/1920x1080/filters:format(webp)/community/jumeirah-islands.jpg",
  "Maritime City": "https://d3h330vgpwpjr8.cloudfront.net/x/1920x1080/filters:format(webp)/community/maritime-city.jpg",
  "Jebel Ali Village": "https://d3h330vgpwpjr8.cloudfront.net/x/1920x1080/filters:format(webp)/community/jebel-ali.jpg",
  "Al Jaddaf Waterfront": "https://d3h330vgpwpjr8.cloudfront.net/x/1920x1080/filters:format(webp)/community/al-jaddaf.jpg",
  "Safa Park": "https://d3h330vgpwpjr8.cloudfront.net/x/1920x1080/filters:format(webp)/community/al-safa.jpg",
  "Maryam Island": "https://d3h330vgpwpjr8.cloudfront.net/x/1920x1080/filters:format(webp)/community/maryam-island.jpg",
  "Siniya Island": "https://d3h330vgpwpjr8.cloudfront.net/x/1920x1080/filters:format(webp)/community/siniya-island.jpg",
  "Yas Island": "https://d3h330vgpwpjr8.cloudfront.net/x/1920x1080/filters:format(webp)/community/yas-island.jpg",
  "Al Saadiyat island": "https://d3h330vgpwpjr8.cloudfront.net/x/1920x1080/filters:format(webp)/community/saadiyat-island.jpg",
  "Al Maryah Island": "https://d3h330vgpwpjr8.cloudfront.net/x/1920x1080/filters:format(webp)/community/al-maryah-island.jpg",
  "Zayed City": "https://d3h330vgpwpjr8.cloudfront.net/x/1920x1080/filters:format(webp)/community/zayed-city.jpg",
  "Grand Polo Club and Resort": "https://d3h330vgpwpjr8.cloudfront.net/x/1920x1080/filters:format(webp)/community/dubai-polo-and-equestrian-club.jpg",
  "World of Islands": "https://d3h330vgpwpjr8.cloudfront.net/x/1920x1080/filters:format(webp)/community/the-world-islands.jpg",
  "Zabeel 1&2": "https://d3h330vgpwpjr8.cloudfront.net/x/1920x1080/filters:format(webp)/community/zabeel.jpg",
  "The Oasis": "https://d3h330vgpwpjr8.cloudfront.net/x/1920x1080/filters:format(webp)/community/the-oasis.jpg",
  "City Of Arabia": "https://d3h330vgpwpjr8.cloudfront.net/x/1920x1080/filters:format(webp)/community/dubailand.jpg",
  "Al Satwa": "https://d3h330vgpwpjr8.cloudfront.net/x/1920x1080/filters:format(webp)/community/al-satwa.jpg",
  "Al Jazeera Al Hamra": "https://d3h330vgpwpjr8.cloudfront.net/x/1920x1080/filters:format(webp)/community/al-jazeera-al-hamra.jpg",
};

/**
 * Enrich area images - REAL PHOTOS ONLY, NO AI GENERATION:
 * 0. Check curated image map (instant, free)
 * 1. Try project images from DB
 * 2. Firecrawl Search on property portals (bayut, propertyfinder)
 * 3. Broader Firecrawl Search
 * 4. If all fail -> set NULL (UI shows gradient fallback)
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
    const batchSize = body.batch_size || 20;

    // Get areas: missing images OR with placeholder/AI-generated images
    const { data: areas, error: fetchErr } = await supabase
      .from("areas")
      .select("id, name, slug, image_url")
      .eq("is_active", true)
      .or("image_url.is.null,image_url.ilike.%unsplash%,image_url.ilike.%pexels%,image_url.ilike.%supabase.co/storage%area-images%,image_url.ilike.%reelly-backend.s3%,image_url.ilike.%api.reelly.io%,image_url.ilike.%pinterest.com%,image_url.ilike.%keyspacerealty.com%")
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
      .or("image_url.is.null,image_url.ilike.%unsplash%,image_url.ilike.%pexels%,image_url.ilike.%supabase.co/storage%area-images%,image_url.ilike.%reelly-backend.s3%,image_url.ilike.%api.reelly.io%,image_url.ilike.%pinterest.com%,image_url.ilike.%keyspacerealty.com%");

    const results: { area: string; image_url: string | null; status: string; source: string }[] = [];

    for (const area of areas) {
      let imageUrl: string | null = null;
      let source = "none";
      const oldImageUrl = area.image_url;

      // Step 0: Check curated image map (instant, free, reliable)
      const curatedUrl = CURATED_AREA_IMAGES[area.name];
      if (curatedUrl) {
        imageUrl = curatedUrl;
        source = "curated";
        console.log(`${area.name}: using curated image`);
      }

      // Step 1: Try project images from DB (only if no curated)
      if (!imageUrl) {
      const { data: projects } = await supabase
        .from("projects")
        .select("id, main_image_url")
        .eq("area_name", area.name)
        .not("main_image_url", "is", null)
        .limit(1);

      if (projects && projects.length > 0 && projects[0].main_image_url && isGoodAreaImage(projects[0].main_image_url)) {
        imageUrl = projects[0].main_image_url;
        source = "project";
      } else {
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

          if (images && images.length > 0 && isGoodAreaImage(images[0].image_url)) {
            imageUrl = images[0].image_url;
            source = "project_images";
          }
        }
      }
      } // end Step 1 guard

      // Step 2: Firecrawl Search on property portals
      if (!imageUrl && firecrawlApiKey) {
        try {
          const searchQuery = `"${area.name}" Dubai aerial view master plan community overview site:bayut.com OR site:propertyfinder.ae`;
          console.log(`Portal search for ${area.name}`);

          const searchResp = await fetch("https://api.firecrawl.dev/v1/search", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${firecrawlApiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ 
              query: searchQuery, 
              limit: 5,
              scrapeOptions: { formats: ["markdown"] }
            }),
          });

          if (searchResp.ok) {
            const searchData = await searchResp.json();
            const searchResults = searchData.data || [];
            console.log(`Portal search returned ${searchResults.length} results for ${area.name}`);
            
            for (const r of searchResults) {
              // Check metadata for OG images
              const ogImg = r.metadata?.ogImage || r.metadata?.image || r.metadata?.og_image;
              if (ogImg && isGoodAreaImage(ogImg)) {
                imageUrl = ogImg;
                source = "portal_og";
                console.log(`Found portal OG image for ${area.name}: ${ogImg.substring(0, 80)}`);
                break;
              }
              // Check markdown for inline images
              const md = r.markdown || "";
              const imgs = md.match(/https?:\/\/[^\s)"']+\.(jpg|jpeg|png|webp)[^\s)"']*/gi) || [];
              for (const img of imgs) {
                if (isGoodAreaImage(img)) {
                  imageUrl = img;
                  source = "portal_markdown";
                  console.log(`Found portal inline image for ${area.name}: ${img.substring(0, 80)}`);
                  break;
                }
              }
              if (imageUrl) break;
            }
          } else {
            const errBody = await searchResp.text();
            console.error(`Portal search failed for ${area.name}: ${searchResp.status} - ${errBody.substring(0, 200)}`);
          }
          await new Promise(r => setTimeout(r, 1500));
        } catch (err) {
          console.warn(`Portal search error for ${area.name}:`, err);
        }
      }

      // Step 3: Broader Firecrawl Search
      if (!imageUrl && firecrawlApiKey) {
        try {
          const broadQuery = `${area.name} Dubai aerial panoramic master community overview photo`;
          console.log(`Broad search for ${area.name}`);

          const searchResp = await fetch("https://api.firecrawl.dev/v1/search", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${firecrawlApiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ query: broadQuery, limit: 5, scrapeOptions: { formats: ["markdown"] } }),
          });

          if (searchResp.ok) {
            const searchData = await searchResp.json();
            const candidates: string[] = [];

            for (const r of (searchData.data || [])) {
              const ogImg = r.metadata?.ogImage || r.metadata?.image || r.metadata?.og_image;
              if (ogImg && isGoodAreaImage(ogImg)) candidates.push(ogImg);
              
              // Extract images from markdown
              const md = r.markdown || "";
              const imgs = md.match(/https?:\/\/[^\s)"']+\.(jpg|jpeg|png|webp)[^\s)"']*/gi) || [];
              for (const img of imgs) {
                if (isGoodAreaImage(img)) candidates.push(img);
              }
            }

            const unique = [...new Set(candidates)].slice(0, 15);
            if (unique.length > 0 && lovableApiKey) {
              // Use AI to pick the best community photo
              const aiPrompt = `Pick the ONE best image URL showing a REAL photo of ${area.name} community in Dubai.
Candidates:
${unique.map((u, i) => `${i + 1}. ${u}`).join("\n")}

MUST be a real photograph (NOT render/CGI). Must show community/neighborhood. Respond with ONLY the URL or "NONE".`;

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
                const chosen = aiData.choices?.[0]?.message?.content?.trim();
                if (chosen && chosen !== "NONE" && chosen.startsWith("http")) {
                  imageUrl = chosen;
                  source = "broad_search_ai";
                  console.log(`AI selected for ${area.name}: ${chosen.substring(0, 80)}`);
                }
              }
            } else if (unique.length > 0) {
              imageUrl = unique[0];
              source = "broad_search_first";
            }
          }
          await new Promise(r => setTimeout(r, 1500));
        } catch (err) {
          console.warn(`Broad search error for ${area.name}:`, err);
        }
      }

      // Delete old AI-generated image from storage if present
      if (oldImageUrl && oldImageUrl.includes("supabase.co/storage") && oldImageUrl.includes("area-images")) {
        try {
          const pathMatch = oldImageUrl.match(/area-images\/(.+)$/);
          if (pathMatch) {
            await supabase.storage.from("area-images").remove([pathMatch[1]]);
            console.log(`Deleted old AI image: ${pathMatch[1]}`);
          }
        } catch (delErr) {
          console.warn(`Failed to delete old image for ${area.name}:`, delErr);
        }
      }

      // Update: set real image or NULL (no fake photos ever)
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

      console.log(`${area.name}: ${finalUrl ? source : "NULL"}`);
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
