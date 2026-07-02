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

/**
 * Premium full-viewport guide hero.
 * - 100dvh (true full screen, mobile-safe)
 * - Strong dark scrim → headline always readable on photo
 * - Unified white headline with white/emerald accent
 * - Two CTAs via locked primitives (.jj-cta-champagne / .jj-cta-outline)
 */
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
      data-hero-dark
      className="jj-hero-fullscreen jj-hero-compact relative flex items-center overflow-hidden"
      style={{ minHeight: "100dvh" }}
    >
      {/* Media background */}
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
        ) : (
          <div className="w-full h-full bg-gradient-to-b from-zinc-900 to-black" />
        )}
        {/* Two-layer scrim — readable headline guarantee */}
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.55)_0%,rgba(0,0,0,0.45)_45%,rgba(0,0,0,0.78)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0)_0%,rgba(0,0,0,0.35)_75%)]" />
      </div>

      <motion.div
        className="relative z-10 w-full py-24"
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
      >
        <div className="max-w-4xl mx-auto text-center px-4">
          {/* Badge */}
          <motion.div
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full mb-8"
            style={{
              background: "rgba(255,255,255,0.10)",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(255,255,255,0.38)",
            }}
            variants={fadeInUp}
          >
            <BadgeIcon className="w-3.5 h-3.5 text-white" />
            <span className="text-white font-semibold text-[10px] md:text-xs uppercase tracking-[0.22em]">
              {badge}
            </span>
          </motion.div>

          {/* Title — unified white, gold underline accent */}
          <motion.h1
            className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight"
            style={{ textShadow: "0 2px 24px rgba(0,0,0,0.55)" }}
            variants={fadeInUp}
          >
            {title}
          </motion.h1>

          {/* White hairline accent */}
          <motion.div
            variants={fadeInUp}
            className="mx-auto mb-6 h-px w-24"
            style={{
              background:
                "linear-gradient(90deg, transparent, rgba(255,255,255,0.82), transparent)",
            }}
          />

          {/* Description */}
          <motion.p
            className="text-lg md:text-xl text-white/90 font-light leading-relaxed max-w-3xl mx-auto mb-10"
            style={{ textShadow: "0 1px 12px rgba(0,0,0,0.5)" }}
            variants={fadeInUp}
          >
            {description}
          </motion.p>

          {/* Actions */}
          {actions && (
            <motion.div
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
