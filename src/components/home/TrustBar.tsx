/**
 * TrustBar Component - Master Blueprint Specification
 * Displays license, response time, and verified listings trust indicators
 */

import { motion } from "framer-motion";
import { Shield, MessageCircle, CheckCircle } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface TrustItem {
  icon: React.ElementType;
  text: string;
  highlight?: boolean;
}

const TrustBar = () => {
  const { t } = useLanguage();

  const trustItems: TrustItem[] = [
    {
      icon: Shield,
      text: t('trust.reraRegistered', 'RERA-Registered Brokerage'),
      highlight: true,
    },
    {
      icon: MessageCircle,
      text: t('trust.fastResponse', 'Fast Response via WhatsApp'),
    },
    {
      icon: CheckCircle,
      text: t('trust.verifiedListings', 'Verified Listings & Clear Guidance'),
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.6 }}
      className="flex flex-wrap items-center justify-center gap-4 md:gap-8 py-4 px-4"
    >
      {trustItems.map((item, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6 + index * 0.1, duration: 0.4 }}
          className="flex items-center gap-2 text-white/90"
        >
          <div 
            className={`w-8 h-8 rounded-full flex items-center justify-center ${
              item.highlight 
                ? 'bg-gold/20 border border-gold/40' 
                : 'bg-white/10 border border-white/20'
            }`}
          >
            <item.icon 
              className={`w-4 h-4 ${item.highlight ? 'text-gold' : 'text-white/80'}`} 
            />
          </div>
          <span 
            className={`text-xs md:text-sm font-medium ${
              item.highlight ? 'text-gold' : 'text-white/80'
            }`}
          >
            {item.text}
          </span>
        </motion.div>
      ))}
    </motion.div>
  );
};

export default TrustBar;
