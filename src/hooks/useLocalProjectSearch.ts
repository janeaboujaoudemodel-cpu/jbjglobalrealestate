import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { ReellyProject } from "./useReellyProjects";

function mapDbProjectToReellyProject(p: any): ReellyProject {
  const slug = p.slug || p.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return {
    id: p.reelly_id || p.id,
    name: p.name,
    slug,
    developer_name: p.developer_name || '',
    construction_status: p.construction_status,
    sale_status: p.sale_status,
    status_label: p.status_label || p.sale_status,
    description: p.description || p.short_description,
    handover_date: p.handover_date || p.expected_completion,
    location: p.location || p.area_name,
    emirate: p.emirate,
    latitude: p.latitude ? Number(p.latitude) : null,
    longitude: p.longitude ? Number(p.longitude) : null,
    price_from: p.price_from ? Number(p.price_from) : null,
    price_to: p.price_to ? Number(p.price_to) : null,
    size_min: p.size_min ? Number(p.size_min) : null,
    size_max: p.size_max ? Number(p.size_max) : null,
    thumbnail: p.cover_image_url,
    gallery: [],
    images: [],
  };
}

export function useLocalProjectSearch(search: string | undefined) {
  return useQuery({
    queryKey: ['local-project-search', search],
    queryFn: async (): Promise<ReellyProject[]> => {
      if (!search) return [];
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .ilike('name', `%${search}%`)
        .limit(20);
      if (error) throw error;
      return (data || []).map(mapDbProjectToReellyProject);
    },
    enabled: !!search && search.length >= 2,
    staleTime: 2 * 60 * 1000,
  });
}
