import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Language {
  id: string;
  code: string;
  name: string;
  native_name: string | null;
  is_default: boolean;
  is_active: boolean;
  is_rtl: boolean;
  sort_order: number;
}

export function useLanguages() {
  return useQuery({
    queryKey: ["languages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("languages")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });

      if (error) {
        console.error("Error fetching languages:", error);
        throw error;
      }

      return (data || []) as Language[];
    },
    staleTime: 30 * 60 * 1000, // 30 minutes - languages rarely change
  });
}

export function useLanguageByCode(code: string | undefined) {
  return useQuery({
    queryKey: ["language", code],
    queryFn: async () => {
      if (!code) return null;

      const { data, error } = await supabase
        .from("languages")
        .select("*")
        .eq("code", code)
        .eq("is_active", true)
        .maybeSingle();

      if (error) {
        console.error("Error fetching language:", error);
        throw error;
      }

      return data as Language | null;
    },
    enabled: !!code,
    staleTime: 30 * 60 * 1000,
  });
}
