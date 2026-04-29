import { motion } from "framer-motion";
import { 
  TrendingUp, TrendingDown, Building2, DollarSign, 
  Calendar, BarChart3, Percent, Clock
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  MARKET_OVERVIEW_STATS,
  QUARTERLY_TRENDS,
  PROPERTY_TYPE_TRENDS,
} from "@/config/open-data-config";

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

/* ============================================================
 * ICON BOX STYLE - Solid black tile, white icon (max contrast)
 * ============================================================ */
const IconBox = ({ icon: Icon, className = "" }: { icon: React.ElementType; className?: string }) => (
  <div
    className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 ${className}`}
    style={{ backgroundColor: '#000000' }}
  >
    <Icon className="w-6 h-6" style={{ color: '#ffffff' }} />
  </div>
);

const StatCard = ({ 
  title, 
  value, 
  change, 
  icon: Icon, 
  suffix = "",
  prefix = "",
  accentColor = "text-black"
}: { 
  title: string; 
  value: string | number; 
  change: number; 
  icon: React.ElementType;
  suffix?: string;
  prefix?: string;
  accentColor?: string;
}) => {
  const isPositive = change >= 0;
  
  return (
    <motion.div variants={fadeInUp}>
      <Card className="jj-card-inner transition-all h-full">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <IconBox icon={Icon} />
            <div className={`flex items-center gap-1 text-sm font-bold px-2 py-0.5 rounded-full ${isPositive ? 'text-emerald-700 bg-emerald-50' : 'text-red-700 bg-red-50'}`}>
              {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              <span>{isPositive ? '+' : ''}{change}%</span>
            </div>
          </div>
          <div className="mt-4">
            <p className="text-black font-medium text-sm mb-1">{title}</p>
            <p className={`${accentColor} text-2xl font-bold truncate`}>
              {prefix}{typeof value === 'number' ? value.toLocaleString() : value}{suffix}
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export const MarketOverviewDashboard = () => {
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
            <span className="text-xs uppercase tracking-[0.3em] mb-4 block font-bold" style={{ color: '#000000' }}>
              Market Overview
            </span>
            <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: '#000000' }}>
              <span style={{ color: '#000000' }}>Dubai</span> <span style={{ color: '#000000' }}>Real Estate Dashboard</span>
            </h2>
            <p className="max-w-2xl mx-auto" style={{ color: '#374151' }}>
              High-level market metrics aggregated from official government Open Data sources.
            </p>
          </motion.div>

          {/* Stats Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            <StatCard
              title="Annual Transactions"
              value={MARKET_OVERVIEW_STATS.totalTransactions}
              change={MARKET_OVERVIEW_STATS.totalTransactionsChange}
              icon={Building2}
              accentColor="text-emerald-600"
            />
            <StatCard
              title="Avg. Price/Sqft"
              value={MARKET_OVERVIEW_STATS.avgPricePerSqft}
              change={MARKET_OVERVIEW_STATS.avgPriceChange}
              icon={DollarSign}
              prefix="AED "
              accentColor="text-blue-600"
            />
            <StatCard
              title="Avg. Rental Yield"
              value={MARKET_OVERVIEW_STATS.avgRentalYield}
              change={MARKET_OVERVIEW_STATS.yieldChange}
              icon={Percent}
              suffix="%"
              accentColor="text-amber-600"
            />
            <StatCard
              title="Days on Market"
              value={MARKET_OVERVIEW_STATS.daysOnMarket}
              change={MARKET_OVERVIEW_STATS.domChange}
              icon={Clock}
              suffix=" days"
              accentColor="text-purple-600"
            />
          </div>

          {/* Charts Section */}
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Quarterly Trends */}
            <motion.div variants={fadeInUp}>
              <Card className="jj-card-inner h-full">
                <CardHeader>
                  <CardTitle className="text-black flex items-center gap-3">
                    <IconBox icon={BarChart3} className="w-10 h-10" />
                    <span>Quarterly Transaction Trends</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {QUARTERLY_TRENDS.map((quarter, idx) => {
                      const qColors = [
                        'linear-gradient(to right, #10B981, #34D399)', // emerald
                        'linear-gradient(to right, #3B82F6, #60A5FA)', // blue
                        'linear-gradient(to right, #F59E0B, #FBBF24)', // amber
                        'linear-gradient(to right, #8B5CF6, #A78BFA)', // violet
                      ];
                      return (
                        <div key={quarter.quarter} className="flex items-center gap-4">
                          <span className="font-semibold text-sm w-20" style={{ color: '#000000' }}>{quarter.quarter}</span>
                          <div className="flex-1 h-8 rounded-lg overflow-hidden relative shadow-inner" style={{ backgroundColor: '#F3F4F6' }}>
                            <motion.div
                              className="h-full"
                              style={{ background: qColors[idx % qColors.length] }}
                              initial={{ width: 0 }}
                              whileInView={{ width: `${(quarter.transactions / 40000) * 100}%` }}
                              viewport={{ once: true }}
                              transition={{ duration: 0.8, delay: idx * 0.1 }}
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold" style={{ color: '#000000' }}>
                              {quarter.transactions.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-xs mt-4 font-medium" style={{ color: '#374151' }}>
                    Source: Dubai Government Open Data
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            {/* Property Type Breakdown */}
            <motion.div variants={fadeInUp}>
              <Card className="jj-card-inner h-full">
                <CardHeader>
                  <CardTitle className="text-black flex items-center gap-3">
                    <IconBox icon={Building2} className="w-10 h-10" />
                    <span>Price by Property Type</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {PROPERTY_TYPE_TRENDS.map((prop) => (
                      <div key={prop.type} className="flex items-center justify-between py-3 border-b border-black/10 last:border-0">
                        <div>
                          <p className="text-black font-medium">{prop.type}</p>
                          <p className="text-black/70 font-medium text-sm">{prop.volume.toLocaleString()} transactions</p>
                        </div>
                        <div className="text-right">
                          <p className="text-black font-bold">AED {prop.avgPrice.toLocaleString()}/sqft</p>
                          <p className={`text-sm ${prop.change >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                            {prop.change >= 0 ? '+' : ''}{prop.change}% YoY
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Data Attribution */}
          <motion.div 
            className="mt-8 text-center"
            variants={fadeInUp}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 jj-card-inner rounded-full">
              <Calendar className="w-4 h-4 text-gold" />
              <span className="text-black/80 text-sm font-medium">
                Last updated: {new Date(MARKET_OVERVIEW_STATS.reportDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
              <span className="text-black/70">•</span>
              <span className="text-black/90 text-sm font-medium">
                {MARKET_OVERVIEW_STATS.dataSource}
              </span>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};