import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Distinguishes a *registered* user (someone who completed a category-specific
 * profile with their details) from someone who only picked a browse "mode".
 *
 * Mode = lightweight view preference (investor / broker / developer) that can
 * be flipped at any time from the header. Registration = a real row in one of
 * the three category profile tables that earns the user points + access.
 *
 * Returns true if the user has at least one of:
 *  - investor_intake row
 *  - broker_profiles row
 *  - developer_registrations row
 */
export function useIsRegistered() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["is-registered", user?.id],
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      if (!user?.id) return false;

      const [investor, broker, developer] = await Promise.all([
        supabase
          .from("investor_intake")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id),
        supabase
          .from("broker_profiles")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id),
        supabase
          .from("developer_registrations")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id),
      ]);

      return (
        (investor.count ?? 0) > 0 ||
        (broker.count ?? 0) > 0 ||
        (developer.count ?? 0) > 0
      );
    },
  });
}
