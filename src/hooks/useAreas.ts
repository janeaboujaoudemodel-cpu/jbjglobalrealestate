import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Area {
  id: string;
  reelly_id: number | null;
  name: string;
  slug: string;
  description: string | null;
  emirate: string;
  country: string | null;
  image_url: string | null;
  hero_image_url: string | null;
  latitude: number | null;
  longitude: number | null;
  property_count: number;
  developer_count: number;
  project_count_sale: number;
  avg_price_sqft: number | null;
  provident_url: string | null;
  is_trending: boolean;
  is_high_demand: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function useAreas(options?: {
  emirate?: string;
  trendingOnly?: boolean;
  limit?: number;
}) {
  return useQuery({
    queryKey: ["areas", options?.emirate, options?.trendingOnly, options?.limit],
    queryFn: async () => {
      let query = supabase
        .from("areas")
        .select("*")
        .eq("is_active", true)
        .order("property_count", { ascending: false });

      if (options?.emirate) {
        query = query.eq("emirate", options.emirate);
      }

      if (options?.trendingOnly) {
        query = query.eq("is_trending", true);
      }

      if (options?.limit) {
        query = query.limit(options.limit);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching areas:", error);
        throw error;
      }

      return (data || []) as Area[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useAreaBySlug(slug: string | undefined) {
  return useQuery({
    queryKey: ["area", slug],
    queryFn: async () => {
      if (!slug) return null;

      const { data, error } = await supabase
        .from("areas")
        .select("*")
        .eq("slug", slug)
        .eq("is_active", true)
        .maybeSingle();

      if (error) {
        console.error("Error fetching area:", error);
        throw error;
      }

      return data as Area | null;
    },
    enabled: !!slug,
    staleTime: 5 * 60 * 1000,
  });
}

// Get unique emirates from areas
export function useEmiratesWithAreas() {
  return useQuery({
    queryKey: ["emirates-with-areas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("areas")
        .select("emirate")
        .eq("is_active", true);

      if (error) {
        console.error("Error fetching emirates:", error);
        throw error;
      }

      // Get unique emirates
      const emirates = [...new Set(data?.map(a => a.emirate) || [])];
      return emirates.filter(Boolean).sort();
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}
