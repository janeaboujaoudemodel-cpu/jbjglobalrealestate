import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { T } from "@/components/ui/T";
import { PremiumHeroButton } from "@/components/ui/premium-hero-button";

// Use URL references instead of static imports to avoid blocking the bundle
const burjAlArabVideo = new URL("@/assets/videos/why-dubai-burj-al-arab.mp4", import.meta.url).href;
const burjKhalifaVideo = new URL("@/assets/videos/burj-khalifa-day-to-night.mp4", import.meta.url).href;
const atlantisPalmVideo = new URL("@/assets/videos/why-dubai-atlantis-palm.mp4", import.meta.url).href;

const scenes = [
  { src: burjAlArabVideo },
  { src: burjKhalifaVideo },
  { src: atlantisPalmVideo },
];

const stats = [
  { value: "0%", label: "Income Tax" },
  { value: "10Y", label: "Golden Visa" },
  { value: "#1", label: "Safety Rank" },
  { value: "200+", label: "Nationalities" },
];

export default function WhyDubaiCapitalSection() {
  const [currentScene, setCurrentScene] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentScene((prev) => (prev + 1) % scenes.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative h-screen min-h-[100vh] min-h-[100dvh] bg-black overflow-hidden">
      {/* Full-frame video background - edge to edge with smooth crossfade */}
      <AnimatePresence mode="sync">
        <motion.div
          key={currentScene}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
          className="absolute inset-0"
        >
          <video
            className="absolute inset-0 w-full h-full object-cover"
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
          >
            <source src={scenes[currentScene].src} type="video/mp4" />
          </video>
          {/* Subtle gradient overlay - less intrusive */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />
        </motion.div>
      </AnimatePresence>

      {/* Content overlay - compact and premium */}
      <div className="relative z-10 h-full flex items-center">
        <div className="px-6 md:px-12 lg:px-16 max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6 }}
          >
            {/* Premium badge without Globe icon */}
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-gold/40 bg-black/40 backdrop-blur-sm text-[10px] uppercase tracking-[0.2em] font-semibold text-gold">
              <T>Global Investment Hub</T>
            </span>

            <h2
              className="mt-4 text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight"
              style={{ 
                fontFamily: "Poppins, sans-serif",
                textShadow: '0 2px 8px rgba(0,0,0,0.6)'
              }}
            >
              <T>Why Dubai Became the Capital of</T>{" "}
              <span className="text-gold"><T>Global Investors</T></span>
            </h2>

            <p className="mt-3 text-sm md:text-base text-white/75 max-w-md leading-relaxed">
              <T>Strategic location, world-class infrastructure, and long-term government execution make Dubai the most investable city in the region.</T>
            </p>

            {/* Premium Stats Cards - Glass morphism with gold glow */}
            <div className="mt-6 grid grid-cols-4 gap-2 max-w-md">
              {stats.map((s, index) => (
                <motion.div
                  key={s.label}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="group relative rounded-xl overflow-hidden"
                >
                  {/* Gradient border */}
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-gold/40 via-gold/20 to-gold/40 p-[1px]">
                    <div className="h-full w-full rounded-xl bg-black/60 backdrop-blur-md" />
                  </div>
                  
                  {/* Content */}
                  <div className="relative px-3 py-3 text-center">
                    <div 
                      className="text-xl md:text-2xl lg:text-3xl font-bold text-gold leading-none"
                      style={{ textShadow: '0 0 20px rgba(200,167,102,0.5)' }}
                    >
                      {s.value}
                    </div>
                    <div className="mt-1 text-[9px] md:text-[10px] uppercase tracking-wider text-white/70 font-medium">
                      <T>{s.label}</T>
                    </div>
                  </div>
                  
                  {/* Hover glow */}
                  <div 
                    className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                    style={{ boxShadow: '0 0 30px rgba(200,167,102,0.4)' }} 
                  />
                </motion.div>
              ))}
            </div>

            {/* CTA Button - Smaller and more premium */}
            <div className="mt-6">
              <PremiumHeroButton href="/guides/investment" size="default">
                <T>Explore Investments</T>
              </PremiumHeroButton>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
