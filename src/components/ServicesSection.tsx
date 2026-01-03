const GlobeIcon = () => (
  <svg viewBox="0 0 200 200" className="w-32 h-32 md:w-40 md:h-40 lg:w-48 lg:h-48 drop-shadow-2xl">
    <defs>
      <radialGradient id="globeGold" cx="35%" cy="25%" r="65%" fx="35%" fy="25%">
        <stop offset="0%" stopColor="#FFE066" />
        <stop offset="40%" stopColor="#D4A017" />
        <stop offset="70%" stopColor="#B8860B" />
        <stop offset="100%" stopColor="#8B6914" />
      </radialGradient>
      <linearGradient id="globeStand" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#D4A017" />
        <stop offset="50%" stopColor="#8B6914" />
        <stop offset="100%" stopColor="#5C4409" />
      </linearGradient>
      <linearGradient id="globeBase" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#F4D03F" />
        <stop offset="100%" stopColor="#8B6914" />
      </linearGradient>
      <filter id="globeGlow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="4" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
    
    {/* Globe sphere */}
    <circle cx="100" cy="75" r="55" fill="url(#globeGold)" filter="url(#globeGlow)" />
    
    {/* Longitude lines */}
    <ellipse cx="100" cy="75" rx="55" ry="20" fill="none" stroke="#5C4409" strokeWidth="2" opacity="0.6" />
    <ellipse cx="100" cy="75" rx="20" ry="55" fill="none" stroke="#5C4409" strokeWidth="2" opacity="0.6" />
    <ellipse cx="100" cy="75" rx="40" ry="55" fill="none" stroke="#5C4409" strokeWidth="1.5" opacity="0.4" />
    
    {/* Latitude lines */}
    <line x1="45" y1="75" x2="155" y2="75" stroke="#5C4409" strokeWidth="2" opacity="0.6" />
    <ellipse cx="100" cy="55" rx="45" ry="14" fill="none" stroke="#5C4409" strokeWidth="1" opacity="0.4" />
    <ellipse cx="100" cy="95" rx="45" ry="14" fill="none" stroke="#5C4409" strokeWidth="1" opacity="0.4" />
    
    {/* Continents (simplified) */}
    <path d="M75 55 Q85 50 95 55 Q100 60 95 70 Q85 75 80 68 Q72 60 75 55" fill="#A67C00" opacity="0.5" />
    <path d="M110 60 Q125 55 135 65 Q140 75 130 85 Q120 88 115 80 Q105 70 110 60" fill="#A67C00" opacity="0.5" />
    <path d="M60 80 Q70 78 75 85 Q78 95 70 100 Q60 98 58 90 Q55 82 60 80" fill="#A67C00" opacity="0.4" />
    
    {/* Highlight */}
    <ellipse cx="80" cy="55" rx="20" ry="12" fill="#FFE55C" opacity="0.3" />
    
    {/* Stand arc */}
    <path d="M55 140 Q100 125 145 140" fill="none" stroke="url(#globeStand)" strokeWidth="5" strokeLinecap="round" />
    
    {/* Stand pole */}
    <rect x="96" y="130" width="8" height="22" fill="url(#globeStand)" />
    
    {/* Base */}
    <ellipse cx="100" cy="165" rx="35" ry="10" fill="url(#globeBase)" />
    <ellipse cx="100" cy="160" rx="35" ry="10" fill="#F4D03F" opacity="0.4" />
    
    {/* Base decorative balls */}
    <circle cx="65" cy="163" r="5" fill="#F4D03F" />
    <circle cx="135" cy="163" r="5" fill="#F4D03F" />
  </svg>
);

