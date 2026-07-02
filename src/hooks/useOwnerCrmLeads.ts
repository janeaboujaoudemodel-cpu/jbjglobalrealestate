import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type OwnerCrmLead = {
  id: string;
  full_name: string;
  company_name: string | null;
  email: string | null;
  phone: string | null;
  source: string | null;
  owner_user_id: string | null;
  pipeline_stage: string | null;
  created_at: string;
};

/**
 * Owner-scope leads fetcher for the new JBJ CRM shell.
 * Reads directly from `crm_leads` (RLS restricts to owner) and exposes only
 * the fields the module list view needs. No PII decryption on the client.
 */
export function useOwnerCrmLeads(limit = 500) {
  const [rows, setRows] = useState<OwnerCrmLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from("crm_leads")
        .select(
          "id, full_name, company_name, email_normalized, email_lower, phone_e164, phone_normalized, source, owner_user_id, pipeline_stage, created_at, deleted_at",
        )
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .limit(limit);
      if (cancelled) return;
      if (error) {
        setError(error.message);
        setRows([]);
      } else {
        setRows(
          (data ?? []).map((r: any) => ({
            id: r.id,
            full_name: r.full_name ?? "—",
            company_name: r.company_name ?? null,
            email: r.email_normalized ?? r.email_lower ?? null,
            phone: r.phone_e164 ?? r.phone_normalized ?? null,
            source: r.source ?? null,
            owner_user_id: r.owner_user_id ?? null,
            pipeline_stage: r.pipeline_stage ?? null,
            created_at: r.created_at,
          })),
        );
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [limit]);

  return { rows, loading, error };
}
