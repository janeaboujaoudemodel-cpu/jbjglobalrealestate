import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  TrendingUp, TrendingDown, Minus, MapPin, 
  ArrowUpRight, BarChart2, Home, Building2
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DUBAI_AREAS_MARKET_DATA, type AreaMarketSnapshot } from "@/config/open-data-config";

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

const TrendIcon = ({ trend }: { trend: 'bullish' | 'bearish' | 'neutral' }) => {
  if (trend === 'bullish') return <TrendingUp className="w-4 h-4 text-emerald-400" />;
  if (trend === 'bearish') return <TrendingDown className="w-4 h-4 text-red-400" />;
  return <Minus className="w-4 h-4 text-yellow-400" />;
};

const TrendBadge = ({ trend }: { trend: 'bullish' | 'bearish' | 'neutral' }) => {
  const colors = {
    bullish: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    bearish: 'bg-red-500/10 text-red-400 border-red-500/30',
    neutral: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
  };
  
  return (
    <Badge className={`${colors[trend]} border`}>
      <TrendIcon trend={trend} />
      <span className="ml-1 capitalize">{trend}</span>
    </Badge>
  );
};

const AreaCard = ({ area }: { area: AreaMarketSnapshot }) => {
  const slugify = (text: string) => text.toLowerCase().replace(/\s+/g, '-');
  
  return (
    <motion.div variants={fadeInUp}>
      <Card className="bg-zinc-900/50 border-zinc-800 hover:border-gold/30 transition-all group h-full">
        <CardContent className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-lg bg-gold/10 border border-gold/30 flex items-center justify-center">
                <MapPin className="w-5 h-5 text-gold" />
              </div>
              <div>
                <h3 className="text-white font-semibold group-hover:text-gold transition-colors">
                  {area.area}
                </h3>
                <p className="text-zinc-500 text-xs">Dubai, UAE</p>
              </div>
            </div>
            <TrendBadge trend={area.trend} />
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-zinc-800/50 rounded-lg p-3">
              <div className="flex items-center gap-1 text-zinc-400 text-xs mb-1">
                <Home className="w-3 h-3" />
                Price Index
              </div>
              <p className="text-white font-bold text-lg">{area.priceIndex}</p>
            </div>
            <div className="bg-zinc-800/50 rounded-lg p-3">
              <div className="flex items-center gap-1 text-zinc-400 text-xs mb-1">
                <Building2 className="w-3 h-3" />
                Rental Index
              </div>
              <p className="text-white font-bold text-lg">{area.rentalIndex}</p>
            </div>
          </div>

          {/* Progress Bars */}
          <div className="space-y-3 mb-4">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-zinc-400">Demand Score</span>
                <span className="text-white">{area.demandScore}/100</span>
              </div>
              <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-gold/80 to-gold rounded-full"
                  style={{ width: `${area.demandScore}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-zinc-400">Supply Score</span>
                <span className="text-white">{area.supplyScore}/100</span>
              </div>
              <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-zinc-600 to-zinc-500 rounded-full"
                  style={{ width: `${area.supplyScore}%` }}
                />
              </div>
            </div>
          </div>

          {/* YoY Change */}
          <div className="flex items-center justify-between py-3 border-t border-zinc-800">
            <span className="text-zinc-400 text-sm">Year-over-Year</span>
            <span className={`font-bold ${area.yoyChange >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {area.yoyChange >= 0 ? '+' : ''}{area.yoyChange}%
            </span>
          </div>

          {/* Highlights */}
          <div className="space-y-2 mb-4">
            {area.highlights.slice(0, 2).map((highlight, idx) => (
              <p key={idx} className="text-zinc-500 text-xs flex items-start gap-2">
                <span className="text-gold mt-0.5">•</span>
                {highlight}
              </p>
            ))}
          </div>

          {/* Link */}
          <Link 
            to={`/area/${slugify(area.area)}`}
            className="flex items-center justify-center gap-2 w-full py-2 text-gold hover:text-gold-light text-sm font-medium transition-colors"
          >
            View Area Details
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export const AreaIntelligenceGrid = () => {
  return (
    <section className="py-16 bg-gradient-to-b from-zinc-900/30 to-black">
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
            <span className="text-gold text-xs uppercase tracking-[0.3em] mb-4 block">
              Area Intelligence
            </span>
            <h2 className="text-white text-3xl md:text-4xl font-bold mb-4" style={{ fontFamily: "Poppins, sans-serif" }}>
              Market Snapshot by Location
            </h2>
            <p className="text-zinc-400 max-w-2xl mx-auto">
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
            <Link 
              to="/areas"
              className="inline-flex items-center gap-2 text-gold hover:text-gold-light transition-colors"
            >
              <BarChart2 className="w-5 h-5" />
              Explore All Area Guides
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};
