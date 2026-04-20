/**
 * Footer — Unified Premium Dark Luxury Edition
 * Single canonical footer used site-wide via MainLayout.
 * Dark obsidian surface with champagne/gold accents.
 * All links and sections preserved (No-Removal Policy).
 */
import { Link, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  MapPin,
  Phone,
  Mail,
  MessageCircle,
  ChevronDown,
} from "lucide-react";
import { CONTACT_INFO, getWhatsAppUrl, getCallUrl, getEmailUrl } from "@/constants/stats";
import jbjMonogramNobuffer from "@/assets/jbj-monogram-nobuffer.png";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { SocialLinks } from "@/components/marketing/SocialLinks";
import { NewsletterBrevo } from "@/components/marketing/NewsletterBrevo";
import { GoogleMyBusinessLink } from "@/components/marketing/GoogleMyBusinessLink";
import { useLanguage } from "@/contexts/LanguageContext";
import { useFounderVisibility } from "@/contexts/FounderVisibilityContext";
import { FounderContent } from "@/components/FounderContent";
import { ModeSwitcher } from "@/components/ModeSwitcher";
import { useUserModeContext } from "@/contexts/UserModeContext";
import { SUPPORTED_CURRENCIES } from "@/components/CurrencySwitcher";
import { cn } from "@/lib/utils";

