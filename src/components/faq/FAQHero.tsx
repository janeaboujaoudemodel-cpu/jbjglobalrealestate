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
    <section data-hero-dark data-faq-hero className="jj-hero-fullscreen jj-hero-compact relative flex items-center overflow-hidden">

      {/* Video Background */}
      {videoUrl && (
        <div className="absolute inset-0 overflow-hidden">
          <video
            autoPlay
            muted
            loop
            playsInline
            className="absolute w-full h-full object-cover"
          >
            <source src={videoUrl} type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-[#1A1A1A]/70" />
        </div>
      )}
      
      {/* Image Background Fallback */}
      {!videoUrl && (
        <>
          <div className="absolute inset-0 bg-[image:var(--jj-emerald-ombre)]" />
          {backgroundImage && (
            <div 
              className="absolute inset-0 bg-cover bg-center opacity-30"
              style={{ backgroundImage: `url(${backgroundImage})` }}
            />
          )}
        </>
      )}
      
      {/* Overlay gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
      
      <motion.div 
        className="container mx-auto px-4 relative z-10"
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
      >
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <motion.div 
            className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 mb-6 shadow-lg bg-white/10 border border-white/35"
            variants={fadeInUp}
          >
            <BadgeIcon className="w-4 h-4 text-white" />
            <span className="text-white text-sm font-semibold tracking-wide uppercase">{badge}</span>
          </motion.div>
          
          {/* Title */}
          <motion.h1 
            className="text-4xl md:text-5xl lg:text-6xl font-light mb-6 leading-tight allow-white"
            style={{ color: "#F6FBF8" }}
            data-no-contrast-guard
            variants={fadeInUp}
          >
            {title}
          </motion.h1>
          
          {/* Description */}
          <motion.p 
            className="text-lg md:text-xl font-light leading-relaxed max-w-3xl mx-auto mb-10 allow-white"
            style={{ color: "rgba(246,251,248,0.85)" }}
            data-no-contrast-guard
            variants={fadeInUp}
          >
            {description}
          </motion.p>
          
          {/* Actions */}
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

export default FAQHero;
