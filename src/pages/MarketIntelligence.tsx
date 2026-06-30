import { motion } from "framer-motion";
import { ArrowUpRight, Info } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect } from "react";
import { SEOHead } from "@/components/SEOHead";

import { PreFooterSeparator } from "@/components/PreFooterSeparator";
import {
  MarketOverviewDashboard,
  AreaIntelligenceGrid,
  AIMarketInsights,
  MarketReports,
  DataSourcesPanel,
} from "@/components/market-intelligence";
import DLDDailySnapshot from "@/components/market-intelligence/DLDDailySnapshot";
import {
  MI_CARD_TITLE,
  MI_BODY_MUTED,
} from "@/components/market-intelligence/MarketIntelligenceTypography";
import { MARKET_DISCLAIMER } from "@/config/open-data-config";
import VideoBackground from "@/components/VideoBackground";
import { IconTile } from "@/components/ui/icon-tile";
import marketIntelligenceHero from "@/assets/market-intelligence-hero.jpg";
import marketIntelligenceVideoAsset from "@/assets/videos/burj-khalifa-day-to-night.mp4.asset.json";
const marketIntelligenceVideo = marketIntelligenceVideoAsset.url;


const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

// Glass / fiberglass hero CTA — clear backdrop-blur surface, white text+icons,
// matches the other dark hero sections. NO champagne fill, NO ink-guard classes.
const heroCtaClass =
  "allow-white group inline-flex items-center justify-center gap-2 rounded-lg border border-white/30 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur-md transition-all hover:-translate-y-0.5 hover:border-white/50 hover:bg-white/20 md:px-8 md:py-4 md:text-base";

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
  description: "Data-driven Dubai real estate insights powered by official government sources. Explore market trends, area analysis, and AI-generated reports for BUY · SELL · RENT decisions.",
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
    // Remapped: --mi-navy → ink, --mi-navy-soft → soft-ink. Neon shell removed so
    // the entire Market Intelligence tree matches the global champagne+gold+ink palette.
    <div className="min-h-screen bg-background [--mi-gold:40_35%_53%] [--mi-navy:0_0%_4%] [--mi-navy-soft:0_0%_12%]">


      <SEOHead 
        title="Market Intelligence | Dubai Real Estate Insights | BUY · SELL · RENT | JBJ GLOBAL REAL ESTATE"
        description="Data-driven Dubai real estate insights powered by official government sources. Explore market trends, area analysis, and AI-generated reports. No predictions, just trusted insights."
        keywords="Dubai real estate market, property trends, market intelligence, Dubai property analysis, rent trends Dubai, BUY SELL RENT Dubai, Jane Bou Jaoude"
        canonicalPath="/market-intelligence"
      />

      {/* Hero — full-screen video, no logo / no badges / no keyword strip / no founder card */}
      <section data-hero-dark data-surface="dark" className="jj-hero-fullscreen relative flex w-full items-end pb-16 md:pb-24 lg:pb-28 overflow-hidden bg-[#0A0A0A]">
        <VideoBackground
          src={marketIntelligenceVideo}
          poster={marketIntelligenceHero}
          eager
          opacity={1}
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.46)_0%,rgba(0,0,0,0.22)_54%,rgba(0,0,0,0.12)_100%)]" />

        <motion.div
          className="relative z-10 container mx-auto px-4"
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
        >
          <motion.h1
            data-no-contrast-guard
            className="allow-white max-w-4xl text-left text-5xl font-bold leading-[0.95] !text-white md:text-7xl lg:text-8xl"
            style={{ color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" }}
            variants={fadeInUp}
          >
            Market Intelligence
          </motion.h1>

          <motion.p
            data-no-contrast-guard
            className="allow-white mt-6 max-w-2xl text-left text-lg leading-relaxed !text-white md:text-xl"
            style={{ color: "rgba(255,255,255,0.96)", WebkitTextFillColor: "rgba(255,255,255,0.96)" }}
            variants={fadeInUp}
          >
            Daily refreshed Dubai real estate intelligence powered by official government sources, licensed market data partners, and JBJ editorial review.
          </motion.p>

          <motion.div
            className="mt-8 flex flex-wrap gap-3"
            variants={fadeInUp}
          >
            <a
              href="#overview"
              data-no-contrast-guard
              data-on-dark
              className={heroCtaClass}
              style={{ color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" }}
            >
              <span style={{ color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" }}>Explore Market Dashboard</span>
              <ArrowUpRight className="w-5 h-5" style={{ color: "#FFFFFF", stroke: "#FFFFFF" }} />
            </a>
            <Link
              to="/market-report"
              data-no-contrast-guard
              data-on-dark
              className={heroCtaClass}
              style={{ color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" }}
            >
              <span style={{ color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" }}>View Daily Reports</span>
              <ArrowUpRight className="w-5 h-5" style={{ color: "#FFFFFF", stroke: "#FFFFFF" }} />
            </Link>
          </motion.div>
        </motion.div>
      </section>


      {/* Market Overview Dashboard - Edge to Edge */}
      <div id="overview">
        <MarketOverviewDashboard />
      </div>

      {/* DLD Daily Snapshot — KPI strip, Cash vs Mortgage, Top-10, Notice + Consultation */}
      <DLDDailySnapshot />


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
          <div className="max-w-5xl mx-auto">
            <div className="mi-gold-frame rounded-2xl p-10 text-center">
              <div className="mx-auto mb-4 flex justify-center">
                <div className="mi-icon-tile mi-icon-tile-lg">
                  <Info className="w-5 h-5" />
                </div>
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
        secondaryLink="/ai-home-finder"
        secondaryText="AI Home Finder"
      />
    </div>
  );
};

export default MarketIntelligence;
