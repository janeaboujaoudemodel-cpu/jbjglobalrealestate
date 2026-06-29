import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useUserModeContext } from "@/contexts/UserModeContext";

export type PortalRole = "owner" | "portal_developer" | "portal_rep" | null;

/**
 * usePortalRole — resolves the user's Developers-Portal role.
 *
 * `owner` (or `admin`) → portal owner; sees everything.
 * `portal_developer` → developer self-service.
 * `portal_rep` → rep self-service.
 * null → no portal access (will be redirected by PortalGuard).
 */
export function usePortalRole() {
  const { user, isOwner } = useAuth();
  const { mode } = useUserModeContext();

  const { data, isLoading } = useQuery({
    queryKey: ["portal-role", user?.id, mode],
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<PortalRole> => {
      if (!user?.id) return null;
      if (isOwner && mode === "owner") return "owner";
      if (isOwner && mode === "developer") return "portal_developer";

      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);

      const list = (roles ?? []).map((r: any) => r.role as string);
      if (mode === "owner" && (list.includes("owner") || list.includes("admin"))) return "owner";
      if (list.includes("portal_developer")) return "portal_developer";
      if (list.includes("portal_rep")) return "portal_rep";
      return null;
    },
  });

  return {
    role: (data ?? null) as PortalRole,
    isLoading,
    isOwner: data === "owner",
    isDeveloper: data === "portal_developer",
    isRep: data === "portal_rep",
  };
}
