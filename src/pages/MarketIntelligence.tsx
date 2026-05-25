import { motion } from "framer-motion";
import { ArrowUpRight, BarChart3, Database, Shield, Info } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect } from "react";
import { SEOHead } from "@/components/SEOHead";
import { PremiumHeroButton } from "@/components/ui/premium-hero-button";

import { PreFooterSeparator } from "@/components/PreFooterSeparator";
import {
  MarketOverviewDashboard,
  AreaIntelligenceGrid,
  AIMarketInsights,
  MarketReports,
  DataSourcesPanel,
} from "@/components/market-intelligence";
import {
  MI_CARD_TITLE,
  MI_BODY_MUTED,
} from "@/components/market-intelligence/MarketIntelligenceTypography";
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
  "@id": "https://www.jbj.ae/#organization",
  name: "JBJ GLOBAL REAL ESTATE",
  url: "https://www.jbj.ae",
  logo: "https://www.jbj.ae/lovable-uploads/c6c68c7f-b5b7-4e7a-9f66-3ff7e08fd37f.png",
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
      item: "https://www.jbj.ae"
    },
    {
      "@type": "ListItem",
      position: 2,
      name: "Market Intelligence",
      item: "https://www.jbj.ae/market-intelligence"
    }
  ]
};

const webPageSchema = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "Dubai Real Estate Market Intelligence | BUY · SELL · RENT Insights",
  description: "Data-driven Dubai real estate insights powered by official government Open Data. Explore market trends, area analysis, and AI-generated reports for BUY · SELL · RENT decisions.",
  url: "https://www.jbj.ae/market-intelligence",
  isPartOf: {
    "@type": "WebSite",
    name: "JBJ GLOBAL REAL ESTATE",
    url: "https://www.jbj.ae"
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
    <div data-marketing-page className="min-h-screen bg-[#FDFBF7]">
      <SEOHead 
        title="Market Intelligence | Dubai Real Estate Insights | BUY · SELL · RENT | JBJ GLOBAL REAL ESTATE"
        description="Data-driven Dubai real estate insights powered by official government Open Data. Explore market trends, area analysis, and AI-generated reports. No predictions, just trusted insights."
        keywords="Dubai real estate market, property trends, market intelligence, open data, Dubai property analysis, rent trends Dubai, BUY SELL RENT Dubai, Jane Bou Jaoude"
        canonicalPath="/market-intelligence"
      />

      {/* Hero — full intelligence video background */}
      <section className="relative w-full h-[78vh] min-h-[560px] flex items-center overflow-hidden">
        <VideoBackground
          src="https://videos.pexels.com/video-files/3629519/3629519-uhd_2560_1440_25fps.mp4"
          poster={marketIntelligenceHero}
        />
        {/* Layered scrim for readability — no blue divider, no harsh line */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/45 to-black/80" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(184,149,85,0.10),transparent_60%)]" />

        <motion.div 
          className="relative z-10 container mx-auto px-4 text-center"
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.12 } } }}
        >
          <motion.h1 
            className="text-white text-5xl md:text-6xl lg:text-7xl font-bold mb-6 max-w-4xl mx-auto drop-shadow-[0_2px_12px_rgba(0,0,0,0.6)]"
            variants={fadeInUp}
          >
            Market Intelligence
          </motion.h1>

          <motion.p 
            className="text-base md:text-lg max-w-2xl mx-auto mb-8 text-white/90"
            variants={fadeInUp}
          >
            Data-driven insights powered by official government sources.
            Analytics, trends, and education — not listings.
          </motion.p>

          <motion.div 
            className="flex flex-wrap justify-center gap-4"
            variants={fadeInUp}
          >
            <a
              href="#overview"
              data-no-contrast-guard
              className="allow-white inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-base font-semibold bg-[#102540] text-white border border-[#B89555] hover:bg-[#1a3d63] transition-colors shadow-lg"
            >
              <span className="allow-white">Explore Dashboard</span>
              <ArrowUpRight className="w-5 h-5 allow-white" />
            </a>
            <Link
              to="/market-report"
              data-no-contrast-guard
              className="allow-white inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-base font-semibold bg-[#102540] text-white border border-[#B89555] hover:bg-[#1a3d63] transition-colors shadow-lg"
            >
              <span className="allow-white">Download Reports</span>
              <ArrowUpRight className="w-5 h-5 allow-white" />
            </Link>
          </motion.div>

          {/* Trust Badges */}
          <motion.div 
            className="flex flex-wrap justify-center gap-x-8 gap-y-3 mt-10"
            variants={fadeInUp}
          >
            {[
              { Icon: Database, label: "Government Sources" },
              { Icon: Shield,   label: "Analytics Only" },
              { Icon: BarChart3, label: "No Listings" },
            ].map(({ Icon, label }) => (
              <div key={label} className="flex items-center gap-2 text-white/90">
                <Icon className="w-4 h-4 text-[#B89555]" />
                <span className="text-xs md:text-sm font-medium tracking-wide">{label}</span>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* Compact Founder Banner — navy, white text & icons */}
      <section className="w-full bg-[#102540] border-y border-[#B89555]/25">
        <div className="container mx-auto px-4 py-6 md:py-7">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-white/10 border border-white/20 shrink-0" data-no-contrast-guard>
                <Info className="w-5 h-5 text-white allow-white" />
              </div>
              <div className="min-w-0">
                <p className="text-white text-sm md:text-base font-semibold leading-snug">
                  Founder-Led Intelligence —{" "}
                  <Link to="/founder" className="underline decoration-[#B89555] decoration-1 underline-offset-4 hover:text-[#B89555] transition-colors">
                    Jane Bou Jaoude, Founder &amp; CEO
                  </Link>
                </p>
                <p className="text-white/70 text-xs md:text-sm">
                  Analytics and education — no predictions, no listings.
                </p>
              </div>
            </div>
            <Link
              to="/founder"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-xs md:text-sm font-semibold bg-white/10 hover:bg-white/15 text-white border border-[#B89555]/50 transition-colors whitespace-nowrap"
              data-no-contrast-guard
            >
              <span>Learn About the Founder</span>
              <ArrowUpRight className="w-4 h-4 text-white allow-white" />
            </Link>
          </div>
        </div>
      </section>

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

      {/* Compliance Disclaimer */}
      <section className="surface-light py-12 bg-muted" data-surface="light">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <div className="rounded-2xl p-8 text-center bg-card border border-border">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4 bg-foreground">
                <Info className="w-6 h-6 text-background" />
              </div>
              <h3 className={`${MI_CARD_TITLE} mb-4`}>
                Compliance & Transparency
              </h3>
              <p className={`${MI_BODY_MUTED} whitespace-pre-line`}>
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
