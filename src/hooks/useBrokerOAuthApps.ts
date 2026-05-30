import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export type OAuthProvider = "gmail" | "outlook";

export interface BrokerOAuthApp {
  id: string;
  provider: OAuthProvider;
  client_id: string;
  client_secret: string;
  label: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function useBrokerOAuthApps() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["broker-oauth-apps", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("broker_email_oauth_apps")
        .select("*")
        .order("provider");
      if (error) throw error;
      return (data ?? []) as BrokerOAuthApp[];
    },
  });
}

export function useSaveBrokerOAuthApp() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (v: { provider: OAuthProvider; client_id: string; client_secret: string; label?: string }) => {
      if (!user?.id) throw new Error("Not signed in");
      const { error } = await supabase
        .from("broker_email_oauth_apps")
        .upsert(
          {
            user_id: user.id,
            provider: v.provider,
            client_id: v.client_id.trim(),
            client_secret: v.client_secret.trim(),
            label: v.label?.trim() || null,
            is_active: true,
          },
          { onConflict: "user_id,provider" },
        );
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Credentials saved");
      qc.invalidateQueries({ queryKey: ["broker-oauth-apps"] });
    },
    onError: (e: any) => toast.error(e?.message || "Failed to save"),
  });
}

export function useDeleteBrokerOAuthApp() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("broker_email_oauth_apps").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Credentials removed");
      qc.invalidateQueries({ queryKey: ["broker-oauth-apps"] });
    },
    onError: (e: any) => toast.error(e?.message || "Failed to remove"),
  });
}

/** The OAuth redirect URI that brokers must paste into Google/Microsoft consoles. */
export function getOAuthRedirectUri(): string {
  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID as string;
  return `https://${projectId}.supabase.co/functions/v1/broker-email-oauth-callback`;
}
