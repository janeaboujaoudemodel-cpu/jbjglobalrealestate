import { createClient } from "@supabase/supabase-js";

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

function mapReellyDeveloperToDb(dev: ReellyDeveloper): ReturnType<typeof mapReellyDeveloperToDb> | null {
  // Skip developers with null/empty names
  if (!dev.name || typeof dev.name !== 'string' || !dev.name.trim()) {
    return null;
  }

  // Get main office or first office for headquarters
  const mainOffice = dev.offices?.find(o => o.is_main) || dev.offices?.[0];
  const headquarters = mainOffice?.address || mainOffice?.region || null;

  return {
    name: dev.name.trim(),
    slug: generateSlug(dev.name),
    logo_url: dev.logo?.url || null,
    description: dev.description || null,
    headquarters: headquarters,
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

    console.log(`[ReellyDevSync] Mode: ${mode}`);

    // For test mode, just fetch one page to get the count
    if (mode === "test") {
      const apiUrl = `https://api-reelly.up.railway.app/api/v2/clients/developers?limit=5&offset=0`;
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
      const developers = Array.isArray(rawData) ? rawData : rawData.results || [];
      const totalCount = Array.isArray(rawData) ? rawData.length : rawData.count || developers.length;

      return new Response(
        JSON.stringify({
          success: true,
          mode: "test",
          total_available: totalCount,
          sample_count: developers.length,
          sample_developers: developers.slice(0, 5).map((d: ReellyDeveloper) => ({
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

    // For quick/full sync: paginate through ALL developers
    const pageSize = mode === "quick" ? 50 : 100;
    const maxPages = mode === "quick" ? 1 : 100; // Quick = 1 page (50), Full = up to 100 pages (10,000 max)
    
    let allDevelopers: ReellyDeveloper[] = [];
    let offset = 0;
    let totalCount = 0;
    let pagesFetched = 0;

    while (pagesFetched < maxPages) {
      const apiUrl = `https://api-reelly.up.railway.app/api/v2/clients/developers?limit=${pageSize}&offset=${offset}`;
      console.log(`[ReellyDevSync] Fetching page ${pagesFetched + 1}: ${apiUrl}`);
      
      const response = await fetch(apiUrl, {
        headers: {
          "X-API-Key": apiKey,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[ReellyDevSync] API Error on page ${pagesFetched + 1}: ${response.status} - ${errorText}`);
        // If we already have some data, continue with what we have
        if (allDevelopers.length > 0) {
          console.log(`[ReellyDevSync] Continuing with ${allDevelopers.length} developers already fetched`);
          break;
        }
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
      const developers = Array.isArray(rawData) ? rawData : rawData.results || [];
      totalCount = Array.isArray(rawData) ? rawData.length : rawData.count || totalCount;
      
      allDevelopers = [...allDevelopers, ...developers];
      pagesFetched++;
      
      console.log(`[ReellyDevSync] Page ${pagesFetched}: fetched ${developers.length} developers (total so far: ${allDevelopers.length}/${totalCount})`);

      // Check if we've fetched all developers
      if (developers.length < pageSize || !rawData.next) {
        console.log(`[ReellyDevSync] No more pages - reached end of results`);
        break;
      }
      
      offset += pageSize;
    }

    const developers = allDevelopers;
    console.log(`[ReellyDevSync] Total fetched: ${developers.length} developers across ${pagesFetched} pages`);

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
        
        // Skip developers with invalid data (null/empty name)
        if (!mapped) {
          skipped++;
          console.log(`[ReellyDevSync] Skipped developer with invalid/null name (ID: ${dev.id})`);
          continue;
        }
        
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
