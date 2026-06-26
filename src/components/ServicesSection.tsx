import { ChevronRight, Play, Volume2, VolumeX, Check, Sparkles } from "lucide-react";
import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import servicesHeroVideoAsset from "@/assets/videos/services-hero.mp4.asset.json";
const servicesHeroVideo = servicesHeroVideoAsset.url;
import { CONTACT_INFO } from "@/constants/stats";

const INQUIRY_FORM_URL = "https://jbj.ae/contact";

// "How We Help" cards - JBJ Global Real Estate core services
const howWeHelp = [
  {
    title: "Buy & Sell Brokerage",
    description: "Expert brokerage support for buying and selling UAE property.",
    gradient: "from-gold/20 via-gold-light/10 to-gold/20",
    iconGradient: "from-gold to-gold-light",
    href: "/properties?transaction=buy",
  },
  {
    title: "Rent Brokerage",
    description: "Residential and commercial rental support.",
    gradient: "from-blue-500/20 via-cyan-500/10 to-blue-600/20",
    iconGradient: "from-blue-400 to-cyan-400",
    href: "/properties?transaction=rent",
  },
  {
    title: "Partner Introductions",
    description: "Introductions to independent licensed partners (legal / mortgage / concierge).",
    gradient: "from-purple-500/20 via-violet-500/10 to-purple-600/20",
    iconGradient: "from-purple-400 to-violet-400",
    href: "/concierge",
  },
];

const services = [
  {
    title: "Holiday Homes",
    description: "Short-term rental support and holiday home operations for UAE property owners.",
    gradient: "from-blue-500/20 via-cyan-500/10 to-blue-600/20",
    iconGradient: "from-blue-400 to-cyan-400",
  },
  {
    title: "Mortgage Partners",
    description: "Introductions and coordination with independent, licensed mortgage specialists.",
    gradient: "from-amber-500/20 via-orange-500/10 to-amber-600/20",
    iconGradient: "from-amber-400 to-orange-400",
  },
  {
    title: "Legal Partners",
    description: "Introductions to independent law firms for conveyancing and legal matters.",
    gradient: "from-purple-500/20 via-violet-500/10 to-purple-600/20",
    iconGradient: "from-purple-400 to-violet-400",
  },
  {
    title: "Design & Build Partners",
    description: "Introductions to architecture, interior design, and fit-out partners.",
    gradient: "from-rose-500/20 via-pink-500/10 to-rose-600/20",
    iconGradient: "from-rose-400 to-pink-400",
    hasAILink: true,
  },
  {
    title: "Architecture Partners",
    description: "Introductions to independent architectural design partners.",
    gradient: "/20 /10 /20",
    iconGradient: " ",
  },
  {
    title: "Interior Design Partners",
    description: "Introductions to independent interior design partners.",
    gradient: "from-gold/20 via-amber-500/10 to-gold-dark/20",
    iconGradient: "from-gold to-gold-dark",
    hasAILink: true,
  },
];