const HandshakeIcon = () => (
  <svg viewBox="0 0 200 160" className="w-32 h-28 md:w-40 md:h-32 lg:w-48 lg:h-40 drop-shadow-2xl">
    <defs>
      <radialGradient id="handGold" cx="40%" cy="30%" r="60%">
        <stop offset="0%" stopColor="#FFE066" />
        <stop offset="50%" stopColor="#D4A017" />
        <stop offset="100%" stopColor="#8B6914" />
      </radialGradient>
      <linearGradient id="sleeveL" x1="100%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#3D5A4C" />
        <stop offset="50%" stopColor="#2A3D33" />
        <stop offset="100%" stopColor="#1A2820" />
      </linearGradient>
      <linearGradient id="sleeveR" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#3D5A4C" />
        <stop offset="50%" stopColor="#2A3D33" />
        <stop offset="100%" stopColor="#1A2820" />
      </linearGradient>
      <filter id="handGlow" x="-30%" y="-30%" width="160%" height="160%">
        <feGaussianBlur stdDeviation="3" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
    
    {/* Left sleeve (dark green suit) */}
    <path d="M5 130 L5 70 L45 50 L70 80 L55 100 L20 100 Z" fill="url(#sleeveL)" />
    <path d="M5 70 L45 50" stroke="#4A6B5A" strokeWidth="2" />
    
    {/* Right sleeve (dark green suit) */}
    <path d="M195 130 L195 70 L155 50 L130 80 L145 100 L180 100 Z" fill="url(#sleeveR)" />
    <path d="M195 70 L155 50" stroke="#4A6B5A" strokeWidth="2" />
    
    {/* Left hand */}
    <path 
      d="M55 80 Q70 68 90 75 L110 82 Q115 78 112 72 L100 65 Q95 60 100 55 Q108 48 115 55 L130 72"
      fill="url(#handGold)" 
      filter="url(#handGlow)"
    />
    
    {/* Right hand */}
    <path 
      d="M145 80 Q130 68 110 75"
      fill="url(#handGold)"
      filter="url(#handGlow)"
    />
    
    {/* Main handshake area */}
    <ellipse cx="100" cy="78" rx="28" ry="18" fill="url(#handGold)" filter="url(#handGlow)" />
    
    {/* Fingers */}
    <ellipse cx="72" cy="82" rx="10" ry="7" fill="url(#handGold)" />
    <ellipse cx="128" cy="82" rx="10" ry="7" fill="url(#handGold)" />
    
    {/* Highlights */}
    <path d="M80 72 Q90 65 100 70" fill="none" stroke="#FFE55C" strokeWidth="3" opacity="0.5" />
    <path d="M100 70 Q110 65 120 72" fill="none" stroke="#FFE55C" strokeWidth="3" opacity="0.5" />
    
    {/* Cuff details */}
    <rect x="50" y="95" width="20" height="5" fill="#D4A017" opacity="0.3" />
    <rect x="130" y="95" width="20" height="5" fill="#D4A017" opacity="0.3" />
  </svg>
);

