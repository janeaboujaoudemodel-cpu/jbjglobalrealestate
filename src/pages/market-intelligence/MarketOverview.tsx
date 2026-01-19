import { motion } from "framer-motion";
import { BarChart3, TrendingUp, TrendingDown, Minus, Database, Shield, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import Footer from "@/components/Footer";
import PreFooterSeparator from "@/components/PreFooterSeparator";
import { SEOHead } from "@/components/SEOHead";
import { MarketIntelligenceSchema } from "@/components/seo/MarketIntelligenceSchema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MARKET_OVERVIEW_STATS, QUARTERLY_TRENDS, PROPERTY_TYPE_TRENDS, MARKET_DISCLAIMER } from "@/config/open-data-config";
import { MarketIntelligenceHero, MarketIntelligenceNavigation } from "@/components/market-intelligence";

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

      {/* Premium Hero with Video */}
      <MarketIntelligenceHero
        badge="Market Intelligence"
        badgeIcon={BarChart3}
        title="Market Overview"
        description="UAE & Dubai macro snapshot with high-level transaction trends, price movements, and rent analysis powered by official government Open Data."
        videoSrc="https://videos.pexels.com/video-files/3571264/3571264-uhd_2560_1440_30fps.mp4"
        videoPoster="https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1920&q=80"
      />

      {/* Key Stats Grid - Black background with white cards */}
      <section className="py-16 border-t border-zinc-800 bg-black">
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
                <Card className="bg-white border-zinc-200 text-center p-6 hover:border-gold/50 hover:shadow-lg transition-all">
                  <CardContent className="p-0">
                    <p className="text-zinc-500 text-sm mb-2">{stat.label}</p>
                    <p className="text-black text-3xl font-bold mb-2">{stat.value}</p>
                    <div className="flex items-center justify-center gap-2">
                      {getTrendIcon(stat.change)}
                      <span className={`text-sm ${stat.change > 0 ? 'text-emerald-500' : stat.change < 0 ? 'text-red-500' : 'text-zinc-400'}`}>
                        {stat.change > 0 ? '+' : ''}{stat.change}% {stat.period}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          <p className="text-center text-zinc-400 text-xs mt-6">
            Source: {MARKET_OVERVIEW_STATS.dataSource} | Last Updated: {MARKET_OVERVIEW_STATS.reportDate}
          </p>
        </div>
      </section>

      {/* Transaction Trends - Black background with white cards */}
      <section className="py-16 border-t border-zinc-800 bg-black">
        <div className="container mx-auto px-4">
          <h2 className="text-white text-2xl md:text-3xl font-bold mb-8 text-center" style={{ fontFamily: "Poppins, sans-serif" }}>
            Quarterly Transaction Trends
          </h2>
          
          <div className="grid md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {QUARTERLY_TRENDS.map((quarter, index) => (
              <Card key={quarter.quarter} className="bg-white border-zinc-200 hover:border-gold/50 hover:shadow-lg transition-all">
                <CardHeader className="pb-2">
                  <CardTitle className="text-gold text-sm">{quarter.quarter}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-black text-2xl font-bold">{quarter.transactions.toLocaleString()}</p>
                  <p className="text-zinc-500 text-xs">Transactions</p>
                  <div className="mt-3 pt-3 border-t border-zinc-200">
                    <p className="text-zinc-700 text-sm">AED {quarter.avgPrice}/sqft</p>
                    <div className="w-full bg-zinc-200 rounded-full h-1.5 mt-2">
                      <div 
                        className="bg-gradient-to-r from-gold to-gold-light h-1.5 rounded-full" 
                        style={{ width: `${quarter.index}%` }}
                      />
                    </div>
                    <p className="text-zinc-500 text-xs mt-1">Index: {quarter.index}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Property Type Performance - Black background with white cards */}
      <section className="py-16 border-t border-zinc-800 bg-black">
        <div className="container mx-auto px-4">
          <h2 className="text-white text-2xl md:text-3xl font-bold mb-8 text-center" style={{ fontFamily: "Poppins, sans-serif" }}>
            Performance by Property Type
          </h2>

          <div className="max-w-3xl mx-auto space-y-4">
            {PROPERTY_TYPE_TRENDS.map((type) => (
              <div key={type.type} className="bg-white border border-zinc-200 rounded-xl p-4 flex items-center justify-between hover:border-gold/50 hover:shadow-lg transition-all">
                <div>
                  <p className="text-black font-semibold">{type.type}</p>
                  <p className="text-zinc-500 text-sm">{type.volume.toLocaleString()} transactions</p>
                </div>
                <div className="text-right">
                  <p className="text-black font-bold">AED {type.avgPrice}/sqft</p>
                  <div className="flex items-center gap-1 justify-end">
                    {getTrendIcon(type.change)}
                    <span className={`text-sm ${type.change > 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                      {type.change > 0 ? '+' : ''}{type.change}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Market Intelligence Navigation */}
      <section className="py-16 border-t border-zinc-200 bg-gradient-to-br from-white via-[#FDFBF7] to-[#F5F0E6]">
        <div className="container mx-auto px-4">
          <MarketIntelligenceNavigation current="/market-intelligence/overview" showStartHere={false} />
          
          {/* Disclaimer Box - White style */}
          <div className="max-w-3xl mx-auto mt-8">
            <div className="bg-white border border-zinc-200 rounded-xl p-6 text-center">
              <div className="flex items-center justify-center gap-4 mb-4">
                <Database className="w-5 h-5 text-gold" />
                <Shield className="w-5 h-5 text-gold" />
              </div>
              <p className="text-zinc-600 text-sm whitespace-pre-line">{MARKET_DISCLAIMER}</p>
            </div>
          </div>
        </div>
      </section>

      <PreFooterSeparator 
        title="Explore More Market Intelligence"
        subtitle="Dive deeper into area-specific data and detailed market reports."
        primaryLink="/market-intelligence/areas"
        primaryText="View Area Intelligence"
        secondaryLink="/market-intelligence/reports"
        secondaryText="Browse Reports"
      />
      <Footer />
    </div>
  );
};

export default MarketOverview;
