import { friendlyBackendMessage } from "@/utils/friendlyBackendError";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export const EMAIL_CATEGORIES = [
  "all","client_lead","new_launch","commission","onboarding_letter","warning_letter",
  "termination","leave_approval","internal_jbj","contract","other",
] as const;
export type EmailCategory = typeof EMAIL_CATEGORIES[number];

export function useBrokerEmailAccounts() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["broker-email-accounts", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("broker_email_accounts")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useBrokerEmails(category: EmailCategory = "all") {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["broker-emails", user?.id, category],
    enabled: !!user?.id,
    queryFn: async () => {
      let q: any = supabase
        .from("broker_emails")
        .select("id, subject, from_address, from_name, snippet, received_at, is_read, is_starred, ai_category, ai_summary, ai_intent, linked_lead_id, account_id")
        .order("received_at", { ascending: false })
        .limit(200);
      if (category !== "all") q = q.eq("ai_category", category);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useMarkEmailRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, read }: { id: string; read: boolean }) => {
      const { error } = await supabase.rpc("broker_email_mark_read" as any, {
        _email_id: id, _read: read,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["broker-emails"] }),
  });
}

export function useClassifyEmail() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (emailId: string) => {
      const { data, error } = await supabase.functions.invoke("broker-email-classify", {
        body: { emailId },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["broker-emails"] });
      toast.success("Categorised by AI");
    },
    onError: (e: any) => toast.error(friendlyBackendMessage(e) || "Classification failed"),
  });
}

/**
 * Opens an OAuth popup that connects the broker's Gmail or Outlook mailbox.
 * Resolves when the callback page posts back success/failure.
 */
export function useConnectBrokerEmail() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (provider: "gmail" | "outlook") => {
      const { data, error } = await supabase.functions.invoke("broker-email-oauth-start", { body: { provider } });
      if (error) throw error;
      const url = (data as any)?.url;
      if (!url) throw new Error("OAuth URL missing");
      const popup = window.open(url, "jbj-email-oauth", "width=520,height=680");
      if (!popup) throw new Error("Popup blocked — allow popups and try again");
      return await new Promise<{ email: string }>((resolve, reject) => {
        const timer = setTimeout(() => { window.removeEventListener("message", onMsg); reject(new Error("Timed out")); }, 180_000);
        function onMsg(e: MessageEvent) {
          const d = e.data;
          if (!d || d.source !== "jbj-broker-oauth") return;
          window.removeEventListener("message", onMsg);
          clearTimeout(timer);
          if (d.ok) resolve({ email: d.email });
          else reject(new Error(d.code || "OAuth failed"));
        }
        window.addEventListener("message", onMsg);
      });
    },
    onSuccess: ({ email }) => {
      toast.success(`Connected ${email}`);
      qc.invalidateQueries({ queryKey: ["broker-email-accounts"] });
      supabase.functions.invoke("broker-email-sync", { body: { accountId: null } }).catch(() => {});
    },
    onError: (e: any) => toast.error(friendlyBackendMessage(e) || "Connect failed"),
  });
}

export function useSyncBrokerEmail() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (accountId: string) => {
      const { data, error } = await supabase.functions.invoke("broker-email-sync", { body: { accountId } });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Inbox synced");
      qc.invalidateQueries({ queryKey: ["broker-emails"] });
      qc.invalidateQueries({ queryKey: ["broker-email-accounts"] });
    },
    onError: (e: any) => toast.error(friendlyBackendMessage(e) || "Sync failed"),
  });
}
