/**
 * Properties Cinematic Hero - Multi-Scene Video Background
 * Optimized: videos loaded via URL (not bundled), first video plays immediately
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

// Use URL references instead of static imports to avoid blocking the bundle
const burjKhalifaVideo = new URL("@/assets/videos/burj-khalifa-day-to-night.mp4", import.meta.url).href;
const burjAlArabVideo = new URL("@/assets/videos/burj-al-arab-aerial.mp4", import.meta.url).href;

interface VideoScene {
  id: string;
  video: string;
  label: string;
}

const VIDEO_SCENES: VideoScene[] = [
  { id: "downtown", video: burjKhalifaVideo, label: "Downtown Dubai" },
  { id: "burj-al-arab", video: burjAlArabVideo, label: "Burj Al Arab" },
];

const SCENE_DURATION = 8000;

interface PropertiesHeroVideoProps {
  children?: React.ReactNode;
}

const PropertiesHeroVideo = ({ children }: PropertiesHeroVideoProps) => {
  const [currentScene, setCurrentScene] = useState(0);
  const [videoReady, setVideoReady] = useState(false);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  // Mark ready as soon as first video can play
  const handleCanPlay = useCallback((index: number) => {
    if (index === 0 && !videoReady) setVideoReady(true);
  }, [videoReady]);

  // Auto-advance scenes
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentScene((prev) => (prev + 1) % VIDEO_SCENES.length);
    }, SCENE_DURATION);
    return () => clearInterval(interval);
  }, []);

  // Play/pause videos on scene change
  useEffect(() => {
    videoRefs.current.forEach((video, index) => {
      if (video) {
        if (index === currentScene) {
          video.currentTime = 0;
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      }
    });
  }, [currentScene]);

  return (
    <section className="jj-hero-fullscreen relative flex items-center justify-center overflow-hidden">
      {/* Video background */}
      <div className="absolute inset-0 bg-black">
        {VIDEO_SCENES.map((scene, index) => (
          <div
            key={scene.id}
            className="absolute inset-0 transition-opacity duration-700"
            style={{ opacity: index === currentScene ? 1 : 0 }}
          >
            <video
              ref={(el) => { videoRefs.current[index] = el; }}
              autoPlay={index === 0}
              muted
              loop
              playsInline
              preload={index === 0 ? "auto" : "none"}
              onCanPlay={() => handleCanPlay(index)}
              className="absolute inset-0 w-full h-full object-cover"
            >
              <source src={scene.video} type="video/mp4" />
            </video>
          </div>
        ))}
        
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black" />
      </div>

      {/* Floating gold accent orbs */}
      <div className="absolute top-1/4 left-10 w-64 h-64 bg-gold/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-10 w-96 h-96 bg-gold/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Children (hero content) */}
      {children}

      {/* Scroll indicator */}
      <motion.div 
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1, duration: 0.6 }}
      >
        <span className="text-gold/60 text-xs tracking-widest uppercase">Explore</span>
        <div className="w-[1px] h-12 bg-gradient-to-b from-gold/60 to-transparent" />
      </motion.div>
    </section>
  );
};

export default PropertiesHeroVideo;
