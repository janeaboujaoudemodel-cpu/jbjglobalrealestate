import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useStripeCheckout } from "@/hooks/useStripeCheckout";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { PaymentTestModeBanner } from "@/components/payments/PaymentTestModeBanner";
import { formatAed, type BillingInterval, type PricingTier } from "@/content/pricing";
import { cn } from "@/lib/utils";
import { logAnalytics } from "@/lib/analytics";

interface Props {
  title: string;
  eyebrow?: string;
  subtitle?: string;
  tiers: PricingTier[];
  intervals?: BillingInterval[];
  defaultInterval?: BillingInterval;
  ctaLabel?: string;
  analyticsContext: string;
}

export function PricingGrid({
  title,
  eyebrow,
  subtitle,
  tiers,
  intervals,
  defaultInterval,
  ctaLabel = "Get started",
  analyticsContext,
}: Props) {
  const { user } = useAuth();
  const { openCheckout, checkoutElement } = useStripeCheckout();
  const { requireAuth } = useRequireAuth();

  const availableIntervals: BillingInterval[] = useMemo(() => {
    if (intervals?.length) return intervals;
    const set = new Set<BillingInterval>();
    tiers.forEach((t) => t.prices.forEach((p) => set.add(p.interval)));
    return Array.from(set);
  }, [intervals, tiers]);

  const [interval, setInterval] = useState<BillingInterval>(
    defaultInterval ?? availableIntervals[0] ?? "monthly",
  );

  const handleSelect = (tier: PricingTier) => {
    const price =
      tier.prices.find((p) => p.interval === interval) ?? tier.prices[0];
    if (!price) return;

    logAnalytics("pricing_tier_selected", {
      context: analyticsContext,
      tier: tier.key,
      priceId: price.priceId,
      interval: price.interval,
    });

    requireAuth({
      action: "purchase_membership",
      onAuthed: () => {
        openCheckout({
          priceId: price.priceId,
          userId: user?.id,
          customerEmail: user?.email ?? undefined,
          title: tier.name,
        });
      },
    });
  };

  return (
    <>
      <PaymentTestModeBanner />
      <section className="jj-section py-16 md:py-24">
        <div className="mx-auto max-w-6xl px-4">
          <div className="text-center mb-10 md:mb-14">
            {eyebrow ? (
              <div className="text-[11px] uppercase tracking-[0.32em] text-[#B89555] mb-3">
                {eyebrow}
              </div>
            ) : null}
            <h1 className="font-cormorant text-4xl md:text-5xl lg:text-6xl text-[#1A1A1A] leading-tight">
              {title}
            </h1>
            {subtitle ? (
              <p className="mt-4 text-[#4A4A4A] max-w-2xl mx-auto">{subtitle}</p>
            ) : null}
          </div>

          {availableIntervals.length > 1 ? (
            <div className="mx-auto mb-10 inline-flex items-center gap-1 rounded-full border border-[#B89555]/40 bg-white p-1 shadow-sm block w-fit mx-auto">
              {availableIntervals.map((int) => (
                <button
                  key={int}
                  onClick={() => setInterval(int)}
                  className={cn(
                    "px-4 py-2 rounded-full text-sm font-medium transition-colors",
                    interval === int
                      ? "bg-[#064E3B] text-white"
                      : "text-[#1A1A1A] hover:text-[#064E3B]",
                  )}
                >
                  {int === "monthly" ? "Monthly" : int === "yearly" ? "Yearly" : "One-time"}
                </button>
              ))}
            </div>
          ) : null}

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {tiers.map((tier) => {
              const price =
                tier.prices.find((p) => p.interval === interval) ?? tier.prices[0];
              return (
                <Card
                  key={tier.key}
                  className={cn(
                    "flex flex-col border-[#B89555]/30 bg-white/80 backdrop-blur-sm transition-transform",
                    tier.featured &&
                      "border-[#064E3B] ring-2 ring-[#064E3B]/20 shadow-[0_20px_60px_-30px_rgba(6,78,59,0.35)] md:-translate-y-2",
                  )}
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="text-[11px] uppercase tracking-[0.24em] text-[#B89555]">
                        {tier.tagline}
                      </div>
                      {tier.badge ? (
                        <Badge className="bg-[#064E3B] text-white hover:bg-[#064E3B]">
                          {tier.badge}
                        </Badge>
                      ) : null}
                    </div>
                    <CardTitle className="font-cormorant text-2xl text-[#1A1A1A] mt-2">
                      {tier.name}
                    </CardTitle>
                    <CardDescription className="text-[#4A4A4A]">
                      {tier.headline}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col flex-1">
                    <div className="mb-4">
                      <div className="flex items-baseline gap-2">
                        <span className="font-cormorant text-4xl text-[#064E3B]">
                          {formatAed(price.amountAed)}
                        </span>
                        <span className="text-sm text-[#4A4A4A]">{price.label}</span>
                      </div>
                      {price.savingsNote ? (
                        <div className="text-xs text-[#064E3B] mt-1">
                          {price.savingsNote}
                        </div>
                      ) : null}
                    </div>

                    <p className="text-sm text-[#4A4A4A] mb-5">{tier.description}</p>

                    <ul className="space-y-2 mb-6 flex-1">
                      {tier.features.map((f) => (
                        <li key={f} className="flex items-start gap-2 text-sm text-[#1A1A1A]">
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#064E3B]" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>

                    <Button
                      variant={tier.featured ? "primary" : "secondary"}
                      className="w-full"
                      onClick={() => handleSelect(tier)}
                    >
                      {ctaLabel}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>
      {checkoutElement}
    </>
  );
}
