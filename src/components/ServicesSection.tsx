const GlobeIcon = () => (
  <svg viewBox="0 0 120 140" className="w-28 h-36 md:w-32 md:h-40">
    <defs>
      <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#F4D03F" />
        <stop offset="25%" stopColor="#D4A017" />
        <stop offset="50%" stopColor="#C5941A" />
        <stop offset="75%" stopColor="#B8860B" />
        <stop offset="100%" stopColor="#8B6914" />
      </linearGradient>
      <linearGradient id="goldHighlight" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FFE55C" />
        <stop offset="50%" stopColor="#F4D03F" />
        <stop offset="100%" stopColor="#D4A017" />
      </linearGradient>
      <linearGradient id="goldDark" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#8B6914" />
        <stop offset="100%" stopColor="#5C4409" />
      </linearGradient>
      <linearGradient id="standGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#D4A017" />
        <stop offset="50%" stopColor="#8B6914" />
        <stop offset="100%" stopColor="#5C4409" />
      </linearGradient>
      <filter id="glow">
        <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
        <feMerge>
          <feMergeNode in="coloredBlur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>
    
    <circle cx="60" cy="50" r="35" fill="url(#goldGradient)" filter="url(#glow)" />
    <ellipse cx="60" cy="50" rx="35" ry="12" fill="none" stroke="url(#goldHighlight)" strokeWidth="1.5" opacity="0.8" />
    <ellipse cx="60" cy="50" rx="12" ry="35" fill="none" stroke="url(#goldHighlight)" strokeWidth="1.5" opacity="0.8" />
    <ellipse cx="60" cy="50" rx="25" ry="35" fill="none" stroke="url(#goldHighlight)" strokeWidth="1" opacity="0.5" />
    <line x1="25" y1="50" x2="95" y2="50" stroke="url(#goldHighlight)" strokeWidth="1" opacity="0.6" />
    
    <ellipse cx="50" cy="45" rx="12" ry="15" fill="url(#goldDark)" opacity="0.4" />
    <ellipse cx="70" cy="55" rx="8" ry="10" fill="url(#goldDark)" opacity="0.3" />
    
    <ellipse cx="60" cy="95" rx="18" ry="5" fill="url(#goldGradient)" />
    <path d="M42 95 Q60 88 78 95" fill="none" stroke="url(#goldHighlight)" strokeWidth="3" />
    
    <rect x="57" y="85" width="6" height="15" fill="url(#standGradient)" />
    
    <ellipse cx="60" cy="110" rx="22" ry="6" fill="url(#goldGradient)" />
    <ellipse cx="60" cy="108" rx="22" ry="6" fill="url(#goldHighlight)" opacity="0.5" />
    
    <circle cx="42" cy="95" r="2" fill="#FFE55C" />
    <circle cx="78" cy="95" r="2" fill="#FFE55C" />
  </svg>
);

const HandshakeIcon = () => (
  <svg viewBox="0 0 140 120" className="w-32 h-28 md:w-40 md:h-32">
    <defs>
      <linearGradient id="goldGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#F4D03F" />
        <stop offset="30%" stopColor="#D4A017" />
        <stop offset="70%" stopColor="#B8860B" />
        <stop offset="100%" stopColor="#8B6914" />
      </linearGradient>
      <linearGradient id="sleeveLeft" x1="100%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#4A4A4A" />
        <stop offset="50%" stopColor="#2A2A2A" />
        <stop offset="100%" stopColor="#1A1A1A" />
      </linearGradient>
      <linearGradient id="sleeveRight" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#4A4A4A" />
        <stop offset="50%" stopColor="#2A2A2A" />
        <stop offset="100%" stopColor="#1A1A1A" />
      </linearGradient>
      <filter id="glow2">
        <feGaussianBlur stdDeviation="1.5" result="coloredBlur"/>
        <feMerge>
          <feMergeNode in="coloredBlur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>
    
    <path d="M5 95 L5 50 L35 35 L50 55" fill="url(#sleeveLeft)" />
    <path d="M5 50 L35 35" stroke="#555" strokeWidth="1" />
    
    <path d="M135 95 L135 50 L105 35 L90 55" fill="url(#sleeveRight)" />
    <path d="M135 50 L105 35" stroke="#555" strokeWidth="1" />
    
    <path 
      d="M35 55 Q45 48 55 52 L70 58 Q75 55 70 50 L60 45 Q55 42 60 38 Q65 34 70 38 L85 52"
      fill="url(#goldGrad2)" 
      filter="url(#glow2)"
    />
    
    <path 
      d="M105 55 Q95 48 85 52 L70 58"
      fill="url(#goldGrad2)"
      filter="url(#glow2)"
    />
    
    <ellipse cx="70" cy="55" rx="20" ry="14" fill="url(#goldGrad2)" filter="url(#glow2)" />
    
    <path d="M55 50 Q60 45 65 48" fill="none" stroke="#FFE55C" strokeWidth="2" opacity="0.6" />
    <path d="M75 48 Q80 45 85 50" fill="none" stroke="#FFE55C" strokeWidth="2" opacity="0.6" />
    
    <ellipse cx="52" cy="58" rx="7" ry="5" fill="url(#goldGrad2)" />
    <ellipse cx="88" cy="58" rx="7" ry="5" fill="url(#goldGrad2)" />
  </svg>
);

