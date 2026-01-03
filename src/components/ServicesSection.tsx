import * as React from "react";

type IconProps = React.SVGProps<SVGSVGElement>;

const GlobeIcon = React.forwardRef<SVGSVGElement, IconProps>(({ className, ...props }, ref) => (
  <svg
    ref={ref}
    viewBox="0 0 200 200"
    className={className}
    aria-hidden="true"
    {...props}
  >
    <defs>
      <radialGradient id="jj-globe-gold" cx="35%" cy="25%" r="70%">
        <stop offset="0%" stopColor="hsl(var(--gold-light))" />
        <stop offset="42%" stopColor="hsl(var(--gold))" />
        <stop offset="72%" stopColor="hsl(var(--gold-dark))" />
        <stop offset="100%" stopColor="hsl(var(--gold-dark))" />
      </radialGradient>
      <linearGradient id="jj-globe-stand" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="hsl(var(--gold-light))" />
        <stop offset="45%" stopColor="hsl(var(--gold))" />
        <stop offset="100%" stopColor="hsl(var(--gold-dark))" />
      </linearGradient>
      <filter id="jj-soft-glow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="3.2" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
      <filter id="jj-shadow" x="-50%" y="-50%" width="200%" height="200%">
        <feDropShadow dx="0" dy="10" stdDeviation="6" floodColor="rgba(0,0,0,0.55)" />
      </filter>
    </defs>

    {/* Sphere */}
    <circle cx="100" cy="80" r="56" fill="url(#jj-globe-gold)" filter="url(#jj-soft-glow)" />

    {/* Rings */}
    <ellipse cx="100" cy="80" rx="56" ry="20" fill="none" stroke="hsl(var(--gold-dark))" strokeWidth="2" opacity="0.65" />
    <ellipse cx="100" cy="80" rx="20" ry="56" fill="none" stroke="hsl(var(--gold-dark))" strokeWidth="2" opacity="0.65" />
    <ellipse cx="100" cy="80" rx="40" ry="56" fill="none" stroke="hsl(var(--gold-dark))" strokeWidth="1.6" opacity="0.45" />
    <line x1="44" y1="80" x2="156" y2="80" stroke="hsl(var(--gold-dark))" strokeWidth="2" opacity="0.55" />

    {/* Continents (stylized) */}
    <path
      d="M70 60 Q86 50 98 60 Q104 66 98 76 Q86 82 78 74 Q66 66 70 60"
      fill="hsl(var(--gold-dark))"
      opacity="0.35"
    />
    <path
      d="M112 64 Q130 56 142 68 Q150 78 138 92 Q124 96 116 86 Q104 74 112 64"
      fill="hsl(var(--gold-dark))"
      opacity="0.32"
    />
    <path
      d="M62 92 Q74 90 80 98 Q84 112 72 118 Q60 116 58 104 Q56 94 62 92"
      fill="hsl(var(--gold-dark))"
      opacity="0.26"
    />

    {/* Specular highlight */}
    <ellipse cx="78" cy="58" rx="20" ry="12" fill="hsl(var(--gold-light))" opacity="0.22" />

    {/* Stand arc */}
    <path d="M54 144 Q100 127 146 144" fill="none" stroke="url(#jj-globe-stand)" strokeWidth="6" strokeLinecap="round" filter="url(#jj-shadow)" />
    <rect x="96" y="134" width="8" height="22" fill="url(#jj-globe-stand)" />

    {/* Base */}
    <ellipse cx="100" cy="168" rx="36" ry="10" fill="url(#jj-globe-gold)" filter="url(#jj-shadow)" />
    <ellipse cx="100" cy="164" rx="36" ry="10" fill="hsl(var(--gold-light))" opacity="0.18" />
    <circle cx="66" cy="166" r="5" fill="hsl(var(--gold-light))" />
    <circle cx="134" cy="166" r="5" fill="hsl(var(--gold-light))" />
  </svg>
));
GlobeIcon.displayName = "GlobeIcon";

