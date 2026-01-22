import React from "react";
import NavigationTabs from "@/components/NavigationTabs";
import CommunityGrid from "@/components/CommunityGrid";
import { SEOHead, pagesSEO } from "@/components/SEOHead";

const Communities = React.forwardRef<HTMLElement>((_, ref) => {
  return (
    <>
      <SEOHead {...pagesSEO.communities} />
      {/* Layer 1: Black base */}
      <section
        ref={ref}
        className="relative w-full min-h-screen py-16 md:py-24 bg-black"
      >
        {/* Layer 2: Active Champagne - using global inset for aligned widths */}
        <div className="mx-4 md:mx-8 lg:mx-16 py-10 px-4 md:px-8 jj-layer-active rounded-2xl">
          <h1
            className="text-black font-bold mb-4"
            style={{
              fontFamily: "Poppins, sans-serif",
              fontSize: "clamp(32px, 5vw, 64px)",
              lineHeight: "1.1",
            }}
          >
            <span className="text-gold">UAE</span> Communities
          </h1>
          <p className="text-zinc-700 text-lg mb-10 max-w-2xl" style={{ fontFamily: "Poppins, sans-serif" }}>
            Explore the UAE's most prestigious communities and find your perfect home
          </p>

          <NavigationTabs />
          
          {/* Layer 3: Locked Champagne for cards container */}
          <div className="jj-card-inner rounded-xl p-6">
            <CommunityGrid />
          </div>
        </div>
      </section>
    </>
  );
});

Communities.displayName = "Communities";

export default Communities;
