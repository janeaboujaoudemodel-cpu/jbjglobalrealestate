import React, { useRef, useEffect, useState } from 'react';
import { Briefcase, Clock, Home, Users } from 'lucide-react';
import { COMPANY_STATS } from '@/constants/stats';

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
}

const StatItem = ({ end, suffix, prefix, label, icon: Icon, isVisible }: StatItemProps) => {
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

  // Format large numbers with abbreviation (1M+ for millions)
  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(0) + 'M';
    }
    return num.toLocaleString();
  };

  const formattedValue = `${prefix}${formatNumber(count)}${suffix}`;

  return (
    <div className="relative group">
      {/* Pearl Card with Gold Border - 3-layer compliant */}
      <div className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/40 rounded-2xl p-6 md:p-8 text-center hover:border-gold hover:shadow-lg hover:shadow-gold/20 transition-all duration-500">
        {/* Icon - Black circle with gold icon */}
        <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-black flex items-center justify-center shadow-lg">
          <Icon className="w-6 h-6 text-gold" />
        </div>
        
        {/* Counter Value */}
        <div 
          className="text-2xl md:text-3xl lg:text-4xl font-semibold text-black mb-1"
          style={{ fontFamily: "Poppins, sans-serif" }}
        >
          {formattedValue}
        </div>
        
        {/* Label */}
        <div className="text-zinc-600 text-xs md:text-sm font-medium">
          {label}
        </div>
      </div>
    </div>
  );
};

const StatsCounter = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

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
    <section ref={sectionRef} className="py-16 md:py-20 bg-black">
      <div className="container mx-auto px-4">
        {/* Active Champagne Section Layer - 3-layer system compliant */}
        <div className="mx-0 md:mx-4 lg:mx-8 py-10 px-4 md:px-8 bg-gradient-to-br from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] rounded-2xl border border-gold/30 shadow-lg">
          {/* Section Header - Premium Label */}
          <div className="text-center mb-10">
            <span className="inline-block px-5 py-2 bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/40 rounded-full text-xs uppercase tracking-[0.2em] font-semibold mb-3 shadow-sm">
              <span className="text-gold">Track</span>
              <span className="text-black"> Record</span>
            </span>
            <p className="text-zinc-700 text-sm">Founder experience</p>
          </div>
          
          {/* Stats Grid - Pearl Cards inside Champagne Layer */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 max-w-4xl mx-auto">
            {stats.map((stat, index) => (
              <StatItem key={index} {...stat} isVisible={isVisible} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default StatsCounter;
