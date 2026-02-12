import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { ReellyProject } from "./useReellyProjects";
import { mapDbProjectToReellyProject } from "@/utils/mapDbToReellyProject";

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
