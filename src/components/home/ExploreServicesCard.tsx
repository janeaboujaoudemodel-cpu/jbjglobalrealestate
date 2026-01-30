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
  ChevronRight
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

const services: ServiceSlide[] = [
  {
    id: "buy",
    title: "Buy Property",
    description: "Discover premium properties in Dubai's most sought-after locations",
    icon: Home,
    href: "/properties?transaction=buy",
    bgImage: buyPropertyBg,
    available: true
  },
  {
    id: "sell",
    title: "Sell Your Property",
    description: "Maximize your property's value with our expert selling services",
    icon: Tag,
    href: "/seller-listing",
    bgImage: sellPropertyBg,
    available: true
  },
  {
    id: "rent",
    title: "Rent a Property",
    description: "Find your perfect rental home in Dubai's best neighborhoods",
    icon: Key,
    href: "/properties?transaction=rent",
    bgImage: rentPropertyBg,
    available: true
  },
  {
    id: "list-rent",
    title: "List Your Property for Rent",
    description: "Connect with qualified tenants through our extensive network",
    icon: Building2,
    href: "/landlord-listing",
    bgImage: listRentalBg,
    available: true
  },
  {
    id: "golden-visa",
    title: "Get Your Golden Visa",
    description: "Secure UAE residency through strategic real estate investment",
    icon: Globe,
    href: "/guides/golden-visa-uae",
    bgImage: goldenVisaBg,
    available: true
  },
  {
    id: "mortgage",
    title: "Mortgage Inquiries",
    description: "Calculate payments and connect with top mortgage providers",
    icon: Calculator,
    href: "/mortgage-calculator",
    bgImage: mortgageBg,
    available: true
  },
  {
    id: "passport",
    title: "Buy Passport & Schengen Visa",
    description: "Explore citizenship and visa programs through our partners",
    icon: Plane,
    href: "/services/citizenship",
    bgImage: passportVisaBg,
    available: false
  },
  {
    id: "inquiries",
    title: "General Inquiries",
    description: "Get answers to all your real estate questions",
    icon: MessageCircle,
    href: "/contact",
    bgImage: generalInquiriesBg,
    available: true
  }
];

const ExploreServicesCard = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  useEffect(() => {
    if (!isAutoPlaying) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % services.length);
    }, 5000);
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

      {/* Slideshow Content - Larger height with image background */}
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
            transition={{ duration: 0.4 }}
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

            {/* Content on top of image */}
            <div className="relative z-10 p-6 md:p-10">
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-xl md:rounded-2xl bg-black/80 border-2 border-gold/60 flex items-center justify-center mb-4 md:mb-6 shadow-lg backdrop-blur-sm">
                <currentService.icon className="w-8 h-8 md:w-10 md:h-10 text-gold" />
              </div>
              <h4 className="text-2xl md:text-4xl lg:text-5xl font-bold text-white mb-2 md:mb-4" style={{ fontFamily: "Poppins, sans-serif" }}>
                {currentService.title}
              </h4>
              <p className="text-zinc-200 text-sm md:text-lg max-w-lg mb-4 md:mb-6">
                {currentService.description}
              </p>

              <div className="flex items-center justify-between">
                {currentService.available ? (
                  <Link to={currentService.href}>
                    <Button 
                      className="bg-gold hover:bg-gold-dark text-black font-semibold gap-2 group px-6 py-3 text-sm md:text-base"
                    >
                      Explore
                      <ArrowRight className="w-4 h-4 md:w-5 md:h-5 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                ) : (
                  <Button 
                    disabled
                    className="bg-zinc-500 text-white cursor-not-allowed gap-2 px-6 py-3"
                  >
                    Coming Soon
                  </Button>
                )}

                {/* Navigation Arrows */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={goToPrevious}
                    className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-white/10 hover:bg-white/30 backdrop-blur-sm flex items-center justify-center transition-all border border-white/20"
                  >
                    <ChevronLeft className="w-6 h-6 md:w-7 md:h-7 text-white" />
                  </button>
                  <button
                    onClick={goToNext}
                    className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-white/10 hover:bg-white/30 backdrop-blur-sm flex items-center justify-center transition-all border border-white/20"
                  >
                    <ChevronRight className="w-6 h-6 md:w-7 md:h-7 text-white" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Dots Navigation */}
      <div className="flex items-center justify-center gap-2 md:gap-3 py-5 md:py-6 border-t border-gold/30 bg-gradient-to-r from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8]">
        {services.map((service, index) => (
          <button
            key={service.id}
            onClick={() => goToSlide(index)}
            className={`h-2.5 md:h-3 rounded-full transition-all duration-300 ${
              index === currentIndex 
                ? "bg-gold w-8 md:w-10" 
                : "bg-black/30 hover:bg-black/50 w-2.5 md:w-3"
            }`}
            aria-label={`Go to ${service.title}`}
          />
        ))}
      </div>
    </div>
  );
};

export default ExploreServicesCard;
