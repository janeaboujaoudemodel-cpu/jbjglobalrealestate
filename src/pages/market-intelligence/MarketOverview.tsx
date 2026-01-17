import { motion } from "framer-motion";
import { BarChart3, TrendingUp, TrendingDown, Minus, Database, Shield, ArrowUpRight, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import Footer from "@/components/Footer";
import { SEOHead } from "@/components/SEOHead";
import { MarketIntelligenceSchema } from "@/components/seo/MarketIntelligenceSchema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MARKET_OVERVIEW_STATS, QUARTERLY_TRENDS, PROPERTY_TYPE_TRENDS, MARKET_DISCLAIMER } from "@/config/open-data-config";

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

const MarketOverview = () => {
  const stats = [
    {
      label: "Total Transactions",
      value: MARKET_OVERVIEW_STATS.totalTransactions.toLocaleString(),
      change: MARKET_OVERVIEW_STATS.totalTransactionsChange,
      period: "YoY"
    },
    {
      label: "Avg Price/Sqft",
      value: `AED ${MARKET_OVERVIEW_STATS.avgPricePerSqft.toLocaleString()}`,
      change: MARKET_OVERVIEW_STATS.avgPriceChange,
      period: "YoY"
    },
    {
      label: "Avg Rental Yield",
      value: `${MARKET_OVERVIEW_STATS.avgRentalYield}%`,
      change: MARKET_OVERVIEW_STATS.yieldChange,
      period: "YoY"
    },
    {
      label: "Days on Market",
      value: MARKET_OVERVIEW_STATS.daysOnMarket.toString(),
      change: MARKET_OVERVIEW_STATS.domChange,
      period: "YoY"
    },
  ];

  const getTrendIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="w-4 h-4 text-emerald-400" />;
    if (change < 0) return <TrendingDown className="w-4 h-4 text-red-400" />;
    return <Minus className="w-4 h-4 text-zinc-400" />;
  };

  return (
    <div className="min-h-screen bg-black">
      <SEOHead 
        title="Dubai Real Estate Market Overview | BUY · SELL · RENT Trends | JBJ GLOBAL REAL ESTATE"
        description="UAE & Dubai real estate market trends and analysis. Transaction volumes, price movements, and rent trends powered by official government Open Data. No predictions, just insights."
        keywords="Dubai real estate market trends, Dubai property market analysis, Dubai rent trends, UAE property prices, Dubai transaction volume, real estate market overview"
        canonicalPath="/market-intelligence/overview"
      />
      <MarketIntelligenceSchema 
        type="overview" 
        lastUpdated={MARKET_OVERVIEW_STATS.reportDate}
        description="UAE & Dubai real estate macro snapshot with high-level transaction trends, price movements, and rent analysis powered by official government Open Data."
      />

      {/* Hero */}
      <section className="relative min-h-[50vh] flex items-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-900/50 via-black to-black" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-gold/5 via-transparent to-transparent" />
        
        <motion.div 
          className="relative z-10 container mx-auto px-4 py-24 text-center"
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.15 } } }}
        >
          <motion.div className="flex items-center justify-center gap-2 mb-6" variants={fadeInUp}>
            <BarChart3 className="w-6 h-6 text-gold" />
            <span className="text-gold text-sm uppercase tracking-[0.3em]">Market Intelligence</span>
          </motion.div>

          <motion.h1 
            className="text-white text-4xl md:text-5xl lg:text-6xl font-bold mb-6"
            style={{ fontFamily: "Poppins, sans-serif" }}
            variants={fadeInUp}
          >
            Market Overview
          </motion.h1>

          <motion.p className="text-zinc-400 text-lg md:text-xl max-w-2xl mx-auto" variants={fadeInUp}>
            UAE & Dubai macro snapshot with high-level transaction trends and price movements.
          </motion.p>
        </motion.div>
      </section>

      {/* Key Stats Grid */}
      <section className="py-16 border-t border-zinc-900">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="bg-zinc-900/50 border-zinc-800 text-center p-6">
                  <CardContent className="p-0">
                    <p className="text-zinc-500 text-sm mb-2">{stat.label}</p>
                    <p className="text-white text-3xl font-bold mb-2">{stat.value}</p>
                    <div className="flex items-center justify-center gap-2">
                      {getTrendIcon(stat.change)}
                      <span className={`text-sm ${stat.change > 0 ? 'text-emerald-400' : stat.change < 0 ? 'text-red-400' : 'text-zinc-400'}`}>
                        {stat.change > 0 ? '+' : ''}{stat.change}% {stat.period}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          <p className="text-center text-zinc-600 text-xs mt-6">
            Source: {MARKET_OVERVIEW_STATS.dataSource} | Last Updated: {MARKET_OVERVIEW_STATS.reportDate}
          </p>
        </div>
      </section>

      {/* Transaction Trends */}
      <section className="py-16 border-t border-zinc-900">
        <div className="container mx-auto px-4">
          <h2 className="text-white text-2xl md:text-3xl font-bold mb-8 text-center" style={{ fontFamily: "Poppins, sans-serif" }}>
            Quarterly Transaction Trends
          </h2>
          
          <div className="grid md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {QUARTERLY_TRENDS.map((quarter, index) => (
              <Card key={quarter.quarter} className="bg-zinc-900/50 border-zinc-800">
                <CardHeader className="pb-2">
                  <CardTitle className="text-gold text-sm">{quarter.quarter}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-white text-2xl font-bold">{quarter.transactions.toLocaleString()}</p>
                  <p className="text-zinc-500 text-xs">Transactions</p>
                  <div className="mt-3 pt-3 border-t border-zinc-800">
                    <p className="text-zinc-400 text-sm">AED {quarter.avgPrice}/sqft</p>
                    <div className="w-full bg-zinc-800 rounded-full h-1.5 mt-2">
                      <div 
                        className="bg-gradient-to-r from-gold to-gold-light h-1.5 rounded-full" 
                        style={{ width: `${quarter.index}%` }}
                      />
                    </div>
                    <p className="text-zinc-600 text-xs mt-1">Index: {quarter.index}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Property Type Performance */}
      <section className="py-16 border-t border-zinc-900">
        <div className="container mx-auto px-4">
          <h2 className="text-white text-2xl md:text-3xl font-bold mb-8 text-center" style={{ fontFamily: "Poppins, sans-serif" }}>
            Performance by Property Type
          </h2>

          <div className="max-w-3xl mx-auto space-y-4">
            {PROPERTY_TYPE_TRENDS.map((type) => (
              <div key={type.type} className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-white font-semibold">{type.type}</p>
                  <p className="text-zinc-500 text-sm">{type.volume.toLocaleString()} transactions</p>
                </div>
                <div className="text-right">
                  <p className="text-white font-bold">AED {type.avgPrice}/sqft</p>
                  <div className="flex items-center gap-1 justify-end">
                    {getTrendIcon(type.change)}
                    <span className={`text-sm ${type.change > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {type.change > 0 ? '+' : ''}{type.change}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Navigation Links */}
      <section className="py-16 border-t border-zinc-900">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <Link to="/market-intelligence/areas" className="group">
              <Card className="bg-zinc-900/50 border-zinc-800 hover:border-gold/30 transition-all h-full">
                <CardContent className="p-6">
                  <h3 className="text-white font-bold mb-2 group-hover:text-gold transition-colors">Area Intelligence</h3>
                  <p className="text-zinc-500 text-sm mb-4">Deep dive into specific Dubai areas with historical trends.</p>
                  <ArrowRight className="w-5 h-5 text-gold" />
                </CardContent>
              </Card>
            </Link>
            <Link to="/market-intelligence/reports" className="group">
              <Card className="bg-zinc-900/50 border-zinc-800 hover:border-gold/30 transition-all h-full">
                <CardContent className="p-6">
                  <h3 className="text-white font-bold mb-2 group-hover:text-gold transition-colors">Market Reports</h3>
                  <p className="text-zinc-500 text-sm mb-4">Download monthly, quarterly, and annual market reports.</p>
                  <ArrowRight className="w-5 h-5 text-gold" />
                </CardContent>
              </Card>
            </Link>
            <Link to="/market-intelligence/methodology" className="group">
              <Card className="bg-zinc-900/50 border-zinc-800 hover:border-gold/30 transition-all h-full">
                <CardContent className="p-6">
                  <h3 className="text-white font-bold mb-2 group-hover:text-gold transition-colors">Methodology</h3>
                  <p className="text-zinc-500 text-sm mb-4">Learn about our data sources and aggregation methods.</p>
                  <ArrowRight className="w-5 h-5 text-gold" />
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      </section>

      {/* Disclaimer */}
      <section className="py-12 border-t border-zinc-900">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto bg-zinc-900/30 border border-zinc-800 rounded-xl p-6 text-center">
            <div className="flex items-center justify-center gap-4 mb-4">
              <Database className="w-5 h-5 text-gold" />
              <Shield className="w-5 h-5 text-gold" />
            </div>
            <p className="text-zinc-500 text-sm whitespace-pre-line">{MARKET_DISCLAIMER}</p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default MarketOverview;
