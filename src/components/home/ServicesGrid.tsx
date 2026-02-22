/**
 * ServicesGrid Component - Master Blueprint Specification
 * 4-card grid on desktop, scrollable carousel on mobile with arrow navigation
 */

import { useRef, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Home, Key, Target, Wrench, ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";

interface ServiceCard {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  href: string;
  color: string;
}

const getServices = (t: (key: string, fallback?: string) => string): ServiceCard[] => [
  {
    id: "buy",
    title: t('services.card.buy', 'Buy'),
    description: t('services.card.buyDesc', 'Find the right home with shortlists that match your budget and lifestyle.'),
    icon: Home,
    href: "/buyer-guide",
    color: "from-emerald-500 to-emerald-600",
  },
  {
    id: "rent",
    title: t('services.card.rent', 'Rent'),
    description: t('services.card.rentDesc', 'Fast viewings, clear requirements, and quick move-ins.'),
    icon: Key,
    href: "/tenant-guide",
    color: "from-blue-500 to-blue-600",
  },
  {
    id: "sell",
    title: t('services.card.sell', 'Sell'),
    description: t('services.card.sellDesc', 'Pricing strategy + premium marketing to maximize your sale.'),
    icon: Target,
    href: "/seller-guide",
    color: "from-gold to-amber-600",
  },
  {
    id: "management",
    title: t('services.card.management', 'Management'),
    description: t('services.card.managementDesc', 'Tenant placement, renewals, maintenance coordination, and reporting.'),
    icon: Wrench,
    href: "/landlord-guide",
    color: "from-purple-500 to-purple-600",
  },
  {
    id: "golden-visa",
    title: t('services.card.goldenVisa', 'Golden Visa'),
    description: t('services.card.goldenVisaDesc', 'Secure long-term UAE residency through property investment.'),
    icon: Key,
    href: "/guides/golden-visa",
    color: "from-amber-500 to-yellow-600",
  },
  {
    id: "properties",
    title: t('services.card.properties', 'Off-Plan'),
    description: t('services.card.propertiesDesc', 'Explore premium off-plan projects across Dubai and the UAE.'),
    icon: Home,
    href: "/properties",
    color: "from-teal-500 to-teal-600",
  },
];

const ServicesGrid = () => {
  const { t } = useLanguage();
  const services = getServices(t);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollState = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 2);
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    updateScrollState();
    el.addEventListener("scroll", updateScrollState, { passive: true });
    window.addEventListener("resize", updateScrollState);
    return () => {
      el.removeEventListener("scroll", updateScrollState);
      window.removeEventListener("resize", updateScrollState);
    };
  }, []);

  const scroll = (direction: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    const cardWidth = el.querySelector("div")?.offsetWidth || 280;
    el.scrollBy({ left: direction === "left" ? -cardWidth : cardWidth, behavior: "smooth" });
  };

  const renderCard = (service: ServiceCard, index: number) => (
    <motion.div
      key={service.id}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      className="min-w-[75vw] sm:min-w-[45vw] lg:min-w-0 snap-start"
    >
      <Link to={service.href} className="group block h-full">
        <div className="h-full bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] rounded-xl border-2 border-gold/30 hover:border-gold p-6 transition-all duration-300 hover:shadow-[0_8px_30px_rgba(200,167,102,0.4)] hover:-translate-y-1">
          {/* Icon */}
          <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${service.color} flex items-center justify-center mb-5 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
            <service.icon className="w-7 h-7 text-white" />
          </div>

          {/* Title */}
          <h3
            className="text-xl font-bold text-black mb-3 group-hover:text-gold transition-colors"
            style={{ fontFamily: "Poppins, sans-serif" }}
          >
            {service.title}
          </h3>

          {/* Description */}
          <p className="text-sm text-zinc-600 mb-4 leading-relaxed">
            {service.description}
          </p>

          {/* CTA */}
          <Button variant="primary" size="sm" className="mt-auto">
            {t('services.learnMore', 'Learn More')}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </Link>
    </motion.div>
  );

  return (
    <section className="py-16 md:py-24 jj-layer-2">
      <div className="jj-layer-2">
        {/* Section Header */}
        <div className="text-center mb-10">
          <h2
            className="text-2xl md:text-3xl font-bold text-black mb-3"
            style={{ fontFamily: "Poppins, sans-serif" }}
          >
            {t('services.howCanWeHelp', 'How Can We Help?')}
          </h2>
          <p className="text-zinc-600 text-sm max-w-md mx-auto">
            {t('services.subtitle', 'Whether you\'re buying, selling, renting, or investing—we\'ve got you covered.')}
          </p>
        </div>

        {/* Carousel with arrows */}
        <div className="relative">
          {/* Left Arrow */}
          <motion.button
            whileHover={{ scale: 1.1, boxShadow: "0 0 16px rgba(200,167,102,0.6)" }}
            whileTap={{ scale: 0.8, backgroundColor: "rgba(200,167,102,0.25)", boxShadow: "inset 0 2px 6px rgba(0,0,0,0.15)" }}
            transition={{ type: "spring", stiffness: 400, damping: 15 }}
            onClick={() => scroll("left")}
            className={`absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/95 border-2 border-gold shadow-lg flex items-center justify-center transition-opacity lg:hidden ${canScrollLeft ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            aria-label="Previous service"
          >
            <ChevronLeft className="w-5 h-5 text-zinc-800 active:text-gold transition-colors" />
          </motion.button>

          {/* Right Arrow */}
          <motion.button
            whileHover={{ scale: 1.1, boxShadow: "0 0 16px rgba(200,167,102,0.6)" }}
            whileTap={{ scale: 0.8, backgroundColor: "rgba(200,167,102,0.25)", boxShadow: "inset 0 2px 6px rgba(0,0,0,0.15)" }}
            transition={{ type: "spring", stiffness: 400, damping: 15 }}
            onClick={() => scroll("right")}
            className={`absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/95 border-2 border-gold shadow-lg flex items-center justify-center transition-opacity lg:hidden ${canScrollRight ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            aria-label="Next service"
          >
            <ChevronRight className="w-5 h-5 text-zinc-800 active:text-gold transition-colors" />
          </motion.button>

          {/* Cards container: horizontal scroll on mobile, grid on desktop */}
          <div
            ref={scrollRef}
            className="flex gap-4 md:gap-6 overflow-x-auto snap-x snap-mandatory scrollbar-hide lg:grid lg:grid-cols-3 xl:grid-cols-3 lg:overflow-visible px-1"
          >
            {services.map((service, index) => renderCard(service, index))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ServicesGrid;
