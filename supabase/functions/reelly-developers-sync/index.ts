import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ReellyOffice {
  id: number;
  developer: number;
  country: any;
  region: string | null;
  city: string | null;
  address: string | null;
  working_hours: any;
  is_main: boolean;
  email: string | null;
  phone: string | null;
  name: string | null;
}

interface ReellySocialLink {
  type: string;
  url: string;
}

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
  social_links: ReellySocialLink[] | any[];
  phone: string | null;
  email: string;
  working_hours: any;
  offices: ReellyOffice[];
  // Extended fields
  founded_year?: number;
  projects_count?: number;
  total_units?: number;
  country?: string;
  region?: string;
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

function extractSocialLinks(socialLinks: ReellySocialLink[] | any[]): Record<string, string> | null {
  if (!socialLinks || !Array.isArray(socialLinks) || socialLinks.length === 0) {
    return null;
  }

  const links: Record<string, string> = {};
  
  for (const link of socialLinks) {
    if (link.type && link.url) {
      const type = String(link.type).toLowerCase();
      links[type] = link.url;
    }
  }

  return Object.keys(links).length > 0 ? links : null;
}

function formatWorkingHours(workingHours: any): string | null {
  if (!workingHours) return null;
  
  if (typeof workingHours === 'string') {
    return workingHours;
  }
  
  if (typeof workingHours === 'object') {
    // Try to format as "Mon-Fri: 9AM-6PM" style
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const formatted: string[] = [];
    
    for (const day of days) {
      if (workingHours[day]) {
        const hours = workingHours[day];
        if (hours.start && hours.end) {
          formatted.push(`${day.slice(0, 3).toUpperCase()}: ${hours.start}-${hours.end}`);
        }
      }
    }
    
    return formatted.length > 0 ? formatted.join(', ') : JSON.stringify(workingHours);
  }
  
  return null;
}

function mapReellyDeveloperToDb(dev: ReellyDeveloper): {
  name: string;
  slug: string;
  logo_url: string | null;
  description: string | null;
  headquarters: string | null;
  founded_year: number | null;
  completed_projects: number | null;
  offplan_projects: number | null;
} | null {
  // Skip developers with null/empty names
  if (!dev.name || typeof dev.name !== 'string' || !dev.name.trim()) {
    return null;
  }

  // Get main office or first office for headquarters
  const mainOffice = dev.offices?.find(o => o.is_main) || dev.offices?.[0];
  
  // Build headquarters string from office data
  let headquarters: string | null = null;
  if (mainOffice) {
    const parts: string[] = [];
    if (mainOffice.city) parts.push(mainOffice.city);
    if (mainOffice.region) parts.push(mainOffice.region);
    headquarters = parts.length > 0 ? parts.join(', ') : null;
  }

  return {
    name: dev.name.trim(),
    slug: generateSlug(dev.name),
    logo_url: dev.logo?.url || null,
    description: dev.description || null,
    headquarters: headquarters,
    founded_year: dev.founded_year || null,
    completed_projects: dev.total_units || null,
    offplan_projects: dev.projects_count || null,
  };
}

