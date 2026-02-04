import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";

export interface AreaTranslation {
  id: string;
  area_id: string;
  language_code: string;
  name: string | null;
  description: string | null;
}

export interface ProjectTranslation {
  id: string;
  project_id: string;
  language_code: string;
  title: string | null;
  description: string | null;
  tagline: string | null;
}

export function useAreaTranslation(areaId: string | undefined) {
  const { language } = useLanguage();

  return useQuery({
    queryKey: ["area-translation", areaId, language],
    queryFn: async () => {
      if (!areaId) return null;

      const { data, error } = await supabase
        .from("area_translations")
        .select("*")
        .eq("area_id", areaId)
        .eq("language_code", language)
        .maybeSingle();

      if (error) {
        console.error("Error fetching area translation:", error);
        throw error;
      }

      return data as AreaTranslation | null;
    },
    enabled: !!areaId && language !== "en",
    staleTime: 5 * 60 * 1000,
  });
}

export function useProjectTranslation(projectId: string | undefined) {
  const { language } = useLanguage();

  return useQuery({
    queryKey: ["project-translation", projectId, language],
    queryFn: async () => {
      if (!projectId) return null;

      const { data, error } = await supabase
        .from("project_translations")
        .select("*")
        .eq("project_id", projectId)
        .eq("language_code", language)
        .maybeSingle();

      if (error) {
        console.error("Error fetching project translation:", error);
        throw error;
      }

      return data as ProjectTranslation | null;
    },
    enabled: !!projectId && language !== "en",
    staleTime: 5 * 60 * 1000,
  });
}

// Bulk fetch translations for a list of areas
export function useAreasTranslations(areaIds: string[]) {
  const { language } = useLanguage();

  return useQuery({
    queryKey: ["areas-translations", areaIds, language],
    queryFn: async () => {
      if (areaIds.length === 0) return {};

      const { data, error } = await supabase
        .from("area_translations")
        .select("*")
        .in("area_id", areaIds)
        .eq("language_code", language);

      if (error) {
        console.error("Error fetching area translations:", error);
        throw error;
      }

      // Return as a map for easy lookup
      const translationsMap: Record<string, AreaTranslation> = {};
      (data || []).forEach((t) => {
        translationsMap[t.area_id] = t as AreaTranslation;
      });
      return translationsMap;
    },
    enabled: areaIds.length > 0 && language !== "en",
    staleTime: 5 * 60 * 1000,
  });
}

// Bulk fetch translations for a list of projects
export function useProjectsTranslations(projectIds: string[]) {
  const { language } = useLanguage();

  return useQuery({
    queryKey: ["projects-translations", projectIds, language],
    queryFn: async () => {
      if (projectIds.length === 0) return {};

      const { data, error } = await supabase
        .from("project_translations")
        .select("*")
        .in("project_id", projectIds)
        .eq("language_code", language);

      if (error) {
        console.error("Error fetching project translations:", error);
        throw error;
      }

      // Return as a map for easy lookup
      const translationsMap: Record<string, ProjectTranslation> = {};
      (data || []).forEach((t) => {
        translationsMap[t.project_id] = t as ProjectTranslation;
      });
      return translationsMap;
    },
    enabled: projectIds.length > 0 && language !== "en",
    staleTime: 5 * 60 * 1000,
  });
}
