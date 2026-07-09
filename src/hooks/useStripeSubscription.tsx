import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getStripeEnvironment, isPaymentsConfigured } from "@/lib/stripe";

export interface SubscriptionRow {
  id: string;
  user_id: string;
  stripe_subscription_id: string;
  stripe_customer_id: string;
  product_id: string;
  price_id: string;
  status: string;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  environment: string;
  created_at: string;
  updated_at: string;
}

export function useStripeSubscription(userId?: string | null) {
  const [subscription, setSubscription] = useState<SubscriptionRow | null>(null);
  const [loading, setLoading] = useState<boolean>(Boolean(userId));

  useEffect(() => {
    if (!userId || !isPaymentsConfigured()) {
      setSubscription(null);
      setLoading(false);
      return;
    }
    let cancelled = false;

    const load = async () => {
      const env = getStripeEnvironment();
      const { data } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", userId)
        .eq("environment", env)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!cancelled) {
        setSubscription((data as SubscriptionRow | null) ?? null);
        setLoading(false);
      }
    };

    load();

    const channel = supabase
      .channel(`subscriptions:${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "subscriptions", filter: `user_id=eq.${userId}` },
        () => load(),
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const isActive = (() => {
    if (!subscription) return false;
    const end = subscription.current_period_end ? new Date(subscription.current_period_end).getTime() : null;
    const notExpired = end === null || end > Date.now();
    if (["active", "trialing", "past_due"].includes(subscription.status) && notExpired) return true;
    if (subscription.status === "canceled" && end && end > Date.now()) return true;
    return false;
  })();

  return { subscription, isActive, loading };
}
