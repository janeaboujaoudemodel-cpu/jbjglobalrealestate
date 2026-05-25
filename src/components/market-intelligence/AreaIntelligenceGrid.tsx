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
  if (trend === 'bullish') return <TrendingUp className="w-3.5 h-3.5 text-emerald-700" />;
  if (trend === 'bearish') return <TrendingDown className="w-3.5 h-3.5 text-red-700" />;
  return <Minus className="w-3.5 h-3.5 text-amber-700" />;
};

const TrendBadge = ({ trend }: { trend: 'bullish' | 'bearish' | 'neutral' }) => {
  const colors = {
    bullish: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    bearish: 'bg-red-100 text-red-800 border-red-300',
    neutral: 'bg-amber-100 text-amber-800 border-amber-300',
  };

  return (
    <Badge
      className={`${colors[trend]} ${MI_CHIP} border whitespace-nowrap min-w-fit shrink-0 px-2 py-0.5`}
      style={{ wordBreak: 'keep-all', overflowWrap: 'normal' }}
    >
      <TrendIcon trend={trend} />
      <span className="ml-1 capitalize">{trend}</span>
    </Badge>
  );
};

/* ICON BOX — navy blue with white icon (global standard) */
const IconBox = ({ icon: Icon, className = "" }: { icon: React.ElementType; className?: string }) => (
  <div
    data-no-contrast-guard
    className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-300 bg-[#102540] border border-[#102540]/40 shadow-sm allow-white ${className}`}
  >
    <Icon className="w-5 h-5 text-white allow-white" />
  </div>
);

const AreaCard = ({ area }: { area: AreaMarketSnapshot }) => {
  const slugify = (text: string) => text.toLowerCase().replace(/\s+/g, '-');
  
  return (
    <motion.div variants={fadeInUp}>
      <Card className="transition-all group h-full hover:shadow-lg bg-card border border-border">
        <CardContent className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4 gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <IconBox icon={MapPin} />
              <div className="min-w-0">
                <h3 className={`${MI_CARD_TITLE} truncate transition-colors`}>
                  {area.area}
                </h3>
                <p className={MI_CAPTION}>Dubai, UAE</p>
              </div>
            </div>
            <TrendBadge trend={area.trend} />
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="rounded-lg p-3 bg-muted">
              <div className={`${MI_CAPTION} flex items-center gap-1 mb-1`}>
                <Home className="w-3 h-3" />
                Price Index
              </div>
              <p className={MI_STAT}>{area.priceIndex}</p>
            </div>
            <div className="rounded-lg p-3 bg-muted">
              <div className={`${MI_CAPTION} flex items-center gap-1 mb-1`}>
                <Building2 className="w-3 h-3" />
                Rental Index
              </div>
              <p className={MI_STAT}>{area.rentalIndex}</p>
            </div>
          </div>

          {/* Progress Bars (data-viz: emerald = demand, blue = supply) */}
          <div className="space-y-3 mb-4">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-semibold text-emerald-700">Demand Score</span>
                <span className="font-bold text-emerald-700">{area.demandScore}/100</span>
              </div>
              <div className="h-2.5 rounded-full overflow-hidden shadow-inner bg-emerald-100">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400"
                  style={{ width: `${area.demandScore}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-semibold text-blue-700">Supply Score</span>
                <span className="font-bold text-blue-700">{area.supplyScore}/100</span>
              </div>
              <div className="h-2.5 rounded-full overflow-hidden shadow-inner bg-blue-100">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-400"
                  style={{ width: `${area.supplyScore}%` }}
                />
              </div>
            </div>
          </div>

          {/* YoY Change */}
          <div className="flex items-center justify-between py-3 border-t border-border/60">
            <span className={MI_BODY}>Year-over-Year</span>
            <span className={`text-sm font-bold leading-none tracking-tight ${area.yoyChange >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
              {area.yoyChange >= 0 ? '+' : ''}{area.yoyChange}%
            </span>
          </div>

          {/* Highlights */}
          <div className="space-y-2 mb-4 mt-3">
            {area.highlights.slice(0, 2).map((highlight, idx) => (
              <p key={idx} className={`${MI_CAPTION} flex items-start gap-2`}>
                <span className="mt-0.5 font-bold text-foreground">•</span>
                {highlight}
              </p>
            ))}
          </div>

          {/* Link */}
          <Link
            to={`/area/${slugify(area.area)}`}
            className="flex items-center justify-center gap-2 w-full py-2 text-sm font-semibold rounded-md transition-colors bg-muted text-foreground hover:bg-foreground hover:text-background"
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
    <section className="surface-light py-16 bg-muted" data-surface="light">
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
              Data derived from official government Open Data sources.
            </p>
          </motion.div>

          {/* Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {DUBAI_AREAS_MARKET_DATA.map((area) => (
              <AreaCard key={area.area} area={area} />
            ))}
          </div>

          {/* View All Link */}
          <motion.div className="text-center mt-10" variants={fadeInUp}>
            <Button variant="primary" asChild>
              <Link to="/areas">
                <BarChart2 className="w-5 h-5 mr-2" />
                <span>Explore All Area Guides</span>
                <ChevronRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};