/** Premium footer navigation card — dark glass with champagne title */
const FooterCard = ({ title, links, viewAllHref, viewAllLabel }: {
  title: string;
  links: { label: string; href: string }[];
  viewAllHref?: string;
  viewAllLabel?: string;
}) => (
  <div
    className="group relative rounded-xl px-6 py-5 transition-all duration-500 hover:-translate-y-0.5"
    style={{
      background: "linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.02) 100%)",
      border: "1px solid rgba(200,167,102,0.18)",
      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05), 0 8px 24px rgba(0,0,0,0.35)",
    }}
  >
    <h4
      className="text-center font-semibold text-xs sm:text-sm uppercase tracking-[0.22em] mb-3 pb-3"
      style={{
        color: "#E8D5A8",
        borderBottom: "1px solid rgba(200,167,102,0.22)",
      }}
    >
      {title}
    </h4>
    <div className="relative">
      <div className="hidden min-[375px]:block absolute left-1/2 top-0 bottom-0 w-px -translate-x-1/2"
        style={{ background: "linear-gradient(180deg, transparent, rgba(200,167,102,0.18), transparent)" }}
      />
      <div className="grid grid-cols-1 min-[375px]:grid-cols-2 gap-x-5 gap-y-2">
        {links.map((link) => (
          <Link
            key={link.href}
            to={link.href}
            className="text-[13px] leading-relaxed transition-all duration-300 hover:translate-x-1"
            style={{ color: "rgba(255,255,255,0.72)" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#FDE68A")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.72)")}
          >
            {link.label}
          </Link>
        ))}
      </div>
    </div>
    {viewAllHref && (
      <Link
        to={viewAllHref}
        className="block text-center mt-3.5 pt-2.5 text-xs sm:text-sm font-semibold tracking-wider uppercase transition-colors"
        style={{ color: "#E8D5A8", borderTop: "1px solid rgba(200,167,102,0.22)" }}
      >
        {viewAllLabel}
      </Link>
    )}
  </div>
);

/** Currency & Unit switcher for footer — dark luxury */
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
    <div className="flex items-center gap-3">
      <p className="text-[10px] uppercase tracking-[0.2em] whitespace-nowrap" style={{ color: "rgba(232,213,168,0.7)" }}>
        Currency
      </p>
      <div className="flex items-center gap-2">
        <div className="relative">
          <button
            onClick={() => setCurrencyOpen(!currencyOpen)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(200,167,102,0.3)",
              color: "#FFFFFF",
            }}
          >
            <span>{currentCur?.flag} {activeCurrency}</span>
            <ChevronDown className={cn("w-4 h-4 transition-transform", currencyOpen && "rotate-180")} style={{ color: "#E8D5A8" }} />
          </button>
          {currencyOpen && (
            <div
              className="absolute bottom-full mb-2 left-0 w-52 rounded-lg overflow-hidden z-50 max-h-80 overflow-y-auto"
              style={{
                background: "#0F0E0C",
                border: "1px solid rgba(200,167,102,0.3)",
                boxShadow: "0 20px 40px rgba(0,0,0,0.6)",
              }}
            >
              {SUPPORTED_CURRENCIES.map((cur) => (
                <button
                  key={cur.code}
                  onClick={() => handleCurrency(cur.code)}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors text-left"
                  style={{
                    background: activeCurrency === cur.code ? "rgba(200,167,102,0.12)" : "transparent",
                    color: activeCurrency === cur.code ? "#FDE68A" : "rgba(255,255,255,0.85)",
                  }}
                >
                  <span>{cur.flag}</span>
                  <span>{cur.code}</span>
                  <span className="text-xs ml-auto" style={{ color: "rgba(255,255,255,0.5)" }}>{cur.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="w-px h-8" style={{ background: "linear-gradient(180deg, transparent, rgba(200,167,102,0.3), transparent)" }} />

        <div className="flex rounded-lg overflow-hidden" style={{ border: "1px solid rgba(200,167,102,0.3)" }}>
          {(["sqft", "sqm"] as const).map((unit) => (
            <button
              key={unit}
              onClick={() => handleUnit(unit)}
              className="px-4 py-2.5 text-sm font-semibold transition-all"
              style={{
                background: areaUnit === unit ? "rgba(200,167,102,0.18)" : "transparent",
                color: areaUnit === unit ? "#FDE68A" : "rgba(255,255,255,0.7)",
              }}
            >
              {unit === "sqft" ? "sq ft" : "sq m"}
            </button>
          ))}
        </div>
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

  // === Link sets (preserved from original) ===
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

  return (
    <footer
      id="site-footer"
      data-surface="dark"
      className="relative overflow-x-hidden"
      style={{
        background:
          "radial-gradient(1200px 600px at 20% 0%, rgba(200,167,102,0.08), transparent 60%), radial-gradient(800px 500px at 80% 100%, rgba(200,167,102,0.05), transparent 60%), linear-gradient(180deg, #0A0908 0%, #0F0D0A 50%, #0A0908 100%)",
        color: "rgba(255,255,255,0.92)",
      }}
    >
      {/* Top gold hairline */}
      <div
        className="h-px w-full"
        style={{ background: "linear-gradient(90deg, transparent, rgba(200,167,102,0.6), transparent)" }}
      />

      {/* === ZONE 1 — Brand crown === */}
      <div className="relative w-full pt-12 pb-8 px-4 sm:px-6 md:px-8">
        <div className="max-w-7xl mx-auto flex flex-col items-center text-center">
          <Link to="/" className="inline-block group">
            <img
              src={jbjMonogramNobuffer}
              alt="JBJ Global Real Estate"
              className="h-16 sm:h-24 md:h-32 lg:h-40 w-auto object-contain mb-4 sm:mb-6 transition-transform duration-700 group-hover:scale-[1.03]"
              style={{ filter: "drop-shadow(0 12px 32px rgba(200,167,102,0.25))" }}
            />
          </Link>

          <h2
            className="font-serif text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-light tracking-[0.2em] mb-3"
            style={{ color: "#FFFFFF", fontFamily: "'Cormorant Garamond', 'Playfair Display', Georgia, serif" }}
          >
            JBJ <span style={{ color: "#E8D5A8" }}>GLOBAL</span> REAL ESTATE
          </h2>

          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-px" style={{ background: "linear-gradient(90deg, transparent, #C8A766)" }} />
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#C8A766" }} />
            <div className="w-10 h-px" style={{ background: "linear-gradient(90deg, #C8A766, transparent)" }} />
          </div>

          <p
            className="text-xs sm:text-sm tracking-[0.35em] uppercase font-light"
            style={{ color: "rgba(232,213,168,0.85)" }}
          >
            Excellence in Real Estate
          </p>
        </div>
      </div>

      {/* === ZONE 2 — License + Newsletter card === */}
      <div className="relative px-4 sm:px-6 md:px-8 pb-10">
        <div
          className="max-w-6xl mx-auto rounded-2xl p-6 sm:p-10 md:p-12"
          style={{
            background: "linear-gradient(180deg, rgba(255,255,255,0.035) 0%, rgba(255,255,255,0.01) 100%)",
            border: "1px solid rgba(200,167,102,0.22)",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06), 0 20px 50px rgba(0,0,0,0.4)",
          }}
        >
          {/* Licensed line */}
          <div className="flex items-center justify-center gap-3 mb-3 flex-wrap">
            <span className="w-2 h-2 rounded-full" style={{ background: "#C8A766" }} />
            <p
              className="font-medium text-sm sm:text-base md:text-lg tracking-[0.18em] uppercase text-center"
              style={{ color: "#FFFFFF" }}
            >
              Licensed <span style={{ color: "#E8D5A8" }}>✦</span> Buy{" "}
              <span style={{ color: "#E8D5A8" }}>✦</span> Sell{" "}
              <span style={{ color: "#E8D5A8" }}>✦</span> Rent{" "}
              <span style={{ color: "#E8D5A8" }}>✦</span> Real Estate in the UAE
            </p>
            <span className="w-2 h-2 rounded-full" style={{ background: "#C8A766" }} />
          </div>
          <p
            className="text-xs sm:text-sm text-center max-w-2xl mx-auto mb-8"
            style={{ color: "rgba(255,255,255,0.6)" }}
          >
            Mortgage, legal, visa, and corporate support is provided through independent licensed partners.
          </p>

          {/* Newsletter */}
          {!isBackOfficeContext && (
            <>
              <div
                className="h-px max-w-md mx-auto mb-8"
                style={{ background: "linear-gradient(90deg, transparent, rgba(200,167,102,0.4), transparent)" }}
              />
              <div className="text-center mb-8">
                <h3
                  className="text-2xl md:text-3xl font-light tracking-[0.2em] mb-3"
                  style={{
                    color: "#FFFFFF",
                    fontFamily: "'Cormorant Garamond', 'Playfair Display', Georgia, serif",
                  }}
                >
                  <span style={{ color: "#E8D5A8" }}>✦</span> Stay in the Loop{" "}
                  <span style={{ color: "#E8D5A8" }}>✦</span>
                </h3>
                <p
                  className="text-sm md:text-base mb-6 max-w-xl mx-auto"
                  style={{ color: "rgba(255,255,255,0.7)" }}
                >
                  Be the first to access new listings, market updates, and personalized brokerage guidance.
                </p>
                <div className="max-w-lg mx-auto">
                  <NewsletterBrevo variant="compact" source="footer_unified_dark" />
                </div>
              </div>
              <div
                className="h-px max-w-md mx-auto mb-8"
                style={{ background: "linear-gradient(90deg, transparent, rgba(200,167,102,0.4), transparent)" }}
              />
            </>
          )}

          {/* Utility strip */}
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6 flex-wrap">
            <div className="flex items-center gap-4 flex-wrap justify-center">
              <p className="text-[10px] uppercase tracking-[0.25em] font-semibold" style={{ color: "#E8D5A8" }}>
                Connect
              </p>
              <SocialLinks variant="glow" iconClassName="w-6 h-6" />
            </div>

            <a
              href={getEmailUrl()}
              className="flex items-center gap-3 group"
            >
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center transition-colors"
                style={{ background: "rgba(200,167,102,0.12)", border: "1px solid rgba(200,167,102,0.3)" }}
              >
                <Mail className="w-4 h-4" style={{ color: "#E8D5A8" }} />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] font-semibold mb-0.5" style={{ color: "#E8D5A8" }}>
                  Write Us
                </p>
                <p className="text-sm font-semibold" style={{ color: "#FFFFFF" }}>{CONTACT_INFO.email}</p>
              </div>
            </a>

            <div className="flex items-center"><GoogleMyBusinessLink /></div>

            <div className="flex items-center gap-3">
              <p className="text-[10px] uppercase tracking-[0.2em] font-semibold" style={{ color: "#E8D5A8" }}>
                Mode
              </p>
              <ModeSwitcher variant="header" showForUnselected={true} />
            </div>

            <FooterCurrencyUnit />
          </div>
        </div>
      </div>

      {/* === ZONE 3 — Navigation grid === */}
      <div className="relative px-4 sm:px-6 md:px-8 pb-10">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            <FooterCard title={t("footer.properties") || "Properties"} links={propertiesLinks} />
            <FooterCard title={t("footer.servicesSection") || "Services"} links={servicesLinks} />
            <FooterCard title={t("footer.guides") || "Guides"} links={guidesLinks} />
            <FooterCard title="About & Careers" links={[...aboutLinks, ...careerLinks]} />
            <FooterCard title="Sell" links={sellLinks} />
            <FooterCard title="Investor Hub" links={investorHubLinks} />
            <FooterCard title="Broker & Academy" links={brokerAcademyLinks} />
            <FooterCard title="Partners" links={partnersLinks} />
            <FooterCard title="Legal" links={legalLinks} />
            <FooterCard title="Business Suites" links={businessSuitesLinks} />
            <FooterCard title="Productivity" links={productivityLinks} />
            <FooterCard title="Professional Tools" links={professionalTools} />
            <FooterCard
              title="Education Hub"
              links={[
                { href: "/broker-education", label: "Books" },
                { href: "/guides", label: "Guides" },
                { href: "/market-intelligence/reports", label: "Market Reports" },
                { href: "/education-hub", label: "Education Hub" },
              ]}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <FooterCard
              title="AI Tools"
              links={[
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
              ]}
              viewAllHref="/ai-hub"
              viewAllLabel="View All 40+ Tools →"
            />
            <FooterCard title="Market Intelligence" links={marketIntelLinks} />
            <FooterCard
              title="Creative Suites"
              links={[
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
              ]}
              viewAllHref="/ai-hub"
              viewAllLabel="View All Creative Tools →"
            />
          </div>
        </div>
      </div>

      {/* === ZONE 4 — Get In Touch === */}
      <div className="relative px-4 sm:px-6 md:px-8 pb-10">
        <div
          className="max-w-6xl mx-auto rounded-2xl p-8 md:p-10 text-center"
          style={{
            background: "linear-gradient(180deg, rgba(255,255,255,0.035) 0%, rgba(255,255,255,0.01) 100%)",
            border: "1px solid rgba(200,167,102,0.22)",
          }}
        >
          <h4
            className="font-light text-2xl md:text-3xl tracking-[0.2em] uppercase mb-2"
            style={{
              color: "#FFFFFF",
              fontFamily: "'Cormorant Garamond', 'Playfair Display', Georgia, serif",
            }}
          >
            Get in <span style={{ color: "#E8D5A8" }}>Touch</span>
          </h4>
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="w-8 h-px" style={{ background: "linear-gradient(90deg, transparent, #C8A766)" }} />
            <span className="w-1 h-1 rounded-full" style={{ background: "#C8A766" }} />
            <div className="w-8 h-px" style={{ background: "linear-gradient(90deg, #C8A766, transparent)" }} />
          </div>

          <div className="flex items-center justify-center gap-3 mb-6 px-1">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(200,167,102,0.12)", border: "1px solid rgba(200,167,102,0.3)" }}
            >
              <MapPin className="w-5 h-5" style={{ color: "#E8D5A8" }} />
            </div>
            <span className="text-sm md:text-base" style={{ color: "rgba(255,255,255,0.85)" }}>
              {CONTACT_INFO.address}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-6 md:gap-10">
            {[
              { icon: Phone, label: CONTACT_INFO.phone, href: getCallUrl(), external: false },
              { icon: MessageCircle, label: "WhatsApp Us", href: getWhatsAppUrl(), external: true },
              { icon: Mail, label: CONTACT_INFO.emailCapitalized, href: getEmailUrl(), external: false },
            ].map((c, i) => (
              <a
                key={i}
                href={c.href}
                target={c.external ? "_blank" : undefined}
                rel={c.external ? "noopener noreferrer" : undefined}
                className="flex items-center gap-3 transition-all duration-300 hover:-translate-y-0.5 group"
                style={{ color: "rgba(255,255,255,0.85)" }}
              >
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center transition-all"
                  style={{ background: "rgba(200,167,102,0.12)", border: "1px solid rgba(200,167,102,0.3)" }}
                >
                  <c.icon className="w-5 h-5" style={{ color: "#E8D5A8" }} />
                </div>
                <span className="text-sm md:text-base">{c.label}</span>
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* === ZONE 5 — Legal === */}
      <div className="relative px-4 sm:px-6 md:px-8 pb-12">
        <div
          className="max-w-6xl mx-auto rounded-2xl p-6 md:p-10 text-center"
          style={{
            background: "linear-gradient(180deg, rgba(255,255,255,0.035) 0%, rgba(255,255,255,0.01) 100%)",
            border: "1px solid rgba(200,167,102,0.22)",
          }}
        >
          <h4
            className="font-light text-xl md:text-2xl tracking-[0.2em] uppercase mb-2"
            style={{
              color: "#FFFFFF",
              fontFamily: "'Cormorant Garamond', 'Playfair Display', Georgia, serif",
            }}
          >
            <span style={{ color: "#E8D5A8" }}>✦</span> Legal Disclaimer{" "}
            <span style={{ color: "#E8D5A8" }}>✦</span>
          </h4>
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-8 h-px" style={{ background: "linear-gradient(90deg, transparent, #C8A766)" }} />
            <div className="w-8 h-px" style={{ background: "linear-gradient(90deg, #C8A766, transparent)" }} />
          </div>

          <p className="text-xs sm:text-sm md:text-base leading-relaxed mb-4 max-w-3xl mx-auto" style={{ color: "rgba(255,255,255,0.78)" }}>
            <span className="font-semibold" style={{ color: "#FFFFFF" }}>JBJ Global Real Estate</span> is a Dubai mainland real estate brokerage licensed for Buy, Sell, and Rent transactions across the UAE.
            For legal, mortgage, visa, and corporate support, we can introduce you to independent, licensed partners.
            Clients contract directly with partners under the partner's own terms and licence.
          </p>

          <p className="text-[11px] sm:text-xs md:text-sm leading-relaxed mb-3 max-w-3xl mx-auto" style={{ color: "rgba(255,255,255,0.7)" }}>
            Licensed Real Estate Brokerage — Buy, Sell, Rent (Dubai Mainland). Operated by{" "}
            <Link to="/about" className="font-semibold hover:underline" style={{ color: "#E8D5A8" }}>JBJ Global Real Estate L.L.C S.O.C.</Link>
            <FounderContent fallback={null}>
              {" "}Owned & led by{" "}
              <Link to="/founder" className="font-semibold hover:underline" style={{ color: "#E8D5A8" }}>Jane Bou Jaoude (جاين بو جودة)</Link>, Founder & CEO.
            </FounderContent>
          </p>

          <p className="text-[11px] sm:text-xs md:text-sm leading-relaxed mb-3 max-w-3xl mx-auto" dir="rtl" style={{ color: "rgba(255,255,255,0.7)" }}>
            جي بي جي للعقارات هي وساطة عقارية مرخصة في دبي للبيع والشراء والإيجار. للخدمات القانونية أو التمويل العقاري أو التأشيرات أو الخدمات المؤسسية، يمكننا ربطك بشركاء مستقلين ومرخصين. يتم التعاقد مباشرة بين العميل والشريك وفق ترخيصه وشروطه الخاصة.
          </p>

          <p className="text-[11px] sm:text-xs md:text-sm leading-relaxed mb-3 max-w-3xl mx-auto" dir="rtl" style={{ color: "rgba(255,255,255,0.7)" }}>
            وساطة عقارية مرخصة للبيع والشراء والإيجار في دبي (البر الرئيسي). يتم تشغيل الموقع من قبل JBJ Global Real Estate L.L.C S.O.C.
          </p>

          <p className="text-[11px] sm:text-xs md:text-sm leading-relaxed mb-6 max-w-3xl mx-auto" style={{ color: "rgba(255,255,255,0.7)" }}>
            All website content, branding, designs, and software are protected intellectual property of
            <FounderContent fallback={<Link to="/about" className="font-semibold hover:underline" style={{ color: "#E8D5A8" }}> JBJ Global Real Estate</Link>}>
              <Link to="/founder" className="font-semibold hover:underline" style={{ color: "#E8D5A8" }}> Jane Bou Jaoude (جاين بو جودة)</Link> and{" "}
              <Link to="/about" className="font-semibold hover:underline" style={{ color: "#E8D5A8" }}>JBJ Global Real Estate</Link>
            </FounderContent>. Unauthorized copying, reuse, mirroring, or reproduction is prohibited.
          </p>

          <div className="flex items-center justify-center">
            <div
              className="px-6 md:px-8 py-3 md:py-4 rounded-xl"
              style={{
                background: "linear-gradient(135deg, rgba(200,167,102,0.18) 0%, rgba(200,167,102,0.08) 100%)",
                border: "1px solid rgba(200,167,102,0.4)",
                boxShadow: "0 8px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)",
              }}
            >
              <span className="font-medium tracking-[0.18em] text-xs sm:text-sm md:text-base uppercase" style={{ color: "#FFFFFF" }}>
                JBJ Global Real Estate &nbsp;<span style={{ color: "#E8D5A8" }}>|</span>&nbsp; All Rights Reserved &nbsp;<span style={{ color: "#E8D5A8" }}>|</span>&nbsp; © {currentYear}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom gold hairline */}
      <div
        className="h-px w-full"
        style={{ background: "linear-gradient(90deg, transparent, rgba(200,167,102,0.6), transparent)" }}
      />
    </footer>
  );
};

export default Footer;