const BuildingsIcon = () => (
  <svg viewBox="0 0 140 120" className="w-32 h-28 md:w-40 md:h-32">
    <defs>
      <linearGradient id="goldGrad3" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#F4D03F" />
        <stop offset="30%" stopColor="#D4A017" />
        <stop offset="70%" stopColor="#B8860B" />
        <stop offset="100%" stopColor="#8B6914" />
      </linearGradient>
      <linearGradient id="goldGrad3Dark" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#8B6914" />
        <stop offset="100%" stopColor="#5C4409" />
      </linearGradient>
      <linearGradient id="coinTop" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#FFE55C" />
        <stop offset="100%" stopColor="#D4A017" />
      </linearGradient>
      <filter id="glow3">
        <feGaussianBlur stdDeviation="1.5" result="coloredBlur"/>
        <feMerge>
          <feMergeNode in="coloredBlur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>
    
    <rect x="75" y="10" width="22" height="80" fill="url(#goldGrad3)" filter="url(#glow3)" />
    <rect x="97" y="10" width="6" height="80" fill="url(#goldGrad3Dark)" />
    <rect x="78" y="15" width="5" height="7" fill="#5C4409" opacity="0.5" />
    <rect x="86" y="15" width="5" height="7" fill="#5C4409" opacity="0.5" />
    <rect x="78" y="27" width="5" height="7" fill="#5C4409" opacity="0.5" />
    <rect x="86" y="27" width="5" height="7" fill="#5C4409" opacity="0.5" />
    <rect x="78" y="39" width="5" height="7" fill="#5C4409" opacity="0.5" />
    <rect x="86" y="39" width="5" height="7" fill="#5C4409" opacity="0.5" />
    <rect x="78" y="51" width="5" height="7" fill="#5C4409" opacity="0.5" />
    <rect x="86" y="51" width="5" height="7" fill="#5C4409" opacity="0.5" />
    <rect x="78" y="63" width="5" height="7" fill="#5C4409" opacity="0.5" />
    <rect x="86" y="63" width="5" height="7" fill="#5C4409" opacity="0.5" />
    
    <rect x="48" y="30" width="24" height="60" fill="url(#goldGrad3)" filter="url(#glow3)" />
    <rect x="72" y="30" width="6" height="60" fill="url(#goldGrad3Dark)" />
    <rect x="52" y="36" width="5" height="6" fill="#5C4409" opacity="0.5" />
    <rect x="60" y="36" width="5" height="6" fill="#5C4409" opacity="0.5" />
    <rect x="52" y="47" width="5" height="6" fill="#5C4409" opacity="0.5" />
    <rect x="60" y="47" width="5" height="6" fill="#5C4409" opacity="0.5" />
    <rect x="52" y="58" width="5" height="6" fill="#5C4409" opacity="0.5" />
    <rect x="60" y="58" width="5" height="6" fill="#5C4409" opacity="0.5" />
    <rect x="52" y="69" width="5" height="6" fill="#5C4409" opacity="0.5" />
    <rect x="60" y="69" width="5" height="6" fill="#5C4409" opacity="0.5" />
    
    <ellipse cx="22" cy="90" rx="14" ry="5" fill="url(#goldGrad3)" />
    <rect x="8" y="84" width="28" height="6" fill="url(#goldGrad3)" />
    <ellipse cx="22" cy="84" rx="14" ry="5" fill="url(#coinTop)" />
    
    <ellipse cx="25" cy="78" rx="12" ry="4" fill="url(#goldGrad3)" />
    <rect x="13" y="73" width="24" height="5" fill="url(#goldGrad3)" />
    <ellipse cx="25" cy="73" rx="12" ry="4" fill="url(#coinTop)" />
    
    <ellipse cx="22" cy="68" rx="10" ry="3" fill="url(#goldGrad3)" />
    <rect x="12" y="64" width="20" height="4" fill="url(#goldGrad3)" />
    <ellipse cx="22" cy="64" rx="10" ry="3" fill="url(#coinTop)" />
    
    <ellipse cx="120" cy="90" rx="12" ry="4" fill="url(#goldGrad3)" />
    <rect x="108" y="85" width="24" height="5" fill="url(#goldGrad3)" />
    <ellipse cx="120" cy="85" rx="12" ry="4" fill="url(#coinTop)" />
    
    <ellipse cx="117" cy="80" rx="10" ry="3" fill="url(#goldGrad3)" />
    <rect x="107" y="76" width="20" height="4" fill="url(#goldGrad3)" />
    <ellipse cx="117" cy="76" rx="10" ry="3" fill="url(#coinTop)" />
  </svg>
);

