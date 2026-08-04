/**
 * Footer — Classy Corporate Edition
 * Compact, monochrome, Inter-only with single restrained champagne hairline accent.
 * All links preserved (No-Removal Policy).
 */
import { Link, useLocation } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { useAdaptiveHairline } from "@/hooks/useAdaptiveHairline";
import { AdaptiveHairline } from "@/components/ui/AdaptiveHairline";
import { HAIRLINE_TOKENS } from "@/styles/hairlineTokens";
import { MapPin, Phone, Mail, MessageCircle, Globe, ChevronDown } from "lucide-react";
import { CONTACT_INFO, getWhatsAppUrl, getCallUrl, getEmailUrl, getWebsiteUrl } from "@/constants/stats";
import jbjMonogramNobuffer from "@/assets/jbj-monogram-nobuffer.png";
import { SocialLinks } from "@/components/marketing/SocialLinks";
import { GoogleMyBusinessLink } from "@/components/marketing/GoogleMyBusinessLink";
import { useLanguage } from "@/contexts/LanguageContext";
import { useFounderVisibility } from "@/contexts/FounderVisibilityContext";
import { FounderContent } from "@/components/FounderContent";
import { ModeSwitcher } from "@/components/ModeSwitcher";
import { SUPPORTED_CURRENCIES } from "@/components/CurrencySwitcher";
import { cn } from "@/lib/utils";

import { BRAND } from "@/lib/brand-tokens";
const ACCENT = BRAND.gold;

