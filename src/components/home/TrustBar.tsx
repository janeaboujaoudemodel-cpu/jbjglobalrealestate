/**
 * TrustBar Component - Premium Trust Indicators
 * Champagne-gold 3D cards with luxury styling
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
      className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-5 lg:gap-6 max-w-[1100px] mx-auto py-6 md:py-8 px-4 md:px-6"
    >
      {trustItems.map((item, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6 + index * 0.1, duration: 0.4 }}
          className="group relative"
        >
          {/* Premium 3D champagne-gold card */}
          <div 
            className={`flex items-center gap-3 px-5 py-3 rounded-xl transition-all duration-300 cursor-default ${
              item.highlight 
                ? 'bg-gradient-to-br from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] border-2 border-gold/60' 
                : 'bg-gradient-to-br from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] border-2 border-gold/40 hover:border-gold/70'
            }`}
            style={{
              boxShadow: item.highlight
                ? `
                    0 10px 30px rgba(200,167,102,0.4),
                    0 6px 15px rgba(0,0,0,0.2),
                    inset 0 2px 4px rgba(255,255,255,0.9),
                    inset 0 -2px 4px rgba(200,167,102,0.2),
                    0 0 20px rgba(200,167,102,0.35)
                  `
                : `
                    0 8px 24px rgba(200,167,102,0.35),
                    0 4px 12px rgba(0,0,0,0.15),
                    inset 0 2px 4px rgba(255,255,255,0.85),
                    inset 0 -2px 4px rgba(200,167,102,0.15)
                  `,
            }}
          >
            {/* Icon with premium styling */}
            <div 
              className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-300 ${
                item.highlight 
                  ? 'bg-black shadow-lg' 
                  : 'bg-black/90 group-hover:bg-black shadow-md'
              }`}
            >
              <item.icon 
                className="w-5 h-5 text-gold transition-colors duration-300" 
              />
            </div>
            
            {/* Text content */}
            <div className="flex flex-col">
              <span 
                className={`text-sm md:text-[15px] font-bold tracking-wide leading-tight text-black transition-colors duration-300`}
              >
                {item.text}
              </span>
              {item.subtext && (
                <span className="text-[11px] md:text-xs text-zinc-600 font-medium tracking-wide transition-colors duration-300">
                  {item.subtext}
                </span>
              )}
            </div>
          </div>
          
          {/* Enhanced glow for highlighted item */}
          {item.highlight && (
            <div 
              className="absolute -inset-1 bg-gradient-to-r from-gold/20 via-gold/10 to-gold/20 rounded-xl blur-xl opacity-70 group-hover:opacity-90 transition-opacity duration-300 -z-10" 
            />
          )}
        </motion.div>
      ))}
    </motion.div>
  );
};

export default TrustBar;
