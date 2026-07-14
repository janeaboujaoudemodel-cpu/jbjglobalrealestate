import { useQuery } from "@tanstack/react-query";
import { Coins, Sparkles } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { useBrokerCreditWallet } from "@/hooks/useBrokerCreditWallet";
import { useStripeCheckout } from "@/hooks/useStripeCheckout";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

interface PackDef {
  pack_key: string;
  display_name: string;
  credits: number;
  price_aed: number;
  display_order: number;
}

const TIER_LABEL: Record<string, string> = {
  broker_basic: "Basic",
  broker_premium: "Premium",
  broker_signature: "Signature",
};

/**
 * Header pill showing the broker's current credit balance and tier, with a
 * popover to buy top-up packs via Stripe embedded checkout.
 */
export default function BrokerCreditBadge({ className }: { className?: string }) {
  const { user } = useAuth();
  const { balance, tier, wallet, isLoading } = useBrokerCreditWallet();
  const { openCheckout, checkoutElement } = useStripeCheckout();
  const [open, setOpen] = useState(false);

  const packs = useQuery({
    queryKey: ["broker-credit-packs"],
    queryFn: async (): Promise<PackDef[]> => {
      const { data, error } = await supabase
        .from("broker_credit_pack_definitions")
        .select("pack_key, display_name, credits, price_aed, display_order")
        .order("display_order", { ascending: true });
      if (error) throw error;
      return (data ?? []) as PackDef[];
    },
    enabled: open,
  });

  if (!user) return null;
  const tierLabel = tier ? TIER_LABEL[tier] ?? tier : "No plan";

  const handleBuy = (pack: PackDef) => {
    openCheckout({
      priceId: pack.pack_key,
      customerEmail: user.email ?? undefined,
      userId: user.id,
      returnUrl: `${window.location.origin}/checkout/return?session_id={CHECKOUT_SESSION_ID}`,
      title: `${pack.display_name} — ${pack.credits} credits`,
    });
    setOpen(false);
  };

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            className={cn(
              "inline-flex items-center gap-2 px-3 py-1.5 rounded-full",
              "border border-[#B89555]/40 bg-[#EFE6D6]/50 hover:bg-[#EFE6D6] transition",
              "text-xs text-[#1A1A1A]",
              className,
            )}
            aria-label="Credit wallet"
          >
            <Coins className="h-3.5 w-3.5 text-[#064E3B]" />
            <span className="font-semibold tabular-nums">
              {isLoading ? "—" : balance.toLocaleString()}
            </span>
            <span className="text-[#1A1A1A]/60">credits</span>
            <span className="ml-1 px-1.5 py-0.5 rounded bg-[#064E3B] text-[#F7F2EA] text-[10px] uppercase tracking-wider">
              {tierLabel}
            </span>
          </button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-[340px] p-4 bg-[#FDFBF7] border-[#B89555]/30">
          <div className="space-y-3">
            <div>
              <div className="text-[10px] uppercase tracking-[0.18em] text-[#1A1A1A]/60">
                Wallet balance
              </div>
              <div className="flex items-baseline gap-2 mt-1">
                <div className="text-2xl font-serif text-[#064E3B]">{balance.toLocaleString()}</div>
                <div className="text-xs text-[#1A1A1A]/60">credits</div>
              </div>
              <div className="text-[11px] text-[#1A1A1A]/60 mt-1">
                {wallet?.subscription_credits ?? 0} from plan · {wallet?.purchased_credits ?? 0} purchased
              </div>
            </div>

            <div className="pt-3 border-t border-[#B89555]/20">
              <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.18em] text-[#1A1A1A]/60 mb-2">
                <Sparkles className="h-3 w-3" /> Top up
              </div>
              {packs.isLoading ? (
                <div className="text-xs text-[#1A1A1A]/60 py-2">Loading packs…</div>
              ) : (packs.data ?? []).length === 0 ? (
                <div className="text-xs text-[#1A1A1A]/60 py-2">No packs available.</div>
              ) : (
                <div className="space-y-1.5">
                  {packs.data!.map((pack) => (
                    <button
                      key={pack.pack_key}
                      onClick={() => handleBuy(pack)}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-md border border-[#B89555]/30 bg-white hover:border-[#064E3B]/50 hover:bg-[#EFE6D6]/40 transition text-left"
                    >
                      <div>
                        <div className="text-sm text-[#1A1A1A]">{pack.display_name}</div>
                        <div className="text-[11px] text-[#1A1A1A]/60">
                          {pack.credits.toLocaleString()} credits
                        </div>
                      </div>
                      <div className="text-sm font-semibold text-[#064E3B] tabular-nums">
                        AED {pack.price_aed.toLocaleString()}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-2">
              <Button
                variant="secondary"
                className="w-full"
                onClick={() => {
                  setOpen(false);
                  window.location.href = "/broker-pricing";
                }}
              >
                Manage subscription
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
      {checkoutElement}
    </>
  );
}
