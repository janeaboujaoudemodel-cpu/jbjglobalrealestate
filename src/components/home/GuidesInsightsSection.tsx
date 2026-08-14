import { lazy, Suspense, useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { PodcastVisibilityGate } from "@/components/home/PodcastVisibilityGate";

const HomepageBookMarquee = lazy(() => import("@/components/home/HomepageBookMarquee"));
const JBJPodcastSection = lazy(() => import("@/components/home/JBJPodcastSection"));

const Loader = () => <div className="min-h-[240px] w-full" aria-hidden="true" />;

/**
 * Guides & Insights — keeps the book marquee and folds the podcast section in
 * as a tab instead of shipping it as its own stacked homepage section.
 */
export default function GuidesInsightsSection() {
  const [tab, setTab] = useState("guides");

  return (
    <section aria-labelledby="home-guides-title" className="w-full cv-auto py-6">
      <header className="text-center mb-6">
        <h2 id="home-guides-title" className="font-cormorant text-3xl sm:text-4xl font-semibold">
          Guides &amp; Insights
        </h2>
      </header>

      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList className="mx-auto mb-6 flex w-full max-w-md flex-wrap justify-center gap-2 bg-transparent p-0">
          <TabsTrigger value="guides" className="tab-trigger-champagne rounded-full px-4 py-2 text-xs sm:text-sm font-semibold uppercase tracking-[0.1em]">
            Guides &amp; Reports
          </TabsTrigger>
          <TabsTrigger value="podcast" className="tab-trigger-champagne rounded-full px-4 py-2 text-xs sm:text-sm font-semibold uppercase tracking-[0.1em]">
            Podcast
          </TabsTrigger>
        </TabsList>

        <TabsContent value="guides" className="mt-0">
          <div className="jj-fullbleed-band" data-fullbleed-band>
            <Suspense fallback={<Loader />}>
              <HomepageBookMarquee />
            </Suspense>
          </div>
        </TabsContent>

        <TabsContent value="podcast" className="mt-0">
          <PodcastVisibilityGate>
            <Suspense fallback={<Loader />}>
              <JBJPodcastSection />
            </Suspense>
          </PodcastVisibilityGate>
        </TabsContent>
      </Tabs>
    </section>
  );
}
