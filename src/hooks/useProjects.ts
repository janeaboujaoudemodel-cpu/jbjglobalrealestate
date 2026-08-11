import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { isValidDeveloperLogoUrl } from "@/utils/developerLogo";

// Re-export the unified type for backwards compatibility
export type { UnifiedProject as Project } from "@/types/unifiedProject";
import type { UnifiedProject } from "@/types/unifiedProject";

const hasPublicPhoto = (p: UnifiedProject) =>
  !!(p.cover_image_url || p.card_image_url || p.gallery_start_image_url || p.images?.some((img) => !!img.image_url));

const hasApprovedDeveloperLogo = (project: UnifiedProject) =>
  isValidDeveloperLogoUrl(project.developer?.logo_url_processed || project.developer?.logo_url);

const GENERIC_DUPLICATE_WORDS = new Set([
  "the",
  "in",
  "by",
  "at",
  "residence",
  "residences",
  "residential",
  "resort",
  "resorts",
  "tower",
  "towers",
  "apartments",
  "apartment",
  "apartments",
  "villa",
  "villas",
  "first",
  "integrative",
  "wellness",
  "dubai",
  "uae",
  "phase",
  "edition",
  "collection",
]);

const normalizeProjectIdentity = (project: UnifiedProject) => {
  const raw = `${project.name || project.slug || ""}`.toLowerCase();
  const compact = raw.replace(/[^a-z0-9]+/g, "");
  const tokens = raw
    .replace(/&/g, " and ")
    .replace(/\b(residences?|residential|resorts?|towers?|apartments?|villas?|phase|edition|collection)\b/g, " ")
    .split(/[^a-z0-9]+/)
    .filter(Boolean)
    .filter((token) => !GENERIC_DUPLICATE_WORDS.has(token));
  return tokens.length ? tokens.join("") : compact;
};

