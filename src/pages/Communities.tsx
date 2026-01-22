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
        <div className="relative z-10 container mx-auto px-4">
          {/* Layer 2: Active Champagne */}
          <div className="bg-gradient-to-br from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] rounded-2xl p-6 md:p-8 border border-gold/30">
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
            <div className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] rounded-xl p-6 border-2 border-gold/40">
              <CommunityGrid />
            </div>
          </div>
        </div>
      </section>
    </>
  );
});

Communities.displayName = "Communities";

export default Communities;
