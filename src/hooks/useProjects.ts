import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";

// Re-export the unified type for backwards compatibility
export type { UnifiedProject as Project } from "@/types/unifiedProject";
import type { UnifiedProject } from "@/types/unifiedProject";

const hasPublicPhoto = (p: UnifiedProject) =>
  !!(p.cover_image_url || p.images?.some((img) => !!img.image_url));

const dedupePublicProjects = (projects: UnifiedProject[]) => {
  const seen = new Set<string>();
  return projects.filter((project) => {
    if (!hasPublicPhoto(project)) return false;
    const key = `${project.slug || project.name}`.trim().toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

// Legacy Project interface - keeping for backwards compatibility during transition
export interface LegacyProject {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  location: string | null;
  // Mirrored content (extracted)
  usp_headline?: string | null;
  usp_bullets?: Json | null;
  usp_image_url?: string | null;
  location_headline?: string | null;
  location_description?: string | null;
  location_distances?: Json | null;
  location_image_url?: string | null;
  floor_plan_types?: Json | null;
  faqs?: Json | null;
  payment_breakdown?: Json | null;
  amenities_list?: Json | null;
  price_from: number | null;
  price_to: number | null;
  bedrooms_min: number | null;
  bedrooms_max: number | null;
  size_min: number | null;
  size_max: number | null;
  floors: number | null;
  handover_date: string | null;
  service_charge: string | null;
  payment_plan: string | null;
  amenities: string[] | null;
  facilities: string[] | null;
  views: string[] | null;
  furnished_status: string | null;
  emirate: string | null;
  status: string | null;
  is_featured: boolean | null;
  is_premium: boolean | null;
  is_sold_out: boolean | null;
  property_type_label: string | null;
  status_label: string | null;
  created_at: string;
  updated_at: string;
  // Reelly-compatible fields
  reelly_id?: number | null;
  reelly_developer_id?: number | null;
  construction_status?: string | null;
  sale_status?: string | null;
  short_description?: string | null;
  building_count?: number | null;
  area_name?: string | null;
  sector?: string | null;
  price_currency?: string | null;
  area_unit?: string | null;
  cover_image_url?: string | null;
  is_published?: boolean | null;
  source_updated_at?: string | null;
  developer_name?: string | null;
  unit_types?: Json | null;
  construction_progress?: number | null;
  construction_start_date?: string | null;
  expected_completion?: string | null;
  availability_status?: string | null;
  total_units?: number | null;
  available_units?: number | null;
  down_payment_percent?: number | null;
  video_url?: string | null;
  virtual_tour_url?: string | null;
  roi_estimate?: number | null;
  rental_yield_estimate?: number | null;
  import_source?: string | null;
  external_id?: string | null;
  source?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  developer: {
    id: string;
    name: string;
    slug: string;
  } | null;
  community: {
    id: string;
    name: string;
    slug: string;
  } | null;
  images: {
    id: string;
    image_url: string;
    alt_text: string | null;
    display_order: number;
  }[];
  documents: {
    id: string;
    document_type: string;
    file_url: string;
    file_name: string;
    display_order?: number | null;
  }[];
}

export interface Community {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  location: string | null;
}

export interface Developer {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  logo_url_processed: string | null;
  logo_url_dark: string | null;
  feature_image_url: string | null;
  logo_bg_color: string | null;
  rank: number;
  founded_year: number | null;
  completed_projects: number | null;
  offplan_projects: number | null;
  portfolio_worth: number | null;
  headquarters: string | null;
}

export interface TrendingArea {
  id: string;
  name: string;
  slug: string;
  emirate: string;
  image_url: string | null;
  is_trending: boolean;
}

export function useCommunities() {
  return useQuery({
    queryKey: ["communities"],
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("communities")
        .select("*")
        .order("name");
      
      if (error) throw error;
      return data as Community[];
    },
  });
}

export function useDevelopers(includeHidden = false) {
  return useQuery({
    queryKey: ["developers", includeHidden],
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    queryFn: async () => {
      let query = supabase
        .from("developers")
        .select("*")
        .order("rank");
      
      if (!includeHidden) {
        query = query.or("is_hidden.is.null,is_hidden.eq.false");
      }
      
      const { data, error } = await query;
      if (error) throw error;
      const rows = (data as unknown as Developer[]) ?? [];

      // Exclude bad merged records like "Ellington and RAK Properties"
      // where two distinct developer brands were combined into one row.
      const isMergedBadRecord = (name: string) => {
        const n = (name || "").toLowerCase().trim();
        if (!n) return true;
        // "X and Y Properties/Developers" pattern
        return /\b(and|&|\+)\b/.test(n) &&
          /(propert|develop|estate|group|holding|residenc)/i.test(n) &&
          // Only flag when it looks like two brand names joined
          n.split(/\s+(?:and|&|\+)\s+/).length === 2 &&
          n.split(/\s+(?:and|&|\+)\s+/).every((p) => p.trim().split(/\s+/).length <= 3);
      };

      // Dedupe by normalized name — keep the "best" row per brand.
      // Score: has logo (+3), canonical slug (no leading digits, no "developed-by-") (+2),
      // shorter slug (+1), lower rank (better).
      const scoreOf = (d: Developer): number => {
        const slug = (d.slug || "").toLowerCase();
        const hasLogo = d.logo_url && !d.logo_url.includes("emaar_properties_f2c4d0a72c") ? 3 : 0;
        const canonicalSlug = !/^\d/.test(slug) && !slug.startsWith("developed-by-") ? 2 : 0;
        const shortSlug = slug.length > 0 && slug.length < 40 ? 1 : 0;
        const rankBonus = typeof d.rank === "number" ? Math.max(0, 1000 - d.rank) / 1000 : 0;
        return hasLogo + canonicalSlug + shortSlug + rankBonus;
      };

      // Normalize name → strip common corporate suffixes so
      // "Acube Developers" and "Acube Abodes Realty" collapse to the same brand.
      const SUFFIX_TOKENS = new Set([
        "properties", "property", "developers", "developer", "development", "developments",
        "real", "estate", "realty", "realties", "group", "holding", "holdings",
        "llc", "l.l.c", "l.l.c.", "pjsc", "psc", "fzco", "fze", "inc", "co", "company",
        "residences", "residence", "homes", "abodes", "abode",
      ]);
      const normalizeBrand = (name: string) => {
        const cleaned = (name || "")
          .toLowerCase()
          .replace(/[.,&]/g, " ")
          .replace(/\s+/g, " ")
          .trim();
        const tokens = cleaned.split(" ").filter((t) => t && !SUFFIX_TOKENS.has(t));
        return tokens.join(" ") || cleaned;
      };

      const byKey = new Map<string, Developer>();
      for (const row of rows) {
        if (isMergedBadRecord(row.name || "")) continue;
        const key = normalizeBrand(row.name || "");
        if (!key) continue;
        const existing = byKey.get(key);
        if (!existing || scoreOf(row) > scoreOf(existing)) {
          byKey.set(key, row);
        }
      }

      return Array.from(byKey.values()).sort((a, b) => {
        const ra = typeof a.rank === "number" ? a.rank : 9999;
        const rb = typeof b.rank === "number" ? b.rank : 9999;
        if (ra !== rb) return ra - rb;
        return (a.name || "").localeCompare(b.name || "");
      });
    },
  });
}

export function useTrendingAreas() {
  return useQuery({
    queryKey: ["trending-areas"],
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trending_areas")
        .select("*")
        .eq("is_trending", true)
        .order("name");
      
      if (error) throw error;
      return data as TrendingArea[];
    },
  });
}

/**
 * Lightweight exact count of published projects (head-only query).
 * This shows only projects that are actually live on the website.
 */
export function useProjectsCount() {
  return useQuery({
    queryKey: ["projects-count"],
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    queryFn: async () => {
      const { count, error } = await supabase
        .from("projects")
        .select("id", { count: "exact", head: true })
        .eq("is_published", true)
        .or("listing_kind.is.null,listing_kind.neq.leasing");
      if (error) throw error;
      return count ?? 0;
    },
  });
}

/**
 * Total count of ALL projects (published + unpublished).
 */
export function useProjectsTotalCount() {
  return useQuery({
    queryKey: ["projects-total-count"],
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    queryFn: async () => {
      const { count, error } = await supabase
        .from("projects")
        .select("id", { count: "exact", head: true });
      if (error) throw error;
      return count ?? 0;
    },
  });
}

/**
 * Paginated admin projects listing (50 per page).
 */
export function useProjectsPaginated(
  page: number = 0,
  pageSize: number = 50,
  options?: { publishedFilter?: boolean | "all" }
) {
  const publishedFilter = options?.publishedFilter ?? "all";
  // For drafts, use a lightweight query without heavy joins for faster load
  const isDrafts = publishedFilter === false;
  return useQuery({
    queryKey: ["projects-paginated", page, pageSize, publishedFilter],
    queryFn: async () => {
      const from = page * pageSize;
      const to = from + pageSize - 1;

      if (isDrafts) {
        // Lightweight query for drafts - no images/documents joins
        let q = supabase
          .from("projects")
          .select(`
            *,
            developer:developers(id, name, slug, logo_url),
            community:communities(id, name, slug)
          `)
          .or("is_published.is.null,is_published.eq.false")
          .order("created_at", { ascending: false })
          .range(from, to);

        const { data, error } = await q;
        if (error) throw error;
        return (data as unknown as UnifiedProject[]).map(p => ({
          ...p,
          images: [],
          documents: [],
        }));
      }

      let query = supabase
        .from("projects")
        .select(`
          *,
          developer:developers(id, name, slug, logo_url),
          community:communities(id, name, slug),
          images:project_images(id, image_url, alt_text, display_order),
          documents:project_documents(id, document_type, file_url, file_name, display_order, display_title, cover_image_url, is_visible, allow_download, file_size, storage_path)
        `)
        .order("created_at", { ascending: false })
        .range(from, to);
      
      if (publishedFilter === true) {
        query = query.eq("is_published", true);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as UnifiedProject[];
    },
  });
}

/**
 * Count of projects filtered by published status.
 */
export function useProjectsFilteredCount(publishedFilter: boolean | "all" = "all") {
  return useQuery({
    queryKey: ["projects-filtered-count", publishedFilter],
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      let query = supabase
        .from("projects")
        .select("id", { count: "exact", head: true });
      
      if (publishedFilter === true) {
        query = query.eq("is_published", true);
      } else if (publishedFilter === false) {
        query = query.or("is_published.is.null,is_published.eq.false");
      }

      const { count, error } = await query;
      if (error) throw error;
      return count ?? 0;
    },
  });
}

export function useProjects() {
  return useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select(`
          *,
          developer:developers(id, name, slug, logo_url),
          community:communities(id, name, slug),
          images:project_images(id, image_url, alt_text, display_order),
          documents:project_documents(id, document_type, file_url, file_name, display_order)
        `)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as UnifiedProject[];
    },
  });
}

