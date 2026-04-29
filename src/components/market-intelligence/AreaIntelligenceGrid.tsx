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
      className={`${colors[trend]} border whitespace-nowrap min-w-fit shrink-0 px-2 py-0.5 text-[11px] font-bold`}
      style={{ wordBreak: 'keep-all', overflowWrap: 'normal' }}
    >
      <TrendIcon trend={trend} />
      <span className="ml-1 capitalize">{trend}</span>
    </Badge>
  );
};

/* ============================================================
 * ICON BOX STYLE - Solid black tile, white icon (max contrast on white card)
 * ============================================================ */
const IconBox = ({ icon: Icon, className = "" }: { icon: React.ElementType; className?: string }) => (
  <div
    className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-300 ${className}`}
    style={{ backgroundColor: '#000000' }}
  >
    <Icon className="w-5 h-5" style={{ color: '#ffffff' }} />
  </div>
);

const AreaCard = ({ area }: { area: AreaMarketSnapshot }) => {
  const slugify = (text: string) => text.toLowerCase().replace(/\s+/g, '-');
  
  return (
    <motion.div variants={fadeInUp}>
      <Card className="jj-card-inner hover:border-white transition-all group h-full">
        <CardContent className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4 gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <IconBox icon={MapPin} />
              <div className="min-w-0">
                <h3 className="font-semibold transition-colors truncate" style={{ color: '#000000' }}>
                  {area.area}
                </h3>
                <p className="font-medium text-xs" style={{ color: '#374151' }}>Dubai, UAE</p>
              </div>
            </div>
            <TrendBadge trend={area.trend} />
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="rounded-lg p-3" style={{ backgroundColor: '#F5F5F5' }}>
              <div className="flex items-center gap-1 font-medium text-xs mb-1" style={{ color: '#374151' }}>
                <Home className="w-3 h-3" />
                Price Index
              </div>
              <p className="font-bold text-lg" style={{ color: '#000000' }}>{area.priceIndex}</p>
            </div>
            <div className="rounded-lg p-3" style={{ backgroundColor: '#F5F5F5' }}>
              <div className="flex items-center gap-1 font-medium text-xs mb-1" style={{ color: '#374151' }}>
                <Building2 className="w-3 h-3" />
                Rental Index
              </div>
              <p className="font-bold text-lg" style={{ color: '#000000' }}>{area.rentalIndex}</p>
            </div>
          </div>

          {/* Progress Bars */}
          <div className="space-y-3 mb-4">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-semibold" style={{ color: '#047857' }}>Demand Score</span>
                <span className="font-bold" style={{ color: '#047857' }}>{area.demandScore}/100</span>
              </div>
              <div className="h-2.5 rounded-full overflow-hidden shadow-inner" style={{ backgroundColor: '#D1FAE5' }}>
                <div
                  className="h-full rounded-full"
                  style={{ width: `${area.demandScore}%`, background: 'linear-gradient(to right, #10B981, #34D399)' }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-semibold" style={{ color: '#1D4ED8' }}>Supply Score</span>
                <span className="font-bold" style={{ color: '#1D4ED8' }}>{area.supplyScore}/100</span>
              </div>
              <div className="h-2.5 rounded-full overflow-hidden shadow-inner" style={{ backgroundColor: '#DBEAFE' }}>
                <div
                  className="h-full rounded-full"
                  style={{ width: `${area.supplyScore}%`, background: 'linear-gradient(to right, #3B82F6, #60A5FA)' }}
                />
              </div>
            </div>
          </div>

          {/* YoY Change */}
          <div className="flex items-center justify-between py-3 border-t" style={{ borderColor: 'rgba(0,0,0,0.1)' }}>
            <span className="font-medium text-sm" style={{ color: '#000000' }}>Year-over-Year</span>
            <span className="font-bold" style={{ color: area.yoyChange >= 0 ? '#047857' : '#B91C1C' }}>
              {area.yoyChange >= 0 ? '+' : ''}{area.yoyChange}%
            </span>
          </div>

          {/* Highlights */}
          <div className="space-y-2 mb-4 mt-3">
            {area.highlights.slice(0, 2).map((highlight, idx) => (
              <p key={idx} className="text-xs flex items-start gap-2" style={{ color: '#374151' }}>
                <span className="mt-0.5 font-bold" style={{ color: '#000000' }}>•</span>
                {highlight}
              </p>
            ))}
          </div>

          {/* Link */}
          <Link
            to={`/area/${slugify(area.area)}`}
            className="flex items-center justify-center gap-2 w-full py-2 text-sm font-semibold rounded-md transition-colors"
            style={{ color: '#000000', backgroundColor: '#F5F5F5' }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#000000'; e.currentTarget.style.color = '#ffffff'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#F5F5F5'; e.currentTarget.style.color = '#000000'; }}
          >
            <span style={{ color: 'inherit' }}>View Area Details</span>
            <ArrowUpRight className="w-4 h-4" style={{ color: 'inherit' }} />
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
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-black">
              Market Snapshot by Location
            </h2>
            <p className="text-black/90 max-w-2xl mx-auto">
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