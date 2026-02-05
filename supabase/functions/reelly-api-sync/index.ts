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

// Extended image type for gallery
interface ReellyImage {
  url: string;
  alt_text?: string;
  type?: string;
  metadata?: {
    mime?: string;
    size?: number;
    width?: number;
    height?: number;
  };
}

// Video review type
interface ReellyVideoReview {
  url: string;
  title?: string;
  thumbnail_url?: string;
}

// Document type for brochures, floor plans, etc.
interface ReellyDocument {
  url: string;
  name?: string;
  type?: string;
  file_type?: string;
}

// Unit type with pricing
interface ReellyUnit {
  id?: number;
  type?: string;
  name?: string;
  bedrooms?: number;
  bathrooms?: number;
  size_min?: number;
  size_max?: number;
  size?: number;
  price_from?: number;
  price_to?: number;
  price?: number;
  available?: number;
  count?: number;
}

// Floor plan type
interface ReellyFloorPlan {
  id?: number;
  type?: string;
  name?: string;
  url: string;
  image_url?: string;
  label?: string;
  bedrooms?: number;
}

// Amenity type
interface ReellyAmenity {
  id?: number;
  name: string;
  icon?: string;
  category?: string;
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
  video_reviews: ReellyVideoReview[];
  is_published: boolean;
  cover_image: ReellyCoverImage | null;
  updated_at: string;
  // NEW: Extended fields from detail endpoint
  images?: ReellyImage[];
  gallery?: ReellyImage[];
  documents?: ReellyDocument[];
  brochures?: ReellyDocument[];
  floor_plans?: ReellyFloorPlan[];
  units?: ReellyUnit[];
  unit_types?: ReellyUnit[];
  amenities?: (ReellyAmenity | string)[];
  facilities?: (ReellyAmenity | string)[];
  features?: string[];
  highlights?: string[];
  faqs?: Array<{ question: string; answer: string }>;
  payment_plan?: {
    name?: string;
    description?: string;
    milestones?: Array<{ percentage: number; description: string; date?: string }>;
  };
  // ROI/Investment data
  roi_estimate?: number;
  rental_yield_estimate?: number;
  service_charge?: number;
}

interface ReellyResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: ReellyProject[];
}

