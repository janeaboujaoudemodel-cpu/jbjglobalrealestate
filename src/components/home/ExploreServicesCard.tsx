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
  Wrench,
  Sparkles
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
import propertyManagementBg from "@/assets/services/property-management-bg.jpg";
import partnerIntroBg from "@/assets/services/partner-introduction-bg.jpg";

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
  "golden-visa": "Get Your Golden Visa",
  "property-management": "Manage My Property",
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
                  <div className="flex items-center gap-3 flex-wrap">
                    <Link to={currentService.href}>
                      <Button variant="primary" size="lg" className="gap-2 px-8 py-4 rounded-lg group">
                        <span className="tracking-wide">{CTA_LABELS[currentService.id] ?? "Explore Now"}</span>
                        <ArrowRight className="w-4 h-4 md:w-5 md:h-5 text-gold group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </Link>
                    {currentService.id === "golden-visa" && (
                      <Link to="/guides/golden-visa-uae">
                        <Button variant="outline" size="lg" className="gap-2 px-6 py-4 rounded-lg border-white/40 text-white hover:bg-white/10">
                          Read Guide
                        </Button>
                      </Link>
                    )}
                  </div>
                ) : (
                  <Button variant="primary" size="lg" disabled className="gap-2 px-8 py-4 rounded-lg">
                    {CTA_LABELS[currentService.id] ?? "Coming Soon"}
                  </Button>
                )}

                {/* Navigation Arrows - 3D Premium Style */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={goToPrevious}
                    className="relative w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center transition-all duration-200 group overflow-hidden hover:scale-110 active:scale-90"
                    style={{
                      background: 'linear-gradient(145deg, #FDFBF7, #E8DCC8)',
                      border: '2px solid rgba(200, 167, 102, 0.7)',
                      boxShadow: `
                        0 6px 16px rgba(0,0,0,0.35),
                        0 3px 6px rgba(0,0,0,0.25),
                        inset 0 3px 6px rgba(255,255,255,0.9),
                        inset 0 -3px 6px rgba(200,167,102,0.25),
                        0 0 20px rgba(200,167,102,0.25)
                      `,
                      transform: 'translateY(0)',
                    }}
                    onMouseDown={(e) => {
                      const btn = e.currentTarget;
                      btn.style.transform = 'translateY(3px)';
                      btn.style.boxShadow = '0 1px 4px rgba(0,0,0,0.3), inset 0 1px 2px rgba(255,255,255,0.5), inset 0 -1px 3px rgba(200,167,102,0.3), 0 0 30px rgba(200,167,102,0.7)';
                    }}
                    onMouseUp={(e) => {
                      const btn = e.currentTarget;
                      btn.style.transform = 'translateY(0)';
                      btn.style.boxShadow = '0 6px 16px rgba(0,0,0,0.35), 0 3px 6px rgba(0,0,0,0.25), inset 0 3px 6px rgba(255,255,255,0.9), inset 0 -3px 6px rgba(200,167,102,0.25), 0 0 20px rgba(200,167,102,0.25)';
                    }}
                    onMouseLeave={(e) => {
                      const btn = e.currentTarget;
                      btn.style.transform = 'translateY(0)';
                      btn.style.boxShadow = '0 6px 16px rgba(0,0,0,0.35), 0 3px 6px rgba(0,0,0,0.25), inset 0 3px 6px rgba(255,255,255,0.9), inset 0 -3px 6px rgba(200,167,102,0.25), 0 0 20px rgba(200,167,102,0.25)';
                    }}
                  >
                    {/* 3D Top highlight */}
                    <span className="absolute inset-x-0 top-0 h-1/2 rounded-t-full bg-gradient-to-b from-white/80 to-transparent pointer-events-none" />
                    {/* Bottom shadow for depth */}
                    <span className="absolute inset-x-0 bottom-0 h-1/3 rounded-b-full bg-gradient-to-t from-black/10 to-transparent pointer-events-none" />
                    {/* Hover glow ring */}
                    <span className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" style={{ boxShadow: '0 0 30px rgba(200,167,102,0.6), inset 0 0 15px rgba(200,167,102,0.15)' }} />
                    <ChevronLeft className="w-6 h-6 md:w-7 md:h-7 text-gold relative z-10 group-hover:scale-110 transition-transform" />
                  </button>
                  <button
                    onClick={goToNext}
                    className="relative w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center transition-all duration-200 group overflow-hidden hover:scale-110 active:scale-90"
                    style={{
                      background: 'linear-gradient(145deg, #FDFBF7, #E8DCC8)',
                      border: '2px solid rgba(200, 167, 102, 0.7)',
                      boxShadow: `
                        0 6px 16px rgba(0,0,0,0.35),
                        0 3px 6px rgba(0,0,0,0.25),
                        inset 0 3px 6px rgba(255,255,255,0.9),
                        inset 0 -3px 6px rgba(200,167,102,0.25),
                        0 0 20px rgba(200,167,102,0.25)
                      `,
                      transform: 'translateY(0)',
                    }}
                    onMouseDown={(e) => {
                      const btn = e.currentTarget;
                      btn.style.transform = 'translateY(3px)';
                      btn.style.boxShadow = '0 1px 4px rgba(0,0,0,0.3), inset 0 1px 2px rgba(255,255,255,0.5), inset 0 -1px 3px rgba(200,167,102,0.3), 0 0 30px rgba(200,167,102,0.7)';
                    }}
                    onMouseUp={(e) => {
                      const btn = e.currentTarget;
                      btn.style.transform = 'translateY(0)';
                      btn.style.boxShadow = '0 6px 16px rgba(0,0,0,0.35), 0 3px 6px rgba(0,0,0,0.25), inset 0 3px 6px rgba(255,255,255,0.9), inset 0 -3px 6px rgba(200,167,102,0.25), 0 0 20px rgba(200,167,102,0.25)';
                    }}
                    onMouseLeave={(e) => {
                      const btn = e.currentTarget;
                      btn.style.transform = 'translateY(0)';
                      btn.style.boxShadow = '0 6px 16px rgba(0,0,0,0.35), 0 3px 6px rgba(0,0,0,0.25), inset 0 3px 6px rgba(255,255,255,0.9), inset 0 -3px 6px rgba(200,167,102,0.25), 0 0 20px rgba(200,167,102,0.25)';
                    }}
                  >
                    {/* 3D Top highlight */}
                    <span className="absolute inset-x-0 top-0 h-1/2 rounded-t-full bg-gradient-to-b from-white/80 to-transparent pointer-events-none" />
                    {/* Bottom shadow for depth */}
                    <span className="absolute inset-x-0 bottom-0 h-1/3 rounded-b-full bg-gradient-to-t from-black/10 to-transparent pointer-events-none" />
                    {/* Hover glow ring */}
                    <span className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" style={{ boxShadow: '0 0 30px rgba(200,167,102,0.6), inset 0 0 15px rgba(200,167,102,0.15)' }} />
                    <ChevronRight className="w-6 h-6 md:w-7 md:h-7 text-gold relative z-10 group-hover:scale-110 transition-transform" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

    </div>
  );
};

export default ExploreServicesCard;
