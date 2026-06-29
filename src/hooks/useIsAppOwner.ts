import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { isOwnerBackendEmail } from "@/config/ownerEmails";

/**
 * Checks whether the current user has the `owner` app_role (real RLS owner —
 * NOT the visitor "mode" picker). Used to gate on-page owner editing.
 */
export function useIsAppOwner() {
  const { user } = useAuth();
  const ownerEmailMatched = isOwnerBackendEmail(user?.email);
  const { data, isLoading } = useQuery({
    queryKey: ["is-app-owner", user?.id],
    enabled: !!user?.id && ownerEmailMatched,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user!.id)
        .in("role", ["owner", "admin"])
        .limit(1)
        .maybeSingle();
      if (error) return false;
      return !!data;
    },
  });
  return { isOwner: ownerEmailMatched && !!data, isLoading: ownerEmailMatched && isLoading };
}
