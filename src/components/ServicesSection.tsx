import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";

const INQUIRY_FORM_URL = "https://jjglobalcapital.com/form/property-investment-inquiry-form/";

const services = [
  {
    title: "Property Management",
    description: "Professional property management services for your UAE investments",
    gradient: "from-blue-500/20 via-cyan-500/10 to-blue-600/20",
    iconGradient: "from-blue-400 to-cyan-400",
  },
  {
    title: "Investment Advisory",
    description: "Expert guidance on real estate investment strategies",
    gradient: "from-emerald-500/20 via-green-500/10 to-emerald-600/20",
    iconGradient: "from-emerald-400 to-green-400",
  },
  {
    title: "Mortgage Advisory",
    description: "Tailored mortgage solutions for property financing",
    gradient: "from-amber-500/20 via-orange-500/10 to-amber-600/20",
    iconGradient: "from-amber-400 to-orange-400",
  },
  {
    title: "Legal Services",
    description: "Real estate law firm expertise for transactions",
    gradient: "from-purple-500/20 via-violet-500/10 to-purple-600/20",
    iconGradient: "from-purple-400 to-violet-400",
  },
  {
    title: "Architecture",
    description: "Innovative architectural design solutions",
    gradient: "from-rose-500/20 via-pink-500/10 to-rose-600/20",
    iconGradient: "from-rose-400 to-pink-400",
  },
  {
    title: "Interior Design & Fit Out",
    description: "Luxury interior design and complete fit-out services",
    gradient: "from-gold/20 via-amber-500/10 to-gold-dark/20",
    iconGradient: "from-gold to-gold-dark",
  },
];

