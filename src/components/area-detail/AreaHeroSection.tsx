import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { MapPin, ChevronRight, TrendingUp, Building2, Users, BarChart3, Flame } from "lucide-react";
import { scrollToId } from "@/lib/scroll";
import type { Area } from "@/hooks/useAreas";
import { AreaStickySearchBar } from "./AreaStickySearchBar";

interface AreaHeroSectionProps {
  area: Area & { developer_count?: number; project_count_sale?: number; avg_price_sqft?: number; hero_image_url?: string; is_high_demand?: boolean };
}

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.1 } }
};

export const AreaHeroSection = ({ area }: AreaHeroSectionProps) => {
  const heroImage = area.hero_image_url || area.image_url;

  return (
    <section className="relative h-screen flex items-end overflow-hidden">
      {/* Background Image */}
      <img
        src={heroImage || "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1920&q=80"}
        alt={`${area.name} - Real Estate Area`}
        className="absolute inset-0 w-full h-full object-cover"
        loading="eager"
        fetchPriority="high"
      />
      
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />

      <motion.div 
        className="relative z-10 container mx-auto px-4 pb-12"
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
      >
        {/* Breadcrumb */}
        <motion.nav className="flex items-center gap-2 text-sm mb-6" variants={fadeInUp}>
          <Link to="/" className="text-zinc-300 hover:text-white transition-colors">Home</Link>
          <ChevronRight className="w-4 h-4 text-zinc-500" />
          <Link to="/areas" className="text-zinc-300 hover:text-white transition-colors">Areas</Link>
          <ChevronRight className="w-4 h-4 text-zinc-500" />
          <span className="text-gold">{area.name}</span>
        </motion.nav>

        {/* Title + Location */}
        <motion.div className="flex items-center gap-2 mb-3" variants={fadeInUp}>
          <MapPin className="w-5 h-5 text-gold" />
          <span className="text-gold text-sm uppercase tracking-wider">{area.emirate}, UAE</span>
          {area.is_trending && (
            <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs rounded-full">
              <TrendingUp className="w-3 h-3" />
              Trending
            </span>
          )}
          {area.is_high_demand && (
            <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 bg-red-500/20 text-red-400 text-xs rounded-full">
              <Flame className="w-3 h-3" />
              High Demand
            </span>
          )}
        </motion.div>
        
        <motion.h1 
          className="text-white text-4xl md:text-5xl lg:text-6xl font-bold mb-4 max-w-3xl"
          style={{ fontFamily: "Poppins, sans-serif" }}
          variants={fadeInUp}
        >
          {area.name}
        </motion.h1>
        
        {area.description && (
          <motion.p className="text-zinc-200 text-lg max-w-2xl leading-relaxed mb-6" variants={fadeInUp}>
            {area.description}
          </motion.p>
        )}

        {/* Sticky Search Bar */}
        <motion.div variants={fadeInUp}>
          <AreaStickySearchBar areaName={area.name} areaSlug={area.slug} />
        </motion.div>

        {/* Stats Bar */}
        <motion.div className="flex flex-wrap gap-4 md:gap-6" variants={fadeInUp}>
          {(area.project_count_sale ?? area.property_count ?? 0) > 0 && (
            <button
              onClick={() => scrollToId('projects-section')}
              className="flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-5 py-3 cursor-pointer hover:bg-white/20 transition-colors"
            >
              <Building2 className="w-5 h-5 text-gold" />
              <div className="text-left">
                <div className="text-xl font-bold text-white">{area.project_count_sale ?? area.property_count}</div>
                <div className="text-zinc-300 text-xs">Projects</div>
              </div>
            </button>
          )}
          {(area.developer_count ?? 0) > 0 && (
            <button
              onClick={() => scrollToId('developers-section')}
              className="flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-5 py-3 cursor-pointer hover:bg-white/20 transition-colors"
            >
              <Users className="w-5 h-5 text-gold" />
              <div className="text-left">
                <div className="text-xl font-bold text-white">{area.developer_count}</div>
                <div className="text-zinc-300 text-xs">Developers</div>
              </div>
            </button>
          )}
          {(area.avg_price_sqft ?? 0) > 0 && (
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-5 py-3">
              <BarChart3 className="w-5 h-5 text-gold" />
              <div>
                <div className="text-xl font-bold text-white">AED {Math.round(area.avg_price_sqft!).toLocaleString()}</div>
                <div className="text-zinc-300 text-xs">Avg. Price/sqft</div>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </section>
  );
};
