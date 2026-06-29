import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface BrokerEvent {
  id: string;
  broker_user_id: string;
  lead_id: string | null;
  title: string;
  description: string | null;
  location: string | null;
  starts_at: string;
  ends_at: string;
  all_day: boolean;
  color: string | null;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

export function useBrokerPersonalCalendar(opts?: { from?: string; to?: string; deleted?: boolean }) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["broker-personal-calendar", user?.id, opts?.from, opts?.to, !!opts?.deleted],
    enabled: !!user?.id,
    queryFn: async () => {
      let q = (supabase.from as any)("broker_personal_calendar")
        .select("*")
        .eq("broker_user_id", user!.id)
        .order(opts?.deleted ? "deleted_at" : "starts_at", { ascending: opts?.deleted ? false : true });
      if (opts?.deleted) q = q.not("deleted_at", "is", null);
      else q = q.is("deleted_at", null);
      if (!opts?.deleted && opts?.from) q = q.gte("starts_at", opts.from);
      if (!opts?.deleted && opts?.to) q = q.lte("starts_at", opts.to);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as BrokerEvent[];
    },
  });
}

export function useCreateBrokerEvent() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<BrokerEvent> & { title: string; starts_at: string; ends_at: string }) => {
      const { data, error } = await (supabase.from as any)("broker_personal_calendar")
        .insert({ ...input, broker_user_id: user!.id })
        .select().single();
      if (error) throw error;
      return data as BrokerEvent;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["broker-personal-calendar"] }),
  });
}

export function useUpdateBrokerEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...patch }: Partial<BrokerEvent> & { id: string }) => {
      const { error } = await (supabase.from as any)("broker_personal_calendar")
        .update({ ...patch, updated_at: new Date().toISOString() }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["broker-personal-calendar"] }),
  });
}

export function useSoftDeleteBrokerEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase.from as any)("broker_personal_calendar")
        .update({ deleted_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["broker-personal-calendar"] }),
  });
}

export function useRestoreBrokerEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase.from as any)("broker_personal_calendar")
        .update({ deleted_at: null, updated_at: new Date().toISOString() }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["broker-personal-calendar"] }),
  });
}

export function useDeleteBrokerEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase.from as any)("broker_personal_calendar")
        .delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["broker-personal-calendar"] }),
  });
}