// Premium 3D icon component for services
const Premium3DIcon = ({ title, gradient }: { title: string; gradient: string }) => {
  const getIconPath = () => {
    switch (title) {
      case "Holiday Homes":
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
      case "Mortgage Partners":
        return (
          <g>
            <rect x="6" y="10" width="28" height="20" rx="3" fill="url(#iconGrad)" opacity="0.9"/>
            <rect x="10" y="14" width="20" height="2" fill="white" opacity="0.6"/>
            <rect x="10" y="18" width="14" height="2" fill="white" opacity="0.6"/>
            <circle cx="28" cy="22" r="6" fill="white" opacity="0.8"/>
            <text x="28" y="25" textAnchor="middle" fontSize="8" fill="url(#iconGrad)">%</text>
          </g>
        );
      case "Legal Partners":
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
      case "Design & Build Partners":
        return (
          <g>
            <polygon points="20,4 4,18 36,18" fill="url(#iconGrad)" opacity="0.8"/>
            <rect x="8" y="18" width="24" height="16" fill="url(#iconGrad)"/>
            <rect x="14" y="24" width="12" height="10" fill="white" opacity="0.3"/>
            <line x1="12" y1="18" x2="12" y2="34" stroke="white" strokeWidth="1" opacity="0.5"/>
            <line x1="28" y1="18" x2="28" y2="34" stroke="white" strokeWidth="1" opacity="0.5"/>
          </g>
        );
      case "Architecture Partners":
        return (
          <g>
            <polygon points="20,4 4,18 36,18" fill="url(#iconGrad)" opacity="0.8"/>
            <rect x="8" y="18" width="24" height="16" fill="url(#iconGrad)"/>
            <rect x="14" y="24" width="12" height="10" fill="white" opacity="0.3"/>
            <line x1="12" y1="18" x2="12" y2="34" stroke="white" strokeWidth="1" opacity="0.5"/>
            <line x1="28" y1="18" x2="28" y2="34" stroke="white" strokeWidth="1" opacity="0.5"/>
          </g>
        );
      case "Interior Design Partners":
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
      <div className="absolute inset-0 translate-x-1 translate-y-1 rounded-2xl bg-[#1A1A1A]/40 blur-sm" />
      <div className="absolute inset-0 translate-x-0.5 translate-y-0.5 rounded-2xl bg-[#1A1A1A]/20" />
      <div className={`relative w-full h-full rounded-2xl bg-gradient-to-br ${gradient} border border-white/10 flex items-center justify-center overflow-hidden backdrop-blur-sm`}>
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
        <svg viewBox="0 0 40 40" className="w-10 h-10 md:w-12 md:h-12 relative z-10">
          <defs>
            <linearGradient id="iconGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="hsl(45, 35%, 50%)" />
              <stop offset="100%" stopColor="hsl(45, 32%, 39%)" />
            </linearGradient>
          </defs>
          {getIconPath()}
        </svg>
      </div>
    </div>
  );
};

// Premium icon for "How We Help" cards
const HelpIcon = ({ title, gradient }: { title: string; gradient: string }) => {
  const getIconPath = () => {
    switch (title) {
      case "Buy & Sell Brokerage":
        return (
          <g>
            <rect x="8" y="12" width="28" height="20" rx="2" fill="url(#helpGrad)" opacity="0.9"/>
            <rect x="4" y="16" width="28" height="16" rx="2" fill="url(#helpGrad)"/>
            <rect x="12" y="20" width="4" height="4" fill="white" opacity="0.8"/>
            <rect x="20" y="20" width="4" height="4" fill="white" opacity="0.8"/>
            <rect x="12" y="26" width="4" height="4" fill="white" opacity="0.8"/>
            <rect x="20" y="26" width="4" height="4" fill="white" opacity="0.8"/>
            <polygon points="18,4 4,16 32,16" fill="url(#helpGrad)"/>
          </g>
        );
      case "Rent Brokerage":
        return (
          <g>
            <rect x="6" y="10" width="28" height="20" rx="3" fill="url(#helpGrad)" opacity="0.9"/>
            <rect x="10" y="14" width="20" height="2" fill="white" opacity="0.6"/>
            <rect x="10" y="18" width="14" height="2" fill="white" opacity="0.6"/>
            <circle cx="28" cy="22" r="6" fill="white" opacity="0.8"/>
            <text x="28" y="25" textAnchor="middle" fontSize="8" fill="url(#helpGrad)">✓</text>
          </g>
        );
      case "Partner Introductions":
        return (
          <g>
            <circle cx="20" cy="14" r="8" fill="url(#helpGrad)" opacity="0.7"/>
            <circle cx="12" cy="26" r="6" fill="url(#helpGrad)" opacity="0.5"/>
            <circle cx="28" cy="26" r="6" fill="url(#helpGrad)" opacity="0.5"/>
            <path d="M20 22 L12 26" stroke="white" strokeWidth="1.5" opacity="0.6"/>
            <path d="M20 22 L28 26" stroke="white" strokeWidth="1.5" opacity="0.6"/>
          </g>
        );
      default:
        return null;
    }
  };

  return (
    <div className="relative w-14 h-14 md:w-16 md:h-16">
      <div className="absolute inset-0 translate-x-1 translate-y-1 rounded-xl bg-[#1A1A1A]/40 blur-sm" />
      <div className={`relative w-full h-full rounded-xl bg-gradient-to-br ${gradient} border border-white/10 flex items-center justify-center overflow-hidden`}>
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
        <svg viewBox="0 0 40 40" className="w-8 h-8 md:w-10 md:h-10 relative z-10">
          <defs>
            <linearGradient id="helpGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="hsl(45, 35%, 50%)" />
              <stop offset="100%" stopColor="hsl(45, 32%, 39%)" />
            </linearGradient>
          </defs>
          {getIconPath()}
        </svg>
      </div>
    </div>
  );
};

const ServicesSection = () => {
  const [isVideoPlaying, setIsVideoPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isVideoPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsVideoPlaying(!isVideoPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(!isMuted);
    }
  };

  return (
    <section className="relative py-24 overflow-hidden">
      {/* Video Background */}
      <div className="absolute inset-0">
        <video
          ref={videoRef}
          autoPlay
          muted
          loop
          playsInline
          className="w-full h-full object-cover"
        >
          <source src={servicesHeroVideo} type="video/mp4" />
        </video>
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-[#1A1A1A]/80" />
        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black" />
      </div>

      {/* Video Controls */}
      <div className="absolute top-6 right-6 flex gap-2 z-20">
        <button
          onClick={togglePlay}
          className="w-10 h-10 bg-[#1A1A1A]/50 hover:bg-[#1A1A1A]/70 backdrop-blur-sm border border-white/20 rounded-full flex items-center justify-center transition-colors"
          aria-label={isVideoPlaying ? "Pause video" : "Play video"}
        >
          {isVideoPlaying ? (
            <div className="flex gap-1">
              <div className="w-1 h-4 bg-[#FDFBF7] rounded-full" />
              <div className="w-1 h-4 bg-[#FDFBF7] rounded-full" />
            </div>
          ) : (
            <Play className="w-4 h-4 text-white ml-0.5" />
          )}
        </button>
        <button
          onClick={toggleMute}
          className="w-10 h-10 bg-[#1A1A1A]/50 hover:bg-[#1A1A1A]/70 backdrop-blur-sm border border-white/20 rounded-full flex items-center justify-center transition-colors"
          aria-label={isMuted ? "Unmute video" : "Mute video"}
        >
          {isMuted ? (
            <VolumeX className="w-4 h-4 text-white" />
          ) : (
            <Volume2 className="w-4 h-4 text-white" />
          )}
        </button>
      </div>
      
      {/* Grid pattern overlay */}
      <div 
        className="absolute inset-0 opacity-[0.02] z-10"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '60px 60px'
        }}
      />
      
      <div className="container mx-auto px-4 relative z-10" id="services">
        {/* How We Help Section */}
        <div className="text-center mb-16">
          <span className="inline-block px-5 py-2 bg-gradient-to-r from-gold/20 to-gold/5 border border-[#B89555]/30 rounded-full text-[#1A1A1A] text-sm font-medium mb-6 backdrop-blur-sm">
            JBJ Global Real Estate
          </span>
          <h2 
            className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6"
          >
            How We <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold to-gold-light">Help</span>
          </h2>
          <p className="text-white/85 max-w-2xl mx-auto text-lg leading-relaxed">
            Expert brokerage services and trusted partner introductions for your property journey
          </p>
        </div>

        {/* How We Help Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
          {howWeHelp.map((item, index) => (
            <Link
              key={index}
              to={item.href}
              className="group relative"
            >
              <div className="relative bg-[#1A1A1A]/50 backdrop-blur-md border border-white/10 rounded-2xl p-6 h-full transition-all duration-500 group-hover:border-[#B89555]/40 group-hover:-translate-y-2 group-hover:shadow-2xl group-hover:shadow-gold/10 overflow-hidden">
                <div className={`absolute inset-0 bg-gradient-to-br ${item.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl`} />
                
                <div className="relative z-10">
                  <div className="mb-4 group-hover:scale-110 transition-transform duration-500">
                    <HelpIcon title={item.title} gradient={item.gradient} />
                  </div>
                  
                  <h3 
                    className="text-lg font-bold text-white mb-2 group-hover:text-[#1A1A1A] transition-colors duration-300"
                  >
                    {item.title}
                  </h3>
                  
                  <p className="text-white/70 text-sm leading-relaxed group-hover:text-white/85 transition-colors">
                    {item.description}
                  </p>
                  
                  <div className="flex items-center text-[#1A1A1A] text-sm font-medium mt-4 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                    <span>Learn More</span>
                    <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Services Section Header */}
        <div className="text-center mb-12">
          <span className="inline-block px-5 py-2 bg-gradient-to-r from-gold/20 to-gold/5 border border-[#B89555]/30 rounded-full text-[#1A1A1A] text-sm font-medium mb-6 backdrop-blur-sm">
            Partner Network
          </span>
          <h2 
            className="text-3xl md:text-4xl font-bold text-white mb-4"
          >
            Partner <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold to-gold-light">Introductions</span>
          </h2>
          <p className="text-white/85 max-w-2xl mx-auto leading-relaxed">
            We connect you with independent, licensed professionals for comprehensive support
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
              <div className="relative bg-[#1A1A1A]/40 backdrop-blur-md border border-white/10 rounded-2xl p-8 h-full transition-all duration-500 group-hover:border-[#B89555]/40 group-hover:-translate-y-2 group-hover:shadow-2xl group-hover:shadow-gold/10 overflow-hidden">
                <div className={`absolute inset-0 bg-gradient-to-br ${service.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl`} />
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                <div className="relative z-10">
                  <div className="mb-6 group-hover:scale-110 transition-transform duration-500">
                    <Premium3DIcon title={service.title} gradient={service.gradient} />
                  </div>

                  <h3 
                    className="text-xl font-bold text-white mb-3 group-hover:text-[#1A1A1A] transition-colors duration-300"
                  >
                    {service.title}
                  </h3>
                  
                  <p className="text-white/70 text-sm leading-relaxed mb-4 group-hover:text-white/85 transition-colors">
                    {service.description}
                  </p>

                  {service.hasAILink && (
                    <Link 
                      to="/interior-design-ai"
                      className="inline-flex items-center text-xs text-fuchsia-400 hover:text-fuchsia-300 bg-fuchsia-500/10 border border-fuchsia-500/30 px-3 py-1.5 rounded-full mb-4 transition-all hover:bg-fuchsia-500/20"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Sparkles className="w-3 h-3 mr-1.5" />
                      Try AI Interior Design (Informational)
                    </Link>
                  )}

                  <div className="flex items-center text-[#1A1A1A] text-sm font-medium opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                    <span>Inquire Now</span>
                    <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>

                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-24 bg-gradient-to-t from-gold/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ServicesSection;
