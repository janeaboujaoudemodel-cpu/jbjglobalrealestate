import { ArrowUpRight, Info, BarChart3, MapPin, Sparkles, FileText, Database, ShieldCheck, PhoneCall } from "lucide-react";
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
  MarketIntelligenceHero,
  MarketIntelligenceTableOfContents,
} from "@/components/market-intelligence";
import DLDDailySnapshot from "@/components/market-intelligence/DLDDailySnapshot";
import {
  MI_CARD_TITLE,
  MI_BODY_MUTED,
} from "@/components/market-intelligence/MarketIntelligenceTypography";
import { MARKET_DISCLAIMER } from "@/config/open-data-config";
import { IconTile } from "@/components/ui/icon-tile";

const MI_TOC_ITEMS = [
  { id: "overview", title: "Market Overview", icon: BarChart3 },
  { id: "dld-snapshot", title: "DLD Daily Snapshot", icon: Database },
  { id: "areas", title: "Area Intelligence", icon: MapPin },
  { id: "ai-insights", title: "AI Market Insights", icon: Sparkles },
  { id: "reports", title: "Market Reports", icon: FileText },
  { id: "sources", title: "Data Sources", icon: Database },
  { id: "compliance", title: "Compliance", icon: ShieldCheck },
  { id: "cta", title: "Speak With Our Team", icon: PhoneCall },
];

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

      {/* Premium full-screen emerald hero — title + description + CTAs only.
          Locked by mem://constraints/market-intelligence-hero-rules — no eyebrow,
          no badge, no logo, no keyword marquee, no photo. Deep emerald ombré only. */}
      <section
        data-mi-hero
        data-unified-hero
        data-hero-dark
        data-surface="emerald"
        data-no-contrast-guard
        data-premium-emerald-hero
        className="jj-hero-fullscreen relative flex min-h-screen w-full items-center justify-center overflow-hidden"
        style={{
          background:
            "radial-gradient(ellipse at 50% 0%, #0B6B4F 0%, #064E3B 28%, #042c1c 58%, #010A07 100%)",
        }}
      >
        {/* Layered radial glows for depth */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at 18% 22%, rgba(110,231,183,0.16), transparent 55%), radial-gradient(ellipse at 82% 78%, rgba(184,149,85,0.14), transparent 60%)",
          }}
        />
        {/* Subtle gold vignette hairline at the bottom */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-px"
          style={{ background: "linear-gradient(90deg, transparent, rgba(184,149,85,0.55), transparent)" }}
        />
        {/* Grain / noise for premium feel */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.06] mix-blend-overlay"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%25' height='100%25' filter='url(%23n)' opacity='0.6'/></svg>\")",
          }}
        />

        <div className="relative z-10 mx-auto flex w-full max-w-[64rem] flex-col items-center justify-center px-6 text-center">
          <h1
            data-no-contrast-guard
            className="mx-auto max-w-[16ch] text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-light leading-[1.02] tracking-tight"
            style={{
              color: "#FFFFFF",
              WebkitTextFillColor: "#FFFFFF",
              fontFamily: '"Cormorant Garamond", "Playfair Display", Georgia, serif',
              textShadow: "0 2px 40px rgba(0,0,0,0.4)",
            }}
          >
            Market Intelligence
          </h1>
          {/* Gold hairline divider */}
          <div
            aria-hidden
            className="my-8 h-px w-24"
            style={{ background: "linear-gradient(90deg, transparent, #B89555, transparent)" }}
          />
          <p
            data-no-contrast-guard
            className="mx-auto max-w-[42rem] text-lg md:text-xl lg:text-2xl font-light leading-relaxed"
            style={{
              color: "#E8CF8A",
              WebkitTextFillColor: "#E8CF8A",
              fontFamily: '"Cormorant Garamond", "Playfair Display", Georgia, serif',
            }}
          >
            Daily refreshed Dubai real estate intelligence powered by official government sources, licensed market data partners, and JBJ editorial review.
          </p>
          <div className="mt-12 flex flex-wrap items-center justify-center gap-4">
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
          </div>
        </div>
      </section>


      <MarketIntelligenceTableOfContents
        items={MI_TOC_ITEMS}
        title="In This Section"
        ctaAction={{ label: "Speak With Our Team", href: "/contact", icon: PhoneCall }}
      />

      {/* Market Overview Dashboard - Edge to Edge */}
      <div id="overview" className="scroll-mt-24">
        <MarketOverviewDashboard />
      </div>

      {/* DLD Daily Snapshot — KPI strip, Cash vs Mortgage, Top-10, Notice + Consultation */}
      <div id="dld-snapshot" className="scroll-mt-24">
        <DLDDailySnapshot />
      </div>


      {/* Area Intelligence Grid - Edge to Edge */}
      <div id="areas" className="scroll-mt-24">
        <AreaIntelligenceGrid />
      </div>

      {/* AI Market Insights - Edge to Edge */}
      <div id="ai-insights" className="scroll-mt-24">
        <AIMarketInsights />
      </div>

      {/* Market Reports - Edge to Edge */}
      <div id="reports" className="scroll-mt-24">
        <MarketReports />
      </div>

      {/* Data Sources Panel - Edge to Edge */}
      <div id="sources" className="scroll-mt-24">
        <DataSourcesPanel />
      </div>

      {/* Compliance Disclaimer */}
      <section id="compliance" className="scroll-mt-24 surface-light py-12 bg-[#FDFBF7]" data-surface="light">
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
      <div id="cta" className="scroll-mt-24">
        <PreFooterSeparator 
          title="Ready to Make Informed Decisions?"
          subtitle="Speak with our team for personalized guidance based on your investment goals and market conditions."
          primaryLink="/contact"
          primaryText="Speak With Our Team"
          secondaryLink="/ai-home-finder"
          secondaryText="AI Home Finder"
        />
      </div>
    </div>
  );
};

export default MarketIntelligence;
