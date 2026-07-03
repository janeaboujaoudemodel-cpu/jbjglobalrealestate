import React from "react";
import { motion } from "framer-motion";
import NavigationTabs from "@/components/NavigationTabs";
import CommunityGrid from "@/components/CommunityGrid";
import { SEOHead, pagesSEO } from "@/components/SEOHead";
import { MapPin } from "lucide-react";

const Communities = React.forwardRef<HTMLElement>((_, ref) => {
  return (
    <>
      <SEOHead {...pagesSEO.communities} />
      <section
        ref={ref}
        className="relative w-full min-h-screen bg-gradient-to-br from-[#F0E6D2] via-[#E8DCCA] to-[#DED0BC]"
      >
        {/* Hero Header */}
        <div className="w-full bg-gradient-to-br from-[#064E3B] via-[#042C1C] to-[#010806] border-b border-white/18 py-10 md:py-14">
          <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3 mb-3">
              <div className="jj-pill-emerald-metallic w-10 h-10 rounded-xl border-0 flex items-center justify-center">
                <MapPin className="w-5 h-5 text-white" />
              </div>
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="allow-white text-white text-xs uppercase tracking-[0.3em] font-medium"
              >
                Explore UAE
              </motion.span>
            </div>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="allow-white text-white font-bold mb-3"
              style={{
                fontSize: "clamp(28px, 4vw, 52px)",
                lineHeight: "1.1",
              }}
            >
              <span className="text-white">UAE</span> Communities
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15, ease: "easeOut" }}
              className="allow-white text-white text-base md:text-lg max-w-2xl"
            >
              Explore the UAE's most prestigious communities and find your perfect home
            </motion.p>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <NavigationTabs />
          
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.25 }}
            className="mt-6"
          >
            <CommunityGrid />
          </motion.div>
        </div>
      </section>
    </>
  );
});

Communities.displayName = "Communities";

export default Communities;
