import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { MapPin, ChevronRight, TrendingUp, Building2, Users, Search, BarChart3, Flame } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import type { Area } from "@/hooks/useAreas";

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
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  const heroImage = area.hero_image_url || area.image_url;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/properties?area=${area.slug}&q=${encodeURIComponent(searchQuery)}`);
    } else {
      navigate(`/properties?area=${area.slug}`);
    }
  };

  return (
    <section className="relative h-screen flex items-end overflow-hidden">
      {/* Background Image */}
      {heroImage ? (
        <img
          src={heroImage}
          alt={`${area.name} - Real Estate Area`}
          className="absolute inset-0 w-full h-full object-cover"
          loading="eager"
          fetchPriority="high"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 via-zinc-800 to-black" />
      )}
      
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

        {/* Search Bar */}
        <motion.form onSubmit={handleSearch} className="max-w-xl mb-8" variants={fadeInUp}>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search properties in ${area.name}...`}
              className="pl-12 pr-32 py-6 bg-white/95 backdrop-blur-sm border-0 text-black text-base rounded-xl shadow-2xl"
            />
            <Button
              type="submit"
              variant="dark"
              className="absolute right-2 top-1/2 -translate-y-1/2 px-6"
            >
              Search
            </Button>
          </div>
        </motion.form>

        {/* Stats Bar */}
        <motion.div className="flex flex-wrap gap-4 md:gap-6" variants={fadeInUp}>
          {(area.project_count_sale ?? area.property_count ?? 0) > 0 && (
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-5 py-3">
              <Building2 className="w-5 h-5 text-gold" />
              <div>
                <div className="text-xl font-bold text-white">{area.project_count_sale ?? area.property_count}</div>
                <div className="text-zinc-300 text-xs">Projects</div>
              </div>
            </div>
          )}
          {(area.developer_count ?? 0) > 0 && (
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-5 py-3">
              <Users className="w-5 h-5 text-gold" />
              <div>
                <div className="text-xl font-bold text-white">{area.developer_count}</div>
                <div className="text-zinc-300 text-xs">Developers</div>
              </div>
            </div>
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