const HandshakeIcon = React.forwardRef<SVGSVGElement, IconProps>(({ className, ...props }, ref) => (
  <svg
    ref={ref}
    viewBox="0 0 220 160"
    className={className}
    aria-hidden="true"
    {...props}
  >
    <defs>
      <radialGradient id="jj-hand-gold" cx="40%" cy="30%" r="70%">
        <stop offset="0%" stopColor="hsl(var(--gold-light))" />
        <stop offset="50%" stopColor="hsl(var(--gold))" />
        <stop offset="100%" stopColor="hsl(var(--gold-dark))" />
      </radialGradient>
      <linearGradient id="jj-sleeve-l" x1="100%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="hsl(var(--jj-suit))" />
        <stop offset="60%" stopColor="hsl(var(--jj-suit-dark))" />
        <stop offset="100%" stopColor="hsl(155 22% 10%)" />
      </linearGradient>
      <linearGradient id="jj-sleeve-r" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="hsl(var(--jj-suit))" />
        <stop offset="60%" stopColor="hsl(var(--jj-suit-dark))" />
        <stop offset="100%" stopColor="hsl(155 22% 10%)" />
      </linearGradient>
      <filter id="jj-hand-shadow" x="-50%" y="-50%" width="200%" height="200%">
        <feDropShadow dx="0" dy="12" stdDeviation="7" floodColor="rgba(0,0,0,0.6)" />
      </filter>
    </defs>

    {/* Sleeves */}
    <path d="M10 138 L10 74 L58 52 L90 92 L70 112 L26 112 Z" fill="url(#jj-sleeve-l)" />
    <path d="M210 138 L210 74 L162 52 L130 92 L150 112 L194 112 Z" fill="url(#jj-sleeve-r)" />

    {/* Hands */}
    <path
      d="M72 92 Q92 74 118 86 L140 96 Q150 92 146 84 L130 74 Q124 66 130 58 Q140 48 150 58 L170 80"
      fill="url(#jj-hand-gold)"
      filter="url(#jj-hand-shadow)"
    />
    <path d="M148 92 Q128 74 104 84" fill="url(#jj-hand-gold)" filter="url(#jj-hand-shadow)" />

    {/* Center */}
    <ellipse cx="112" cy="92" rx="34" ry="20" fill="url(#jj-hand-gold)" filter="url(#jj-hand-shadow)" />

    {/* Fingers */}
    <ellipse cx="86" cy="98" rx="12" ry="8" fill="url(#jj-hand-gold)" />
    <ellipse cx="138" cy="98" rx="12" ry="8" fill="url(#jj-hand-gold)" />

    {/* Highlights */}
    <path d="M92 84 Q108 74 120 82" fill="none" stroke="hsl(var(--gold-light))" strokeWidth="3.5" opacity="0.45" />
    <path d="M118 82 Q132 74 146 84" fill="none" stroke="hsl(var(--gold-light))" strokeWidth="3.5" opacity="0.45" />

    {/* Cuffs */}
    <rect x="66" y="108" width="26" height="6" fill="hsl(var(--gold))" opacity="0.22" />
    <rect x="128" y="108" width="26" height="6" fill="hsl(var(--gold))" opacity="0.22" />
  </svg>
));
HandshakeIcon.displayName = "HandshakeIcon";

