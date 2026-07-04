import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { ReactNode } from "react";

interface GuideHeroProps {
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
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

export const GuideHero = ({
  badge,
  badgeIcon: BadgeIcon,
  title,
  description,
  videoSrc,
  videoPoster,
  backgroundImage,
  actions,
}: GuideHeroProps) => {
  return (
    <section
      data-guide-hero
      data-unified-hero
      data-faq-hero
      data-surface="champagne"
      className="jj-hero-fullscreen jj-hero-compact relative flex items-center overflow-hidden w-screen left-1/2 -translate-x-1/2"
    >
      {/* Champagne cream base — light hero with black text */}
      <div
        className="absolute inset-0"
        aria-hidden="true"
        style={{ background: "linear-gradient(135deg, #FDFBF7 0%, #F7F2EA 55%, #EFE6D6 100%)" }}
      />
      <div className="absolute inset-0 z-0">
        {videoSrc ? (
          <video
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover opacity-25 mix-blend-multiply"
            poster={videoPoster}
          >
            <source src={videoSrc} type="video/mp4" />
          </video>
        ) : backgroundImage ? (
          <div
            className="w-full h-full bg-cover bg-center opacity-20 mix-blend-multiply"
            style={{ backgroundImage: `url(${backgroundImage})` }}
          />
        ) : null}
      </div>
      {/* Soft champagne wash to keep text on black readable */}
      <div
        className="absolute inset-0"
        aria-hidden="true"
        style={{ background: "linear-gradient(180deg, rgba(253,251,247,0.55) 0%, rgba(239,230,214,0.65) 100%)" }}
      />

      <motion.div
        className="relative z-10 w-full py-20 md:py-24"
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
      >
        <div className="max-w-4xl mx-auto text-center px-4">
          <motion.div
            className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 mb-6 shadow-sm"
            style={{ background: "rgba(0,0,0,0.04)", border: "1px solid rgba(26,26,26,0.18)" }}
            variants={fadeInUp}
          >
            <BadgeIcon className="w-4 h-4" style={{ color: "#1A1A1A" }} />
            <span className="text-sm font-semibold tracking-wide uppercase" style={{ color: "#1A1A1A" }}>
              {badge}
            </span>
          </motion.div>

          <motion.h1
            data-no-contrast-guard
            className="text-4xl md:text-5xl lg:text-6xl font-light mb-6 leading-tight [&_*]:!text-[#1A1A1A]"
            style={{ color: "#1A1A1A", WebkitTextFillColor: "#1A1A1A" }}
            variants={fadeInUp}
          >
            {title}
          </motion.h1>
          <motion.p
            data-no-contrast-guard
            className="text-lg md:text-xl font-light leading-relaxed max-w-3xl mx-auto mb-10"
            style={{ color: "#1A1A1A", WebkitTextFillColor: "#1A1A1A" }}
            variants={fadeInUp}
          >
            {description}
          </motion.p>

          {actions && (
            <motion.div
              data-guide-hero-actions
              variants={fadeInUp}
              className="flex flex-wrap justify-center gap-4"
            >
              {actions}
            </motion.div>
          )}
        </div>
      </motion.div>
    </section>
  );
};

export default GuideHero;
