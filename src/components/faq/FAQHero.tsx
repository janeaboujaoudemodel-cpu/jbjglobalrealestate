import { motion } from "framer-motion";
import { ReactNode } from "react";
import { LucideIcon } from "lucide-react";

interface FAQHeroProps {
  badge: string;
  badgeIcon: LucideIcon;
  title: ReactNode;
  description: string;
  videoUrl?: string;
  backgroundImage?: string;
  actions?: ReactNode;
}

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

export const FAQHero = ({ 
  badge, 
  badgeIcon: BadgeIcon, 
  title, 
  description, 
  videoUrl,
  backgroundImage,
  actions 
}: FAQHeroProps) => {
  return (
    <section data-hero-dark data-faq-hero data-premium-emerald-hero data-surface="emerald" className="jj-hero-fullscreen jj-mi-prada-hero relative flex min-h-[100svh] w-full items-center justify-center overflow-hidden">

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
          {/* Badge */}
          <motion.div 
             data-no-contrast-guard
             className="inline-flex items-center gap-2 border border-white/20 bg-white/5 px-4 py-2 mb-6 backdrop-blur-sm"
            variants={fadeInUp}
          >
            <BadgeIcon className="w-4 h-4 text-white" />
            <span className="text-white text-sm font-semibold tracking-wide uppercase">{badge}</span>
          </motion.div>
          
          {/* Title */}
          <motion.h1 
            className="jj-mi-hero-title mx-auto max-w-[16ch] text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-light leading-[1.02] allow-white text-center"
            style={{ color: "#F6FBF8", fontFamily: '"Cormorant Garamond", "Playfair Display", Georgia, serif' }}
            data-no-contrast-guard
            variants={fadeInUp}
          >
            {title}
          </motion.h1>
          
          {/* Description */}
          <div aria-hidden className="jj-mi-title-rule my-8 h-px w-24" />
          <motion.p 
            className="jj-mi-hero-copy mx-auto max-w-[42rem] text-lg md:text-xl lg:text-2xl font-light leading-relaxed allow-white"
            style={{ color: "#E8CF8A", fontFamily: '"Cormorant Garamond", "Playfair Display", Georgia, serif' }}
            data-no-contrast-guard
            variants={fadeInUp}
          >
            {description}
          </motion.p>
          
          {/* Actions */}
          {actions && (
            <motion.div variants={fadeInUp} className="mt-12 flex w-full flex-col items-center justify-center gap-4 sm:w-auto sm:flex-row sm:flex-nowrap">
              {actions}
            </motion.div>
          )}
        </div>
      </motion.div>
    </section>
  );
};

export default FAQHero;
