import { lazy, Suspense, useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { PremiumSectionCard } from "@/components/ui/premium-section-card";

const ContinueSearching = lazy(() => import("@/components/ContinueSearching"));
const ResalePropertiesSection = lazy(() => import("@/components/home/ResalePropertiesSection"));
const AreasWeCover = lazy(() => import("@/components/home/AreasWeCover"));

const Loader = () => <div className="min-h-[240px] w-full" aria-hidden="true" />;

/**
 * Merged "search tools" section — replaces the three previously stacked
 * homepage sections (Continue Searching / Resale Properties / Top Areas)
 * with one section and a tab switch. No color values are introduced here;
 * all tones come from the existing champagne tab + section primitives.
 */
export default function HomeSearchToolsSection() {
  const [tab, setTab] = useState("continue");

  return (
    <PremiumSectionCard padding="none" width="contained" wrapperClassName="cv-auto py-6">
      <section aria-labelledby="home-search-tools-title" className="w-full">
        <header className="text-center mb-6">
          <h2
            id="home-search-tools-title"
            className="font-cormorant text-3xl sm:text-4xl font-semibold"
          >
            Keep Searching
          </h2>
          <p className="text-sm mt-2 opacity-80">
            Pick up where you left off, browse resale stock, or explore Dubai&apos;s top areas.
          </p>
        </header>

        <Tabs value={tab} onValueChange={setTab} className="w-full">
          <TabsList className="mx-auto mb-6 flex w-full max-w-2xl flex-wrap justify-center gap-2 bg-transparent p-0">
            <TabsTrigger value="continue" className="tab-trigger-champagne rounded-full px-4 py-2 text-xs sm:text-sm font-semibold uppercase tracking-[0.1em]">
              Continue Searching
            </TabsTrigger>
            <TabsTrigger value="resale" className="tab-trigger-champagne rounded-full px-4 py-2 text-xs sm:text-sm font-semibold uppercase tracking-[0.1em]">
              Resale Properties
            </TabsTrigger>
            <TabsTrigger value="areas" className="tab-trigger-champagne rounded-full px-4 py-2 text-xs sm:text-sm font-semibold uppercase tracking-[0.1em]">
              Top Areas in Dubai
            </TabsTrigger>
          </TabsList>

          <TabsContent value="continue" className="mt-0">
            <Suspense fallback={<Loader />}>
              <ContinueSearching type="property" />
            </Suspense>
          </TabsContent>
          <TabsContent value="resale" className="mt-0">
            <Suspense fallback={<Loader />}>
              <ResalePropertiesSection />
            </Suspense>
          </TabsContent>
          <TabsContent value="areas" className="mt-0">
            <Suspense fallback={<Loader />}>
              <AreasWeCover />
            </Suspense>
          </TabsContent>
        </Tabs>
      </section>
    </PremiumSectionCard>
  );
}
