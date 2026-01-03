import { cn } from "@/lib/utils";

const GlobeIcon = () => (
  <svg viewBox="0 0 100 100" className="w-24 h-24">
    <defs>
      <linearGradient id="luxuryGold" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#D4AF37" />
        <stop offset="30%" stopColor="#C5A028" />
        <stop offset="70%" stopColor="#B8960F" />
        <stop offset="100%" stopColor="#9A7B0A" />
      </linearGradient>
      <linearGradient id="goldShine" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#E8D48B" stopOpacity="0.9" />
        <stop offset="50%" stopColor="#D4AF37" stopOpacity="0.5" />
        <stop offset="100%" stopColor="#9A7B0A" stopOpacity="0.9" />
      </linearGradient>
      <filter id="luxuryGlow">
        <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
        <feMerge>
          <feMergeNode in="coloredBlur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>
    <circle cx="50" cy="50" r="36" fill="none" stroke="url(#luxuryGold)" strokeWidth="2.5" filter="url(#luxuryGlow)" />
    <ellipse cx="50" cy="50" rx="36" ry="14" fill="none" stroke="url(#luxuryGold)" strokeWidth="1.8" />
    <ellipse cx="50" cy="50" rx="36" ry="26" fill="none" stroke="url(#luxuryGold)" strokeWidth="1.2" opacity="0.6" />
    <ellipse cx="50" cy="50" rx="14" ry="36" fill="none" stroke="url(#luxuryGold)" strokeWidth="1.8" />
    <line x1="50" y1="14" x2="50" y2="86" stroke="url(#luxuryGold)" strokeWidth="1" opacity="0.4" />
    <circle cx="38" cy="35" r="6" fill="url(#goldShine)" opacity="0.3" />
  </svg>
);

