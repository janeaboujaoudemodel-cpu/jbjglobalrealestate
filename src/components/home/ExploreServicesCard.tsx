import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
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
  Wrench
} from "lucide-react";
import { Button } from "@/components/ui/button";

// Import service background images
import buyPropertyBg from "@/assets/services/buy-property-bg.jpg";
import sellPropertyBg from "@/assets/services/sell-property-bg.jpg";
import rentPropertyBg from "@/assets/services/rent-property-bg.jpg";
import listRentalBg from "@/assets/services/list-rental-bg.jpg";
import goldenVisaBg from "@/assets/services/golden-visa-bg.jpg";
import mortgageBg from "@/assets/services/mortgage-bg.jpg";
import passportVisaBg from "@/assets/services/passport-visa-bg.jpg";
import generalInquiriesBg from "@/assets/services/general-inquiries-bg.jpg";

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
  "golden-visa": "Read Guide",
  mortgage: "Calculate Now",
  passport: "Request Introduction",
  inquiries: "Contact Us",
  compare: "Compare Now",
  evaluation: "Evaluate Now",
  partner: "Meet Partners",
  facility: "Coming Soon",
};

// All services combined into one slideshow - removed "More Services" separation
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
    href: "/seller-listing",
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
    title: "Get Your Golden Visa",
    description: "Secure UAE residency through strategic real estate investment with expert assistance",
    icon: Globe,
    href: "/guides/golden-visa-uae",
    bgImage: goldenVisaBg,
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
  // Additional services merged into main slideshow
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
    bgImage: generalInquiriesBg,
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

  useEffect(() => {
    if (!isAutoPlaying) return;
    // Faster auto-advance (3 seconds)
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % services.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
    setIsAutoPlaying(false);
  };

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + services.length) % services.length);
    setIsAutoPlaying(false);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % services.length);
    setIsAutoPlaying(false);
  };

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

      {/* Slideshow Content - Large height with image background */}
      <div 
        className="relative h-80 md:h-[420px] lg:h-[480px]"
        onMouseEnter={() => setIsAutoPlaying(false)}
        onMouseLeave={() => setIsAutoPlaying(true)}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={currentService.id}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.25 }}
            className="absolute inset-0 flex flex-col justify-end"
          >
            {/* Background Image */}
            <div className="absolute inset-0">
              <img 
                src={currentService.bgImage} 
                alt={currentService.title}
                className="w-full h-full object-cover"
              />
              {/* Gradient Overlay for text readability */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/20" />
            </div>

            {/* Content on top of image - NO ICON BOX */}
            <div className="relative z-10 p-6 md:p-10">
              {/* Premium Title with gradient */}
              <h4 
                className="text-3xl md:text-4xl lg:text-5xl font-bold mb-3 md:mb-4" 
                style={{ 
                  fontFamily: "Poppins, sans-serif",
                  background: 'linear-gradient(135deg, #FFFFFF 0%, #F5EBD7 50%, #C8A766 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  textShadow: '0 2px 4px rgba(0,0,0,0.3)',
                }}
              >
                {currentService.title}
              </h4>
              
              {/* Premium description */}
              <p className="text-zinc-200 text-sm md:text-lg max-w-lg mb-5 md:mb-6 leading-relaxed">
                {currentService.description}
              </p>

              <div className="flex items-center justify-between">
                {currentService.available ? (
                  <Link to={currentService.href}>
                    <Button variant="primary" size="lg" className="gap-2 px-8 py-4 rounded-lg group">
                      <span className="tracking-wide">{CTA_LABELS[currentService.id] ?? "Explore Now"}</span>
                      <ArrowRight className="w-4 h-4 md:w-5 md:h-5 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                ) : (
                  <Button variant="primary" size="lg" disabled className="gap-2 px-8 py-4 rounded-lg">
                    {CTA_LABELS[currentService.id] ?? "Coming Soon"}
                  </Button>
                )}

                {/* Navigation Arrows */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={goToPrevious}
                    className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-pearl/70 hover:bg-pearl backdrop-blur-sm flex items-center justify-center transition-all border border-gold/40 hover:border-gold"
                  >
                    <ChevronLeft className="w-6 h-6 md:w-7 md:h-7 text-gold" />
                  </button>
                  <button
                    onClick={goToNext}
                    className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-pearl/70 hover:bg-pearl backdrop-blur-sm flex items-center justify-center transition-all border border-gold/40 hover:border-gold"
                  >
                    <ChevronRight className="w-6 h-6 md:w-7 md:h-7 text-gold" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Dots Navigation - Simple gold dots, no elongation/merging */}
      <div className="flex items-center justify-center gap-2 md:gap-2.5 py-5 md:py-6 border-t border-gold/30 bg-gradient-to-r from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8]">
        {services.map((service, index) => (
          <button
            key={service.id}
            onClick={() => goToSlide(index)}
            className={`w-2.5 h-2.5 md:w-3 md:h-3 rounded-full transition-all duration-300 ${
              index === currentIndex 
                ? "bg-gold shadow-[0_0_8px_rgba(200,167,102,0.8)]" 
                : "bg-black/20 hover:bg-black/40"
            }`}
            aria-label={`Go to ${service.title}`}
          />
        ))}
      </div>
    </div>
  );
};

export default ExploreServicesCard;
