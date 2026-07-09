import { useCallback, useState } from "react";
import { StripeEmbeddedCheckoutView } from "@/components/payments/StripeEmbeddedCheckout";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface CheckoutOptions {
  priceId: string;
  quantity?: number;
  customerEmail?: string;
  userId?: string;
  returnUrl?: string;
  title?: string;
}

export function useStripeCheckout() {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<CheckoutOptions | null>(null);

  const openCheckout = useCallback((opts: CheckoutOptions) => {
    setOptions(opts);
    setIsOpen(true);
  }, []);

  const closeCheckout = useCallback(() => {
    setIsOpen(false);
    setOptions(null);
  }, []);

  const checkoutElement = (
    <Dialog open={isOpen} onOpenChange={(o) => (o ? undefined : closeCheckout())}>
      <DialogContent className="max-w-3xl p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle>{options?.title ?? "Complete your purchase"}</DialogTitle>
        </DialogHeader>
        <div className="p-4">
          {isOpen && options ? (
            <StripeEmbeddedCheckoutView
              key={options.priceId}
              priceId={options.priceId}
              quantity={options.quantity}
              customerEmail={options.customerEmail}
              userId={options.userId}
              returnUrl={options.returnUrl}
            />
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );

  return { openCheckout, closeCheckout, isOpen, checkoutElement };
}
