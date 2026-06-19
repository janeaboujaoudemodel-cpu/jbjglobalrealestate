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
  videoSrc,
  videoPoster,
  backgroundImage,
  actions 
}: MarketIntelligenceHeroProps) => {
  return (
    <section data-hero-dark data-surface="dark" className="relative flex min-h-[460px] items-center overflow-hidden bg-[#0A0A0A] md:min-h-[540px]">

      {/* Video or Image Background */}
      <div className="absolute inset-0 z-0">
        {videoSrc ? (
          <video 
            autoPlay 
            loop 
            muted 
            playsInline
            className="w-full h-full object-cover"
            poster={videoPoster}
          >
            <source src={videoSrc} type="video/mp4" />
          </video>
        ) : backgroundImage ? (
          <div 
            className="w-full h-full bg-cover bg-center"
            style={{ backgroundImage: `url(${backgroundImage})` }}
          />
        ) : null}
      </div>

      {/* Legibility overlay — dark enough for white copy, without the washed/faded hero look */}
      <div className="absolute inset-0 z-[2] bg-[linear-gradient(180deg,rgba(0,0,0,0.66)_0%,rgba(0,0,0,0.58)_48%,rgba(0,0,0,0.72)_100%)] pointer-events-none" />

      <motion.div 
        className="relative z-10 w-full py-20 md:py-24"
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
      >
        <div className="max-w-4xl mx-auto text-center px-4">
          {/* Badge - Glass style with gold border, engraved look (matching Services page) */}
          <motion.button 
            className="group inline-flex items-center gap-2 px-5 py-2.5 rounded-full mb-6 cursor-default"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 50%, rgba(200,167,102,0.08) 100%)',
              backdropFilter: 'blur(20px)',
              border: '1.5px solid rgba(200,167,102,0.6)',
              boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.1), inset 0 -1px 2px rgba(0,0,0,0.2), 0 4px 20px rgba(0,0,0,0.3)',
            }}
            variants={fadeInUp}
          >
            <span
              className="text-[#B89555] font-semibold text-[10px] md:text-xs uppercase tracking-[0.2em]"
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
