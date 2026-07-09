import { PageMeta } from "@/components/seo/PageMeta";
import { PricingGrid } from "@/components/payments/PricingGrid";
import { INVESTOR_TIERS } from "@/content/pricing";

export default function Membership() {
  return (
    <>
      <PageMeta
        title="Investor Memberships | JBJ Global Real Estate"
        description="Choose the JBJ Investor Membership that fits your Dubai real estate goals — from a single 30-min consultation to unlimited founder-level advisory."
      />
      <PricingGrid
        eyebrow="Investor Memberships"
        title="Advisory built around your Dubai portfolio"
        subtitle="Start with a single call or scale up to unlimited founder-level access. Cancel anytime."
        tiers={INVESTOR_TIERS}
        analyticsContext="membership"
      />
    </>
  );
}
