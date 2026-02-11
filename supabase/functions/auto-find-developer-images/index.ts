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
      .or("feature_image_url.is.null,feature_image_url.ilike.%unsplash%")
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
        const searchQuery = `${dev.name} real estate projects building`;
        const searchResp = await fetch("https://api.firecrawl.dev/v1/search", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${FIRECRAWL_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            query: searchQuery,
            limit: 3,
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
        
        for (const r of searchResults) {
          // Extract from markdown images
          const mdImages = (r.markdown || "").match(/https?:\/\/[^\s)"']+\.(jpg|jpeg|png|webp)[^\s)"']*/gi) || [];
          allImageUrls.push(...mdImages);
          
          // Extract from links array
          if (r.links && Array.isArray(r.links)) {
            for (const link of r.links) {
              if (typeof link === 'string' && link.match(/\.(jpg|jpeg|png|webp)/i)) {
                allImageUrls.push(link);
              }
            }
          }
          
          // Metadata images
          if (r.metadata?.ogImage) allImageUrls.push(r.metadata.ogImage);
          if (r.metadata?.image) allImageUrls.push(r.metadata.image);
        }

        // Deduplicate
        const uniqueImageUrls = [...new Set(allImageUrls)].slice(0, 20);
        
        // Build context for AI even if no direct image URLs found
        const searchContext = searchResults.map((r: any) => ({
          title: r.title || "",
          url: r.url || "",
          description: r.description || "",
        }));

        console.log(`Found ${uniqueImageUrls.length} image URLs for ${dev.name}`);

        // Step 2: Use AI to pick the best image
        const imageListText = uniqueImageUrls.length > 0
          ? `\nCandidate image URLs:\n${uniqueImageUrls.map((u: string, i: number) => `${i + 1}. ${u}`).join("\n")}`
          : "\nNo direct image URLs were extracted.";

        const aiPrompt = `You are helping find a real project/building image for a real estate developer called "${dev.name}".

Here are search results found online:
${JSON.stringify(searchContext, null, 2)}
${imageListText}

YOUR TASK: Return the SINGLE BEST image URL that shows a real building, tower, villa, or real estate project by "${dev.name}".

RULES:
- If candidate image URLs are listed above, pick the best one showing a real building/project
- If NO candidate image URLs exist, look at the search result page URLs and construct a likely OG image or project image URL from the domain
- Prefer high-resolution images (not thumbnails, icons, or logos)
- The URL must be a direct link to an image (jpg, jpeg, png, webp)
- If absolutely nothing is suitable, respond with "NONE"

Respond with ONLY the URL (nothing else), or "NONE".`;

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
      .or("feature_image_url.is.null,feature_image_url.ilike.%unsplash%");

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
