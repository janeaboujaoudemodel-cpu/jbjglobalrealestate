/**
 * Properties Cinematic Hero - Premium Video Background
 * Uses unique properties-page video (separate from homepage)
 */

import { motion } from "framer-motion";
import propertiesHeroVideoAsset from "@/assets/properties-hero-video.mp4.asset.json";
const propertiesHeroVideo = propertiesHeroVideoAsset.url;
import VideoBackground from "@/components/VideoBackground";

interface PropertiesHeroVideoProps {
  children?: React.ReactNode;
}

const POSTER = "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1920&q=80";

const PropertiesHeroVideo = ({ children }: PropertiesHeroVideoProps) => {
  return (
    <section
      data-hero-dark
      data-surface="dark"
      className="relative flex min-h-[280px] sm:min-h-[340px] items-end justify-start overflow-hidden px-4 pb-10 pt-24 md:px-8 lg:px-12"
      style={{ background: "linear-gradient(135deg,#064E3B 0%,#042C1C 52%,#010806 100%)" }}
    >
      {/* Video background with poster fallback — compact so listings are visible immediately */}
      <div className="absolute inset-0 opacity-80" style={{ filter: 'saturate(1.25) contrast(1.05) brightness(0.85)' }}>
        <VideoBackground src={propertiesHeroVideo} poster={POSTER} />
      </div>

      {/* Emerald overlay — no generic placeholders or decorative orbs */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-[#042C1C]/35 to-black/70" />

      {/* Children (hero content) */}
      {children}

      {/* Scroll indicator */}
      <motion.div 
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1, duration: 0.6 }}
      >
        <div className="w-[1px] h-12 bg-gradient-to-b from-gold/60 to-transparent" />
      </motion.div>
    </section>
  );
};

export default PropertiesHeroVideo;
