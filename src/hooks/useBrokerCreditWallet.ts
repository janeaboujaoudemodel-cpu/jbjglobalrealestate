import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface BrokerCreditWallet {
  id: string;
  user_id: string;
  active_tier: string | null;
  monthly_allowance: number;
  subscription_credits: number;
  purchased_credits: number;
  last_refill_at: string | null;
  next_refill_at: string | null;
}

/**
 * Reads broker_credit_wallets for the current user and subscribes to realtime
 * updates so the header badge stays in sync after webhook grants and spend RPCs.
 */
export function useBrokerCreditWallet() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["broker-credit-wallet", user?.id],
    queryFn: async (): Promise<BrokerCreditWallet | null> => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("broker_credit_wallets")
        .select(
          "id, user_id, active_tier, monthly_allowance, subscription_credits, purchased_credits, last_refill_at, next_refill_at",
        )
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      return (data as BrokerCreditWallet) ?? null;
    },
    enabled: !!user?.id,
  });

  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase
      .channel(`broker-credit-wallet-${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "broker_credit_wallets", filter: `user_id=eq.${user.id}` },
        () => qc.invalidateQueries({ queryKey: ["broker-credit-wallet", user.id] }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, qc]);

  const wallet = query.data ?? null;
  const balance = (wallet?.subscription_credits ?? 0) + (wallet?.purchased_credits ?? 0);

  return {
    wallet,
    balance,
    tier: wallet?.active_tier ?? null,
    isLoading: query.isLoading,
    refetch: query.refetch,
  };
}
