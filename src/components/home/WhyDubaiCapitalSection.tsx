import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { ArrowRight, Globe, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

import burjAlArabVideo from "@/assets/videos/why-dubai-burj-al-arab.mp4";
import dubaiFrameVideo from "@/assets/videos/why-dubai-dubai-frame.mp4";
import burjKhalifaVideo from "@/assets/videos/why-dubai-burj-khalifa.mp4";
import atlantisPalmVideo from "@/assets/videos/why-dubai-atlantis-palm.mp4";

const scenes = [
  { src: burjAlArabVideo, label: "Burj Al Arab", subtitle: "Iconic Luxury" },
  { src: dubaiFrameVideo, label: "Dubai Frame", subtitle: "Gateway to the Future" },
  { src: burjKhalifaVideo, label: "Burj Khalifa", subtitle: "World's Tallest Tower" },
  { src: atlantisPalmVideo, label: "Atlantis / Palm", subtitle: "Island Paradise" },
];

const stats = [
  { value: "0%", label: "Income Tax" },
  { value: "10Y", label: "Golden Visa" },
  { value: "#1", label: "Safety Rank" },
  { value: "200+", label: "Nationalities" },
];

export default function WhyDubaiCapitalSection() {
  const [currentScene, setCurrentScene] = useState(0);

  // Auto-advance every 6 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentScene((prev) => (prev + 1) % scenes.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  const goToPrev = () => setCurrentScene((prev) => (prev - 1 + scenes.length) % scenes.length);
  const goToNext = () => setCurrentScene((prev) => (prev + 1) % scenes.length);

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
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/20" />
        </motion.div>
      </AnimatePresence>

      {/* Content overlay */}
      <div className="relative z-10 h-full min-h-[80vh] flex flex-col justify-center px-6 md:px-12 lg:px-20">
        <div className="max-w-4xl">
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
              className="mt-5 text-4xl md:text-5xl lg:text-6xl font-bold text-primary-foreground"
              style={{ fontFamily: "Poppins, sans-serif" }}
            >
              Why Dubai Became the Capital of{" "}
              <span className="text-gold">Global Investors</span>
            </h2>

            <p className="mt-4 text-lg md:text-xl text-muted-foreground max-w-2xl">
              Strategic location, world-class infrastructure, and long-term government execution make Dubai the most
              investable city in the region.
            </p>

            {/* Stats grid */}
            <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 max-w-2xl">
              {stats.map((s) => (
                <div
                  key={s.label}
                  className="rounded-xl border border-gold/25 bg-black/45 backdrop-blur-sm px-4 py-4 text-center"
                >
                  <div className="text-2xl md:text-3xl font-bold text-gold leading-none">{s.value}</div>
                  <div className="mt-1 text-[10px] md:text-xs uppercase tracking-wider text-muted-foreground">
                    {s.label}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8">
              <Button asChild variant="primary" size="lg">
                <Link to="/guides/investment">
                  Explore Investment Opportunities
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>

        {/* Scene indicator & navigation */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4">
          <button
            onClick={goToPrev}
            className="p-2 rounded-full border border-gold/40 bg-black/50 backdrop-blur-sm text-gold hover:bg-gold/20 transition-colors"
            aria-label="Previous scene"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            {scenes.map((scene, idx) => (
              <button
                key={scene.label}
                onClick={() => setCurrentScene(idx)}
                className={`flex flex-col items-center transition-all ${
                  idx === currentScene ? "opacity-100" : "opacity-50 hover:opacity-75"
                }`}
              >
                <div
                  className={`w-2 h-2 rounded-full transition-all ${
                    idx === currentScene ? "bg-gold scale-125" : "bg-white/50"
                  }`}
                />
                <span className="mt-1 text-[10px] text-white/70 hidden md:block">{scene.label}</span>
              </button>
            ))}
          </div>

          <button
            onClick={goToNext}
            className="p-2 rounded-full border border-gold/40 bg-black/50 backdrop-blur-sm text-gold hover:bg-gold/20 transition-colors"
            aria-label="Next scene"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Current scene label */}
        <div className="absolute top-8 right-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentScene}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="px-4 py-2 rounded-full border border-gold/30 bg-black/50 backdrop-blur-sm"
            >
              <span className="text-sm font-semibold text-gold">{scenes[currentScene].label}</span>
              <span className="ml-2 text-xs text-white/60">{scenes[currentScene].subtitle}</span>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
