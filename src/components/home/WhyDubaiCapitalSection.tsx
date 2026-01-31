import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { ArrowRight, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";

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
    <section className="relative min-h-[80vh] bg-black overflow-hidden">
      {/* Full-frame video background */}
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
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent" />
        </motion.div>
      </AnimatePresence>

      {/* Content overlay */}
      <div className="relative z-10 h-full min-h-[80vh] flex items-center">
        <div className="px-6 md:px-12 lg:px-20 max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-gold/40 bg-black/50 backdrop-blur-sm text-xs uppercase tracking-[0.2em] font-semibold text-gold">
              <Globe className="w-4 h-4" />
              Global Investment Hub
            </span>

            <h2
              className="mt-5 text-3xl md:text-4xl lg:text-5xl font-bold text-primary-foreground leading-tight"
              style={{ fontFamily: "Poppins, sans-serif" }}
            >
              Why Dubai Became the Capital of{" "}
              <span className="text-gold">Global Investors</span>
            </h2>

            <p className="mt-4 text-base md:text-lg text-white/80 max-w-xl">
              Strategic location, world-class infrastructure, and long-term government execution make Dubai the most investable city in the region.
            </p>

            {/* Stats grid */}
            <div className="mt-6 grid grid-cols-4 gap-2 md:gap-3 max-w-lg">
              {stats.map((s) => (
                <div
                  key={s.label}
                  className="rounded-lg border border-gold/25 bg-black/50 backdrop-blur-sm px-2 py-3 text-center"
                >
                  <div className="text-xl md:text-2xl font-bold text-gold leading-none">{s.value}</div>
                  <div className="mt-1 text-[9px] md:text-[10px] uppercase tracking-wider text-white/60">
                    {s.label}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6">
              <Button asChild variant="primary" size="lg">
                <Link to="/guides/investment">
                  Explore Investment Opportunities
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Simple circle indicators only */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2">
        {scenes.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentScene(idx)}
            className={`w-2 h-2 rounded-full transition-all ${
              idx === currentScene ? "bg-gold" : "bg-white/40 hover:bg-white/60"
            }`}
            aria-label={`Scene ${idx + 1}`}
          />
        ))}
      </div>
    </section>
  );
}
