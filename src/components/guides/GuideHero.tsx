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
      data-hero-dark
      data-surface="emerald"
      className="jj-hero-fullscreen jj-hero-compact relative flex items-center justify-center overflow-hidden w-screen left-1/2 -translate-x-1/2"
    >
      {/* Premium emerald base — no line/grid/stripe overlays. */}
      <div
        className="absolute inset-0"
        aria-hidden="true"
        style={{ background: "linear-gradient(135deg,#064E3B 0%,#042c1c 55%,#000000 100%)" }}
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-45"
        aria-hidden
        style={{ background: "radial-gradient(ellipse at 22% 22%, rgba(110,231,183,0.18), transparent 55%), radial-gradient(ellipse at 82% 78%, rgba(184,149,85,0.16), transparent 60%)" }}
      />

      <motion.div
        className="relative z-10 w-full"
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
      >
        <div className="max-w-4xl mx-auto text-center px-4">
          <motion.div
            className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 mb-6 shadow-sm"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(184,149,85,0.45)" }}
            variants={fadeInUp}
          >
            <BadgeIcon className="w-4 h-4" style={{ color: "#E8CF8A" }} />
            <span className="text-sm font-semibold tracking-wide uppercase" style={{ color: "#E8CF8A" }}>
              {badge}
            </span>
          </motion.div>

          <motion.h1
            data-no-contrast-guard
            className="text-4xl md:text-5xl lg:text-6xl font-light mb-6 leading-tight text-center [&_*]:!text-white"
            style={{ color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF", fontFamily: '"Cormorant Garamond", "Playfair Display", Georgia, serif' }}
            variants={fadeInUp}
          >
            {title}
          </motion.h1>
          <motion.p
            data-no-contrast-guard
            className="text-lg md:text-xl font-light leading-relaxed max-w-3xl mx-auto mb-10 text-center"
            style={{ color: "#E8CF8A", WebkitTextFillColor: "#E8CF8A", fontFamily: '"Cormorant Garamond", "Playfair Display", Georgia, serif' }}
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
