import { Helmet } from "react-helmet-async";
import { PricingGrid } from "@/components/payments/PricingGrid";
import { AGENCY_PACKAGES } from "@/content/pricing";
import { Button } from "@/components/ui/button";

export default function Agencies() {
  return (
    <>
      <Helmet>
        <title>Agency Packages | JBJ Global Real Estate</title>
        <meta
          name="description"
          content="Roll out the JBJ ecosystem across your brokerage — CRM, AI Toolkit, Matchmaker, Academy, and Library. Plans for 20, 50, or 100 users."
        />
      </Helmet>
      <PricingGrid
        eyebrow="Agency Packages"
        title="Deploy the JBJ ecosystem across your team"
        subtitle="Everything your brokers, closers, and admins need to run a modern Dubai brokerage — in one platform."
        tiers={AGENCY_PACKAGES}
        analyticsContext="agencies"
        ctaLabel="Start plan"
      />
      <section className="jj-section py-16 border-t border-[#B89555]/20">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <h2 className="font-cormorant text-3xl md:text-4xl text-[#1A1A1A] mb-3">
            Need more than 100 seats?
          </h2>
          <p className="text-[#4A4A4A] mb-6">
            Enterprise deployments include custom SLAs, on-premise integrations, and dedicated data residency in the UAE.
          </p>
          <Button variant="primary" asChild>
            <a href="mailto:enterprise@jbj.ae?subject=Enterprise%20Package%20Enquiry">
              Talk to enterprise sales
            </a>
          </Button>
        </div>
      </section>
    </>
  );
}
