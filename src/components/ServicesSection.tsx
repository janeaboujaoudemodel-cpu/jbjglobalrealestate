import { cn } from "@/lib/utils";

const GlobeIcon = () => (
  <svg viewBox="0 0 100 100" className="w-20 h-20">
    <defs>
      <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="hsl(43, 89%, 65%)" />
        <stop offset="50%" stopColor="hsl(43, 74%, 49%)" />
        <stop offset="100%" stopColor="hsl(36, 77%, 35%)" />
      </linearGradient>
      <linearGradient id="goldShine" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="hsl(43, 89%, 75%)" stopOpacity="0.8" />
        <stop offset="50%" stopColor="hsl(43, 74%, 49%)" stopOpacity="0.3" />
        <stop offset="100%" stopColor="hsl(36, 77%, 35%)" stopOpacity="0.8" />
      </linearGradient>
      <filter id="glow">
        <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
        <feMerge>
          <feMergeNode in="coloredBlur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>
    {/* Globe base */}
    <circle cx="50" cy="50" r="35" fill="none" stroke="url(#goldGradient)" strokeWidth="3" filter="url(#glow)" />
    {/* Latitude lines */}
    <ellipse cx="50" cy="50" rx="35" ry="12" fill="none" stroke="url(#goldGradient)" strokeWidth="2" />
    <ellipse cx="50" cy="50" rx="35" ry="25" fill="none" stroke="url(#goldGradient)" strokeWidth="1.5" opacity="0.7" />
    {/* Longitude line */}
    <ellipse cx="50" cy="50" rx="12" ry="35" fill="none" stroke="url(#goldGradient)" strokeWidth="2" />
    {/* Center vertical line */}
    <line x1="50" y1="15" x2="50" y2="85" stroke="url(#goldGradient)" strokeWidth="1.5" opacity="0.5" />
    {/* Shine effect */}
    <circle cx="35" cy="35" r="8" fill="url(#goldShine)" opacity="0.4" />
  </svg>
);

const HandshakeIcon = () => (
  <svg viewBox="0 0 100 100" className="w-20 h-20">
    <defs>
      <linearGradient id="goldGradient2" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="hsl(43, 89%, 65%)" />
        <stop offset="50%" stopColor="hsl(43, 74%, 49%)" />
        <stop offset="100%" stopColor="hsl(36, 77%, 35%)" />
      </linearGradient>
      <filter id="glow2">
        <feGaussianBlur stdDeviation="1.5" result="coloredBlur"/>
        <feMerge>
          <feMergeNode in="coloredBlur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>
    {/* Left hand */}
    <path
      d="M15 55 L25 50 L35 52 L45 48 L50 50"
      fill="none"
      stroke="url(#goldGradient2)"
      strokeWidth="4"
      strokeLinecap="round"
      strokeLinejoin="round"
      filter="url(#glow2)"
    />
    {/* Right hand */}
    <path
      d="M85 55 L75 50 L65 52 L55 48 L50 50"
      fill="none"
      stroke="url(#goldGradient2)"
      strokeWidth="4"
      strokeLinecap="round"
      strokeLinejoin="round"
      filter="url(#glow2)"
    />
    {/* Handshake center */}
    <path
      d="M45 48 Q50 44 55 48"
      fill="none"
      stroke="url(#goldGradient2)"
      strokeWidth="4"
      strokeLinecap="round"
      filter="url(#glow2)"
    />
    {/* Sleeve left */}
    <path
      d="M10 60 L10 45 L20 42"
      fill="none"
      stroke="url(#goldGradient2)"
      strokeWidth="3"
      strokeLinecap="round"
      opacity="0.8"
    />
    {/* Sleeve right */}
    <path
      d="M90 60 L90 45 L80 42"
      fill="none"
      stroke="url(#goldGradient2)"
      strokeWidth="3"
      strokeLinecap="round"
      opacity="0.8"
    />
    {/* Decorative circles */}
    <circle cx="50" cy="35" r="5" fill="none" stroke="url(#goldGradient2)" strokeWidth="2" opacity="0.5" />
    <circle cx="50" cy="65" r="5" fill="none" stroke="url(#goldGradient2)" strokeWidth="2" opacity="0.5" />
  </svg>
);

