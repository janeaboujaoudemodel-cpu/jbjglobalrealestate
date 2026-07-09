import { PageMeta } from "@/components/seo/PageMeta";
import { PricingGrid } from "@/components/payments/PricingGrid";
import { ACADEMY_BUNDLES } from "@/content/pricing";

export default function Academy() {
  return (
    <>
      <Helmet>
        <title>Broker Academy | JBJ Global Real Estate</title>
        <meta
          name="description"
          content="Live 90-minute sessions with senior JBJ brokers. Dubai market, RERA/DLD, off-plan, sales, AI. Certificate of Completion & JBJ interview funnel."
        />
      </Helmet>
      <PricingGrid
        eyebrow="Broker Academy"
        title="Become a Dubai real estate professional"
        subtitle="Learn from JBJ senior brokers actively closing deals. Live sessions, real playbooks, career pathway into JBJ."
        tiers={ACADEMY_BUNDLES}
        analyticsContext="academy"
        ctaLabel="Enroll"
      />
    </>
  );
}
