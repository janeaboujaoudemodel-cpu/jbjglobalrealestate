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

  const formattedValue = `${prefix}${count.toLocaleString()}${suffix}`;

  return (
    <div className="relative group">
      <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-6 md:p-8 text-center hover:border-gold/30 transition-all duration-500">
        {/* Icon - Subtle */}
        <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-gold/10 flex items-center justify-center">
          <Icon className="w-6 h-6 text-gold/80" />
        </div>
        
        {/* Counter Value */}
        <div 
          className="text-2xl md:text-3xl lg:text-4xl font-semibold text-gold mb-1"
          style={{ fontFamily: "Poppins, sans-serif" }}
        >
          {formattedValue}
        </div>
        
        {/* Label */}
        <div className="text-zinc-500 text-xs md:text-sm">
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
    <section ref={sectionRef} className="py-16 md:py-20 bg-zinc-950">
      <div className="container mx-auto px-4">
        {/* Section Header - Minimal */}
        <div className="text-center mb-10">
          <h2 
            className="text-zinc-400 text-xs uppercase tracking-[0.2em] mb-2"
          >
            Track Record
          </h2>
          <p className="text-zinc-600 text-xs">Founder experience</p>
        </div>
        
        {/* Stats Grid - Clean */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 max-w-4xl mx-auto">
          {stats.map((stat, index) => (
            <StatItem key={index} {...stat} isVisible={isVisible} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsCounter;
