import { motion } from "framer-motion";
import { MapPin, TrendingUp, TrendingDown, BarChart3, Database, Shield, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import Footer from "@/components/Footer";
import { SEOHead } from "@/components/SEOHead";
import { MarketIntelligenceSchema } from "@/components/seo/MarketIntelligenceSchema";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DUBAI_AREAS_MARKET_DATA, MARKET_DISCLAIMER } from "@/config/open-data-config";

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

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
            <MapPin className="w-6 h-6 text-gold" />
            <span className="text-gold text-sm uppercase tracking-[0.3em]">Market Intelligence</span>
          </motion.div>

          <motion.h1 
            className="text-white text-4xl md:text-5xl lg:text-6xl font-bold mb-6"
            style={{ fontFamily: "Poppins, sans-serif" }}
            variants={fadeInUp}
          >
            Area Intelligence
          </motion.h1>

          <motion.p className="text-zinc-400 text-lg md:text-xl max-w-2xl mx-auto" variants={fadeInUp}>
            Deep dive into Dubai's prime neighborhoods with historical trends and market analysis.
          </motion.p>
        </motion.div>
      </section>

      {/* Areas Grid */}
      <section className="py-16 border-t border-zinc-900">
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
                  <Card className="bg-zinc-900/50 border-zinc-800 hover:border-gold/30 transition-all h-full group cursor-pointer">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-white font-bold text-lg group-hover:text-gold transition-colors">{area.area}</h3>
                          {getTrendBadge(area.trend)}
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-1">
                            {area.yoyChange > 0 ? (
                              <TrendingUp className="w-4 h-4 text-emerald-400" />
                            ) : (
                              <TrendingDown className="w-4 h-4 text-red-400" />
                            )}
                            <span className={area.yoyChange > 0 ? 'text-emerald-400' : 'text-red-400'}>
                              {area.yoyChange > 0 ? '+' : ''}{area.yoyChange}%
                            </span>
                          </div>
                          <p className="text-zinc-600 text-xs">YoY</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-zinc-500 text-xs">Price Index</p>
                          <p className="text-white font-semibold">{area.priceIndex}</p>
                        </div>
                        <div>
                          <p className="text-zinc-500 text-xs">Rental Index</p>
                          <p className="text-white font-semibold">{area.rentalIndex}</p>
                        </div>
                        <div>
                          <p className="text-zinc-500 text-xs">Demand</p>
                          <div className="w-full bg-zinc-800 rounded-full h-1.5 mt-1">
                            <div 
                              className="bg-emerald-500 h-1.5 rounded-full" 
                              style={{ width: `${area.demandScore}%` }}
                            />
                          </div>
                        </div>
                        <div>
                          <p className="text-zinc-500 text-xs">Supply</p>
                          <div className="w-full bg-zinc-800 rounded-full h-1.5 mt-1">
                            <div 
                              className="bg-amber-500 h-1.5 rounded-full" 
                              style={{ width: `${area.supplyScore}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="border-t border-zinc-800 pt-4">
                        <ul className="space-y-1">
                          {area.highlights.slice(0, 2).map((highlight, i) => (
                            <li key={i} className="text-zinc-500 text-xs flex items-start gap-2">
                              <span className="text-gold">•</span>
                              {highlight}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="mt-4 flex items-center justify-between text-gold text-sm">
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

      {/* Internal Links - WHITE BACKGROUND */}
      <section className="py-12 bg-white border-t border-zinc-200">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-4 max-w-3xl mx-auto">
            <Link to="/market-intelligence/overview" className="group">
              <Card className="bg-zinc-50 border-zinc-200 hover:border-gold/50 hover:shadow-lg transition-all">
                <CardContent className="p-4 flex items-center justify-between">
                  <span className="text-black font-medium group-hover:text-gold transition-colors">Market Overview</span>
                  <ArrowRight className="w-4 h-4 text-gold" />
                </CardContent>
              </Card>
            </Link>
            <Link to="/market-intelligence/reports" className="group">
              <Card className="bg-zinc-50 border-zinc-200 hover:border-gold/50 hover:shadow-lg transition-all">
                <CardContent className="p-4 flex items-center justify-between">
                  <span className="text-black font-medium group-hover:text-gold transition-colors">Market Reports</span>
                  <ArrowRight className="w-4 h-4 text-gold" />
                </CardContent>
              </Card>
            </Link>
            <Link to="/market-intelligence/methodology" className="group">
              <Card className="bg-zinc-50 border-zinc-200 hover:border-gold/50 hover:shadow-lg transition-all">
                <CardContent className="p-4 flex items-center justify-between">
                  <span className="text-black font-medium group-hover:text-gold transition-colors">Methodology</span>
                  <ArrowRight className="w-4 h-4 text-gold" />
                </CardContent>
              </Card>
            </Link>
          </div>
          
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

      <Footer />
    </div>
  );
};

export default AreaIntelligence;