/**
 * Lightweight listing hook - no images/documents joins.
 * Use this for Properties page and other listing views.
 *
 * Progressive fetch strategy for fast first paint on a 2,500+ row catalogue:
 *   Stage 1: fetch the first FAST_PAGE rows and return them immediately so the
 *            grid renders within ~one network round-trip.
 *   Stage 2: in the background, fetch the rest in 1000-row pages and merge
 *            them into the React Query cache so filtering/sorting works on
 *            the full dataset shortly after.
 */
export function useProjectsListing() {
  return useQuery({
    queryKey: ["projects-listing"],
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    queryFn: async () => {
      const LISTING_COLUMNS = `
        id, name, slug, description, location, price_from, price_to,
        bedrooms_min, bedrooms_max, size_min, size_max,
        handover_date, payment_plan, amenities, status,
        is_featured, is_premium, is_sold_out,
        property_type_label, status_label, emirate,
        created_at, updated_at,
        reelly_id, construction_status, sale_status,
        area_name, cover_image_url, is_published,
        developer_name, construction_progress,
        total_units, available_units, down_payment_percent,
        roi_estimate, rental_yield_estimate, latitude, longitude,
        developer:developers(id, name, slug, logo_url),
        community:communities(id, name, slug)
      `;

      // Paginated fetch — Supabase caps at 1000 rows per request.
      // Page through ALL published projects with a cover image so the
      // listings count never silently shrinks as the catalog grows.
      const PAGE_SIZE = 1000;
      const MAX_PAGES = 10; // hard ceiling = 10,000 rows safety net
      const all: unknown[] = [];

      for (let page = 0; page < MAX_PAGES; page++) {
        const from = page * PAGE_SIZE;
        const to = from + PAGE_SIZE - 1;
        const { data, error } = await supabase
          .from("projects")
          .select(LISTING_COLUMNS)
          .eq("is_published", true)
          .or("listing_kind.is.null,listing_kind.neq.leasing")
          .not("cover_image_url", "is", null)
          .neq("cover_image_url", "")
          .order("created_at", { ascending: false })
          .range(from, to);

        if (error) throw error;
        const rows = data ?? [];
        all.push(...rows);
        if (rows.length < PAGE_SIZE) break;
      }

      return dedupePublicProjects(all as unknown as UnifiedProject[]);

    },
  });
}

