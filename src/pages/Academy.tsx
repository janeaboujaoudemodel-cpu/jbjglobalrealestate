import { PageMeta } from "@/components/seo/PageMeta";
import { PricingGrid } from "@/components/payments/PricingGrid";
import { ACADEMY_BUNDLES } from "@/content/pricing";
import MIPreFooterCard from "@/components/shell/MIPreFooterCard";
import { CertificatePreview } from "@/components/certification"; // TEMP-CERT-CHECK

export default function Academy() {
  return (
    <>
      <PageMeta
        title="Broker Academy | JBJ Global Real Estate"
        description="Live 90-minute sessions with senior JBJ brokers. Dubai market, RERA/DLD, off-plan, sales, AI. Certificate of Completion & JBJ interview funnel."
      />
      {/* TEMP-CERT-CHECK */}
      <div className="mx-auto max-w-3xl p-8"><CertificatePreview isLocked /></div>
      <PricingGrid
        eyebrow="Broker Academy"
        title="Become a Dubai real estate professional"
        subtitle="Learn from JBJ senior brokers actively closing deals. Live sessions, real playbooks, career pathway into JBJ."
        tiers={ACADEMY_BUNDLES}
        analyticsContext="academy"
        ctaLabel="Enroll"
      />
      <MIPreFooterCard
        title="Have questions about the Academy?"
        subtitle="Talk to our team about enrolment, schedules and the JBJ career pathway."
        maxWidthClass="max-w-6xl"
      />
    </>
  );
}
