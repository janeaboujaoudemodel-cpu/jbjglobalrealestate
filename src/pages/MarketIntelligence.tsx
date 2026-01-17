import { motion } from "framer-motion";
import { ArrowUpRight, BarChart3, Database, Shield, Info } from "lucide-react";
import { Link } from "react-router-dom";
import Footer from "@/components/Footer";
import { SEOHead } from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import {
  MarketOverviewDashboard,
  AreaIntelligenceGrid,
  AIMarketInsights,
  MarketReports,
  DataSourcesPanel,
} from "@/components/market-intelligence";
import { MARKET_DISCLAIMER } from "@/config/open-data-config";

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

const MarketIntelligence = () => {
  return (
    <div className="min-h-screen bg-black">
      <SEOHead 
        title="Market Intelligence | Dubai Real Estate Insights | JBJ Global Real Estate"
        description="Data-driven Dubai real estate insights powered by official government Open Data. Explore market trends, area analysis, and AI-generated reports."
        keywords="Dubai real estate market, property trends, market intelligence, open data, Dubai property analysis, investment insights"
        canonicalPath="/market-intelligence"
      />

      {/* Hero Section */}
      <section className="relative min-h-[60vh] flex items-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-900/50 via-black to-black" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-gold/5 via-transparent to-transparent" />
        
        <motion.div 
          className="relative z-10 container mx-auto px-4 py-32 text-center"
          initial="hidden"
          animate="visible"
          variants={{
            visible: { transition: { staggerChildren: 0.15 } }
          }}
        >
          <motion.div 
            className="flex items-center justify-center gap-2 mb-6"
            variants={fadeInUp}
          >
            <BarChart3 className="w-6 h-6 text-gold" />
            <span className="text-gold text-sm uppercase tracking-[0.3em]">
              Official Open Data
            </span>
          </motion.div>

          <motion.h1 
            className="text-white text-4xl md:text-5xl lg:text-6xl font-bold mb-6 max-w-4xl mx-auto"
            style={{ fontFamily: "Poppins, sans-serif" }}
            variants={fadeInUp}
          >
            Market Intelligence
          </motion.h1>

          <motion.p 
            className="text-zinc-400 text-lg md:text-xl max-w-2xl mx-auto mb-8"
            variants={fadeInUp}
          >
            Data-driven insights powered by official government Open Data. 
            Analytics, trends, and education — not listings.
          </motion.p>

          <motion.div 
            className="flex flex-wrap justify-center gap-4"
            variants={fadeInUp}
          >
            <a href="#overview">
              <Button className="bg-gradient-to-r from-gold to-gold-dark text-black font-semibold px-8 py-6 hover:opacity-90">
                Explore Dashboard
                <ArrowUpRight className="w-5 h-5 ml-2" />
              </Button>
            </a>
            <Link to="/market-report">
              <Button variant="outline" className="border-white/30 text-white hover:bg-white/10 px-8 py-6">
                Download Reports
              </Button>
            </Link>
          </motion.div>

          {/* Trust Badges */}
          <motion.div 
            className="flex flex-wrap justify-center gap-6 mt-12"
            variants={fadeInUp}
          >
            <div className="flex items-center gap-2 text-zinc-500">
              <Database className="w-5 h-5 text-gold" />
              <span className="text-sm">Government Open Data</span>
            </div>
            <div className="flex items-center gap-2 text-zinc-500">
              <Shield className="w-5 h-5 text-gold" />
              <span className="text-sm">Analytics Only</span>
            </div>
            <div className="flex items-center gap-2 text-zinc-500">
              <BarChart3 className="w-5 h-5 text-gold" />
              <span className="text-sm">No Listings</span>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* Market Overview Dashboard */}
      <div id="overview">
        <MarketOverviewDashboard />
      </div>

      {/* Area Intelligence Grid */}
      <AreaIntelligenceGrid />

      {/* AI Market Insights */}
      <AIMarketInsights />

      {/* Market Reports */}
      <MarketReports />

      {/* Data Sources Panel */}
      <DataSourcesPanel />

      {/* Compliance Disclaimer */}
      <section className="py-12 border-t border-zinc-900">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-8 text-center">
              <div className="w-12 h-12 rounded-xl bg-gold/10 border border-gold/30 flex items-center justify-center mx-auto mb-4">
                <Info className="w-6 h-6 text-gold" />
              </div>
              <h3 className="text-white text-xl font-bold mb-4">Compliance & Transparency</h3>
              <p className="text-zinc-500 text-sm leading-relaxed whitespace-pre-line">
                {MARKET_DISCLAIMER}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-b from-zinc-900/50 to-black">
        <div className="container mx-auto px-4">
          <motion.div 
            className="max-w-4xl mx-auto text-center bg-gradient-to-br from-zinc-900 to-zinc-950 rounded-3xl p-12 border border-gold/20"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 
              className="text-white text-3xl md:text-4xl font-bold mb-4"
              style={{ fontFamily: "Poppins, sans-serif" }}
            >
              Ready to Make Informed Decisions?
            </h2>
            <p className="text-zinc-400 text-lg mb-8 max-w-2xl mx-auto">
              Speak with our team for personalized guidance based on your investment goals and market conditions.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link to="/contact">
                <Button className="bg-gradient-to-r from-gold to-gold-dark text-black font-bold px-8 py-6 text-base hover:opacity-90">
                  Speak With Our Team
                  <ArrowUpRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link to="/quiz">
                <Button variant="outline" className="border-white/30 text-white hover:bg-white/10 px-8 py-6 text-base">
                  AI Home Finder
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default MarketIntelligence;