const NetworkIcon = () => (
  <svg viewBox="0 0 120 120" className="w-28 h-28 md:w-32 md:h-32">
    <defs>
      <linearGradient id="goldGrad4" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#F4D03F" />
        <stop offset="30%" stopColor="#D4A017" />
        <stop offset="70%" stopColor="#B8860B" />
        <stop offset="100%" stopColor="#8B6914" />
      </linearGradient>
      <radialGradient id="sphereGrad" cx="30%" cy="30%" r="70%">
        <stop offset="0%" stopColor="#FFE55C" />
        <stop offset="50%" stopColor="#D4A017" />
        <stop offset="100%" stopColor="#8B6914" />
      </radialGradient>
      <filter id="glow4">
        <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
        <feMerge>
          <feMergeNode in="coloredBlur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>
    
    <line x1="60" y1="60" x2="25" y2="25" stroke="url(#goldGrad4)" strokeWidth="5" />
    <line x1="60" y1="60" x2="95" y2="25" stroke="url(#goldGrad4)" strokeWidth="5" />
    <line x1="60" y1="60" x2="25" y2="95" stroke="url(#goldGrad4)" strokeWidth="5" />
    <line x1="60" y1="60" x2="95" y2="95" stroke="url(#goldGrad4)" strokeWidth="5" />
    <line x1="60" y1="60" x2="60" y2="15" stroke="url(#goldGrad4)" strokeWidth="5" />
    <line x1="60" y1="60" x2="60" y2="105" stroke="url(#goldGrad4)" strokeWidth="5" />
    
    <circle cx="60" cy="60" r="16" fill="url(#sphereGrad)" filter="url(#glow4)" />
    <ellipse cx="55" cy="53" rx="5" ry="4" fill="#FFE55C" opacity="0.6" />
    
    <circle cx="25" cy="25" r="12" fill="url(#sphereGrad)" filter="url(#glow4)" />
    <ellipse cx="21" cy="21" rx="4" ry="3" fill="#FFE55C" opacity="0.6" />
    
    <circle cx="95" cy="25" r="12" fill="url(#sphereGrad)" filter="url(#glow4)" />
    <ellipse cx="91" cy="21" rx="4" ry="3" fill="#FFE55C" opacity="0.6" />
    
    <circle cx="25" cy="95" r="12" fill="url(#sphereGrad)" filter="url(#glow4)" />
    <ellipse cx="21" cy="91" rx="4" ry="3" fill="#FFE55C" opacity="0.6" />
    
    <circle cx="95" cy="95" r="12" fill="url(#sphereGrad)" filter="url(#glow4)" />
    <ellipse cx="91" cy="91" rx="4" ry="3" fill="#FFE55C" opacity="0.6" />
    
    <circle cx="60" cy="15" r="10" fill="url(#sphereGrad)" filter="url(#glow4)" />
    <circle cx="60" cy="105" r="10" fill="url(#sphereGrad)" filter="url(#glow4)" />
  </svg>
);

