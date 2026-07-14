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
      data-premium-emerald-hero
      className="jj-hero-fullscreen jj-mi-prada-hero relative flex min-h-[100svh] w-full items-center justify-center overflow-hidden"
    >
      <div aria-hidden className="jj-mi-marble-depth pointer-events-none absolute inset-0" />
      <div aria-hidden className="jj-mi-gold-hairline pointer-events-none absolute inset-x-0 bottom-0 h-px" />
      <div aria-hidden className="jj-mi-marble-grain pointer-events-none absolute inset-0 mix-blend-overlay" />

      <motion.div
        className="relative z-10 mx-auto flex w-full max-w-[64rem] flex-col items-center justify-center px-6 text-center"
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
      >
        <div className="mx-auto flex w-full flex-col items-center justify-center text-center">
          <motion.div
            data-no-contrast-guard
            className="inline-flex items-center gap-2 border border-white/20 bg-white/5 px-4 py-2 mb-6 backdrop-blur-sm"
            variants={fadeInUp}
          >
            <BadgeIcon className="w-4 h-4" style={{ color: "#E8CF8A" }} />
            <span className="text-sm font-semibold tracking-wide uppercase" style={{ color: "#E8CF8A" }}>
              {badge}
            </span>
          </motion.div>

          <motion.h1
            data-no-contrast-guard
            className="jj-mi-hero-title mx-auto max-w-[16ch] text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-light leading-[1.02] text-center [&_*]:!text-white"
            style={{ color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF", fontFamily: '"Cormorant Garamond", "Playfair Display", Georgia, serif' }}
            variants={fadeInUp}
          >
            {title}
          </motion.h1>
          <div aria-hidden className="jj-mi-title-rule my-8 h-px w-24" />
          <motion.p
            data-no-contrast-guard
            className="jj-mi-hero-copy mx-auto max-w-[42rem] text-lg md:text-xl lg:text-2xl font-light leading-relaxed text-center"
            style={{ color: "#E8CF8A", WebkitTextFillColor: "#E8CF8A", fontFamily: '"Cormorant Garamond", "Playfair Display", Georgia, serif' }}
            variants={fadeInUp}
          >
            {description}
          </motion.p>

          {actions && (
            <motion.div
              data-guide-hero-actions
              variants={fadeInUp}
              className="mt-12 flex w-full flex-col items-center justify-center gap-4 sm:w-auto sm:flex-row sm:flex-nowrap"
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