/**
 * Ultra-light map hook: only fetch the fields needed by /map so the map route
 * can paint immediately instead of waiting for the full listing catalogue query.
 */
export function useProjectsMapListing() {
  return useQuery({
    queryKey: ["projects-map-listing"],
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    queryFn: async () => {
      const MAP_COLUMNS = `
        id, name, slug, location, price_from,
        bedrooms_min, bedrooms_max, size_min,
        handover_date, status, is_sold_out,
        property_type_label, status_label, emirate,
        created_at, sale_status, construction_status,
        area_name, cover_image_url, is_published,
        developer_name, latitude, longitude,
        community:communities(id, name, slug)
      `;

      // Fetch ALL published projects so the total count (e.g. 813) matches
      // the site-wide inventory. Markers are still only rendered for rows
      // that have coordinates — the map view filters those downstream.
      const { data, error } = await supabase
        .from("projects")
        .select(MAP_COLUMNS)
        .eq("is_published", true)
        .or("listing_kind.is.null,listing_kind.neq.leasing")
        .order("created_at", { ascending: false })
        .limit(1200);

      if (error) throw error;
      return dedupePublicProjects((data ?? []) as unknown as UnifiedProject[]);
    },
  });
}

export function useProjectsByCommunity(communitySlug: string) {
  return useQuery({
    queryKey: ["projects", "community", communitySlug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select(`
          *,
          developer:developers(id, name, slug, logo_url),
          community:communities!inner(id, name, slug),
          images:project_images(id, image_url, alt_text, display_order),
          documents:project_documents(id, document_type, file_url, file_name, display_order)
        `)
        .eq("community.slug", communitySlug)
        .eq("is_published", true)
        .or("listing_kind.is.null,listing_kind.neq.leasing")
        .not("cover_image_url", "is", null)
        .neq("cover_image_url", "")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
          return dedupePublicProjects(data as UnifiedProject[]);
    },
    enabled: !!communitySlug,
  });
}