const HandshakeIcon = () => (
  <svg viewBox="0 0 100 100" className="w-24 h-24">
    <defs>
      <linearGradient id="luxuryGold2" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#D4AF37" />
        <stop offset="50%" stopColor="#C5A028" />
        <stop offset="100%" stopColor="#9A7B0A" />
      </linearGradient>
      <filter id="luxuryGlow2">
        <feGaussianBlur stdDeviation="1.5" result="coloredBlur"/>
        <feMerge>
          <feMergeNode in="coloredBlur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>
    <path
      d="M12 52 L24 48 L36 50 L46 46 L50 48"
      fill="none"
      stroke="url(#luxuryGold2)"
      strokeWidth="3.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      filter="url(#luxuryGlow2)"
    />
    <path
      d="M88 52 L76 48 L64 50 L54 46 L50 48"
      fill="none"
      stroke="url(#luxuryGold2)"
      strokeWidth="3.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      filter="url(#luxuryGlow2)"
    />
    <path
      d="M46 46 Q50 42 54 46"
      fill="none"
      stroke="url(#luxuryGold2)"
      strokeWidth="3.5"
      strokeLinecap="round"
      filter="url(#luxuryGlow2)"
    />
    <path d="M8 56 L8 44 L18 40" fill="none" stroke="url(#luxuryGold2)" strokeWidth="2.5" strokeLinecap="round" opacity="0.7" />
    <path d="M92 56 L92 44 L82 40" fill="none" stroke="url(#luxuryGold2)" strokeWidth="2.5" strokeLinecap="round" opacity="0.7" />
    <circle cx="50" cy="32" r="4" fill="none" stroke="url(#luxuryGold2)" strokeWidth="1.5" opacity="0.4" />
    <circle cx="50" cy="66" r="4" fill="none" stroke="url(#luxuryGold2)" strokeWidth="1.5" opacity="0.4" />
  </svg>
);

const CoinsIcon = () => (
  <svg viewBox="0 0 100 100" className="w-24 h-24">
    <defs>
      <linearGradient id="luxuryGold3" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#D4AF37" />
        <stop offset="50%" stopColor="#C5A028" />
        <stop offset="100%" stopColor="#9A7B0A" />
      </linearGradient>
      <linearGradient id="coinFace" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#D4AF37" stopOpacity="0.3" />
        <stop offset="100%" stopColor="#9A7B0A" stopOpacity="0.15" />
      </linearGradient>
      <filter id="luxuryGlow3">
        <feGaussianBlur stdDeviation="1.5" result="coloredBlur"/>
        <feMerge>
          <feMergeNode in="coloredBlur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>
    <ellipse cx="56" cy="32" rx="26" ry="11" fill="url(#coinFace)" />
    <ellipse cx="56" cy="32" rx="26" ry="11" fill="none" stroke="url(#luxuryGold3)" strokeWidth="2" opacity="0.5" />
    <ellipse cx="56" cy="38" rx="26" ry="11" fill="none" stroke="url(#luxuryGold3)" strokeWidth="1.5" opacity="0.3" />
    
    <ellipse cx="50" cy="50" rx="26" ry="11" fill="url(#coinFace)" />
    <ellipse cx="50" cy="50" rx="26" ry="11" fill="none" stroke="url(#luxuryGold3)" strokeWidth="2" filter="url(#luxuryGlow3)" opacity="0.7" />
    <ellipse cx="50" cy="56" rx="26" ry="11" fill="none" stroke="url(#luxuryGold3)" strokeWidth="1.5" opacity="0.4" />
    
    <ellipse cx="44" cy="68" rx="26" ry="11" fill="url(#coinFace)" />
    <ellipse cx="44" cy="68" rx="26" ry="11" fill="none" stroke="url(#luxuryGold3)" strokeWidth="2.5" filter="url(#luxuryGlow3)" />
    <ellipse cx="44" cy="74" rx="26" ry="11" fill="none" stroke="url(#luxuryGold3)" strokeWidth="1.5" opacity="0.5" />
    
    <text x="44" y="72" textAnchor="middle" fill="#D4AF37" fontSize="14" fontWeight="600" fontFamily="serif">$</text>
  </svg>
);

const NetworkIcon = () => (
  <svg viewBox="0 0 100 100" className="w-24 h-24">
    <defs>
      <linearGradient id="luxuryGold4" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#D4AF37" />
        <stop offset="50%" stopColor="#C5A028" />
        <stop offset="100%" stopColor="#9A7B0A" />
      </linearGradient>
      <filter id="luxuryGlow4">
        <feGaussianBlur stdDeviation="1.5" result="coloredBlur"/>
        <feMerge>
          <feMergeNode in="coloredBlur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>
    <line x1="50" y1="50" x2="24" y2="24" stroke="url(#luxuryGold4)" strokeWidth="1.5" opacity="0.5" />
    <line x1="50" y1="50" x2="76" y2="24" stroke="url(#luxuryGold4)" strokeWidth="1.5" opacity="0.5" />
    <line x1="50" y1="50" x2="24" y2="76" stroke="url(#luxuryGold4)" strokeWidth="1.5" opacity="0.5" />
    <line x1="50" y1="50" x2="76" y2="76" stroke="url(#luxuryGold4)" strokeWidth="1.5" opacity="0.5" />
    <line x1="50" y1="50" x2="50" y2="14" stroke="url(#luxuryGold4)" strokeWidth="1.5" opacity="0.5" />
    <line x1="50" y1="50" x2="50" y2="86" stroke="url(#luxuryGold4)" strokeWidth="1.5" opacity="0.5" />
    <line x1="50" y1="50" x2="14" y2="50" stroke="url(#luxuryGold4)" strokeWidth="1.5" opacity="0.5" />
    <line x1="50" y1="50" x2="86" y2="50" stroke="url(#luxuryGold4)" strokeWidth="1.5" opacity="0.5" />
    
    <circle cx="50" cy="50" r="11" fill="url(#luxuryGold4)" filter="url(#luxuryGlow4)" />
    
    <circle cx="24" cy="24" r="7" fill="url(#luxuryGold4)" filter="url(#luxuryGlow4)" opacity="0.85" />
    <circle cx="76" cy="24" r="7" fill="url(#luxuryGold4)" filter="url(#luxuryGlow4)" opacity="0.85" />
    <circle cx="24" cy="76" r="7" fill="url(#luxuryGold4)" filter="url(#luxuryGlow4)" opacity="0.85" />
    <circle cx="76" cy="76" r="7" fill="url(#luxuryGold4)" filter="url(#luxuryGlow4)" opacity="0.85" />
    <circle cx="50" cy="14" r="5" fill="url(#luxuryGold4)" filter="url(#luxuryGlow4)" opacity="0.7" />
    <circle cx="50" cy="86" r="5" fill="url(#luxuryGold4)" filter="url(#luxuryGlow4)" opacity="0.7" />
    <circle cx="14" cy="50" r="5" fill="url(#luxuryGold4)" filter="url(#luxuryGlow4)" opacity="0.7" />
    <circle cx="86" cy="50" r="5" fill="url(#luxuryGold4)" filter="url(#luxuryGlow4)" opacity="0.7" />
  </svg>
);

interface ServiceCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  className?: string;
}

const ServiceCard = ({ icon, title, description, className }: ServiceCardProps) => (
  <div
    className={cn(
      "relative flex flex-col items-center p-10 rounded-sm",
      "bg-[#0a0a0a] border border-[#1a1a1a]",
      "hover:border-[#D4AF37]/20 transition-all duration-500",
      "group",
      className
    )}
  >
    <div className="mb-8 transition-transform duration-500 group-hover:scale-105">
      {icon}
    </div>
    
    <div className="w-20 h-px bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent mb-5" />
    
    <h3 className="text-lg font-light text-[#D4AF37] mb-5 text-center tracking-[0.2em] uppercase">
      {title}
    </h3>
    
    <p className="text-[#888888] text-center text-sm leading-relaxed font-light tracking-wide">
      {description}
    </p>
    
    <div className="w-10 h-px bg-gradient-to-r from-transparent via-[#D4AF37]/40 to-transparent mt-8 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
  </div>
);

const Sparkle = ({ style }: { style: React.CSSProperties }) => (
  <div
    className="absolute w-0.5 h-0.5 bg-[#D4AF37] rounded-full animate-sparkle"
    style={style}
  />
);

const ServicesSection = () => {
  const services = [
    {
      icon: <GlobeIcon />,
      title: "Global Advisory",
      description: "International market expertise with strategic insights spanning continents. Navigate complex cross-border opportunities with confidence.",
    },
    {
      icon: <HandshakeIcon />,
      title: "Private Client Approach",
      description: "Personalized investment solutions tailored to your unique financial aspirations. Experience white-glove service at every touchpoint.",
    },
    {
      icon: <CoinsIcon />,
      title: "End-to-End Solutions",
      description: "Comprehensive wealth management from strategy to execution. One seamless experience covering all your financial needs.",
    },
    {
      icon: <NetworkIcon />,
      title: "Trusted Network",
      description: "Strategic partnerships with industry leaders worldwide. Leverage our exclusive network to unlock premium opportunities.",
    },
  ];

  const sparkles = Array.from({ length: 20 }, (_, i) => ({
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
    animationDelay: `${Math.random() * 4}s`,
    opacity: 0.2 + Math.random() * 0.3,
  }));

  return (
    <section className="relative w-full min-h-screen bg-black overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        {sparkles.map((sparkle, i) => (
          <Sparkle key={i} style={sparkle} />
        ))}
      </div>
      
      <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_0%,_black_80%)] pointer-events-none" />
      
      <div className="relative z-10 container mx-auto px-6 py-24">
        <div className="text-center mb-20">
          <h2 
            className="text-4xl md:text-5xl lg:text-6xl font-light text-white mb-6 tracking-wide"
            style={{ fontFamily: "'Poppins', sans-serif" }}
          >
            Why <span className="text-[#D4AF37]">JJ Global Capital</span>
          </h2>
          <p className="text-[#999999] text-lg md:text-xl font-light tracking-wide mb-8">
            Where property, lifestyle, and expertise converge.
          </p>
          <div className="w-16 h-0.5 bg-[#D4AF37] mx-auto" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-7xl mx-auto">
          {services.map((service, index) => (
            <ServiceCard
              key={index}
              icon={service.icon}
              title={service.title}
              description={service.description}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default ServicesSection;