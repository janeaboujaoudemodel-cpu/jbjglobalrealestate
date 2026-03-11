import { motion } from "framer-motion";
import { ArrowUpRight, BarChart3, Database, Shield, Info } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect } from "react";
import { SEOHead } from "@/components/SEOHead";
import { PremiumHeroButton } from "@/components/ui/premium-hero-button";
import { FounderPhilosophySection } from "@/components/FounderPhilosophySection";
import { PreFooterSeparator } from "@/components/PreFooterSeparator";
import {
  MarketOverviewDashboard,
  AreaIntelligenceGrid,
  AIMarketInsights,
  MarketReports,
  DataSourcesPanel,
} from "@/components/market-intelligence";
import { MARKET_DISCLAIMER } from "@/config/open-data-config";
import VideoBackground from "@/components/VideoBackground";
import marketIntelligenceHero from "@/assets/market-intelligence-hero.jpg";

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

// Organization schema for main Market Intelligence page
const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": "https://jbjglobalrealestate.lovable.app/#organization",
  name: "JBJ GLOBAL REAL ESTATE",
  url: "https://jbjglobalrealestate.lovable.app",
  logo: "https://jbjglobalrealestate.lovable.app/lovable-uploads/c6c68c7f-b5b7-4e7a-9f66-3ff7e08fd37f.png",
  founder: {
    "@type": "Person",
    name: "Jane Bou Jaoude"
  },
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "customer service",
    email: "contact@JBJ.ae"
  }
};

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    {
      "@type": "ListItem",
      position: 1,
      name: "Home",
      item: "https://jbjglobalrealestate.lovable.app"
    },
    {
      "@type": "ListItem",
      position: 2,
      name: "Market Intelligence",
      item: "https://jbjglobalrealestate.lovable.app/market-intelligence"
    }
  ]
};

const webPageSchema = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "Dubai Real Estate Market Intelligence | BUY · SELL · RENT Insights",
  description: "Data-driven Dubai real estate insights powered by official government Open Data. Explore market trends, area analysis, and AI-generated reports for BUY · SELL · RENT decisions.",
  url: "https://jbjglobalrealestate.lovable.app/market-intelligence",
  isPartOf: {
    "@type": "WebSite",
    name: "JBJ GLOBAL REAL ESTATE",
    url: "https://jbjglobalrealestate.lovable.app"
  },
  publisher: organizationSchema,
  about: {
    "@type": "Thing",
    name: "Dubai Real Estate Market Intelligence"
  }
};

const MarketIntelligence = () => {
  // Inject structured data
  useEffect(() => {
    const schemas = [organizationSchema, breadcrumbSchema, webPageSchema];
    
    // Remove existing schema scripts
    const existingScripts = document.querySelectorAll('script[data-schema="market-intelligence-main"]');
    existingScripts.forEach(script => script.remove());

    // Add new schema scripts
    schemas.forEach((schema) => {
      const script = document.createElement("script");
      script.type = "application/ld+json";
      script.setAttribute("data-schema", "market-intelligence-main");
      script.textContent = JSON.stringify(schema);
      document.head.appendChild(script);
    });

    return () => {
      const scripts = document.querySelectorAll('script[data-schema="market-intelligence-main"]');
      scripts.forEach(script => script.remove());
    };
  }, []);

  return (
    <div className="min-h-screen bg-black">
      <SEOHead 
        title="Market Intelligence | Dubai Real Estate Insights | BUY · SELL · RENT | JBJ GLOBAL REAL ESTATE"
        description="Data-driven Dubai real estate insights powered by official government Open Data. Explore market trends, area analysis, and AI-generated reports. No predictions, just trusted insights."
        keywords="Dubai real estate market, property trends, market intelligence, open data, Dubai property analysis, rent trends Dubai, BUY SELL RENT Dubai, Jane Bou Jaoude"
        canonicalPath="/market-intelligence"
      />

      {/* Hero Section */}
      <section className="jj-hero-fullscreen relative flex items-center overflow-hidden">
        {/* Video background with poster fallback */}
        <VideoBackground
          src="https://videos.pexels.com/video-files/3629519/3629519-uhd_2560_1440_25fps.mp4"
          poster={marketIntelligenceHero}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/70 to-black" />
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
            <PremiumHeroButton href="#overview" size="lg">
              Explore Dashboard
            </PremiumHeroButton>
            <PremiumHeroButton href="/market-report" size="lg" icon={ArrowUpRight}>
              Download Reports
            </PremiumHeroButton>
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

      {/* Founder-Led Philosophy & Advisory Positioning */}
      <FounderPhilosophySection />

      {/* Market Overview Dashboard - Edge to Edge */}
      <div id="overview">
        <MarketOverviewDashboard />
      </div>

      {/* Area Intelligence Grid - Edge to Edge */}
      <AreaIntelligenceGrid />

      {/* AI Market Insights - Edge to Edge */}
      <AIMarketInsights />

      {/* Market Reports - Edge to Edge */}
      <MarketReports />

      {/* Data Sources Panel - Edge to Edge */}
      <DataSourcesPanel />

      {/* Compliance Disclaimer - 3-Layer System */}
      <section className="py-12 bg-black">
        <div className="jj-layer-2">
          <div className="max-w-3xl mx-auto">
            <div className="jj-card-inner rounded-2xl p-8 text-center">
              <div className="w-12 h-12 rounded-xl bg-black flex items-center justify-center mx-auto mb-4">
                <Info className="w-6 h-6 text-gold" />
              </div>
              <h3 className="text-black text-xl font-bold mb-4">
                <span className="text-gold">Compliance</span> & Transparency
              </h3>
              <p className="text-zinc-600 text-sm leading-relaxed whitespace-pre-line">
                {MARKET_DISCLAIMER}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pre-Footer White Section with CTA */}
      <PreFooterSeparator 
        title="Ready to Make Informed Decisions?"
        subtitle="Speak with our team for personalized guidance based on your investment goals and market conditions."
        primaryLink="/contact"
        primaryText="Speak With Our Team"
        secondaryLink="/quiz"
        secondaryText="AI Home Finder"
      />
    </div>
  );
};

export default MarketIntelligence;
