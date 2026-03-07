import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import { T } from "@/components/ui/T";
import { PremiumHeroButton } from "@/components/ui/premium-hero-button";
// Video served from storage to avoid bundle bloat
const WHY_DUBAI_VIDEO_URL = "https://mdafrewypkkrildjgtey.supabase.co/storage/v1/object/public/videos/why-dubai-scenes.mp4";

const SCENE_URLS = [
  WHY_DUBAI_VIDEO_URL,
];

const scenes = SCENE_URLS.map(src => ({ src }));

const stats = [
  { value: "0%", label: "Income Tax" },
  { value: "10Y", label: "Golden Visa" },
  { value: "#1", label: "Safety Rank" },
  { value: "200+", label: "Nationalities" },
];

export default function WhyDubaiCapitalSection() {
  const [currentScene, setCurrentScene] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  // IntersectionObserver: only load videos when section is in viewport
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible) return;
    const interval = setInterval(() => {
      setCurrentScene((prev) => (prev + 1) % scenes.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [isVisible]);

  return (
    <section ref={sectionRef} className="relative h-screen min-h-[100vh] min-h-[100dvh] bg-black overflow-hidden">
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
          {isVisible && (
            <>
              <img
                src="https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1920&q=80"
                alt=""
                aria-hidden="true"
                className="absolute inset-0 w-full h-full object-cover"
                loading="eager"
              />
              <video
                className="absolute inset-0 w-full h-full object-cover"
                autoPlay
                loop
                muted
                playsInline
                preload="metadata"
                style={{ position: 'absolute' }}
              >
                <source src={scenes[currentScene].src} type="video/mp4" />
              </video>
            </>
          )}
          {/* Refined gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/35 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
        </motion.div>
      </AnimatePresence>

      {/* Content overlay - compact and premium */}
      <div className="relative z-10 h-full flex items-center">
        <div className="px-6 md:px-12 lg:px-16 max-w-xl">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5 }}
          >
            {/* Premium badge */}
            <span className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full border border-gold/30 bg-black/50 backdrop-blur-sm text-[9px] uppercase tracking-[0.2em] font-semibold text-gold/90">
              <T>Global Investment Hub</T>
            </span>

            <h2
              className="mt-3 text-2xl md:text-3xl lg:text-4xl font-bold text-white leading-tight"
              style={{ 
                fontFamily: "Poppins, sans-serif",
                textShadow: '0 2px 8px rgba(0,0,0,0.5)'
              }}
            >
              <T>Why Dubai Became the Capital of</T>{" "}
              <span className="text-gold"><T>Global Investors</T></span>
            </h2>

            <p className="mt-2.5 text-xs md:text-sm text-white/70 max-w-sm leading-relaxed">
              <T>Strategic location, world-class infrastructure, and long-term government execution make Dubai the most investable city in the region.</T>
            </p>

            {/* Premium Stats Cards - refined glass morphism */}
            <div className="mt-5 grid grid-cols-4 gap-1.5 max-w-sm">
              {stats.map((s, index) => (
                <motion.div
                  key={s.label}
                  initial={{ opacity: 0, y: 8 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.08 }}
                  className="group relative rounded-lg overflow-hidden"
                >
                  {/* Gradient border */}
                  <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-gold/30 via-gold/15 to-gold/30 p-[1px]">
                    <div className="h-full w-full rounded-lg bg-black/70 backdrop-blur-md" />
                  </div>
                  
                  {/* Content */}
                  <div className="relative px-2 py-2.5 text-center">
                    <div 
                      className="text-lg md:text-xl font-bold text-gold leading-none"
                      style={{ textShadow: '0 0 16px rgba(200,167,102,0.4)' }}
                    >
                      {s.value}
                    </div>
                    <div className="mt-0.5 text-[8px] md:text-[9px] uppercase tracking-wider text-white/60 font-medium">
                      <T>{s.label}</T>
                    </div>
                  </div>
                  
                  {/* Hover glow */}
                  <div 
                    className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                    style={{ boxShadow: '0 0 24px rgba(200,167,102,0.3)' }} 
                  />
                </motion.div>
              ))}
            </div>

            {/* CTA Button */}
            <div className="mt-5">
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
