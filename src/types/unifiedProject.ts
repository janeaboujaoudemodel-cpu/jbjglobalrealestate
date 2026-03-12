/**
 * Unified Project Data Model
 * 
 * This is the master data structure that ALL project sources must follow:
 * - External API imports
 * - Extracted listings
 * - Manual admin additions
 */

import type { Json } from "@/integrations/supabase/types";

// ============================================================================
// UNIFIED PROJECT INTERFACE
// ============================================================================

export interface UnifiedProject {
  // Core identifiers
  id: string;
  name: string;
  slug: string;
  
  // External source tracking
  reelly_id?: number | null;
  source: ProjectSource;
  source_id?: string | null;
  source_url?: string | null;
  source_updated_at?: string | null;
  external_id?: string | null;
  import_source?: string | null;
  
  // Developer info (Reelly-style)
  developer_id?: string | null;
  developer_name?: string | null;
  reelly_developer_id?: number | null;
  developer?: {
    id: string;
    name: string;
    slug: string;
  } | null;
  
  // Location (Reelly structure)
  emirate?: string | null;
  area_id?: string | null;
  area_name?: string | null;
  sector?: string | null;
  location?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  community_id?: string | null;
  community?: {
    id: string;
    name: string;
    slug: string;
  } | null;
  
  // Status fields (Reelly enums)
  construction_status?: ConstructionStatus | null;
  sale_status?: SaleStatus | null;
  status?: string | null;
  status_label?: string | null;
  availability_status?: string | null;
  
  // Descriptions
  description?: string | null;
  short_description?: string | null;
  
  // Pricing (Reelly structure)
  price_from?: number | null;
  price_to?: number | null;
  min_price?: number | null; // Alias for price_from
  max_price?: number | null; // Alias for price_to
  price_currency?: string | null;
  
  // Size/Area
  size_min?: number | null;
  size_max?: number | null;
  area_unit?: string | null;
  
  // Bedrooms
  bedrooms_min?: number | null;
  bedrooms_max?: number | null;
  
  // Building info
  floors?: number | null;
  building_count?: number | null;
  total_units?: number | null;
  available_units?: number | null;
  
  // Construction timeline
  construction_progress?: number | null;
  construction_start_date?: string | null;
  expected_completion?: string | null;
  handover_date?: string | null;
  
  // Property details
  property_type_label?: string | null;
  unit_types?: Json | null;
  furnished_status?: string | null;
  
  // Payment
  payment_plan?: string | null;
  payment_breakdown?: Json | null;
  down_payment_percent?: number | null;
  service_charge?: string | null;
  
  // Features & Amenities
  amenities?: string[] | null;
  amenity_images?: Record<string, string> | Json | null;
  amenities_list?: Json | null;
  facilities?: string[] | null;
  views?: string[] | null;
  highlights?: Json | null;
  
  // USP (Unique Selling Points) - Provident style
  usp_headline?: string | null;
  usp_bullets?: Json | null;
  usp_image_url?: string | null;
  
  // Location details - Provident style
  location_headline?: string | null;
  location_description?: string | null;
  location_distances?: Json | null;
  location_image_url?: string | null;
  
  // Floor plans
  floor_plan_types?: Json | null;
  
  // FAQs
  faqs?: Json | null;
  
  // Media
  cover_image_url?: string | null;
  video_url?: string | null;
  virtual_tour_url?: string | null;
  
  // Investment metrics
  roi_estimate?: number | null;
  rental_yield_estimate?: number | null;
  
  // Flags
  is_featured?: boolean | null;
  is_premium?: boolean | null;
  is_sold_out?: boolean | null;
  is_offplan?: boolean | null;
  is_developer_direct?: boolean | null;
  is_published?: boolean | null;
  
  // Timestamps
  created_at: string;
  updated_at: string;
  
  // Related data (joined from other tables)
  images?: ProjectImage[];
  documents?: ProjectDocument[];
  units_data?: Json | null;
}

// ============================================================================
// SUPPORTING TYPES
// ============================================================================

