import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ReellyArea {
  id: number;
  name: string;
  description: string | null;
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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json().catch(() => ({}));
    const action = body.action || "extract_from_projects"; // "import", "extract_from_projects"
    const emirate = body.emirate || "Dubai";
    const areasData = body.areas as ReellyArea[] | undefined; // For manual import

    console.log(`[ReellyAreasSync] Action: ${action}`);

    // Manual import mode - when you have the areas JSON data
    if (action === "import" && areasData && Array.isArray(areasData)) {
      let inserted = 0;
      let updated = 0;
      let skipped = 0;
      let errors = 0;
      const errorDetails: string[] = [];

      // Get existing areas for matching
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
        } catch (err: any) {
          errors++;
          errorDetails.push(`${area.name}: ${err.message}`);
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

    // Extract areas from existing projects in pending_project_imports
    if (action === "extract_from_projects") {
      // Get unique area names from pending_project_imports
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

      // Create unique area entries
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

      // Get existing areas
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
        } catch (err: any) {
          errors++;
          errorDetails.push(`${area.name}: ${err.message}`);
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
        message: "Use action: 'import' (with areas array) or 'extract_from_projects'",
        usage: {
          import: {
            action: "import",
            areas: [{ id: 1, name: "Downtown Dubai", description: "..." }],
            emirate: "Dubai"
          },
          extract_from_projects: {
            action: "extract_from_projects"
          }
        }
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("[ReellyAreasSync] Fatal error:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || "Unknown error occurred"
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
