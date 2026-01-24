import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface SubscriptionTier {
  id: string;
  name: string;
  description: string;
  price_usd: number;
  price_aed: number;
  yearly_price_usd: number;
  yearly_price_aed: number;
  features: string[];
  tool_access: string[];
  is_popular: boolean;
  display_order: number;
}

export interface UserSubscription {
  id: string;
  user_id: string;
  tier_id: string;
  billing_period: "monthly" | "yearly";
  currency: "USD" | "AED";
  status: "active" | "cancelled" | "expired" | "pending";
  started_at: string;
  expires_at: string;
  stripe_subscription_id?: string;
  stripe_customer_id?: string;
}

// Free tools that don't require subscription
export const FREE_TOOLS = [
  "ai-home-finder",
  "business-card-scanner", 
  "crm"
];

export function useSubscription() {
  const { user } = useAuth();

  // Fetch all tiers
  const { data: tiers, isLoading: tiersLoading } = useQuery({
    queryKey: ["subscription-tiers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subscription_tiers")
        .select("*")
        .order("display_order");

      if (error) throw error;
      return data as SubscriptionTier[];
    },
  });

  // Fetch user's active subscription
  const { data: subscription, isLoading: subscriptionLoading, refetch: refetchSubscription } = useQuery({
    queryKey: ["user-subscription", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from("user_subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "active")
        .gte("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data as UserSubscription | null;
    },
    enabled: !!user?.id,
  });

  // Get current tier details
  const currentTier = tiers?.find(t => t.id === subscription?.tier_id) || null;

  // Check if user has access to a specific tool
  const hasToolAccess = (toolId: string): boolean => {
    // Free tools are always accessible
    if (FREE_TOOLS.includes(toolId)) return true;
    
    // No subscription = no access to paid tools
    if (!currentTier) return false;
    
    // Check if tool is in the tier's access list
    return currentTier.tool_access.includes(toolId);
  };

  // Check if user has any active subscription
  const hasActiveSubscription = !!subscription && subscription.status === "active";

  // Get tier by ID
  const getTierById = (tierId: string) => tiers?.find(t => t.id === tierId) || null;

  return {
    tiers,
    subscription,
    currentTier,
    hasActiveSubscription,
    hasToolAccess,
    getTierById,
    isLoading: tiersLoading || subscriptionLoading,
    refetchSubscription,
  };
}

// Helper to format price
export function formatSubscriptionPrice(
  price: number,
  currency: "USD" | "AED" = "USD",
  period: "monthly" | "yearly" = "monthly"
): string {
  const symbol = currency === "USD" ? "$" : "AED ";
  const suffix = period === "yearly" ? "/year" : "/month";
  return `${symbol}${price.toLocaleString()}${suffix}`;
}

// Calculate yearly savings
export function calculateYearlySavings(
  monthlyPrice: number,
  yearlyPrice: number
): { amount: number; percentage: number } {
  const fullYearlyPrice = monthlyPrice * 12;
  const savings = fullYearlyPrice - yearlyPrice;
  const percentage = Math.round((savings / fullYearlyPrice) * 100);
  return { amount: savings, percentage };
}
