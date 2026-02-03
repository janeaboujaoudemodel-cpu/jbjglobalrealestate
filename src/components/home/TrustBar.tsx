/**
 * TrustBar Component - Premium Trust Indicators
 * Enhanced glass-morphism design with luxury refinements
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
      className="flex flex-wrap items-center justify-center gap-4 md:gap-6 lg:gap-8 py-5 px-4"
    >
      {trustItems.map((item, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6 + index * 0.1, duration: 0.4 }}
          className="group relative"
        >
          {/* Premium glass card with enhanced styling */}
          <div 
            className={`flex items-center gap-3 px-5 py-3 rounded-xl backdrop-blur-lg transition-all duration-300 cursor-default ${
              item.highlight 
                ? 'bg-gradient-to-r from-gold/25 via-gold/15 to-gold/25 border border-gold/60 shadow-[0_0_20px_rgba(200,167,102,0.35)] hover:shadow-[0_0_30px_rgba(200,167,102,0.5)]' 
                : 'bg-white/8 border border-white/25 hover:border-gold/50 hover:bg-gold/10 hover:shadow-[0_0_15px_rgba(200,167,102,0.2)]'
            }`}
          >
            {/* Icon with premium glow effect */}
            <div 
              className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-300 ${
                item.highlight 
                  ? 'bg-gradient-to-br from-gold/40 to-gold/15 shadow-[0_0_16px_rgba(200,167,102,0.5)]' 
                  : 'bg-white/12 group-hover:bg-gold/25 group-hover:shadow-[0_0_12px_rgba(200,167,102,0.3)]'
              }`}
            >
              <item.icon 
                className={`w-5 h-5 ${
                  item.highlight 
                    ? 'text-gold drop-shadow-[0_0_8px_rgba(200,167,102,0.8)]' 
                    : 'text-white/85 group-hover:text-gold'
                } transition-colors duration-300`} 
              />
            </div>
            
            {/* Text content with enhanced typography */}
            <div className="flex flex-col">
              <span 
                className={`text-sm md:text-[15px] font-bold tracking-wide leading-tight ${
                  item.highlight 
                    ? 'text-gold drop-shadow-[0_0_10px_rgba(200,167,102,0.6)]' 
                    : 'text-white/95 group-hover:text-gold'
                } transition-colors duration-300`}
              >
                {item.text}
              </span>
              {item.subtext && (
                <span className="text-[11px] md:text-xs text-white/55 font-medium tracking-wide group-hover:text-white/70 transition-colors duration-300">
                  {item.subtext}
                </span>
              )}
            </div>
          </div>
          
          {/* Subtle floating animation for highlighted item */}
          {item.highlight && (
            <div className="absolute -inset-1 bg-gradient-to-r from-gold/10 via-gold/5 to-gold/10 rounded-xl blur-xl opacity-60 group-hover:opacity-80 transition-opacity duration-300 -z-10" />
          )}
        </motion.div>
      ))}
    </motion.div>
  );
};

export default TrustBar;
