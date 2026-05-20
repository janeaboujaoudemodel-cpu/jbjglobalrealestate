/**
 * useCRMLists — fetch & manage CRM lists (a.k.a. "databases") per kind.
 * Each list groups uploaded leads/brokerages/developers under a name,
 * derived by default from the uploaded file's name.
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type CRMListKind = "leads" | "brokerages" | "developers";

export interface CRMList {
  id: string;
  owner_user_id: string;
  kind: CRMListKind;
  name: string;
  source_filename: string | null;
  description: string | null;
  color: string | null;
  archived_at: string | null;
  folder_id: string | null;
  created_at: string;
}

export function useCRMLists(kind: CRMListKind) {
  const qc = useQueryClient();

  const list = useQuery({
    queryKey: ["crm_lead_lists", kind],
    queryFn: async (): Promise<CRMList[]> => {
      const { data, error } = await supabase
        .from("crm_lead_lists" as any)
        .select("*")
        .eq("kind", kind)
        .is("archived_at", null)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data as any) ?? [];
    },
  });

  const createList = useMutation({
    mutationFn: async (vars: { name: string; source_filename?: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("crm_lead_lists" as any)
        .insert({
          owner_user_id: user.id,
          kind,
          name: vars.name.trim(),
          source_filename: vars.source_filename ?? null,
        })
        .select()
        .single();
      if (error) throw error;
      return data as unknown as CRMList;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["crm_lead_lists", kind] });
    },
    onError: (e: any) => toast.error(e?.message || "Could not create list"),
  });

  const archiveList = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("crm_lead_lists" as any)
        .update({ archived_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["crm_lead_lists", kind] }),
  });

  const renameList = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const { error } = await supabase
        .from("crm_lead_lists" as any)
        .update({ name: name.trim() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["crm_lead_lists", kind] }),
  });

  return { ...list, createList, archiveList, renameList };
}
