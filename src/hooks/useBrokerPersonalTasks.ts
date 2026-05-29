import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type TaskStatus = "todo" | "doing" | "done";
export type TaskPriority = "low" | "normal" | "high" | "urgent";

export interface BrokerTask {
  id: string;
  broker_user_id: string;
  lead_id: string | null;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  due_at: string | null;
  completed_at: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

const TABLE = "broker_personal_tasks";

/** All tasks the broker can see — caller filters deleted vs active. */
export function useBrokerPersonalTasks() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["broker-personal-tasks", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await (supabase.from as any)(TABLE)
        .select("*")
        .order("due_at", { ascending: true, nullsFirst: false })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as BrokerTask[];
    },
  });
}

export function useCreateBrokerTask() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<BrokerTask> & { title: string }) => {
      const { data, error } = await (supabase.from as any)(TABLE)
        .insert({ ...input, broker_user_id: user!.id })
        .select().single();
      if (error) throw error;
      return data as BrokerTask;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["broker-personal-tasks"] }),
  });
}

export function useUpdateBrokerTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...patch }: Partial<BrokerTask> & { id: string }) => {
      if (patch.status === "done" && !patch.completed_at) patch.completed_at = new Date().toISOString();
      if (patch.status && patch.status !== "done") patch.completed_at = null;
      const { error } = await (supabase.from as any)(TABLE)
        .update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["broker-personal-tasks"] }),
  });
}

/** Soft-delete: row stays in DB with deleted_at set; surfaces in Recently Deleted. */
export function useSoftDeleteBrokerTasks() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (ids: string[]) => {
      if (ids.length === 0) return;
      const { error } = await (supabase.from as any)(TABLE)
        .update({ deleted_at: new Date().toISOString() })
        .in("id", ids);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["broker-personal-tasks"] }),
  });
}

export function useRestoreBrokerTasks() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (ids: string[]) => {
      if (ids.length === 0) return;
      const { error } = await (supabase.from as any)(TABLE)
        .update({ deleted_at: null })
        .in("id", ids);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["broker-personal-tasks"] }),
  });
}

/** Hard-delete: permanently remove rows (used from Recently Deleted only). */
export function useDeleteBrokerTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (idOrIds: string | string[]) => {
      const ids = Array.isArray(idOrIds) ? idOrIds : [idOrIds];
      if (ids.length === 0) return;
      const { error } = await (supabase.from as any)(TABLE)
        .delete().in("id", ids);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["broker-personal-tasks"] }),
  });
}

export function useBulkUpdateBrokerTasks() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ ids, patch }: { ids: string[]; patch: Partial<BrokerTask> }) => {
      if (ids.length === 0) return;
      const next: any = { ...patch };
      if (patch.status === "done") next.completed_at = new Date().toISOString();
      if (patch.status && patch.status !== "done") next.completed_at = null;
      const { error } = await (supabase.from as any)(TABLE)
        .update(next).in("id", ids);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["broker-personal-tasks"] }),
  });
}
