import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Returns crm_leads visible to the current broker.
 * RLS on crm_leads enforces visibility (owner/admin, assignment, or active
 * crm_database_grant). We only select columns that actually exist on
 * crm_leads — `status` is NOT a column, the pipeline column is
 * `pipeline_stage`.
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
          "id, full_name, email_lower, phone_e164, pipeline_stage, lead_source_type, source, source_database_id, assigned_broker_id, created_by_user_id, owner_user_id, created_at, updated_at"
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
