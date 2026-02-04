import { createClient } from "@supabase/supabase-js";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Reelly API configuration - confirmed endpoint
const REELLY_API_BASE = "https://api-reelly.up.railway.app/api/v2/clients/projects";

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
  polygon?: any;
}

interface ReellyCoverImage {
  url: string;
  metadata?: {
    mime: string;
    size: number;
    width: number;
    height: number;
  };
}

interface ReellyProject {
  id: number;
  name: string;
  developer: string;
  construction_status: string;
  sale_status: string;
  overview: string | null;
  short_description: string | null;
  managing_company: string | null;
  completion_date: string | null;
  completion_datetime: string | null;
  brand: string | null;
  construction_start_date: string | null;
  construction_end_date: string | null;
  is_partner_project: boolean;
  building_count: number;
  units_count: number;
  location: ReellyLocation;
  min_price: number;
  max_price: number;
  min_size: number;
  max_size: number;
  price_currency: string;
  area_unit: string;
  video_reviews: any[];
  is_published: boolean;
  cover_image: ReellyCoverImage | null;
  updated_at: string;
}

interface ReellyResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: ReellyProject[];
}

function generateSlug(name: string, developer: string): string {
  const base = `${name}-${developer}`.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  return base.slice(0, 100); // Limit slug length
}

function mapConstructionStatus(status: string): string {
  const statusMap: Record<string, string> = {
    'under_construction': 'Under Construction',
    'completed': 'Completed',
    'off_plan': 'Off-Plan',
    'pre_launch': 'Pre-Launch',
    'ready': 'Ready',
  };
  return statusMap[status] || status;
}

// Map sale status from API to normalized database value
function mapSaleStatus(status: string): string | null {
  if (!status) return null;
  
  const statusMap: Record<string, string> = {
    // Exact matches from Reelly API
    "Announced": "Announced",
    "On Sale": "On Sale",
    "Out of Stock": "Out of Stock",
    "Presale (EOI)": "Presale (EOI)",
    "Start of Sales": "Start of Sales",
    // Snake case variants
    "announced": "Announced",
    "on_sale": "On Sale",
    "out_of_stock": "Out of Stock",
    "presale_eoi": "Presale (EOI)",
    "start_of_sales": "Start of Sales",
    // Legacy mappings for backward compatibility
    "available": "On Sale",
    "coming_soon": "Announced",
    "limited": "On Sale",
    "sold_out": "Out of Stock",
  };
  
  return statusMap[status] || status;
}

function mapReellyToImport(project: ReellyProject) {
  const slug = generateSlug(project.name, project.developer);
  
  // Parse handover date from completion_datetime
  let handoverDate: string | null = null;
  if (project.completion_datetime) {
    handoverDate = project.completion_datetime.split('T')[0];
  } else if (project.construction_end_date) {
    handoverDate = project.construction_end_date;
  }
  // Use completion_date display format if no date parsed
  if (!handoverDate && project.completion_date) {
    handoverDate = project.completion_date;
  }

  // Extract images as JSONB array matching table schema
  const images: Array<{ url: string; alt_text: string; display_order: number }> = [];
  if (project.cover_image?.url) {
    images.push({
      url: project.cover_image.url,
      alt_text: `${project.name} - Cover Image`,
      display_order: 0,
    });
  }

  // Build location string
  const locationParts: string[] = [];
  if (project.location?.district) locationParts.push(project.location.district);
  if (project.location?.sector && project.location.sector !== project.location.district) {
    locationParts.push(project.location.sector);
  }
  const locationStr = locationParts.join(', ') || null;

  // Use external_id in source_url for tracking
  const externalId = `reelly_${project.id}`;

  // Extract video URL from video_reviews if available
  let videoUrl: string | null = null;
  if (project.video_reviews && Array.isArray(project.video_reviews) && project.video_reviews.length > 0) {
    const firstVideo = project.video_reviews[0];
    if (typeof firstVideo === 'string') {
      videoUrl = firstVideo;
    } else if (firstVideo?.url) {
      videoUrl = firstVideo.url;
    }
  }

  // Map construction status to progress percentage estimate
  let constructionProgress: number | null = null;
  if (project.construction_status === 'completed' || project.construction_status === 'ready') {
    constructionProgress = 100;
  } else if (project.construction_status === 'under_construction') {
    constructionProgress = 50; // Estimate mid-construction
  } else if (project.construction_status === 'off_plan' || project.construction_status === 'pre_launch') {
    constructionProgress = 0;
  }

  return {
    name: project.name,
    slug: `${slug}-${project.id}`, // Ensure uniqueness with ID suffix
    developer_name: project.developer,
    location: locationStr,
    emirate: project.location?.region || 'Dubai',
    description: project.overview || project.short_description || null,
    price_from: project.min_price > 0 ? project.min_price : null,
    price_to: project.max_price > 0 ? project.max_price : null,
    size_min: project.min_size > 0 ? project.min_size : null,
    size_max: project.max_size > 0 ? project.max_size : null,
    floors: project.building_count > 0 ? project.building_count : null,
    handover_date: handoverDate,
    handover_display: project.completion_date || null, // Human-readable like "DEC 2024"
    status_label: mapSaleStatus(project.sale_status) || mapConstructionStatus(project.construction_status),
    images: images.length > 0 ? images : null,
    // Geo coordinates for map display
    latitude: project.location?.latitude || null,
    longitude: project.location?.longitude || null,
    // Additional Reelly fields
    total_units: project.units_count > 0 ? project.units_count : null,
    construction_start_date: project.construction_start_date || null,
    construction_progress: constructionProgress,
    video_url: videoUrl,
    // Use source_url to store external_id for deduplication
    source_url: `https://reelly.io/project/${project.id}#${externalId}`,
  };
}

