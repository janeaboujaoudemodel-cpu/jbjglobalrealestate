import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { JBJ_PAA_TEMPLATE_ID, buildPAAHtml, type PAAFieldKey } from "@/templates/jbjPropertyAdvertisingAgreement";

export interface CrmDocument {
  id: string;
  owner_user_id: string;
  template_id: string;
  title: string;
  status: "draft" | "sent" | "opened" | "filled" | "signed" | "completed" | "expired" | "cancelled";
  field_values: Record<string, string>;
  rendered_html: string | null;
  pdf_path: string | null;
  client_lead_id: string | null;
  client_name: string | null;
  client_email: string | null;
  client_phone: string | null;
  recipient_token: string;
  signature_asset_id: string | null;
  stamp_asset_id: string | null;
  signature_data_url: string | null;
  client_signature_data_url: string | null;
  sent_at: string | null;
  signed_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export function useCrmDocuments(filter?: "all" | "draft" | "sent" | "signed") {
  return useQuery({
    queryKey: ["crm_documents", filter ?? "all"],
    queryFn: async (): Promise<CrmDocument[]> => {
      let q = supabase.from("crm_documents" as any).select("*").is("deleted_at", null).order("created_at", { ascending: false });
      if (filter === "draft") q = q.eq("status", "draft");
      if (filter === "sent") q = q.in("status", ["sent", "opened", "filled"]);
      if (filter === "signed") q = q.in("status", ["signed", "completed"]);
      const { data, error } = await q;
      if (error) throw error;
      return (data as any) ?? [];
    },
  });
}

/** Recently Deleted (last 30 days). */
export function useCrmDocumentsDeleted() {
  return useQuery({
    queryKey: ["crm_documents", "deleted"],
    queryFn: async (): Promise<CrmDocument[]> => {
      const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const { data, error } = await supabase
        .from("crm_documents" as any)
        .select("*")
        .not("deleted_at", "is", null)
        .gte("deleted_at", cutoff)
        .order("deleted_at", { ascending: false });
      if (error) throw error;
      return (data as any) ?? [];
    },
  });
}

export function useSoftDeleteDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("crm_documents" as any)
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
      return id;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["crm_documents"] }),
    onError: (e: any) => toast.error(e?.message || "Delete failed"),
  });
}

export function useRestoreDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("crm_documents" as any)
        .update({ deleted_at: null })
        .eq("id", id);
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["crm_documents"] });
      toast.success("Restored");
    },
    onError: (e: any) => toast.error(e?.message || "Restore failed"),
  });
}

export function useHardDeleteDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("crm_documents" as any).delete().eq("id", id);
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["crm_documents"] });
      toast.success("Permanently deleted");
    },
    onError: (e: any) => toast.error(e?.message || "Delete failed"),
  });
}

export function useSaveDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: {
      id?: string;
      template_id?: string;
      title: string;
      field_values: Record<string, string>;
      rendered_html?: string | null;
      client_lead_id?: string | null;
      client_name?: string | null;
      client_email?: string | null;
      client_phone?: string | null;
      candidate_folder?: string | null;
      candidate_display_name?: string | null;
      silent?: boolean;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const template_id = vars.template_id ?? JBJ_PAA_TEMPLATE_ID;
      const rendered_html = vars.rendered_html ?? (template_id === JBJ_PAA_TEMPLATE_ID
        ? buildPAAHtml(vars.field_values as Partial<Record<PAAFieldKey, string>>)
        : null);
      if (vars.id) {
        const { data, error } = await supabase
          .from("crm_documents" as any)
          .update({
            title: vars.title, field_values: vars.field_values, rendered_html,
            client_lead_id: vars.client_lead_id ?? null,
            client_name: vars.client_name ?? null,
            client_email: vars.client_email ?? null,
            client_phone: vars.client_phone ?? null,
            candidate_folder: vars.candidate_folder ?? null,
            candidate_display_name: vars.candidate_display_name ?? null,
          })
          .eq("id", vars.id).select().single();
        if (error) throw error;
        return data as unknown as CrmDocument;
      }
      const { data, error } = await supabase
        .from("crm_documents" as any)
        .insert({
          owner_user_id: user.id, template_id, title: vars.title,
          field_values: vars.field_values, rendered_html,
          status: "draft",
          client_lead_id: vars.client_lead_id ?? null,
          client_name: vars.client_name ?? null,
          client_email: vars.client_email ?? null,
          client_phone: vars.client_phone ?? null,
          candidate_folder: vars.candidate_folder ?? null,
          candidate_display_name: vars.candidate_display_name ?? null,
        })
        .select().single();
      if (error) throw error;
      return data as unknown as CrmDocument;
    },
    onSuccess: (_data, vars: any) => {
      qc.invalidateQueries({ queryKey: ["crm_documents"] });
      if (!vars?.silent) toast.success("Saved");
    },
    onError: (e: any, vars: any) => {
      if (!vars?.silent) toast.error(e?.message || "Save failed");
    },
  });
}

export function useSendDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: { document_id: string; channel: "email" | "whatsapp" | "link"; message?: string }) => {
      const { data, error } = await supabase.functions.invoke("documents-send", { body: vars });
      if (error) throw error;
      return data as { ok?: boolean; sign_url?: string; fallback_link?: string };
    },
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["crm_documents"] });
      if (res?.fallback_link) {
        window.open(res.fallback_link, "_blank");
        toast.message("Opened WhatsApp web with prefilled message");
      } else {
        toast.success("Sent");
      }
    },
    onError: (e: any) => toast.error(e?.message || "Send failed"),
  });
}
