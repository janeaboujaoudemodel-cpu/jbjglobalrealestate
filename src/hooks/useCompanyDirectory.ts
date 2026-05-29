import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type DirectoryEntry = {
  user_id: string;
  full_name: string;
  email: string | null;
  title: string | null;
  department: string | null;
  avatar_initials: string | null;
  is_founder: boolean;
};

export function useCompanyDirectory() {
  return useQuery({
    queryKey: ["company-directory"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_company_directory" as any);
      if (error) throw error;
      return (data ?? []) as DirectoryEntry[];
    },
    staleTime: 60_000,
  });
}
