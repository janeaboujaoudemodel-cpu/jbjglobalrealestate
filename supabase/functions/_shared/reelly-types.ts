// Shared types and utilities for Reelly API functions

export interface ReellyLocation {
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

export interface ReellyCoverImage {
  url: string;
  metadata?: { mime: string; size: number; width: number; height: number };
}

export interface ReellyImage {
  url: string;
  alt_text?: string;
  type?: string;
  metadata?: any;
}

export interface ReellyVideoReview {
  url: string;
  title?: string;
  thumbnail_url?: string;
}

export interface ReellyDocument {
  url: string;
  name?: string;
  type?: string;
  file_type?: string;
}

export interface ReellyUnit {
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

export interface ReellyFloorPlan {
  id?: number;
  type?: string;
  name?: string;
  url: string;
  image_url?: string;
  label?: string;
  bedrooms?: number;
}

export interface ReellyAmenity {
  id?: number;
  name: string;
  icon?: string;
  category?: string;
}

export interface ReellyProject {
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
  // Standard field names
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
  roi_estimate?: number;
  rental_yield_estimate?: number;
  service_charge?: number;
  // Actual Reelly API field names (discovered via diagnostics)
  project_amenities?: Array<{ id?: number; amenity?: { id?: number; name?: string; icon?: string }; name?: string }>;
  payment_plans?: Array<{ name?: string; description?: string; milestones?: any[]; installments?: any[] }>;
  marketing_brochure?: string | { url?: string };
  general_plan?: Array<{ url?: string; image?: string }> | null;
  lobby?: Array<{ url?: string; image?: string }> | null;
  interior?: Array<{ url?: string; image?: string }> | null;
  architecture?: Array<{ url?: string; image?: string }> | null;
  typical_units?: Array<any>;
  buildings?: Array<any>;
  // Payment fields
  down_payment?: number;
  during_construction?: number;
  on_handover?: number;
  on_completion?: number;
  installment_plan?: any;
  // Additional
  [key: string]: any;
}

export interface ReellyResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: ReellyProject[];
}

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ============= API Constants =============

export const REELLY_API_ROOT = "https://api-reelly.up.railway.app/api/v2/clients";

/** @deprecated Use REELLY_API_ENDPOINTS.projects instead */
export const REELLY_API_BASE = `${REELLY_API_ROOT}/projects`;

export const REELLY_API_DEVELOPERS_BASE = `${REELLY_API_ROOT}/developers`;

export const REELLY_API_ENDPOINTS = {
  projects:          `${REELLY_API_ROOT}/projects`,
  projectMarkers:    `${REELLY_API_ROOT}/projects/markers`,
  projectStatuses:   `${REELLY_API_ROOT}/projects/statuses`,
  projectSaleStatuses: `${REELLY_API_ROOT}/projects/sale-statuses`,
  developers:        `${REELLY_API_ROOT}/developers`,
  developerLogos:    `${REELLY_API_ROOT}/developers/logos`,
  unitTypes:         `${REELLY_API_ROOT}/units/types`,
  locations:         `${REELLY_API_ROOT}/locations`,
  regions:           `${REELLY_API_ROOT}/regions`,
  countries:         `${REELLY_API_ROOT}/countries`,
} as const;

export const REELLY_FILTERS = {
  search:             "search",
  saleStatus:         "sale_status",
  constructionStatus: "construction_status",
  region:             "region",
  developer:          "developer",
  limit:              "limit",
  offset:             "offset",
} as const;

// ============= Shared Fetch Helper =============

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Fetch from the Reelly API with automatic retry on 429 / 5xx.
 * Uses exponential backoff: 5s → 10s → 20s → 40s (max 4 attempts).
 */
export async function fetchReellyWithRetry(
  url: string,
  apiKey: string,
  maxAttempts = 4,
): Promise<Response> {
  const headers = {
    "X-API-Key": apiKey,
    "Authorization": `Bearer ${apiKey}`,
    "Accept": "application/json",
  };

  let lastRes: Response | null = null;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const res = await fetch(url, { headers });
      if (res.status === 429 || res.status === 502 || res.status === 503 || res.status === 504) {
        const waitMs = 5_000 * Math.pow(2, attempt - 1);
        console.warn(`[fetchReellyWithRetry] ${res.status} on attempt ${attempt}/${maxAttempts} for ${url} — waiting ${waitMs}ms`);
        lastRes = res;
        if (attempt < maxAttempts) {
          await sleep(waitMs);
          continue;
        }
        return res; // return last rate-limited response on final attempt
      }
      return res;
    } catch (err) {
      const waitMs = attempt * 5_000;
      console.warn(`[fetchReellyWithRetry] Network error attempt ${attempt}/${maxAttempts}: ${err} — waiting ${waitMs}ms`);
      if (attempt === maxAttempts) throw err;
      await sleep(waitMs);
    }
  }
  return lastRes!;
}

