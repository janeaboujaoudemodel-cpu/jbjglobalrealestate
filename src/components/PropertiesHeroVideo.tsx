/**
 * Properties Cinematic Hero - Premium Video Background
 * Uses unique properties-page video (separate from homepage)
 */

import { useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import propertiesHeroVideo from "@/assets/properties-hero-video.mp4";


interface PropertiesHeroVideoProps {
  children?: React.ReactNode;
}

const PropertiesHeroVideo = ({ children }: PropertiesHeroVideoProps) => {
  const [videoReady, setVideoReady] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const handleCanPlay = useCallback(() => {
    if (!videoReady) setVideoReady(true);
  }, [videoReady]);

  return (
    <section className="jj-hero-fullscreen relative flex items-end justify-start overflow-hidden pb-16 md:pb-20 px-4 md:px-8 lg:px-12">
      {/* Video background */}
      <div className="absolute inset-0 bg-black">
        <video
          ref={videoRef}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          onCanPlay={handleCanPlay}
          className="absolute inset-0 w-full h-full object-cover"
          style={{
            opacity: videoReady ? 1 : 0,
            transition: 'opacity 0.8s ease-in-out',
          }}
        >
          <source src={propertiesHeroVideo} type="video/mp4" />
        </video>
        
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black" />
      </div>

      {/* Floating gold accent orbs */}
      <div className="absolute top-1/4 left-10 w-64 h-64 bg-gold/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-10 w-96 h-96 bg-gold/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Children (hero content) */}
      {children}

      {/* Scroll indicator - no "Explore" text, just the line */}
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
