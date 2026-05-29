import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Returns leads inside a specific broker-uploaded database, regardless of whether
 * they have been promoted to the broker's main "My Leads" pipeline yet.
 *
 * Scoped strictly to leads the current broker created (uploaded), so it is safe
 * even when called from a database sheet that the broker owns.
 */
export function useBrokerDatabaseLeads(databaseId: string | null | undefined) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["broker-database-leads", user?.id, databaseId],
    enabled: !!user?.id && !!databaseId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("crm_leads")
        .select(
          "id, full_name, email_lower, phone_e164, pipeline_stage, source, source_database_id, created_by_user_id, assigned_broker_id, merged_to_main_leads, is_junk, created_at, updated_at",
        )
        .eq("source_database_id", databaseId!)
        .eq("created_by_user_id", user!.id)
        .is("deleted_at", null)
        .order("updated_at", { ascending: false })
        .limit(1000);
      if (error) throw error;
      return data || [];
    },
  });
}