export function generateSlug(name: string, developer: string): string {
  return `${name}-${developer}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 100);
}

export function generateAreaSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 100);
}

export function generateDeveloperSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 100);
}

export function mapConstructionStatus(status: string): string {
  const map: Record<string, string> = {
    'under_construction': 'Under Construction',
    'completed': 'Completed',
    'off_plan': 'Off-Plan',
    'pre_launch': 'Pre-Launch',
    'ready': 'Ready',
  };
  return map[status] || status;
}

export function mapSaleStatus(status: string): string | null {
  if (!status) return null;
  const map: Record<string, string> = {
    "Announced": "Announced", "On Sale": "On Sale", "Out of Stock": "Sold Out",
    "Presale (EOI)": "Presale (EOI)", "Start of Sales": "Start of Sales",
    "announced": "Announced", "on_sale": "On Sale", "out_of_stock": "Sold Out",
    "presale_eoi": "Presale (EOI)", "start_of_sales": "Start of Sales",
    "available": "On Sale", "coming_soon": "Announced", "limited": "On Sale", "sold_out": "Sold Out",
  };
  return map[status] || status;
}

export function getEmirateFromRegion(region: string): string {
  const map: Record<string, string> = {
    'dubai': 'Dubai', 'abu dhabi': 'Abu Dhabi', 'sharjah': 'Sharjah', 'ajman': 'Ajman',
    'ras al khaimah': 'Ras Al Khaimah', 'fujairah': 'Fujairah', 'umm al quwain': 'Umm Al Quwain',
    'cyprus': 'Cyprus', 'indonesia': 'Indonesia', 'oman': 'Oman', 'thailand': 'Thailand',
  };
  return map[region?.toLowerCase().trim()] || region || 'Dubai';
}

export function extractGalleryImages(project: ReellyProject): Array<{ url: string; alt_text: string; display_order: number }> {
  const images: Array<{ url: string; alt_text: string; display_order: number }> = [];
  const seen = new Set<string>();
  let order = 0;
  if (project.cover_image?.url && !seen.has(project.cover_image.url)) {
    images.push({ url: project.cover_image.url, alt_text: `${project.name} - Cover`, display_order: order++ });
    seen.add(project.cover_image.url);
  }
  // Try standard fields first
  for (const img of project.images || project.gallery || []) {
    const url = typeof img === 'string' ? img : img.url;
    if (url && !seen.has(url)) {
      images.push({ url, alt_text: `${project.name} - Gallery ${order}`, display_order: order++ });
      seen.add(url);
    }
  }
  // Try Reelly-specific image categories: general_plan, lobby, interior, architecture
  for (const category of ['general_plan', 'lobby', 'interior', 'architecture'] as const) {
    const categoryImages = (project as any)[category];
    if (Array.isArray(categoryImages)) {
      for (const img of categoryImages) {
        const url = typeof img === 'string' ? img : (img?.url || img?.image);
        if (url && !seen.has(url)) {
          images.push({ url, alt_text: `${project.name} - ${category.replace('_', ' ')}`, display_order: order++ });
          seen.add(url);
        }
      }
    }
  }
  return images;
}

export function extractVideos(project: ReellyProject): { video_url: string | null; video_urls: string[] } {
  const urls: string[] = [];
  for (const v of project.video_reviews || []) {
    const url = typeof v === 'string' ? v : v?.url;
    if (url && !urls.includes(url)) urls.push(url);
  }
  return { video_url: urls[0] || null, video_urls: urls };
}

export function extractDocuments(project: ReellyProject): Array<{ url: string; name: string; type: string }> {
  const docs: Array<{ url: string; name: string; type: string }> = [];
  const seen = new Set<string>();
  // Standard fields
  for (const doc of project.documents || project.brochures || []) {
    const url = typeof doc === 'string' ? doc : doc.url;
    const name = typeof doc === 'object' ? (doc.name || 'Document') : 'Brochure';
    const type = typeof doc === 'object' ? (doc.type || 'brochure') : 'brochure';
    if (url && !seen.has(url)) { docs.push({ url, name, type }); seen.add(url); }
  }
  // Reelly-specific: marketing_brochure
  if (project.marketing_brochure) {
    const url = typeof project.marketing_brochure === 'string' ? project.marketing_brochure : project.marketing_brochure?.url;
    if (url && !seen.has(url)) { docs.push({ url, name: 'Marketing Brochure', type: 'brochure' }); seen.add(url); }
  }
  return docs;
}

export function extractFloorPlans(project: ReellyProject): Array<{ type: string; url: string; label: string; bedrooms?: number }> {
  const plans: Array<{ type: string; url: string; label: string; bedrooms?: number }> = [];
  const seen = new Set<string>();
  for (const p of project.floor_plans || []) {
    const url = p.url || p.image_url;
    if (url && !seen.has(url)) {
      plans.push({ type: p.type || 'floor_plan', url, label: p.label || p.name || 'Floor Plan', bedrooms: p.bedrooms });
      seen.add(url);
    }
  }
  return plans;
}

export function extractAmenities(project: ReellyProject): string[] {
  const amenities: string[] = [];
  const seen = new Set<string>();
  // Standard fields
  for (const src of [project.amenities, project.facilities, project.features]) {
    for (const item of src || []) {
      const name = typeof item === 'string' ? item : item?.name;
      if (name && !seen.has(name.toLowerCase())) { amenities.push(name); seen.add(name.toLowerCase()); }
    }
  }
  // Reelly-specific: project_amenities (nested objects with amenity.name)
  if (Array.isArray(project.project_amenities)) {
    for (const item of project.project_amenities) {
      const name = item?.amenity?.name || item?.name;
      if (name && !seen.has(name.toLowerCase())) { amenities.push(name); seen.add(name.toLowerCase()); }
    }
  }
  return amenities;
}

/**
 * Extract amenity images mapping from Reelly project_amenities.
 * Returns a Record<string, string> mapping amenity name → real photo URL.
 */
export function extractAmenityImages(project: ReellyProject): Record<string, string> {
  const images: Record<string, string> = {};
  if (Array.isArray(project.project_amenities)) {
    for (const item of project.project_amenities) {
      const name = item?.amenity?.name || item?.name;
      const iconUrl = item?.amenity?.icon?.url || item?.icon?.url;
      if (name && iconUrl) {
        images[name] = iconUrl;
      }
    }
  }
  return images;
}

export function extractUnitTypes(project: ReellyProject): Array<{ type: string; bedrooms?: number; bathrooms?: number; size_min?: number; size_max?: number; price_from?: number; price_to?: number; available?: number; layout_url?: string; layout_urls?: string[] }> {
  const units: Array<{ type: string; bedrooms?: number; bathrooms?: number; size_min?: number; size_max?: number; price_from?: number; price_to?: number; available?: number; layout_url?: string; layout_urls?: string[] }> = [];

  // Reelly-specific: typical_units (the richest data source from Reelly API)
  // Fields: from_price_aed, to_price_aed, from_size_sqft, to_size_sqft, bedrooms, layout[].image.url
  if (Array.isArray(project.typical_units) && project.typical_units.length > 0) {
    for (const u of project.typical_units) {
      // Extract ALL layout images, not just the first
      const layoutUrls: string[] = [];
      if (Array.isArray(u.layout)) {
        for (const l of u.layout) {
          const url = l?.image?.url || l?.url;
          if (url) layoutUrls.push(url);
        }
      }
      units.push({
        type: u.type || u.name || u.unit_type || 'Unit',
        bedrooms: u.bedrooms ?? u.bedroom_count,
        bathrooms: u.bathrooms ?? u.bathroom_count,
        size_min: u.from_size_sqft || u.from_size_m2 || u.size_min || u.area || u.size,
        size_max: u.to_size_sqft || u.to_size_m2 || u.size_max || u.area || u.size,
        price_from: u.from_price_aed || u.price_from || u.price,
        price_to: u.to_price_aed || u.price_to || u.price,
        layout_url: layoutUrls[0] || undefined,
        layout_urls: layoutUrls.length > 0 ? layoutUrls : undefined,
      });
    }
    return units;
  }

  // Fallback: standard fields (units / unit_types)
  for (const u of project.units || project.unit_types || []) {
    units.push({
      type: u.type || u.name || 'Unit',
      bedrooms: u.bedrooms,
      bathrooms: u.bathrooms,
      size_min: u.size_min || u.size,
      size_max: u.size_max || u.size,
      price_from: u.price_from || u.price,
      price_to: u.price_to || u.price,
      available: u.available || u.count,
    });
  }

  // Also check buildings for unit breakdowns
  if (units.length === 0 && Array.isArray(project.buildings)) {
    for (const bldg of project.buildings) {
      if (Array.isArray(bldg.typical_units)) {
        for (const u of bldg.typical_units) {
          const layoutUrls: string[] = [];
          if (Array.isArray(u.layout)) {
            for (const l of u.layout) {
              const url = l?.image?.url || l?.url;
              if (url) layoutUrls.push(url);
            }
          }
          units.push({
            type: u.type || u.name || u.unit_type || 'Unit',
            bedrooms: u.bedrooms ?? u.bedroom_count,
            bathrooms: u.bathrooms ?? u.bathroom_count,
            size_min: u.from_size_sqft || u.size_min || u.area,
            size_max: u.to_size_sqft || u.size_max || u.area,
            price_from: u.from_price_aed || u.price_from,
            price_to: u.to_price_aed || u.price_to,
            layout_url: layoutUrls[0] || undefined,
            layout_urls: layoutUrls.length > 0 ? layoutUrls : undefined,
          });
        }
      }
    }
  }

  return units;
}
