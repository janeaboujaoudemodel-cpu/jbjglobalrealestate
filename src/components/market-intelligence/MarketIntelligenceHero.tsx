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
    <section className="relative min-h-[55vh] flex items-center overflow-hidden">
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
        {/* Overlay gradients */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/60 to-black" />
      </div>
      
      {/* Decorative radial gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-gold/8 via-transparent to-transparent z-[1]" />
      
      {/* Decorative elements */}
      <div className="absolute top-20 left-1/4 w-96 h-96 bg-gold/5 rounded-full blur-3xl z-[1]" />
      <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-gold/3 rounded-full blur-3xl z-[1]" />
      
      <motion.div 
        className="container mx-auto px-4 relative z-10 py-24"
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
      >
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge - Mixed Color Label Style (same as Broker Hub) */}
          <motion.button 
            className="group inline-flex items-center gap-2 bg-gradient-to-r from-white via-[#FDFBF7] to-[#F5F0E6] border border-gold/40 rounded-full px-5 py-2.5 mb-6 shadow-sm transition-all hover:shadow-md cursor-default"
            variants={fadeInUp}
          >
            <BadgeIcon className="w-4 h-4 text-gold group-hover:text-black transition-colors" />
            <span className="text-gold group-hover:text-black transition-colors font-semibold">{badge}</span>
          </motion.button>
          
          {/* Title */}
          <motion.h1 
            className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight"
            style={{ fontFamily: "Poppins, sans-serif" }}
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

export default MarketIntelligenceHero;
