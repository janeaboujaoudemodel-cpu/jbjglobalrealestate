import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Developer slug mappings to Provident URL format
const DEVELOPER_MAPPINGS: Record<string, string> = {
  "emaar-properties": "emaar-properties",
  "damac-properties": "damac-properties",
  "binghatti": "binghatti",
  "sobha-realty": "sobha-realty",
  "ellington-properties": "ellington-properties",
  "azizi-developments": "azizi-developments",
  "meraas": "meraas",
  "aldar-properties": "aldar-properties",
  "nakheel": "nakheel",
  "danube-properties": "danube-properties",
  "samana-developers": "samana-developers",
  "imtiaz-developments": "imtiaz-developments",
  "arada-properties": "arada-properties",
  "object-1": "object-1",
  "omniyat": "omniyat",
  "nshama": "nshama",
  "reportage-properties": "reportage-properties",
  "tiger-group": "tiger-group",
  "hh-development": "hh-development",
  "majid-al-futtaim": "majid-al-futtaim",
  "mag-group": "mag-group",
  "beyond": "beyond",
  "select-group": "select-group",
  "dubai-properties": "dubai-properties",
};

interface ProjectListing {
  name: string;
  slug: string;
  url: string;
  image_urls: string[];
  property_type: string;
  location: string;
  bedrooms: string;
  price_text: string;
  price_from: number | null;
  handover_year: string;
  description: string;
}