// Helper to extract external_id from source_url
function getExternalIdFromSourceUrl(sourceUrl: string): string | null {
  const match = sourceUrl.match(/#(reelly_\d+)$/);
  return match ? match[1] : null;
}

async function fetchProjectsPage(apiKey: string, url: string): Promise<ReellyResponse> {
  console.log(`[Reelly API] Fetching: ${url}`);
  
  const response = await fetch(url, {
    method: "GET",
    headers: {
      "X-API-Key": apiKey,
      "Accept": "application/json",
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Reelly API error ${response.status}: ${errorText.slice(0, 200)}`);
  }

  return await response.json();
}

function assertValidCursorUrl(url: string) {
  // Prevent SSRF / arbitrary URL fetching: only allow the known Reelly endpoint.
  const parsed = new URL(url);
  if (parsed.origin !== "https://api-reelly.up.railway.app") {
    throw new Error("Invalid cursor origin");
  }
  if (!parsed.pathname.startsWith("/api/v2/clients/projects")) {
    throw new Error("Invalid cursor path");
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("REELLY_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "REELLY_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse request body for options
    let options: {
      action?: "test" | "sync";
      limit?: number;
      cursor?: string | null;
      // legacy
      fullSync?: boolean;
    } = {
      action: "sync",
      limit: 50,
      cursor: null,
    };
    try {
      const body = await req.json();
      options = { ...options, ...body };
    } catch {
      // No body provided, use defaults
    }

    console.log(`[Reelly API] Starting with action: ${options.action}`);

    // Test connection
    if (options.action === 'test') {
      const data = await fetchProjectsPage(apiKey, `${REELLY_API_BASE}?limit=3`);
      return new Response(
        JSON.stringify({
          success: true,
          message: `Reelly API connected! Found ${data.count} total projects.`,
          total_available: data.count,
          sample: data.results.slice(0, 2).map(p => ({
            id: p.id,
            name: p.name,
            developer: p.developer,
            location: p.location?.district,
          })),
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch ONE page per request to avoid timeouts; UI can loop using next_cursor.
    const limit = Math.min(Math.max(Number(options.limit ?? 50), 1), 100);
    const cursor = options.cursor ? String(options.cursor) : null;

    const pageUrl = cursor ?? `${REELLY_API_BASE}?limit=${limit}`;
    assertValidCursorUrl(pageUrl);

    const page = await fetchProjectsPage(apiKey, pageUrl);
    const projects = page.results;
    const totalAvailable = page.count;
    const nextCursor = page.next;
    console.log(`[Reelly API] Page fetched ${projects.length} of ${totalAvailable} total projects`);

    // Filter to only published projects
    const publishedProjects = projects.filter(p => p.is_published);
    console.log(`[Reelly API] ${publishedProjects.length} published projects to process`);

    // Process and upsert projects
    let inserted = 0;
    let updated = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const project of publishedProjects) {
      try {
        const mappedProject = mapReellyToImport(project);

        // Check if exists by source_url pattern (contains reelly_ID)
        const externalId = `reelly_${project.id}`;
        const { data: existing } = await supabase
          .from("pending_project_imports")
          .select("id, status")
          .like("source_url", `%${externalId}%`)
          .maybeSingle();

        if (existing) {
          // Only update if not already approved
          if (existing.status === 'approved') {
            skipped++;
            continue;
          }
          
          const { error } = await supabase
            .from("pending_project_imports")
            .update({
              ...mappedProject,
              updated_at: new Date().toISOString(),
            })
            .eq("id", existing.id);

          if (error) throw error;
          updated++;
        } else {
          // Insert new
          const { error } = await supabase
            .from("pending_project_imports")
            .insert({
              ...mappedProject,
              status: "pending",
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            });

          if (error) {
            // If this project was inserted previously with a different source_url pattern,
            // fall back to updating by slug instead of failing the whole request.
            if ((error as any)?.code === "23505" || String((error as any)?.message || "").includes("duplicate key")) {
              const { data: existingBySlug } = await supabase
                .from("pending_project_imports")
                .select("id, status")
                .eq("slug", mappedProject.slug)
                .maybeSingle();

              if (existingBySlug) {
                if (existingBySlug.status === "approved") {
                  skipped++;
                  continue;
                }

                const { error: updateErr } = await supabase
                  .from("pending_project_imports")
                  .update({
                    ...mappedProject,
                    updated_at: new Date().toISOString(),
                  })
                  .eq("id", existingBySlug.id);

                if (updateErr) throw updateErr;
                updated++;
                continue;
              }
            }

            throw error;
          }

          inserted++;
        }
      } catch (err) {
        const errorDetails = err && typeof err === 'object' && 'message' in err 
          ? (err as any).message 
          : JSON.stringify(err);
        const errMsg = `${project.name}: ${errorDetails}`;
        console.error(`[Reelly API] Error:`, errMsg);
        errors.push(errMsg);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        total_available: totalAvailable,
        page_fetched: projects.length,
        page_published: publishedProjects.length,
        inserted,
        updated,
        skipped,
        errors: errors.slice(0, 10),
        next_cursor: nextCursor,
        done: !nextCursor,
        message: `Processed ${projects.length} projects (${inserted} new, ${updated} updated, ${skipped} skipped)`,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[Reelly API] Error:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : String(error) 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
