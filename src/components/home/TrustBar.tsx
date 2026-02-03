/**
 * TrustBar Component - Master Blueprint Specification
 * Premium trust indicators bar with glass-morphism design
 */

import { motion } from "framer-motion";
import { Shield, MessageCircle, CheckCircle, Award } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface TrustItem {
  icon: React.ElementType;
  text: string;
  subtext?: string;
  highlight?: boolean;
}

const TrustBar = () => {
  const { t } = useLanguage();

  const trustItems: TrustItem[] = [
    {
      icon: Shield,
      text: t('trust.reraRegistered', 'RERA Licensed'),
      subtext: 'DLD Registered',
      highlight: true,
    },
    {
      icon: MessageCircle,
      text: t('trust.fastResponse', 'Instant Response'),
      subtext: 'WhatsApp Priority',
    },
    {
      icon: CheckCircle,
      text: t('trust.verifiedListings', 'Verified Listings'),
      subtext: 'Quality Assured',
    },
    {
      icon: Award,
      text: 'Award Winning',
      subtext: 'Excellence in Service',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.6 }}
      className="flex flex-wrap items-center justify-center gap-3 md:gap-6 py-4 px-4"
    >
      {trustItems.map((item, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6 + index * 0.1, duration: 0.4 }}
          className="group relative"
        >
          {/* Premium glass card */}
          <div 
            className={`flex items-center gap-3 px-4 py-2.5 rounded-xl backdrop-blur-md transition-all duration-300 ${
              item.highlight 
                ? 'bg-gradient-to-r from-gold/20 via-gold/10 to-gold/20 border border-gold/50 shadow-[0_0_15px_rgba(200,167,102,0.3)]' 
                : 'bg-white/5 border border-white/20 hover:border-gold/40 hover:bg-gold/5'
            }`}
          >
            {/* Icon with glow */}
            <div 
              className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-300 ${
                item.highlight 
                  ? 'bg-gradient-to-br from-gold/30 to-gold/10 shadow-[0_0_12px_rgba(200,167,102,0.4)]' 
                  : 'bg-white/10 group-hover:bg-gold/20'
              }`}
            >
              <item.icon 
                className={`w-5 h-5 ${item.highlight ? 'text-gold' : 'text-white/80 group-hover:text-gold'} transition-colors`} 
              />
            </div>
            
            {/* Text content */}
            <div className="flex flex-col">
              <span 
                className={`text-xs md:text-sm font-bold tracking-wide ${
                  item.highlight ? 'text-gold' : 'text-white/90 group-hover:text-gold'
                } transition-colors`}
              >
                {item.text}
              </span>
              {item.subtext && (
                <span className="text-[10px] md:text-xs text-white/50 font-medium">
                  {item.subtext}
                </span>
              )}
            </div>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
};

export default TrustBar;
