import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ExtractedProject {
  name: string;
  developer_name: string;
  location: string;
  url: string;
  image_urls: string[];
  bedrooms: string;
  price_text: string;
  price_from: number | null;
  handover_year: string;
  status: string;
  description: string;
  property_type_label: string; // e.g. "Apartment, Sky-Villa", "Villa", "Townhouse"
  status_label: string; // e.g. "Future Launch", "New Phase", "New Launch"
}

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
    const { page = 1, limit = 100 } = await req.json().catch(() => ({}));
    
    // Get all developers for matching
    const { data: developers } = await supabase
      .from("developers")
      .select("id, name, slug");
    
    if (!developers || developers.length === 0) {
      return new Response(JSON.stringify({ error: "No developers found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create developer name lookup map (normalize names for matching)
    const developerMap = new Map<string, { id: string; name: string; slug: string }>();
    for (const dev of developers) {
      const normalized = dev.name.toLowerCase().replace(/[^a-z0-9]/g, "");
      developerMap.set(normalized, dev);
      // Also add partial matches
      const words = dev.name.toLowerCase().split(/\s+/);
      for (const word of words) {
        if (word.length > 3 && !developerMap.has(word)) {
          developerMap.set(word, dev);
        }
      }
    }

    console.log(`Loaded ${developers.length} developers for matching`);

    // Scrape multiple pages to get all projects
    const allProjects: ExtractedProject[] = [];
    const pagesToScrape = page === 1 ? ["", "page/2/", "page/3/", "page/4/", "page/5/"] : [`page/${page}/`];
    
    for (const pageSlug of pagesToScrape) {
      const providentUrl = `https://providentestate.com/new-projects/${pageSlug}`;
      console.log(`Scraping: ${providentUrl}`);

      const scrapeResponse = await fetch("https://api.firecrawl.dev/v1/scrape", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${firecrawlKey}`,
        },
        body: JSON.stringify({
          url: providentUrl,
          formats: ["markdown", "links"],
          waitFor: 5000,
        }),
      });

      if (!scrapeResponse.ok) {
        console.error(`Failed to scrape ${providentUrl}`);
        continue;
      }

      const scrapeData = await scrapeResponse.json();
      const markdown = scrapeData.data?.markdown || "";
      const links = scrapeData.data?.links || [];

      console.log(`Page ${pageSlug || '1'}: ${markdown.length} chars, ${links.length} links`);

      // Use AI to extract project listings from this page
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
              content: `You are a real estate data extraction specialist. Extract ALL project listings from Provident Estate pages. Return ONLY valid JSON array, no markdown.`
            },
            {
              role: "user",
              content: `Extract ALL project listings from this Provident Estate page.

CONTENT:
${markdown.substring(0, 60000)}

LINKS FOUND:
${links.filter((l: string) => l.includes("/new-projects/") || l.includes("cloudfront.net")).slice(0, 200).join("\n")}

Return a JSON array with EVERY project visible:
[
  {
    "name": "Project Name",
    "developer_name": "Developer Name (e.g., Emaar Properties, DAMAC, Sobha Realty, Binghatti)",
    "location": "Area Name",
    "url": "https://providentestate.com/new-projects/...",
    "image_urls": ["https://d3h330vgpwpjr8.cloudfront.net/..."],
    "bedrooms": "1, 2, 3",
    "price_text": "EUR 294K",
    "price_from": 294000,
    "handover_year": "2029",
    "status": "Under Construction OR Ready",
    "description": "Brief description",
    "property_type_label": "Apartment, Sky-Villa",
    "status_label": "Future Launch"
  }
]

CRITICAL:
- Extract EVERY project shown on the page
- Include the developer name for each project
- Get real cloudfront image URLs
- Parse EUR prices to numbers (EUR 294K = 294000, EUR 1.51M = 1510000)
- property_type_label: Extract exactly as shown (e.g., "Apartment, Sky-Villa", "Villa", "Apartment, Studio", "Apartment, Townhouse")
- status_label: Extract if shown (e.g., "Future Launch", "New Phase", "New Launch", "Coming Soon") - leave empty if not shown`
            }
          ],
          temperature: 0.1,
          max_tokens: 16000,
        }),
      });

      if (!aiResponse.ok) continue;

      const aiData = await aiResponse.json();
      const content = aiData.choices?.[0]?.message?.content || "";
      
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        try {
          const pageProjects = JSON.parse(jsonMatch[0]);
          allProjects.push(...pageProjects);
          console.log(`Extracted ${pageProjects.length} projects from page ${pageSlug || '1'}`);
        } catch (e) {
          console.error("JSON parse error for page", pageSlug);
        }
      }

      // Rate limit between pages
      await new Promise(r => setTimeout(r, 1500));
    }

    const projects = allProjects;
    console.log(`Total extracted: ${projects.length} projects`);

    // Stats tracking
    const stats = {
      total_extracted: projects.length,
      matched_to_developer: 0,
      created: 0,
      updated: 0,
      images_added: 0,
      skipped_no_developer: 0,
      errors: [] as string[],
    };

    // Process each project
    for (const proj of projects.slice(0, limit)) {
      if (!proj.name) continue;

      // Match developer
      let matchedDeveloper: { id: string; name: string; slug: string } | undefined;
      
      if (proj.developer_name) {
        const devNormalized = proj.developer_name.toLowerCase().replace(/[^a-z0-9]/g, "");
        matchedDeveloper = developerMap.get(devNormalized);
        
        // Try partial matching
        if (!matchedDeveloper) {
          const devWords = proj.developer_name.toLowerCase().split(/\s+/);
          for (const word of devWords) {
            if (word.length > 3 && developerMap.has(word)) {
              matchedDeveloper = developerMap.get(word);
              break;
            }
          }
        }
      }

      if (!matchedDeveloper) {
        console.log(`No developer match for: ${proj.name} (developer: ${proj.developer_name})`);
        stats.skipped_no_developer++;
        continue;
      }

      stats.matched_to_developer++;

      // Generate slug from project name and location
      const baseSlug = proj.name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .substring(0, 60);
      
      const slug = `${baseSlug}-${matchedDeveloper.slug}`.substring(0, 80);

      // Convert EUR price to AED (1 EUR ≈ 4.0 AED)
      const priceAed = proj.price_from ? Math.round(proj.price_from * 4.0) : null;

      // Determine status
      const currentYear = new Date().getFullYear();
      const handoverYear = parseInt(proj.handover_year) || currentYear + 2;
      const status = proj.status?.toLowerCase().includes("ready") 
        ? "Ready" 
        : handoverYear <= currentYear ? "Ready" : "Under Construction";

      // Parse bedrooms
      const bedroomParts = proj.bedrooms?.match(/(\d+)/g) || [];
      const bedroomsMin = bedroomParts.length > 0 ? parseInt(bedroomParts[0] || "1") : null;
      const bedroomsMax = bedroomParts.length > 1 ? parseInt(bedroomParts[bedroomParts.length - 1] || "1") : bedroomsMin;

      try {
        // Check for existing project (by name + developer or by slug)
        const { data: existing } = await supabase
          .from("projects")
          .select("id, slug")
          .or(`slug.eq.${slug},and(name.ilike.${proj.name},developer_id.eq.${matchedDeveloper.id})`)
          .maybeSingle();

        let projectId: string;

        if (existing) {
          // Update existing project with any missing data
          projectId = existing.id;
          
          const { error: updateError } = await supabase
            .from("projects")
            .update({
              location: proj.location || undefined,
              status,
              price_from: priceAed || undefined,
              bedrooms_min: bedroomsMin || undefined,
              bedrooms_max: bedroomsMax || undefined,
              handover_date: proj.handover_year ? `Q4 ${proj.handover_year}` : undefined,
              description: proj.description || undefined,
              source_url: proj.url || undefined,
              is_offplan: status === "Under Construction",
              is_developer_direct: true,
              property_type_label: proj.property_type_label || undefined,
              status_label: proj.status_label || undefined,
              updated_at: new Date().toISOString(),
            })
            .eq("id", projectId);

          if (updateError) {
            console.error(`Update error for ${proj.name}:`, updateError);
            stats.errors.push(`Update failed: ${proj.name}`);
            continue;
          }
          
          stats.updated++;
        } else {
          // Create new project
          const { data: newProject, error: insertError } = await supabase
            .from("projects")
            .insert({
              name: proj.name,
              slug,
              developer_id: matchedDeveloper.id,
              location: proj.location,
              emirate: "Dubai",
              status,
              price_from: priceAed,
              bedrooms_min: bedroomsMin,
              bedrooms_max: bedroomsMax,
              handover_date: proj.handover_year ? `Q4 ${proj.handover_year}` : null,
              description: proj.description,
              source_url: proj.url,
              is_offplan: status === "Under Construction",
              is_developer_direct: true,
              property_type_label: proj.property_type_label || null,
              status_label: proj.status_label || null,
            })
            .select("id")
            .single();

          if (insertError || !newProject) {
            console.error(`Insert error for ${proj.name}:`, insertError);
            stats.errors.push(`Insert failed: ${proj.name}`);
            continue;
          }
          
          projectId = newProject.id;
          stats.created++;
        }

        // Handle images - only add if project has fewer than 3 images
        if (proj.image_urls && proj.image_urls.length > 0) {
          const { count: existingImageCount } = await supabase
            .from("project_images")
            .select("*", { count: "exact", head: true })
            .eq("project_id", projectId);

          if ((existingImageCount || 0) < 3) {
            // Filter valid cloudfront URLs
            const validImages = proj.image_urls
              .filter((url: string) => 
                url.includes("cloudfront.net") && 
                !url.includes("logo") &&
                !url.includes("icon")
              )
              .map((url: string) => url.replace(/\/x\/\d+x\d+\//, "/x/800x600/"))
              .filter((url: string, index: number, arr: string[]) => arr.indexOf(url) === index)
              .slice(0, 5);

            if (validImages.length > 0) {
              // Delete old images and add new ones
              await supabase
                .from("project_images")
                .delete()
                .eq("project_id", projectId);

              const imageRecords = validImages.map((url: string, index: number) => ({
                project_id: projectId,
                image_url: url,
                alt_text: `${proj.name} - Image ${index + 1}`,
                display_order: index,
              }));

              await supabase.from("project_images").insert(imageRecords);
              stats.images_added += validImages.length;
            }
          }
        }
      } catch (err) {
        console.error(`Error processing ${proj.name}:`, err);
        stats.errors.push(err instanceof Error ? err.message : "Unknown error");
      }
    }

    return new Response(JSON.stringify({
      success: true,
      stats,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Master sync error:", error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
