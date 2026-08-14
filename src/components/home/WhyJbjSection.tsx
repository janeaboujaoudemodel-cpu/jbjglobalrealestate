import { lazy, Suspense } from "react";
import { PremiumSectionCard } from "@/components/ui/premium-section-card";
import LazyVisible from "@/components/util/LazyVisible";

const ExploreServicesCard = lazy(() => import("@/components/home/ExploreServicesExpander"));
const InnovationLabSection = lazy(() => import("@/components/home/InnovationLabSection"));
const VerificationBanner = lazy(() => import("@/components/verification/VerificationBanner"));
const PartnerVerifyHeroCTA = lazy(() => import("@/components/home/PartnerVerifyHeroCTA"));

const Loader = () => <div className="min-h-[72px] w-full" aria-hidden="true" />;

/**
 * Merged "Why JBJ" trust section — Explore Our Services + How We Build
 * (InnovationLabSection) + Verification banner + Partner Verify CTA, which
 * previously shipped as four stacked homepage sections.
 */
export default function WhyJbjSection() {
  return (
    <section aria-labelledby="why-jbj-title" className="w-full">
      <PremiumSectionCard padding="none" width="contained" wrapperClassName="cv-auto pt-14 pb-8 md:pt-16 md:pb-10">
        <header className="text-center mb-8">
          <h2 id="why-jbj-title" className="font-cormorant text-3xl sm:text-4xl font-semibold">
            Why JBJ
          </h2>
          <p className="text-sm mt-2 opacity-80">
            Licensed service lines, an engineered process, and verified counterparties.
          </p>
        </header>

        <LazyVisible minHeight={720} minHeightMobile={672}>
          <Suspense fallback={<Loader />}>
            <ExploreServicesCard />
          </Suspense>
        </LazyVisible>

        <div className="mt-10">
          <LazyVisible minHeight={696} minHeightMobile={1100}>
            <Suspense fallback={<Loader />}>
              <InnovationLabSection />
            </Suspense>
          </LazyVisible>
        </div>
      </PremiumSectionCard>

      <div className="jj-fullbleed-band pt-6 md:pt-8" data-fullbleed-band>
        <Suspense fallback={null}>
          <VerificationBanner />
        </Suspense>
        <Suspense fallback={null}>
          <PartnerVerifyHeroCTA />
        </Suspense>
      </div>
    </section>
  );
}
