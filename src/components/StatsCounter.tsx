import { useCountUp } from '@/hooks/useCountUp';
import { Briefcase, Clock, Home, Building2 } from 'lucide-react';
import { useRef, useEffect, useState } from 'react';

const stats = [
  {
    end: 2,
    suffix: 'B+',
    prefix: 'AED ',
    label: 'Portfolio Value',
    icon: Briefcase,
  },
  {
    end: 12,
    suffix: '+',
    prefix: '',
    label: 'Years of Experience',
    icon: Clock,
  },
  {
    end: 3900,
    suffix: '+',
    prefix: '',
    label: 'Properties Sold',
    icon: Home,
  },
  {
    end: 4200,
    suffix: '+',
    prefix: '',
    label: 'Properties Managed',
    icon: Building2,
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
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    if (!isVisible || hasAnimated) return;
    
    setHasAnimated(true);
    let startTime: number;
    let animationFrame: number;
    const duration = 2500;

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      
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

    animationFrame = requestAnimationFrame(animate);

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [isVisible, end, hasAnimated]);

  const formattedValue = `${prefix}${count.toLocaleString()}${suffix}`;

  return (
    <div className="relative group">
      <div className="bg-gradient-to-br from-zinc-900/80 to-black border border-zinc-800 rounded-2xl p-6 md:p-8 text-center hover:border-gold/40 transition-all duration-500 hover:shadow-xl hover:shadow-gold/10">
        {/* Icon */}
        <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-gradient-to-br from-gold/20 to-gold-dark/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
          <Icon className="w-7 h-7 text-gold" />
        </div>
        
        {/* Counter Value */}
        <div 
          className="text-3xl md:text-4xl lg:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-gold via-gold-dark to-gold mb-2"
          style={{ fontFamily: "Poppins, sans-serif" }}
        >
          {formattedValue}
        </div>
        
        {/* Label */}
        <div className="text-zinc-400 text-sm md:text-base font-medium">
          {label}
        </div>
        
        {/* Glow effect on hover */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-gold/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
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
    <section ref={sectionRef} className="py-16 md:py-24 bg-gradient-to-b from-zinc-950 to-zinc-900 relative overflow-hidden">
      {/* Background glow */}
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at center, hsl(40 32% 51% / 0.06) 0%, transparent 60%)",
        }}
      />
      
      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-12">
          <span className="inline-block px-4 py-1.5 bg-gold/10 border border-gold/30 rounded-full text-gold text-sm font-medium mb-4">
            Our Track Record
          </span>
          <h2 
            className="text-3xl md:text-4xl font-bold text-white"
            style={{ fontFamily: "Poppins, sans-serif" }}
          >
            Trusted by <span className="text-gold">Investors</span> Worldwide
          </h2>
        </div>
        
        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {stats.map((stat, index) => (
            <StatItem key={index} {...stat} isVisible={isVisible} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsCounter;
