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
    onError: (e: any) => toast.error(e?.message || "Classification failed"),
  });
}