const getPublicDedupeKey = (project: UnifiedProject) => {
  const identity = normalizeProjectIdentity(project);
  const developer = `${project.developer?.slug || project.developer_name || project.developer_id || ""}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
  return `${developer || "unknown"}:${identity}`;
};

const dedupePublicProjects = (projects: UnifiedProject[]) => {
  const seen = new Set<string>();
  return projects.filter((project) => {
    if (!hasPublicPhoto(project)) return false;
    const key = getPublicDedupeKey(project);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const hasText = (value: unknown) => typeof value === "string" && value.trim().length > 0;

const projectCardQualityScore = (project: UnifiedProject) => {
  let score = 0;
  if (hasPublicPhoto(project)) score += 20;
  if (hasApprovedDeveloperLogo(project)) score += 18;
  if (project.developer?.id || project.developer_id) score += 10;
  if (typeof project.price_from === "number" && project.price_from > 0) score += 16;
  if (hasText(project.description) || hasText(project.short_description)) score += 14;
  if (hasText(project.handover_date) || hasText(project.expected_completion)) score += 10;
  if (hasText(project.payment_plan) || project.payment_breakdown) score += 8;
  if (project.is_featured) score += 6;
  if (project.is_premium) score += 4;
  return score;
};

const sortPublicProjectsForListing = (projects: UnifiedProject[]) =>
  [...projects].sort((a, b) => {
    const qa = projectCardQualityScore(a);
    const qb = projectCardQualityScore(b);
    if (qa !== qb) return qb - qa;
    const fa = a.is_featured ? 1 : 0;
    const fb = b.is_featured ? 1 : 0;
    if (fa !== fb) return fb - fa;
    const pa = a.is_premium ? 1 : 0;
    const pb = b.is_premium ? 1 : 0;
    if (pa !== pb) return pb - pa;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

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
  logo_needs_invert?: boolean | null;
  rank: number;
  founded_year: number | null;
  completed_projects: number | null;
  offplan_projects: number | null;
  portfolio_worth: number | null;
  headquarters: string | null;
  website_url?: string | null;
  ceo_name?: string | null;
  instagram_url?: string | null;
  linkedin_url?: string | null;
  office_phone?: string | null;
  admin_email?: string | null;
  office_address?: string | null;
  google_drive_url?: string | null;
  custom_fields?: Json | null;
  public_fields?: Json | null;
  total_units_delivered?: number | null;
  upcoming_units?: number | null;
  notable_projects?: string | null;
  parent_company?: string | null;
  specialization?: string | null;
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

/**
 * Public-safe column list. `select("*")` is rejected with
 * "permission denied for table developers" for anonymous visitors because
 * sensitive columns (office_phone, admin_email, notes, …) are not granted
 * to the anon role — so we must enumerate the public columns explicitly.
 */
/**
 * PERF: the developer directory only needs a project count and one cover image
 * per developer. It used to call useProjects() which pulled every project row
 * with `select(*)` plus image/document joins — several MB before the page could
 * paint, which is why the directory rendered blank for 10+ seconds. This hook
 * fetches two columns instead.
 */
export function useDeveloperProjectStats() {
  return useQuery({
    queryKey: ["developer-project-stats"],
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("developer_id, developer_name, cover_image_url, card_image_url, gallery_start_image_url, is_featured, total_units, is_published");
      if (error) throw error;

      const counts: Record<string, number> = {};
      const images: Record<string, string> = {};
      const imageScores: Record<string, number> = {};
      const countsByName: Record<string, number> = {};
      const imagesByName: Record<string, string> = {};
      const imageScoresByName: Record<string, number> = {};
      const imageCandidates: Record<string, Array<{ url: string; score: number }>> = {};
      const imageCandidatesByName: Record<string, Array<{ url: string; score: number }>> = {};
      const normalizeDeveloperName = (value?: string | null) =>
        (value || "").toLowerCase().replace(/[^a-z0-9]+/g, "");
      for (const row of (data ?? []) as Array<{
        developer_id: string | null;
        developer_name: string | null;
        cover_image_url: string | null;
        card_image_url: string | null;
        gallery_start_image_url: string | null;
        is_featured: boolean | null;
        total_units: number | null;
        is_published: boolean | null;
      }>) {
        // Published projects drive the counts; project photography from any
        // project record (published or not) is still real media and is allowed
        // to hydrate the developer hero so no card falls back to a placeholder.
        const countable = row.is_published === true;
        // LOCKED: developer-directory heroes must come from an actual project's
        // authoritative cover. Card/gallery derivatives are only fallbacks;
        // developer profile artwork and logos are never part of this query.
        const image = row.cover_image_url || row.card_image_url || row.gallery_start_image_url;
        const score = (row.is_featured ? 1_000_000 : 0) + Math.max(0, row.total_units ?? 0);
        const normalizedName = normalizeDeveloperName(row.developer_name);
        if (normalizedName) {
          if (countable) countsByName[normalizedName] = (countsByName[normalizedName] ?? 0) + 1;
          if (image && score >= (imageScoresByName[normalizedName] ?? -1)) {
            imageScoresByName[normalizedName] = score;
            imagesByName[normalizedName] = image;
          }
          if (image) imageCandidatesByName[normalizedName] = [...(imageCandidatesByName[normalizedName] || []), { url: image, score }];
        }
        if (!row.developer_id) continue;
        if (countable) counts[row.developer_id] = (counts[row.developer_id] ?? 0) + 1;
        if (image) {
          imageCandidates[row.developer_id] = [...(imageCandidates[row.developer_id] || []), { url: image, score }];
          if (score >= (imageScores[row.developer_id] ?? -1)) {
            imageScores[row.developer_id] = score;
            images[row.developer_id] = image;
          }
        }
      }
      const finalize = (source: Record<string, Array<{ url: string; score: number }>>) =>
        Object.fromEntries(Object.entries(source).map(([key, values]) => [key, [...new Map(values.sort((a, b) => {
          const aStable = /reelly-backend\.s3|\/storage\/v1\/object\/public\//i.test(a.url) ? 1 : 0;
          const bStable = /reelly-backend\.s3|\/storage\/v1\/object\/public\//i.test(b.url) ? 1 : 0;
          return bStable - aStable || b.score - a.score;
        }).map((item) => [item.url, item.url])).values()].slice(0, 8)]));
      return { counts, images, countsByName, imagesByName, imageCandidates: finalize(imageCandidates), imageCandidatesByName: finalize(imageCandidatesByName) };
    },
  });
}

const DEVELOPERS_PUBLIC_SELECT = [
  "id", "name", "slug", "logo_url", "logo_url_processed", "logo_url_dark", "logo_bg_color",
  "logo_verified", "logo_locked", "logo_source", "logo_status", "logo_candidates", "logo_needs_invert",
  "description", "description_languages", "rank", "excel_order", "created_at", "updated_at",
  "founded_year", "completed_projects", "offplan_projects", "portfolio_worth", "headquarters",
  "feature_image_url", "website_url", "ceo_name", "total_units_delivered", "upcoming_units",
  "expected_completion_year", "parent_company", "license_number", "specialization",
  "instagram_url", "linkedin_url", "registration_status", "is_hidden", "has_active_rep",
  "is_manually_verified", "manually_verified_at", "needs_review", "public_fields",
  "whatsapp_group_url", "telegram_group_url", "google_drive_url", "group_status",
  "focus_project_id", "focus_project_label",
].join(",");

export function useDevelopers(includeHidden = false) {
  return useQuery({
    // Asset revision participates in the key so newly verified directory media
    // replaces any hydrated/stale card record immediately across the site.
    queryKey: ["developers", "verified-media-v2", includeHidden],
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    queryFn: async () => {
      let query = supabase
        .from("developers")
        .select(DEVELOPERS_PUBLIC_SELECT)
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
        const hasLogo = d.logo_url ? 3 : 0;
        // Real master-plan/feature photography outranks a bare logo-only row:
        // duplicate brand records where the logo row has no projects and no
        // media must never win the directory card.
        const hasFeatureImage = (d as { feature_image_url?: string | null }).feature_image_url ? 4 : 0;
        const canonicalSlug = !/^\d/.test(slug) && !slug.startsWith("developed-by-") ? 2 : 0;
        const shortSlug = slug.length > 0 && slug.length < 40 ? 1 : 0;
        const rankBonus = typeof d.rank === "number" ? Math.max(0, 1000 - d.rank) / 1000 : 0;
        return hasLogo + hasFeatureImage + canonicalSlug + shortSlug + rankBonus;
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
        if (!existing) {
          byKey.set(key, row);
          continue;
        }
        // Merge duplicate brand rows so neither the official logo nor the real
        // master-plan photography is lost when the winner is chosen.
        const winner = scoreOf(row) > scoreOf(existing) ? row : existing;
        const loser = winner === row ? existing : row;
        const merged = { ...winner } as Developer & { feature_image_url?: string | null };
        const loserAny = loser as Developer & { feature_image_url?: string | null };
        if (!merged.logo_url && loser.logo_url) merged.logo_url = loser.logo_url;
        if (!merged.feature_image_url && loserAny.feature_image_url) merged.feature_image_url = loserAny.feature_image_url;
        if (!merged.description && loser.description) merged.description = loser.description;
        if (!merged.website_url && loser.website_url) merged.website_url = loser.website_url;
        byKey.set(key, merged);
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

/** Tiny query for navigation surfaces that only show a curated slug list. */
export function useFeaturedDevelopers(slugs: readonly string[]) {
  const stableSlugs = [...slugs].sort();
  return useQuery({
    queryKey: ["featured-developers", stableSlugs.join(",")],
    staleTime: 60 * 60 * 1000,
    gcTime: 2 * 60 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("developers")
        .select("id,name,slug")
        .in("slug", stableSlugs);
      if (error) throw error;
      return (data ?? []) as Pick<Developer, "id" | "name" | "slug">[];
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
    // Freshness comes from the realtime `projects` subscription in
    // useProjectsListing (it invalidates this key). Polling every 60s only
    // added main-thread work and network chatter on every open tab.
    refetchOnWindowFocus: false,

    queryFn: async () => {
      const { count, error } = await supabase
        .from("projects")
        .select("id", { count: "exact", head: true })
        .eq("is_published", true)
        .is("deleted_at", null)
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
            developer:developers!projects_developer_id_fkey(id, name, slug, logo_url, logo_url_processed, logo_locked, website_url),
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
          developer:developers!projects_developer_id_fkey(id, name, slug, logo_url, logo_url_processed, logo_locked, website_url),
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
          developer:developers!projects_developer_id_fkey(id, name, slug, logo_url, logo_url_processed, logo_locked, website_url),
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
 * Fetches the full catalogue (bounded, paginated) in a single query so that
 * search/filter always operate on the complete dataset. A progressive
 * fast-paint variant was tried but left users on a 120-row shortlist whenever
 * the background pass failed, so filters/search silently missed projects.
 */
export function useProjectsListing() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel(`public-project-listing-${Math.random().toString(36).slice(2)}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "projects" },
        () => {
          void queryClient.invalidateQueries({ queryKey: ["projects-listing"] });
          void queryClient.invalidateQueries({ queryKey: ["projects-count"] });
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return useQuery({
    queryKey: ["projects-listing"],
    // The catalogue is ~1k rows with joins (multi-MB JSON). It used to be
    // re-fetched every 60s and on every window focus, which re-parsed and
    // re-rendered the whole grid and produced long main-thread tasks.
    // Realtime `postgres_changes` above already invalidates this key the
    // instant a project changes, so polling is pure overhead.
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,

    queryFn: async () => {
      const LISTING_COLUMNS = `
        id, name, slug, description, location, price_from, price_to,
        bedrooms_min, bedrooms_max, size_min, size_max,
        handover_date, expected_completion, payment_plan, payment_breakdown, amenities, status,
        is_featured, is_premium, is_sold_out,
        property_type_label, status_label, emirate,
        created_at, updated_at,
        reelly_id, construction_status, sale_status,
        area_name, cover_image_url, card_image_url, gallery_start_image_url, is_published,
        developer_name, construction_progress,
        total_units, available_units, down_payment_percent,
        roi_estimate, rental_yield_estimate, latitude, longitude,
          deleted_at,
        developer_id,
        developer:developers!projects_developer_id_fkey(id, name, slug, logo_url, logo_url_processed, logo_locked, website_url, logo_bg_color),
        community:communities(id, name, slug)
      `;

      const baseQuery = () =>
        supabase
          .from("projects")
          .select(LISTING_COLUMNS)
          .eq("is_published", true)
          .or("listing_kind.is.null,listing_kind.neq.leasing")
          .is("deleted_at", null);

      const PAGE_SIZE = 1000;
      const MAX_PAGES = 10; // bounded upper limit (10k rows)
      const all: unknown[] = [];
      for (let page = 0; page < MAX_PAGES; page++) {
        const from = page * PAGE_SIZE;
        const to = from + PAGE_SIZE - 1;
        const { data, error } = await baseQuery()
          .order("created_at", { ascending: false })
          .range(from, to);
        if (error) throw error;
        const rows = data ?? [];
        all.push(...rows);
        if (rows.length < PAGE_SIZE) break;
      }

      // The database eligibility predicate is the catalogue contract. Do not
      // silently remove eligible rows because an image is missing or because
      // two project names look similar: both behaviours made the grid total
      // disagree with the exact count shown in the shared search bar.
      // Sort first so canonical duplicates retain the most complete owner-
      // maintained record, then enforce the same identity contract used by
      // community, developer and map views.
      // Keep every database-eligible listing. Missing media or a similar name
      // must never silently remove an owner-maintained published project.
      return sortPublicProjectsForListing(
        (all as unknown as UnifiedProject[]).map((project) => ({ ...project, images: [] })),
      );
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
        deleted_at,
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
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .limit(1200);

      if (error) throw error;
      return (data ?? []) as unknown as UnifiedProject[];
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
          developer:developers!projects_developer_id_fkey(id, name, slug, logo_url, logo_url_processed, logo_locked, website_url),
          community:communities!inner(id, name, slug),
          images:project_images(id, image_url, alt_text, display_order),
          documents:project_documents(id, document_type, file_url, file_name, display_order)
        `)
        .eq("community.slug", communitySlug)
        .eq("is_published", true)
        .or("listing_kind.is.null,listing_kind.neq.leasing")
        .is("deleted_at", null)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
          return dedupePublicProjects(data as UnifiedProject[]);
    },
    enabled: !!communitySlug,
  });
}

export function useProjectsByDeveloper(developerSlug: string) {
  const canonicalSlug = developerSlug === "sobha" ? "sobha-realty" : developerSlug;
  return useQuery({
    queryKey: ["projects", "developer", canonicalSlug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select(`
          *,
          developer:developers!projects_developer_id_fkey!inner(id, name, slug, logo_url, logo_url_processed, logo_locked, website_url),
          community:communities(id, name, slug),
          images:project_images(id, image_url, alt_text, display_order),
          documents:project_documents(id, document_type, file_url, file_name, display_order)
        `)
        .eq("developer.slug", canonicalSlug)
        .or("listing_kind.is.null,listing_kind.neq.leasing")
        .is("deleted_at", null)
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
      const PROJECT_SELECT = `
          *,
          developer:developers!projects_developer_id_fkey(id, name, slug, logo_url, logo_url_processed, logo_locked, founded_year, completed_projects, offplan_projects, upcoming_units, total_units_delivered, description, headquarters, ceo_name, website_url, specialization, parent_company, license_number, linkedin_url, instagram_url, portfolio_worth),
          community:communities(id, name, slug),
          images:project_images(id, image_url, alt_text, display_order),
          documents:project_documents(id, document_type, file_url, file_name, display_order, display_title, cover_image_url, is_visible, allow_download, file_size, storage_path),
          videos:project_videos(id, url, title, display_order, is_visible)
        `;

      const { data, error } = await supabase
        .from("projects")
        .select(PROJECT_SELECT)
        .eq("slug", projectSlug)
        .is("deleted_at", null)
        .maybeSingle();

      if (error) throw error;

      // The exact slug may belong to a retired/soft-deleted duplicate (e.g.
      // "arya" vs the live "arya-residences-citi-developers-dubai-islands").
      // Resolve to the live, enriched record instead of falling through to a
      // thin external record with placeholder facts and low-res assets.
      let resolved: any = data;
      if (!resolved && projectSlug) {
        const { data: alias } = await supabase
          .from("projects")
          .select(PROJECT_SELECT)
          .is("deleted_at", null)
          .like("slug", `${projectSlug}-%`)
          .order("updated_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        resolved = alias ?? null;
      }
      if (!resolved) return null;
      const visibleVideos = ((resolved as any).videos || [])
        .filter((video: any) => video.is_visible ?? true)
        .sort((a: any, b: any) => (a.display_order ?? 0) - (b.display_order ?? 0));
      return { ...(resolved as unknown as UnifiedProject), videos: visibleVideos };

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
  const canonicalSlug = developerSlug === "sobha" ? "sobha-realty" : developerSlug;
  return useQuery({
    queryKey: ["developer", canonicalSlug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("developers")
        .select(DEVELOPERS_PUBLIC_SELECT)

        .eq("slug", canonicalSlug)
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
