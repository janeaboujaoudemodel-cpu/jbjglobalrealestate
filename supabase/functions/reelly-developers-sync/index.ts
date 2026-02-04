import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ReellyDeveloper {
  id: number;
  name: string;
  website: string;
  description: string;
  logo: {
    url: string;
    metadata?: {
      mime?: string;
      size?: number;
      width?: number;
      height?: number;
    };
  } | null;
  status: string;
  social_links: any[];
  phone: string | null;
  email: string;
  working_hours: any;
  offices: Array<{
    id: number;
    developer: number;
    country: any;
    region: string | null;
    city: string | null;
    address: string | null;
    working_hours: any;
    is_main: boolean;
    email: string | null;
    name: string | null;
  }>;
}

// Response can be an array directly or paginated object
type ReellyDevelopersResponse = ReellyDeveloper[] | {
  count: number;
  next: string | null;
  previous: string | null;
  results: ReellyDeveloper[];
};

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function mapReellyDeveloperToDb(dev: ReellyDeveloper) {
  // Get main office or first office for headquarters
  const mainOffice = dev.offices?.find(o => o.is_main) || dev.offices?.[0];
  const headquarters = mainOffice?.address || mainOffice?.region || null;

  return {
    name: dev.name.trim(),
    slug: generateSlug(dev.name),
    logo_url: dev.logo?.url || null,
    description: dev.description || null,
    headquarters: headquarters,
    // Store Reelly ID in a predictable way for deduplication
    // We'll use the name + slug combo for matching since there's no external_id column
  };
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
    const mode = body.mode || "test"; // "test", "quick", "full"
    const limit = mode === "quick" ? 50 : mode === "full" ? 1000 : 20;

    console.log(`[ReellyDevSync] Mode: ${mode}, Limit: ${limit}`);

    // Fetch developers from Reelly API
    const apiUrl = `https://api-reelly.up.railway.app/api/v2/clients/developers?limit=${limit}&offset=0`;
    
    const response = await fetch(apiUrl, {
      headers: {
        "X-API-Key": apiKey,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[ReellyDevSync] API Error: ${response.status} - ${errorText}`);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Reelly API error: ${response.status}`,
          details: errorText.substring(0, 500)
        }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const rawData = await response.json();
    
    // Handle both array and paginated response formats
    const developers: ReellyDeveloper[] = Array.isArray(rawData) ? rawData : rawData.results || [];
    const totalCount = Array.isArray(rawData) ? rawData.length : rawData.count || developers.length;
    
    console.log(`[ReellyDevSync] Fetched ${developers.length} developers (total: ${totalCount})`);

    if (mode === "test") {
      // Just return stats for test mode
      return new Response(
        JSON.stringify({
          success: true,
          mode: "test",
          total_available: totalCount,
          sample_count: developers.length,
          sample_developers: developers.slice(0, 5).map(d => ({
            id: d.id,
            name: d.name,
            has_logo: !!d.logo?.url,
            has_description: !!d.description,
            offices_count: d.offices?.length || 0,
          })),
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Sync mode - process developers
    let inserted = 0;
    let updated = 0;
    let skipped = 0;
    let errors = 0;
    const errorDetails: string[] = [];

    // Get existing developers for matching
    const { data: existingDevs } = await supabase
      .from("developers")
      .select("id, name, slug");
    
    const existingBySlug = new Map(
      (existingDevs || []).map(d => [d.slug, d])
    );
    const existingByName = new Map(
      (existingDevs || []).map(d => [d.name.toLowerCase().trim(), d])
    );

    for (const dev of developers) {
      try {
        const mapped = mapReellyDeveloperToDb(dev);
        
        // Check if developer already exists by slug or name
        const existingBySlugMatch = existingBySlug.get(mapped.slug);
        const existingByNameMatch = existingByName.get(mapped.name.toLowerCase().trim());
        const existing = existingBySlugMatch || existingByNameMatch;

        if (existing) {
          // Update existing developer
          const { error: updateError } = await supabase
            .from("developers")
            .update({
              logo_url: mapped.logo_url || existing.logo_url,
              description: mapped.description || existing.description,
              headquarters: mapped.headquarters || existing.headquarters,
              updated_at: new Date().toISOString(),
            })
            .eq("id", existing.id);

          if (updateError) {
            console.error(`[ReellyDevSync] Update error for ${dev.name}:`, updateError);
            errors++;
            errorDetails.push(`Update ${dev.name}: ${updateError.message}`);
          } else {
            updated++;
          }
        } else {
          // Insert new developer
          const { error: insertError } = await supabase
            .from("developers")
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
              console.error(`[ReellyDevSync] Insert error for ${dev.name}:`, insertError);
              errors++;
              errorDetails.push(`Insert ${dev.name}: ${insertError.message}`);
            }
          } else {
            inserted++;
          }
        }
      } catch (err) {
        console.error(`[ReellyDevSync] Error processing ${dev.name}:`, err);
        errors++;
        errorDetails.push(`${dev.name}: ${err.message}`);
      }
    }

    console.log(`[ReellyDevSync] Complete: ${inserted} inserted, ${updated} updated, ${skipped} skipped, ${errors} errors`);

    return new Response(
      JSON.stringify({
        success: true,
        mode,
        total_available: totalCount,
        processed: developers.length,
        inserted,
        updated,
        skipped,
        errors,
        error_details: errorDetails.slice(0, 10),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[ReellyDevSync] Fatal error:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || "Unknown error occurred"
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
