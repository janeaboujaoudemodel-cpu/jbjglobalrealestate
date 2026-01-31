import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { T } from "@/components/ui/T";

import burjAlArabVideo from "@/assets/videos/why-dubai-burj-al-arab.mp4";
import dubaiFrameVideo from "@/assets/videos/why-dubai-dubai-frame.mp4";
import burjKhalifaVideo from "@/assets/videos/why-dubai-burj-khalifa.mp4";
import atlantisPalmVideo from "@/assets/videos/why-dubai-atlantis-palm.mp4";

const scenes = [
  { src: burjAlArabVideo },
  { src: dubaiFrameVideo },
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
      {/* Full-frame video background - edge to edge */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentScene}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.2 }}
          className="absolute inset-0"
        >
          <video
            className="absolute inset-0 w-full h-full object-cover"
            autoPlay
            loop
            muted
            playsInline
            preload="metadata"
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
              className="mt-4 text-2xl md:text-3xl lg:text-4xl font-bold text-primary-foreground leading-tight"
              style={{ fontFamily: "Poppins, sans-serif" }}
            >
              <T>Why Dubai Became the Capital of</T>{" "}
              <span className="text-gold"><T>Global Investors</T></span>
            </h2>

            <p className="mt-3 text-sm md:text-base text-white/75 max-w-md leading-relaxed">
              <T>Strategic location, world-class infrastructure, and long-term government execution make Dubai the most investable city in the region.</T>
            </p>

            {/* Stats grid - compact edge-to-edge design */}
            <div className="mt-5 grid grid-cols-4 gap-1.5 max-w-sm">
              {stats.map((s) => (
                <div
                  key={s.label}
                  className="rounded-md border border-gold/20 bg-black/40 backdrop-blur-sm px-2 py-2 text-center"
                >
                  <div className="text-lg md:text-xl font-bold text-gold leading-none">{s.value}</div>
                  <div className="mt-0.5 text-[8px] uppercase tracking-wider text-white/50">
                    <T>{s.label}</T>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5">
              <Button asChild variant="primary" size="default">
                <Link to="/guides/investment">
                  <T>Explore Investment Opportunities</T>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* NO DOTS - removed as per user request */}
    </section>
  );
}
