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
import {
  MI_EYEBROW,
  MI_H2,
  MI_LEAD,
  MI_CARD_TITLE,
  MI_BODY,
  MI_BODY_MUTED,
  MI_CAPTION,
  MI_KPI,
  MI_CHIP,
} from "./MarketIntelligenceTypography";

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

/* ICON BOX — navy blue with white icon (global standard) */
const IconBox = ({ icon: Icon, className = "" }: { icon: React.ElementType; className?: string }) => (
  <div
    data-no-contrast-guard
    className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 bg-[#102540] border border-[#102540]/40 shadow-sm allow-white ${className}`}
  >
    <Icon className="w-6 h-6 text-white allow-white" />
  </div>
);

const StatCard = ({ 
  title, 
  value, 
  change, 
  icon: Icon, 
  suffix = "",
  prefix = "",
  accentColor = "text-foreground"
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
      <Card className="transition-all h-full bg-card border border-[#102540]/35 hover:border-[#102540]/60 hover:shadow-[0_4px_20px_rgba(16,37,64,0.12)]">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <IconBox icon={Icon} />
            <div className={`flex items-center gap-1 ${MI_CHIP} px-2 py-0.5 rounded-full ${isPositive ? 'text-emerald-700 bg-emerald-50' : 'text-red-700 bg-red-50'}`}>
              {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              <span>{isPositive ? '+' : ''}{change}%</span>
            </div>
          </div>
          <div className="mt-4">
            <p className="text-sm font-semibold leading-snug text-[#102540] mb-1">{title}</p>
            <p className={`${MI_KPI} ${accentColor ?? 'text-foreground'} truncate`}>
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
    <section className="surface-light py-16 bg-background" data-surface="light">
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
              Market Overview
            </span>
            <h2 className={`${MI_H2} mb-4`}>
              Dubai Real Estate Dashboard
            </h2>
            <p className={`${MI_LEAD} max-w-2xl mx-auto`}>
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
              accentColor="text-emerald-700"
            />
            <StatCard
              title="Avg. Price/Sqft"
              value={MARKET_OVERVIEW_STATS.avgPricePerSqft}
              change={MARKET_OVERVIEW_STATS.avgPriceChange}
              icon={DollarSign}
              prefix="AED "
              accentColor="text-blue-700"
            />
            <StatCard
              title="Avg. Rental Yield"
              value={MARKET_OVERVIEW_STATS.avgRentalYield}
              change={MARKET_OVERVIEW_STATS.yieldChange}
              icon={Percent}
              suffix="%"
              accentColor="text-amber-700"
            />
            <StatCard
              title="Days on Market"
              value={MARKET_OVERVIEW_STATS.daysOnMarket}
              change={MARKET_OVERVIEW_STATS.domChange}
              icon={Clock}
              suffix=" days"
              accentColor="text-foreground"
            />
          </div>

          {/* Charts Section */}
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Quarterly Trends */}
            <motion.div variants={fadeInUp}>
              <Card className="h-full bg-card border border-[#102540]/35 hover:border-[#102540]/60 transition-all">
                <CardHeader>
                  <CardTitle className="text-[#102540] flex items-center gap-3">
                    <IconBox icon={BarChart3} className="w-10 h-10" />
                    <span>Quarterly Transaction Trends</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {QUARTERLY_TRENDS.map((quarter, idx) => {
                      const qBars = [
                        'bg-gradient-to-r from-emerald-500 to-emerald-400',
                        'bg-gradient-to-r from-blue-500 to-blue-400',
                        'bg-gradient-to-r from-amber-500 to-amber-400',
                        'bg-gradient-to-r from-violet-500 to-violet-400',
                      ];
                      return (
                        <div key={quarter.quarter} className="flex items-center gap-4">
                          <span className="text-sm font-semibold leading-none w-20 text-foreground">{quarter.quarter}</span>
                          <div className="flex-1 h-8 rounded-lg overflow-hidden relative shadow-inner bg-muted">
                            <motion.div
                              className={`h-full ${qBars[idx % qBars.length]}`}
                              initial={{ width: 0 }}
                              whileInView={{ width: `${(quarter.transactions / 40000) * 100}%` }}
                              viewport={{ once: true }}
                              transition={{ duration: 0.8, delay: idx * 0.1 }}
                            />
                            <span className={`absolute right-3 top-1/2 -translate-y-1/2 ${MI_CHIP} text-foreground`}>
                              {quarter.transactions.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <p className={`${MI_CAPTION} mt-4`}>
                    Source: Dubai Government Open Data
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            {/* Property Type Breakdown */}
            <motion.div variants={fadeInUp}>
              <Card className="h-full bg-card border border-[#102540]/35 hover:border-[#102540]/60 transition-all">
                <CardHeader>
                  <CardTitle className="text-[#102540] flex items-center gap-3">
                    <IconBox icon={Building2} className="w-10 h-10" />
                    <span>Price by Property Type</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {PROPERTY_TYPE_TRENDS.map((prop) => (
                      <div key={prop.type} className="flex items-center justify-between py-3 border-b last:border-0 border-border/60">
                        <div>
                          <p className="text-base font-semibold leading-snug text-foreground">{prop.type}</p>
                          <p className={MI_CAPTION}>{prop.volume.toLocaleString()} transactions</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold leading-none tracking-tight text-foreground">AED {prop.avgPrice.toLocaleString()}/sqft</p>
                          <p className={`${MI_CHIP} mt-1 ${prop.change >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
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
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border bg-muted border-border">
              <Calendar className="w-4 h-4 text-foreground" />
              <span className="text-sm font-semibold leading-none text-foreground">
                Last updated: {new Date(MARKET_OVERVIEW_STATS.reportDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
              <span className="text-muted-foreground">•</span>
              <span className={MI_BODY_MUTED}>
                {MARKET_OVERVIEW_STATS.dataSource}
              </span>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};
