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
  created_at: string;
  updated_at: string;
}

export function useBrokerPersonalTasks() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["broker-personal-tasks", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await (supabase.from as any)("broker_personal_tasks")
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
      const { data, error } = await (supabase.from as any)("broker_personal_tasks")
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
      const { error } = await (supabase.from as any)("broker_personal_tasks")
        .update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["broker-personal-tasks"] }),
  });
}

export function useDeleteBrokerTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase.from as any)("broker_personal_tasks")
        .delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["broker-personal-tasks"] }),
  });
}
