import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { MapPin, ChevronRight, TrendingUp, Building2, Users, BarChart3, Flame, Activity, ArrowUpRight } from "lucide-react";
import { scrollToId } from "@/lib/scroll";
import type { Area } from "@/hooks/useAreas";
import { optimizeStorageImageUrl } from "@/lib/imageUtils";

interface DLDAreaData {
  area: string;
  transactions: number;
  change: string;
}

interface AreaHeroSectionProps {
  area: Area & { developer_count?: number; project_count_sale?: number; avg_price_sqft?: number; hero_image_url?: string; is_high_demand?: boolean };
  liveProjectCount?: number;
  dldAreaData?: DLDAreaData;
}

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.1 } }
};

export const AreaHeroSection = ({ area, liveProjectCount, dldAreaData }: AreaHeroSectionProps) => {
  const heroImage = area.hero_image_url || area.image_url;

  const changeNum = dldAreaData ? parseFloat(dldAreaData.change.replace('%', '')) : null;
  const isPositive = changeNum !== null && changeNum >= 0;

  return (
    <section className="relative h-screen flex items-end overflow-hidden">
      {/* Background Image */}
      <img
        src={optimizeStorageImageUrl(heroImage, 1920, 80) || "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1920&q=80"}
        alt={`${area.name} - Real Estate Area`}
        className="absolute inset-0 w-full h-full object-cover"
        loading="eager"
        fetchpriority="high"
      />
      
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-black/20" />

      {/* DLD Live Badge — top right */}
      {dldAreaData && (
        <motion.div
          className="absolute top-6 right-6 z-20 hidden md:flex items-center gap-2 bg-[#1A1A1A]/60 backdrop-blur-md border border-[#B89555]/40 rounded-2xl px-4 py-2.5"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full jj-surface-emerald opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 jj-surface-emerald" />
          </span>
          <span className="text-white/90 text-xs uppercase tracking-widest font-medium">DLD Live Data</span>
        </motion.div>
      )}

      <motion.div 
        data-surface="dark"
        className="relative z-10 container mx-auto px-4 pb-12"
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
      >
        {/* Location + badges */}
        <motion.div className="flex items-center gap-2 mb-3 flex-wrap" variants={fadeInUp}>
          <MapPin className="w-5 h-5 text-[#1A1A1A]" />
          <span className="text-[#1A1A1A] text-sm uppercase tracking-wider">{area.emirate}, UAE</span>
          {area.is_trending && (
            <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 bg-amber-500/20 text-[#1A1A1A] text-xs rounded-full">
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
          variants={fadeInUp}
        >
          {area.name}
        </motion.h1>

        {/* Breadcrumb */}
        <motion.nav className="flex items-center gap-2 text-sm mb-6" variants={fadeInUp}>
          <Link to="/" className="text-white/70 hover:text-white transition-colors">Home</Link>
          <ChevronRight className="w-4 h-4 text-white/60" />
          <Link to="/areas" className="text-white/70 hover:text-white transition-colors">Areas</Link>
          <ChevronRight className="w-4 h-4 text-white/60" />
          <span className="text-white">{area.name}</span>

        </motion.nav>

        {/* Stats Bar */}
        <motion.div className="flex flex-wrap gap-3 md:gap-4" variants={fadeInUp}>
          {/* Projects */}
          {(liveProjectCount ?? area.project_count_sale ?? area.property_count ?? 0) > 0 && (
            <button
              onClick={() => scrollToId('projects-section')}
              data-allow-dark-cta
              data-no-contrast-guard
              className="allow-white flex items-center gap-2 bg-black/40 backdrop-blur-md border border-white/25 rounded-xl px-5 py-3 cursor-pointer hover:bg-black/55 hover:border-[#B89555]/60 transition-all duration-200"
            >
              <Building2 className="w-5 h-5 text-white" />
              <div className="text-left">
                <div className="text-xl font-bold text-white leading-tight">{liveProjectCount ?? area.project_count_sale ?? area.property_count}</div>
                <div className="text-white/80 text-xs">Projects</div>
              </div>
            </button>
          )}

          {/* Developers */}
          {(area.developer_count ?? 0) > 0 && (
            <button
              onClick={() => scrollToId('developers-section')}
              data-allow-dark-cta
              data-no-contrast-guard
              className="allow-white flex items-center gap-2 bg-black/40 backdrop-blur-md border border-white/25 rounded-xl px-5 py-3 cursor-pointer hover:bg-black/55 hover:border-[#B89555]/60 transition-all duration-200"
            >
              <Users className="w-5 h-5 text-white" />
              <div className="text-left">
                <div className="text-xl font-bold text-white leading-tight">{area.developer_count}</div>
                <div className="text-white/80 text-xs">Developers</div>
              </div>
            </button>
          )}

          {/* Avg Price/sqft */}
          {(area.avg_price_sqft ?? 0) > 0 && (
            <div data-allow-dark-cta data-no-contrast-guard className="allow-white flex items-center gap-2 bg-black/40 backdrop-blur-md border border-white/25 rounded-xl px-5 py-3">
              <BarChart3 className="w-5 h-5 text-white" />
              <div>
                <div className="text-xl font-bold text-white leading-tight">AED {Math.round(area.avg_price_sqft!).toLocaleString()}</div>
                <div className="text-white/80 text-xs">Avg. Price/sqft</div>
              </div>
            </div>
          )}

          {/* DLD YTD Transactions */}
          {dldAreaData && (
            <>
              <div data-allow-dark-cta data-no-contrast-guard className="allow-white flex items-center gap-2 bg-black/40 backdrop-blur-md border border-[#B89555]/50 rounded-xl px-5 py-3">
                <Activity className="w-5 h-5 text-[#B89555]" />
                <div>
                  <div className="text-xl font-bold text-white leading-tight">{dldAreaData.transactions.toLocaleString()}</div>
                  <div className="text-white/80 text-xs">DLD Transactions (YTD)</div>
                </div>
              </div>

              <div data-allow-dark-cta data-no-contrast-guard className={`allow-white flex items-center gap-2 backdrop-blur-md border rounded-xl px-5 py-3 ${
 isPositive
 ? 'jj-surface-emerald-soft border-[color:var(--emerald-1)]/30/40'
 : 'bg-red-500/20 border-red-400/40'
 }`}>
                <ArrowUpRight className={`w-5 h-5 transition-transform ${isPositive ? 'text-[color:var(--emerald-on)]' : 'text-red-300 rotate-180'}`} />
                <div>
                  <div className={`text-xl font-bold leading-tight ${isPositive ? 'text-[color:var(--emerald-on)]' : 'text-red-300'}`}>
                    {dldAreaData.change}
                  </div>
                  <div className="text-white/80 text-xs">YoY Growth</div>
                </div>
              </div>
            </>
          )}
        </motion.div>


        {/* DLD source note */}
        {dldAreaData && (
          <motion.p className="mt-3 text-white/70 text-[10px] uppercase tracking-widest" variants={fadeInUp}>
            ↑ Live data · Dubai Land Department (DLD) · 2026 YTD
          </motion.p>
        )}
      </motion.div>
    </section>
  );
};
