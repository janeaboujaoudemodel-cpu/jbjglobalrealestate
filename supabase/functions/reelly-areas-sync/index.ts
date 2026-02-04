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

// Response types - areas are paginated
interface ReellyAreasResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: ReellyArea[];
}

// Possible API endpoints to try
const POSSIBLE_ENDPOINTS = [
  "https://api-reelly.up.railway.app/api/v2/clients/areas",
  "https://api-reelly.up.railway.app/api/v2/clients/area",
  "https://api-reelly.up.railway.app/api/v2/clients/locations/areas",
  "https://api-reelly.up.railway.app/api/v2/clients/locations/area",
  "https://api-reelly.up.railway.app/api/v2/clients/districts",
  "https://api-reelly.up.railway.app/api/v2/clients/district",
];

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

async function findWorkingEndpoint(apiKey: string): Promise<{ endpoint: string; data: ReellyAreasResponse } | null> {
  for (const baseUrl of POSSIBLE_ENDPOINTS) {
    const testUrl = `${baseUrl}?limit=5&offset=0`;
    console.log(`[ReellyAreasSync] Trying endpoint: ${testUrl}`);
    
    try {
      const res = await fetch(testUrl, {
        headers: {
          "X-API-Key": apiKey,
          "Content-Type": "application/json",
        },
      });

      if (res.ok) {
        const data = await res.json();
        // Check if it looks like a paginated response
        if (data && typeof data.count === "number" && Array.isArray(data.results)) {
          console.log(`[ReellyAreasSync] Found working endpoint: ${baseUrl}`);
          return { endpoint: baseUrl, data };
        }
      } else {
        console.log(`[ReellyAreasSync] Endpoint ${baseUrl} returned ${res.status}`);
        await res.text(); // consume response
      }
    } catch (err) {
      console.log(`[ReellyAreasSync] Error testing ${baseUrl}:`, err);
    }
  }
  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("REELLY_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ success: false, error: "REELLY_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json().catch(() => ({}));
    const action = body.action || "test"; // "test" or "sync_areas"
    const limit = body.limit || 100;
    const emirate = body.emirate || "Dubai"; // Default emirate for areas

    console.log(`[ReellyAreasSync] Action: ${action}, Limit: ${limit}`);

    // Find working endpoint
    const result = await findWorkingEndpoint(apiKey);
    
    if (!result) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Could not find working areas endpoint",
          tried_endpoints: POSSIBLE_ENDPOINTS,
        }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { endpoint: workingEndpoint, data: initialData } = result;

    // Test mode - just return stats
    if (action === "test") {
      const knownEmirates = ["Dubai", "Abu Dhabi", "Sharjah", "Ajman", "Ras Al Khaimah", "Fujairah", "Umm Al Quwain"];

      return new Response(
        JSON.stringify({
          success: true,
          mode: "test",
          areas_count: initialData.count,
          emirates: knownEmirates,
          emirates_count: knownEmirates.length,
          sample_areas: initialData.results.slice(0, 5).map(a => ({ id: a.id, name: a.name })),
          working_endpoint: workingEndpoint,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Sync areas
    if (action === "sync_areas") {
      let offset = 0;
      let totalAreas = initialData.count;
      let inserted = 0;
      let updated = 0;
      let skipped = 0;
      let errors = 0;
      const errorDetails: string[] = [];
      const allAreas: ReellyArea[] = [];

      // Paginate through all areas
      do {
        const areasUrl = `${workingEndpoint}?limit=${limit}&offset=${offset}`;
        
        const areasRes = await fetch(areasUrl, {
          headers: {
            "X-API-Key": apiKey,
            "Content-Type": "application/json",
          },
        });

        if (!areasRes.ok) {
          const errorText = await areasRes.text();
          console.error(`[ReellyAreasSync] Areas API Error at offset ${offset}: ${areasRes.status} - ${errorText}`);
          break;
        }

        const areasData: ReellyAreasResponse = await areasRes.json();
        totalAreas = areasData.count;
        
        console.log(`[ReellyAreasSync] Fetched ${areasData.results.length} areas (offset: ${offset}, total: ${totalAreas})`);
        
        allAreas.push(...areasData.results);
        offset += limit;

        // Safety limit
        if (offset > 10000) break;
        
      } while (offset < totalAreas);

      console.log(`[ReellyAreasSync] Processing ${allAreas.length} areas`);

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

      for (const area of allAreas) {
        try {
          const mapped = mapReellyAreaToDb(area, emirate);
          
          // Check if area exists by reelly_id or slug
          const existingByIdMatch = existingByReellyId.get(area.id);
          const existingBySlugMatch = existingBySlug.get(mapped.slug);
          const existing = existingByIdMatch || existingBySlugMatch;

          if (existing) {
            // Update existing area
            const { error: updateError } = await supabase
              .from("areas")
              .update({
                reelly_id: area.id,
                description: mapped.description || existing.description,
                updated_at: new Date().toISOString(),
              })
              .eq("id", existing.id);

            if (updateError) {
              console.error(`[ReellyAreasSync] Update error for ${area.name}:`, updateError);
              errors++;
              errorDetails.push(`Update ${area.name}: ${updateError.message}`);
            } else {
              updated++;
            }
          } else {
            // Insert new area
            const { error: insertError } = await supabase
              .from("areas")
              .insert({
                ...mapped,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              });

            if (insertError) {
              if (insertError.code === "23505") {
                // Duplicate key - skip
                skipped++;
              } else {
                console.error(`[ReellyAreasSync] Insert error for ${area.name}:`, insertError);
                errors++;
                errorDetails.push(`Insert ${area.name}: ${insertError.message}`);
              }
            } else {
              inserted++;
            }
          }
        } catch (err: any) {
          console.error(`[ReellyAreasSync] Error processing ${area.name}:`, err);
          errors++;
          errorDetails.push(`${area.name}: ${err.message}`);
        }
      }

      console.log(`[ReellyAreasSync] Complete: ${inserted} inserted, ${updated} updated, ${skipped} skipped, ${errors} errors`);

      return new Response(
        JSON.stringify({
          success: true,
          action,
          total_available: totalAreas,
          processed: allAreas.length,
          inserted,
          updated,
          skipped,
          errors,
          error_details: errorDetails.slice(0, 10),
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Default response
    return new Response(
      JSON.stringify({
        success: true,
        message: "Use action: 'test' or 'sync_areas'",
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
