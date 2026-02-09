import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Provident Estate base URLs
const PROVIDENT_BASE = "https://providentestate.com";
const DEVELOPERS_URL = `${PROVIDENT_BASE}/developers`;

interface ScrapedDeveloper {
  name: string;
  slug: string;
  description: string;
  logo_url: string | null;
  page_url: string;
  project_count: number;
}

interface ScrapedProject {
  name: string;
  slug: string;
  developer_name: string;
  location: string;
  emirate: string;
  status: string;
  property_type: string;
  bedrooms: string;
  price_from: number | null;
  price_to: number | null;
  handover_date: string;
  payment_plan: string;
  description: string;
  image_urls: string[];
  brochure_url: string | null;
  floor_plan_urls: string[];
  page_url: string;
}

async function scrapeWithFirecrawl(url: string, apiKey: string, formats: string[] = ["markdown", "links"]): Promise<{ markdown?: string; links?: string[]; html?: string }> {
  const response = await fetch("https://api.firecrawl.dev/v1/scrape", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      url,
      formats,
      waitFor: 5000,
      onlyMainContent: false,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Firecrawl error: ${error}`);
  }

  const data = await response.json();
  return data.data || data;
}

async function extractWithAI(content: string, prompt: string, lovableKey: string): Promise<unknown> {
  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${lovableKey}`,
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: "You are a data extraction specialist for UAE real estate. Extract structured data accurately. Always return valid JSON." },
        { role: "user", content: prompt + "\n\nContent to extract from:\n" + content.substring(0, 50000) },
      ],
      temperature: 0.1,
      max_tokens: 16000,
    }),
  });

  if (!response.ok) {
    throw new Error(`AI extraction failed: ${await response.text()}`);
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content || "";
  
  // Extract JSON from response
  const jsonMatch = text.match(/```json\n?([\s\S]*?)\n?```/) || text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    return JSON.parse(jsonMatch[1] || jsonMatch[0]);
  }
  
  throw new Error("No valid JSON found in AI response");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const firecrawlKey = Deno.env.get("FIRECRAWL_API_KEY");
  const lovableKey = Deno.env.get("LOVABLE_API_KEY");

  if (!firecrawlKey) {
    return new Response(JSON.stringify({ error: "FIRECRAWL_API_KEY not configured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const body = await req.json().catch(() => ({}));
    const { step = "developers", developerSlug, limit } = body;

    // STEP 1: Scrape all developers from the developers index page
    if (step === "developers") {
      console.log("Step 1: Scraping developers list...");
      
      const scraped = await scrapeWithFirecrawl(DEVELOPERS_URL, firecrawlKey);
      
      if (!scraped.markdown || !lovableKey) {
        return new Response(JSON.stringify({ 
          error: "Failed to scrape or missing LOVABLE_API_KEY",
          markdown_length: scraped.markdown?.length || 0 
        }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const extracted = await extractWithAI(
        scraped.markdown,
        `Extract ALL real estate developers from this Provident Estate developers page.

Return a JSON array of developers in this exact format:
{
  "developers": [
    {
      "name": "Developer Name (EXACT as shown)",
      "slug": "developer-slug-lowercase",
      "description": "Brief description if available",
      "logo_url": "URL to developer logo if visible",
      "page_url": "Full URL to developer's page on Provident",
      "project_count": 0
    }
  ]
}

IMPORTANT:
- Extract EVERY developer shown on the page
- Include the full URL to each developer's dedicated page
- Developer pages are typically at https://providentestate.com/developers/[slug]
- Do NOT skip any developers`,
        lovableKey
      ) as { developers: ScrapedDeveloper[] };

      const developers = extracted.developers || [];
      console.log(`Found ${developers.length} developers`);

      // Upsert developers to database
      let created = 0;
      let updated = 0;

      for (const dev of developers) {
        const normalizedSlug = dev.slug.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
        
        const { data: existing } = await supabase
          .from("developers")
          .select("id")
          .eq("slug", normalizedSlug)
          .maybeSingle();

        if (existing) {
          await supabase
            .from("developers")
            .update({
              description: dev.description || undefined,
              logo_url: dev.logo_url || undefined,
              updated_at: new Date().toISOString(),
            })
            .eq("id", existing.id);
          updated++;
        } else {
          await supabase
            .from("developers")
            .insert({
              name: dev.name,
              slug: normalizedSlug,
              description: dev.description,
              logo_url: dev.logo_url,
              headquarters: "Dubai, UAE",
              rank: 50 + created, // Auto-rank new developers
            });
          created++;
        }
      }

      return new Response(JSON.stringify({
        success: true,
        step: "developers",
        developers_found: developers.length,
        created,
        updated,
        next_step: "Use step='developer_projects' with developerSlug to scrape each developer's projects",
        developers: developers.map(d => ({ name: d.name, slug: d.slug, page_url: d.page_url })),
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // STEP 2: Scrape all projects for a specific developer
    if (step === "developer_projects" && developerSlug) {
      console.log(`Step 2: Scraping projects for developer: ${developerSlug}`);
      
      const developerUrl = `${PROVIDENT_BASE}/developers/${developerSlug}`;
      const scraped = await scrapeWithFirecrawl(developerUrl, firecrawlKey, ["markdown", "links", "html"]);

      if (!scraped.markdown || !lovableKey) {
        return new Response(JSON.stringify({ 
          error: "Failed to scrape developer page",
          url: developerUrl 
        }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Get developer from DB
      const { data: developer } = await supabase
        .from("developers")
        .select("*")
        .eq("slug", developerSlug)
        .maybeSingle();

      if (!developer) {
        return new Response(JSON.stringify({ error: `Developer ${developerSlug} not found in database` }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const extracted = await extractWithAI(
        scraped.markdown + "\n\nLinks found:\n" + (scraped.links || []).join("\n"),
        `Extract ALL real estate projects from this developer's page on Provident Estate.

IMPORTANT RULES:
1. Extract EVERY project shown - no limits
2. Only include OFF-PLAN and DEVELOPER-DIRECT projects
3. Do NOT include resale or secondary market properties
4. Include ALL image URLs found for each project
5. Include brochure/PDF download links if available

Return JSON in this exact format:
{
  "developer_info": {
    "name": "Developer Name",
    "description": "Full developer description from page",
    "logo_url": "Developer logo URL",
    "founded_year": 2000,
    "completed_projects": 50,
    "offplan_projects": 20
  },
  "projects": [
    {
      "name": "Project Name (EXACT)",
      "slug": "project-slug",
      "location": "Area, Community",
      "emirate": "Dubai",
      "status": "Off-Plan or Ready",
      "property_type": "Apartments/Villas/Townhouses",
      "bedrooms": "1-4 BR",
      "price_from": 1500000,
      "price_to": 5000000,
      "handover_date": "Q4 2026",
      "payment_plan": "60/40 or details",
      "description": "Project description",
      "image_urls": ["url1", "url2", "url3"],
      "brochure_url": "PDF download URL if available",
      "page_url": "Full URL to project page"
    }
  ]
}`,
        lovableKey
      ) as { developer_info: Record<string, unknown>; projects: ScrapedProject[] };

      const projects = extracted.projects || [];
      console.log(`Found ${projects.length} projects for ${developerSlug}`);

      // Update developer info
      if (extracted.developer_info) {
        await supabase
          .from("developers")
          .update({
            description: extracted.developer_info.description as string || developer.description,
            logo_url: extracted.developer_info.logo_url as string || developer.logo_url,
            founded_year: extracted.developer_info.founded_year as number || developer.founded_year,
            completed_projects: extracted.developer_info.completed_projects as number || developer.completed_projects,
            offplan_projects: extracted.developer_info.offplan_projects as number || developer.offplan_projects,
            updated_at: new Date().toISOString(),
          })
          .eq("id", developer.id);
      }

      // Upsert projects
      let projectsCreated = 0;
      let projectsUpdated = 0;

      for (const proj of projects) {
        const projectSlug = proj.slug.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
        
        const { data: existing } = await supabase
          .from("projects")
          .select("id")
          .eq("slug", projectSlug)
          .maybeSingle();

        const projectData = {
          name: proj.name,
          slug: projectSlug,
          developer_id: developer.id,
          location: proj.location,
          emirate: proj.emirate || "Dubai",
          status: proj.status?.toLowerCase().includes("ready") ? "ready" : "off-plan",
          price_from: proj.price_from,
          price_to: proj.price_to,
          bedrooms_min: parseInt(proj.bedrooms?.match(/\d+/)?.[0] || "1"),
          bedrooms_max: parseInt(proj.bedrooms?.match(/\d+$/)?.[0] || proj.bedrooms?.match(/\d+/)?.[0] || "4"),
          handover_date: proj.handover_date,
          payment_plan: proj.payment_plan,
          description: proj.description,
          is_offplan: !proj.status?.toLowerCase().includes("ready"),
          is_developer_direct: true,
          source_url: proj.page_url || developerUrl,
          updated_at: new Date().toISOString(),
        };

        let projectId: string;

        if (existing) {
          await supabase
            .from("projects")
            .update(projectData)
            .eq("id", existing.id);
          projectId = existing.id;
          projectsUpdated++;
        } else {
          const { data: newProject } = await supabase
            .from("projects")
            .insert(projectData)
            .select("id")
            .single();
          projectId = newProject?.id;
          projectsCreated++;
        }

        // Insert project images (clear existing first to avoid duplicates)
        if (projectId && proj.image_urls && proj.image_urls.length > 0) {
          // Delete existing images for this project
          await supabase
            .from("project_images")
            .delete()
            .eq("project_id", projectId);

          // Insert new images
          const imageRecords = proj.image_urls.slice(0, 20).map((url, index) => ({
            project_id: projectId,
            image_url: url,
            alt_text: `${proj.name} - Image ${index + 1}`,
            display_order: index,
          }));

          await supabase.from("project_images").insert(imageRecords);
        }

        // Insert brochure if available
        if (projectId && proj.brochure_url) {
          const { data: existingDoc } = await supabase
            .from("project_documents")
            .select("id")
            .eq("project_id", projectId)
            .eq("document_type", "brochure")
            .maybeSingle();

          if (!existingDoc) {
            await supabase.from("project_documents").insert({
              project_id: projectId,
              document_type: "brochure",
              file_url: proj.brochure_url,
              file_name: `${proj.name} Brochure.pdf`,
            });
          }
        }
      }

      return new Response(JSON.stringify({
        success: true,
        step: "developer_projects",
        developer: developerSlug,
        projects_found: projects.length,
        projects_created: projectsCreated,
        projects_updated: projectsUpdated,
        projects: projects.map(p => ({ name: p.name, slug: p.slug, images: p.image_urls?.length || 0 })),
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // STEP 3: Scrape detailed project page for complete data
    if (step === "project_detail") {
      const { projectUrl, projectId } = body;
      
      if (!projectUrl || !projectId) {
        return new Response(JSON.stringify({ error: "projectUrl and projectId required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      console.log(`Step 3: Scraping project detail: ${projectUrl}`);
      
      const scraped = await scrapeWithFirecrawl(projectUrl, firecrawlKey, ["markdown", "links"]);

      if (!scraped.markdown || !lovableKey) {
        return new Response(JSON.stringify({ error: "Failed to scrape project page" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const extracted = await extractWithAI(
        scraped.markdown + "\n\nLinks:\n" + (scraped.links || []).join("\n"),
        `Extract COMPLETE project details from this Provident Estate project page.

Return JSON:
{
  "project": {
    "name": "Project Name",
    "description": "Full detailed description",
    "location": "Area, Community",
    "emirate": "Dubai",
    "status": "Off-Plan or Ready",
    "property_types": ["Apartments", "Penthouses"],
    "bedrooms_available": ["Studio", "1BR", "2BR", "3BR", "4BR"],
    "sizes": { "min_sqft": 500, "max_sqft": 5000 },
    "prices": { "from": 1000000, "to": 10000000 },
    "payment_plan": "60/40 payment plan details",
    "handover_date": "Q4 2026",
    "developer": "Developer Name",
    "amenities": ["Pool", "Gym", "Spa"],
    "features": ["Sea View", "Smart Home"],
    "image_urls": ["all", "gallery", "images"],
    "floor_plan_urls": ["floor", "plan", "images"],
    "brochure_url": "PDF download link",
    "location_map": { "lat": 25.0, "lng": 55.0 }
  }
}`,
        lovableKey
      ) as { project: ScrapedProject };

      const proj = extracted.project;

      // Update project with complete data
      await supabase
        .from("projects")
        .update({
          description: proj.description,
          amenities: (proj as unknown as { amenities?: string[] }).amenities,
          facilities: (proj as unknown as { features?: string[] }).features,
          size_min: (proj as unknown as { sizes?: { min_sqft?: number } }).sizes?.min_sqft,
          size_max: (proj as unknown as { sizes?: { max_sqft?: number } }).sizes?.max_sqft,
          updated_at: new Date().toISOString(),
        })
        .eq("id", projectId);

      // Update images
      if (proj.image_urls && proj.image_urls.length > 0) {
        await supabase.from("project_images").delete().eq("project_id", projectId);
        
        const imageRecords = proj.image_urls.map((url, index) => ({
          project_id: projectId,
          image_url: url,
          alt_text: `${proj.name} - Image ${index + 1}`,
          display_order: index,
        }));
        
        await supabase.from("project_images").insert(imageRecords);
      }

      return new Response(JSON.stringify({
        success: true,
        step: "project_detail",
        project: proj.name,
        images_added: proj.image_urls?.length || 0,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // STEP 4: Full sync - orchestrates all steps
    if (step === "full_sync") {
      console.log("Starting full sync...");
      
      // First, get all developers
      const devResponse = await fetch(`${supabaseUrl}/functions/v1/provident-full-sync`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${supabaseServiceKey}`,
        },
        body: JSON.stringify({ step: "developers" }),
      });

      const devResult = await devResponse.json();
      
      if (!devResult.success) {
        return new Response(JSON.stringify({ error: "Failed to fetch developers", details: devResult }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const syncResults = {
        developers_found: devResult.developers_found,
        developers_created: devResult.created,
        developers_updated: devResult.updated,
        projects_synced: 0,
        errors: [] as string[],
      };

      // Then sync each developer's projects (limit for testing)
      const developersToSync = limit ? devResult.developers.slice(0, limit) : devResult.developers;
      
      for (const dev of developersToSync) {
        try {
          const projResponse = await fetch(`${supabaseUrl}/functions/v1/provident-full-sync`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${supabaseServiceKey}`,
            },
            body: JSON.stringify({ step: "developer_projects", developerSlug: dev.slug }),
          });

          const projResult = await projResponse.json();
          if (projResult.success) {
            syncResults.projects_synced += projResult.projects_found;
          } else {
            syncResults.errors.push(`${dev.name}: ${projResult.error}`);
          }
        } catch (err) {
          syncResults.errors.push(`${dev.name}: ${err instanceof Error ? err.message : "Unknown error"}`);
        }
      }

      return new Response(JSON.stringify({
        success: true,
        step: "full_sync",
        ...syncResults,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ 
      error: "Invalid step. Use: developers, developer_projects, project_detail, or full_sync" 
    }), {
      status: 400,
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