const CoinsIcon = () => (
  <svg viewBox="0 0 100 100" className="w-20 h-20">
    <defs>
      <linearGradient id="goldGradient3" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="hsl(43, 89%, 65%)" />
        <stop offset="50%" stopColor="hsl(43, 74%, 49%)" />
        <stop offset="100%" stopColor="hsl(36, 77%, 35%)" />
      </linearGradient>
      <linearGradient id="coinFace" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="hsl(43, 89%, 70%)" />
        <stop offset="100%" stopColor="hsl(36, 77%, 40%)" />
      </linearGradient>
      <filter id="glow3">
        <feGaussianBlur stdDeviation="1.5" result="coloredBlur"/>
        <feMerge>
          <feMergeNode in="coloredBlur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>
    {/* Back coin */}
    <ellipse cx="55" cy="35" rx="25" ry="10" fill="url(#coinFace)" opacity="0.6" />
    <ellipse cx="55" cy="35" rx="25" ry="10" fill="none" stroke="url(#goldGradient3)" strokeWidth="2" />
    <ellipse cx="55" cy="40" rx="25" ry="10" fill="none" stroke="url(#goldGradient3)" strokeWidth="2" opacity="0.4" />
    
    {/* Middle coin */}
    <ellipse cx="50" cy="50" rx="25" ry="10" fill="url(#coinFace)" opacity="0.7" />
    <ellipse cx="50" cy="50" rx="25" ry="10" fill="none" stroke="url(#goldGradient3)" strokeWidth="2" filter="url(#glow3)" />
    <ellipse cx="50" cy="55" rx="25" ry="10" fill="none" stroke="url(#goldGradient3)" strokeWidth="2" opacity="0.5" />
    
    {/* Front coin */}
    <ellipse cx="45" cy="65" rx="25" ry="10" fill="url(#coinFace)" opacity="0.9" />
    <ellipse cx="45" cy="65" rx="25" ry="10" fill="none" stroke="url(#goldGradient3)" strokeWidth="2.5" filter="url(#glow3)" />
    <ellipse cx="45" cy="70" rx="25" ry="10" fill="none" stroke="url(#goldGradient3)" strokeWidth="2" opacity="0.6" />
    
    {/* Dollar symbol on front coin */}
    <text x="45" y="68" textAnchor="middle" fill="url(#goldGradient3)" fontSize="12" fontWeight="bold">$</text>
  </svg>
);

