const GlobeIcon = () => (
  <svg viewBox="0 0 120 140" className="w-32 h-40">
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
    
    {/* Globe */}
    <circle cx="60" cy="50" r="35" fill="url(#goldGradient)" filter="url(#glow)" />
    <ellipse cx="60" cy="50" rx="35" ry="12" fill="none" stroke="url(#goldHighlight)" strokeWidth="1.5" opacity="0.8" />
    <ellipse cx="60" cy="50" rx="12" ry="35" fill="none" stroke="url(#goldHighlight)" strokeWidth="1.5" opacity="0.8" />
    <ellipse cx="60" cy="50" rx="25" ry="35" fill="none" stroke="url(#goldHighlight)" strokeWidth="1" opacity="0.5" />
    <line x1="25" y1="50" x2="95" y2="50" stroke="url(#goldHighlight)" strokeWidth="1" opacity="0.6" />
    <line x1="60" y1="15" x2="60" y2="85" stroke="url(#goldHighlight)" strokeWidth="1" opacity="0.4" />
    
    {/* Continents hint */}
    <ellipse cx="50" cy="45" rx="12" ry="15" fill="url(#goldDark)" opacity="0.4" />
    <ellipse cx="70" cy="55" rx="8" ry="10" fill="url(#goldDark)" opacity="0.3" />
    
    {/* Stand ring */}
    <ellipse cx="60" cy="95" rx="18" ry="5" fill="url(#goldGradient)" />
    <path d="M42 95 Q60 88 78 95" fill="none" stroke="url(#goldHighlight)" strokeWidth="3" />
    
    {/* Stand pole */}
    <rect x="57" y="85" width="6" height="15" fill="url(#standGradient)" />
    
    {/* Base */}
    <ellipse cx="60" cy="110" rx="22" ry="6" fill="url(#goldGradient)" />
    <ellipse cx="60" cy="108" rx="22" ry="6" fill="url(#goldHighlight)" opacity="0.5" />
    
    {/* Decorative dots around ring */}
    <circle cx="42" cy="95" r="2" fill="#FFE55C" />
    <circle cx="78" cy="95" r="2" fill="#FFE55C" />
    <circle cx="50" cy="92" r="1.5" fill="#FFE55C" opacity="0.7" />
    <circle cx="70" cy="92" r="1.5" fill="#FFE55C" opacity="0.7" />
  </svg>
);

const HandshakeIcon = () => (
  <svg viewBox="0 0 140 120" className="w-36 h-32">
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
    
    {/* Left sleeve */}
    <path d="M5 85 L5 50 L35 40 L50 55" fill="url(#sleeveLeft)" />
    <path d="M5 50 L35 40" stroke="#555" strokeWidth="1" />
    
    {/* Right sleeve */}
    <path d="M135 85 L135 50 L105 40 L90 55" fill="url(#sleeveRight)" />
    <path d="M135 50 L105 40" stroke="#555" strokeWidth="1" />
    
    {/* Left hand */}
    <path 
      d="M35 55 Q45 48 55 52 L70 58 Q75 55 70 50 L60 45 Q55 42 60 38 Q65 34 70 38 L85 52"
      fill="url(#goldGrad2)" 
      filter="url(#glow2)"
    />
    
    {/* Right hand */}
    <path 
      d="M105 55 Q95 48 85 52 L70 58"
      fill="url(#goldGrad2)"
      filter="url(#glow2)"
    />
    
    {/* Handshake center */}
    <ellipse cx="70" cy="55" rx="18" ry="12" fill="url(#goldGrad2)" filter="url(#glow2)" />
    
    {/* Fingers detail */}
    <path d="M55 50 Q60 45 65 48" fill="none" stroke="#FFE55C" strokeWidth="2" opacity="0.6" />
    <path d="M75 48 Q80 45 85 50" fill="none" stroke="#FFE55C" strokeWidth="2" opacity="0.6" />
    
    {/* Thumbs */}
    <ellipse cx="52" cy="58" rx="6" ry="4" fill="url(#goldGrad2)" />
    <ellipse cx="88" cy="58" rx="6" ry="4" fill="url(#goldGrad2)" />
    
    {/* Wrist highlights */}
    <path d="M38 52 L48 48" stroke="#FFE55C" strokeWidth="1.5" opacity="0.5" />
    <path d="M102 52 L92 48" stroke="#FFE55C" strokeWidth="1.5" opacity="0.5" />
  </svg>
);