// Detailed project response (single project endpoint)
interface ReellyDetailResponse extends ReellyProject {
  // All extended fields included
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
// NEW: Extract payment plan from description/overview or API data
// ============================================================
function extractPaymentPlanFromOverview(overview: string | null, apiPaymentPlan?: ReellyProject['payment_plan']): {
  payment_plan: string | null;
  payment_breakdown: Record<string, string> | null;
} {
  // First check if API provides payment plan data
  if (apiPaymentPlan?.milestones && apiPaymentPlan.milestones.length > 0) {
    const breakdown: Record<string, string> = {};
    let planSummary = '';
    
    for (const milestone of apiPaymentPlan.milestones) {
      const desc = milestone.description?.toLowerCase() || '';
      if (desc.includes('booking') || desc.includes('down') || desc.includes('initial')) {
        breakdown.down_payment = `${milestone.percentage}%`;
      } else if (desc.includes('construction') || desc.includes('during')) {
        breakdown.during_construction = `${milestone.percentage}%`;
      } else if (desc.includes('handover') || desc.includes('completion')) {
        breakdown.on_completion = `${milestone.percentage}%`;
      } else if (desc.includes('post')) {
        breakdown.post_handover = `${milestone.percentage}%`;
      }
    }
    
    // Build plan summary
    const downPayment = parseInt(breakdown.down_payment || '0');
    const onCompletion = parseInt(breakdown.on_completion || '0');
    if (downPayment && onCompletion) {
      planSummary = `${100 - onCompletion}/${onCompletion}`;
    }
    
    return {
      payment_plan: planSummary || apiPaymentPlan.name || null,
      payment_breakdown: Object.keys(breakdown).length > 0 ? breakdown : null,
    };
  }

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
// NEW: Extract all gallery images from project
// ============================================================
function extractGalleryImages(project: ReellyProject): Array<{ url: string; alt_text: string; display_order: number }> {
  const images: Array<{ url: string; alt_text: string; display_order: number }> = [];
  const seenUrls = new Set<string>();
  let order = 0;

  // Add cover image first
  if (project.cover_image?.url && !seenUrls.has(project.cover_image.url)) {
    images.push({
      url: project.cover_image.url,
      alt_text: `${project.name} - Cover Image`,
      display_order: order++,
    });
    seenUrls.add(project.cover_image.url);
  }

  // Add gallery images
  const galleryImages = project.images || project.gallery || [];
  for (const img of galleryImages) {
    const url = typeof img === 'string' ? img : img.url;
    if (url && !seenUrls.has(url)) {
      images.push({
        url,
        alt_text: (typeof img === 'object' && img.alt_text) || `${project.name} - Gallery Image ${order}`,
        display_order: order++,
      });
      seenUrls.add(url);
    }
  }

  return images;
}

// ============================================================
// NEW: Extract video URLs
// ============================================================
function extractVideos(project: ReellyProject): { video_url: string | null; video_urls: string[] } {
  const videoUrls: string[] = [];
  
  if (project.video_reviews && Array.isArray(project.video_reviews)) {
    for (const video of project.video_reviews) {
      const url = typeof video === 'string' ? video : video?.url;
      if (url && !videoUrls.includes(url)) {
        videoUrls.push(url);
      }
    }
  }

  return {
    video_url: videoUrls[0] || null,
    video_urls: videoUrls,
  };
}

// ============================================================
// NEW: Extract documents (brochures, floor plans PDFs, etc.)
// ============================================================
function extractDocuments(project: ReellyProject): Array<{ url: string; name: string; type: string }> {
  const docs: Array<{ url: string; name: string; type: string }> = [];
  const seenUrls = new Set<string>();

  // Add documents array
  const documents = project.documents || project.brochures || [];
  for (const doc of documents) {
    const url = typeof doc === 'string' ? doc : doc.url;
    const name = typeof doc === 'object' ? (doc.name || doc.type || 'Document') : 'Brochure';
    const type = typeof doc === 'object' ? (doc.type || doc.file_type || 'brochure') : 'brochure';
    
    if (url && !seenUrls.has(url)) {
      docs.push({ url, name, type });
      seenUrls.add(url);
    }
  }

  return docs;
}

// ============================================================
// NEW: Extract floor plans
// ============================================================
function extractFloorPlans(project: ReellyProject): Array<{ type: string; url: string; label: string; bedrooms?: number }> {
  const plans: Array<{ type: string; url: string; label: string; bedrooms?: number }> = [];
  const seenUrls = new Set<string>();

  const floorPlans = project.floor_plans || [];
  for (const plan of floorPlans) {
    const url = plan.url || plan.image_url;
    if (url && !seenUrls.has(url)) {
      plans.push({
        type: plan.type || plan.name || 'floor_plan',
        url,
        label: plan.label || plan.name || `Floor Plan`,
        bedrooms: plan.bedrooms,
      });
      seenUrls.add(url);
    }
  }

  return plans;
}

// ============================================================
// NEW: Extract amenities list
// ============================================================
function extractAmenities(project: ReellyProject): string[] {
  const amenities: string[] = [];
  const seenNames = new Set<string>();

  // Get amenities from multiple possible fields
  const sources = [
    project.amenities,
    project.facilities,
    project.features,
  ];

  for (const source of sources) {
    if (!source) continue;
    
    for (const item of source) {
      const name = typeof item === 'string' ? item : item?.name;
      if (name && !seenNames.has(name.toLowerCase())) {
        amenities.push(name);
        seenNames.add(name.toLowerCase());
      }
    }
  }

  return amenities;
}

// ============================================================
// NEW: Extract unit types with pricing
// ============================================================
function extractUnitTypes(project: ReellyProject): Array<{
  type: string;
  bedrooms?: number;
  bathrooms?: number;
  size_min?: number;
  size_max?: number;
  price_from?: number;
  price_to?: number;
  available?: number;
}> {
  const units: Array<{
    type: string;
    bedrooms?: number;
    bathrooms?: number;
    size_min?: number;
    size_max?: number;
    price_from?: number;
    price_to?: number;
    available?: number;
  }> = [];

  const unitData = project.units || project.unit_types || [];
  for (const unit of unitData) {
    units.push({
      type: unit.type || unit.name || 'Unit',
      bedrooms: unit.bedrooms,
      bathrooms: unit.bathrooms,
      size_min: unit.size_min || unit.size,
      size_max: unit.size_max || unit.size,
      price_from: unit.price_from || unit.price,
      price_to: unit.price_to || unit.price,
      available: unit.available || unit.count,
    });
  }

  return units;
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

// Enhanced mapping function with full data extraction
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

  // Extract all gallery images
  const images = extractGalleryImages(project);

  // Extract videos
  const { video_url, video_urls } = extractVideos(project);

  // Extract documents
  const documents = extractDocuments(project);

  // Extract floor plans
  const floorPlans = extractFloorPlans(project);

  // Extract amenities
  const amenities = extractAmenities(project);

  // Extract unit types
  const unitTypes = extractUnitTypes(project);

  // Build location string
  const locationParts: string[] = [];
  if (project.location?.district) locationParts.push(project.location.district);
  if (project.location?.sector && project.location.sector !== project.location.district) {
    locationParts.push(project.location.sector);
  }
  const locationStr = locationParts.join(', ') || null;

  // Use external_id in source_url for tracking
  const externalId = `reelly_${project.id}`;

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

  // Extract payment plan from overview/description or API data
  const overview = project.overview || project.short_description || '';
  const { payment_plan, payment_breakdown } = extractPaymentPlanFromOverview(overview, project.payment_plan);

  // Build highlights from various sources
  const highlights: string[] = [];
  if (project.highlights) {
    highlights.push(...project.highlights);
  }
  if (project.features && project.features.length > 0) {
    // Take first 5 features as highlights if no explicit highlights
    if (highlights.length === 0) {
      highlights.push(...project.features.slice(0, 5));
    }
  }

  return {
    name: project.name,
    slug: `${slug}-${project.id}`, // Ensure uniqueness with ID suffix
    developer_name: project.developer,
    developer_id: developerId, // Link to developers table
    location: locationStr,
    emirate: getEmirateFromRegion(project.location?.region),
    description: project.overview || project.short_description || null,
    short_description: project.short_description || null,
    price_from: project.min_price > 0 ? project.min_price : null,
    price_to: project.max_price > 0 ? project.max_price : null,
    size_min: project.min_size > 0 ? project.min_size : null,
    size_max: project.max_size > 0 ? project.max_size : null,
    floors: project.building_count > 0 ? project.building_count : null,
    handover_date: handoverDate,
    handover_display: project.completion_date || null, // Human-readable like "DEC 2024"
    status_label: mapSaleStatus(project.sale_status) || mapConstructionStatus(project.construction_status),
    construction_status: mapConstructionStatus(project.construction_status),
    sale_status: mapSaleStatus(project.sale_status),
    
    // Enhanced images array with full gallery
    images: images.length > 0 ? images : null,
    
    // Geo coordinates for map display
    latitude: project.location?.latitude || null,
    longitude: project.location?.longitude || null,
    
    // Unit and building information
    total_units: project.units_count > 0 ? project.units_count : null,
    building_count: project.building_count > 0 ? project.building_count : null,
    construction_start_date: project.construction_start_date || null,
    construction_progress: constructionProgress,
    
    // Enhanced video support
    video_url: video_url,
    video_urls: video_urls.length > 0 ? video_urls : null,
    
    // Payment plan extracted from overview or API
    payment_plan: payment_plan,
    payment_breakdown: payment_breakdown,
    
    // Area reference
    area_id: areaId,
    area_name: areaName,
    
    // NEW: Enhanced data fields
    documents: documents.length > 0 ? documents : null,
    floor_plan_types: floorPlans.length > 0 ? floorPlans : null,
    amenities: amenities.length > 0 ? amenities : null,
    unit_types: unitTypes.length > 0 ? unitTypes : null,
    highlights: highlights.length > 0 ? highlights : null,
    faqs: project.faqs && project.faqs.length > 0 ? project.faqs : null,
    
    // Investment data
    roi_estimate: project.roi_estimate || null,
    rental_yield_estimate: project.rental_yield_estimate || null,
    service_charge: project.service_charge || null,
    
    // Source tracking
    source_url: `https://reelly.io/project/${project.id}#${externalId}`,
    review_notes: null,
    
    // Reelly-specific metadata
    reelly_id: project.id,
    source_updated_at: project.updated_at || null,
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

// Fetch single project details
async function fetchProjectDetail(apiKey: string, projectId: number): Promise<ReellyDetailResponse | null> {
  const url = `https://api-reelly.up.railway.app/api/v2/clients/projects/${projectId}`;
  console.log(`[Reelly API] Fetching detail: ${url}`);
  
  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "X-API-Key": apiKey,
        "Accept": "application/json",
      },
    });

    if (!response.ok) {
      console.warn(`[Reelly API] Detail fetch failed for project ${projectId}: ${response.status}`);
      return null;
    }

    return await response.json();
  } catch (err) {
    console.warn(`[Reelly API] Detail fetch error for project ${projectId}:`, err);
    return null;
  }
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
   location: ReellyLocation | null,
   areaCache: Map<string, string>
): Promise<string | null> {
  if (!location?.district) return null;
  
  const areaName = location.district;
  const areaSlug = generateAreaSlug(areaName);
   
   // Check cache first
   if (areaCache.has(areaSlug)) {
     return areaCache.get(areaSlug)!;
   }
   
  const emirate = getEmirateFromRegion(location.region);
  
  // Try to find existing area
  const { data: existing } = await supabase
    .from("areas")
    .select("id")
    .eq("slug", areaSlug)
    .maybeSingle();
  
  if (existing) {
     areaCache.set(areaSlug, existing.id);
    return existing.id;
  }
  
   // Insert new area with reelly_id
  const { data: newArea, error } = await supabase
    .from("areas")
    .insert({
      name: areaName,
      slug: areaSlug,
      emirate: emirate,
       reelly_id: location.id || null,
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
       if (retried) areaCache.set(areaSlug, retried.id);
      return retried?.id || null;
    }
    console.error(`[Reelly API] Error inserting area ${areaName}:`, error);
    return null;
  }
  
   if (newArea?.id) areaCache.set(areaSlug, newArea.id);
  return newArea?.id || null;
}

