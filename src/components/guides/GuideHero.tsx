import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { ReactNode } from "react";

interface GuideHeroProps {
  badge: string;
  badgeIcon: LucideIcon;
  title: ReactNode;
  description: string;
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

export const GuideHero = ({ 
  badge, 
  badgeIcon: BadgeIcon, 
  title, 
  description, 
  backgroundImage,
  actions 
}: GuideHeroProps) => {
  return (
    <section className="relative py-24 md:py-32 lg:py-40 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-zinc-900 to-black" />
      {backgroundImage && (
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{ backgroundImage: `url(${backgroundImage})` }}
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-transparent" />
      
      {/* Decorative elements */}
      <div className="absolute top-20 left-1/4 w-96 h-96 bg-gold/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-gold/3 rounded-full blur-3xl" />
      
      <motion.div 
        className="container mx-auto px-4 relative z-10"
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
      >
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge - Mixed Color Label Style */}
          <motion.button 
            className="group inline-flex items-center gap-2 bg-gradient-to-r from-white via-[#FDFBF7] to-[#F5F0E6] border border-gold/40 rounded-full px-5 py-2.5 mb-6 shadow-sm transition-all hover:shadow-md cursor-default"
            variants={fadeInUp}
          >
            <BadgeIcon className="w-4 h-4 text-gold group-hover:text-black transition-colors" />
            <span className="text-gold group-hover:text-black transition-colors font-semibold uppercase tracking-wide text-sm">{badge}</span>
          </motion.button>
          
          {/* Title */}
          <motion.h1 
            className="text-4xl md:text-5xl lg:text-6xl font-light text-white mb-6 leading-tight"
            variants={fadeInUp}
          >
            {title}
          </motion.h1>
          
          {/* Description */}
          <motion.p 
            className="text-lg md:text-xl text-zinc-300 font-light leading-relaxed max-w-3xl mx-auto mb-10"
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

export default GuideHero;
