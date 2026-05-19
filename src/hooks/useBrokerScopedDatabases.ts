import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface BrokerScopedDatabase {
  database_id: string;
  database_name: string;
  grant_id: string;
  permission_level: "view" | "edit";
  visibility_direction: string;
  date_window_mode: string;
  date_window_start: string | null;
  date_window_end: string | null;
  lead_ids: string[] | null;
  status_filter: string[] | null;
  granted_at: string;
  expires_at: string | null;
  status: "active" | "suspended" | "expired" | "revoked";
}

/**
 * Returns the list of databases the current broker has active access to.
 * Reads from vw_crm_database_access (security_invoker=on, RLS-respecting).
 */
export function useBrokerScopedDatabases() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["broker-scoped-databases", user?.id],
    enabled: !!user?.id,
    queryFn: async (): Promise<BrokerScopedDatabase[]> => {
      const { data, error } = await supabase
        .from("vw_crm_database_access" as any)
        .select(
          "database_id, database_name, grant_id, permission_level, visibility_direction, date_window_mode, date_window_start, date_window_end, lead_ids, status_filter, granted_at, expires_at, status"
        )
        .eq("broker_user_id", user!.id)
        .eq("status", "active")
        .order("granted_at", { ascending: false });
      if (error) throw error;
      return (data as any) || [];
    },
  });
}
