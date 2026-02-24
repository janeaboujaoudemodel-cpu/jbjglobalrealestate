import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface UserAlertCounts {
  unreadTicketNotifications: number;
  pendingTasks: number;
  totalAlerts: number;
}

/**
 * Shared hook for user alert counts across header, account menu, and dashboard.
 * Fetches unread support ticket notifications + pending admin tasks.
 */
export function useUserAlerts() {
  const { user } = useAuth();

  return useQuery<UserAlertCounts>({
    queryKey: ["user-alert-counts", user?.id],
    queryFn: async () => {
      if (!user?.id) return { unreadTicketNotifications: 0, pendingTasks: 0, totalAlerts: 0 };

      const [ticketResult, taskResult] = await Promise.all([
        supabase
          .from("user_notifications")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("is_read", false),
        supabase
          .from("admin_tasks")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("status", "pending"),
      ]);

      const unreadTicketNotifications = ticketResult.count || 0;
      const pendingTasks = taskResult.count || 0;

      return {
        unreadTicketNotifications,
        pendingTasks,
        totalAlerts: unreadTicketNotifications + pendingTasks,
      };
    },
    enabled: !!user?.id,
    staleTime: 30000, // 30s cache
    refetchInterval: 60000, // Refresh every 60s
  });
}
