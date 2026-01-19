import { motion } from "framer-motion";
import { MapPin, TrendingUp, TrendingDown, Database, Shield, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import Footer from "@/components/Footer";
import PreFooterSeparator from "@/components/PreFooterSeparator";
import { SEOHead } from "@/components/SEOHead";
import { MarketIntelligenceSchema } from "@/components/seo/MarketIntelligenceSchema";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DUBAI_AREAS_MARKET_DATA, MARKET_DISCLAIMER } from "@/config/open-data-config";
import { MarketIntelligenceHero, MarketIntelligenceNavigation } from "@/components/market-intelligence";

const AreaIntelligence = () => {
  const getTrendBadge = (trend: string) => {
    switch (trend) {
      case 'bullish':
        return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">Bullish</Badge>;
      case 'bearish':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Bearish</Badge>;
      default:
        return <Badge className="bg-zinc-500/20 text-zinc-400 border-zinc-500/30">Neutral</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-black">
      <SEOHead 
        title="Dubai Area Intelligence | Rent Trends & Property Prices by Neighborhood | JBJ GLOBAL REAL ESTATE"
        description="Deep dive into Dubai neighborhoods. Historical price trends, rent analysis, demand vs supply indicators, and market insights for BUY · SELL · RENT decisions."
        keywords="Dubai areas property prices, rent trends Dubai Marina, Business Bay real estate, Downtown Dubai prices, Palm Jumeirah market, JBR property trends, Dubai neighborhood analysis"
        canonicalPath="/market-intelligence/areas"
      />
      <MarketIntelligenceSchema 
        type="area"
        description="Deep dive into Dubai's prime neighborhoods with historical price trends, rent analysis, and demand indicators for informed BUY · SELL · RENT decisions."
      />

      {/* Premium Hero with Video */}
      <MarketIntelligenceHero
        badge="Market Intelligence"
        badgeIcon={MapPin}
        title="Area Intelligence"
        description="Deep dive into Dubai's prime neighborhoods with historical trends, demand vs supply indicators, and market analysis powered by official Open Data."
        videoSrc="https://videos.pexels.com/video-files/5529539/5529539-uhd_2560_1440_30fps.mp4"
        videoPoster="https://images.unsplash.com/photo-1582672060674-bc2bd808a8b5?w=1920&q=80"
      />

      {/* Areas Grid - White Pearl / Champagne Gold Cards */}
      <section className="py-16 border-t border-zinc-800">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {DUBAI_AREAS_MARKET_DATA.map((area, index) => (
              <motion.div
                key={area.area}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
              >
                <Link to={`/market-intelligence/areas/${area.area.toLowerCase().replace(/\s+/g, '-')}`}>
                  <Card className="bg-gradient-to-br from-white via-[#FDFBF7] to-[#F5F0E6] border border-gold/30 hover:border-gold hover:shadow-lg hover:shadow-gold/10 transition-all h-full group cursor-pointer">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-black font-bold text-lg group-hover:text-gold transition-colors">{area.area}</h3>
                          {getTrendBadge(area.trend)}
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-1">
                            {area.yoyChange > 0 ? (
                              <TrendingUp className="w-4 h-4 text-emerald-500" />
                            ) : (
                              <TrendingDown className="w-4 h-4 text-red-500" />
                            )}
                            <span className={area.yoyChange > 0 ? 'text-emerald-600' : 'text-red-600'}>
                              {area.yoyChange > 0 ? '+' : ''}{area.yoyChange}%
                            </span>
                          </div>
                          <p className="text-zinc-500 text-xs">YoY</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="bg-zinc-100 rounded-lg p-2">
                          <p className="text-zinc-500 text-xs">Price Index</p>
                          <p className="text-black font-semibold">{area.priceIndex}</p>
                        </div>
                        <div className="bg-zinc-100 rounded-lg p-2">
                          <p className="text-zinc-500 text-xs">Rental Index</p>
                          <p className="text-black font-semibold">{area.rentalIndex}</p>
                        </div>
                        <div>
                          <p className="text-zinc-500 text-xs">Demand</p>
                          <div className="w-full bg-zinc-200 rounded-full h-1.5 mt-1">
                            <div 
                              className="bg-emerald-500 h-1.5 rounded-full" 
                              style={{ width: `${area.demandScore}%` }}
                            />
                          </div>
                        </div>
                        <div>
                          <p className="text-zinc-500 text-xs">Supply</p>
                          <div className="w-full bg-zinc-200 rounded-full h-1.5 mt-1">
                            <div 
                              className="bg-gold h-1.5 rounded-full" 
                              style={{ width: `${area.supplyScore}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="border-t border-zinc-200 pt-4">
                        <ul className="space-y-1">
                          {area.highlights.slice(0, 2).map((highlight, i) => (
                            <li key={i} className="text-zinc-600 text-xs flex items-start gap-2">
                              <span className="text-gold">•</span>
                              {highlight}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="mt-4 flex items-center justify-between text-gold text-sm font-medium">
                        <span>View Full Analysis</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Market Intelligence Navigation */}
      <section className="py-12 bg-gradient-to-br from-white via-[#FDFBF7] to-[#F5F0E6] border-t border-zinc-200">
        <div className="container mx-auto px-4">
          <MarketIntelligenceNavigation current="/market-intelligence/areas" />
          
          {/* Disclaimer Box */}
          <div className="max-w-3xl mx-auto mt-8">
            <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-6 text-center">
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
        subtitle="Get a high-level overview of the market or download detailed reports."
        primaryLink="/market-intelligence/overview"
        primaryText="Market Overview"
        secondaryLink="/market-intelligence/reports"
        secondaryText="Market Reports"
      />
      <Footer />
    </div>
  );
};

export default AreaIntelligence;
