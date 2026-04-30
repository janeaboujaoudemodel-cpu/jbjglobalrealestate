/**
 * TrustBar Component - Premium Trust Indicators
 * Clean monochrome cards in 4x2 grid
 */

import { motion } from "framer-motion";
import { Shield, MessageCircle, CheckCircle, Award, Star, Clock, BadgeCheck, HeartHandshake } from "lucide-react";
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
      subtext: t('trust.dldRegistered', 'DLD Registered'),
      highlight: true,
    },
    {
      icon: MessageCircle,
      text: t('trust.fastResponse', 'Instant Response'),
      subtext: t('trust.whatsappPriority', 'WhatsApp Priority'),
    },
    {
      icon: CheckCircle,
      text: t('trust.verifiedListings', 'Verified Listings'),
      subtext: t('trust.qualityAssured', 'Quality Assured'),
    },
    {
      icon: Award,
      text: t('trust.awardWinning', 'Award Winning'),
      subtext: t('trust.excellenceInService', 'Excellence in Service'),
    },
    {
      icon: HeartHandshake,
      text: 'Trusted by Thousands',
      subtext: 'Clients Worldwide',
    },
    {
      icon: Star,
      text: 'Excellence Guaranteed',
      subtext: 'Premium Standards',
    },
    {
      icon: Clock,
      text: '24/7 Support',
      subtext: 'Always Available',
    },
    {
      icon: BadgeCheck,
      text: 'Certified Experts',
      subtext: 'Licensed Professionals',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1, duration: 0.3 }}
      className="grid grid-cols-2 md:grid-cols-4 auto-rows-fr gap-3 md:gap-5 lg:gap-6 max-w-[1100px] mx-auto py-6 md:py-8 px-4 md:px-6"
    >
      {trustItems.map((item, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15 + index * 0.05, duration: 0.25 }}
          className="group relative"
        >
          <div 
            className={`flex items-center gap-2 md:gap-3 px-3 py-2 md:px-5 md:py-3 rounded-xl transition-all duration-300 cursor-default h-full overflow-hidden ${
              item.highlight 
                ? 'bg-[#FDFBF7] border-2 border-[#B89555]/30 shadow-md' 
                : 'bg-[#FDFBF7] border border-[#B89555]/30 hover:border-[#B89555]/30 shadow-sm'
            }`}
          >
            {/* Icon */}
            <div className="jj-icon-keep w-10 h-10 md:w-12 md:h-12 lg:w-14 lg:h-14 rounded-lg md:rounded-xl flex items-center justify-center flex-shrink-0 bg-[#1A1A1A] shadow-sm">
              <item.icon className="w-5 h-5 md:w-6 md:h-6 lg:w-7 lg:h-7 text-white" style={{ color: '#fff' }} />
            </div>
            
            {/* Text content */}
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-xs md:text-[15px] font-bold tracking-wide leading-tight text-[#1A1A1A] transition-colors duration-300 break-words">
                {item.text}
              </span>
              {item.subtext && (
                <span className="text-[10px] md:text-xs text-[#5A4A2E] font-medium tracking-wide transition-colors duration-300 break-words">
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
