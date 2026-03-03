import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface UserAlertCounts {
  unreadTicketNotifications: number;
  unreadListingNotifications: number;
  unreadSystemNotifications: number;
  pendingTasks: number;
  totalAlerts: number;
}

/**
 * Shared hook for user alert counts across header, account menu, and dashboard.
 * Fetches unread counts from ALL notification tables + pending admin tasks.
 */
export function useUserAlerts() {
  const { user } = useAuth();

  return useQuery<UserAlertCounts>({
    queryKey: ["user-alert-counts", user?.id],
    queryFn: async () => {
      if (!user?.id) return { unreadTicketNotifications: 0, unreadListingNotifications: 0, unreadSystemNotifications: 0, pendingTasks: 0, totalAlerts: 0 };

      const [ticketResult, listingResult, systemResult, taskResult] = await Promise.all([
        supabase
          .from("user_notifications")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("is_read", false),
        supabase
          .from("user_listing_notifications")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("is_read", false),
        supabase
          .from("notifications")
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
      const unreadListingNotifications = listingResult.count || 0;
      const unreadSystemNotifications = systemResult.count || 0;
      const pendingTasks = taskResult.count || 0;

      return {
        unreadTicketNotifications,
        unreadListingNotifications,
        unreadSystemNotifications,
        pendingTasks,
        totalAlerts: unreadTicketNotifications + unreadListingNotifications + unreadSystemNotifications + pendingTasks,
      };
    },
    enabled: !!user?.id,
    staleTime: 30000,
    refetchInterval: 60000,
  });
}
