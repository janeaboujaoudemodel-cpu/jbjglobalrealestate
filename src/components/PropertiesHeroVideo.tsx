/**
 * Properties Cinematic Hero - Premium Video Background
 * Uses unique properties-page video (separate from homepage)
 */

import { motion } from "framer-motion";
import propertiesHeroVideo from "@/assets/properties-hero-video.mp4";
import VideoBackground from "@/components/VideoBackground";

interface PropertiesHeroVideoProps {
  children?: React.ReactNode;
}

const POSTER = "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1920&q=80";

const PropertiesHeroVideo = ({ children }: PropertiesHeroVideoProps) => {
  return (
    <section data-surface="dark" className="jj-hero-fullscreen jj-hero-compact relative flex items-end justify-start overflow-hidden pb-16 md:pb-20 px-4 md:px-8 lg:px-12">
      {/* Video background with poster fallback */}
      <VideoBackground src={propertiesHeroVideo} poster={POSTER} />
      
      {/* Gradient overlay — richer contrast, less washed out */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/30 to-black/80" />
      {/* Saturation + warmth boost so the underlying video reads vivid, not faded */}
      <div
        className="absolute inset-0 pointer-events-none mix-blend-overlay"
        style={{
          background:
            'radial-gradient(ellipse at 50% 50%, rgba(184,149,85,0.18) 0%, rgba(0,0,0,0.0) 60%)',
        }}
      />
      {/* Soft directional vignette behind heading area for text contrast */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0) 35%, rgba(0,0,0,0) 60%, rgba(0,0,0,0.75) 100%)',
        }}
      />

      {/* Floating gold accent orbs */}
      <div className="absolute top-1/4 left-10 w-64 h-64 bg-[#EFE6D6]/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-10 w-96 h-96 bg-[#EFE6D6]/10 rounded-full blur-[120px] pointer-events-none" />

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
