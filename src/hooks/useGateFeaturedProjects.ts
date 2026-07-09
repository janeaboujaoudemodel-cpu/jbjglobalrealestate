import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface GateFeaturedProject {
  id: string;
  slug?: string | null;
  name: string;
  developer_name?: string | null;
  location?: string | null;
  area_name?: string | null;
  emirate?: string | null;
  community?: string | null;
  starting_price?: number | null;
  price_from?: number | null;
  price_to?: number | null;
  bedrooms_min?: number | null;
  bedrooms_max?: number | null;
  handover_date?: string | null;
  status?: string | null;
  sale_status?: string | null;
  construction_status?: string | null;
  image_url?: string | null;
  hero_image?: string | null;
  cover_image?: string | null;
  cover_image_url?: string | null;
  card_image_url?: string | null;
  gallery_start_image_url?: string | null;
  images?: string[] | null;
  project_images?: Array<{ image_url?: string | null; display_order?: number | null }> | null;
}

const PROJECT_SELECT = `
  id, name, slug, developer_name, location, area_name, emirate,
  price_from, price_to, bedrooms_min, bedrooms_max, handover_date,
  construction_status,
  cover_image_url, card_image_url, gallery_start_image_url,
  is_published, status, sale_status, created_at, updated_at,
  project_images(image_url, display_order)
`;

const isUsableMediaUrl = (value: unknown) => {
  const url = String(value || "").trim();
  if (!url) return false;
  if (/^data:/i.test(url)) return false;
  if (url.length > 900) return false;
  return /^(https?:\/\/|\/)/i.test(url);
};

const firstUsableMedia = (...values: unknown[]) => values.find(isUsableMediaUrl) as string | undefined;

const sortedGalleryUrls = (images: unknown) => {
  if (!Array.isArray(images)) return [];
  return images
    .filter((img): img is { image_url?: string | null; display_order?: number | null } => !!img && typeof img === "object")
    .sort((a, b) => Number(a.display_order ?? 999) - Number(b.display_order ?? 999))
    .map((img) => img.image_url)
    .filter(isUsableMediaUrl) as string[];
};

const normalizeStatus = (value: unknown) => String(value || "").trim().toLowerCase();

const handoverTime = (project: any): number | null => {
  const raw = project?.handover_date;
  if (!raw) return null;
  const t = Date.parse(raw);
  return Number.isFinite(t) ? t : null;
};

const isReadyProject = (project: any) => {
  const statusText = [project?.sale_status, project?.construction_status, project?.status].map(normalizeStatus).join(" ");
  if (/ready|complete|completed|delivered|handed[ -]?over/.test(statusText) && !/off[ -]?plan|under construction|new launch/.test(statusText)) return true;
  const t = handoverTime(project);
  return t !== null && t < Date.now();
};

const isOffPlanProject = (project: any) => {
  if (isReadyProject(project)) return false;
  const statusText = [project?.sale_status, project?.construction_status, project?.status].map(normalizeStatus).join(" ");
  const t = handoverTime(project);
  // If handover date exists, it MUST be in the future for off-plan.
  if (t !== null) return t >= Date.now();
  // No date — trust the status label.
  return /off[ -]?plan|under construction|new launch|launch|presale|eoi/.test(statusText);
};

/**
 * Gate marquee only shows OFF-PLAN projects with a future handover.
 * Projects with a past handover_date are excluded (they are either ready
 * or stale data — either way they must not be labelled "Off-plan / launch").
 */
const isEligibleForGate = (project: GateFeaturedProject) => {
  const t = handoverTime(project);
  if (t !== null && t < Date.now()) return false; // never show past-handover as launch
  return isOffPlanProject(project);
};

const rankForGate = (project: GateFeaturedProject) => {
  const t = handoverTime(project);
  return t ?? Number.MAX_SAFE_INTEGER; // soonest future handover first
};

const normalizeProject = (project: any): GateFeaturedProject | null => {
  if (!project?.id || !project?.name) return null;
  const cover = firstUsableMedia(
    ...sortedGalleryUrls(project.project_images),
    project.gallery_start_image_url,
    project.cover_image_url,
    project.card_image_url,
    project.image_url,
    project.hero_image,
    project.cover_image,
    ...(Array.isArray(project.images) ? project.images : [])
  ) || null;
  const gallery = [
    ...sortedGalleryUrls(project.project_images),
    ...(Array.isArray(project.images) ? project.images.filter(isUsableMediaUrl) : []),
  ];

  return {
    ...project,
    community: project.area_name || project.community || project.location || null,
    starting_price: project.price_from ?? project.starting_price ?? null,
    image_url: cover,
    hero_image: project.gallery_start_image_url || project.hero_image || cover,
    cover_image: cover,
    images: gallery.length ? gallery : cover ? [cover] : [],
  } as GateFeaturedProject;
};

/**
 * Reads featured projects for a specific surface (home/gate/website).
 * If the placement is in auto mode with an interval, triggers a server-side
 * refresh before selecting (idempotent — no-op inside the window).
 */
export function useSurfaceFeaturedProjects(surface: "home" | "gate" | "website") {
  return useQuery({
    queryKey: ["surface-featured-projects", surface],
    queryFn: async (): Promise<GateFeaturedProject[]> => {
      // Ask backend to refresh if auto mode + interval elapsed (safe no-op otherwise)
      try {
        await supabase.rpc("refresh_auto_featured" as any, { p_surface: surface });
      } catch {
        /* ignore — read still returns whatever exists */
      }

      const q: any = supabase.from("home_featured_projects" as any);
      const { data, error } = await q
        .select(
          `id, display_order, is_visible, project_id, project:project_id (${PROJECT_SELECT})`
        )
        .eq("surface", surface)
        .eq("is_visible", true)
        .order("display_order", { ascending: true });

      if (error) throw error;

      const configured = ((data as any[]) ?? [])
        .map((r) => normalizeProject(r.project || r.projects))
        .filter(Boolean) as GateFeaturedProject[];

      // Real-data fallback for empty surfaces: newest published projects, with
      // Amra-style wellness launches promoted first. No fake/static cards.
      const base = (supabase.from("projects" as any) as any)
        .select(PROJECT_SELECT)
        .eq("is_published", true)
        .is("deleted_at", null);

      const [amraRes, latestRes] = await Promise.all([
        base.ilike("name", "%amra%").order("created_at", { ascending: false }).limit(4),
        (supabase.from("projects" as any) as any)
          .select(PROJECT_SELECT)
          .eq("is_published", true)
          .is("deleted_at", null)
          .order("created_at", { ascending: false })
          .limit(80),
      ]);

      const byId = new Map<string, GateFeaturedProject>();
      [...configured, ...((amraRes.data as any[]) ?? []), ...((latestRes.data as any[]) ?? [])]
        .map(normalizeProject)
        .filter((project): project is GateFeaturedProject => !!project && !!project.cover_image)
        .filter(isEligibleForGate)
        .forEach((project) => {
          if (project?.id && !byId.has(project.id)) byId.set(project.id, project);
        });

      const sorted = Array.from(byId.values()).sort((a, b) => rankForGate(a) - rankForGate(b));
      return sorted.slice(0, 8);
    },
    staleTime: 60_000,
  });
}