const BarsIcon = () => (
  <svg viewBox="0 0 200 180" className="w-32 h-28 md:w-40 md:h-36 lg:w-48 lg:h-44 drop-shadow-2xl">
    <defs>
      <linearGradient id="barGold" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#FFE066" />
        <stop offset="50%" stopColor="#D4A017" />
        <stop offset="100%" stopColor="#B8860B" />
      </linearGradient>
      <linearGradient id="barSide" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#8B6914" />
        <stop offset="100%" stopColor="#5C4409" />
      </linearGradient>
      <linearGradient id="barTop" x1="0%" y1="100%" x2="0%" y2="0%">
        <stop offset="0%" stopColor="#D4A017" />
        <stop offset="100%" stopColor="#FFE55C" />
      </linearGradient>
      <linearGradient id="coinGold" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#FFE55C" />
        <stop offset="50%" stopColor="#D4A017" />
        <stop offset="100%" stopColor="#8B6914" />
      </linearGradient>
      <filter id="barGlow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="2" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
    
    {/* Tall bar (back) */}
    <rect x="95" y="15" width="35" height="120" fill="url(#barGold)" filter="url(#barGlow)" />
    <rect x="130" y="15" width="10" height="120" fill="url(#barSide)" />
    <rect x="95" y="15" width="45" height="8" fill="url(#barTop)" />
    
    {/* Medium bar (front-right) */}
    <rect x="115" y="55" width="35" height="80" fill="url(#barGold)" filter="url(#barGlow)" />
    <rect x="150" y="55" width="10" height="80" fill="url(#barSide)" />
    <rect x="115" y="55" width="45" height="8" fill="url(#barTop)" />
    
    {/* Short bar (front) */}
    <rect x="75" y="85" width="35" height="50" fill="url(#barGold)" filter="url(#barGlow)" />
    <rect x="110" y="85" width="10" height="50" fill="url(#barSide)" />
    <rect x="75" y="85" width="45" height="8" fill="url(#barTop)" />
    
    {/* Coin stack left */}
    {[0, 8, 16, 24, 32].map((offset, i) => (
      <g key={i}>
        <ellipse cx="40" cy={135 - offset} rx="22" ry="7" fill="url(#coinGold)" />
        <rect x="18" y={135 - offset - 5} width="44" height="5" fill="url(#barGold)" />
        <ellipse cx="40" cy={130 - offset} rx="22" ry="7" fill="url(#barTop)" opacity="0.8" />
      </g>
    ))}
    
    {/* Coin stack right */}
    {[0, 8, 16].map((offset, i) => (
      <g key={i}>
        <ellipse cx="170" cy={135 - offset} rx="18" ry="6" fill="url(#coinGold)" />
        <rect x="152" y={135 - offset - 4} width="36" height="4" fill="url(#barGold)" />
        <ellipse cx="170" cy={131 - offset} rx="18" ry="6" fill="url(#barTop)" opacity="0.8" />
      </g>
    ))}
  </svg>
);

const NetworkIcon = () => (
  <svg viewBox="0 0 180 180" className="w-32 h-32 md:w-40 md:h-40 lg:w-48 lg:h-48 drop-shadow-2xl">
    <defs>
      <radialGradient id="sphereGold" cx="35%" cy="25%" r="65%">
        <stop offset="0%" stopColor="#FFE55C" />
        <stop offset="50%" stopColor="#D4A017" />
        <stop offset="100%" stopColor="#8B6914" />
      </radialGradient>
      <linearGradient id="rodGold" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#D4A017" />
        <stop offset="50%" stopColor="#B8860B" />
        <stop offset="100%" stopColor="#8B6914" />
      </linearGradient>
      <filter id="sphereGlow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="3" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
    
    {/* Connecting rods */}
    <line x1="90" y1="90" x2="35" y2="35" stroke="url(#rodGold)" strokeWidth="8" strokeLinecap="round" />
    <line x1="90" y1="90" x2="145" y2="35" stroke="url(#rodGold)" strokeWidth="8" strokeLinecap="round" />
    <line x1="90" y1="90" x2="35" y2="145" stroke="url(#rodGold)" strokeWidth="8" strokeLinecap="round" />
    <line x1="90" y1="90" x2="145" y2="145" stroke="url(#rodGold)" strokeWidth="8" strokeLinecap="round" />
    <line x1="90" y1="90" x2="90" y2="25" stroke="url(#rodGold)" strokeWidth="8" strokeLinecap="round" />
    <line x1="90" y1="90" x2="90" y2="155" stroke="url(#rodGold)" strokeWidth="8" strokeLinecap="round" />
    
    {/* Secondary rods */}
    <line x1="35" y1="35" x2="90" y2="25" stroke="url(#rodGold)" strokeWidth="5" strokeLinecap="round" />
    <line x1="145" y1="35" x2="90" y2="25" stroke="url(#rodGold)" strokeWidth="5" strokeLinecap="round" />
    
    {/* Center sphere (largest) */}
    <circle cx="90" cy="90" r="22" fill="url(#sphereGold)" filter="url(#sphereGlow)" />
    <ellipse cx="82" cy="80" rx="8" ry="6" fill="#FFE55C" opacity="0.5" />
    
    {/* Corner spheres */}
    <circle cx="35" cy="35" r="16" fill="url(#sphereGold)" filter="url(#sphereGlow)" />
    <ellipse cx="30" cy="30" rx="5" ry="4" fill="#FFE55C" opacity="0.5" />
    
    <circle cx="145" cy="35" r="16" fill="url(#sphereGold)" filter="url(#sphereGlow)" />
    <ellipse cx="140" cy="30" rx="5" ry="4" fill="#FFE55C" opacity="0.5" />
    
    <circle cx="35" cy="145" r="16" fill="url(#sphereGold)" filter="url(#sphereGlow)" />
    <ellipse cx="30" cy="140" rx="5" ry="4" fill="#FFE55C" opacity="0.5" />
    
    <circle cx="145" cy="145" r="16" fill="url(#sphereGold)" filter="url(#sphereGlow)" />
    <ellipse cx="140" cy="140" rx="5" ry="4" fill="#FFE55C" opacity="0.5" />
    
    {/* Top/bottom spheres */}
    <circle cx="90" cy="25" r="14" fill="url(#sphereGold)" filter="url(#sphereGlow)" />
    <ellipse cx="85" cy="20" rx="4" ry="3" fill="#FFE55C" opacity="0.5" />
    
    <circle cx="90" cy="155" r="14" fill="url(#sphereGold)" filter="url(#sphereGlow)" />
    <ellipse cx="85" cy="150" rx="4" ry="3" fill="#FFE55C" opacity="0.5" />
  </svg>
);

