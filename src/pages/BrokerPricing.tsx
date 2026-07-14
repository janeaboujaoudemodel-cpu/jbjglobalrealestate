import SEOHead from "@/components/SEOHead";
import { PaymentTestModeBanner } from "@/components/payments/PaymentTestModeBanner";
import { StripePricingGrid } from "@/components/payments/StripePricingGrid";
import { BROKER_TIERS } from "@/content/pricing";

export default function BrokerPricing() {
  return (
    <>
      <SEOHead
        title="Broker Subscriptions | JBJ Global Real Estate"
        description="Choose the broker subscription that fits your business — Starter, Pro, or Elite. Portal access, AI tools, market intelligence, and concierge."
        canonicalPath="/broker-pricing"
      />

      <PaymentTestModeBanner />

      <div className="min-h-screen bg-[#F7F2EA]">
        <StripePricingGrid
          eyebrow="Broker Subscriptions"
          title="Grow your brokerage with JBJ"
          subtitle="Placeholder pricing shown in AED — cancel anytime, keep access until the end of your billing period."
          tiers={BROKER_TIERS}
          defaultInterval="monthly"
          analyticsContext="broker_pricing"
          ctaLabel="Subscribe"
        />
      </div>
    </>
  );
}
