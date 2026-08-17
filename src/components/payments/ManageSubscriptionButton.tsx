import { useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { getStripeEnvironment } from "@/lib/stripe";
import { toast } from "sonner";
import { useBrokerStripeTier } from "@/hooks/useBrokerStripeTier";
import { safeOpen } from "@/utils/safeUrl";

interface ManageSubscriptionButtonProps {
  className?: string;
  variant?: React.ComponentProps<typeof Button>["variant"];
  size?: React.ComponentProps<typeof Button>["size"];
  label?: string;
}

/**
 * Opens the Stripe Customer Portal in a new tab. Users can cancel their
 * subscription, update payment methods, and view invoices. Only renders
 * when the current user has an active or grace-period subscription.
 */
export function ManageSubscriptionButton({
  className,
  variant = "outline",
  size = "sm",
  label = "Manage subscription",
}: ManageSubscriptionButtonProps) {
  const { isActive, isLoading } = useBrokerStripeTier();
  const [loading, setLoading] = useState(false);

  if (isLoading || !isActive) return null;

  const handleClick = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-portal-session", {
        body: {
          environment: getStripeEnvironment(),
          returnUrl: `${window.location.origin}/broker/dashboard`,
        },
      });
      if (error || !data?.url) throw new Error(error?.message || "Could not open the billing portal");
      safeOpen(data.url);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button onClick={handleClick} disabled={loading} variant={variant} size={size} className={className}>
      {loading ? "Opening…" : label}
    </Button>
  );
}