interface ServiceCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const ServiceCard = ({ icon, title, description }: ServiceCardProps) => (
  <div className="flex flex-col items-center group">
    {/* 3D Icon floating above cube */}
    <div className="relative z-10 mb-[-60px] transform group-hover:scale-105 transition-transform duration-300">
      {icon}
    </div>
    
    {/* 3D Black cube pedestal */}
    <div 
      className="relative w-full"
      style={{
        perspective: '800px',
        transformStyle: 'preserve-3d',
      }}
    >
      <div
        className="relative w-full min-h-[220px] md:min-h-[240px] flex flex-col items-center justify-start pt-16 md:pt-20 pb-6"
        style={{
          background: 'linear-gradient(180deg, #2a2a2a 0%, #1f1f1f 30%, #151515 70%, #0a0a0a 100%)',
          boxShadow: `
            0 30px 60px rgba(0,0,0,0.8),
            0 15px 25px rgba(0,0,0,0.6),
            inset 0 1px 0 rgba(255,255,255,0.08),
            inset 0 -1px 0 rgba(0,0,0,0.5)
          `,
          border: '1px solid rgba(60, 60, 60, 0.3)',
          borderTop: '1px solid rgba(80, 80, 80, 0.4)',
        }}
      >
        {/* Top edge shine */}
        <div 
          className="absolute top-0 left-0 right-0 h-[2px]"
          style={{
            background: 'linear-gradient(90deg, transparent 0%, rgba(100,100,100,0.3) 20%, rgba(150,150,150,0.4) 50%, rgba(100,100,100,0.3) 80%, transparent 100%)'
          }}
        />
        
        {/* Decorative gold divider */}
        <div className="flex items-center justify-center gap-1.5 mb-4">
          <div className="w-6 h-[1px] bg-gradient-to-r from-transparent to-[#D4A017]" />
          <span className="w-1.5 h-1.5 rounded-full bg-[#D4A017] shadow-[0_0_6px_#D4A017]" />
          <span className="w-1 h-1 rounded-full bg-[#D4A017] opacity-60" />
          <span className="w-1.5 h-1.5 rounded-full bg-[#D4A017] shadow-[0_0_6px_#D4A017]" />
          <div className="w-6 h-[1px] bg-gradient-to-l from-transparent to-[#D4A017]" />
        </div>
        
        {/* Title */}
        <h3 
          className="text-lg md:text-xl lg:text-2xl font-semibold text-center mb-3 px-3 leading-tight"
          style={{ 
            fontFamily: "'Poppins', sans-serif",
            color: '#D4A017',
            textShadow: '0 2px 10px rgba(212, 160, 23, 0.3)'
          }}
        >
          {title}
        </h3>
        
        {/* Description */}
        <p 
          className="text-sm md:text-base text-center leading-relaxed px-4 max-w-[220px]"
          style={{ 
            color: 'rgba(200, 200, 200, 0.85)',
            fontFamily: "'Poppins', sans-serif",
            fontWeight: 300
          }}
        >
          {description}
        </p>
      </div>
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
      icon: <BarsIcon />,
      title: "End-to-End Solutions",
      description: "Comprehensive services from investment to management",
    },
    {
      icon: <NetworkIcon />,
      title: "Trusted Network",
      description: "Trusted global connections for strategic partnerships opportunities",
    },
  ];

  return (
    <section 
      className="relative w-full min-h-screen overflow-hidden py-16 md:py-24"
      style={{ 
        background: 'linear-gradient(180deg, #080808 0%, #0a0a0a 30%, #0d0b08 60%, #0a0808 100%)'
      }}
    >
      {/* Warm ambient glow - bottom */}
      <div 
        className="absolute bottom-0 left-0 right-0 h-[70%] pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 80% 50% at 50% 100%, rgba(180, 100, 30, 0.15) 0%, rgba(120, 70, 20, 0.08) 40%, transparent 70%)'
        }}
      />
      
      {/* Warm ambient glow - top corners */}
      <div 
        className="absolute top-0 left-0 w-[50%] h-[60%] pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 0% 0%, rgba(160, 100, 30, 0.12) 0%, transparent 50%)'
        }}
      />
      <div 
        className="absolute top-0 right-0 w-[50%] h-[60%] pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 100% 0%, rgba(160, 100, 30, 0.12) 0%, transparent 50%)'
        }}
      />
      
      {/* Bokeh particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 60 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              width: `${4 + Math.random() * 12}px`,
              height: `${4 + Math.random() * 12}px`,
              left: `${Math.random() * 100}%`,
              top: `${20 + Math.random() * 70}%`,
              background: `radial-gradient(circle, rgba(212, 140, 20, ${0.2 + Math.random() * 0.4}) 0%, transparent 70%)`,
              filter: `blur(${1 + Math.random() * 2}px)`,
            }}
          />
        ))}
      </div>
      
      {/* Ground reflection effect */}
      <div 
        className="absolute bottom-0 left-0 right-0 h-[30%] pointer-events-none"
        style={{
          background: 'linear-gradient(to top, rgba(180, 100, 30, 0.08) 0%, transparent 100%)'
        }}
      />
      
      <div className="relative z-10 container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12 md:mb-20">
          <h1 
            className="text-4xl md:text-5xl lg:text-[56px] font-light text-white mb-4 md:mb-6 leading-[1.2]"
            style={{ 
              fontFamily: "'Poppins', sans-serif",
              letterSpacing: '0.02em'
            }}
          >
            Why <span style={{ color: '#D4A017' }}>JJ Global Capital</span>
          </h1>
          <p 
            className="text-base md:text-lg lg:text-xl font-light mb-8"
            style={{ 
              fontFamily: "'Poppins', sans-serif",
              color: 'rgba(180, 180, 180, 0.9)',
              letterSpacing: '0.03em'
            }}
          >
            Where property, lifestyle, and expertise converge
          </p>
          <div 
            className="w-20 h-[2px] mx-auto"
            style={{
              background: 'linear-gradient(90deg, transparent, #D4A017, transparent)'
            }}
          />
        </div>
        
        {/* Four cubes in a row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-4 lg:gap-6 max-w-7xl mx-auto">
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
