import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface GateFeaturedProject {
  id: string;
  name: string;
  developer_name?: string | null;
  location?: string | null;
  community?: string | null;
  starting_price?: number | null;
  image_url?: string | null;
  hero_image?: string | null;
  cover_image?: string | null;
  images?: string[] | null;
}

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

      const { data, error } = await supabase
        .from("home_featured_projects" as any)
        .select(
          "id, display_order, is_visible, project_id, projects:project_id (id, name, developer_name, location, community, starting_price, image_url, hero_image, cover_image, images)"
        )
        .eq("surface" as any, surface)
        .eq("is_visible", true)
        .order("display_order", { ascending: true });

      if (error) throw error;

      return ((data as any[]) ?? [])
        .map((r) => r.projects)
        .filter(Boolean) as GateFeaturedProject[];
    },
    staleTime: 60_000,
  });
}
