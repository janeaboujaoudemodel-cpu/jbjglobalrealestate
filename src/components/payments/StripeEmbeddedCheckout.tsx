import { EmbeddedCheckoutProvider, EmbeddedCheckout } from "@stripe/react-stripe-js";
import { getStripe, getStripeEnvironment } from "@/lib/stripe";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  priceId: string;
  quantity?: number;
  customerEmail?: string;
  /**
   * @deprecated Ignored. The checkout session's `metadata.userId` is derived
   * server-side from the verified Supabase session (backend audit 2.2) — a
   * client-supplied value is never trusted and is no longer sent.
   */
  userId?: string;
  returnUrl?: string;
}

export function StripeEmbeddedCheckoutView({
  priceId,
  quantity,
  customerEmail,
  returnUrl,
}: Props) {
  const fetchClientSecret = async (): Promise<string> => {
    const resolvedReturnUrl =
      returnUrl ??
      `${window.location.origin}/checkout/return?session_id={CHECKOUT_SESSION_ID}`;

    const { data, error } = await supabase.functions.invoke("create-checkout", {
      body: {
        priceId,
        quantity,
        customerEmail,
        returnUrl: resolvedReturnUrl,
        environment: getStripeEnvironment(),
      },
    });
    if (error || !data?.clientSecret) {
      throw new Error(error?.message || "Failed to create checkout session");
    }
    return data.clientSecret as string;
  };

  return (
    <div id="checkout" className="min-h-[560px]">
      <EmbeddedCheckoutProvider stripe={getStripe()} options={{ fetchClientSecret }}>
        <EmbeddedCheckout />
      </EmbeddedCheckoutProvider>
    </div>
  );
}
