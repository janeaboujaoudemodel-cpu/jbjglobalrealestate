import { createClient } from "@supabase/supabase-js";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ReellyLocation {
  id: number;
  country: number;
  region: string;
  city: string | null;
  district: string;
  sector: string;
  village: string | null;
  latitude: number;
  longitude: number;
}

interface ReellyProject {
  id: number;
  name: string;
  location: ReellyLocation;
  is_published: boolean;
}

interface ReellyArea {
  id: number;
  name: string;
  description: string | null;
}

interface ReellyPaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function mapReellyAreaToDb(area: ReellyArea, emirate: string = "Dubai") {
  return {
    reelly_id: area.id,
    name: area.name.trim(),
    slug: generateSlug(area.name),
    description: area.description || null,
    emirate: emirate,
    is_active: true,
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("REELLY_API_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json().catch(() => ({}));
    const action = body.action || "sync_from_api";
    const areasData = body.areas as ReellyArea[] | undefined;

    console.log(`[ReellyAreasSync] Action: ${action}`);

    // ========== Sync from Reelly API by extracting areas from projects ==========
    if (action === "sync_from_api" || action === "test") {
      if (!apiKey) {
        return new Response(
          JSON.stringify({ success: false, error: "REELLY_API_KEY not configured" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const limit = action === "test" ? 200 : 500;
      const apiUrl = `https://api-reelly.up.railway.app/api/v2/clients/projects?limit=${limit}&offset=0`;
      
      console.log(`[ReellyAreasSync] Fetching projects from: ${apiUrl}`);
      
      const response = await fetch(apiUrl, {
        headers: {
          "X-API-Key": apiKey,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[ReellyAreasSync] API Error: ${response.status} - ${errorText}`);
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: `Reelly API error: ${response.status}`,
            details: errorText.substring(0, 500)
          }),
          { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const rawData: ReellyPaginatedResponse<ReellyProject> = await response.json();
      const projects = rawData.results || [];
      const totalProjects = rawData.count || projects.length;
      
      console.log(`[ReellyAreasSync] Fetched ${projects.length} projects (total: ${totalProjects})`);

      // Extract unique areas from project locations
      const uniqueAreas = new Map<string, { 
        name: string; 
        emirate: string; 
        locationId: number;
        latitude?: number;
        longitude?: number;
        sector?: string;
      }>();

      for (const project of projects) {
        if (project.location?.district) {
          const areaName = project.location.district.trim();
          const key = areaName.toLowerCase();
          
          if (!uniqueAreas.has(key) && areaName.length > 0) {
            uniqueAreas.set(key, {
              name: areaName,
              emirate: project.location.region || "Dubai",
              locationId: project.location.id,
              latitude: project.location.latitude,
              longitude: project.location.longitude,
              sector: project.location.sector,
            });
          }
        }
      }

      console.log(`[ReellyAreasSync] Found ${uniqueAreas.size} unique areas from ${projects.length} projects`);

      // Test mode - just return stats
      if (action === "test") {
        const sampleAreas = Array.from(uniqueAreas.values()).slice(0, 15);
        return new Response(
          JSON.stringify({
            success: true,
            mode: "test",
            total_projects_scanned: projects.length,
            total_projects_available: totalProjects,
            unique_areas_found: uniqueAreas.size,
            sample_areas: sampleAreas.map(a => ({
              name: a.name,
              emirate: a.emirate,
              sector: a.sector,
              has_coordinates: !!(a.latitude && a.longitude),
            })),
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Sync mode - upsert areas to database
      let inserted = 0;
      let updated = 0;
      let skipped = 0;
      let errors = 0;
      const errorDetails: string[] = [];

      const { data: existingAreas } = await supabase
        .from("areas")
        .select("id, reelly_id, slug, name, description, latitude, longitude");
      
      const existingBySlug = new Map(
        (existingAreas || []).map(a => [a.slug, a])
      );

      for (const [, area] of uniqueAreas) {
        try {
          const slug = generateSlug(area.name);
          const existing = existingBySlug.get(slug);

          if (existing) {
            const updates: Record<string, unknown> = {
              updated_at: new Date().toISOString(),
            };
            
            if (area.latitude && area.longitude && !existing.latitude) {
              updates.latitude = area.latitude;
              updates.longitude = area.longitude;
            }
            
            if (area.locationId && !existing.reelly_id) {
              updates.reelly_id = area.locationId;
            }

            const { error: updateError } = await supabase
              .from("areas")
              .update(updates)
              .eq("id", existing.id);

            if (updateError) {
              errors++;
              errorDetails.push(`Update ${area.name}: ${updateError.message}`);
            } else {
              updated++;
            }
          } else {
            const { error: insertError } = await supabase
              .from("areas")
              .insert({
                name: area.name,
                slug,
                emirate: area.emirate,
                reelly_id: area.locationId,
                latitude: area.latitude || null,
                longitude: area.longitude || null,
                is_active: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              });

            if (insertError) {
              if (insertError.code === "23505") {
                skipped++;
              } else {
                errors++;
                errorDetails.push(`Insert ${area.name}: ${insertError.message}`);
              }
            } else {
              inserted++;
            }
          }
        } catch (err) {
          errors++;
          const errMsg = err instanceof Error ? err.message : String(err);
          errorDetails.push(`${area.name}: ${errMsg}`);
        }
      }

      console.log(`[ReellyAreasSync] Sync complete: ${inserted} inserted, ${updated} updated, ${skipped} skipped, ${errors} errors`);

      return new Response(
        JSON.stringify({
          success: true,
          action: "sync_from_api",
          projects_scanned: projects.length,
          total_projects_available: totalProjects,
          unique_areas_found: uniqueAreas.size,
          inserted,
          updated,
          skipped,
          errors,
          error_details: errorDetails.slice(0, 10),
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Manual import mode
    if (action === "import" && areasData && Array.isArray(areasData)) {
      const emirate = body.emirate || "Dubai";
      let inserted = 0;
      let updated = 0;
      let skipped = 0;
      let errors = 0;
      const errorDetails: string[] = [];

      const { data: existingAreas } = await supabase
        .from("areas")
        .select("id, reelly_id, slug, name, description");
      
      const existingByReellyId = new Map(
        (existingAreas || []).filter(a => a.reelly_id).map(a => [a.reelly_id, a])
      );
      const existingBySlug = new Map(
        (existingAreas || []).map(a => [a.slug, a])
      );

      for (const area of areasData) {
        try {
          const mapped = mapReellyAreaToDb(area, emirate);
          
          const existingByIdMatch = existingByReellyId.get(area.id);
          const existingBySlugMatch = existingBySlug.get(mapped.slug);
          const existing = existingByIdMatch || existingBySlugMatch;

          if (existing) {
            const { error: updateError } = await supabase
              .from("areas")
              .update({
                reelly_id: area.id,
                description: mapped.description || existing.description,
                updated_at: new Date().toISOString(),
              })
              .eq("id", existing.id);

            if (updateError) {
              errors++;
              errorDetails.push(`Update ${area.name}: ${updateError.message}`);
            } else {
              updated++;
            }
          } else {
            const { error: insertError } = await supabase
              .from("areas")
              .insert({
                ...mapped,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              });

            if (insertError) {
              if (insertError.code === "23505") {
                skipped++;
              } else {
                errors++;
                errorDetails.push(`Insert ${area.name}: ${insertError.message}`);
              }
            } else {
              inserted++;
            }
          }
        } catch (err) {
          errors++;
          const errMsg = err instanceof Error ? err.message : String(err);
          errorDetails.push(`${area.name}: ${errMsg}`);
        }
      }

      console.log(`[ReellyAreasSync] Import complete: ${inserted} inserted, ${updated} updated, ${skipped} skipped, ${errors} errors`);

      return new Response(
        JSON.stringify({
          success: true,
          action: "import",
          total_provided: areasData.length,
          inserted,
          updated,
          skipped,
          errors,
          error_details: errorDetails.slice(0, 10),
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Extract areas from pending_project_imports
    if (action === "extract_from_projects") {
      const { data: projectAreas, error: fetchError } = await supabase
        .from("pending_project_imports")
        .select("area_name, emirate")
        .not("area_name", "is", null)
        .neq("area_name", "");

      if (fetchError) {
        return new Response(
          JSON.stringify({ success: false, error: fetchError.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const uniqueAreas = new Map<string, { name: string; emirate: string }>();
      for (const p of projectAreas || []) {
        if (p.area_name) {
          const key = p.area_name.toLowerCase().trim();
          if (!uniqueAreas.has(key)) {
            uniqueAreas.set(key, { 
              name: p.area_name.trim(), 
              emirate: p.emirate || "Dubai" 
            });
          }
        }
      }

      console.log(`[ReellyAreasSync] Found ${uniqueAreas.size} unique areas from projects`);

      const { data: existingAreas } = await supabase
        .from("areas")
        .select("id, slug, name");
      
      const existingBySlug = new Map(
        (existingAreas || []).map(a => [a.slug, a])
      );

      let inserted = 0;
      let skipped = 0;
      let errors = 0;
      const errorDetails: string[] = [];

      for (const [, area] of uniqueAreas) {
        try {
          const slug = generateSlug(area.name);
          
          if (existingBySlug.has(slug)) {
            skipped++;
            continue;
          }

          const { error: insertError } = await supabase
            .from("areas")
            .insert({
              name: area.name,
              slug,
              emirate: area.emirate,
              is_active: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            });

          if (insertError) {
            if (insertError.code === "23505") {
              skipped++;
            } else {
              errors++;
              errorDetails.push(`${area.name}: ${insertError.message}`);
            }
          } else {
            inserted++;
          }
        } catch (err) {
          errors++;
          const errMsg = err instanceof Error ? err.message : String(err);
          errorDetails.push(`${area.name}: ${errMsg}`);
        }
      }

      console.log(`[ReellyAreasSync] Extract complete: ${inserted} inserted, ${skipped} skipped, ${errors} errors`);

      return new Response(
        JSON.stringify({
          success: true,
          action: "extract_from_projects",
          unique_areas_found: uniqueAreas.size,
          inserted,
          skipped,
          errors,
          error_details: errorDetails.slice(0, 10),
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Default response with usage
    return new Response(
      JSON.stringify({
        success: true,
        message: "Use action: 'sync_from_api', 'test', 'import', or 'extract_from_projects'",
        usage: {
          sync_from_api: {
            action: "sync_from_api",
            description: "Fetches projects from Reelly API and extracts unique areas/districts"
          },
          test: {
            action: "test",
            description: "Test connection and show sample areas without saving"
          },
          import: {
            action: "import",
            areas: [{ id: 1, name: "Downtown Dubai", description: "..." }],
            emirate: "Dubai"
          },
          extract_from_projects: {
            action: "extract_from_projects",
            description: "Extract areas from pending_project_imports table"
          }
        }
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[ReellyAreasSync] Fatal error:", error);
    const errMsg = error instanceof Error ? error.message : "Unknown error occurred";
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errMsg
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});