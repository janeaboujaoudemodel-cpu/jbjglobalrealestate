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

function generateAreaSlug(name: string): string {
  return name.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 100);
}

function generateDeveloperSlug(name: string): string {
  return name.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 100);
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
    "Out of Stock": "Sold Out",
    "Presale (EOI)": "Presale (EOI)",
    "Start of Sales": "Start of Sales",
    // Snake case variants
    "announced": "Announced",
    "on_sale": "On Sale",
    "out_of_stock": "Sold Out",
    "presale_eoi": "Presale (EOI)",
    "start_of_sales": "Start of Sales",
    // Legacy mappings for backward compatibility
    "available": "On Sale",
    "coming_soon": "Announced",
    "limited": "On Sale",
    "sold_out": "Sold Out",
  };
  
  return statusMap[status] || status;
}

// Determine emirate/country from region
function getEmirateFromRegion(region: string): string {
  const regionMap: Record<string, string> = {
    'dubai': 'Dubai',
    'abu dhabi': 'Abu Dhabi',
    'sharjah': 'Sharjah',
    'ajman': 'Ajman',
    'ras al khaimah': 'Ras Al Khaimah',
    'fujairah': 'Fujairah',
    'umm al quwain': 'Umm Al Quwain',
    // International
    'cyprus': 'Cyprus',
    'indonesia': 'Indonesia',
    'oman': 'Oman',
    'thailand': 'Thailand',
  };
  
  const normalized = region?.toLowerCase().trim();
  return regionMap[normalized] || region || 'Dubai';
}

// ============================================================
// NEW: Extract payment plan from description/overview text
// ============================================================
function extractPaymentPlanFromOverview(overview: string | null): {
  payment_plan: string | null;
  payment_breakdown: Record<string, string> | null;
} {
  if (!overview) return { payment_plan: null, payment_breakdown: null };
  
  // Pattern 1: "60/40", "70/30", "80/20" payment plan
  const ratioMatch = overview.match(/(\d{2})\/(\d{2})\s*(?:payment|plan)?/i);
  if (ratioMatch) {
    const first = parseInt(ratioMatch[1], 10);
    const second = parseInt(ratioMatch[2], 10);
    if (first + second === 100) {
      const booking = Math.min(first, 20);
      const construction = first - booking;
      return {
        payment_plan: `${first}/${second}`,
        payment_breakdown: {
          down_payment: `${booking}%`,
          during_construction: `${construction}%`,
          on_completion: `${second}%`,
        }
      };
    }
  }
  
  // Pattern 2: "10% down payment", "20% on booking", "40% on handover"
  const downPaymentMatch = overview.match(/(\d+)%?\s*(?:down\s*payment|on\s*booking|booking)/i);
  const handoverMatch = overview.match(/(\d+)%?\s*(?:on\s*handover|on\s*completion|handover|completion)/i);
  const constructionMatch = overview.match(/(\d+)%?\s*(?:during\s*construction|construction)/i);
  
  if (downPaymentMatch || handoverMatch) {
    const down = downPaymentMatch ? parseInt(downPaymentMatch[1], 10) : 10;
    const handover = handoverMatch ? parseInt(handoverMatch[1], 10) : 40;
    const construction = constructionMatch 
      ? parseInt(constructionMatch[1], 10) 
      : Math.max(0, 100 - down - handover);
    
    return {
      payment_plan: `${down + construction}/${handover}`,
      payment_breakdown: {
        down_payment: `${down}%`,
        during_construction: `${construction}%`,
        on_completion: `${handover}%`,
      }
    };
  }
  
  // Pattern 3: "Easy payment plan" or "Flexible payment" without specifics
  if (/easy\s*payment|flexible\s*payment/i.test(overview)) {
    return {
      payment_plan: "Flexible",
      payment_breakdown: null
    };
  }
  
  return { payment_plan: null, payment_breakdown: null };
}

// ============================================================
// NEW: Get or create developer and return its UUID
// ============================================================
async function getOrCreateDeveloper(
  supabase: ReturnType<typeof createClient>,
  developerName: string | null
): Promise<string | null> {
  if (!developerName || developerName.trim() === '') return null;
  
  const name = developerName.trim();
  const slug = generateDeveloperSlug(name);
  
  // Try to find existing developer by name (case-insensitive)
  const { data: existing } = await supabase
    .from("developers")
    .select("id")
    .ilike("name", name)
    .maybeSingle();
  
  if (existing) {
    return existing.id;
  }
  
  // Try by slug as fallback
  const { data: existingBySlug } = await supabase
    .from("developers")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();
  
  if (existingBySlug) {
    return existingBySlug.id;
  }
  
  // Create new developer
  const { data: newDev, error } = await supabase
    .from("developers")
    .insert({
      name: name,
      slug: slug,
      is_active: true,
    })
    .select("id")
    .single();
  
  if (error) {
    // Handle duplicate key error (race condition)
    if ((error as any)?.code === "23505") {
      const { data: retried } = await supabase
        .from("developers")
        .select("id")
        .ilike("name", name)
        .maybeSingle();
      return retried?.id || null;
    }
    console.error(`[Reelly API] Error creating developer ${name}:`, error);
    return null;
  }
  
  console.log(`[Reelly API] Created new developer: ${name} (${newDev?.id})`);
  return newDev?.id || null;
}

