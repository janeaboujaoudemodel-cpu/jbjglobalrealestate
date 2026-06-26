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
    <section data-hero-dark data-surface="dark" className="jj-hero-fullscreen jj-hero-compact relative flex items-end justify-start overflow-hidden pb-16 md:pb-20 px-4 md:px-8 lg:px-12">
      {/* Video background with poster fallback — vivid saturation boost */}
      <div className="absolute inset-0" style={{ filter: 'saturate(1.45) contrast(1.08) brightness(1.05)' }}>
        <VideoBackground src={propertiesHeroVideo} poster={POSTER} />
      </div>

      {/* Light gradient overlay — keeps text legibility WITHOUT killing color */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/55" />

      {/* Warm gold glow boosts vibrance */}
      <div
        className="absolute inset-0 pointer-events-none mix-blend-soft-light"
        style={{
          background:
            'radial-gradient(ellipse at 50% 40%, rgba(255,196,90,0.35) 0%, rgba(0,0,0,0) 65%)',
        }}
      />

      {/* Floating gold accent orbs — brighter */}
      <div className="absolute top-1/4 left-10 w-64 h-64 bg-[#FFD27A]/20 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-10 w-96 h-96 bg-[#B89555]/25 rounded-full blur-[120px] pointer-events-none" />

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