const NetworkIcon = () => (
  <svg viewBox="0 0 100 100" className="w-20 h-20">
    <defs>
      <linearGradient id="goldGradient4" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="hsl(43, 89%, 65%)" />
        <stop offset="50%" stopColor="hsl(43, 74%, 49%)" />
        <stop offset="100%" stopColor="hsl(36, 77%, 35%)" />
      </linearGradient>
      <filter id="glow4">
        <feGaussianBlur stdDeviation="1.5" result="coloredBlur"/>
        <feMerge>
          <feMergeNode in="coloredBlur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>
    {/* Connection lines */}
    <line x1="50" y1="50" x2="25" y2="25" stroke="url(#goldGradient4)" strokeWidth="2" opacity="0.6" />
    <line x1="50" y1="50" x2="75" y2="25" stroke="url(#goldGradient4)" strokeWidth="2" opacity="0.6" />
    <line x1="50" y1="50" x2="25" y2="75" stroke="url(#goldGradient4)" strokeWidth="2" opacity="0.6" />
    <line x1="50" y1="50" x2="75" y2="75" stroke="url(#goldGradient4)" strokeWidth="2" opacity="0.6" />
    <line x1="50" y1="50" x2="50" y2="15" stroke="url(#goldGradient4)" strokeWidth="2" opacity="0.6" />
    <line x1="50" y1="50" x2="50" y2="85" stroke="url(#goldGradient4)" strokeWidth="2" opacity="0.6" />
    <line x1="50" y1="50" x2="15" y2="50" stroke="url(#goldGradient4)" strokeWidth="2" opacity="0.6" />
    <line x1="50" y1="50" x2="85" y2="50" stroke="url(#goldGradient4)" strokeWidth="2" opacity="0.6" />
    
    {/* Center node */}
    <circle cx="50" cy="50" r="10" fill="url(#goldGradient4)" filter="url(#glow4)" />
    
    {/* Outer nodes */}
    <circle cx="25" cy="25" r="6" fill="url(#goldGradient4)" filter="url(#glow4)" opacity="0.9" />
    <circle cx="75" cy="25" r="6" fill="url(#goldGradient4)" filter="url(#glow4)" opacity="0.9" />
    <circle cx="25" cy="75" r="6" fill="url(#goldGradient4)" filter="url(#glow4)" opacity="0.9" />
    <circle cx="75" cy="75" r="6" fill="url(#goldGradient4)" filter="url(#glow4)" opacity="0.9" />
    <circle cx="50" cy="15" r="5" fill="url(#goldGradient4)" filter="url(#glow4)" opacity="0.8" />
    <circle cx="50" cy="85" r="5" fill="url(#goldGradient4)" filter="url(#glow4)" opacity="0.8" />
    <circle cx="15" cy="50" r="5" fill="url(#goldGradient4)" filter="url(#glow4)" opacity="0.8" />
    <circle cx="85" cy="50" r="5" fill="url(#goldGradient4)" filter="url(#glow4)" opacity="0.8" />
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
      "relative flex flex-col items-center p-8 rounded-xl",
      "bg-premium-card border border-premium-card-border",
      "hover:border-gold/30 transition-all duration-300",
      "group",
      className
    )}
  >
    {/* Icon container with float animation */}
    <div className="mb-6 animate-float">
      {icon}
    </div>
    
    {/* Gold accent line */}
    <div className="w-16 h-0.5 bg-gradient-to-r from-transparent via-gold to-transparent mb-4" />
    
    {/* Title */}
    <h3 className="text-xl font-semibold text-gold mb-4 text-center tracking-wide">
      {title}
    </h3>
    
    {/* Description */}
    <p className="text-gray-400 text-center text-sm leading-relaxed">
      {description}
    </p>
    
    {/* Bottom accent line */}
    <div className="w-12 h-0.5 bg-gradient-to-r from-transparent via-gold/50 to-transparent mt-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
  </div>
);

// Sparkle particle component
const Sparkle = ({ style }: { style: React.CSSProperties }) => (
  <div
    className="absolute w-1 h-1 bg-gold rounded-full animate-sparkle"
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

  // Generate random sparkle positions
  const sparkles = Array.from({ length: 30 }, (_, i) => ({
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
    animationDelay: `${Math.random() * 3}s`,
    opacity: 0.3 + Math.random() * 0.4,
  }));

  return (
    <section className="relative w-full min-h-screen bg-premium-bg overflow-hidden">
      {/* Sparkle background */}
      <div className="absolute inset-0 pointer-events-none">
        {sparkles.map((sparkle, i) => (
          <Sparkle key={i} style={sparkle} />
        ))}
      </div>
      
      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/30 pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_0%,_hsl(220,25%,8%)_70%)] pointer-events-none" />
      
      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 py-20">
        {/* Section header */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="w-24 h-px bg-gradient-to-r from-transparent via-gold to-transparent" />
            <span className="text-gold text-sm tracking-[0.3em] uppercase font-medium">
              Our Services
            </span>
            <div className="w-24 h-px bg-gradient-to-r from-transparent via-gold to-transparent" />
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Premium <span className="text-gold">Financial</span> Excellence
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Delivering world-class investment solutions through our four pillars of exceptional service
          </p>
        </div>
        
        {/* Service cards grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
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