// ============================================================
// Check if a project is complete enough for auto-approval
// RELAXED CRITERIA: No price requirement, accept developer_name
// ============================================================
function isProjectComplete(data: any): boolean {
  return !!(
    data.name &&
    data.description && data.description.length > 20 && // Relaxed from 50
    (data.developer_id || data.developer_name) && // Accept either
    data.images && data.images.length > 0
    // Removed: price_from requirement
  );
}

// ============================================================
// Auto-approve complete project to live projects table
// ============================================================
async function autoApproveToProjects(
  supabase: ReturnType<typeof createClient>,
  mappedProject: any,
  pendingImportId: string
): Promise<boolean> {
  try {
    // Build project data for the live projects table
    const projectData = {
      name: mappedProject.name,
      slug: mappedProject.slug,
      description: mappedProject.description,
      short_description: mappedProject.description?.substring(0, 200) || null,
      developer_id: mappedProject.developer_id,
      developer_name: mappedProject.developer_name,
      area_id: mappedProject.area_id,
      location: mappedProject.location,
      emirate: mappedProject.emirate,
      latitude: mappedProject.latitude,
      longitude: mappedProject.longitude,
      price_from: mappedProject.price_from,
      price_to: mappedProject.price_to,
      size_min: mappedProject.size_min,
      size_max: mappedProject.size_max,
      handover_date: mappedProject.handover_date,
      handover_display: mappedProject.handover_display,
      status_label: mappedProject.status_label,
      images: mappedProject.images,
      total_units: mappedProject.total_units,
      floors: mappedProject.floors,
      payment_plan: mappedProject.payment_plan,
      payment_breakdown: mappedProject.payment_breakdown,
      construction_progress: mappedProject.construction_progress,
      video_url: mappedProject.video_url,
      is_offplan: true,
      is_active: true,
      source: 'reelly',
      source_url: mappedProject.source_url,
    };

    // Upsert to projects table (use slug as conflict key)
    const { error: projectError } = await supabase
      .from("projects")
      .upsert(projectData, { onConflict: "slug" });

    if (projectError) {
      console.error(`[Reelly API] Failed to auto-approve ${mappedProject.name}:`, projectError);
      return false;
    }

    // Mark pending import as approved
    const { error: updateError } = await supabase
      .from("pending_project_imports")
      .update({ 
        status: "approved", 
        reviewed_at: new Date().toISOString(),
        review_notes: "AUTO_APPROVED: Complete data from Reelly API"
      })
      .eq("id", pendingImportId);

    if (updateError) {
      console.error(`[Reelly API] Failed to update pending import status:`, updateError);
      return false;
    }

    console.log(`[Reelly API] Auto-approved: ${mappedProject.name}`);
    return true;
  } catch (err) {
    console.error(`[Reelly API] Auto-approve error:`, err);
    return false;
  }
}

