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

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

const TrendIcon = ({ trend }: { trend: 'bullish' | 'bearish' | 'neutral' }) => {
  if (trend === 'bullish') return <TrendingUp className="w-4 h-4 text-emerald-600" />;
  if (trend === 'bearish') return <TrendingDown className="w-4 h-4 text-red-600" />;
  return <Minus className="w-4 h-4 text-amber-600" />;
};

const TrendBadge = ({ trend }: { trend: 'bullish' | 'bearish' | 'neutral' }) => {
  const colors = {
    bullish: 'bg-emerald-100 text-emerald-700 border-emerald-300',
    bearish: 'bg-red-100 text-red-700 border-red-300',
    neutral: 'bg-amber-100 text-amber-700 border-amber-300',
  };
  
  return (
    <Badge className={`${colors[trend]} border`}>
      <TrendIcon trend={trend} />
      <span className="ml-1 capitalize">{trend}</span>
    </Badge>
  );
};

/* ============================================================
 * ICON BOX STYLE - Active Champagne + Gold Border + Black Icon
 * ============================================================ */
const IconBox = ({ icon: Icon, className = "" }: { icon: React.ElementType; className?: string }) => (
  <div 
    className={`w-10 h-10 rounded-lg flex items-center justify-center border-2 border-gold transition-all duration-300 hover:shadow-[0_8px_20px_rgba(200,167,102,0.4)] ${className}`}
    style={{
      background: 'linear-gradient(135deg, #F7F1E6 0%, #ECE2D2 50%, #D8C7A6 100%)',
    }}
  >
    <Icon className="w-5 h-5 text-black" />
  </div>
);

const AreaCard = ({ area }: { area: AreaMarketSnapshot }) => {
  const slugify = (text: string) => text.toLowerCase().replace(/\s+/g, '-');
  
  return (
    <motion.div variants={fadeInUp}>
      <Card className="jj-card-inner hover:border-white transition-all group h-full">
        <CardContent className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-2">
              <IconBox icon={MapPin} />
              <div>
                <h3 className="text-black font-semibold group-hover:text-gold transition-colors">
                  {area.area}
                </h3>
                <p className="text-black/50 text-xs">Dubai, UAE</p>
              </div>
            </div>
            <TrendBadge trend={area.trend} />
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-white/50 rounded-lg p-3">
              <div className="flex items-center gap-1 text-black/60 text-xs mb-1">
                <Home className="w-3 h-3" />
                Price Index
              </div>
              <p className="text-black font-bold text-lg">{area.priceIndex}</p>
            </div>
            <div className="bg-white/50 rounded-lg p-3">
              <div className="flex items-center gap-1 text-black/60 text-xs mb-1">
                <Building2 className="w-3 h-3" />
                Rental Index
              </div>
              <p className="text-black font-bold text-lg">{area.rentalIndex}</p>
            </div>
          </div>

          {/* Progress Bars */}
          <div className="space-y-3 mb-4">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-black/60">Demand Score</span>
                <span className="text-black">{area.demandScore}/100</span>
              </div>
              <div className="h-2 bg-white/50 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-gold/80 to-gold rounded-full"
                  style={{ width: `${area.demandScore}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-black/60">Supply Score</span>
                <span className="text-black">{area.supplyScore}/100</span>
              </div>
              <div className="h-2 bg-white/50 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-black/50 to-black/40 rounded-full"
                  style={{ width: `${area.supplyScore}%` }}
                />
              </div>
            </div>
          </div>

          {/* YoY Change */}
          <div className="flex items-center justify-between py-3 border-t border-black/10">
            <span className="text-black/60 text-sm">Year-over-Year</span>
            <span className={`font-bold ${area.yoyChange >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {area.yoyChange >= 0 ? '+' : ''}{area.yoyChange}%
            </span>
          </div>

          {/* Highlights */}
          <div className="space-y-2 mb-4">
            {area.highlights.slice(0, 2).map((highlight, idx) => (
              <p key={idx} className="text-black/70 text-xs flex items-start gap-2">
                <span className="text-gold mt-0.5">•</span>
                {highlight}
              </p>
            ))}
          </div>

          {/* Link */}
          <Link 
            to={`/area/${slugify(area.area)}`}
            className="flex items-center justify-center gap-2 w-full py-2 text-gold hover:text-black text-sm font-medium transition-colors"
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
    <section className="py-16 bg-black">
      <div className="jj-layer-2">
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
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-black" style={{ fontFamily: "Poppins, sans-serif" }}>
              Market Snapshot by Location
            </h2>
            <p className="text-black/70 max-w-2xl mx-auto">
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
                <span className="text-black">Explore All</span><span className="text-gold"> Area Guides</span>
                <ChevronRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};