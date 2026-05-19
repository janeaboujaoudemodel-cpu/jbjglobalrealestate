import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Returns crm_leads visible to the current broker.
 * RLS on crm_leads already enforces: owner OR assigned_broker_id matches the broker
 * OR a valid crm_database_grant covers the lead's source_database_id.
 * We simply SELECT — the policy filters server-side.
 */
export function useBrokerScopedLeads(opts: { sourceDatabaseId?: string } = {}) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["broker-scoped-leads", user?.id, opts.sourceDatabaseId ?? "all"],
    enabled: !!user?.id,
    queryFn: async () => {
      let q = supabase
        .from("crm_leads")
        .select(
          "id, full_name, email_lower, phone_e164, status, source, source_database_id, assigned_broker_id, created_at, updated_at"
        )
        .order("updated_at", { ascending: false })
        .limit(500);

      if (opts.sourceDatabaseId) q = q.eq("source_database_id", opts.sourceDatabaseId);

      const { data, error } = await q;
      if (error) throw error;
      return data || [];
    },
  });
}
