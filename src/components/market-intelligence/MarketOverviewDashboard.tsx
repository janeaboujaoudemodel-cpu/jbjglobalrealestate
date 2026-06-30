import { motion } from "framer-motion";
import { 
  TrendingUp, TrendingDown, Building2, DollarSign, 
  Calendar, BarChart3, Percent, Clock
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  MARKET_OVERVIEW_STATS,
  QUARTERLY_TRENDS,
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

/* Icon box — emerald standard with white glyph */
const IconBox = ({ icon: Icon, className = "" }: { icon: React.ElementType; className?: string }) => (
  <div className={`mi-icon-tile mi-no-flip ${className}`}>
    <Icon className="w-5 h-5" />
  </div>
);

const StatCard = ({
  title,
  value,
  change,
  icon: Icon,
  suffix = "",
  prefix = "",
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
      <Card className="mi-gold-frame h-full rounded-2xl">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <IconBox icon={Icon} />
            <span className="mi-chip-gold">
              {isPositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
              <span>{isPositive ? '+' : ''}{change}%</span>
            </span>
          </div>
          <div className="mt-4">
            <p className="text-sm font-semibold leading-snug text-[#1A1A1A] mb-1">{title}</p>
            <p className={`${MI_KPI} text-[#1A1A1A] truncate`}>
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
              Market Overview
            </span>
            <h2 className={`${MI_H2} mb-4`}>
              Dubai Real Estate Dashboard
            </h2>
                  <p className={`${MI_LEAD} max-w-2xl mx-auto`}>
              High-level market metrics refreshed daily from official government sources.
            </p>
          </motion.div>

          {/* Stats Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            <StatCard
              title="Annual Transactions"
              value={MARKET_OVERVIEW_STATS.totalTransactions}
              change={MARKET_OVERVIEW_STATS.totalTransactionsChange}
              icon={Building2}
              accentColor="text-[#1A1A1A]"
            />
            <StatCard
              title="Avg. Price/Sqft"
              value={MARKET_OVERVIEW_STATS.avgPricePerSqft}
              change={MARKET_OVERVIEW_STATS.avgPriceChange}
              icon={DollarSign}
              prefix="AED "
              accentColor="text-[#1A1A1A]"
            />
            <StatCard
              title="Rent Index"
              value={MARKET_OVERVIEW_STATS.avgRentIndex}
              change={MARKET_OVERVIEW_STATS.rentIndexChange}
              icon={Percent}
              accentColor="text-[#1A1A1A]"
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
          <div className="grid grid-cols-1 gap-8">
            {/* Quarterly Trends */}
            <motion.div variants={fadeInUp}>
              <Card className="h-full rounded-2xl mi-gold-frame transition-all">
                <CardHeader>
                  <CardTitle className="text-[#1A1A1A] flex items-center gap-3">
                    <IconBox icon={BarChart3} className="mi-icon-tile-lg" />
                    <span>Quarterly Transaction Trends</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {QUARTERLY_TRENDS.map((quarter, idx) => {
                      return (
                        <div key={quarter.quarter} className="flex items-center gap-4">
                          <span className="text-sm font-semibold leading-none w-20 text-foreground">{quarter.quarter}</span>
                          <div className="flex-1 h-8 rounded-lg overflow-hidden relative shadow-inner bg-[#EFE6D6] border border-[#B89555]/30">
                            <motion.div
                              className="h-full mi-bar-emerald"
                              initial={{ width: 0 }}
                              whileInView={{ width: `${(quarter.transactions / 40000) * 100}%` }}
                              viewport={{ once: true }}
                              transition={{ duration: 0.8, delay: idx * 0.1 }}
                            />
                            <span className={`absolute right-2 top-1/2 -translate-y-1/2 ${MI_CHIP} rounded border border-[#B89555]/35 bg-[#FDFBF7] px-2 py-1 text-foreground shadow-sm`}>
                              {quarter.transactions.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <p className={`${MI_CAPTION} mt-4`}>
                    Source: Official government sources
                  </p>
                </CardContent>
              </Card>
            </motion.div>

          </div>


          {/* Data Attribution */}
          <motion.div
            className="mt-8 text-center"
            variants={fadeInUp}
          >
            <div className="mi-kicker-emerald inline-flex flex-wrap items-center justify-center gap-2 px-4 py-2 text-sm normal-case tracking-normal">
              <Calendar className="w-4 h-4" />
              <span className="font-semibold">
                Daily freshness check: {new Date(MARKET_OVERVIEW_STATS.reportDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
              <span className="opacity-70">•</span>
              <span className="opacity-90">
                {MARKET_OVERVIEW_STATS.dataSource}
              </span>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};
