/**
 * Reelly API Response Types
 * Based on the official Reelly API v2 structure
 */

// Paginated response wrapper
export interface ReellyPaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// Location/Geography types
export interface ReellyLocation {
  id: number;
  country: number;
  region: string; // Emirate name (e.g., "Dubai")
  city: string | null;
  district: string; // Area name (e.g., "Al Furjan")
  sector: string;
  village: string | null;
  latitude: number;
  longitude: number;
  polygon?: ReellyPolygon;
}

export interface ReellyPolygon {
  type: "LineString" | "Polygon";
  coordinates: [number, number][];
}

// Media types
export interface ReellyImageMetadata {
  mime: string;
  size: number;
  width: number;
  height: number;
}

export interface ReellyCoverImage {
  url: string;
  metadata: ReellyImageMetadata;
}

export interface ReellyVideoReview {
  url: string;
  title?: string;
  thumbnail_url?: string;
}

// Developer object (used in markers endpoint)
export interface ReellyDeveloperRef {
  id: number;
  name: string;
  logo?: ReellyCoverImage | null;
}

// Project types (full detail endpoint)
export interface ReellyProject {
  id: number;
  name: string;
  developer: string; // Developer name (not ID) - full project endpoint
  construction_status: ReellyConstructionStatus;
  sale_status: ReellySaleStatus;
  overview: string | null; // Markdown with sections
  short_description: string | null;
  managing_company: string | null;
  completion_date: string | null; // e.g., "DEC 2024"
  completion_datetime: string | null; // ISO date
  brand: string | null;
  construction_start_date: string | null; // ISO date
  construction_end_date: string | null; // ISO date
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
  updated_at: string; // ISO date
}

// Project marker (markers endpoint - lighter payload for map)
export interface ReellyProjectMarker {
  id: number;
  name: string;
  developer: ReellyDeveloperRef; // Developer object with id/name/logo
  location: ReellyLocation;
  completion_datetime: string | null;
  cover_image: ReellyCoverImage | null;
  sale_status: ReellySaleStatus;
  min_price: number;
  status: ReellyConstructionStatus; // Note: "status" not "construction_status"
  is_partner_project: boolean;
}

// Status enums
export type ReellyConstructionStatus = 
  | "under_construction"
  | "completed"
  | "presale";

export type ReellySaleStatus =
  | "announced"
  | "on_sale"
  | "out_of_stock"
  | "presale_eoi"
  | "start_of_sales";

// Developer types
export interface ReellyDeveloper {
  id: number;
  name: string;
  slug?: string;
  logo_url?: string;
  description?: string;
  headquarters?: string;
  website?: string;
  project_count?: number;
}

// Area/District types
export interface ReellyArea {
  id: number;
  name: string;
  description?: string;
  emirate?: string;
  country?: string;
}

// Emirate/Region types
export interface ReellyEmirate {
  id: number;
  name: string;
  sw_latitude: number;
  sw_longitude: number;
  ne_latitude: number;
  ne_longitude: number;
}

// Language types
export interface ReellyLanguage {
  code: string;
  name: string;
  default: boolean;
}

// API response types
export type ReellyProjectsResponse = ReellyPaginatedResponse<ReellyProject>;
export type ReellyMarkersResponse = ReellyPaginatedResponse<ReellyProjectMarker>;

// Mapping functions to convert Reelly data to our database format
export function mapReellyProjectToDatabase(project: ReellyProject) {
  return {
    reelly_id: project.id,
    name: project.name,
    slug: generateSlug(project.name),
    developer_name: project.developer,
    construction_status: normalizeConstructionStatus(project.construction_status),
    sale_status: normalizeSaleStatus(project.sale_status),
    description: project.overview,
    short_description: project.short_description,
    completion_date: project.completion_datetime,
    expected_completion: project.completion_date,
    building_count: project.building_count,
    units_count: project.units_count,
    emirate: project.location?.region,
    area_name: project.location?.district,
    sector: project.location?.sector,
    latitude: project.location?.latitude,
    longitude: project.location?.longitude,
    min_price: project.min_price > 0 ? project.min_price : null,
    max_price: project.max_price > 0 ? project.max_price : null,
    min_size: project.min_size > 0 ? project.min_size : null,
    max_size: project.max_size > 0 ? project.max_size : null,
    price_currency: project.price_currency,
    area_unit: project.area_unit,
    cover_image_url: project.cover_image?.url,
    is_published: project.is_published,
    source: 'reelly' as const,
    source_updated_at: project.updated_at,
  };
}

// Helper functions
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function normalizeConstructionStatus(status: string | null): string | null {
  if (!status) return null;
  const map: Record<string, string> = {
    "under_construction": "Under Construction",
    "completed": "Completed",
    "presale": "Presale",
  };
  return map[status] || status;
}

function normalizeSaleStatus(status: string | null): string | null {
  if (!status) return null;
  const map: Record<string, string> = {
    "announced": "Announced",
    "on_sale": "On Sale",
    "out_of_stock": "Out of Stock",
    "presale_eoi": "Presale (EOI)",
    "start_of_sales": "Start of Sales",
  };
  return map[status] || status;
}
