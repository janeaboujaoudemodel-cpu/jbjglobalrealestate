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
    <section className="jj-hero-fullscreen relative flex items-center overflow-hidden">
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

      {/* Decorative gold ambience — sits BEHIND the darkening overlays so it never lifts contrast under the headline */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-gold/8 via-transparent to-transparent z-[1] pointer-events-none" />
      <div className="absolute top-20 left-1/4 w-96 h-96 bg-[#EFE6D6]/5 rounded-full blur-3xl z-[1] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-[#EFE6D6]/3 rounded-full blur-3xl z-[1] pointer-events-none" />

      {/* Legibility overlays — composite stack guarantees AA contrast over any frame */}
      {/* 1. Base vertical anchor: heavier top + bottom, breathable middle so imagery still reads */}
      <div className="absolute inset-0 z-[2] bg-gradient-to-b from-black/85 via-black/70 to-black/95 pointer-events-none" />
      {/* 2. Centered spotlight darkener focused on the text column */}
      <div
        className="absolute inset-0 z-[2] pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 60% 55% at 50% 50%, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0) 75%)',
        }}
      />
      {/* 3. Bottom fade-to-page so the hero blends into the next section */}
      <div className="absolute inset-x-0 bottom-0 h-1/4 z-[2] bg-gradient-to-b from-transparent to-background pointer-events-none" />

      <motion.div 
        className="relative z-10 w-full py-24"
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
            <span className="w-2 h-2 bg-[#EFE6D6] rounded-full animate-pulse" />
            <span
              className="text-[#1A1A1A] font-semibold text-[10px] md:text-xs uppercase tracking-[0.2em]"
              style={{ textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}
            >
              {badge}
            </span>
          </motion.button>
          
          {/* Title */}
          <motion.h1 
            className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.45)]"
            variants={fadeInUp}
          >
            {title}
          </motion.h1>
          
          {/* Description */}
          <motion.p 
            className="text-lg md:text-xl text-white/95 font-light leading-relaxed max-w-3xl mx-auto mb-10 drop-shadow-[0_1px_4px_rgba(0,0,0,0.5)]"
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