export type ProjectSource = 'reelly' | 'provident' | 'manual' | 'import' | string;

export type ConstructionStatus = 
  | 'Under Construction'
  | 'Completed'
  | 'Presale'
  | 'under_construction'
  | 'completed'
  | 'presale'
  | string;

export type SaleStatus =
  | 'Announced'
  | 'On Sale'
  | 'Out of Stock'
  | 'Presale (EOI)'
  | 'Start of Sales'
  | 'announced'
  | 'on_sale'
  | 'out_of_stock'
  | 'presale_eoi'
  | 'start_of_sales'
  | string;

export interface ProjectImage {
  id: string;
  image_url: string;
  alt_text?: string | null;
  display_order: number;
}

export interface ProjectDocument {
  id: string;
  document_type: string;
  file_url: string;
  file_name: string;
  display_order?: number | null;
}

// ============================================================================
// NORMALIZATION HELPERS
// ============================================================================

/**
 * Normalize construction status to display format
 */
export function normalizeConstructionStatus(status: string | null | undefined): string | null {
  if (!status) return null;
  
  const map: Record<string, string> = {
    'under_construction': 'Under Construction',
    'completed': 'Completed',
    'presale': 'Presale',
    'Under Construction': 'Under Construction',
    'Completed': 'Completed',
    'Presale': 'Presale',
  };
  
  return map[status] || status;
}

/**
 * Normalize sale status to display format
 */
export function normalizeSaleStatus(status: string | null | undefined): string | null {
  if (!status) return null;
  
  const map: Record<string, string> = {
    'announced': 'Announced',
    'on_sale': 'On Sale',
    'out_of_stock': 'Sold Out',
    'presale_eoi': 'Presale (EOI)',
    'start_of_sales': 'Launching Soon',
    'Announced': 'Announced',
    'On Sale': 'On Sale',
    'Out of Stock': 'Sold Out',
    'Presale (EOI)': 'Presale (EOI)',
    'Start of Sales': 'Launching Soon',
  };
  
  return map[status] || status;
}

/**
 * Generate slug from project name
 */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Get primary image URL (cover_image_url or first image)
 */
export function getPrimaryImageUrl(project: UnifiedProject): string | null {
  if (project.cover_image_url) return project.cover_image_url;
  if (project.images && project.images.length > 0) {
    const sorted = [...project.images].sort((a, b) => a.display_order - b.display_order);
    return sorted[0].image_url;
  }
  return null;
}

/**
 * Get display price range
 */
export function getDisplayPrice(project: UnifiedProject): string | null {
  const minPrice = project.price_from ?? project.min_price;
  const maxPrice = project.price_to ?? project.max_price;
  const currency = project.price_currency || 'AED';
  
  if (!minPrice && !maxPrice) return null;
  
  const formatPrice = (price: number) => {
    if (price >= 1000000) {
      return `${(price / 1000000).toFixed(1)}M`;
    }
    if (price >= 1000) {
      return `${(price / 1000).toFixed(0)}K`;
    }
    return price.toString();
  };
  
  if (minPrice && maxPrice && minPrice !== maxPrice) {
    return `${currency} ${formatPrice(minPrice)} - ${formatPrice(maxPrice)}`;
  }
  
  return `${currency} ${formatPrice(minPrice || maxPrice!)}`;
}

/**
 * Get bedroom range display
 */
export function getBedroomDisplay(project: UnifiedProject): string | null {
  const min = project.bedrooms_min;
  const max = project.bedrooms_max;
  
  if (min === null && max === null) return null;
  if (min === max || max === null) return min === 0 ? 'Studio' : `${min} BR`;
  if (min === null) return max === 0 ? 'Studio' : `${max} BR`;
  if (min === 0) return `Studio - ${max} BR`;
  
  return `${min} - ${max} BR`;
}

/**
 * Get completion/handover display
 */
export function getCompletionDisplay(project: UnifiedProject): string | null {
  return project.expected_completion || project.handover_date || null;
}
