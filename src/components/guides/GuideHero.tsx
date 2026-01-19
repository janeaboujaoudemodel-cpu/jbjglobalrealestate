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
            <span className="w-2 h-2 bg-gold rounded-full animate-pulse" />
            <span className="text-gold font-semibold text-[10px] md:text-xs uppercase tracking-[0.2em]">{badge}</span>
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
          
          {/* Actions - Hero CTA Buttons use transparent bg, white 3D border, white title, gold icon; filled on hover */}
          {actions && (
            <motion.div variants={fadeInUp} className="flex flex-wrap justify-center gap-4 [&_button]:bg-transparent [&_button]:border-2 [&_button]:border-white/80 [&_button]:text-white [&_button:hover]:bg-gradient-to-r [&_button:hover]:from-white [&_button:hover]:via-[#FDFBF7] [&_button:hover]:to-[#F5F0E6] [&_button:hover]:text-black [&_button:hover]:border-gold [&_button_svg]:text-gold">
              {actions}
            </motion.div>
          )}
        </div>
      </motion.div>
    </section>
  );
};

export default GuideHero;
