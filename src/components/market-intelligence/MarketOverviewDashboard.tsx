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

const StatCard = ({ 
  title, 
  value, 
  change, 
  icon: Icon, 
  suffix = "",
  prefix = ""
}: { 
  title: string; 
  value: string | number; 
  change: number; 
  icon: React.ElementType;
  suffix?: string;
  prefix?: string;
}) => {
  const isPositive = change >= 0;
  
  return (
    <motion.div variants={fadeInUp}>
      <Card className="bg-zinc-900/50 border-zinc-800 hover:border-gold/30 transition-all">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="w-12 h-12 rounded-xl bg-gold/10 border border-gold/30 flex items-center justify-center">
              <Icon className="w-6 h-6 text-gold" />
            </div>
            <div className={`flex items-center gap-1 text-sm ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
              {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              <span>{isPositive ? '+' : ''}{change}%</span>
            </div>
          </div>
          <div className="mt-4">
            <p className="text-zinc-400 text-sm mb-1">{title}</p>
            <p className="text-white text-2xl font-bold">
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
    <section className="py-16">
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
              Market Overview
            </span>
            <h2 className="text-white text-3xl md:text-4xl font-bold mb-4" style={{ fontFamily: "Poppins, sans-serif" }}>
              Dubai Real Estate Dashboard
            </h2>
            <p className="text-zinc-400 max-w-2xl mx-auto">
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
            />
            <StatCard
              title="Avg. Price/Sqft"
              value={MARKET_OVERVIEW_STATS.avgPricePerSqft}
              change={MARKET_OVERVIEW_STATS.avgPriceChange}
              icon={DollarSign}
              prefix="AED "
            />
            <StatCard
              title="Avg. Rental Yield"
              value={MARKET_OVERVIEW_STATS.avgRentalYield}
              change={MARKET_OVERVIEW_STATS.yieldChange}
              icon={Percent}
              suffix="%"
            />
            <StatCard
              title="Days on Market"
              value={MARKET_OVERVIEW_STATS.daysOnMarket}
              change={MARKET_OVERVIEW_STATS.domChange}
              icon={Clock}
              suffix=" days"
            />
          </div>

          {/* Charts Section */}
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Quarterly Trends */}
            <motion.div variants={fadeInUp}>
              <Card className="bg-zinc-900/50 border-zinc-800">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-gold" />
                    Quarterly Transaction Trends
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {QUARTERLY_TRENDS.map((quarter, idx) => (
                      <div key={quarter.quarter} className="flex items-center gap-4">
                        <span className="text-zinc-400 text-sm w-20">{quarter.quarter}</span>
                        <div className="flex-1 h-8 bg-zinc-800 rounded-lg overflow-hidden relative">
                          <motion.div
                            className="h-full bg-gradient-to-r from-gold/80 to-gold"
                            initial={{ width: 0 }}
                            whileInView={{ width: `${(quarter.transactions / 40000) * 100}%` }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8, delay: idx * 0.1 }}
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-white text-xs font-medium">
                            {quarter.transactions.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-zinc-500 text-xs mt-4">
                    Source: Dubai Government Open Data
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            {/* Property Type Breakdown */}
            <motion.div variants={fadeInUp}>
              <Card className="bg-zinc-900/50 border-zinc-800">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-gold" />
                    Price by Property Type
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {PROPERTY_TYPE_TRENDS.map((prop) => (
                      <div key={prop.type} className="flex items-center justify-between py-3 border-b border-zinc-800 last:border-0">
                        <div>
                          <p className="text-white font-medium">{prop.type}</p>
                          <p className="text-zinc-500 text-sm">{prop.volume.toLocaleString()} transactions</p>
                        </div>
                        <div className="text-right">
                          <p className="text-white font-bold">AED {prop.avgPrice.toLocaleString()}/sqft</p>
                          <p className={`text-sm ${prop.change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
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
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-900/50 border border-zinc-800 rounded-full">
              <Calendar className="w-4 h-4 text-gold" />
              <span className="text-zinc-400 text-sm">
                Last updated: {new Date(MARKET_OVERVIEW_STATS.reportDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
              <span className="text-zinc-600">•</span>
              <span className="text-zinc-500 text-sm">
                {MARKET_OVERVIEW_STATS.dataSource}
              </span>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};
