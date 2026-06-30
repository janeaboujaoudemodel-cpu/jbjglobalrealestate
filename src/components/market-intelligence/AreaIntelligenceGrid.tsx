import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  TrendingUp, TrendingDown, Minus, MapPin, 
  ArrowUpRight, BarChart2, Home, Building2, ChevronRight
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DUBAI_AREAS_MARKET_DATA, type AreaMarketSnapshot } from "@/config/open-data-config";
import {
  MI_EYEBROW,
  MI_H2,
  MI_LEAD,
  MI_CARD_TITLE,
  MI_BODY,
  MI_BODY_MUTED,
  MI_CAPTION,
  MI_STAT,
  MI_CHIP,
} from "./MarketIntelligenceTypography";

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

const TrendIcon = ({ trend }: { trend: 'bullish' | 'bearish' | 'neutral' }) => {
  if (trend === 'bullish') return <TrendingUp className="w-3.5 h-3.5" />;
  if (trend === 'bearish') return <TrendingDown className="w-3.5 h-3.5" />;
  return <Minus className="w-3.5 h-3.5" />;
};

const TrendBadge = ({ trend }: { trend: 'bullish' | 'bearish' | 'neutral' }) => {
  return (
    <span className="mi-chip-emerald whitespace-nowrap shrink-0">
      <TrendIcon trend={trend} />
      <span className="capitalize">{trend}</span>
    </span>
  );
};

/* Icon box — emerald standard */
const IconBox = ({ icon: Icon, className = "" }: { icon: React.ElementType; className?: string }) => (
  <div className={`mi-icon-tile mi-no-flip ${className}`}>
    <Icon className="w-5 h-5" />
  </div>
);

const AreaCard = ({ area }: { area: AreaMarketSnapshot }) => {
  const slugify = (text: string) => text.toLowerCase().replace(/\s+/g, '-');
  
  return (
    <motion.div variants={fadeInUp}>
      <Card className="mi-gold-frame group h-full rounded-2xl transition-shadow hover:shadow-[0_16px_38px_rgba(26,26,26,0.10)]">
        <CardContent className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4 gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <IconBox icon={MapPin} />
              <div className="min-w-0">
                <h3 className={`${MI_CARD_TITLE} whitespace-normal break-words leading-tight transition-colors`}>
                  {area.area}
                </h3>
                <p className="text-xs font-medium leading-relaxed text-[#B89555]">Dubai, UAE</p>
              </div>
            </div>
            <TrendBadge trend={area.trend} />
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="rounded-lg p-3 bg-[#F7F2EA] border border-[#B89555]/25">
              <div className={`${MI_CAPTION} flex items-center gap-1 mb-1`}>
                <Home className="w-3 h-3" />
                Price Index
              </div>
              <p className={MI_STAT}>{area.priceIndex}</p>
            </div>
            <div className="rounded-lg p-3 bg-[#F7F2EA] border border-[#B89555]/25">
              <div className={`${MI_CAPTION} flex items-center gap-1 mb-1`}>
                <Building2 className="w-3 h-3" />
                Rental Index
              </div>
              <p className={MI_STAT}>{area.rentalIndex}</p>
            </div>
          </div>

          {/* Progress Bars (data-viz: emerald = demand) */}
          <div className="space-y-3 mb-4">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-semibold text-[#064E3B]">Demand Score</span>
                <span className="font-bold text-[#064E3B]">{area.demandScore}/100</span>
              </div>
              <div className="h-2.5 rounded-full overflow-hidden shadow-inner bg-[#064E3B]/10" data-score-bar>
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#064E3B] to-[#047857]"
                  style={{ width: `${area.demandScore}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-semibold text-[#1A1A1A]">Supply Score</span>
                <span className="font-bold text-[#1A1A1A]">{area.supplyScore}/100</span>
              </div>
              <div className="h-2.5 rounded-full overflow-hidden shadow-inner bg-[#064E3B]/10" data-score-bar>
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#064E3B] to-[#047857]"
                  style={{ width: `${area.supplyScore}%` }}
                />
              </div>
            </div>
          </div>

          {/* YoY Change */}
          <div className="flex items-center justify-between py-3 border-t border-[#B89555]/30">
            <span className={MI_BODY}>Year-over-Year</span>
            <span className="text-sm font-bold leading-none tracking-tight text-[#1A1A1A]">
              {area.yoyChange >= 0 ? '+' : ''}{area.yoyChange}%
            </span>
          </div>

          {/* Highlights */}
          <div className="space-y-2 mb-4 mt-3">
            {area.highlights.slice(0, 2).map((highlight, idx) => (
              <p key={idx} className={`${MI_CAPTION} flex items-start gap-2`}>
                <span className="mt-0.5 font-bold text-[#064E3B]">•</span>
                {highlight}
              </p>
            ))}
          </div>

          {/* Link */}
          <Link
            to={`/area/${slugify(area.area)}`}
            data-no-contrast-guard
            className="mi-cta-emerald w-full py-2 text-sm rounded-lg"
          >
            <span>View Area Details</span>
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export const AreaIntelligenceGrid = () => {
  return (
    <section className="surface-light py-10 bg-[#FDFBF7]" data-surface="light">
      <div className="container mx-auto px-4">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={{
            visible: { transition: { staggerChildren: 0.1 } }
          }}
        >
          {/* Section Header */}
          <motion.div className="text-center mb-12" variants={fadeInUp}>
            <span className={`${MI_EYEBROW} mb-4 block`}>
              Area Intelligence
            </span>
            <h2 className={`${MI_H2} mb-4`}>
              Market Snapshot by Location
            </h2>
            <p className={`${MI_LEAD} max-w-2xl mx-auto`}>
              Explore aggregated market data for Dubai's most sought-after communities. 
              Data derived from official government sources with daily freshness checks.
            </p>
          </motion.div>

          {/* Grid */}
          <div className="mi-area-grid grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {DUBAI_AREAS_MARKET_DATA.map((area) => (
              <AreaCard key={area.area} area={area} />
            ))}
          </div>

          {/* View All Link */}
          <motion.div className="text-center mt-10" variants={fadeInUp}>
            <Link
              to="/areas"
              data-no-contrast-guard
              className="mi-cta-emerald inline-flex px-8 py-4 rounded-lg text-base"
            >
              <BarChart2 className="w-5 h-5" />
              <span>Explore All Area Guides</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};
