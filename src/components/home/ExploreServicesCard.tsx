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

interface ServiceSlide {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  href: string;
  gradient: string;
  available: boolean;
}

const services: ServiceSlide[] = [
  {
    id: "buy",
    title: "Buy Property",
    description: "Discover premium properties in Dubai's most sought-after locations",
    icon: Home,
    href: "/properties?transaction=buy",
    gradient: "from-emerald-500/20 to-emerald-600/10",
    available: true
  },
  {
    id: "sell",
    title: "Sell Your Property",
    description: "Maximize your property's value with our expert selling services",
    icon: Tag,
    href: "/seller-listing",
    gradient: "from-blue-500/20 to-blue-600/10",
    available: true
  },
  {
    id: "rent",
    title: "Rent a Property",
    description: "Find your perfect rental home in Dubai's best neighborhoods",
    icon: Key,
    href: "/properties?transaction=rent",
    gradient: "from-purple-500/20 to-purple-600/10",
    available: true
  },
  {
    id: "list-rent",
    title: "List Your Property for Rent",
    description: "Connect with qualified tenants through our extensive network",
    icon: Building2,
    href: "/landlord-listing",
    gradient: "from-orange-500/20 to-orange-600/10",
    available: true
  },
  {
    id: "golden-visa",
    title: "Get Your Golden Visa",
    description: "Secure UAE residency through strategic real estate investment",
    icon: Globe,
    href: "/guides/golden-visa-uae",
    gradient: "from-gold/20 to-gold/10",
    available: true
  },
  {
    id: "mortgage",
    title: "Mortgage Inquiries",
    description: "Calculate payments and connect with top mortgage providers",
    icon: Calculator,
    href: "/mortgage-calculator",
    gradient: "from-cyan-500/20 to-cyan-600/10",
    available: true
  },
  {
    id: "passport",
    title: "Buy Passport & Schengen Visa",
    description: "Explore citizenship and visa programs through our partners",
    icon: Plane,
    href: "/services/citizenship",
    gradient: "from-rose-500/20 to-rose-600/10",
    available: false // Page doesn't exist yet
  },
  {
    id: "inquiries",
    title: "General Inquiries",
    description: "Get answers to all your real estate questions",
    icon: MessageCircle,
    href: "/contact",
    gradient: "from-indigo-500/20 to-indigo-600/10",
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
    <div className="relative overflow-hidden rounded-2xl border-2 border-gold/40 bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] shadow-[0_8px_30px_rgba(200,167,102,0.35),0_4px_15px_rgba(0,0,0,0.15)]">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gold/20">
        <h3 className="text-xl md:text-2xl font-bold text-black" style={{ fontFamily: "Poppins, sans-serif" }}>
          Explore Our Services
        </h3>
        <p className="text-sm text-zinc-600 mt-1">Premium real estate solutions tailored to your needs</p>
      </div>

      {/* Slideshow Content */}
      <div 
        className="relative h-64 md:h-72"
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
            className={`absolute inset-0 p-6 md:p-8 flex flex-col justify-between bg-gradient-to-br ${currentService.gradient}`}
          >
            <div>
              <div className="w-14 h-14 rounded-xl bg-black/90 border border-gold/40 flex items-center justify-center mb-4 shadow-lg">
                <currentService.icon className="w-7 h-7 text-gold" />
              </div>
              <h4 className="text-2xl md:text-3xl font-bold text-black mb-2" style={{ fontFamily: "Poppins, sans-serif" }}>
                {currentService.title}
              </h4>
              <p className="text-zinc-700 text-sm md:text-base max-w-md">
                {currentService.description}
              </p>
            </div>

            <div className="flex items-center justify-between">
              {currentService.available ? (
                <Link to={currentService.href}>
                  <Button 
                    className="bg-black text-white hover:bg-zinc-800 gap-2 group"
                  >
                    Explore
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              ) : (
                <Button 
                  disabled
                  className="bg-zinc-400 text-white cursor-not-allowed gap-2"
                >
                  Coming Soon
                </Button>
              )}

              {/* Navigation Arrows */}
              <div className="flex items-center gap-2">
                <button
                  onClick={goToPrevious}
                  className="w-10 h-10 rounded-full bg-black/10 hover:bg-black/20 flex items-center justify-center transition-colors"
                >
                  <ChevronLeft className="w-5 h-5 text-black" />
                </button>
                <button
                  onClick={goToNext}
                  className="w-10 h-10 rounded-full bg-black/10 hover:bg-black/20 flex items-center justify-center transition-colors"
                >
                  <ChevronRight className="w-5 h-5 text-black" />
                </button>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Dots Navigation */}
      <div className="flex items-center justify-center gap-2 py-4 border-t border-gold/20 bg-black/5">
        {services.map((service, index) => (
          <button
            key={service.id}
            onClick={() => goToSlide(index)}
            className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
              index === currentIndex 
                ? "bg-gold w-6" 
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