const BarsIcon = React.forwardRef<SVGSVGElement, IconProps>(({ className, ...props }, ref) => (
  <svg
    ref={ref}
    viewBox="0 0 240 180"
    className={className}
    aria-hidden="true"
    {...props}
  >
    <defs>
      <linearGradient id="jj-bar-front" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="hsl(var(--gold-light))" />
        <stop offset="55%" stopColor="hsl(var(--gold))" />
        <stop offset="100%" stopColor="hsl(var(--gold-dark))" />
      </linearGradient>
      <linearGradient id="jj-bar-side" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="hsl(var(--gold-dark))" />
        <stop offset="100%" stopColor="hsl(34 100% 18%)" />
      </linearGradient>
      <linearGradient id="jj-bar-top" x1="0%" y1="100%" x2="0%" y2="0%">
        <stop offset="0%" stopColor="hsl(var(--gold))" />
        <stop offset="100%" stopColor="hsl(var(--gold-light))" />
      </linearGradient>
      <radialGradient id="jj-coin" cx="35%" cy="25%" r="75%">
        <stop offset="0%" stopColor="hsl(var(--gold-light))" />
        <stop offset="55%" stopColor="hsl(var(--gold))" />
        <stop offset="100%" stopColor="hsl(var(--gold-dark))" />
      </radialGradient>
      <filter id="jj-bars-shadow" x="-50%" y="-50%" width="200%" height="200%">
        <feDropShadow dx="0" dy="12" stdDeviation="7" floodColor="rgba(0,0,0,0.6)" />
      </filter>
    </defs>

    {/* Bars */}
    <g filter="url(#jj-bars-shadow)">
      <rect x="118" y="18" width="44" height="112" fill="url(#jj-bar-front)" />
      <rect x="162" y="18" width="12" height="112" fill="url(#jj-bar-side)" />
      <rect x="118" y="18" width="56" height="9" fill="url(#jj-bar-top)" />

      <rect x="142" y="58" width="44" height="72" fill="url(#jj-bar-front)" />
      <rect x="186" y="58" width="12" height="72" fill="url(#jj-bar-side)" />
      <rect x="142" y="58" width="56" height="9" fill="url(#jj-bar-top)" />

      <rect x="92" y="86" width="44" height="44" fill="url(#jj-bar-front)" />
      <rect x="136" y="86" width="12" height="44" fill="url(#jj-bar-side)" />
      <rect x="92" y="86" width="56" height="9" fill="url(#jj-bar-top)" />
    </g>

    {/* Coins left */}
    {[0, 9, 18, 27].map((offset, i) => (
      <g key={i}>
        <ellipse cx="52" cy={132 - offset} rx="24" ry="7.5" fill="url(#jj-coin)" />
        <rect x="28" y={132 - offset - 5} width="48" height="5" fill="url(#jj-bar-front)" opacity="0.95" />
        <ellipse cx="52" cy={127 - offset} rx="24" ry="7.5" fill="url(#jj-bar-top)" opacity="0.9" />
      </g>
    ))}

    {/* Coins right */}
    {[0, 9].map((offset, i) => (
      <g key={i}>
        <ellipse cx="206" cy={132 - offset} rx="18" ry="6" fill="url(#jj-coin)" />
        <rect x="188" y={132 - offset - 4} width="36" height="4" fill="url(#jj-bar-front)" opacity="0.95" />
        <ellipse cx="206" cy={128 - offset} rx="18" ry="6" fill="url(#jj-bar-top)" opacity="0.9" />
      </g>
    ))}
  </svg>
));
BarsIcon.displayName = "BarsIcon";

const NetworkIcon = React.forwardRef<SVGSVGElement, IconProps>(({ className, ...props }, ref) => (
  <svg
    ref={ref}
    viewBox="0 0 200 200"
    className={className}
    aria-hidden="true"
    {...props}
  >
    <defs>
      <radialGradient id="jj-sphere" cx="35%" cy="25%" r="70%">
        <stop offset="0%" stopColor="hsl(var(--gold-light))" />
        <stop offset="55%" stopColor="hsl(var(--gold))" />
        <stop offset="100%" stopColor="hsl(var(--gold-dark))" />
      </radialGradient>
      <linearGradient id="jj-rod" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="hsl(var(--gold))" />
        <stop offset="60%" stopColor="hsl(var(--gold-dark))" />
        <stop offset="100%" stopColor="hsl(34 100% 18%)" />
      </linearGradient>
      <filter id="jj-network-shadow" x="-50%" y="-50%" width="200%" height="200%">
        <feDropShadow dx="0" dy="12" stdDeviation="7" floodColor="rgba(0,0,0,0.6)" />
      </filter>
    </defs>

    <g filter="url(#jj-network-shadow)">
      {/* Rods */}
      <line x1="100" y1="100" x2="44" y2="44" stroke="url(#jj-rod)" strokeWidth="9" strokeLinecap="round" />
      <line x1="100" y1="100" x2="156" y2="44" stroke="url(#jj-rod)" strokeWidth="9" strokeLinecap="round" />
      <line x1="100" y1="100" x2="44" y2="156" stroke="url(#jj-rod)" strokeWidth="9" strokeLinecap="round" />
      <line x1="100" y1="100" x2="156" y2="156" stroke="url(#jj-rod)" strokeWidth="9" strokeLinecap="round" />
      <line x1="100" y1="100" x2="100" y2="30" stroke="url(#jj-rod)" strokeWidth="9" strokeLinecap="round" />

      {/* Spheres */}
      <circle cx="100" cy="100" r="22" fill="url(#jj-sphere)" />
      <ellipse cx="92" cy="90" rx="8" ry="6" fill="hsl(var(--gold-light))" opacity="0.35" />

      <circle cx="44" cy="44" r="16" fill="url(#jj-sphere)" />
      <circle cx="156" cy="44" r="16" fill="url(#jj-sphere)" />
      <circle cx="44" cy="156" r="16" fill="url(#jj-sphere)" />
      <circle cx="156" cy="156" r="16" fill="url(#jj-sphere)" />
      <circle cx="100" cy="30" r="14" fill="url(#jj-sphere)" />

      {/* Small highlights */}
      <ellipse cx="40" cy="40" rx="5" ry="4" fill="hsl(var(--gold-light))" opacity="0.3" />
      <ellipse cx="152" cy="40" rx="5" ry="4" fill="hsl(var(--gold-light))" opacity="0.3" />
      <ellipse cx="40" cy="152" rx="5" ry="4" fill="hsl(var(--gold-light))" opacity="0.3" />
      <ellipse cx="152" cy="152" rx="5" ry="4" fill="hsl(var(--gold-light))" opacity="0.3" />
      <ellipse cx="96" cy="26" rx="4" ry="3" fill="hsl(var(--gold-light))" opacity="0.28" />
    </g>
  </svg>
));
NetworkIcon.displayName = "NetworkIcon";

