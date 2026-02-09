import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ExtractedDeveloper {
  name: string;
  slug: string;
  description?: string;
  logo_url?: string;
  headquarters?: string;
  founded_year?: number;
  website_url?: string;
  projects?: ExtractedProject[];
}

interface ExtractedProject {
  name: string;
  slug: string;
  location?: string;
  emirate?: string;
  status?: string;
  price_from?: number;
  price_to?: number;
  bedrooms_min?: number;
  bedrooms_max?: number;
  handover_date?: string;
  description?: string;
  payment_plan?: string;
  image_urls?: string[];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const firecrawlKey = Deno.env.get("FIRECRAWL_API_KEY");
    const lovableKey = Deno.env.get("LOVABLE_API_KEY");

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { sourceId, manual = false } = await req.json().catch(() => ({}));
    
    // Create job log
    const { data: jobLog, error: jobError } = await supabase
      .from("extraction_job_logs")
      .insert({
        source_id: sourceId || null,
        status: "running",
        started_at: new Date().toISOString(),
        records_found: 0,
        records_matched: 0,
        records_pending: 0,
      })
      .select()
      .single();

    if (jobError) {
      console.error("Failed to create job log:", jobError);
    }

    const jobId = jobLog?.id;

    // Get Provident Estate source
    const { data: sources } = await supabase
      .from("external_data_sources")
      .select("*")
      .eq("is_active", true)
      .ilike("name", "%provident%");

    if (!sources || sources.length === 0) {
      throw new Error("No active Provident Estate data source found");
    }

    const source = sources[0];
    let extractedDevelopers: ExtractedDeveloper[] = [];

