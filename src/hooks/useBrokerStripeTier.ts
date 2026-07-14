import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { getStripeEnvironment } from "@/lib/stripe";

export type BrokerStripeTier = "starter" | "pro" | "elite";

// price_id → tier. Keying off price_id (not product_id) is required because
// the Stripe product_id differs between sandbox and live; price_id comes from
// lookup_key which is stable across environments.
const PRICE_TO_TIER: Record<string, BrokerStripeTier> = {
  broker_starter_monthly: "starter",
  broker_starter_yearly: "starter",
  broker_pro_monthly: "pro",
  broker_pro_yearly: "pro",
  broker_elite_monthly: "elite",
  broker_elite_yearly: "elite",
};

const TIER_RANK: Record<BrokerStripeTier, number> = { starter: 1, pro: 2, elite: 3 };

/**
 * Reads the Stripe-backed `subscriptions` table (populated by the
 * payments-webhook edge function) and returns the current broker tier plus
 * a `hasTier` gate. Access is preserved until `current_period_end` on cancel
 * or downgrade — matches the business rule chosen for this project.
 */
export function useBrokerStripeTier() {
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ["broker-stripe-tier", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const env = getStripeEnvironment();

      const { data, error } = await supabase
        .from("subscriptions")
        .select("price_id, status, current_period_end, cancel_at_period_end")
        .eq("user_id", user.id)
        .eq("environment", env)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const row = query.data;
  const tier = row?.price_id ? PRICE_TO_TIER[row.price_id] ?? null : null;

  const notExpired =
    !row?.current_period_end || new Date(row.current_period_end) > new Date();

  const isActive = !!row && notExpired && (
    row.status === "active" ||
    row.status === "trialing" ||
    row.status === "past_due" ||
    row.status === "canceled" // grace period until period_end
  );

  const hasTier = (min: BrokerStripeTier): boolean => {
    if (!isActive || !tier) return false;
    return TIER_RANK[tier] >= TIER_RANK[min];
  };

  return {
    tier,
    isActive,
    hasTier,
    subscription: row,
    isLoading: query.isLoading,
    refetch: query.refetch,
  };
}
