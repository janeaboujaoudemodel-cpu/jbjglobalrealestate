import { friendlyBackendMessage } from "@/utils/friendlyBackendError";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/** Broker marks a lead as junk → returns to owner's Junk queue. Broker can never delete. */
export function useMarkLeadJunk() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ leadId, reason }: { leadId: string; reason: string }) => {
      const { error } = await supabase.rpc("broker_mark_lead_junk" as any, {
        _lead_id: leadId,
        _reason: reason,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["broker-scoped-leads"] });
      qc.invalidateQueries({ queryKey: ["broker-database-leads"] });
      toast.success("Lead returned to JBJ owner as junk");
    },
    onError: (e: any) => toast.error(friendlyBackendMessage(e) || "Could not mark as junk"),
  });
}

/** Broker promotes a database-only lead into their main "My Leads" pipeline. */
export function usePromoteLeadToMain() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (leadId: string) => {
      const { error } = await supabase.rpc("broker_promote_lead_to_main" as any, {
        _lead_id: leadId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["broker-scoped-leads"] });
      qc.invalidateQueries({ queryKey: ["broker-database-leads"] });
      toast.success("Lead added to your main pipeline");
    },
    onError: (e: any) => toast.error(friendlyBackendMessage(e) || "Could not promote lead"),
  });
}

/** Owner redistributes a junk lead to another broker. */
export function useRedistributeJunkLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ leadId, newBrokerId }: { leadId: string; newBrokerId: string }) => {
      const { error } = await supabase.rpc("owner_redistribute_junk_lead" as any, {
        _lead_id: leadId,
        _new_broker_id: newBrokerId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["owner-junk-queue"] });
      toast.success("Lead reassigned");
    },
    onError: (e: any) => toast.error(friendlyBackendMessage(e) || "Reassign failed"),
  });
}

export function useDeleteJunkLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (leadId: string) => {
      const { error } = await supabase.rpc("owner_delete_junk_lead" as any, {
        _lead_id: leadId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["owner-junk-queue"] });
      toast.success("Lead permanently deleted");
    },
    onError: (e: any) => toast.error(friendlyBackendMessage(e) || "Delete failed"),
  });
}