/**
 * APPROVAL QUEUE MODE:
 * This function NO LONGER inserts directly into `projects` table.
 * All extracted projects go to `pending_project_imports` with status='pending'.
 * An admin must review and approve each project via the Listing Admin panel.
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
    const { developerSlug, limit = 50 } = await req.json().catch(() => ({}));

    // Get developers to sync
    let developersQuery = supabase
      .from("developers")
      .select("id, name, slug")
      .not("logo_url", "is", null);
    
    if (developerSlug) {
      developersQuery = developersQuery.eq("slug", developerSlug);
    }

    const { data: developers, error: devError } = await developersQuery;

    if (devError || !developers || developers.length === 0) {
      return new Response(JSON.stringify({ 
        error: "No developers found to sync" 
      }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const results: Record<string, { queued: number; skipped: number; errors: string[] }> = {};

    for (const developer of developers) {
      const providentSlug = DEVELOPER_MAPPINGS[developer.slug] || developer.slug;
      const developerUrl = `https://providentestate.com/new-projects/developed-by-${providentSlug}/`;
      
      console.log(`[ApprovalQueue] Syncing developer: ${developer.name} from ${developerUrl}`);
      
      results[developer.slug] = { queued: 0, skipped: 0, errors: [] };

      try {
        // Scrape the developer's projects page
        const scrapeResponse = await fetch("https://api.firecrawl.dev/v1/scrape", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${firecrawlKey}`,
          },
          body: JSON.stringify({
            url: developerUrl,
            formats: ["markdown", "links"],
            waitFor: 5000,
          }),
        });

        if (!scrapeResponse.ok) {
          const errText = await scrapeResponse.text();
          console.error(`Firecrawl error for ${developer.name}:`, errText);
          results[developer.slug].errors.push(`Scrape failed: ${errText.substring(0, 100)}`);
          continue;
        }

        const scrapeData = await scrapeResponse.json();
        const markdown = scrapeData.data?.markdown || "";
        const links = scrapeData.data?.links || [];

        // Use AI to extract project listings
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
                content: `You are a real estate data extraction specialist. Extract project listings from Provident Estate pages. Return ONLY valid JSON array, no markdown.`
              },
              {
                role: "user",
                content: `Extract ALL project listings from this Provident Estate developer page for ${developer.name}.

CONTENT:
${markdown.substring(0, 50000)}

LINKS FOUND:
${links.filter((l: string) => l.includes("/new-projects/") || l.includes("cloudfront.net")).slice(0, 200).join("\n")}

Return a JSON array of projects:
[
  {
    "name": "Project Name",
    "slug": "project-slug-from-url",
    "url": "https://providentestate.com/new-projects/project-slug/",
    "image_urls": ["https://d3h330vgpwpjr8.cloudfront.net/..."],
    "property_type": "apartment|villa|townhouse",
    "location": "Area Name",
    "bedrooms": "1, 2, 3",
    "price_text": "EUR 294K",
    "price_from": 294000,
    "handover_year": "2029",
    "description": "Short project description..."
  }
]

IMPORTANT:
- Extract REAL cloudfront image URLs (https://d3h330vgpwpjr8.cloudfront.net/...)
- Get the highest resolution version (464x312 or larger)
- Include ALL projects shown on the page
- Parse price to number (EUR 294K = 294000, EUR 1.51M = 1510000)
- Extract handover year from the listing`
              }
            ],
            temperature: 0.1,
            max_tokens: 16000,
          }),
        });

        if (!aiResponse.ok) {
          results[developer.slug].errors.push("AI extraction failed");
          continue;
        }

        const aiData = await aiResponse.json();
        const content = aiData.choices?.[0]?.message?.content || "";
        
        // Parse JSON array from response
        let projects: ProjectListing[] = [];
        const jsonMatch = content.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          try {
            projects = JSON.parse(jsonMatch[0]);
          } catch (e) {
            console.error("JSON parse error:", e);
            results[developer.slug].errors.push("JSON parse failed");
            continue;
          }
        }

        console.log(`Found ${projects.length} projects for ${developer.name}`);

        // Process each project - INSERT TO APPROVAL QUEUE, NOT PROJECTS
        for (const proj of projects.slice(0, limit)) {
          if (!proj.name || !proj.slug) continue;

          // Check if already in queue or exists
          const { data: existingQueue } = await supabase
            .from("pending_project_imports")
            .select("id")
            .eq("slug", proj.slug)
            .eq("status", "pending")
            .maybeSingle();

          const { data: existingProject } = await supabase
            .from("projects")
            .select("id")
            .eq("slug", proj.slug)
            .maybeSingle();

          if (existingQueue || existingProject) {
            results[developer.slug].skipped++;
            continue;
          }

          // Convert EUR price to AED (approximate rate: 1 EUR = 4.0 AED)
          const priceAed = proj.price_from ? Math.round(proj.price_from * 4.0) : null;

          // Parse bedrooms
          const bedroomParts = proj.bedrooms?.match(/(\d+)/g) || [];
          const bedroomsMin = bedroomParts.length > 0 ? parseInt(bedroomParts[0] || "1") : null;
          const bedroomsMax = bedroomParts.length > 1 ? parseInt(bedroomParts[bedroomParts.length - 1] || "1") : bedroomsMin;

          // Prepare images
          const validImages = (proj.image_urls || [])
            .filter((url: string) => 
              url.includes("cloudfront.net") && 
              !url.includes("logo") &&
              !url.includes("icon")
            )
            .map((url: string) => url.replace(/\/x\/\d+x\d+\//, "/x/1200x800/"))
            .filter((url: string, index: number, arr: string[]) => arr.indexOf(url) === index)
            .slice(0, 10);

          // INSERT TO APPROVAL QUEUE - NOT PROJECTS TABLE
          const { error: queueErr } = await supabase
            .from("pending_project_imports")
            .insert({
              name: proj.name,
              slug: proj.slug,
              developer_id: developer.id,
              developer_name: developer.name,
              location: proj.location || null,
              emirate: "Dubai",
              description: proj.description || null,
              price_from: priceAed,
              bedrooms_min: bedroomsMin,
              bedrooms_max: bedroomsMax,
              handover_date: proj.handover_year ? `Q4 ${proj.handover_year}` : null,
              property_type_label: proj.property_type || null,
              source_url: proj.url || null,
              images: JSON.stringify(validImages.map((url: string, i: number) => ({
                url,
                alt_text: `${proj.name} - Image ${i + 1}`,
                display_order: i
              }))),
              is_new_project: true,
              status: "pending",
            });

          if (queueErr) {
            console.error(`Queue insert failed for ${proj.name}:`, queueErr);
            results[developer.slug].skipped++;
          } else {
            results[developer.slug].queued++;
          }
        }
      } catch (err) {
        console.error(`Error syncing ${developer.name}:`, err);
        results[developer.slug].errors.push(err instanceof Error ? err.message : "Unknown error");
      }

      // Rate limit - wait between developers
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Summary stats
    const totalQueued = Object.values(results).reduce((sum, r) => sum + r.queued, 0);
    const totalSkipped = Object.values(results).reduce((sum, r) => sum + r.skipped, 0);

    return new Response(JSON.stringify({
      success: true,
      mode: "approval_queue",
      summary: {
        developers_processed: developers.length,
        total_projects_queued: totalQueued,
        total_skipped: totalSkipped,
      },
      details: results,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Sync error:", error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
