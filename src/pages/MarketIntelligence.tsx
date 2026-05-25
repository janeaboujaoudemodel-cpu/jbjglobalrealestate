import { motion } from "framer-motion";
import { ArrowUpRight, BarChart3, Database, Shield, Info, RefreshCw } from "lucide-react";
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
import {
  MI_CARD_TITLE,
  MI_BODY_MUTED,
} from "@/components/market-intelligence/MarketIntelligenceTypography";
import { MARKET_DISCLAIMER } from "@/config/open-data-config";
import VideoBackground from "@/components/VideoBackground";
import marketIntelligenceHero from "@/assets/market-intelligence-hero.jpg";
import marketIntelligenceVideo from "@/assets/videos/burj-khalifa-day-to-night.mp4";
import jbjLogoLight from "@/assets/jbj-fulllogo-light.png";

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

const heroKeywords = ["DLD", "RERA", "DXB", "TRANSACTIONS", "RENTAL INDEX", "AREA DEMAND", "SUPPLY PIPELINE", "DAILY REFRESH"];

const sourceBadges = ["DLD", "RERA", "DXB Interact", "Dubai Statistics", "JBJ Intelligence"];

const heroCtaClass =
  "allow-white group inline-flex items-center justify-center gap-2 rounded-none border border-white/45 bg-white/[0.07] px-6 py-3 text-sm font-semibold text-white backdrop-blur-md transition-colors hover:border-[hsl(var(--mi-gold))] hover:bg-white/[0.12] md:px-8 md:py-4 md:text-base";

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
    <div data-marketing-page className="min-h-screen bg-background [--mi-gold:40_35%_53%] [--mi-navy:210_60%_16%] [--mi-navy-soft:210_49%_24%]">
      <SEOHead 
        title="Market Intelligence | Dubai Real Estate Insights | BUY · SELL · RENT | JBJ GLOBAL REAL ESTATE"
        description="Data-driven Dubai real estate insights powered by official government sources. Explore market trends, area analysis, and AI-generated reports. No predictions, just trusted insights."
        keywords="Dubai real estate market, property trends, market intelligence, Dubai property analysis, rent trends Dubai, BUY SELL RENT Dubai, Jane Bou Jaoude"
        canonicalPath="/market-intelligence"
      />

      {/* Hero — premium video intelligence background */}
      <section data-surface="dark" className="jj-hero-fullscreen relative flex min-h-[680px] w-full items-center overflow-hidden bg-[hsl(var(--mi-navy))] py-24 md:min-h-[760px]">
        <VideoBackground
          src={marketIntelligenceVideo}
          poster={marketIntelligenceHero}
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.88)_0%,rgba(5,15,27,0.74)_44%,rgba(0,0,0,0.48)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_30%,hsl(var(--mi-gold)/0.18),transparent_34%),radial-gradient(circle_at_82%_18%,rgba(255,255,255,0.10),transparent_30%)]" />
        <div className="pointer-events-none absolute inset-x-0 top-24 hidden overflow-hidden text-[10px] font-semibold uppercase tracking-[0.42em] text-white/[0.08] md:block">
          <div className="flex min-w-max animate-[marquee_38s_linear_infinite] gap-10 whitespace-nowrap">
            {[...heroKeywords, ...heroKeywords, ...heroKeywords].map((word, index) => (
              <span key={`${word}-${index}`}>{word}</span>
            ))}
          </div>
        </div>

        <motion.div 
          className="relative z-10 container mx-auto px-4"
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.12 } } }}
        >
          <motion.div className="mb-8 flex flex-wrap items-center gap-3" variants={fadeInUp}>
            <img src={jbjLogoLight} alt="JBJ GLOBAL REAL ESTATE" className="h-10 w-auto object-contain md:h-12" />
            <span className="h-8 w-px bg-white/25" aria-hidden="true" />
            <span className="text-xs font-semibold uppercase tracking-[0.28em] text-[hsl(var(--mi-gold))]">Daily Market Desk</span>
          </motion.div>

          <motion.h1 
            className="max-w-4xl text-left text-5xl font-bold leading-[0.92] text-white drop-shadow-[0_6px_24px_rgba(0,0,0,0.75)] md:text-7xl lg:text-8xl"
            variants={fadeInUp}
          >
            Market Intelligence
          </motion.h1>

          <motion.p 
            className="mt-6 max-w-2xl text-left text-lg leading-relaxed text-white/88 md:text-xl"
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
              className={heroCtaClass}
            >
              <span className="allow-white">Explore Market Dashboard</span>
              <ArrowUpRight className="w-5 h-5 allow-white" />
            </a>
            <Link
              to="/market-report"
              data-no-contrast-guard
              className={heroCtaClass}
            >
              <span className="allow-white">View Daily Reports</span>
              <ArrowUpRight className="w-5 h-5 allow-white" />
            </Link>
          </motion.div>

          <motion.div 
            className="mt-10 grid max-w-5xl grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5"
            variants={fadeInUp}
          >
            {sourceBadges.map((label) => (
              <div key={label} className="border border-white/18 bg-black/24 px-3 py-2 text-center backdrop-blur-md">
                <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/82">{label}</span>
              </div>
            ))}
          </motion.div>

          <motion.div className="mt-10 max-w-3xl border border-white/18 bg-black/62 p-5 shadow-[0_18px_60px_rgba(0,0,0,0.35)] backdrop-blur-xl md:p-6" variants={fadeInUp}>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center border border-[hsl(var(--mi-gold)/0.55)] bg-white/8" data-no-contrast-guard>
                  <Info className="h-5 w-5 text-white allow-white" />
                </div>
                <div>
                  <p className="text-base font-semibold text-white md:text-lg">Founder Market Intelligence</p>
                  <p className="mt-1 text-sm leading-relaxed text-white/72">Founder-led interpretation by Jane Bou Jaoude, supported by verified source tracking and daily freshness checks.</p>
                </div>
              </div>
              <Link to="/founder" className="inline-flex items-center gap-2 text-sm font-semibold text-white underline decoration-[hsl(var(--mi-gold))] underline-offset-4" data-no-contrast-guard>
                <span>Founder Profile</span>
                <ArrowUpRight className="h-4 w-4 text-white allow-white" />
              </Link>
            </div>
          </motion.div>
        </motion.div>
      </section>

      <section className="w-full bg-[hsl(var(--mi-navy))] py-6" data-surface="dark">
        <div className="container mx-auto px-4">
          <div className="grid gap-3 md:grid-cols-3">
            {[
              { Icon: Database, title: "Government Sources", text: "Official transaction, rental, and registration references." },
              { Icon: RefreshCw, title: "Daily Freshness", text: "Market pages show a current daily freshness check." },
              { Icon: Shield, title: "No Forecast Claims", text: "Analytics and education only, with source attribution." },
            ].map(({ Icon, title, text }) => (
              <div key={title} className="border border-white/15 bg-white/[0.06] p-4 backdrop-blur-md">
                <div className="mb-3 flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center border border-[hsl(var(--mi-gold)/0.5)]" data-no-contrast-guard>
                    <Icon className="h-4 w-4 text-white allow-white" />
                  </div>
                  <p className="text-sm font-semibold text-white">{title}</p>
                </div>
                <p className="text-xs leading-relaxed text-white/68">{text}</p>
              </div>
            ))}
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
            <div className="rounded-2xl p-8 text-center bg-card border-2 border-[#102540]/40">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4 bg-[#102540]" data-no-contrast-guard>
                <Info className="w-6 h-6 text-white allow-white" />
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
