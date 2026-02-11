import React, { useRef, useEffect, useState } from 'react';
import { Briefcase, Clock, Home, Users } from 'lucide-react';
import { COMPANY_STATS } from '@/constants/stats';
import { useLanguage } from '@/contexts/LanguageContext';

// Arabic-Indic numerals mapping
const ARABIC_NUMERALS: Record<string, string> = {
  '0': '٠', '1': '١', '2': '٢', '3': '٣', '4': '٤',
  '5': '٥', '6': '٦', '7': '٧', '8': '٨', '9': '٩',
};

// Convert Western numerals to Arabic-Indic numerals
const toArabicNumerals = (text: string): string => {
  return text.replace(/[0-9]/g, (digit) => ARABIC_NUMERALS[digit] || digit);
};

const stats = [
  {
    ...COMPANY_STATS.yearsInDubai,
    icon: Clock,
  },
  {
    ...COMPANY_STATS.brokersTrainedBy,
    icon: Users,
  },
  {
    ...COMPANY_STATS.socialFollowers,
    icon: Briefcase,
  },
  {
    ...COMPANY_STATS.teamManaged,
    icon: Home,
  },
];

interface StatItemProps {
  end: number;
  suffix: string;
  prefix: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  isVisible: boolean;
  language: string;
  t: (key: string, fallback?: string) => string;
}

const StatItem = ({ end, suffix, prefix, label, icon: Icon, isVisible, language, t }: StatItemProps) => {
  const [count, setCount] = useState(0);
  const hasAnimatedRef = React.useRef(false);

  useEffect(() => {
    if (!isVisible || hasAnimatedRef.current) return;
    
    hasAnimatedRef.current = true;
    let startTime: number | null = null;
    let animationFrame: number;
    const duration = 2500;

    const animate = (currentTime: number) => {
      if (startTime === null) startTime = currentTime;
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function for smooth deceleration
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const currentCount = Math.floor(easeOutQuart * end);
      
      setCount(currentCount);

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      } else {
        setCount(end);
      }
    };

    // Small delay to ensure visibility trigger is reliable
    const timeout = setTimeout(() => {
      animationFrame = requestAnimationFrame(animate);
    }, 100);

    return () => {
      clearTimeout(timeout);
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [isVisible, end]);

  // Format numbers - use abbreviated format (M) throughout animation when target is >= 1M
  const formatNumber = (num: number): string => {
    // If target is >= 1M, always use abbreviated M format to prevent layout shift
    if (end >= 1000000) {
      const millions = num / 1000000;
      const abbr = language === 'ar' ? 'م' : 'M';
      const formatted = millions >= 1 
        ? (language === 'ar' ? toArabicNumerals(millions.toFixed(0)) : millions.toFixed(0))
        : (language === 'ar' ? toArabicNumerals(millions.toFixed(1)) : millions.toFixed(1));
      return `${formatted}${abbr}`;
    }
    const formatted = num.toLocaleString('en-US');
    return language === 'ar' ? toArabicNumerals(formatted) : formatted;
  };

  const formattedPrefix = language === 'ar' ? toArabicNumerals(prefix) : prefix;
  const formattedSuffix = language === 'ar' ? toArabicNumerals(suffix) : suffix;
  const formattedValue = `${formattedPrefix}${formatNumber(count)}${formattedSuffix}`;

  // Translate labels based on stat type
  const getTranslatedLabel = () => {
    if (label === 'Years Experience') return t('home.stats.yearsInDubai', 'Years Experience');
    if (label === 'Brokers Trained') return t('home.stats.brokersTrainedBy', 'Brokers Trained');
    if (label === 'Social Followers') return t('home.stats.clientSatisfaction', 'Social Followers');
    if (label === 'Team Members') return t('home.stats.teamMembers', 'Team Members');
    return label;
  };

  return (
    <div className="relative group">
      {/* Pearl Card with Gold Border - 3-layer compliant */}
      <div className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold rounded-2xl p-6 md:p-8 text-center hover:shadow-lg hover:shadow-gold/30 transition-all duration-500">
        {/* Icon - Black circle with gold icon */}
        <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-black flex items-center justify-center shadow-lg">
          <Icon className="w-6 h-6 text-gold" />
        </div>
        
        {/* Counter Value */}
        <div 
          className="text-2xl md:text-3xl lg:text-4xl font-semibold text-black mb-1 min-w-[80px]"
          style={{ fontFamily: "Poppins, sans-serif" }}
        >
          {formattedValue}
        </div>
        
        {/* Label */}
        <div className="text-zinc-600 text-xs md:text-sm font-medium">
          {getTranslatedLabel()}
        </div>
      </div>
    </div>
  );
};

const StatsCounter = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const { language, t } = useLanguage();

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.2 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="bg-black">
      {/* Active Champagne Section Layer - using global jj-layer-2 */}
      <div className="jj-layer-2">
          {/* Section Header - Premium Label */}
          <div className="text-center mb-10">
            <span className="inline-block px-5 py-2 bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/40 rounded-full text-xs uppercase tracking-[0.2em] font-semibold mb-3 shadow-sm">
              <span className="text-gold">{t('home.stats.trackRecord', 'Track Record').split(' ')[0]}</span>
              <span className="text-black"> {t('home.stats.trackRecord', 'Track Record').split(' ').slice(1).join(' ')}</span>
            </span>
            <p className="text-zinc-700 text-sm">{t('founder.experience', 'Founder experience')}</p>
          </div>
          
          {/* Stats Grid - Pearl Cards inside Champagne Layer */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 max-w-4xl mx-auto">
            {stats.map((stat, index) => (
              <StatItem key={index} {...stat} isVisible={isVisible} language={language} t={t} />
            ))}
          </div>
      </div>
    </section>
  );
};

export default StatsCounter;
