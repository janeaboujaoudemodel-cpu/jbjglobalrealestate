import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface HRStats {
  activeEmployees: number;
  openPositions: number;
  newHires: number;
  aiInsights: number;
  avgPerformance: number;
  totalCVs: number;
  pendingCVs: number;
}

export function useHRStats() {
  return useQuery({
    queryKey: ["hr-stats"],
    queryFn: async (): Promise<HRStats> => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // Run all queries in parallel for better performance
      const [
        employeesResult,
        positionsResult,
        hiresResult,
        totalCVsResult,
        pendingCVsResult,
      ] = await Promise.all([
        // Get active employees count
        supabase
          .from("crm_users_profile")
          .select("*", { count: "exact", head: true })
          .eq("is_active", true),
        
        // Get open positions count
        supabase
          .from("hr_job_offers")
          .select("*", { count: "exact", head: true })
          .eq("is_active", true),
        
        // Get new hires in last 30 days
        supabase
          .from("crm_users_profile")
          .select("*", { count: "exact", head: true })
          .gte("created_at", thirtyDaysAgo.toISOString()),
        
        // Get total CVs from hr_applications
        supabase
          .from("hr_applications")
          .select("*", { count: "exact", head: true }),
        
        // Get pending CVs
        supabase
          .from("hr_applications")
          .select("*", { count: "exact", head: true })
          .eq("status", "pending"),
      ]);

      return {
        activeEmployees: employeesResult.count || 0,
        openPositions: positionsResult.count || 0,
        newHires: hiresResult.count || 0,
        aiInsights: 0, // Will be populated when hunting system has data
        avgPerformance: 0, // Will be calculated from performance data
        totalCVs: totalCVsResult.count || 0,
        pendingCVs: pendingCVsResult.count || 0,
      };
    },
    staleTime: 120000, // 2 minutes - reduces refetching
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
    staleTime: 120000, // 2 minutes
  });
}