async function fetchWithRetry(url: string, headers: Record<string, string>, maxRetries = 3): Promise<Response> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 25000); // 25s timeout
      
      const response = await fetch(url, { headers, signal: controller.signal });
      clearTimeout(timeout);
      
      if (response.ok) return response;
      
      // Retry on 5xx errors
      if (response.status >= 500 && attempt < maxRetries) {
        const delay = Math.min(5000 * Math.pow(2, attempt - 1), 30000);
        console.log(`[ReellyDevSync] Attempt ${attempt} got ${response.status}, retrying in ${delay}ms...`);
        await response.text(); // consume body
        await new Promise(r => setTimeout(r, delay));
        continue;
      }
      
      return response; // Return non-retryable errors as-is
    } catch (err: any) {
      if (attempt < maxRetries) {
        const delay = Math.min(5000 * Math.pow(2, attempt - 1), 30000);
        console.log(`[ReellyDevSync] Attempt ${attempt} failed (${err.name}), retrying in ${delay}ms...`);
        await new Promise(r => setTimeout(r, delay));
        continue;
      }
      throw err;
    }
  }
  throw new Error("Max retries exceeded");
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

    const apiHeaders = {
      "X-API-Key": apiKey,
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    };

    // For test mode, just fetch one page to get the count
    if (mode === "test") {
      const apiUrl = `https://api-reelly.up.railway.app/api/v2/clients/developers?limit=5&offset=0`;
      const response = await fetchWithRetry(apiUrl, apiHeaders);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[ReellyDevSync] API Error: ${response.status} - ${errorText}`);
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: `Reelly API error: ${response.status}`,
            details: errorText.substring(0, 500)
          }),
          { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
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
            has_website: !!d.website,
            has_social_links: !!(d.social_links?.length),
            offices_count: d.offices?.length || 0,
          })),
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // For quick/full sync: paginate through ALL developers
    const pageSize = mode === "quick" ? 50 : 100;
    const maxPages = mode === "quick" ? 1 : 100;
    
    let allDevelopers: ReellyDeveloper[] = [];
    let offset = 0;
    let totalCount = 0;
    let pagesFetched = 0;

    while (pagesFetched < maxPages) {
      const apiUrl = `https://api-reelly.up.railway.app/api/v2/clients/developers?limit=${pageSize}&offset=${offset}`;
      console.log(`[ReellyDevSync] Fetching page ${pagesFetched + 1}: ${apiUrl}`);
      
      let response: Response;
      try {
        response = await fetchWithRetry(apiUrl, apiHeaders);
      } catch (err: any) {
        console.error(`[ReellyDevSync] All retries failed on page ${pagesFetched + 1}: ${err.message}`);
        if (allDevelopers.length > 0) {
          console.log(`[ReellyDevSync] Continuing with ${allDevelopers.length} developers already fetched`);
          break;
        }
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: `Reelly API unreachable after retries`,
            details: err.message
          }),
          { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[ReellyDevSync] API Error on page ${pagesFetched + 1}: ${response.status} - ${errorText}`);
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
          { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const rawData = await response.json();
      const developers = Array.isArray(rawData) ? rawData : rawData.results || [];
      totalCount = Array.isArray(rawData) ? rawData.length : rawData.count || totalCount;
      
      allDevelopers = [...allDevelopers, ...developers];
      pagesFetched++;
      
      console.log(`[ReellyDevSync] Page ${pagesFetched}: fetched ${developers.length} developers (total so far: ${allDevelopers.length}/${totalCount})`);

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
        
        if (!mapped) {
          skipped++;
          console.log(`[ReellyDevSync] Skipped developer with invalid/null name (ID: ${dev.id})`);
          continue;
        }
        
        const existingBySlugMatch = existingBySlug.get(mapped.slug);
        const existingByNameMatch = existingByName.get(mapped.name.toLowerCase().trim());
        const existing = existingBySlugMatch || existingByNameMatch;

        if (existing) {
          const updateData: Record<string, any> = {
            updated_at: new Date().toISOString(),
          };

          if (mapped.logo_url) updateData.logo_url = mapped.logo_url;
          if (mapped.description) updateData.description = mapped.description;
          if (mapped.headquarters) updateData.headquarters = mapped.headquarters;
          if (mapped.founded_year) updateData.founded_year = mapped.founded_year;
          if (mapped.completed_projects) updateData.completed_projects = mapped.completed_projects;
          if (mapped.offplan_projects) updateData.offplan_projects = mapped.offplan_projects;

          const { error: updateError } = await supabase
            .from("developers")
            .update(updateData)
            .eq("id", existing.id);

          if (updateError) {
            console.error(`[ReellyDevSync] Update error for ${dev.name}:`, updateError);
            errors++;
            errorDetails.push(`Update ${dev.name}: ${updateError.message}`);
          } else {
            updated++;
          }
        } else {
          const insertData = {
            name: mapped.name,
            slug: mapped.slug,
            logo_url: mapped.logo_url,
            description: mapped.description,
            headquarters: mapped.headquarters,
            founded_year: mapped.founded_year,
            completed_projects: mapped.completed_projects,
            offplan_projects: mapped.offplan_projects,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };

          const { error: insertError } = await supabase
            .from("developers")
            .insert(insertData);

          if (insertError) {
            if (insertError.code === "23505") {
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
      } catch (err: any) {
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

  } catch (error: any) {
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
