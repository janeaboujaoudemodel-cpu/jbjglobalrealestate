import React from "react";
import NavigationTabs from "@/components/NavigationTabs";
import CommunityGrid from "@/components/CommunityGrid";
import { SEOHead, pagesSEO } from "@/components/SEOHead";

const Communities = React.forwardRef<HTMLElement>((_, ref) => {
  return (
    <>
      <SEOHead {...pagesSEO.communities} />
      <section
        ref={ref}
        className="relative w-full min-h-screen py-16 md:py-24 bg-zinc-950"
      >
        <div className="absolute top-0 left-0 right-0 h-[400px] pointer-events-none bg-gradient-to-b from-zinc-900/50 to-transparent" />

        <div className="relative z-10 container mx-auto px-4">
          <h1
            className="text-white font-bold mb-4"
            style={{
              fontFamily: "Poppins, sans-serif",
              fontSize: "clamp(32px, 5vw, 64px)",
              lineHeight: "1.1",
            }}
          >
            UAE Communities
          </h1>
          <p className="text-zinc-400 text-lg mb-10 max-w-2xl" style={{ fontFamily: "Poppins, sans-serif" }}>
            Explore the UAE's most prestigious communities and find your perfect home
          </p>

          <NavigationTabs />
          <CommunityGrid />
        </div>
      </section>
    </>
  );
});

Communities.displayName = "Communities";

export default Communities;
