import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { SUPABASE_URL } from "@/config/backend";
import { toast } from "sonner";

export type OAuthProvider = "gmail" | "outlook";

export interface BrokerOAuthApp {
  id: string;
  provider: OAuthProvider;
  client_id: string;
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
      // SECURITY: read through a SECURITY DEFINER RPC that returns only safe
      // metadata columns. The table itself revokes SELECT entirely so
      // `client_secret` cannot leak even if the policy is misconfigured.
      const { data, error } = await supabase.rpc("list_my_broker_oauth_apps");
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
      const base: Record<string, unknown> = {
        user_id: user.id,
        provider: v.provider,
        client_id: v.client_id.trim(),
        label: v.label?.trim() || null,
        is_active: true,
      };
      // SECURITY: only write client_secret when the user typed a new one.
      // The stored secret is never returned to the client, so blank means "keep current".
      if (v.client_secret && v.client_secret.trim()) {
        base.client_secret = v.client_secret.trim();
      }
      const { error } = await supabase
        .from("broker_email_oauth_apps")
        .upsert(base as any, { onConflict: "user_id,provider" });
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
  return `${SUPABASE_URL.replace(/\/$/, "")}/functions/v1/broker-email-oauth-callback`;
}
