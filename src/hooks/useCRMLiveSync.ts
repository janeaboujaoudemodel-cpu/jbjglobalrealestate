import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Phase 3 — Live CRM Synchronization.
 *
 * Subscribes to postgres_changes on `crm_leads`, `crm_audit_logs` and
 * `crm_action_logs` and invalidates any React Query keys whose first
 * segment starts with "crm" or "owner-crm". Also surfaces a subtle toast
 * when another user edits a lead while this owner is watching.
 */
export function useCRMLiveSync(opts: { enabled?: boolean; notify?: boolean } = {}) {
  const { enabled = true, notify = true } = opts;
  const qc = useQueryClient();

  useEffect(() => {
    if (!enabled) return;
    let currentUserId: string | null = null;

    supabase.auth.getUser().then(({ data }) => {
      currentUserId = data.user?.id ?? null;
    });

    const invalidate = () => {
      qc.invalidateQueries({
        predicate: (q) => {
          const k = q.queryKey?.[0];
          return typeof k === "string" && (k.startsWith("crm") || k.startsWith("owner-crm"));
        },
      });
    };

    const channel = supabase
      .channel("crm-live-sync")
      .on("postgres_changes", { event: "*", schema: "public", table: "crm_leads" }, (payload) => {
        invalidate();
        if (notify && payload.eventType === "UPDATE") {
          const actor = (payload.new as any)?.last_updated_by;
          if (actor && actor !== currentUserId) {
            const name = (payload.new as any)?.full_name || "a lead";
            toast.info(`${name} was just updated by a teammate`);
          }
        }
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "crm_audit_logs" }, () => {
        invalidate();
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "crm_action_logs" }, () => {
        invalidate();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [enabled, notify, qc]);
}

export default useCRMLiveSync;
