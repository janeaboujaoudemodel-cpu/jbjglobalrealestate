/**
 * Footer — Classy Corporate Edition
 * Compact, monochrome, Inter-only with single restrained champagne hairline accent.
 * All links preserved (No-Removal Policy).
 */
import { Link, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { MapPin, Phone, Mail, MessageCircle, ChevronDown } from "lucide-react";
import { CONTACT_INFO, getWhatsAppUrl, getCallUrl, getEmailUrl } from "@/constants/stats";
import jbjMonogramNobuffer from "@/assets/jbj-monogram-nobuffer.png";
import { SocialLinks } from "@/components/marketing/SocialLinks";
import { GoogleMyBusinessLink } from "@/components/marketing/GoogleMyBusinessLink";
import { useLanguage } from "@/contexts/LanguageContext";
import { useFounderVisibility } from "@/contexts/FounderVisibilityContext";
import { FounderContent } from "@/components/FounderContent";
import { ModeSwitcher } from "@/components/ModeSwitcher";
import { SUPPORTED_CURRENCIES } from "@/components/CurrencySwitcher";
import { cn } from "@/lib/utils";

const ACCENT = "#C8A766";
const HAIRLINE = "rgba(255,255,255,0.08)";

/** Compact column of links — plain text, no card chrome */
const NavColumn = ({
  title,
  links,
  viewAllHref,
  viewAllLabel,
}: {
  title: string;
  links: { label: string; href: string }[];
  viewAllHref?: string;
  viewAllLabel?: string;
}) => (
  <div>
    <h4 className="text-white text-[11px] font-semibold uppercase tracking-[0.2em] mb-3">
      {title}
    </h4>
    <ul className="space-y-1.5">
      {links.map((link) => (
        <li key={link.href}>
          <Link
            to={link.href}
            className="text-[13px] leading-snug text-white/65 hover:text-white transition-colors"
          >
            {link.label}
          </Link>
        </li>
      ))}
      {viewAllHref && (
        <li className="pt-1">
          <Link
            to={viewAllHref}
            className="text-[12px] font-semibold uppercase tracking-[0.15em] text-white/80 hover:text-white transition-colors"
            style={{ color: "#D9C292" }}
          >
            {viewAllLabel}
          </Link>
        </li>
      )}
    </ul>
  </div>
);

/** Currency & Unit switcher — flat bordered, no gold tint */
const FooterCurrencyUnit = () => {
  const [activeCurrency, setActiveCurrency] = useState<string>(() =>
    typeof window !== "undefined" ? localStorage.getItem("jj_currency") || "AED" : "AED",
  );
  const [areaUnit, setAreaUnit] = useState<string>(() =>
    typeof window !== "undefined" ? localStorage.getItem("jj_area_unit") || "sqft" : "sqft",
  );
  const [currencyOpen, setCurrencyOpen] = useState(false);

  useEffect(() => {
    const onCurrency = (e: Event) => setActiveCurrency((e as CustomEvent).detail);
    const onUnit = (e: Event) => setAreaUnit((e as CustomEvent).detail);
    window.addEventListener("currencyChange", onCurrency);
    window.addEventListener("areaUnitChange", onUnit);
    return () => {
      window.removeEventListener("currencyChange", onCurrency);
      window.removeEventListener("areaUnitChange", onUnit);
    };
  }, []);

  const handleCurrency = (code: string) => {
    setActiveCurrency(code);
    localStorage.setItem("jj_currency", code);
    window.dispatchEvent(new CustomEvent("currencyChange", { detail: code }));
    setCurrencyOpen(false);
  };
  const handleUnit = (unit: string) => {
    setAreaUnit(unit);
    localStorage.setItem("jj_area_unit", unit);
    window.dispatchEvent(new CustomEvent("areaUnitChange", { detail: unit }));
  };

  const currentCur = SUPPORTED_CURRENCIES.find((c) => c.code === activeCurrency);

  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <button
          onClick={() => setCurrencyOpen(!currencyOpen)}
          className="flex items-center gap-2 px-3 py-1.5 text-[12px] font-medium text-white/85 hover:text-white border border-white/15 hover:border-white/30 rounded transition-colors"
        >
          <span>{currentCur?.flag} {activeCurrency}</span>
          <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", currencyOpen && "rotate-180")} />
        </button>
        {currencyOpen && (
          <div
            className="absolute bottom-full mb-2 left-0 w-52 rounded overflow-hidden z-50 max-h-80 overflow-y-auto"
            style={{ background: "#0F0E0C", border: `1px solid ${HAIRLINE}` }}
          >
            {SUPPORTED_CURRENCIES.map((cur) => (
              <button
                key={cur.code}
                onClick={() => handleCurrency(cur.code)}
                className="w-full flex items-center gap-2 px-3 py-2 text-[12px] font-medium text-left text-white/80 hover:text-white hover:bg-white/5 transition-colors"
                style={{
                  background: activeCurrency === cur.code ? "rgba(255,255,255,0.05)" : "transparent",
                  color: activeCurrency === cur.code ? "#FFFFFF" : "rgba(255,255,255,0.8)",
                }}
              >
                <span>{cur.flag}</span>
                <span>{cur.code}</span>
                <span className="text-[11px] ml-auto text-white/50">{cur.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex rounded overflow-hidden border border-white/15">
        {(["sqft", "sqm"] as const).map((unit) => (
          <button
            key={unit}
            onClick={() => handleUnit(unit)}
            className="px-2.5 py-1.5 text-[12px] font-medium transition-colors"
            style={{
              background: areaUnit === unit ? "rgba(255,255,255,0.08)" : "transparent",
              color: areaUnit === unit ? "#FFFFFF" : "rgba(255,255,255,0.7)",
            }}
          >
            {unit === "sqft" ? "sq ft" : "sq m"}
          </button>
        ))}
      </div>
    </div>
  );
};

const Footer = () => {
  const { t } = useLanguage();
  const { isFounderVisible } = useFounderVisibility();
  const currentYear = new Date().getFullYear();
  const location = useLocation();

  const isBackOfficeContext =
    location.pathname.startsWith("/listing-admin") || location.pathname.startsWith("/admin");

  // === Link sets (preserved verbatim) ===
  const propertiesLinks = [
    { label: t("footer.buyProperties") || "Buy Properties", href: "/properties?transaction=buy" },
    { label: t("footer.rentProperties") || "Rent Properties", href: "/properties?transaction=rent" },
    { label: "Projects", href: "/properties" },
    { label: "Developers", href: "/developers" },
    { label: t("footer.listYourProperty") || "List Your Property", href: "/listing-portal" },
    { label: "Communities", href: "/communities" },
    { label: "Resale Properties", href: "/properties?transaction=resale" },
    { label: "Property Map", href: "/map" },
    { label: "Property Evaluator", href: "/property-evaluator" },
    { label: "Rental Index", href: "/rental-index" },
    { label: "Property Measurement", href: "/property-measurement" },
  ];

  const sellLinks = [
    { label: "Sell Your Property", href: "/listing-portal" },
    { label: t("footer.sellerGuide") || "Seller's Guide", href: "/seller-guide" },
    { label: "Property Valuation", href: "/sell/valuation" },
    { label: "Selling Advisory", href: "/services/selling-advisory" },
  ];

  const servicesLinks = [
    { label: "Explore All Services", href: "/services" },
    { label: t("footer.buyerAdvisory") || "Buyer Advisory", href: "/services/buying-advisory" },
    { label: t("footer.sellerAdvisory") || "Seller Advisory", href: "/services/selling-advisory" },
    { label: t("footer.leasingAdvisory") || "Rental Advisory", href: "/services/rental-advisory" },
    { label: t("footer.investmentAdvisory") || "Investment Advisory", href: "/services/investment-advisory" },
    { label: "Snagging & Inspection", href: "/services/snagging" },
    { label: "Property Management", href: "/services/property-management" },
    { label: "Short-Term Rentals", href: "/services/short-term-rentals" },
    { label: "Currency Exchange", href: "/services/currency-exchange" },
    { label: "Concierge Services", href: "/services/concierge" },
    { label: "Company Setup", href: "/services/company-setup" },
    { label: "AI Tools", href: "/services/ai-tools" },
    { label: "Customer Happiness", href: "/services/customer-happiness-center" },
    { label: "Architecture", href: "/services/architecture" },
    { label: "Interior Design", href: "/services/interior-design" },
    { label: "Fit-Out", href: "/services/fit-out" },
    { label: "Design & Build", href: "/services/design-build" },
    { label: "Law Firm", href: "/services/law-firm" },
    { label: "Broker Certification", href: "/services/broker-certification" },
    { label: "Complaint Procedures", href: "/services/complaint-procedures" },
    { label: "Testimonials", href: "/reviews" },
    { label: "Referral Partner", href: "/referral-partner" },
    { label: "Signature Collection", href: "/services/signature-collection" },
  ];

  const investorHubLinks = [
    { label: "Investor Hub", href: "/investor/portfolio-views" },
    { label: "Investor Services", href: "/services/investment-advisory" },
    { label: "Join Investor List", href: "/investors/join" },
    { label: t("footer.investorEducation") || "Investor Education", href: "/investor-education" },
    { label: t("footer.investorFaqs") || "Investor FAQs", href: "/investor-faq" },
    { label: t("footer.investorTools") || "Investor Tools", href: "/ai-hub" },
    { label: "Investor Dashboard", href: "/investor-dashboard" },
    { label: "Portfolio Views", href: "/investor-dashboard/portfolio" },
  ];

  const guidesLinks = [
    { label: t("footer.buyerGuide") || "Buyer Guide", href: "/buyer-guide" },
    { label: t("footer.sellerGuide") || "Seller Guide", href: "/seller-guide" },
    { label: t("footer.landlordGuide") || "Landlord Guide", href: "/landlord-guide" },
    { label: t("footer.tenantGuide") || "Tenant Guide", href: "/tenant-guide" },
    { label: t("footer.areaGuides") || "Area Guides", href: "/areas" },
    { label: "Golden Visa Guide", href: "/guides/golden-visa-uae" },
    { label: "Buyer FAQs", href: "/buyer-faq" },
    { label: "Seller FAQs", href: "/seller-faq" },
    { label: "Landlord FAQs", href: "/landlord-faq" },
    { label: "Tenant FAQs", href: "/tenant-faq" },
    { label: t("footer.generalFaqs") || "General FAQs", href: "/faq" },
    { label: "Broker FAQs", href: "/broker-faq" },
    { label: "Investor FAQs", href: "/investor-faq" },
    { label: "Broker Education", href: "/broker-education" },
    { label: "Books Library", href: "/education-hub" },
  ];

  const marketIntelLinks = [
    { label: t("footer.marketOverview") || "Market Overview", href: "/market-intelligence/overview" },
    { label: t("footer.areaIntelligence") || "Area Intelligence", href: "/market-intelligence/areas" },
    { label: t("footer.marketReports") || "Market Reports", href: "/market-intelligence/reports" },
    { label: t("footer.methodology") || "Methodology & Data Sources", href: "/market-intelligence/methodology" },
  ];

  const aboutLinks = [
    { label: t("footer.aboutJbj") || "About JBJ", href: "/about" },
    ...(isFounderVisible
      ? [{ label: t("footer.founderLeadership") || "Founder & Leadership", href: "/founder" }]
      : []),
    { label: t("footer.meetTheTeam") || "Meet the Team", href: "/team" },
    { label: t("footer.awardsRecognition") || "Awards & Recognition", href: "/awards" },
    { label: t("footer.newsInsights") || "News & Insights", href: "/news" },
    { label: "Press Kit", href: "/press-kit" },
    { label: "Company Profile", href: "/company-profile" },
    { label: "Philanthropy", href: "/philanthropy" },
    { label: "Reviews", href: "/reviews" },
    { label: "Our Brokers", href: "/brokers" },
    { label: "Partner Governance", href: "/governance/partners" },
  ];

  const careerLinks = [
    { href: "/join", label: t("footer.applyJoin") || "Apply to Join Our Team" },
    { href: "/hr-agent", label: "Connect with Our HR" },
  ];

  const brokerAcademyLinks = [
    { href: "/broker-toolkit", label: "Broker Portal" },
    { href: "/onboarding", label: "JBJ Academy" },
    { href: "/academy/graduates", label: "Academy Graduates" },
    { href: "/broker-education", label: "Broker Education" },
    { href: "/broker-resources", label: "Broker Resources" },
    { href: "/listing-portal", label: "Listing Portal" },
    { href: "/broker/training", label: "Broker Training" },
    { href: "/broker-hub", label: "Broker Hub" },
    { href: "/broker-dashboard", label: "Broker Dashboard" },
    { href: "/ai-broker-workspace", label: "AI Broker Workspace" },
  ];

  const partnersLinks = [
    { href: "/partners/mortgage", label: "Mortgage" },
    { href: "/partners/legal", label: "Legal" },
    { href: "/partners/company-setup", label: "Company Setup" },
    { href: "/partners/visa-services", label: "Visa Services" },
    { href: "/governance/partners", label: "Partners Hub" },
  ];

  const legalLinks = [
    { label: "Terms of Service", href: "/terms" },
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Cookie Policy", href: "/cookies" },
    { label: "Disclaimers", href: "/disclaimers" },
    { label: "Intellectual Property", href: "/intellectual-property" },
    { label: "AML & KYC Policy", href: "/aml-kyc" },
    { label: "Accessibility", href: "/accessibility" },
    { label: "Trust & Audit", href: "/trust-and-audit-center" },
  ];

  const businessSuitesLinks = [
    { href: "/business-suite/all", label: "All Tools Suite" },
    { href: "/business-suite/real-estate", label: "Real Estate Suite" },
    { href: "/business-suite/broker", label: "Broker Intelligence Suite" },
    { href: "/business-suite/creative", label: "Creative & Communication" },
    { href: "/business-suite/productivity", label: "Productivity Suite" },
  ];

  const productivityLinks = [
    { href: "/spreadsheet", label: "Spreadsheet" },
    { href: "/documents", label: "Document Designer" },
    { href: "/qr-generator", label: "QR Generator" },
    { href: "/video-meeting", label: "Video Meeting" },
    { href: "/presentations", label: "Presentations" },
    { href: "/e-signature", label: "E-Signature" },
    { href: "/meeting-center", label: "Meeting Center" },
    { href: "/contract-forms", label: "Contract Forms" },
    { href: "/pricing", label: "Pricing" },
    { href: "/onboarding", label: "Onboarding" },
    { href: "/client-portal", label: "Client Portal" },
  ];

  const professionalTools = [
    { href: "/compare", label: "Property Comparison" },
    { href: "/property-evaluator", label: "JBJ Property Evaluator" },
    { href: "/rental-index", label: "JBJ Rental Index" },
    { href: "/mortgage-calculator", label: "Mortgage Calculator" },
    { href: "/quiz", label: "AI Home Finder" },
    { href: "/business-card-scanner", label: "Business Card Scanner" },
    { href: "/whiteboard", label: "Whiteboard" },
    { href: "/mindmap", label: "Mind Map" },
    { href: "/form-builder", label: "Form Builder" },
    { href: "/kanban", label: "Kanban Board" },
    { href: "/email-client", label: "Email Client" },
    { href: "/team-chat", label: "Team Chat" },
    { href: "/sitemap", label: "Sitemap" },
  ];

  const aiToolsLinks = [
    { href: "/property-evaluator", label: "Property Evaluator" },
    { href: "/ai-price-predictor", label: "Price Predictor" },
    { href: "/interior-design-ai", label: "Interior Design" },
    { href: "/virtual-staging-ai", label: "Virtual Staging" },
    { href: "/ai-market-report", label: "Market Report" },
    { href: "/ai-roi-calculator", label: "ROI Calculator" },
    { href: "/ai-email-generator", label: "Email Generator" },
    { href: "/ai-social-media", label: "Social Media" },
    { href: "/ai-translation-hub", label: "Translation Hub" },
    { href: "/ai-document-generator", label: "Doc Generator" },
    { href: "/ai-personal-shopper", label: "AI Personal Shopper" },
    { href: "/ai-calendar", label: "AI Calendar" },
    { href: "/ai-budget-planner", label: "AI Budget Planner" },
    { href: "/ai-investment-report", label: "AI Investment Report" },
    { href: "/ai-call-summarizer", label: "AI Call Summarizer" },
    { href: "/ai-client-matcher", label: "AI Client Matcher" },
    { href: "/ai-description-writer", label: "AI Description Writer" },
    { href: "/my-ai-history", label: "AI History" },
  ];

  const creativeSuitesLinks = [
    { href: "/toolkit/corporate-suite", label: "Corporate Suite" },
    { href: "/toolkit/property-suite", label: "Real Estate Suite" },
    { href: "/toolkit/video-suite", label: "Video Suite" },
    { href: "/toolkit/photo-suite", label: "Photo & Image Suite" },
    { href: "/toolkit/voice-suite", label: "Voice & Audio Suite" },
    { href: "/toolkit/pdf-suite", label: "PDF & Documents Suite" },
    { href: "/toolkit/stamp-generator", label: "Smart Stamp Generator" },
    { href: "/toolkit/corporate-suite/business-card", label: "Business Card" },
    { href: "/toolkit/corporate-suite/cv-resume", label: "CV Builder" },
    { href: "/toolkit/corporate-suite/cover-letter", label: "Cover Letter" },
    { href: "/toolkit/corporate-suite/company-profile", label: "Company Profile Builder" },
    { href: "/toolkit/corporate-suite/landing-page", label: "Landing Page Builder" },
    { href: "/toolkit/pdf-editor", label: "PDF Editor" },
    { href: "/brand-palette", label: "Brand Palette" },
    { href: "/toolkit/voice-studio-pro", label: "Voice Studio Pro" },
    { href: "/e-signature", label: "JBJ E-Sign" },
    { href: "/toolkit/scan-sign", label: "Scan & Sign" },
  ];

  const educationHubLinks = [
    { href: "/broker-education", label: "Books" },
    { href: "/guides", label: "Guides" },
    { href: "/market-intelligence/reports", label: "Market Reports" },
    { href: "/education-hub", label: "Education Hub" },
  ];

  // === Premium consolidated 4-column structure ===
  // Each column = one curated cluster of related links. View-all links route
  // to a hub page so we never duplicate dozens of items in the footer chrome.
  const colExplore = [
    { label: t("footer.buyProperties") || "Buy", href: "/properties?transaction=buy" },
    { label: t("footer.rentProperties") || "Rent", href: "/properties?transaction=rent" },
    { label: "Resale", href: "/properties?transaction=resale" },
    { label: "Projects", href: "/properties" },
    { label: "Developers", href: "/developers" },
    { label: "Communities", href: "/communities" },
    { label: "Property Map", href: "/map" },
    { label: "List Your Property", href: "/listing-portal" },
  ];

  const colServices = [
    { label: "All Services", href: "/services" },
    { label: t("footer.buyerAdvisory") || "Buyer Advisory", href: "/services/buying-advisory" },
    { label: t("footer.sellerAdvisory") || "Seller Advisory", href: "/services/selling-advisory" },
    { label: t("footer.investmentAdvisory") || "Investment Advisory", href: "/services/investment-advisory" },
    { label: "Property Management", href: "/services/property-management" },
    { label: "Snagging & Inspection", href: "/services/snagging" },
    { label: "Concierge", href: "/services/concierge" },
    { label: "Golden Visa Guide", href: "/guides/golden-visa-uae" },
  ];

  const colCompany = [
    { label: t("footer.aboutJbj") || "About JBJ", href: "/about" },
    ...(isFounderVisible
      ? [{ label: t("footer.founderLeadership") || "Founder & Leadership", href: "/founder" }]
      : []),
    { label: t("footer.meetTheTeam") || "Meet the Team", href: "/team" },
    { label: t("footer.awardsRecognition") || "Awards", href: "/awards" },
    { label: t("footer.newsInsights") || "News & Insights", href: "/news" },
    { label: "Reviews", href: "/reviews" },
    { label: "Careers", href: "/join" },
    { label: "Press Kit", href: "/press-kit" },
  ];

  const colResources = [
    { label: "Buyer Guide", href: "/buyer-guide" },
    { label: "Seller Guide", href: "/seller-guide" },
    { label: "Area Guides", href: "/areas" },
    { label: "Market Intelligence", href: "/market-intelligence/overview" },
    { label: "Investor Hub", href: "/investor/portfolio-views" },
    { label: "Broker Portal", href: "/broker-toolkit" },
    { label: "AI Tools", href: "/ai-hub" },
    { label: "Education Hub", href: "/education-hub" },
  ];

  return (
    <footer
      id="site-footer"
      data-surface="dark"
      className="relative overflow-x-hidden"
      style={{
        background: "#0A0908",
        color: "rgba(255,255,255,0.85)",
        fontFamily: "Inter, system-ui, sans-serif",
      }}
    >
      {/* Top hairline — single restrained champagne accent */}
      <div className="h-px w-full" style={{ background: `linear-gradient(90deg, transparent, ${ACCENT}55, transparent)` }} />

      {/* === ZONE 1 — Brand + utility row === */}
      <div className="px-4 sm:px-6 md:px-8 pt-10 pb-7">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <Link to="/" className="inline-flex items-center gap-3 group">
              <img
                src={jbjMonogramNobuffer}
                alt="JBJ Global Real Estate"
                className="h-12 w-auto object-contain transition-opacity group-hover:opacity-90"
                style={{ filter: `drop-shadow(0 4px 12px ${ACCENT}30)` }}
              />
              <div className="flex flex-col">
                <span className="text-white text-[15px] font-semibold tracking-[0.18em] uppercase leading-tight">
                  JBJ Global Real Estate
                </span>
                <span className="text-white/55 text-[11px] tracking-[0.12em] uppercase mt-0.5">
                  Excellence in Real Estate · Licensed UAE Brokerage
                </span>
              </div>
            </Link>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-3 md:gap-5">
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase tracking-[0.2em] text-white/45">Connect</span>
                <SocialLinks variant="glow" iconClassName="w-4 h-4" />
              </div>
              <GoogleMyBusinessLink />
              {/* Mode switcher opens upward inside the footer so it never
                  overlays the page header above. */}
              <ModeSwitcher variant="header" showForUnselected={true} side="top" />
              <FooterCurrencyUnit />
            </div>
          </div>
        </div>
      </div>

      {/* Single premium hairline above the nav grid */}
      <div className="px-4 sm:px-6 md:px-8">
        <div className="max-w-7xl mx-auto h-px" style={{ background: HAIRLINE }} />
      </div>

      {/* === ZONE 2 — Premium 4-col navigation grid === */}
      <div className="px-4 sm:px-6 md:px-8 py-10">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-10">
          <NavColumn
            title={t("footer.properties") || "Explore"}
            links={colExplore}
            viewAllHref="/properties"
            viewAllLabel="All Properties →"
          />
          <NavColumn
            title={t("footer.servicesSection") || "Services"}
            links={colServices}
            viewAllHref="/services"
            viewAllLabel="All Services →"
          />
          <NavColumn
            title="Company"
            links={colCompany}
            viewAllHref="/about"
            viewAllLabel="About JBJ →"
          />
          <NavColumn
            title="Resources"
            links={colResources}
            viewAllHref="/ai-hub"
            viewAllLabel="View All Tools →"
          />
        </div>
      </div>

      {/* Single premium hairline below the nav grid */}
      <div className="px-4 sm:px-6 md:px-8">
        <div className="max-w-7xl mx-auto h-px" style={{ background: HAIRLINE }} />
      </div>

      {/* === ZONE 3 — Contact strip + compact legal === */}
      <div className="px-4 sm:px-6 md:px-8 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 mb-6">
            <div className="flex items-center gap-2 text-[12px] text-white/70">
              <MapPin className="w-3.5 h-3.5" style={{ color: ACCENT }} />
              <span>{CONTACT_INFO.address}</span>
            </div>
            <span className="hidden md:inline text-white/20">·</span>
            <a href={getCallUrl()} className="flex items-center gap-2 text-[12px] text-white/70 hover:text-white transition-colors">
              <Phone className="w-3.5 h-3.5" style={{ color: ACCENT }} />
              <span>{CONTACT_INFO.phone}</span>
            </a>
            <span className="hidden md:inline text-white/20">·</span>
            <a href={getEmailUrl()} className="flex items-center gap-2 text-[12px] text-white/70 hover:text-white transition-colors">
              <Mail className="w-3.5 h-3.5" style={{ color: ACCENT }} />
              <span>{CONTACT_INFO.emailCapitalized}</span>
            </a>
            <span className="hidden md:inline text-white/20">·</span>
            <a
              href={getWhatsAppUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-[12px] text-white/70 hover:text-white transition-colors"
            >
              <MessageCircle className="w-3.5 h-3.5" style={{ color: ACCENT }} />
              <span>WhatsApp</span>
            </a>
          </div>

          {/* Compact legal — single paragraph, RTL kept */}
          <div className="space-y-2 text-center max-w-4xl mx-auto">
            <p className="text-[11px] leading-relaxed text-white/55">
              <span className="text-white/75 font-medium">JBJ Global Real Estate L.L.C S.O.C.</span> — Dubai mainland brokerage licensed for Buy, Sell, and Rent across the UAE.
              Mortgage, legal, visa, and corporate support is provided through independent licensed partners.
              <FounderContent fallback={null}>
                {" "}Owned & led by{" "}
                <Link to="/founder" className="text-white/75 hover:text-white underline-offset-2 hover:underline">Jane Bou Jaoude (جاين بو جودة)</Link>, Founder & CEO.
              </FounderContent>
            </p>
            <p className="text-[11px] leading-relaxed text-white/55" dir="rtl">
              جي بي جي للعقارات هي وساطة عقارية مرخصة في دبي للبيع والشراء والإيجار.
            </p>
          </div>

          {/* Copyright + legal links — premium single row */}
          <div className="mt-6 pt-5 border-t flex flex-col sm:flex-row items-center justify-center gap-x-3 gap-y-2 text-center" style={{ borderColor: HAIRLINE }}>
            <span className="text-[11px] text-white/60">
              © {currentYear} JBJ Global Real Estate · All Rights Reserved
            </span>
            <span className="hidden sm:inline text-white/20">·</span>
            <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
              {legalLinks.map((l, i) => (
                <span key={l.href} className="flex items-center gap-3">
                  <Link to={l.href} className="text-[11px] text-white/55 hover:text-white transition-colors">
                    {l.label}
                  </Link>
                  {i < legalLinks.length - 1 && <span className="text-white/15">·</span>}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom hairline */}
      <div className="h-px w-full" style={{ background: `linear-gradient(90deg, transparent, ${ACCENT}55, transparent)` }} />
    </footer>
  );
};

export default Footer;
