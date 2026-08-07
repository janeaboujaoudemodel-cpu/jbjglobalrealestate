import { PageMeta } from "@/components/seo/PageMeta";
import { PricingGrid } from "@/components/payments/PricingGrid";
import { ACADEMY_BUNDLES } from "@/content/pricing";
import MIPreFooterCard from "@/components/shell/MIPreFooterCard";
import { CertificatePreview } from "@/components/certification/CertificatePreview";

export default function Academy() {
  return (
    <>
      <PageMeta
        title="Broker Academy | JBJ Global Real Estate"
        description="Live 90-minute sessions with senior JBJ brokers. Dubai market, RERA/DLD, off-plan, sales, AI. Certificate of Completion & JBJ interview funnel."
      />
      <PricingGrid
        eyebrow="Broker Academy"
        title="Become a Dubai real estate professional"
        subtitle="Learn from JBJ senior brokers actively closing deals. Live sessions, real playbooks, career pathway into JBJ."
        tiers={ACADEMY_BUNDLES}
        analyticsContext="academy"
        ctaLabel="Enroll"
      />

      {/* Certificate — lives with the Academy programme (moved out of the gated portal) */}
      <section data-academy-certificate className="py-12 md:py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 text-center">
            <h2 className="font-serif text-3xl md:text-4xl !text-[#1A1A1A]">
              Your JBJ Academy Certificate
            </h2>
            <p className="mx-auto mt-3 max-w-2xl !text-[#1A1A1A]/70">
              Issued in your name on completion of the programme — verifiable, signed and stamped by JBJ Global Real Estate.
            </p>
          </div>
          <CertificatePreview isLocked />
        </div>
      </section>

      <MIPreFooterCard
        title="Have questions about the Academy?"
        subtitle="Talk to our team about enrolment, schedules and the JBJ career pathway."
        maxWidthClass="max-w-6xl"
      />
    </>
  );
}