// Premium 3D icon component
const Premium3DIcon = ({ title, gradient }: { title: string; gradient: string }) => {
  const getIconPath = () => {
    switch (title) {
      case "Property Management":
        return (
          <g>
            <rect x="8" y="12" width="28" height="20" rx="2" fill="url(#iconGrad)" opacity="0.9"/>
            <rect x="4" y="16" width="28" height="16" rx="2" fill="url(#iconGrad)"/>
            <rect x="12" y="20" width="4" height="4" fill="white" opacity="0.8"/>
            <rect x="20" y="20" width="4" height="4" fill="white" opacity="0.8"/>
            <rect x="12" y="26" width="4" height="4" fill="white" opacity="0.8"/>
            <rect x="20" y="26" width="4" height="4" fill="white" opacity="0.8"/>
            <polygon points="18,4 4,16 32,16" fill="url(#iconGrad)"/>
          </g>
        );
      case "Investment Advisory":
        return (
          <g>
            <circle cx="20" cy="20" r="14" fill="url(#iconGrad)" opacity="0.3"/>
            <path d="M20 8 L20 20 L30 20" stroke="url(#iconGrad)" strokeWidth="3" fill="none"/>
            <circle cx="20" cy="20" r="10" stroke="url(#iconGrad)" strokeWidth="2" fill="none"/>
            <path d="M12 28 L16 24 L22 26 L28 18" stroke="white" strokeWidth="2" fill="none" opacity="0.8"/>
          </g>
        );
      case "Mortgage Advisory":
        return (
          <g>
            <rect x="6" y="10" width="28" height="20" rx="3" fill="url(#iconGrad)" opacity="0.9"/>
            <rect x="10" y="14" width="20" height="2" fill="white" opacity="0.6"/>
            <rect x="10" y="18" width="14" height="2" fill="white" opacity="0.6"/>
            <circle cx="28" cy="22" r="6" fill="white" opacity="0.8"/>
            <text x="28" y="25" textAnchor="middle" fontSize="8" fill="url(#iconGrad)">%</text>
          </g>
        );
      case "Legal Services":
        return (
          <g>
            <rect x="16" y="4" width="8" height="32" fill="url(#iconGrad)"/>
            <rect x="4" y="8" width="32" height="4" fill="url(#iconGrad)"/>
            <circle cx="8" cy="16" r="4" fill="white" opacity="0.8"/>
            <circle cx="32" cy="16" r="4" fill="white" opacity="0.8"/>
            <rect x="6" y="16" width="4" height="12" fill="url(#iconGrad)"/>
            <rect x="30" y="16" width="4" height="12" fill="url(#iconGrad)"/>
            <rect x="4" y="32" width="32" height="4" fill="url(#iconGrad)"/>
          </g>
        );
      case "Architecture":
        return (
          <g>
            <polygon points="20,4 4,18 36,18" fill="url(#iconGrad)" opacity="0.8"/>
            <rect x="8" y="18" width="24" height="16" fill="url(#iconGrad)"/>
            <rect x="14" y="24" width="12" height="10" fill="white" opacity="0.3"/>
            <line x1="12" y1="18" x2="12" y2="34" stroke="white" strokeWidth="1" opacity="0.5"/>
            <line x1="28" y1="18" x2="28" y2="34" stroke="white" strokeWidth="1" opacity="0.5"/>
          </g>
        );
      case "Interior Design & Fit Out":
        return (
          <g>
            <rect x="8" y="12" width="24" height="16" rx="2" fill="url(#iconGrad)" opacity="0.6"/>
            <rect x="12" y="28" width="16" height="6" fill="url(#iconGrad)"/>
            <ellipse cx="20" cy="20" rx="6" ry="4" fill="white" opacity="0.8"/>
            <path d="M6 16 Q20 4 34 16" stroke="url(#iconGrad)" strokeWidth="3" fill="none"/>
          </g>
        );
      default:
        return null;
    }
  };

  return (
    <div className="relative w-16 h-16 md:w-20 md:h-20">
      {/* 3D Shadow layers */}
      <div className="absolute inset-0 translate-x-1 translate-y-1 rounded-2xl bg-black/40 blur-sm" />
      <div className="absolute inset-0 translate-x-0.5 translate-y-0.5 rounded-2xl bg-black/20" />
      
      {/* Main icon container */}
      <div className={`relative w-full h-full rounded-2xl bg-gradient-to-br ${gradient} border border-white/10 flex items-center justify-center overflow-hidden backdrop-blur-sm`}>
        {/* Inner glow */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
        
        <svg viewBox="0 0 40 40" className="w-10 h-10 md:w-12 md:h-12 relative z-10">
          <defs>
            <linearGradient id="iconGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#D4AF37" />
              <stop offset="100%" stopColor="#A8925A" />
            </linearGradient>
          </defs>
          {getIconPath()}
        </svg>
      </div>
    </div>
  );
};

const ServicesSection = () => {
  return (
    <section className="relative py-24 overflow-hidden bg-gradient-to-b from-zinc-900 to-black">
      {/* Premium background effects */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-gold/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-[120px] pointer-events-none" />
      </div>
      
      {/* Grid pattern overlay */}
      <div 
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '60px 60px'
        }}
      />
      
      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-16">
          <span className="inline-block px-5 py-2 bg-gradient-to-r from-gold/20 to-gold/5 border border-gold/30 rounded-full text-gold text-sm font-medium mb-6 backdrop-blur-sm">
            Complete Solutions
          </span>
          <h2 
            className="text-4xl md:text-5xl font-bold text-white mb-6"
            style={{ fontFamily: "Poppins, sans-serif" }}
          >
            Our <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold to-gold-dark">Divisions</span>
          </h2>
          <p className="text-zinc-400 max-w-2xl mx-auto text-lg leading-relaxed">
            Beyond property sales, we offer comprehensive real estate services to support your investment journey through our specialized divisions
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {services.map((service, index) => (
            <a
              key={index}
              href={INQUIRY_FORM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative"
            >
              {/* Card with 3D effect */}
              <div className="relative bg-gradient-to-br from-zinc-900/90 via-zinc-900/80 to-zinc-950/90 border border-zinc-800/50 rounded-2xl p-8 h-full transition-all duration-500 group-hover:border-gold/30 group-hover:-translate-y-2 group-hover:shadow-2xl group-hover:shadow-gold/10 overflow-hidden">
                {/* Gradient overlay on hover */}
                <div className={`absolute inset-0 bg-gradient-to-br ${service.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl`} />
                
                {/* Top accent line */}
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                {/* Content */}
                <div className="relative z-10">
                  {/* 3D Icon */}
                  <div className="mb-6 group-hover:scale-110 transition-transform duration-500">
                    <Premium3DIcon title={service.title} gradient={service.gradient} />
                  </div>

                  {/* Title */}
                  <h3 
                    className="text-xl font-bold text-white mb-3 group-hover:text-gold transition-colors duration-300"
                    style={{ fontFamily: "Poppins, sans-serif" }}
                  >
                    {service.title}
                  </h3>
                  
                  {/* Description */}
                  <p className="text-zinc-400 text-sm leading-relaxed mb-6 group-hover:text-zinc-300 transition-colors">
                    {service.description}
                  </p>

                  {/* CTA */}
                  <div className="flex items-center text-gold text-sm font-medium opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                    <span>Inquire Now</span>
                    <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>

                {/* Bottom glow */}
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-24 bg-gradient-to-t from-gold/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ServicesSection;