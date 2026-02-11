import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { batch_size = 10 } = await req.json().catch(() => ({}));

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");
    if (!FIRECRAWL_API_KEY) throw new Error("FIRECRAWL_API_KEY not configured");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    // Get developers needing images (null or unsplash placeholder)
    const { data: developers, error: fetchErr } = await supabase
      .from("developers")
      .select("id, name, slug")
      .or("feature_image_url.is.null,feature_image_url.ilike.%unsplash%,feature_image_url.ilike.%pexels%")
      .limit(batch_size);

    if (fetchErr) throw fetchErr;

    if (!developers || developers.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "All developers have real images", updated: 0, remaining: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Processing ${developers.length} developers...`);

    let updated = 0;
    let failed = 0;
    const results: { name: string; status: string; imageUrl?: string }[] = [];

    for (const dev of developers) {
      try {
        console.log(`Searching for: ${dev.name}`);

        // Step 1: Firecrawl search for developer images
        const searchQuery = `${dev.name} Dubai real estate projects building`;
        const searchResp = await fetch("https://api.firecrawl.dev/v1/search", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${FIRECRAWL_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            query: searchQuery,
            limit: 5,
          }),
        });

        if (!searchResp.ok) {
          console.error(`Firecrawl search failed for ${dev.name}: ${searchResp.status}`);
          results.push({ name: dev.name, status: "search_failed" });
          failed++;
          continue;
        }

        const searchData = await searchResp.json();
        const searchResults = searchData.data || [];

        if (searchResults.length === 0) {
          console.log(`No search results for ${dev.name}`);
          results.push({ name: dev.name, status: "no_results" });
          failed++;
          continue;
        }

        // Collect ALL URLs from search results - be very permissive
        const allImageUrls: string[] = [];
        const allPageUrls: string[] = [];
        
        for (const r of searchResults) {
          // Track page URLs for OG image fallback
          if (r.url) allPageUrls.push(r.url);
          
          // Extract ANY image URL from markdown (not just file extensions)
          const mdImages = (r.markdown || "").match(/https?:\/\/[^\s)"']+\.(jpg|jpeg|png|webp|gif)[^\s)"']*/gi) || [];
          allImageUrls.push(...mdImages);
          
          // Also extract markdown image syntax ![alt](url)
          const mdImgSyntax = (r.markdown || "").match(/!\[.*?\]\((https?:\/\/[^\s)]+)\)/gi) || [];
          for (const m of mdImgSyntax) {
            const urlMatch = m.match(/\((https?:\/\/[^\s)]+)\)/);
            if (urlMatch) allImageUrls.push(urlMatch[1]);
          }
          
          // Extract from links array - any image-like URL
          if (r.links && Array.isArray(r.links)) {
            for (const link of r.links) {
              if (typeof link === 'string' && link.match(/\.(jpg|jpeg|png|webp|gif)/i)) {
                allImageUrls.push(link);
              }
            }
          }
          
          // Metadata images - ALL of them
          if (r.metadata?.ogImage) allImageUrls.push(r.metadata.ogImage);
          if (r.metadata?.image) allImageUrls.push(r.metadata.image);
          if (r.metadata?.og_image) allImageUrls.push(r.metadata.og_image);
          if (r.metadata?.twitter_image) allImageUrls.push(r.metadata.twitter_image);
          if (r.metadata?.thumbnailUrl) allImageUrls.push(r.metadata.thumbnailUrl);
        }

        // Deduplicate and filter out tiny icons
        const uniqueImageUrls = [...new Set(allImageUrls)]
          .filter(u => !u.includes('favicon') && !u.includes('icon-') && !u.includes('/icons/') && !u.includes('logo') && u.length < 500)
          .slice(0, 30);
        
        // Build context for AI
        const searchContext = searchResults.map((r: any) => ({
          title: r.title || "",
          url: r.url || "",
          description: r.description || "",
        }));

        console.log(`Found ${uniqueImageUrls.length} image URLs and ${allPageUrls.length} page URLs for ${dev.name}`);

        // Step 2: Use AI to pick the best image
        const imageListText = uniqueImageUrls.length > 0
          ? `\nCandidate image URLs:\n${uniqueImageUrls.map((u: string, i: number) => `${i + 1}. ${u}`).join("\n")}`
          : "\nNo direct image URLs were extracted from search results.";

        const pageUrlsText = `\nSource page URLs:\n${allPageUrls.map((u, i) => `${i + 1}. ${u}`).join("\n")}`;

        const aiPrompt = `Find a real image for the real estate developer "${dev.name}" based in Dubai/UAE.

Search results:
${JSON.stringify(searchContext, null, 2)}
${imageListText}
${pageUrlsText}

TASK: Return ONE image URL showing a real building, project, tower, villa, or development by or related to "${dev.name}".

IMPORTANT RULES:
1. If candidate image URLs exist above, pick the BEST one (prefer large photos of buildings/projects, NOT logos or icons)
2. If no candidate URLs exist, try to construct an OG image URL from the page URLs (e.g., append /og-image.jpg or look at domain patterns)
3. ANY real photo of a building or real estate project is acceptable - it does NOT have to be specifically by this developer
4. Accept images from property listing sites, news articles, or any real estate context
5. The URL must start with http:// or https://
6. Do NOT return URLs containing "unsplash", "pexels", "placeholder", "dummy", or "stock"
7. If you truly cannot find ANY suitable URL, respond with exactly "NONE"

Respond with ONLY the URL or "NONE". Nothing else.`;

        const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [{ role: "user", content: aiPrompt }],
          }),
        });

        if (!aiResp.ok) {
          console.error(`AI failed for ${dev.name}: ${aiResp.status}`);
          results.push({ name: dev.name, status: "ai_failed" });
          failed++;
          continue;
        }

        const aiData = await aiResp.json();
        const chosenUrl = aiData.choices?.[0]?.message?.content?.trim();

        if (!chosenUrl || chosenUrl === "NONE" || !chosenUrl.startsWith("http")) {
          console.log(`AI found no suitable image for ${dev.name}: ${chosenUrl}`);
          results.push({ name: dev.name, status: "ai_no_match" });
          failed++;
          continue;
        }

        // Step 3: Update the developer record
        const { error: updateErr } = await supabase
          .from("developers")
          .update({ feature_image_url: chosenUrl, updated_at: new Date().toISOString() })
          .eq("id", dev.id);

        if (updateErr) {
          console.error(`Update failed for ${dev.name}:`, updateErr);
          results.push({ name: dev.name, status: "update_failed" });
          failed++;
        } else {
          console.log(`✅ Updated ${dev.name} -> ${chosenUrl}`);
          results.push({ name: dev.name, status: "updated", imageUrl: chosenUrl });
          updated++;
        }
      } catch (devErr) {
        console.error(`Error processing ${dev.name}:`, devErr);
        results.push({ name: dev.name, status: "error" });
        failed++;
      }
    }

    // Get remaining count
    const { count: remaining } = await supabase
      .from("developers")
      .select("*", { count: "exact", head: true })
      .or("feature_image_url.is.null,feature_image_url.ilike.%unsplash%,feature_image_url.ilike.%pexels%");

    return new Response(
      JSON.stringify({
        success: true,
        processed: developers.length,
        updated,
        failed,
        remaining: remaining || 0,
        results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
