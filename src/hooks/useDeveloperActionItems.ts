import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type DeveloperRequestType =
  | "docs_library"
  | "vat_certificate"
  | "mou"
  | "license"
  | "registration"
  | "contract_signature"
  | "other";

export type DeveloperActionStatus =
  | "pending"
  | "auto_replied"
  | "awaiting_owner"
  | "done"
  | "dismissed";

export interface DeveloperActionItem {
  id: string;
  user_id: string;
  thread_id: string | null;
  message_id: string | null;
  developer_id: string | null;
  developer_email: string | null;
  developer_name: string | null;
  request_type: DeveloperRequestType;
  status: DeveloperActionStatus;
  extracted_summary: string | null;
  suggested_reply: string | null;
  confidence: number;
  metadata: Record<string, unknown>;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
}

export function useDeveloperActionItems(status?: DeveloperActionStatus) {
  return useQuery({
    queryKey: ["developer_action_items", status ?? "all"],
    queryFn: async () => {
      let q = supabase
        .from("developer_action_items" as any)
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      if (status) q = q.eq("status", status);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as unknown as DeveloperActionItem[];
    },
  });
}

export function useDocumentLibraryLinks() {
  return useQuery({
    queryKey: ["document_library_links"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("document_library_links" as any)
        .select("*")
        .order("position", { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as Array<{
        id: string;
        label: string;
        url: string;
        applicable_request_types: DeveloperRequestType[];
        is_default: boolean;
      }>;
    },
  });
}

export function useSyncGmailInbox() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      // 1. Make sure a Gmail row exists in owner_comm_channels so the
      //    Unified Inbox can show it.
      try {
        await supabase.functions.invoke("comm-gmail-autoconnect", { body: {} });
      } catch (e) {
        console.warn("[sync] gmail autoconnect skipped:", e);
      }

      // 2. AI classification + email_inbox_items refresh.
      const { data, error } = await supabase.functions.invoke("gmail-inbox-sync", { body: {} });
      if (error) throw error;

      // 3. Unified Inbox pull (Gmail backfill + Hostinger IMAP).
      try {
        await supabase.functions.invoke("comm-inbound-sync", { body: {} });
      } catch (e) {
        console.warn("[sync] unified inbox sync failed:", e);
      }

      return data as { synced: number; classified: number };
    },
    onSuccess: (data) => {
      toast.success(`Synced ${data.synced} new email(s) — ${data.classified} classified`);
      qc.invalidateQueries({ queryKey: ["developer_action_items"] });
      qc.invalidateQueries({ queryKey: ["owner_comm_threads"] });
      qc.invalidateQueries({ queryKey: ["owner-inbox"] });
      qc.invalidateQueries({ queryKey: ["comm-channels"] });
    },
    onError: (e: Error) => toast.error(`Inbox sync failed: ${e.message}`),
  });
}

export function useSendDeveloperReply() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      action_item_id: string;
      to: string;
      subject: string;
      body: string;
      document_link?: string;
    }) => {
      const { data, error } = await supabase.functions.invoke("send-developer-reply", {
        body: input,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Reply sent");
      qc.invalidateQueries({ queryKey: ["developer_action_items"] });
    },
    onError: (e: Error) => toast.error(`Send failed: ${e.message}`),
  });
}

export function useDismissActionItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("developer_action_items" as any)
        .update({ status: "dismissed", resolved_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["developer_action_items"] });
    },
  });
}
