import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface BrokerNote {
  id: string;
  broker_user_id: string;
  lead_id: string | null;
  database_id: string | null;
  title: string | null;
  body: string;
  pinned: boolean;
  created_at: string;
  updated_at: string;
}

export function useBrokerPersonalNotes(opts?: { leadId?: string; databaseId?: string }) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["broker-personal-notes", user?.id, opts?.leadId, opts?.databaseId],
    enabled: !!user?.id,
    queryFn: async () => {
      let q = (supabase.from as any)("broker_personal_notes")
        .select("*")
        .order("pinned", { ascending: false })
        .order("updated_at", { ascending: false });
      if (opts?.leadId) q = q.eq("lead_id", opts.leadId);
      if (opts?.databaseId) q = q.eq("database_id", opts.databaseId);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as BrokerNote[];
    },
  });
}

export function useCreateBrokerNote() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<BrokerNote> & { body: string }) => {
      const { data, error } = await (supabase.from as any)("broker_personal_notes")
        .insert({ ...input, broker_user_id: user!.id })
        .select()
        .single();
      if (error) throw error;
      return data as BrokerNote;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["broker-personal-notes"] }),
  });
}

export function useUpdateBrokerNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...patch }: Partial<BrokerNote> & { id: string }) => {
      const { error } = await (supabase.from as any)("broker_personal_notes")
        .update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["broker-personal-notes"] }),
  });
}

export function useDeleteBrokerNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase.from as any)("broker_personal_notes")
        .delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["broker-personal-notes"] }),
  });
}