const BuildingsIcon = () => (
  <svg viewBox="0 0 140 120" className="w-36 h-32">
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
    
    {/* Back tall building */}
    <rect x="75" y="15" width="20" height="75" fill="url(#goldGrad3)" filter="url(#glow3)" />
    <rect x="95" y="15" width="5" height="75" fill="url(#goldGrad3Dark)" />
    {/* Windows */}
    <rect x="78" y="20" width="4" height="6" fill="#5C4409" opacity="0.5" />
    <rect x="85" y="20" width="4" height="6" fill="#5C4409" opacity="0.5" />
    <rect x="78" y="30" width="4" height="6" fill="#5C4409" opacity="0.5" />
    <rect x="85" y="30" width="4" height="6" fill="#5C4409" opacity="0.5" />
    <rect x="78" y="40" width="4" height="6" fill="#5C4409" opacity="0.5" />
    <rect x="85" y="40" width="4" height="6" fill="#5C4409" opacity="0.5" />
    <rect x="78" y="50" width="4" height="6" fill="#5C4409" opacity="0.5" />
    <rect x="85" y="50" width="4" height="6" fill="#5C4409" opacity="0.5" />
    <rect x="78" y="60" width="4" height="6" fill="#5C4409" opacity="0.5" />
    <rect x="85" y="60" width="4" height="6" fill="#5C4409" opacity="0.5" />
    
    {/* Front medium building */}
    <rect x="50" y="35" width="22" height="55" fill="url(#goldGrad3)" filter="url(#glow3)" />
    <rect x="72" y="35" width="5" height="55" fill="url(#goldGrad3Dark)" />
    <rect x="53" y="40" width="4" height="5" fill="#5C4409" opacity="0.5" />
    <rect x="60" y="40" width="4" height="5" fill="#5C4409" opacity="0.5" />
    <rect x="53" y="50" width="4" height="5" fill="#5C4409" opacity="0.5" />
    <rect x="60" y="50" width="4" height="5" fill="#5C4409" opacity="0.5" />
    <rect x="53" y="60" width="4" height="5" fill="#5C4409" opacity="0.5" />
    <rect x="60" y="60" width="4" height="5" fill="#5C4409" opacity="0.5" />
    
    {/* Coin stacks left */}
    <ellipse cx="25" cy="90" rx="12" ry="4" fill="url(#goldGrad3)" />
    <rect x="13" y="85" width="24" height="5" fill="url(#goldGrad3)" />
    <ellipse cx="25" cy="85" rx="12" ry="4" fill="url(#coinTop)" />
    
    <ellipse cx="28" cy="80" rx="10" ry="3" fill="url(#goldGrad3)" />
    <rect x="18" y="76" width="20" height="4" fill="url(#goldGrad3)" />
    <ellipse cx="28" cy="76" rx="10" ry="3" fill="url(#coinTop)" />
    
    <ellipse cx="25" cy="72" rx="8" ry="2.5" fill="url(#goldGrad3)" />
    <rect x="17" y="69" width="16" height="3" fill="url(#goldGrad3)" />
    <ellipse cx="25" cy="69" rx="8" ry="2.5" fill="url(#coinTop)" />
    
    {/* Coin stacks right */}
    <ellipse cx="115" cy="90" rx="10" ry="3" fill="url(#goldGrad3)" />
    <rect x="105" y="86" width="20" height="4" fill="url(#goldGrad3)" />
    <ellipse cx="115" cy="86" rx="10" ry="3" fill="url(#coinTop)" />
    
    <ellipse cx="112" cy="82" rx="8" ry="2.5" fill="url(#goldGrad3)" />
    <rect x="104" y="79" width="16" height="3" fill="url(#goldGrad3)" />
    <ellipse cx="112" cy="79" rx="8" ry="2.5" fill="url(#coinTop)" />
  </svg>
);

