import { motion } from "framer-motion";
import { MapPin, TrendingUp, TrendingDown, BarChart3, Database, Shield, ArrowLeft, Info, Building2, Users, Home } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import Footer from "@/components/Footer";
import { SEOHead } from "@/components/SEOHead";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DUBAI_AREAS_MARKET_DATA, MARKET_DISCLAIMER } from "@/config/open-data-config";

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

const MarketAreaDetail = () => {
  const { slug } = useParams();
  
  const area = DUBAI_AREAS_MARKET_DATA.find(
    a => a.area.toLowerCase().replace(/\s+/g, '-') === slug
  );

  if (!area) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-white text-2xl font-bold mb-4">Area Not Found</h1>
          <Link to="/market-intelligence/areas">
            <Button variant="outline" className="border-gold text-gold">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Areas
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const getTrendBadge = (trend: string) => {
    switch (trend) {
      case 'bullish':
        return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-lg px-4 py-1">Bullish</Badge>;
      case 'bearish':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-lg px-4 py-1">Bearish</Badge>;
      default:
        return <Badge className="bg-zinc-500/20 text-zinc-400 border-zinc-500/30 text-lg px-4 py-1">Neutral</Badge>;
    }
  };

  // AI-generated explanation based on data
  const generateExplanation = () => {
    const demandSupplyRatio = area.demandScore / area.supplyScore;
    let explanation = `**${area.area}** is currently showing a **${area.trend}** market trend with prices moving **${area.yoyChange > 0 ? 'upward' : 'downward'}** by ${Math.abs(area.yoyChange)}% year-over-year.\n\n`;
    
    if (demandSupplyRatio > 1.5) {
      explanation += `**Why this area performs this way:** The demand-to-supply ratio of ${demandSupplyRatio.toFixed(1)} indicates strong buyer interest outpacing available inventory. This supply constraint typically supports price appreciation.\n\n`;
    } else if (demandSupplyRatio < 0.8) {
      explanation += `**Why this area performs this way:** With supply exceeding demand, buyers have more negotiating power. This typically leads to price moderation or more incentives from sellers.\n\n`;
    } else {
      explanation += `**Why this area performs this way:** The market shows balanced supply and demand dynamics, leading to stable pricing and healthy transaction volumes.\n\n`;
    }
    
    explanation += `**Note:** This analysis is based on aggregated Open Data and is for informational purposes only. It does not constitute financial advice.`;
    
    return explanation;
  };

  return (
    <div className="min-h-screen bg-black">
      <SEOHead 
        title={`${area.area} Market Intelligence | JBJ Global Real Estate`}
        description={`${area.area} real estate market analysis. Historical price trends, rental analysis, and demand indicators powered by official government Open Data.`}
        keywords={`${area.area} property prices, ${area.area} real estate, Dubai ${area.area} market`}
        canonicalPath={`/market-intelligence/areas/${slug}`}
      />

      {/* Hero */}
      <section className="relative min-h-[40vh] flex items-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-900/50 via-black to-black" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-gold/5 via-transparent to-transparent" />
        
        <motion.div 
          className="relative z-10 container mx-auto px-4 py-24"
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.15 } } }}
        >
          <motion.div variants={fadeInUp}>
            <Link to="/market-intelligence/areas" className="inline-flex items-center gap-2 text-gold hover:text-gold-light mb-6">
              <ArrowLeft className="w-4 h-4" />
              Back to All Areas
            </Link>
          </motion.div>

          <motion.div className="flex items-center gap-3 mb-4" variants={fadeInUp}>
            <MapPin className="w-8 h-8 text-gold" />
            <span className="text-gold text-sm uppercase tracking-[0.3em]">Area Intelligence</span>
          </motion.div>

          <motion.h1 
            className="text-white text-4xl md:text-5xl lg:text-6xl font-bold mb-4"
            style={{ fontFamily: "Poppins, sans-serif" }}
            variants={fadeInUp}
          >
            {area.area}
          </motion.h1>

          <motion.div className="flex items-center gap-4" variants={fadeInUp}>
            {getTrendBadge(area.trend)}
            <div className="flex items-center gap-2">
              {area.yoyChange > 0 ? (
                <TrendingUp className="w-5 h-5 text-emerald-400" />
              ) : (
                <TrendingDown className="w-5 h-5 text-red-400" />
              )}
              <span className={`text-lg font-semibold ${area.yoyChange > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {area.yoyChange > 0 ? '+' : ''}{area.yoyChange}% YoY
              </span>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* Key Metrics */}
      <section className="py-12 border-t border-zinc-900">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-zinc-900/50 border-zinc-800">
              <CardContent className="p-6 text-center">
                <BarChart3 className="w-8 h-8 text-gold mx-auto mb-3" />
                <p className="text-zinc-500 text-sm mb-1">Price Index</p>
                <p className="text-white text-3xl font-bold">{area.priceIndex}</p>
              </CardContent>
            </Card>
            <Card className="bg-zinc-900/50 border-zinc-800">
              <CardContent className="p-6 text-center">
                <Home className="w-8 h-8 text-gold mx-auto mb-3" />
                <p className="text-zinc-500 text-sm mb-1">Rental Index</p>
                <p className="text-white text-3xl font-bold">{area.rentalIndex}</p>
              </CardContent>
            </Card>
            <Card className="bg-zinc-900/50 border-zinc-800">
              <CardContent className="p-6 text-center">
                <Users className="w-8 h-8 text-gold mx-auto mb-3" />
                <p className="text-zinc-500 text-sm mb-1">Demand Score</p>
                <p className="text-white text-3xl font-bold">{area.demandScore}%</p>
              </CardContent>
            </Card>
            <Card className="bg-zinc-900/50 border-zinc-800">
              <CardContent className="p-6 text-center">
                <Building2 className="w-8 h-8 text-gold mx-auto mb-3" />
                <p className="text-zinc-500 text-sm mb-1">Supply Score</p>
                <p className="text-white text-3xl font-bold">{area.supplyScore}%</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* AI Explanation */}
      <section className="py-12 border-t border-zinc-900">
        <div className="container mx-auto px-4">
          <Card className="bg-gradient-to-br from-zinc-900 to-zinc-950 border-gold/20 max-w-4xl mx-auto">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gold/10 border border-gold/30 flex items-center justify-center">
                  <Info className="w-5 h-5 text-gold" />
                </div>
                <CardTitle className="text-white">Why This Area Performs This Way</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="prose prose-invert max-w-none">
                {generateExplanation().split('\n\n').map((para, i) => (
                  <p key={i} className="text-zinc-400 mb-4" dangerouslySetInnerHTML={{ 
                    __html: para.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white">$1</strong>') 
                  }} />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Key Highlights */}
      <section className="py-12 border-t border-zinc-900">
        <div className="container mx-auto px-4">
          <h2 className="text-white text-2xl font-bold mb-8 text-center" style={{ fontFamily: "Poppins, sans-serif" }}>
            Market Highlights
          </h2>
          <div className="max-w-2xl mx-auto space-y-4">
            {area.highlights.map((highlight, i) => (
              <div key={i} className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 flex items-start gap-4">
                <div className="w-8 h-8 rounded-lg bg-gold/10 border border-gold/30 flex items-center justify-center shrink-0">
                  <span className="text-gold font-bold">{i + 1}</span>
                </div>
                <p className="text-zinc-300">{highlight}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-12 border-t border-zinc-900">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            <h3 className="text-white text-xl font-bold mb-4">Interested in {area.area}?</h3>
            <p className="text-zinc-400 mb-6">Speak with our team for personalized guidance based on current market conditions.</p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link to="/contact">
                <Button className="bg-gradient-to-r from-gold to-gold-dark text-black font-semibold">
                  Speak With Our Team
                </Button>
              </Link>
              <Link to={`/properties?location=${encodeURIComponent(area.area)}`}>
                <Button variant="outline" className="border-white/30 text-white hover:bg-white/10">
                  View Properties in {area.area}
                </Button>
              </Link>
            </div>
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

export default MarketAreaDetail;
