import { motion } from "framer-motion";
import { MapPin, TrendingUp, TrendingDown, BarChart3, Database, Shield, ArrowLeft, Info, Building2, Users, Home, ArrowRight } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { SEOHead } from "@/components/SEOHead";
import { MarketIntelligenceSchema } from "@/components/seo/MarketIntelligenceSchema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DUBAI_AREAS_MARKET_DATA, MARKET_DISCLAIMER } from "@/config/open-data-config";
import { sanitizeMarkdownHtml } from "@/utils/secureInputValidation";

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
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-[#1A1A1A] text-2xl font-bold mb-4">Area Not Found</h1>
          <Link to="/market-intelligence/areas">
            <Button variant="outline" className="border-[#B89555] text-[#1A1A1A]">
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
        return <Badge className="bg-[#EFE6D6] text-[#1A1A1A] border-[#B89555]/45 text-lg px-4 py-1">Bullish</Badge>;
      case 'bearish':
        return <Badge variant="secondary" className="text-lg px-4 py-1">Bearish</Badge>;
      default:
        return <Badge className="bg-[#B89555]/20 text-[#1A1A1A]/70 border-[#B89555]/30 text-lg px-4 py-1">Neutral</Badge>;
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
    <div className="min-h-screen bg-[#FDFBF7]">
      <SEOHead 
        title={`${area.area} Rent Trends & Property Prices | Is ${area.area} Good for Renting? | JBJ GLOBAL REAL ESTATE`}
        description={`${area.area} real estate market analysis. Historical price trends, rent analysis, demand vs supply indicators, and market insights for BUY · SELL · RENT decisions. Powered by official government Open Data.`}
        keywords={`${area.area} property prices, ${area.area} rent trends, is ${area.area} good for renting, Dubai ${area.area} real estate, ${area.area} market analysis, ${area.area} investment`}
        canonicalPath={`/market-intelligence/areas/${slug}`}
      />
      <MarketIntelligenceSchema 
        type="area-detail"
        areaName={area.area}
        areaSlug={slug}
        description={`${area.area} real estate market analysis with historical price trends, rent analysis, and demand indicators.`}
      />

      {/* Hero */}
      <section data-hero-dark data-surface="dark" className="jj-hero-fullscreen jj-hero-compact relative flex items-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-900/50 via-black to-black" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(184,149,85,0.16),transparent_62%)]" />
        
        <motion.div 
          className="relative z-10 container mx-auto px-4 py-24"
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.15 } } }}
        >
          <motion.div variants={fadeInUp}>
            <Link to="/market-intelligence/areas" className="allow-white inline-flex items-center gap-2 text-[#F7F2EA] hover:text-white mb-6">
              <ArrowLeft className="w-4 h-4" />
              Back to All Areas
            </Link>
          </motion.div>

          <motion.div className="flex items-center gap-3 mb-4" variants={fadeInUp}>
            <MapPin className="allow-white w-8 h-8 text-[#F7F2EA]" />
            <span className="allow-white text-[#F7F2EA] text-sm uppercase tracking-[0.3em]">Area Intelligence</span>
          </motion.div>

          <motion.h1 
            className="text-white text-4xl md:text-5xl lg:text-6xl font-bold mb-4"
            variants={fadeInUp}
          >
            {area.area}
          </motion.h1>

          <motion.div className="flex items-center gap-4" variants={fadeInUp}>
            {getTrendBadge(area.trend)}
            <div className="flex items-center gap-2">
              {area.yoyChange > 0 ? (
                <TrendingUp className="w-5 h-5 text-[#B89555]" />
              ) : (
                <TrendingDown className="w-5 h-5 text-[#F7F2EA]" />
              )}
              <span className="text-lg font-semibold text-[#F7F2EA]">
                {area.yoyChange > 0 ? '+' : ''}{area.yoyChange}% YoY
              </span>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* Key Metrics - 3-layer system with proper gutters */}
      <section className="pt-16 py-12 bg-[#F7F2EA]">
        <div className="jj-layer-2">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="jj-card-inner">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 jj-icon-box-active rounded-xl mx-auto mb-3">
                  <BarChart3 className="w-6 h-6" />
                </div>
                <p className="text-[#1A1A1A]/70 text-sm mb-1">Price Index</p>
                <p className="text-[#1A1A1A] text-3xl font-bold">{area.priceIndex}</p>
              </CardContent>
            </Card>
            <Card className="jj-card-inner">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 jj-icon-box-active rounded-xl mx-auto mb-3">
                  <Home className="w-6 h-6" />
                </div>
                <p className="text-[#1A1A1A]/70 text-sm mb-1">Rental Index</p>
                <p className="text-[#1A1A1A] text-3xl font-bold">{area.rentalIndex}</p>
              </CardContent>
            </Card>
            <Card className="jj-card-inner">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 jj-icon-box-active rounded-xl mx-auto mb-3">
                  <Users className="w-6 h-6" />
                </div>
                <p className="text-[#1A1A1A]/70 text-sm mb-1">Demand Score</p>
                <p className="text-[#1A1A1A] text-3xl font-bold">{area.demandScore}%</p>
              </CardContent>
            </Card>
            <Card className="jj-card-inner">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 jj-icon-box-active rounded-xl mx-auto mb-3">
                  <Building2 className="w-6 h-6" />
                </div>
                <p className="text-[#1A1A1A]/70 text-sm mb-1">Supply Score</p>
                <p className="text-[#1A1A1A] text-3xl font-bold">{area.supplyScore}%</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* AI Explanation - 3-layer system */}
      <section className="py-12 bg-[#F7F2EA]">
        <div className="jj-layer-2">
          <Card className="jj-card-inner max-w-4xl mx-auto">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 jj-icon-box-active rounded-xl">
                  <Info className="w-5 h-5" />
                </div>
                <CardTitle className="text-[#1A1A1A]">Why This Area Performs This Way</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="prose max-w-none">
                {generateExplanation().split('\n\n').map((para, i) => {
                  // Security: Sanitize before rendering with dangerouslySetInnerHTML
                  const htmlContent = para.replace(/\*\*(.*?)\*\*/g, '<strong class="text-[#1A1A1A]">$1</strong>');
                  const sanitizedHtml = sanitizeMarkdownHtml(htmlContent);
                  return (
                    <p key={i} className="text-[#1A1A1A]/70 mb-4" dangerouslySetInnerHTML={{ __html: sanitizedHtml }} />
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Key Highlights - 3-layer system */}
      <section className="py-12 bg-[#F7F2EA]">
        <div className="jj-layer-2">
          <h2 className="text-[#1A1A1A] text-2xl font-bold mb-8 text-center">
            <span className="text-[#1A1A1A]">Market</span> Highlights
          </h2>
          <div className="max-w-2xl mx-auto space-y-4">
            {area.highlights.map((highlight, i) => (
              <div key={i} className="jj-card-inner p-4 flex items-start gap-4">
                <div className="w-8 h-8 jj-icon-box-active rounded-lg shrink-0">
                  <span className="text-[#1A1A1A] font-bold text-sm">{i + 1}</span>
                </div>
                <p className="text-[#1A1A1A]/70">{highlight}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA - 3-layer system */}
      <section className="py-12 bg-[#F7F2EA]">
        <div className="jj-layer-2">
          <div className="max-w-2xl mx-auto text-center jj-card-inner p-8">
            <h3 className="text-[#1A1A1A] text-xl font-bold mb-4">Interested in {area.area}?</h3>
            <p className="text-[#1A1A1A]/70 mb-6">Speak with our team for personalized guidance based on current market conditions.</p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link to="/contact">
                <Button variant="primary">
                  Speak With Our Team
                </Button>
              </Link>
              <Link to={`/properties?location=${encodeURIComponent(area.area)}`}>
                <Button variant="secondary">
                  View Properties in {area.area}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Internal Links - 3-layer system */}
      <section className="py-12 bg-[#F7F2EA]">
        <div className="jj-layer-2">
          <h3 className="text-[#1A1A1A] text-xl font-bold mb-6 text-center">
            <span className="text-[#1A1A1A]">Continue</span> Exploring
          </h3>
          <div className="grid md:grid-cols-3 gap-4 max-w-3xl mx-auto">
            <Link to="/market-intelligence/overview" className="group">
              <Card className="jj-card-inner">
                <CardContent className="p-4 flex items-center justify-between">
                  <span className="text-[#1A1A1A] font-medium group-hover:text-[#1A1A1A]-dark transition-colors">Market Overview</span>
                  <div className="w-8 h-8 jj-icon-box-active rounded-lg">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </CardContent>
              </Card>
            </Link>
            <Link to="/market-intelligence/reports" className="group">
              <Card className="jj-card-inner">
                <CardContent className="p-4 flex items-center justify-between">
                  <span className="text-[#1A1A1A] font-medium group-hover:text-[#1A1A1A]-dark transition-colors">Market Reports</span>
                  <div className="w-8 h-8 jj-icon-box-active rounded-lg">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </CardContent>
              </Card>
            </Link>
            <Link to="/market-intelligence/methodology" className="group">
              <Card className="jj-card-inner">
                <CardContent className="p-4 flex items-center justify-between">
                  <span className="text-[#1A1A1A] font-medium group-hover:text-[#1A1A1A]-dark transition-colors">Methodology</span>
                  <div className="w-8 h-8 jj-icon-box-active rounded-lg">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>
          
          {/* Disclaimer Box - Champagne style */}
          <div className="max-w-3xl mx-auto mt-8">
            <div className="jj-card-inner p-6 text-center">
              <div className="flex items-center justify-center gap-4 mb-4">
                <div className="w-8 h-8 jj-icon-box-active rounded-lg">
                  <Database className="w-4 h-4" />
                </div>
                <div className="w-8 h-8 jj-icon-box-active rounded-lg">
                  <Shield className="w-4 h-4" />
                </div>
              </div>
              <p className="text-[#1A1A1A]/70 text-sm whitespace-pre-line">{MARKET_DISCLAIMER}</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default MarketAreaDetail;
