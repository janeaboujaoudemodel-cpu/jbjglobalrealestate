import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Sync developer feature images from Provident Estate
 * Extracts the background images used on their developers page
 * and maps them to our developers
 */
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const firecrawlKey = Deno.env.get("FIRECRAWL_API_KEY");
  const lovableKey = Deno.env.get("LOVABLE_API_KEY");

  if (!firecrawlKey || !lovableKey) {
    return new Response(JSON.stringify({ 
      error: "Missing API keys. Please configure FIRECRAWL_API_KEY." 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // Scrape the Provident developers page
    const providentUrl = "https://providentestate.com/developers/";
    console.log(`Scraping developer images from: ${providentUrl}`);

    const scrapeResponse = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${firecrawlKey}`,
      },
      body: JSON.stringify({
        url: providentUrl,
        formats: ["html", "markdown", "links"],
        waitFor: 5000,
      }),
    });

    if (!scrapeResponse.ok) {
      throw new Error(`Failed to scrape Provident developers page: ${scrapeResponse.status}`);
    }

    const scrapeData = await scrapeResponse.json();
    const html = scrapeData.data?.html || "";
    const markdown = scrapeData.data?.markdown || "";
    const links = scrapeData.data?.links || [];

    console.log(`Scraped: ${html.length} chars HTML, ${markdown.length} chars MD, ${links.length} links`);

    // Use AI to extract developer image mappings
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${lovableKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are a data extraction specialist. Extract developer names with their feature/background images from real estate websites. Return ONLY valid JSON array.`
          },
          {
            role: "user",
            content: `Extract all developer entries with their feature images from this Provident Estate developers page.

HTML CONTENT (look for developer cards with background images):
${html.substring(0, 80000)}

MARKDOWN CONTENT:
${markdown.substring(0, 20000)}

CLOUDFRONT IMAGE LINKS:
${links.filter((l: string) => l.includes("cloudfront.net")).join("\n")}

Return JSON array:
[
  {
    "developer_name": "Emaar Properties",
    "feature_image_url": "https://d3h330vgpwpjr8.cloudfront.net/x/800x600/address_akh_feature_5724a74e4c.webp",
    "logo_url": "https://d3h330vgpwpjr8.cloudfront.net/x/296x/Emaar_f229e25788.webp",
    "description": "One of the pioneer real estate developers..."
  }
]

CRITICAL:
- Each developer has TWO images: a feature/background image AND a logo image
- The feature image is the larger background (usually 260x200 or larger in the URL)
- The logo is smaller (usually 296x in the URL)
- Normalize URLs to use /x/800x600/ for feature images for best quality
- Extract the full description text for each developer
- Include ALL developers shown on the page`
          }
        ],
        temperature: 0.1,
        max_tokens: 12000,
      }),
    });

    if (!aiResponse.ok) {
      throw new Error(`AI extraction failed: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content || "";
    
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error("Could not extract JSON from AI response");
    }

    const extractedDevelopers = JSON.parse(jsonMatch[0]);
    console.log(`Extracted ${extractedDevelopers.length} developers with images`);

    // Get our developers for matching
    const { data: ourDevelopers, error: devError } = await supabase
      .from("uae_developers")
      .select("id, name, slug, feature_image_url, logo_url, description");

    if (devError || !ourDevelopers) {
      throw new Error(`Failed to fetch developers: ${devError?.message}`);
    }

    // Create matching map
    const developerMap = new Map<string, typeof ourDevelopers[0]>();
    for (const dev of ourDevelopers) {
      const normalized = dev.name.toLowerCase().replace(/[^a-z0-9]/g, "");
      developerMap.set(normalized, dev);
      // Add partial matches
      const words = dev.name.toLowerCase().split(/\s+/);
      for (const word of words) {
        if (word.length > 4 && !developerMap.has(word)) {
          developerMap.set(word, dev);
        }
      }
    }

    // Update stats
    const stats = {
      total_extracted: extractedDevelopers.length,
      matched: 0,
      updated_feature_image: 0,
      updated_logo: 0,
      updated_description: 0,
      errors: [] as string[],
    };

    // Process each extracted developer
    for (const extracted of extractedDevelopers) {
      if (!extracted.developer_name) continue;

      // Find matching developer
      const normalized = extracted.developer_name.toLowerCase().replace(/[^a-z0-9]/g, "");
      let matched = developerMap.get(normalized);
      
      if (!matched) {
        const words = extracted.developer_name.toLowerCase().split(/\s+/);
        for (const word of words) {
          if (word.length > 4 && developerMap.has(word)) {
            matched = developerMap.get(word);
            break;
          }
        }
      }

      if (!matched) {
        console.log(`No match for developer: ${extracted.developer_name}`);
        continue;
      }

      stats.matched++;

      // Build update object
      const updates: Record<string, string> = {};
      
      // Update feature image if we have one and current is empty
      if (extracted.feature_image_url && !matched.feature_image_url) {
        // Normalize to higher resolution
        updates.feature_image_url = extracted.feature_image_url
          .replace(/\/x\/\d+x\d+\//, "/x/800x600/");
        stats.updated_feature_image++;
      }

      // Update logo if we have one and current is empty
      if (extracted.logo_url && !matched.logo_url) {
        updates.logo_url = extracted.logo_url;
        stats.updated_logo++;
      }

      // Update description if we have one and current is empty/short
      if (extracted.description && (!matched.description || matched.description.length < 100)) {
        updates.description = extracted.description;
        stats.updated_description++;
      }

      // Apply updates if any
      if (Object.keys(updates).length > 0) {
        const { error: updateError } = await supabase
          .from("uae_developers")
          .update({
            ...updates,
            updated_at: new Date().toISOString(),
          })
          .eq("id", matched.id);

        if (updateError) {
          stats.errors.push(`Failed to update ${matched.name}: ${updateError.message}`);
        } else {
          console.log(`Updated ${matched.name}:`, Object.keys(updates));
        }
      }
    }

    return new Response(JSON.stringify({
      success: true,
      stats,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Sync developer images error:", error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