const NetworkIcon = () => (
  <svg viewBox="0 0 120 120" className="w-32 h-32">
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
    
    {/* Connection rods */}
    <line x1="60" y1="60" x2="25" y2="25" stroke="url(#goldGrad4)" strokeWidth="4" />
    <line x1="60" y1="60" x2="95" y2="25" stroke="url(#goldGrad4)" strokeWidth="4" />
    <line x1="60" y1="60" x2="25" y2="95" stroke="url(#goldGrad4)" strokeWidth="4" />
    <line x1="60" y1="60" x2="95" y2="95" stroke="url(#goldGrad4)" strokeWidth="4" />
    <line x1="60" y1="60" x2="60" y2="15" stroke="url(#goldGrad4)" strokeWidth="4" />
    <line x1="60" y1="60" x2="60" y2="105" stroke="url(#goldGrad4)" strokeWidth="4" />
    
    {/* Center sphere */}
    <circle cx="60" cy="60" r="14" fill="url(#sphereGrad)" filter="url(#glow4)" />
    <ellipse cx="56" cy="54" rx="4" ry="3" fill="#FFE55C" opacity="0.6" />
    
    {/* Corner spheres */}
    <circle cx="25" cy="25" r="10" fill="url(#sphereGrad)" filter="url(#glow4)" />
    <ellipse cx="22" cy="22" rx="3" ry="2" fill="#FFE55C" opacity="0.6" />
    
    <circle cx="95" cy="25" r="10" fill="url(#sphereGrad)" filter="url(#glow4)" />
    <ellipse cx="92" cy="22" rx="3" ry="2" fill="#FFE55C" opacity="0.6" />
    
    <circle cx="25" cy="95" r="10" fill="url(#sphereGrad)" filter="url(#glow4)" />
    <ellipse cx="22" cy="92" rx="3" ry="2" fill="#FFE55C" opacity="0.6" />
    
    <circle cx="95" cy="95" r="10" fill="url(#sphereGrad)" filter="url(#glow4)" />
    <ellipse cx="92" cy="92" rx="3" ry="2" fill="#FFE55C" opacity="0.6" />
    
    {/* Top and bottom spheres */}
    <circle cx="60" cy="15" r="8" fill="url(#sphereGrad)" filter="url(#glow4)" />
    <circle cx="60" cy="105" r="8" fill="url(#sphereGrad)" filter="url(#glow4)" />
  </svg>
);

interface ServiceCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const ServiceCard = ({ icon, title, description }: ServiceCardProps) => (
  <div className="flex flex-col items-center">
    {/* 3D Icon */}
    <div className="mb-4 transform hover:scale-105 transition-transform duration-300">
      {icon}
    </div>
    
    {/* Black cube pedestal */}
    <div 
      className="relative w-full max-w-[220px] bg-gradient-to-b from-[#2a2a2a] to-[#1a1a1a] p-6 pt-8"
      style={{
        clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)',
        boxShadow: '0 10px 40px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.05)'
      }}
    >
      {/* Top edge highlight */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#444] to-transparent" />
      
      {/* Decorative dots */}
      <div className="flex justify-center gap-1 mb-4">
        <span className="w-1 h-1 rounded-full bg-[#D4A017]" />
        <span className="w-1 h-1 rounded-full bg-[#D4A017] opacity-60" />
        <span className="w-1 h-1 rounded-full bg-[#D4A017]" />
      </div>
      
      {/* Title */}
      <h3 
        className="text-[#D4A017] text-xl font-semibold text-center mb-3 tracking-wide"
        style={{ fontFamily: "'Poppins', sans-serif" }}
      >
        {title}
      </h3>
      
      {/* Description */}
      <p className="text-[#999] text-sm text-center leading-relaxed">
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
      className="relative w-full min-h-screen overflow-hidden py-20"
      style={{ 
        background: 'radial-gradient(ellipse at center, #1a1208 0%, #0a0a0a 50%, #000000 100%)'
      }}
    >
      {/* Ambient glow effect */}
      <div 
        className="absolute inset-0 opacity-30"
        style={{
          background: 'radial-gradient(ellipse at 50% 80%, rgba(212, 160, 23, 0.15) 0%, transparent 50%)'
        }}
      />
      
      {/* Bokeh particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 30 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              width: `${4 + Math.random() * 8}px`,
              height: `${4 + Math.random() * 8}px`,
              left: `${Math.random() * 100}%`,
              top: `${40 + Math.random() * 50}%`,
              background: `radial-gradient(circle, rgba(212, 160, 23, ${0.2 + Math.random() * 0.3}) 0%, transparent 70%)`,
              filter: 'blur(1px)',
            }}
          />
        ))}
      </div>
      
      <div className="relative z-10 container mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 
            className="text-4xl md:text-5xl lg:text-6xl font-light text-white mb-6 tracking-wide"
            style={{ fontFamily: "'Poppins', sans-serif" }}
          >
            Why <span className="text-[#D4A017]">JJ Global Capital</span>
          </h2>
          <p className="text-[#999999] text-lg md:text-xl font-light tracking-wide mb-8">
            Where property, lifestyle, and expertise converge.
          </p>
          <div className="w-16 h-0.5 bg-[#D4A017] mx-auto" />
        </div>
        
        {/* Service cards grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
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