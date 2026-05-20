/**
 * useCRMFolders — folders that group CRM "databases" (lead lists) and
 * optionally assign every lead inside to a specific broker (e.g. Jessica).
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface CRMDatabaseFolder {
  id: string;
  owner_user_id: string;
  name: string;
  color: string | null;
  assigned_broker_id: string | null;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
  assigned_broker_name?: string | null;
}

export function useCRMFolders() {
  const qc = useQueryClient();

  const list = useQuery({
    queryKey: ["crm_database_folders"],
    queryFn: async (): Promise<CRMDatabaseFolder[]> => {
      const { data, error } = await supabase
        .from("crm_database_folders" as any)
        .select("*")
        .is("archived_at", null)
        .order("created_at", { ascending: true });
      if (error) throw error;
      const rows = (data ?? []) as any[];
      const brokerIds = Array.from(
        new Set(rows.map((r) => r.assigned_broker_id).filter(Boolean)),
      );
      let brokerMap: Record<string, string> = {};
      if (brokerIds.length) {
        const { data: brokers } = await supabase
          .from("crm_brokers")
          .select("id, full_name")
          .in("id", brokerIds);
        brokerMap = Object.fromEntries(
          (brokers ?? []).map((b: any) => [b.id, b.full_name]),
        );
      }
      return rows.map((r) => ({
        ...r,
        assigned_broker_name: r.assigned_broker_id ? brokerMap[r.assigned_broker_id] ?? null : null,
      }));
    },
  });

  const createFolder = useMutation({
    mutationFn: async (vars: { name: string; color?: string; assigned_broker_id?: string | null }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("crm_database_folders" as any)
        .insert({
          owner_user_id: user.id,
          name: vars.name.trim(),
          color: vars.color ?? "#B89555",
          assigned_broker_id: vars.assigned_broker_id ?? null,
        })
        .select()
        .single();
      if (error) throw error;
      return data as any as CRMDatabaseFolder;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["crm_database_folders"] });
      toast.success("Folder created");
    },
    onError: (e: any) => toast.error(e?.message || "Could not create folder"),
  });

  const updateFolder = useMutation({
    mutationFn: async (vars: { id: string; name?: string; color?: string; assigned_broker_id?: string | null }) => {
      const patch: any = {};
      if (vars.name !== undefined) patch.name = vars.name.trim();
      if (vars.color !== undefined) patch.color = vars.color;
      if (vars.assigned_broker_id !== undefined) patch.assigned_broker_id = vars.assigned_broker_id;
      const { error } = await supabase
        .from("crm_database_folders" as any)
        .update(patch)
        .eq("id", vars.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["crm_database_folders"] }),
    onError: (e: any) => toast.error(e?.message || "Could not update folder"),
  });

  const archiveFolder = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("crm_database_folders" as any)
        .update({ archived_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["crm_database_folders"] }),
  });

  /** Move a database (lead list) into a folder (or out, when folderId=null). */
  const assignListToFolder = useMutation({
    mutationFn: async (vars: { listId: string; folderId: string | null }) => {
      const { error } = await supabase
        .from("crm_lead_lists" as any)
        .update({ folder_id: vars.folderId })
        .eq("id", vars.listId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["crm_database_folders"] });
      qc.invalidateQueries({ queryKey: ["crm_lead_lists"] });
      toast.success("Database moved");
    },
    onError: (e: any) => toast.error(e?.message || "Could not move database"),
  });

  return { ...list, createFolder, updateFolder, archiveFolder, assignListToFolder };
}
