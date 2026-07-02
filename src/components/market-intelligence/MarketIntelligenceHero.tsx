import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { ReactNode } from "react";

interface MarketIntelligenceHeroProps {
  badge: string;
  badgeIcon: LucideIcon;
  title: ReactNode;
  description: string;
  videoSrc?: string;
  videoPoster?: string;
  backgroundImage?: string;
  actions?: ReactNode;
}

const fadeInUp = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 }
  }
};

export const MarketIntelligenceHero = ({ 
  badge, 
  badgeIcon: BadgeIcon, 
  title, 
  description, 
  actions 
}: MarketIntelligenceHeroProps) => {
  const titleText = typeof title === "string" ? title : "Market Intelligence";
  const key = titleText.toLowerCase();
  const variant = key.includes("area")
    ? "areas"
    : key.includes("report")
      ? "reports"
      : key.includes("methodology") || key.includes("source")
        ? "methodology"
        : "overview";

  const heroSignals: Record<string, string[]> = {
    overview: ["REGULATED MARKET", "TRANSACTION CONTEXT", "RENT BENCHMARKS", "OWNERSHIP COSTS"],
    areas: ["LOCATION SIGNALS", "AREA ACTIVITY", "SUPPLY STATUS", "RENT INDEX"],
    reports: ["REPORT ARCHIVE", "MONTHLY REVIEW", "QUARTERLY SIGNALS", "OFFICIAL SOURCES"],
    methodology: ["SOURCE CONTROL", "DATA VALIDATION", "NO SPECULATION", "GOVERNMENT DATA"],
  };

  return (
    <section
      data-mi-hero
      data-mi-hero-variant={variant}
      data-hero-dark
      data-no-compare-frame
      data-no-section-frame
      data-surface="dark"
      className="mi-hero-scene relative flex w-full items-center overflow-hidden"
    >
      <div className="mi-hero-grid" aria-hidden="true" />
      <div className="mi-hero-orbit mi-hero-orbit-one" aria-hidden="true" />
      <div className="mi-hero-orbit mi-hero-orbit-two" aria-hidden="true" />
      <div className="mi-hero-data-stack" aria-hidden="true">
        {heroSignals[variant].map((signal) => (
          <span key={signal}>{signal}</span>
        ))}
      </div>

      <motion.div 
        className="relative z-10 w-full py-20 md:py-24"
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
      >
        <div className="mi-hero-copy mx-auto max-w-4xl px-4 text-center">
          {/* Badge - glass emerald/white, no gold border */}
          <motion.button 
            className="group inline-flex items-center gap-2 px-5 py-2.5 rounded-full mb-6 cursor-default"
            style={{
              background: 'rgba(255,255,255,0.10)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.38)',
              boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.1), inset 0 -1px 2px rgba(0,0,0,0.2), 0 4px 20px rgba(0,0,0,0.3)',
            }}
            variants={fadeInUp}
          >
            <BadgeIcon className="h-3.5 w-3.5 text-white" />
            <span
              className="text-white font-semibold text-[10px] md:text-xs uppercase tracking-[0.2em]"
              style={{ textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}
            >
              {badge}
            </span>
          </motion.button>
          
          {/* Title */}
          <motion.h1
            data-no-contrast-guard
            className="allow-white text-4xl md:text-5xl lg:text-6xl font-bold !text-white mb-6 leading-tight drop-shadow-[0_2px_12px_rgba(0,0,0,0.75)]"
            style={{ color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" }}
            variants={fadeInUp}
          >
            {title}
          </motion.h1>

          {/* Description */}
          <motion.p
            data-no-contrast-guard
            className="allow-white text-lg md:text-xl !text-white/95 font-light leading-relaxed max-w-3xl mx-auto mb-10 drop-shadow-[0_1px_6px_rgba(0,0,0,0.75)]"
            style={{ color: "rgba(255,255,255,0.96)", WebkitTextFillColor: "rgba(255,255,255,0.96)" }}
            variants={fadeInUp}
          >
            {description}
          </motion.p>
          
          {/* Actions - Hero CTA Buttons with consistent styling */}
          {actions && (
            <motion.div variants={fadeInUp} className="flex flex-wrap justify-center gap-4">
              {actions}
            </motion.div>
          )}
        </div>
      </motion.div>
    </section>
  );
};

export default MarketIntelligenceHero;
