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
import { IconTile } from "@/components/ui/icon-tile";


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
    // Route-scoped body flag used by the Market Intelligence scroll contract.
    // This replaces expensive root `:has([data-mi-page])` CSS selectors that
    // forced browser style recalculation whenever a Radix dropdown/portal opened
    // from the horizontal header.
    document.body.setAttribute("data-mi-page-active", "true");

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
      document.body.removeAttribute("data-mi-page-active");
      const scripts = document.querySelectorAll('script[data-schema="market-intelligence-main"]');
      scripts.forEach(script => script.remove());
    };
  }, []);

  return (
    // Remapped: --mi-navy → ink, --mi-navy-soft → soft-ink. Neon shell removed so
    // the entire Market Intelligence tree matches the global champagne+gold+ink palette.
    <div data-mi-page className="min-h-screen bg-background [--mi-gold:40_35%_53%] [--mi-navy:0_0%_4%] [--mi-navy-soft:0_0%_12%]">


      <SEOHead 
        title="Market Intelligence | Dubai Real Estate Insights | BUY · SELL · RENT | JBJ GLOBAL REAL ESTATE"
        description="Data-driven Dubai real estate insights powered by official government sources. Explore market trends, area analysis, and AI-generated reports. No predictions, just trusted insights."
        keywords="Dubai real estate market, property trends, market intelligence, Dubai property analysis, rent trends Dubai, BUY SELL RENT Dubai, Jane Bou Jaoude"
        canonicalPath="/market-intelligence"
      />

      {/* Hero — full-screen Market Intelligence data scene, no video */}
      <section data-mi-hero data-hero-dark data-no-compare-frame data-no-section-frame data-surface="dark" className="mi-hero-scene relative flex min-h-[100svh] w-full items-end overflow-hidden">
        <div className="mi-hero-grid" aria-hidden="true" />
        <div className="mi-hero-orbit mi-hero-orbit-one" aria-hidden="true" />
        <div className="mi-hero-orbit mi-hero-orbit-two" aria-hidden="true" />
        <div className="mi-hero-data-stack" aria-hidden="true">
          <span>TRANSACTIONS</span>
          <span>PRICE INDEX</span>
          <span>RENT INDEX</span>
          <span>DLD SOURCE</span>
        </div>

        <motion.div
          className="relative z-10 w-full px-5 pb-16 md:px-10 md:pb-24 lg:px-16 lg:pb-28"
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
        >
          <motion.div className="mi-hero-kicker" variants={fadeInUp}>Official Market Desk</motion.div>
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
      <section className="surface-light py-12 bg-[#FDFBF7]" data-surface="light">
        <div className="container mx-auto px-4">
          <div className="mi-gold-frame mi-gold-frame-corners max-w-5xl mx-auto p-10 text-center rounded-2xl">
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
