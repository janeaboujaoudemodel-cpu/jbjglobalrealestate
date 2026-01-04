import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useMembership() {
  const { user } = useAuth();

  const { data: membership, isLoading, refetch } = useQuery({
    queryKey: ["membership", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from("memberships")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "active")
        .gte("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const hasActiveMembership = !!membership;

  return {
    membership,
    hasActiveMembership,
    isLoading,
    refetch,
  };
}
