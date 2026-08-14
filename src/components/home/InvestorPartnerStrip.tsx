import { lazy, Suspense } from "react";
import LazyVisible from "@/components/util/LazyVisible";

const OverseasInvestorsBanner = lazy(() => import("@/components/home/OverseasInvestorsStrip"));
const DeveloperPartnersMarquee = lazy(() => import("@/components/DeveloperPartnersMarquee"));

/**
 * One combined investor / partner strip — merges the Overseas Investors band
 * and the Developer Partners marquee that previously sat in two separate
 * places on the homepage.
 */
export default function InvestorPartnerStrip() {
  return (
    <section aria-label="Investors and development partners" className="w-full">
      <div className="jj-fullbleed-band cv-auto" data-fullbleed-band>
        <LazyVisible minHeight={325} minHeightMobile={404}>
          <Suspense fallback={<div className="min-h-[120px]" aria-hidden="true" />}>
            <OverseasInvestorsBanner />
          </Suspense>
        </LazyVisible>
      </div>
      <Suspense fallback={<div className="min-h-[72px]" aria-hidden="true" />}>
        <DeveloperPartnersMarquee />
      </Suspense>
    </section>
  );
}