// Visible on dark bg but soft — not harsh. ~14% white reads as a clean hairline.
const HAIRLINE = "rgba(255,255,255,0.14)";
// Champagne accent hairline — faded edges, gentle peak in the middle
const ACCENT_HAIRLINE = `linear-gradient(90deg, transparent 0%, ${ACCENT}00 8%, ${ACCENT}66 50%, ${ACCENT}00 92%, transparent 100%)`;

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
    <h4 className="text-white text-[11px] font-semibold uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
      <span className="inline-block w-1.5 h-1.5 rounded-[1px] bg-[hsl(var(--gold))]" aria-hidden="true" />
      {title}
    </h4>
    <div className="w-8 h-px mb-4" style={{ background: "linear-gradient(90deg, rgba(200,167,102,0.7), rgba(200,167,102,0))" }} aria-hidden="true" />
    <ul className="space-y-1.5">
      {links.map((link) => (
        <li key={link.href}>
          <Link
            to={link.href}
            className="group inline-flex items-center text-[13px] leading-snug text-white/95 hover:text-white border-l border-transparent hover:border-[hsl(var(--gold))]/60 pl-0 hover:pl-2 transition-all duration-200"
          >
            {link.label}
          </Link>
        </li>
      ))}
      {viewAllHref && (
        <li className="pt-2">
          <Link
            to={viewAllHref}
            className="group inline-flex items-center gap-1 text-[12px] font-semibold uppercase tracking-[0.15em] transition-colors"
            style={{ color: "#E6CFA0" }}
          >
            <span>{viewAllLabel?.replace(/\s*→\s*$/, "")}</span>
            <span className="inline-block transition-transform group-hover:translate-x-0.5" aria-hidden="true">→</span>
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
          className="flex items-center gap-2 px-3 py-1.5 text-[12px] font-medium text-white/90 hover:text-white border border-[hsl(var(--gold))]/30 hover:border-[hsl(var(--gold))]/60 rounded-md bg-[#FDFBF7]/[0.03] hover:bg-[#FDFBF7]/[0.06] transition-colors"
        >
          <span>{currentCur?.flag} {activeCurrency}</span>
          <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", currencyOpen && "rotate-180")} />
        </button>
        {currencyOpen && (
          <div
            className="absolute bottom-full mb-2 left-0 w-52 rounded-md overflow-hidden z-50 max-h-80 overflow-y-auto shadow-[0_20px_40px_rgba(0,0,0,0.55)]"
            style={{ background: "#0d2138", border: `1px solid ${HAIRLINE}` }}
          >
            <div className="h-px w-full" style={{ background: ACCENT_HAIRLINE }} aria-hidden="true" />
            {SUPPORTED_CURRENCIES.map((cur) => (
              <button
                key={cur.code}
                onClick={() => handleCurrency(cur.code)}
                className="w-full flex items-center gap-2 px-3 py-2 text-[12px] font-medium text-left text-white/95 hover:text-white hover:bg-[#FDFBF7]/5 transition-colors"
                style={{
                  background: activeCurrency === cur.code ? "rgba(200,167,102,0.12)" : "transparent",
                  color: activeCurrency === cur.code ? "#FFFFFF" : "rgba(255,255,255,0.8)",
                }}
              >
                <span>{cur.flag}</span>
                <span>{cur.code}</span>
                <span className="text-[11px] ml-auto text-white/90">{cur.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-stretch rounded-md overflow-hidden border border-[hsl(var(--gold))]/30 bg-[#FDFBF7]/[0.03]">
        {(["sqft", "sqm"] as const).map((unit, idx) => (
          <div key={unit} className="flex items-stretch">
            {idx === 1 && (
              <div className="w-px self-stretch bg-[hsl(var(--gold))]/30" aria-hidden />
            )}
            <button
              onClick={() => handleUnit(unit)}
              className="px-2.5 py-1.5 text-[12px] font-medium transition-colors"
              style={{
                background:
                  areaUnit === unit ? "rgba(200,167,102,0.18)" : "transparent",
                color: areaUnit === unit ? "#FFFFFF" : "rgba(255,255,255,0.6)",
              }}
            >
              {unit === "sqft" ? "sq ft" : "sq m"}
            </button>
          </div>
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
  const footerRef = useRef<HTMLElement>(null);
  const hairline = useAdaptiveHairline(footerRef);

  const isBackOfficeContext =
    location.pathname.startsWith("/listing-admin") || location.pathname.startsWith("/admin");

  // === Link sets (preserved verbatim) ===
  const propertiesLinks = [
    { label: t("footer.buyProperties") || "Buy Properties", href: "/properties?transaction=buy" },
    { label: t("footer.rentProperties") || "Rent Properties", href: "/properties?transaction=rent" },
    { label: "Projects", href: "/properties" },
    { label: "Developers", href: "/developers" },
    { label: t("footer.listYourProperty") || "List Your Property", href: "/list-property" },
    { label: "Communities", href: "/communities" },
    { label: "Resale Properties", href: "/properties?transaction=resale" },
    { label: "Property Map", href: "/map" },
    { label: "Property Evaluator", href: "/property-evaluator" },
    { label: "Rental Index", href: "/rental-index" },
    { label: "Property Measurement", href: "/property-measurement" },
  ];

  const sellLinks = [
    { label: "Sell Your Property", href: "/list-property" },
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
    { label: "AI Tools", href: "/ai-hub" },
    { label: "Customer Happiness", href: "/services/customer-happiness-center" },
    { label: "Architecture", href: "/services/architecture" },
    { label: "Interior Design", href: "/services/interior-design" },
    { label: "Fit-Out", href: "/services/fit-out" },
    { label: "Design & Build", href: "/services/design-build" },
    { label: "Law Firm", href: "/services/law-firm" },
    { label: "Broker Certification", href: "/services/broker-certification" },
    { label: "Complaint Procedures", href: "/services/complaint-procedures" },
    { label: "Testimonials", href: "/services/testimonials" },
    { label: "Referral Partner", href: "/referral-partner" },
    { label: "Signature Collection", href: "/services/signature-collection" },
  ];

  const investorHubLinks = [
    { label: "Investor Hub", href: "/investor/portfolio-views" },
    { label: "Investor Services", href: "/services/investment-advisory" },
    { label: "Join Investor List", href: "/investors/join" },
    { label: t("footer.investorEducation") || "Investor Education", href: "/investor-education" },
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
    { label: "FAQ Hub", href: "/faq" },
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
    { label: "Company Profile", href: "/company-profile" },
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
    { href: "/list-property", label: "Listing Portal" },
    { href: "/broker/training", label: "Broker Training" },
    // /broker-hub retired
    { href: "/broker-dashboard", label: "Broker Dashboard" },
    { href: "/broker/ai", label: "AI Sales Assistant" },
  ];

  const partnersLinks = [
    { href: "/partners/mortgage", label: "Mortgage" },
    { href: "/partners/legal", label: "Legal" },
    { href: "/partners/company-setup", label: "Company Setup" },
    { href: "/partners/visa-services", label: "Visa Services" },
  ];

  const legalLinks = [
    { label: "Terms of Service", href: "/terms" },
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Cookie Policy", href: "/cookies" },
    { label: "Disclaimers", href: "/disclaimers" },
    { label: "Intellectual Property", href: "/intellectual-property" },
    { label: "AML & KYC Policy", href: "/aml-kyc" },
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
    // { href: "/presentations", label: "Presentations" }, // REMOVED — broken tool retired
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
    { href: "/ai-home-finder", label: "AI Home Finder" },
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
    { href: "/cv-builder", label: "CV Builder" },
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
    { label: "List Your Property", href: "/list-property" },
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
    { label: "Testimonials", href: "/services/testimonials" },
    { label: "Careers", href: "/join" },
    
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

  // Hairline alphas (above) are still computed so descendants can read the
  // CSS vars and the dev preview can poll data-hairline-luminance.
  // Section dividers themselves now use <AdaptiveHairline />.

  return (
    <footer
      ref={footerRef}
      id="site-footer"
      data-footer="corporate"
      data-surface="dark"
      data-hairline-luminance={hairline.luminance.toFixed(4)}
      className="relative overflow-x-hidden isolate"
      style={{
        background: "#0A0A0A",
        color: "rgba(255,255,255,0.92)",
        fontFamily: "Inter, system-ui, sans-serif",
        // Expose alphas as CSS vars so descendants can opt in if needed.
        ["--fh-white" as string]: `rgba(${HAIRLINE_TOKENS.whiteRgb},${hairline.white})`,
        ["--fh-white-soft" as string]: `rgba(${HAIRLINE_TOKENS.whiteRgb},${hairline.whiteSoft})`,
        ["--fh-gold" as string]: `rgba(${HAIRLINE_TOKENS.champagneRgb},${hairline.gold})`,
        ["--fh-gold-peak" as string]: `rgba(${HAIRLINE_TOKENS.champagneRgb},${hairline.goldPeak})`,
      }}
    >
      {/* Premium ambient overlays — vignette + soft champagne wash */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(ellipse 80% 40% at 50% 0%, rgba(200,167,102,0.07), transparent 70%), radial-gradient(ellipse 60% 35% at 50% 100%, rgba(200,167,102,0.05), transparent 70%)",
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.04] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.6'/></svg>\")",
        }}
      />

      {/* Top hairline — single restrained champagne accent */}
      <AdaptiveHairline variant="accent" />

      {/* === ZONE 1 — Brand + utility row === */}
      <div className="px-4 sm:px-6 md:px-8 pt-10 pb-7">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col items-center text-center gap-6">
            <Link to="/" className="inline-flex items-center gap-4 group" data-no-contrast-guard>
              <img
                src={jbjMonogramNobuffer}
                alt="JBJ Global Real Estate"
                className="h-14 w-14 object-contain transition-opacity group-hover:opacity-90 shrink-0"
                style={{ filter: "drop-shadow(0 2px 6px rgba(200,167,102,0.45))" }}
               loading="lazy" decoding="async" />
              <div className="flex flex-col items-start">
                <span
                  className="text-[16px] font-semibold tracking-[0.22em] uppercase leading-tight"
                  style={{ color: "#FDFBF7" }}
                >
                  JBJ Global Real Estate
                </span>
                <div
                  className="w-12 h-px my-1.5"
                  style={{ background: "linear-gradient(90deg, rgba(200,167,102,0.85), rgba(200,167,102,0))" }}
                  aria-hidden="true"
                />
                <span
                  className="text-[11px] tracking-[0.14em] uppercase"
                  style={{ color: "rgba(253,251,247,0.92)" }}
                >
                  Excellence in Real Estate · Licensed UAE Brokerage
                </span>
              </div>
            </Link>

            {/* Gold metallic mirror Connect card. data-no-contrast-guard
                prevents the dark-surface guard from flipping ink children
                to white. data-surface="champagne" provides a stable scope. */}
            <div
              data-no-contrast-guard
              data-surface="champagne"
              className="relative flex flex-wrap items-center justify-center gap-x-3 gap-y-3 md:gap-3 px-4 py-2.5 rounded-xl overflow-hidden"
              style={{
                backgroundImage:
                  "linear-gradient(135deg, #D4B66A 0%, #B89555 32%, #8B6F3D 52%, #B89555 72%, #E6CFA0 100%)",
                border: "1px solid rgba(255,255,255,0.28)",
                boxShadow:
                  "inset 0 1px 0 rgba(255,255,255,0.55), inset 0 -1px 0 rgba(0,0,0,0.28), 0 8px 28px rgba(0,0,0,0.45)",
              }}
            >
              {/* Mirror-sweep highlight overlay */}
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-0"
                style={{
                  backgroundImage:
                    "linear-gradient(115deg, transparent 38%, rgba(255,255,255,0.18) 50%, transparent 62%)",
                  mixBlendMode: "screen",
                }}
              />
              <div className="relative flex items-center gap-2.5">
                <span className="text-[10px] uppercase tracking-[0.2em] text-[#1A1A1A] font-bold">Connect</span>
                <SocialLinks variant="premium" className="gap-2" />
              </div>
              <span className="hidden md:inline-block w-px h-5 bg-[#1A1A1A]/40 relative" aria-hidden="true" />
              <div className="relative">
                <GoogleMyBusinessLink />
              </div>
              <span className="hidden md:inline-block w-px h-5 bg-[#1A1A1A]/40 relative" aria-hidden="true" />
              <div className="relative">
                <ModeSwitcher variant="header" side="top" showForUnselected />
              </div>
              <span className="hidden md:inline-block w-px h-5 bg-[#1A1A1A]/40 relative" aria-hidden="true" />
              <div className="relative">
                <FooterCurrencyUnit />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Soft champagne hairline above the nav grid */}
      <div className="px-4 sm:px-6 md:px-8">
        <AdaptiveHairline variant="nav" className="max-w-7xl mx-auto" />
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

      {/* Soft champagne hairline below the nav grid */}
      <div className="px-4 sm:px-6 md:px-8">
        <AdaptiveHairline variant="nav" className="max-w-7xl mx-auto" />
      </div>

      {/* === ZONE 3 — Contact strip + compact legal === */}
      <div className="px-4 sm:px-6 md:px-8 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-3 mb-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[12px] uppercase tracking-[0.12em] text-white/95 bg-[#FDFBF7]/[0.03] border border-white/10">
              <MapPin className="w-3.5 h-3.5" style={{ color: ACCENT }} />
              <span>Dubai, UAE</span>
            </div>
            <a
              href={getCallUrl()}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[12px] uppercase tracking-[0.12em] text-white/95 bg-[#FDFBF7]/[0.03] border border-white/10 hover:border-[hsl(var(--gold))]/50 hover:bg-[#FDFBF7]/[0.07] hover:text-white transition-colors"
            >
              <Phone className="w-3.5 h-3.5" style={{ color: ACCENT }} />
              <span>{CONTACT_INFO.phone}</span>
            </a>
            <a
              href={getWhatsAppUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[12px] uppercase tracking-[0.12em] text-white/95 bg-[#FDFBF7]/[0.03] border border-white/10 hover:border-[hsl(var(--gold))]/50 hover:bg-[#FDFBF7]/[0.07] hover:text-white transition-colors"
            >
              <MessageCircle className="w-3.5 h-3.5" style={{ color: ACCENT }} />
              <span>WhatsApp</span>
            </a>
            <a
              href={getEmailUrl()}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[12px] uppercase tracking-[0.12em] text-white/95 bg-[#FDFBF7]/[0.03] border border-white/10 hover:border-[hsl(var(--gold))]/50 hover:bg-[#FDFBF7]/[0.07] hover:text-white transition-colors"
            >
              <Mail className="w-3.5 h-3.5" style={{ color: ACCENT }} />
              <span>{CONTACT_INFO.emailCapitalized}</span>
            </a>
            <a
              href={getWebsiteUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[12px] uppercase tracking-[0.12em] text-white/95 bg-[#FDFBF7]/[0.03] border border-white/10 hover:border-[hsl(var(--gold))]/50 hover:bg-[#FDFBF7]/[0.07] hover:text-white transition-colors"
            >
              <Globe className="w-3.5 h-3.5" style={{ color: ACCENT }} />
              <span>{CONTACT_INFO.websiteCapitalized}</span>
            </a>
          </div>


          {/* Compact legal — bidi-isolated so LTR/RTL never break each other.
              data-no-contrast-guard ensures the dark-surface contrast guard
              doesn't damp these strings to a faint gray. */}
          <div className="space-y-2 text-center max-w-4xl mx-auto" data-no-contrast-guard>
            <p className="text-[11.5px] leading-relaxed break-words" style={{ color: "rgba(253,251,247,0.96)" }} dir="ltr">
              <bdi className="font-semibold" style={{ color: "#E6CFA0" }}>JBJ Global Real Estate L.L.C S.O.C.</bdi>
              {" — Dubai mainland brokerage licensed for Buy, Sell, and Rent across the UAE. "}
              Mortgage, legal, visa, and corporate support is provided through independent licensed partners.
              <FounderContent fallback={null}>
                {" "}Owned & led by{" "}
                <Link to="/founder" className="underline-offset-2 hover:underline" style={{ color: "#E6CFA0" }}>
                  <bdi>Jane Bou Jaoude</bdi>
                  {" ("}
                  <bdi>جاين بو جودة</bdi>
                  {")"}
                </Link>
                {", Founder & CEO."}
              </FounderContent>
            </p>
            <p className="text-[11.5px] leading-relaxed break-words" style={{ color: "rgba(253,251,247,0.96)" }} dir="rtl">
              جي بي جي للعقارات هي وساطة عقارية مرخصة في دبي للبيع والشراء والإيجار.
            </p>
          </div>

          {/* Copyright + legal links — premium single row, bidi-safe */}
          <div
            className="mt-6 pt-5 border-t flex flex-col sm:flex-row items-center justify-center gap-x-3 gap-y-2 text-center"
            style={{ borderColor: `rgba(255,255,255,${hairline.white})` }}
            data-no-contrast-guard
          >
            <span className="text-[11.5px] tracking-[0.08em]" style={{ color: "#FDFBF7", fontWeight: 500 }} dir="ltr">
              © {currentYear} <bdi className="font-semibold" style={{ color: "#E6CFA0" }}>JBJ Global Real Estate</bdi> · All Rights Reserved
            </span>
            <span className="hidden sm:inline" style={{ color: "rgba(253,251,247,0.55)" }} aria-hidden="true">·</span>
            <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
              {legalLinks.map((l, i) => (
                <span key={l.href} className="flex items-center gap-3">
                  <Link
                    to={l.href}
                    className="text-[11px] uppercase tracking-[0.1em] hover:text-white transition-colors whitespace-nowrap"
                    style={{ color: "rgba(253,251,247,0.92)" }}
                  >
                    {l.label}
                  </Link>
                  {i < legalLinks.length - 1 && (
                    <span style={{ color: "rgba(253,251,247,0.55)" }} aria-hidden="true">·</span>
                  )}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom hairline */}
      <AdaptiveHairline variant="accent" />
    </footer>
  );
};

export default Footer;
