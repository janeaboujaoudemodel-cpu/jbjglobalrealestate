import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface HRStats {
  activeEmployees: number;
  openPositions: number;
  newHires: number;
  aiInsights: number;
  avgPerformance: number;
}

export function useHRStats() {
  return useQuery({
    queryKey: ["hr-stats"],
    queryFn: async (): Promise<HRStats> => {
      // Get active employees count
      const { count: employeeCount } = await supabase
        .from("crm_users_profile")
        .select("*", { count: "exact", head: true })
        .eq("is_active", true);

      // Get open positions count
      const { count: positionsCount } = await supabase
        .from("hr_job_offers")
        .select("*", { count: "exact", head: true })
        .eq("is_active", true);

      // Get new hires in last 30 days (employees created recently)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { count: newHiresCount } = await supabase
        .from("crm_users_profile")
        .select("*", { count: "exact", head: true })
        .gte("created_at", thirtyDaysAgo.toISOString());

      return {
        activeEmployees: employeeCount || 0,
        openPositions: positionsCount || 0,
        newHires: newHiresCount || 0,
        aiInsights: 0, // Will be populated when hunting system has data
        avgPerformance: 0, // Will be calculated from performance data
      };
    },
    staleTime: 60000, // 1 minute
  });
}

export function useOpenPositions() {
  return useQuery({
    queryKey: ["open-positions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("hr_job_offers")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });
}