    // Attempt Firecrawl scrape if key available
    if (firecrawlKey) {
      try {
        console.log("Scraping developers list from Provident Estate...");
        
        const scrapeResponse = await fetch("https://api.firecrawl.dev/v1/scrape", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${firecrawlKey}`,
          },
          body: JSON.stringify({
            url: source.base_url,
            formats: ["markdown", "links"],
            waitFor: 3000,
          }),
        });

        if (scrapeResponse.ok) {
          const scrapeData = await scrapeResponse.json();
          
          // Use AI to extract developer data if Lovable key available
          if (lovableKey && scrapeData.data?.markdown) {
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
                    content: `You are a data extraction assistant for UAE real estate developers. 
Extract developer information from the provided content. Only extract OFF-PLAN and DEVELOPER-DIRECT properties.
DO NOT include secondary market, resale, or investor-to-investor listings.

Return a JSON array of developers with their projects.`
                  },
                  {
                    role: "user",
                    content: `Extract all UAE property developers and their off-plan projects from this content:

${scrapeData.data.markdown.substring(0, 30000)}

Return JSON in this format:
{
  "developers": [
    {
      "name": "Developer Name",
      "slug": "developer-slug",
      "description": "Brief description",
      "headquarters": "City, Country",
      "projects": [
        {
          "name": "Project Name",
          "slug": "project-slug",
          "location": "Area, City",
          "emirate": "Dubai",
          "status": "off-plan",
          "price_from": 1000000,
          "bedrooms_min": 1,
          "bedrooms_max": 4,
          "handover_date": "Q4 2025"
        }
      ]
    }
  ]
}`
                  }
                ],
                temperature: 0.1,
                max_tokens: 8000,
              }),
            });

            if (aiResponse.ok) {
              const aiData = await aiResponse.json();
              const content = aiData.choices?.[0]?.message?.content || "";
              
              // Parse JSON from response
              const jsonMatch = content.match(/\{[\s\S]*\}/);
              if (jsonMatch) {
                try {
                  const parsed = JSON.parse(jsonMatch[0]);
                  extractedDevelopers = parsed.developers || [];
                } catch (e) {
                  console.error("Failed to parse AI response:", e);
                }
              }
            }
          }
        }
      } catch (scrapeError) {
        console.error("Firecrawl scrape failed:", scrapeError);
      }
    }

    // Process extracted data
    let recordsCreated = 0;
    let recordsUpdated = 0;
    let recordsFlagged = 0;

    // Get existing developers for comparison
    const { data: existingDevelopers } = await supabase
      .from("developers")
      .select("id, name, slug");

    const existingBySlug = new Map(
      (existingDevelopers || []).map(d => [d.slug.toLowerCase(), d])
    );

    for (const dev of extractedDevelopers) {
      const normalizedSlug = dev.slug.toLowerCase().replace(/\s+/g, "-");
      const existing = existingBySlug.get(normalizedSlug);

      if (existing) {
        // Update sync status - mark as seen
        await supabase
          .from("developer_sync_status")
          .upsert({
            developer_id: existing.id,
            source_name: "provident_estate",
            last_seen_at: new Date().toISOString(),
            is_flagged_for_review: false,
          }, {
            onConflict: "developer_id,source_name",
          });

        // Update developer description if empty
        if (dev.description) {
          await supabase
            .from("developers")
            .update({ description: dev.description })
            .eq("id", existing.id)
            .is("description", null);
        }

        recordsUpdated++;

        // Process projects for this developer
        if (dev.projects && dev.projects.length > 0) {
          for (const proj of dev.projects) {
            const projectSlug = proj.slug || proj.name.toLowerCase().replace(/\s+/g, "-");
            
            // Check if project exists
            const { data: existingProject } = await supabase
              .from("projects")
              .select("id")
              .eq("slug", projectSlug)
              .maybeSingle();

            if (!existingProject) {
              // Create new project
              const { data: newProject, error: projError } = await supabase
                .from("projects")
                .insert({
                  name: proj.name,
                  slug: projectSlug,
                  developer_id: existing.id,
                  location: proj.location,
                  emirate: proj.emirate || "Dubai",
                  status: proj.status || "available",
                  price_from: proj.price_from,
                  price_to: proj.price_to,
                  bedrooms_min: proj.bedrooms_min,
                  bedrooms_max: proj.bedrooms_max,
                  handover_date: proj.handover_date,
                  description: proj.description,
                  payment_plan: proj.payment_plan,
                  is_offplan: true,
                  is_developer_direct: true,
                  source_url: source.base_url,
                })
                .select()
                .single();

              if (newProject) {
                recordsCreated++;
                
                // Track project sync status
                await supabase
                  .from("project_sync_status")
                  .insert({
                    project_id: newProject.id,
                    source_name: "provident_estate",
                    source_url: source.base_url,
                    last_seen_at: new Date().toISOString(),
                  });
              }
            } else {
              // Update sync status
              await supabase
                .from("project_sync_status")
                .upsert({
                  project_id: existingProject.id,
                  source_name: "provident_estate",
                  last_seen_at: new Date().toISOString(),
                  is_flagged_for_review: false,
                }, {
                  onConflict: "project_id,source_name",
                });
            }
          }
        }
      } else {
        // New developer - create with pending review flag
        const { data: newDev, error: devError } = await supabase
          .from("developers")
          .insert({
            name: dev.name,
            slug: normalizedSlug,
            description: dev.description,
            logo_url: dev.logo_url,
            headquarters: dev.headquarters || "Dubai, UAE",
            founded_year: dev.founded_year,
            rank: 20, // Default rank for new developers
          })
          .select()
          .single();

        if (newDev) {
          recordsCreated++;
          
          // Track sync status
          await supabase
            .from("developer_sync_status")
            .insert({
              developer_id: newDev.id,
              source_name: "provident_estate",
              last_seen_at: new Date().toISOString(),
            });
        }
      }
    }

    // Flag developers not seen in this sync (potential removals from source)
    const seenSlugs = new Set(extractedDevelopers.map(d => d.slug.toLowerCase().replace(/\s+/g, "-")));
    
    for (const [slug, dev] of existingBySlug) {
      if (!seenSlugs.has(slug)) {
        // Check if this developer was previously synced from Provident
        const { data: syncStatus } = await supabase
          .from("developer_sync_status")
          .select("*")
          .eq("developer_id", dev.id)
          .eq("source_name", "provident_estate")
          .maybeSingle();

        if (syncStatus) {
          // Flag for admin review - DO NOT DELETE
          await supabase
            .from("developer_sync_status")
            .update({
              is_flagged_for_review: true,
              flag_reason: "Developer not found in latest source extraction. May have been removed from source.",
              updated_at: new Date().toISOString(),
            })
            .eq("id", syncStatus.id);

          recordsFlagged++;
        }
      }
    }

    // Update job log
    if (jobId) {
      await supabase
        .from("extraction_job_logs")
        .update({
          status: "completed",
          completed_at: new Date().toISOString(),
          records_found: extractedDevelopers.length,
          records_matched: recordsUpdated,
          records_pending: recordsFlagged,
        })
        .eq("id", jobId);
    }

    // Update source last extraction time
    await supabase
      .from("external_data_sources")
      .update({ last_extraction_at: new Date().toISOString() })
      .eq("id", source.id);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Developer and project sync completed",
        stats: {
          developersFound: extractedDevelopers.length,
          recordsCreated,
          recordsUpdated,
          recordsFlagged,
        },
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: unknown) {
    console.error("Sync error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error during sync";
    
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
