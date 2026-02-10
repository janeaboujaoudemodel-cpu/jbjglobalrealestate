/**
 * Properties Cinematic Hero - Multi-Scene Video Background
 * Scenes: Downtown Dubai zoom, Palm Jumeirah with Atlantis, Burj Al Arab
 */

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

// Import videos - using new generated videos for Burj Khalifa and Burj Al Arab
import palmAtlantisVideo from "@/assets/videos/why-dubai-atlantis-palm.mp4";
import burjAlArabVideo from "@/assets/videos/burj-al-arab-aerial.mp4";
import burjKhalifaVideo from "@/assets/videos/burj-khalifa-day-to-night.mp4";

interface VideoScene {
  id: string;
  video: string;
  label: string;
}

const VIDEO_SCENES: VideoScene[] = [
  { id: "downtown", video: burjKhalifaVideo, label: "Downtown Dubai" },
  { id: "palm", video: palmAtlantisVideo, label: "Palm Jumeirah" },
  { id: "burj-al-arab", video: burjAlArabVideo, label: "Burj Al Arab" },
];

const SCENE_DURATION = 8000; // 8 seconds per scene

interface PropertiesHeroVideoProps {
  children?: React.ReactNode;
}

const PropertiesHeroVideo = ({ children }: PropertiesHeroVideoProps) => {
  const [currentScene, setCurrentScene] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  // Auto-advance scenes
  useEffect(() => {
    const interval = setInterval(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentScene((prev) => (prev + 1) % VIDEO_SCENES.length);
        setIsTransitioning(false);
      }, 600); // Crossfade duration
    }, SCENE_DURATION);

    return () => clearInterval(interval);
  }, []);

  // Ensure current video plays and others pause
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
      {/* Multi-scene video background */}
      <div className="absolute inset-0 bg-black">
        {VIDEO_SCENES.map((scene, index) => (
          <AnimatePresence key={scene.id} mode="sync">
            {index === currentScene && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.6 }}
                className="absolute inset-0"
              >
                <video
                  ref={(el) => (videoRefs.current[index] = el)}
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload="auto"
                  className="absolute inset-0 w-full h-full object-cover"
                >
                  <source src={scene.video} type="video/mp4" />
                </video>
              </motion.div>
            )}
          </AnimatePresence>
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
