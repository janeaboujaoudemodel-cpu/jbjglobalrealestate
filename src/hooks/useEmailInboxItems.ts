import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type InboxCategory =
  | "overview"
  | "contracts"
  | "registrations"
  | "brokerages"
  | "new_launches"
  | "projects_inventory"
  | "commission"
  | "events"
  | "opportunities"
  | "partnerships"
  | "careers"
  | "other";
export type InboxStatus = "awaiting_you" | "awaiting_them" | "signed" | "registered" | "info_only" | "needs_review" | "needs_document";

export interface EmailInboxItem {
  id: string;
  gmail_message_id: string;
  gmail_thread_id: string | null;
  category: Exclude<InboxCategory, "overview">;
  status: InboxStatus;
  action_required: string | null;
  suggested_reply: string | null;
  linked_developer_id: string | null;
  linked_contract_url: string | null;
  confidence: number;
  received_at: string | null;
  raw_subject: string | null;
  from_email: string | null;
  from_name: string | null;
  snippet: string | null;
  attachments: Array<{ filename: string; mimeType: string }>;
  archived_at: string | null;
  created_at: string;
}

export function useEmailInboxItems(category: InboxCategory = "overview", opts: { showArchived?: boolean } = {}) {
  const { showArchived = false } = opts;
  return useQuery({
    queryKey: ["email_inbox_items", category, showArchived ? "archived" : "active"],
    queryFn: async () => {
      let q = supabase
        .from("email_inbox_items" as any)
        .select("*")
        .order("received_at", { ascending: false })
        .limit(300);
      if (showArchived) {
        q = q.not("archived_at", "is", null);
      } else {
        q = q.is("archived_at", null);
      }
      if (category !== "overview") {
        q = q.eq("category", category);
      }
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as unknown as EmailInboxItem[];
    },
  });
}

export function useInboxCategoryCounts() {
  return useQuery({
    queryKey: ["email_inbox_counts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("email_inbox_items" as any)
        .select("category,status,archived_at")
        .limit(2000);
      if (error) throw error;
      const counts: Record<string, number> = {
        overview: 0, contracts: 0, registrations: 0, brokerages: 0,
        new_launches: 0, projects_inventory: 0, commission: 0, events: 0,
        opportunities: 0, partnerships: 0, careers: 0, other: 0,
        awaiting_you: 0, archived: 0,
      };
      for (const r of (data ?? []) as any[]) {
        if (r.archived_at) { counts.archived++; continue; }
        counts.overview++;
        counts[r.category] = (counts[r.category] ?? 0) + 1;
        if (r.status === "awaiting_you") counts.awaiting_you++;
      }
      return counts;
    },
  });
}

export function useSyncJbjInbox() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("classify-jbj-inbox", { body: {} });
      if (error) throw error;
      return data as { scanned: number; inserted: number; skipped: number; archived: number };
    },
    onSuccess: (data) => {
      toast.success(
        `Inbox synced — ${data.inserted} new · ${data.scanned} scanned${data.archived ? ` · ${data.archived} archived` : ""}`
      );
      qc.invalidateQueries({ queryKey: ["email_inbox_items"] });
      qc.invalidateQueries({ queryKey: ["email_inbox_counts"] });
    },
    onError: (e: Error) => toast.error(`Inbox sync failed: ${e.message}`),
  });
}

export function useSendRegistrationConfirmation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { developer_id: string; variant?: "registration_confirm" | "request_signed_doc" }) => {
      const { data, error } = await supabase.functions.invoke("send-registration-confirmation", { body: input });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Confirmation email sent (BCC: infoo.jane@gmail.com)");
      qc.invalidateQueries({ queryKey: ["developer_registry"] });
    },
    onError: (e: Error) => toast.error(`Send failed: ${e.message}`),
  });
}

export function useArchiveInboxItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("email_inbox_items" as any)
        .update({ archived_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["email_inbox_items"] });
      qc.invalidateQueries({ queryKey: ["email_inbox_counts"] });
    },
  });
}