interface ServiceCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const ServiceCard = ({ icon, title, description }: ServiceCardProps) => (
  <div className="flex flex-col items-center">
    {/* 3D Icon floating above cube */}
    <div className="relative z-10 mb-[-20px]">
      {icon}
    </div>
    
    {/* Black cube pedestal */}
    <div 
      className="relative w-full h-[180px] flex flex-col items-center justify-start pt-8"
      style={{
        background: 'linear-gradient(180deg, #2a2a2a 0%, #1a1a1a 50%, #0f0f0f 100%)',
        boxShadow: '0 20px 60px rgba(0,0,0,0.9), inset 0 1px 0 rgba(255,255,255,0.05)',
      }}
    >
      {/* Top edge highlight */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#3a3a3a] to-transparent" />
      
      {/* Decorative gold dots with lines */}
      <div className="flex items-center justify-center gap-2 mb-4 mt-2">
        <div className="w-8 h-px bg-gradient-to-r from-transparent to-[#D4A017]" />
        <span className="w-1.5 h-1.5 rounded-full bg-[#D4A017]" />
        <span className="w-1 h-1 rounded-full bg-[#D4A017] opacity-50" />
        <span className="w-1.5 h-1.5 rounded-full bg-[#D4A017]" />
        <div className="w-8 h-px bg-gradient-to-l from-transparent to-[#D4A017]" />
      </div>
      
      {/* Title */}
      <h3 
        className="text-[#D4A017] text-lg md:text-xl font-semibold text-center mb-3 px-4 leading-tight"
        style={{ fontFamily: "'Poppins', sans-serif" }}
      >
        {title}
      </h3>
      
      {/* Description */}
      <p className="text-[#888] text-xs md:text-sm text-center leading-relaxed px-4 max-w-[200px]">
        {description}
      </p>
    </div>
  </div>
);

const ServicesSection = () => {
  const services = [
    {
      icon: <GlobeIcon />,
      title: "Global Advisory",
      description: "Deep international market insights and bespoke strategies",
    },
    {
      icon: <HandshakeIcon />,
      title: "Private Client Approach",
      description: "Personalized service and tailored investment solutions",
    },
    {
      icon: <BuildingsIcon />,
      title: "End-to-End Solutions",
      description: "Comprehensive services from investment to management",
    },
    {
      icon: <NetworkIcon />,
      title: "Trusted Network",
      description: "Trusted global connections for strategic partnerships Opportunities",
    },
  ];

  return (
    <section 
      className="relative w-full min-h-screen overflow-hidden"
      style={{ 
        background: 'linear-gradient(180deg, #0a0a0a 0%, #0d0d0d 50%, #000000 100%)'
      }}
    >
      {/* Ambient warm glow at bottom */}
      <div 
        className="absolute bottom-0 left-0 right-0 h-[60%] pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 50% 100%, rgba(180, 120, 40, 0.12) 0%, transparent 60%)'
        }}
      />
      
      {/* Bokeh particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 40 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              width: `${3 + Math.random() * 10}px`,
              height: `${3 + Math.random() * 10}px`,
              left: `${Math.random() * 100}%`,
              top: `${30 + Math.random() * 60}%`,
              background: `radial-gradient(circle, rgba(212, 160, 23, ${0.15 + Math.random() * 0.35}) 0%, transparent 70%)`,
              filter: 'blur(1px)',
            }}
          />
        ))}
      </div>
      
      <div className="relative z-10 container mx-auto px-4 py-16 md:py-24">
        {/* Header */}
        <div className="text-center mb-12 md:mb-20">
          <h2 
            className="text-3xl md:text-5xl lg:text-6xl font-light text-white mb-4 md:mb-6 tracking-wide"
            style={{ fontFamily: "'Poppins', sans-serif" }}
          >
            Why <span className="text-[#D4A017]">JJ Global Capital</span>
          </h2>
          <p className="text-[#888888] text-base md:text-xl font-light tracking-wide mb-6 md:mb-8">
            Where property, lifestyle, and expertise converge.
          </p>
          <div className="w-16 h-0.5 bg-[#D4A017] mx-auto" />
        </div>
        
        {/* 4 cubes in a row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 max-w-6xl mx-auto">
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