interface ServiceCardProps {
  icon: React.ReactNode;
  title: React.ReactNode;
  description: string;
}

const ServiceCard = ({ icon, title, description }: ServiceCardProps) => (
  <div className="flex flex-col items-center">
    <div className="jj-icon-slot">{icon}</div>

    <div className="jj-cube px-6 pt-14 pb-8 text-center">
      <div className="jj-cube-topline" aria-hidden="true" />

      <h3 className="jj-gold-text font-semibold text-[22px] leading-tight" style={{ fontFamily: "Poppins, sans-serif" }}>
        {title}
      </h3>

      <div className="jj-ornament" aria-hidden="true">
        <span className="dot-lg" />
        <span className="dot-sm" />
        <span className="dot-lg" />
      </div>

      <p className="text-muted-foreground text-[14px] leading-relaxed" style={{ fontFamily: "Poppins, sans-serif" }}>
        {description}
      </p>
    </div>
  </div>
);

const ServicesSection = () => {
  const services: Array<{ icon: React.ReactNode; title: React.ReactNode; description: string }> = [
    {
      icon: <GlobeIcon className="w-40 h-40" />,
      title: (
        <>
          Global
          <br />
          Advisory
        </>
      ),
      description: "Deep international market insights and bespoke strategies",
    },
    {
      icon: <HandshakeIcon className="w-44 h-32" />,
      title: (
        <>
          Private Client
          <br />
          Approach
        </>
      ),
      description: "Personalized service and tailored investment solutions",
    },
    {
      icon: <BarsIcon className="w-44 h-32" />,
      title: (
        <>
          End-to-End
          <br />
          Solutions
        </>
      ),
      description: "Comprehensive services from investment to management",
    },
    {
      icon: <NetworkIcon className="w-40 h-40" />,
      title: (
        <>
          Trusted
          <br />
          Network
        </>
      ),
      description: "Trusted global connections for strategic partnerships opportunities",
    },
  ];

  return (
    <section className="dark relative jj-services overflow-hidden py-16 md:py-24 font-[Poppins]">
      <div className="relative z-10 container mx-auto px-4">
        <header className="text-center mb-12 md:mb-16">
          <h1
            className="text-foreground text-[40px] md:text-[56px] leading-[1.2] font-light tracking-[0.02em]"
            style={{ fontFamily: "Poppins, sans-serif" }}
          >
            YJJ Global Capital
          </h1>
          <p
            className="mt-3 text-muted-foreground text-[16px] md:text-[18px] tracking-[0.03em]"
            style={{ fontFamily: "Poppins, sans-serif" }}
          >
            Where property, lifestyle, and expertise converge.
          </p>
        </header>

        <div className="mx-auto max-w-7xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-5">
          {services.map((service, idx) => (
            <ServiceCard key={idx} icon={service.icon} title={service.title} description={service.description} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default ServicesSection;
