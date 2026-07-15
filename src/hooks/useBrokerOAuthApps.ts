import { friendlyBackendMessage } from "@/utils/friendlyBackendError";
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
      const { data, error } = await (supabase.rpc as any)("list_my_broker_oauth_apps");
      if (error) throw error;
      return ((data ?? []) as unknown) as BrokerOAuthApp[];
    },
  });
}


export function useSaveBrokerOAuthApp() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (v: { provider: OAuthProvider; client_id: string; client_secret: string; label?: string }) => {
      if (!user?.id) throw new Error("Not signed in");
      // SECURITY: client_secret is stored encrypted in Supabase Vault via the
      // SECURITY DEFINER RPC `save_broker_oauth_app`. The table no longer holds
      // a plaintext `client_secret` column. Passing an empty secret keeps the
      // existing Vault entry unchanged.
      const { error } = await (supabase.rpc as any)("save_broker_oauth_app", {
        _provider: v.provider,
        _client_id: v.client_id.trim(),
        _client_secret: v.client_secret?.trim() || "",
        _label: v.label?.trim() || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Credentials saved");
      qc.invalidateQueries({ queryKey: ["broker-oauth-apps"] });
    },
    onError: (e: any) => toast.error(friendlyBackendMessage(e) || "Failed to save"),
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
    onError: (e: any) => toast.error(friendlyBackendMessage(e) || "Failed to remove"),
  });
}

/** The OAuth redirect URI that brokers must paste into Google/Microsoft consoles. */
export function getOAuthRedirectUri(): string {
  return `${SUPABASE_URL.replace(/\/$/, "")}/functions/v1/broker-email-oauth-callback`;
}
