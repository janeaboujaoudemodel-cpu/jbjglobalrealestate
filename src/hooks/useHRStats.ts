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
      const results = await Promise.all([
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
        
        // Get pending CVs from hr_applications
        supabase
          .from("hr_applications")
          .select("*", { count: "exact", head: true })
          .eq("status", "pending"),

        // Get total CVs from hr_cv_submissions (chat widget submissions)
        supabase
          .from("hr_cv_submissions")
          .select("*", { count: "exact", head: true }),

        // Get pending CVs from hr_cv_submissions
        supabase
          .from("hr_cv_submissions")
          .select("*", { count: "exact", head: true })
          .eq("status", "pending"),
      ]);

      const cvSubsResult = results[5];
      const pendingCvSubsResult = results[6];

      return {
        activeEmployees: results[0].count || 0,
        openPositions: results[1].count || 0,
        newHires: results[2].count || 0,
        aiInsights: 0,
        avgPerformance: 0,
        totalCVs: (results[3].count || 0) + (cvSubsResult?.count || 0),
        pendingCVs: (results[4].count || 0) + (pendingCvSubsResult?.count || 0),
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
