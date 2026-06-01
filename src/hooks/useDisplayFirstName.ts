import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

/**
 * useDisplayFirstName — single source of truth for the signed-in user's first name.
 *
 * Priority:
 *  1. crm_users_profile.display_name
 *  2. user_metadata.full_name / name
 *  3. email local-part (humanized)
 *
 * Returns `fallback` (default "there") when the user is signed out.
 */
export function useDisplayFirstName(fallback = "there"): string {
  const { user } = useAuth();

  const { data: profile } = useQuery({
    queryKey: ["display-name-profile", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from("crm_users_profile")
        .select("display_name")
        .eq("user_id", user.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
  });

  if (!user) return fallback;

  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  const raw =
    (profile as any)?.display_name ||
    (typeof meta.full_name === "string" ? (meta.full_name as string) : null) ||
    (typeof meta.name === "string" ? (meta.name as string) : null) ||
    (user.email ? user.email.split("@")[0].replace(/[._-]+/g, " ") : null) ||
    fallback;

  const first = String(raw).trim().split(/\s+/)[0] || fallback;
  return first.charAt(0).toUpperCase() + first.slice(1);
}

export default useDisplayFirstName;
