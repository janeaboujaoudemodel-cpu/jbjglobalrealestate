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
      className="jj-hero-fullscreen jj-hero-compact relative flex items-center overflow-hidden"
    >
      <div className="absolute inset-0 bg-[image:var(--jj-emerald-ombre)]" aria-hidden="true" />
      <div className="absolute inset-0 z-0">
        {videoSrc ? (
          <video
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover opacity-30"
            poster={videoPoster}
          >
            <source src={videoSrc} type="video/mp4" />
          </video>
        ) : backgroundImage ? (
          <div
            className="w-full h-full bg-cover bg-center opacity-30"
            style={{ backgroundImage: `url(${backgroundImage})` }}
          />
        ) : (
          null
        )}
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" aria-hidden="true" />

      <motion.div
        className="relative z-10 w-full py-20 md:py-24"
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
      >
        <div className="max-w-4xl mx-auto text-center px-4 lg:max-w-[min(56rem,calc(100vw-25rem))] lg:ml-auto lg:mr-[22rem]">
          <motion.div
            className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 mb-6 shadow-lg bg-white/10 border border-white/35"
            variants={fadeInUp}
          >
            <BadgeIcon className="w-4 h-4 text-white" />
            <span className="text-white text-sm font-semibold tracking-wide uppercase">
              {badge}
            </span>
          </motion.div>

          <motion.h1
            data-no-contrast-guard
            className="allow-white text-4xl md:text-5xl lg:text-6xl font-light mb-6 leading-tight"
            style={{ color: "#F6FBF8", WebkitTextFillColor: "#F6FBF8" }}
            variants={fadeInUp}
          >
            {title}
          </motion.h1>
          <motion.p
            data-no-contrast-guard
            className="allow-white text-lg md:text-xl font-light leading-relaxed max-w-3xl mx-auto mb-10"
            style={{ color: "rgba(246,251,248,0.85)", WebkitTextFillColor: "rgba(246,251,248,0.85)" }}
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