function mapReellyToImport(project: ReellyProject, areaId: string | null, developerId: string | null) {
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

  // Get area name from district
  const areaName = project.location?.district || null;

  // Extract payment plan from overview/description
  const overview = project.overview || project.short_description || '';
  const { payment_plan, payment_breakdown } = extractPaymentPlanFromOverview(overview);

  return {
    name: project.name,
    slug: `${slug}-${project.id}`, // Ensure uniqueness with ID suffix
    developer_name: project.developer,
    developer_id: developerId, // NEW: Link to developers table
    location: locationStr,
    emirate: getEmirateFromRegion(project.location?.region),
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
    // Payment plan extracted from overview
    payment_plan: payment_plan,
    payment_breakdown: payment_breakdown,
    // Area reference
    area_id: areaId,
    area_name: areaName,
    // Use source_url to store external_id for deduplication
    source_url: `https://reelly.io/project/${project.id}#${externalId}`,
    // Clear review notes since Reelly data is structured
    review_notes: null,
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

// Upsert an area and return its ID
async function upsertArea(
  supabase: ReturnType<typeof createClient>,
  location: ReellyLocation | null
): Promise<string | null> {
  if (!location?.district) return null;
  
  const areaName = location.district;
  const areaSlug = generateAreaSlug(areaName);
  const emirate = getEmirateFromRegion(location.region);
  
  // Try to find existing area
  const { data: existing } = await supabase
    .from("areas")
    .select("id")
    .eq("slug", areaSlug)
    .maybeSingle();
  
  if (existing) {
    return existing.id;
  }
  
  // Insert new area
  const { data: newArea, error } = await supabase
    .from("areas")
    .insert({
      name: areaName,
      slug: areaSlug,
      emirate: emirate,
      latitude: location.latitude || null,
      longitude: location.longitude || null,
      is_active: true,
      is_trending: false,
    })
    .select("id")
    .single();
  
  if (error) {
    // Handle duplicate key error (race condition)
    if ((error as any)?.code === "23505") {
      const { data: retried } = await supabase
        .from("areas")
        .select("id")
        .eq("slug", areaSlug)
        .maybeSingle();
      return retried?.id || null;
    }
    console.error(`[Reelly API] Error inserting area ${areaName}:`, error);
    return null;
  }
  
  return newArea?.id || null;
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
      autoApprove?: boolean; // NEW: Auto-approve complete projects
      // legacy
      fullSync?: boolean;
    } = {
      action: "sync",
      limit: 50,
      cursor: null,
      autoApprove: true, // Default to auto-approve
    };
    try {
      const body = await req.json();
      options = { ...options, ...body };
    } catch {
      // No body provided, use defaults
    }

    console.log(`[Reelly API] Starting with action: ${options.action}, autoApprove: ${options.autoApprove}`);

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

    // Process ALL projects (removed is_published filter to get full 1803)
    const projectsToProcess = projects;
    console.log(`[Reelly API] ${projectsToProcess.length} projects to process (all projects, no filter)`);

    // Process and upsert projects
    let inserted = 0;
    let updated = 0;
    let skipped = 0;
    let autoApproved = 0;
    let areasCreated = 0;
    let developersCreated = 0;
    const errors: string[] = [];

    for (const project of projectsToProcess) {
      try {
        // Upsert area first and get its ID
        const areaId = await upsertArea(supabase, project.location);
        if (areaId && !await areaExisted(supabase, project.location?.district)) {
          areasCreated++;
        }
        
        // Get or create developer and get its UUID
        const developerId = await getOrCreateDeveloper(supabase, project.developer);
        if (developerId) {
          // Track new developers (optional - could add a check here)
        }
        
        const mappedProject = mapReellyToImport(project, areaId, developerId);

        // Check if exists by source_url pattern (contains reelly_ID)
        const externalId = `reelly_${project.id}`;
        const { data: existing } = await supabase
          .from("pending_project_imports")
          .select("id, status")
          .like("source_url", `%${externalId}%`)
          .maybeSingle();

        let pendingImportId: string | null = null;

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
          pendingImportId = existing.id;
        } else {
          // Insert new
          const { data: insertedRow, error } = await supabase
            .from("pending_project_imports")
            .insert({
              ...mappedProject,
              status: "pending",
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .select("id")
            .single();

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
                pendingImportId = existingBySlug.id;
                continue;
              }
            }

            throw error;
          }

          inserted++;
          pendingImportId = insertedRow?.id || null;
        }

        // AUTO-APPROVE: If project is complete, push to live projects table
        if (options.autoApprove && pendingImportId && isProjectComplete(mappedProject)) {
          const approved = await autoApproveToProjects(supabase, mappedProject, pendingImportId);
          if (approved) {
            autoApproved++;
          }
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
        page_processed: projectsToProcess.length,
        inserted,
        updated,
        skipped,
        auto_approved: autoApproved,
        areas_created: areasCreated,
        developers_linked: projectsToProcess.length - errors.length,
        errors: errors.slice(0, 10),
        next_cursor: nextCursor,
        done: !nextCursor,
        message: `Processed ${projects.length} projects (${inserted} new, ${updated} updated, ${skipped} skipped, ${autoApproved} auto-approved, ${areasCreated} new areas)`,
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

// Helper to check if area already existed before this sync
async function areaExisted(supabase: ReturnType<typeof createClient>, areaName: string | undefined): Promise<boolean> {
  if (!areaName) return true;
  const slug = generateAreaSlug(areaName);
  const { data } = await supabase
    .from("areas")
    .select("created_at")
    .eq("slug", slug)
    .maybeSingle();
  
  if (!data) return false;
  
  // If created more than 1 minute ago, it existed before
  const createdAt = new Date(data.created_at);
  const now = new Date();
  return (now.getTime() - createdAt.getTime()) > 60000;
}
