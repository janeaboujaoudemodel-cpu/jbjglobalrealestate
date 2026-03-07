import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { 
  Home, 
  Tag, 
  Key, 
  Building2, 
  Globe, 
  Calculator, 
  Plane, 
  MessageCircle,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Scale,
  Coins,
  Users,
  Handshake,
  Wrench,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";

// Service background images served from public/ to avoid bundle bloat
const buyPropertyBg = "/services/buy-property-bg.jpg";
const sellPropertyBg = "/services/sell-property-bg.jpg";
const rentPropertyBg = "/services/rent-property-bg.jpg";
const listRentalBg = "/services/list-rental-bg.jpg";
const goldenVisaBg = "/services/golden-visa-bg.jpg";
const mortgageBg = "/services/mortgage-bg.jpg";
const passportVisaBg = "/services/passport-visa-bg.jpg";
const generalInquiriesBg = "/services/general-inquiries-bg.jpg";
const propertyManagementBg = "/services/property-management-bg.jpg";
const partnerIntroBg = "/services/partner-introduction-bg.jpg";

interface ServiceSlide {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  href: string;
  bgImage: string;
  available: boolean;
}

const CTA_LABELS: Record<string, string> = {
  buy: "Explore Now",
  sell: "List Now",
  rent: "Browse Now",
  "list-rent": "List Now",
  "golden-visa": "Golden Visa",
  "property-management": "Manage My Property",
  mortgage: "Calculate Now",
  passport: "Request Introduction",
  inquiries: "Contact Us",
  compare: "Compare Now",
  evaluation: "Evaluate Now",
  partner: "Meet Partners",
  facility: "Coming Soon",
};

const services: ServiceSlide[] = [
  {
    id: "buy",
    title: "Buy Property",
    description: "Discover premium properties in Dubai's most sought-after locations with expert guidance",
    icon: Home,
    href: "/properties?transaction=buy",
    bgImage: buyPropertyBg,
    available: true
  },
  {
    id: "sell",
    title: "Sell Your Property",
    description: "Maximize your property's value with our expert selling services and market insights",
    icon: Tag,
    href: "/listing-portal",
    bgImage: sellPropertyBg,
    available: true
  },
  {
    id: "rent",
    title: "Rent a Property",
    description: "Find your perfect rental home in Dubai's best neighborhoods with personalized support",
    icon: Key,
    href: "/properties?transaction=rent",
    bgImage: rentPropertyBg,
    available: true
  },
  {
    id: "list-rent",
    title: "List Your Property for Rent",
    description: "Connect with qualified tenants through our extensive network and premium marketing",
    icon: Building2,
    href: "/landlord-listing",
    bgImage: listRentalBg,
    available: true
  },
  {
    id: "golden-visa",
    title: "Golden Visa Advisory",
    description: "Find out if you're eligible to apply for UAE residency through strategic real estate investment",
    icon: Globe,
    href: "/guides/golden-visa-uae",
    bgImage: goldenVisaBg,
    available: true
  },
  {
    id: "property-management",
    title: "Property Management",
    description: "Professional property maintenance and management services for landlords and investors",
    icon: Building2,
    href: "/services/property-management",
    bgImage: propertyManagementBg,
    available: true
  },
  {
    id: "mortgage",
    title: "Mortgage Inquiries",
    description: "Calculate payments and connect with top mortgage providers for the best rates",
    icon: Calculator,
    href: "/mortgage-calculator",
    bgImage: mortgageBg,
    available: true
  },
  {
    id: "passport",
    title: "Passport & Schengen Visa",
    description: "Request introduction via independent licensed partners",
    icon: Plane,
    href: "/services/citizenship",
    bgImage: passportVisaBg,
    available: true
  },
  {
    id: "inquiries",
    title: "General Inquiries",
    description: "Get answers to all your real estate questions from our expert team",
    icon: MessageCircle,
    href: "/contact",
    bgImage: generalInquiriesBg,
    available: true
  },
  {
    id: "compare",
    title: "Compare Your Property",
    description: "Side-by-side analysis of multiple properties with AI-powered insights",
    icon: Scale,
    href: "/compare",
    bgImage: buyPropertyBg,
    available: true
  },
  {
    id: "evaluation",
    title: "Get Property Evaluation",
    description: "AI-powered property valuation tool for accurate market assessments",
    icon: Calculator,
    href: "/property-evaluator",
    bgImage: sellPropertyBg,
    available: true
  },
  {
    id: "partner",
    title: "Partner Introduction",
    description: "Connect with our network of trusted legal, financial, and service partners",
    icon: Handshake,
    href: "/partners",
    bgImage: partnerIntroBg,
    available: true
  },
  {
    id: "facility",
    title: "Facility Management",
    description: "Property maintenance and management services for property owners",
    icon: Wrench,
    href: "/services/facility-management",
    bgImage: rentPropertyBg,
    available: false
  }
];

const ExploreServicesCard = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  useEffect(() => {
    if (!isAutoPlaying) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % services.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  const goToPrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + services.length) % services.length);
    setIsAutoPlaying(false);
  }, []);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % services.length);
    setIsAutoPlaying(false);
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  }, []);

  const handleTouchEnd = useCallback(() => {
    const diff = touchStartX.current - touchEndX.current;
    if (Math.abs(diff) > 50) {
      if (diff > 0) goToNext();
      else goToPrevious();
    }
  }, [goToNext, goToPrevious]);

  const currentService = services[currentIndex];

  return (
    <div className="relative overflow-hidden rounded-2xl md:rounded-3xl border-2 border-gold/50 bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] shadow-[0_12px_40px_rgba(200,167,102,0.45),0_6px_20px_rgba(0,0,0,0.2)]">
      {/* Header */}
      <div className="px-6 md:px-8 py-5 md:py-6 border-b border-gold/30 bg-gradient-to-r from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8]">
        <h3 className="text-2xl md:text-3xl font-bold text-black" style={{ fontFamily: "Poppins, sans-serif" }}>
          Explore Our Services
        </h3>
        <p className="text-sm md:text-base text-zinc-600 mt-1">Premium real estate solutions tailored to your needs</p>
      </div>

      {/* Slideshow - Persistent image stack (no AnimatePresence) */}
      <div 
        className="relative h-72 sm:h-80 md:h-[420px] lg:h-[480px]"
        onPointerEnter={() => { if (window.matchMedia("(hover: hover)").matches) setIsAutoPlaying(false); }}
        onPointerLeave={() => setIsAutoPlaying(true)}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* All images mounted persistently — CSS opacity transition only */}
        {services.map((service, idx) => (
          <div
            key={service.id}
            className="absolute inset-0 transition-opacity duration-500 ease-in-out"
            style={{ opacity: idx === currentIndex ? 1 : 0, zIndex: idx === currentIndex ? 1 : 0 }}
            aria-hidden={idx !== currentIndex}
          >
            <img 
              src={service.bgImage} 
              alt={service.title}
              className="w-full h-full object-cover"
              loading={idx < 3 ? "eager" : "lazy"}
              fetchPriority={idx < 3 ? "high" : "low"}
              decoding="async"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/20" />
          </div>
        ))}

        {/* Content overlay — always visible, updates instantly */}
        <div className="absolute inset-0 z-10 flex flex-col justify-end p-5 sm:p-6 md:p-10">
          <h4 
            className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-2 md:mb-4 transition-all duration-300" 
            style={{ 
              fontFamily: "Poppins, sans-serif",
              background: 'linear-gradient(135deg, #FFFFFF 0%, #F5EBD7 50%, #C8A766 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            {currentService.title}
          </h4>
          
          <p className="text-zinc-200 text-xs sm:text-sm md:text-lg max-w-lg mb-4 md:mb-6 leading-relaxed line-clamp-3">
            {currentService.description}
          </p>

          <div className="flex items-center justify-between gap-2">
            {currentService.available ? (
              <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                <Link to={currentService.href}>
                  <Button variant="primary" size="default" className="gap-2 px-4 sm:px-8 py-3 sm:py-4 rounded-lg group text-sm sm:text-base">
                    <span className="tracking-wide">{CTA_LABELS[currentService.id] ?? "Explore Now"}</span>
                    <ArrowRight className="w-4 h-4 text-gold group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                {currentService.id === "golden-visa" && (
                  <Link to="/guides/golden-visa-uae">
                    <Button variant="outline" size="sm" className="gap-2 px-3 py-2 rounded-lg border-white/40 text-white hover:bg-white/10 text-xs">
                      Read Guide
                    </Button>
                  </Link>
                )}
              </div>
            ) : (
              <Button variant="primary" size="default" disabled className="gap-2 px-6 py-3 rounded-lg text-sm">
                {CTA_LABELS[currentService.id] ?? "Coming Soon"}
              </Button>
            )}

            {/* Navigation Arrows */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <button
                onClick={goToPrevious}
                className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center transition-all duration-200 group overflow-hidden hover:scale-110 active:scale-95"
                style={{
                  background: 'linear-gradient(145deg, #FDFBF7, #E8DCC8)',
                  border: '2px solid rgba(200, 167, 102, 0.7)',
                  boxShadow: '0 6px 16px rgba(0,0,0,0.35), inset 0 3px 6px rgba(255,255,255,0.9), 0 0 20px rgba(200,167,102,0.25)',
                }}
              >
                <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-gold" />
              </button>
              <button
                onClick={goToNext}
                className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center transition-all duration-200 group overflow-hidden hover:scale-110 active:scale-95"
                style={{
                  background: 'linear-gradient(145deg, #FDFBF7, #E8DCC8)',
                  border: '2px solid rgba(200, 167, 102, 0.7)',
                  boxShadow: '0 6px 16px rgba(0,0,0,0.35), inset 0 3px 6px rgba(255,255,255,0.9), 0 0 20px rgba(200,167,102,0.25)',
                }}
              >
                <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-gold" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExploreServicesCard;