// ============================================================
// Bulk get or create developers - single query approach
// ============================================================
async function bulkGetOrCreateDevelopers(
  supabase: ReturnType<typeof createClient>,
  developerNames: string[]
): Promise<Map<string, string>> {
  const result = new Map<string, string>();
  const uniqueNames = [...new Set(developerNames.filter(n => n && n.trim()))];
  
  if (uniqueNames.length === 0) return result;
  
  // Fetch all existing developers in one query
  const slugs = uniqueNames.map(n => generateDeveloperSlug(n.trim()));
  const { data: existing } = await supabase
    .from("developers")
    .select("id, name, slug")
    .in("slug", slugs);
  
  // Build map of existing developers
  const existingBySlug = new Map<string, string>();
  const existingByName = new Map<string, string>();
  for (const dev of existing || []) {
    existingBySlug.set(dev.slug, dev.id);
    existingByName.set(dev.name.toLowerCase(), dev.id);
  }
  
  // Map results for names we found
  const toCreate: Array<{ name: string; slug: string }> = [];
  for (const name of uniqueNames) {
    const slug = generateDeveloperSlug(name.trim());
    const id = existingBySlug.get(slug) || existingByName.get(name.toLowerCase());
    if (id) {
      result.set(name, id);
    } else {
      toCreate.push({ name: name.trim(), slug });
    }
  }
  
  // Bulk insert new developers
  if (toCreate.length > 0) {
    const { data: inserted, error } = await supabase
      .from("developers")
      .upsert(
        toCreate.map(d => ({
          name: d.name,
          slug: d.slug,
          is_active: true,
        })),
        { onConflict: "slug", ignoreDuplicates: true }
      )
      .select("id, name, slug");
    
    if (!error && inserted) {
      for (const dev of inserted) {
        result.set(dev.name, dev.id);
      }
    }
    
    // Re-fetch any that were duplicates
    const stillMissing = toCreate.filter(d => !result.has(d.name));
    if (stillMissing.length > 0) {
      const { data: refetched } = await supabase
        .from("developers")
        .select("id, name, slug")
        .in("slug", stillMissing.map(d => d.slug));
      for (const dev of refetched || []) {
        result.set(dev.name, dev.id);
      }
    }
  }
  
  return result;
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
      action?: "test" | "sync" | "fetch_details";
      limit?: number;
      cursor?: string | null;
      project_ids?: number[];
      fetch_details?: boolean;
      // legacy
      fullSync?: boolean;
    } = {
      action: "sync",
      limit: 100, // Increased default batch size for faster sync
      cursor: null,
      fetch_details: false,
    };
    try {
      const body = await req.json();
      options = { ...options, ...body };
    } catch {
      // No body provided, use defaults
    }

    console.log(`[Reelly API] Starting with action: ${options.action}, limit: ${options.limit}`);

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
            has_images: !!(p.images || p.gallery),
            has_videos: !!(p.video_reviews?.length),
          })),
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch details for specific projects
    if (options.action === 'fetch_details' && options.project_ids?.length) {
      const results = {
        success: true,
        processed: 0,
        updated: 0,
        errors: [] as string[],
      };

      for (const projectId of options.project_ids.slice(0, 50)) {
        try {
          const detail = await fetchProjectDetail(apiKey, projectId);
          if (detail) {
            // Update the project with detailed data
            const { error } = await supabase
              .from("pending_project_imports")
              .update({
                images: extractGalleryImages(detail),
                documents: extractDocuments(detail),
                floor_plan_types: extractFloorPlans(detail),
                amenities: extractAmenities(detail),
                unit_types: extractUnitTypes(detail),
                video_urls: extractVideos(detail).video_urls,
                updated_at: new Date().toISOString(),
              })
              .ilike("source_url", `%reelly_${projectId}%`);
            
            if (error) {
              results.errors.push(`Project ${projectId}: ${error.message}`);
            } else {
              results.updated++;
            }
          }
          results.processed++;
          
          // Rate limiting - 200ms delay between requests
          await new Promise(resolve => setTimeout(resolve, 200));
        } catch (err) {
          results.errors.push(`Project ${projectId}: ${String(err)}`);
        }
      }

      return new Response(
        JSON.stringify(results),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch ONE page per request to avoid timeouts; UI can loop using next_cursor.
    const limit = Math.min(Math.max(Number(options.limit ?? 100), 1), 200);
    const cursor = options.cursor ? String(options.cursor) : null;
    const fetchDetails = options.fetch_details === true;

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

    // If fetch_details is enabled, fetch detailed data for each project
    let detailedProjects: ReellyProject[] = projectsToProcess;
    if (fetchDetails) {
      console.log(`[Reelly API] Fetching detailed data for ${projectsToProcess.length} projects...`);
      detailedProjects = [];
      for (const project of projectsToProcess) {
        const detail = await fetchProjectDetail(apiKey, project.id);
        detailedProjects.push(detail || project);
        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    // Pre-fetch existing source_urls for O(1) lookup (optimization)
    const { data: existingRecords } = await supabase
      .from("pending_project_imports")
      .select("source_url, status")
      .like("source_url", "%reelly_%");
    
    const existingMap = new Map<string, { status: string | null }>();
    for (const rec of existingRecords || []) {
      const match = rec.source_url?.match(/#(reelly_\d+)$/);
      if (match) {
        existingMap.set(match[1], { status: rec.status });
      }
    }
    console.log(`[Reelly API] Pre-fetched ${existingMap.size} existing Reelly records for dedup`);

    // PRE-FETCH: Get unique developer names and bulk create/get
    const developerNames = detailedProjects.map(p => p.developer).filter(Boolean);
    const developerMap = await bulkGetOrCreateDevelopers(supabase, developerNames);
    console.log(`[Reelly API] Pre-fetched/created ${developerMap.size} developers`);
    
    // PRE-FETCH: Get unique areas and cache them
    const areaCache = new Map<string, string>();
    const uniqueAreaSlugs = [...new Set(detailedProjects.map(p => p.location?.district).filter(Boolean).map(d => generateAreaSlug(d!)))];
    if (uniqueAreaSlugs.length > 0) {
      const { data: existingAreas } = await supabase
        .from("areas")
        .select("id, slug")
        .in("slug", uniqueAreaSlugs);
      for (const area of existingAreas || []) {
        areaCache.set(area.slug, area.id);
      }
    }
    console.log(`[Reelly API] Pre-fetched ${areaCache.size} existing areas`);

    // Process and upsert projects
    let inserted = 0;
    let updated = 0;
    let skipped = 0;
    let areasCreated = 0;
    let developersCreated = 0;
    const errors: string[] = [];

    for (const project of detailedProjects) {
      try {
        // Upsert area first and get its ID (uses cache)
        const areaId = await upsertArea(supabase, project.location, areaCache);
        
        // Get developer ID from pre-fetched map
        const developerId = developerMap.get(project.developer) || null;
        
        const mappedProject = mapReellyToImport(project, areaId, developerId);

        // Check if exists using pre-fetched map first
        const externalId = `reelly_${project.id}`;
        const cachedExisting = existingMap.get(externalId);

        let pendingImportId: string | null = null;

        if (cachedExisting) {
          // Check if already approved
          if (cachedExisting.status === 'approved') {
            skipped++;
            continue;
          }
          
          // Need to fetch actual ID for update
          const { data: existing } = await supabase
            .from("pending_project_imports")
            .select("id")
            .like("source_url", `%${externalId}%`)
            .maybeSingle();
          
          if (!existing) {
            // Race condition - was deleted, insert instead
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

        // No auto-approval - all projects go to pending queue for manual review
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
        page_processed: detailedProjects.length,
        fetch_details_enabled: fetchDetails,
        inserted,
        updated,
        skipped,
        areas_created: areasCreated,
        developers_linked: detailedProjects.length - errors.length,
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