export function useProjectsByDeveloper(developerSlug: string) {
  return useQuery({
    queryKey: ["projects", "developer", developerSlug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select(`
          *,
          developer:developers!inner(id, name, slug, logo_url),
          community:communities(id, name, slug),
          images:project_images(id, image_url, alt_text, display_order),
          documents:project_documents(id, document_type, file_url, file_name, display_order)
        `)
        .eq("developer.slug", developerSlug)
        .eq("is_published", true)
        .or("listing_kind.is.null,listing_kind.neq.leasing")
        .not("cover_image_url", "is", null)
        .neq("cover_image_url", "")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
          return dedupePublicProjects(data as UnifiedProject[]);
    },
    enabled: !!developerSlug,
  });
}

export function useProject(projectSlug: string) {
  return useQuery({
    queryKey: ["project", projectSlug],
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select(`
          *,
          developer:developers(id, name, slug, logo_url, founded_year, completed_projects, offplan_projects, description, headquarters),
          community:communities(id, name, slug),
          images:project_images(id, image_url, alt_text, display_order),
          documents:project_documents(id, document_type, file_url, file_name, display_order)
        `)
        .eq("slug", projectSlug)
        .maybeSingle();
      
      if (error) throw error;
      return data as UnifiedProject | null;
    },
    enabled: !!projectSlug,
  });
}

export function useCommunity(communitySlug: string) {
  return useQuery({
    queryKey: ["community", communitySlug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("communities")
        .select("*")
        .eq("slug", communitySlug)
        .maybeSingle();
      
      if (error) throw error;
      return data as Community | null;
    },
    enabled: !!communitySlug,
  });
}

export function useDeveloper(developerSlug: string) {
  return useQuery({
    queryKey: ["developer", developerSlug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("developers")
        .select("*")
        .eq("slug", developerSlug)
        .maybeSingle();
      
      if (error) throw error;
      return data as unknown as Developer | null;
    },
    enabled: !!developerSlug,
  });
}

export interface AreaItem {
  id: string;
  name: string;
  slug: string;
  emirate: string;
}

export function useAreas() {
  return useQuery({
    queryKey: ["areas-all"],
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("areas")
        .select("id, name, slug, emirate")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data as AreaItem[];
    },
  });
}
