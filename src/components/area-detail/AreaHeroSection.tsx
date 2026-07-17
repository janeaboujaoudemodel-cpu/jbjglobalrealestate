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
    <section className="relative h-screen flex items-center justify-center overflow-hidden" style={{ background: 'linear-gradient(135deg, #064E3B 0%, #042C1C 60%, #010806 100%)' }}>
      {/* Background Image */}
      <img
        src={optimizeStorageImageUrl(heroImage, 1920, 80) || "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1920&q=80"}
        alt={`${area.name} - Real Estate Area`}
        className="absolute inset-0 w-full h-full object-cover"
        loading="eager"
        fetchPriority="high"
       decoding="async" />
      
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-black/20" />

      {/* DLD Live Badge — top right */}
      {dldAreaData && (
        <motion.div
          className="absolute top-6 right-6 z-20 hidden md:flex items-center gap-2 bg-[#1A1A1A]/60 backdrop-blur-md border border-white/24 rounded-2xl px-4 py-2.5"
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
        className="relative z-10 container mx-auto px-4 flex flex-col items-center text-center"
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
      >
        {/* Location + badges */}
        <motion.div className="flex items-center justify-center gap-2 mb-3 flex-wrap" variants={fadeInUp}>
          <MapPin className="w-5 h-5" style={{ color: '#FFFFFF', stroke: '#FFFFFF' }} />
          <span data-no-contrast-guard className="allow-white text-sm uppercase tracking-wider" style={{ color: '#FFFFFF', WebkitTextFillColor: '#FFFFFF' }}>{area.emirate}, UAE</span>
          {area.is_trending && (
            <span data-no-contrast-guard className="allow-white jj-pill-emerald-metallic ml-2 inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full" style={{ color: '#FFFFFF', WebkitTextFillColor: '#FFFFFF' }}>
              <TrendingUp className="w-3 h-3" style={{ color: '#FFFFFF', stroke: '#FFFFFF' }} />
              Trending
            </span>
          )}
          {area.is_high_demand && (
            <span data-no-contrast-guard className="allow-white jj-pill-emerald-metallic ml-2 inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full" style={{ color: '#FFFFFF', WebkitTextFillColor: '#FFFFFF' }}>
              <Flame className="w-3 h-3" style={{ color: '#FFFFFF', stroke: '#FFFFFF' }} />
              High Demand
            </span>
          )}
        </motion.div>

        <motion.h1
          data-no-contrast-guard
          className="allow-white text-4xl md:text-6xl lg:text-7xl font-bold mb-4 mx-auto text-center"
          style={{ color: '#FFFFFF', WebkitTextFillColor: '#FFFFFF' }}
          variants={fadeInUp}
        >
          {area.name}
        </motion.h1>

        {/* Breadcrumb */}
        <motion.nav className="flex items-center justify-center gap-2 text-sm mb-6" variants={fadeInUp}>
          <Link to="/" data-no-contrast-guard className="transition-colors" style={{ color: 'rgba(255,255,255,0.75)' }}>Home</Link>
          <ChevronRight className="w-4 h-4" style={{ color: 'rgba(255,255,255,0.6)', stroke: 'rgba(255,255,255,0.6)' }} />
          <Link to="/areas" data-no-contrast-guard className="transition-colors" style={{ color: 'rgba(255,255,255,0.75)' }}>Areas</Link>
          <ChevronRight className="w-4 h-4" style={{ color: 'rgba(255,255,255,0.6)', stroke: 'rgba(255,255,255,0.6)' }} />
          <span data-no-contrast-guard style={{ color: '#FFFFFF', WebkitTextFillColor: '#FFFFFF' }}>{area.name}</span>
        </motion.nav>

        {/* Stats Bar */}
        <motion.div className="flex flex-wrap justify-center gap-3 md:gap-4" variants={fadeInUp}>

          {/* Projects */}
          {(liveProjectCount ?? area.project_count_sale ?? area.property_count ?? 0) > 0 && (
            <button
              onClick={() => scrollToId('projects-section')}
              data-allow-dark-cta
              data-no-contrast-guard
              className="allow-white flex items-center gap-2 bg-black/40 backdrop-blur-md border border-white/25 rounded-xl px-5 py-3 cursor-pointer hover:bg-black/55 hover:border-white/60 transition-all duration-200"
              style={{ color: '#FFFFFF' }}
            >
              <Building2 className="w-5 h-5" style={{ color: '#FFFFFF', stroke: '#FFFFFF' }} />
              <div className="text-left">
                <div data-no-contrast-guard className="text-xl font-bold leading-tight" style={{ color: '#FFFFFF', WebkitTextFillColor: '#FFFFFF' }}>{liveProjectCount ?? area.project_count_sale ?? area.property_count}</div>
                <div data-no-contrast-guard className="text-xs" style={{ color: 'rgba(255,255,255,0.85)', WebkitTextFillColor: 'rgba(255,255,255,0.85)' }}>Projects</div>
              </div>
            </button>
          )}

          {/* Developers */}
          {(area.developer_count ?? 0) > 0 && (
            <button
              onClick={() => scrollToId('developers-section')}
              data-allow-dark-cta
              data-no-contrast-guard
              className="allow-white flex items-center gap-2 bg-black/40 backdrop-blur-md border border-white/25 rounded-xl px-5 py-3 cursor-pointer hover:bg-black/55 hover:border-white/60 transition-all duration-200"
              style={{ color: '#FFFFFF' }}
            >
              <Users className="w-5 h-5" style={{ color: '#FFFFFF', stroke: '#FFFFFF' }} />
              <div className="text-left">
                <div data-no-contrast-guard className="text-xl font-bold leading-tight" style={{ color: '#FFFFFF', WebkitTextFillColor: '#FFFFFF' }}>{area.developer_count}</div>
                <div data-no-contrast-guard className="text-xs" style={{ color: 'rgba(255,255,255,0.85)', WebkitTextFillColor: 'rgba(255,255,255,0.85)' }}>Developers</div>
              </div>
            </button>
          )}

          {/* Avg Price/sqft */}
          {(area.avg_price_sqft ?? 0) > 0 && (
            <div data-allow-dark-cta data-no-contrast-guard className="allow-white flex items-center gap-2 bg-black/40 backdrop-blur-md border border-white/25 rounded-xl px-5 py-3" style={{ color: '#FFFFFF' }}>
              <BarChart3 className="w-5 h-5" style={{ color: '#FFFFFF', stroke: '#FFFFFF' }} />
              <div>
                <div data-no-contrast-guard className="text-xl font-bold leading-tight" style={{ color: '#FFFFFF', WebkitTextFillColor: '#FFFFFF' }}>AED {Math.round(area.avg_price_sqft!).toLocaleString()}</div>
                <div data-no-contrast-guard className="text-xs" style={{ color: 'rgba(255,255,255,0.85)', WebkitTextFillColor: 'rgba(255,255,255,0.85)' }}>Avg. Price/sqft</div>
              </div>
            </div>
          )}

          {/* DLD YTD Transactions */}
          {dldAreaData && (
            <>
              <div data-allow-dark-cta data-no-contrast-guard className="allow-white flex items-center gap-2 bg-black/40 backdrop-blur-md border border-white/25 rounded-xl px-5 py-3" style={{ color: '#FFFFFF' }}>
                <Activity className="w-5 h-5" style={{ color: '#FFFFFF', stroke: '#FFFFFF' }} />
                <div>
                  <div data-no-contrast-guard className="text-xl font-bold leading-tight" style={{ color: '#FFFFFF', WebkitTextFillColor: '#FFFFFF' }}>{dldAreaData.transactions.toLocaleString()}</div>
                  <div data-no-contrast-guard className="text-xs" style={{ color: 'rgba(255,255,255,0.85)', WebkitTextFillColor: 'rgba(255,255,255,0.85)' }}>DLD Transactions (YTD)</div>
                </div>
              </div>

              <div data-allow-dark-cta data-no-contrast-guard className="allow-white jj-pill-emerald-metallic flex items-center gap-2 backdrop-blur-md border-0 rounded-xl px-5 py-3" style={{ color: '#FFFFFF' }}>
                <ArrowUpRight className={`w-5 h-5 transition-transform ${isPositive ? '' : 'rotate-180'}`} style={{ color: '#FFFFFF', stroke: '#FFFFFF' }} />
                <div>
                  <div data-no-contrast-guard className="allow-white text-xl font-bold leading-tight" style={{ color: '#FFFFFF', WebkitTextFillColor: '#FFFFFF' }}>
                    {dldAreaData.change}
                  </div>
                  <div data-no-contrast-guard className="text-xs" style={{ color: 'rgba(255,255,255,0.85)', WebkitTextFillColor: 'rgba(255,255,255,0.85)' }}>YoY Growth</div>
                </div>
              </div>
            </>
          )}
        </motion.div>


        {/* DLD source note */}
        {dldAreaData && (
          <motion.p data-no-contrast-guard className="mt-3 text-[10px] uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.75)' }} variants={fadeInUp}>
            ↑ Live data · Dubai Land Department (DLD) · 2026 YTD
          </motion.p>
        )}
      </motion.div>
    </section>
  );
};
