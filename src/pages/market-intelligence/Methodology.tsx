import { motion } from "framer-motion";
import { Database, Shield, RefreshCw, FileCheck, AlertTriangle, ExternalLink, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import Footer from "@/components/Footer";
import { SEOHead } from "@/components/SEOHead";
import { MarketIntelligenceSchema } from "@/components/seo/MarketIntelligenceSchema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OPEN_DATA_SOURCES, MARKET_DISCLAIMER } from "@/config/open-data-config";

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

const Methodology = () => {
  const getFrequencyLabel = (freq: string) => {
    switch (freq) {
      case 'daily': return 'Daily';
      case 'weekly': return 'Weekly';
      case 'monthly': return 'Monthly';
      case 'quarterly': return 'Quarterly';
      default: return freq;
    }
  };

  return (
    <div className="min-h-screen bg-black">
      <SEOHead 
        title="Real Estate Market Data Methodology & Sources | How Dubai Property Prices Are Calculated | JBJ GLOBAL REAL ESTATE"
        description="Full transparency on how we source, aggregate, and present Dubai real estate market intelligence. Official government Open Data sources, update frequency, and what the data is and is not."
        keywords="real estate market data Dubai, how Dubai property prices are calculated, open data sources, market methodology, data transparency, government data sources"
        canonicalPath="/market-intelligence/methodology"
      />
      <MarketIntelligenceSchema 
        type="methodology"
        description="Full transparency on data sources, update frequency, and aggregation methodology for Dubai real estate market intelligence."
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
            <Database className="w-6 h-6 text-gold" />
            <span className="text-gold text-sm uppercase tracking-[0.3em]">Market Intelligence</span>
          </motion.div>

          <motion.h1 
            className="text-white text-4xl md:text-5xl lg:text-6xl font-bold mb-6"
            style={{ fontFamily: "Poppins, sans-serif" }}
            variants={fadeInUp}
          >
            Methodology & Data Sources
          </motion.h1>

          <motion.p className="text-zinc-400 text-lg md:text-xl max-w-2xl mx-auto" variants={fadeInUp}>
            Full transparency on how we source, aggregate, and present market intelligence.
          </motion.p>
        </motion.div>
      </section>

      {/* Data Sources */}
      <section className="py-16 border-t border-zinc-900">
        <div className="container mx-auto px-4">
          <h2 className="text-white text-2xl font-bold mb-8 text-center" style={{ fontFamily: "Poppins, sans-serif" }}>
            Official Data Sources
          </h2>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {OPEN_DATA_SOURCES.map((source, index) => (
              <motion.div
                key={source.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="bg-zinc-900/50 border-zinc-800 h-full">
                  <CardHeader>
                    <div className="w-12 h-12 rounded-xl bg-gold/10 border border-gold/30 flex items-center justify-center mb-4">
                      <Database className="w-6 h-6 text-gold" />
                    </div>
                    <CardTitle className="text-white">{source.name}</CardTitle>
                    <p className="text-zinc-500 text-sm">{source.provider}</p>
                  </CardHeader>
                  <CardContent>
                    <p className="text-zinc-400 text-sm mb-4">{source.description}</p>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-zinc-500">Update Frequency</span>
                        <span className="text-white">{getFrequencyLabel(source.updateFrequency)}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-zinc-500">Last Updated</span>
                        <span className="text-white">{source.lastUpdated}</span>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-zinc-800">
                      <p className="text-zinc-600 text-xs mb-2">Data Types</p>
                      <div className="flex flex-wrap gap-1">
                        {source.dataTypes.map((type) => (
                          <span key={type} className="text-xs bg-zinc-800 text-zinc-400 px-2 py-1 rounded">
                            {type}
                          </span>
                        ))}
                      </div>
                    </div>

                    {source.url && (
                      <a 
                        href={source.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="mt-4 flex items-center gap-2 text-gold text-sm hover:text-gold-light"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Visit Source
                      </a>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Methodology */}
      <section className="py-16 border-t border-zinc-900">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-white text-2xl font-bold mb-8 text-center" style={{ fontFamily: "Poppins, sans-serif" }}>
              Our Methodology
            </h2>

            <div className="space-y-6">
              <Card className="bg-zinc-900/50 border-zinc-800">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-gold/10 border border-gold/30 flex items-center justify-center shrink-0">
                      <FileCheck className="w-5 h-5 text-gold" />
                    </div>
                    <div>
                      <h3 className="text-white font-bold mb-2">Data Collection</h3>
                      <p className="text-zinc-400 text-sm">
                        We exclusively use official government Open Data portals. No scraping, no private platforms, 
                        no third-party proprietary dashboards. All data is publicly available and sourced through 
                        official APIs and download portals.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-zinc-900/50 border-zinc-800">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-gold/10 border border-gold/30 flex items-center justify-center shrink-0">
                      <RefreshCw className="w-5 h-5 text-gold" />
                    </div>
                    <div>
                      <h3 className="text-white font-bold mb-2">Aggregation & Transformation</h3>
                      <p className="text-zinc-400 text-sm">
                        Raw data is aggregated to calculate trends, generate averages, create indexes, and compare 
                        periods (YoY, QoQ). We never display raw datasets publicly or republish individual 
                        transaction records. All outputs are transformed insights.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-zinc-900/50 border-zinc-800">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-gold/10 border border-gold/30 flex items-center justify-center shrink-0">
                      <Shield className="w-5 h-5 text-gold" />
                    </div>
                    <div>
                      <h3 className="text-white font-bold mb-2">AI-Powered Analysis</h3>
                      <p className="text-zinc-400 text-sm">
                        AI is used to explain trends in plain English and answer "why" behind the numbers. 
                        AI does not predict prices and does not give financial advice. All AI-generated content 
                        is clearly labeled and provides descriptive analysis only.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-zinc-900/50 border-zinc-800">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-gold/10 border border-gold/30 flex items-center justify-center shrink-0">
                      <RefreshCw className="w-5 h-5 text-gold" />
                    </div>
                    <div>
                      <h3 className="text-white font-bold mb-2">Update Frequency</h3>
                      <p className="text-zinc-400 text-sm">
                        Market intelligence is updated monthly or quarterly depending on source availability. 
                        This is not real-time data. Each data point includes a timestamp showing when it was 
                        last refreshed.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* What This Is Not */}
      <section className="py-16 border-t border-zinc-900">
        <div className="container mx-auto px-4">
          <Card className="bg-red-950/20 border-red-500/30 max-w-3xl mx-auto">
            <CardContent className="p-8">
              <div className="flex items-start gap-4">
                <AlertTriangle className="w-8 h-8 text-red-400 shrink-0" />
                <div>
                  <h3 className="text-white font-bold text-xl mb-4">What This Data Is NOT</h3>
                  <ul className="space-y-2 text-zinc-400 text-sm">
                    <li className="flex items-start gap-2">
                      <span className="text-red-400">✕</span>
                      <span>Not financial or investment advice</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-400">✕</span>
                      <span>Not price predictions or forecasts</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-400">✕</span>
                      <span>Not property listings or inventory</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-400">✕</span>
                      <span>Not a recommendation to buy or sell</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-400">✕</span>
                      <span>Not real-time trading data</span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Internal Links */}
      <section className="py-16 border-t border-zinc-900">
        <div className="container mx-auto px-4">
          <h2 className="text-white text-2xl font-bold mb-8 text-center" style={{ fontFamily: "Poppins, sans-serif" }}>
            Explore Market Intelligence
          </h2>
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <Link to="/market-intelligence/overview" className="group">
              <Card className="bg-zinc-900/50 border-zinc-800 hover:border-gold/30 transition-all h-full">
                <CardContent className="p-6">
                  <h3 className="text-white font-bold mb-2 group-hover:text-gold transition-colors">Market Overview</h3>
                  <p className="text-zinc-500 text-sm mb-4">UAE & Dubai macro snapshot with transaction trends and price movements.</p>
                  <ArrowRight className="w-5 h-5 text-gold" />
                </CardContent>
              </Card>
            </Link>
            <Link to="/market-intelligence/areas" className="group">
              <Card className="bg-zinc-900/50 border-zinc-800 hover:border-gold/30 transition-all h-full">
                <CardContent className="p-6">
                  <h3 className="text-white font-bold mb-2 group-hover:text-gold transition-colors">Area Intelligence</h3>
                  <p className="text-zinc-500 text-sm mb-4">Deep dive into Dubai neighborhoods with historical trends.</p>
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

export default Methodology;
