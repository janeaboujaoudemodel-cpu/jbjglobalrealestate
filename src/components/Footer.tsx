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
import jbjMonogramLightTransparent from "@/assets/jbj-monogram-light-transparent.png";
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

// Removed: AI_TOOL_COLORS and CREATIVE_TOOL_COLORS maps (no longer needed with card layout)

/** Reusable footer navigation card with centered gold title and 2-column link grid */
const FooterCard = ({ title, links, viewAllHref, viewAllLabel }: {
  title: string;
  links: { label: string; href: string }[];
  viewAllHref?: string;
  viewAllLabel?: string;
}) => (
  <div className="group relative bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/40 rounded-xl px-6 py-5 hover:border-gold/60 transition-all duration-300 shadow-[0_4px_15px_rgba(200,167,102,0.1)] hover:shadow-[0_6px_20px_rgba(200,167,102,0.2)]">
    <h4 className="text-center font-bold text-sm sm:text-base md:text-lg uppercase tracking-[0.15em] mb-3 pb-2.5 border-b-2 border-gold/40 text-gold"
      style={{
        fontFamily: "Poppins, sans-serif",
        textShadow: '0 1px 3px rgba(200,167,102,0.4)',
      }}
    >{title}</h4>
    <div className="relative">
      {/* Gold vertical divider between columns — hidden on single-column */}
      <div className="hidden min-[375px]:block absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-gold/10 via-gold/50 to-gold/10 -translate-x-1/2" />
      <div className="grid grid-cols-1 min-[375px]:grid-cols-2 gap-x-5 gap-y-2">
        {links.map((link) => (
          <Link key={link.href} to={link.href} className="text-zinc-700 hover:text-gold transition-all duration-300 text-xs sm:text-sm inline-block hover:translate-x-1">
            {link.label}
          </Link>
        ))}
      </div>
    </div>
    {viewAllHref && (
      <Link to={viewAllHref} className="block text-center mt-3.5 pt-2.5 border-t-2 border-gold/40 text-gold text-xs sm:text-sm font-semibold hover:text-gold/80 transition-colors">
        {viewAllLabel}
      </Link>
    )}
  </div>
);

const DivisionAccordion = ({
  title,
  items,
  href,
}: {
  title: string;
  items: { label: string; href: string }[];
  href?: string;
}) => {
  const [isOpen, setIsOpen] = useState(false);

  if (items.length === 0 && href) {
    return (
      <Link 
        to={href}
        className="flex items-center gap-2 text-white hover:text-gold transition-colors text-base justify-center md:justify-start"
      >
        {title}
      </Link>
    );
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="flex items-center gap-2 text-white hover:text-gold transition-colors text-base w-full justify-center md:justify-start group">
        {title}
        <ChevronDown
          className={`w-4 h-4 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        />
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-2 space-y-2 pl-4 border-l border-zinc-800">
        {items.map((item) => (
          <Link
            key={item.label}
            to={item.href}
            className="block text-zinc-400 hover:text-gold transition-colors text-sm"
          >
            {item.label}
          </Link>
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
};

/** Currency & Unit switcher for footer - Premium dropdown style */
const FooterCurrencyUnit = () => {
  const [activeCurrency, setActiveCurrency] = useState<string>(() =>
    typeof window !== 'undefined' ? localStorage.getItem('jj_currency') || 'AED' : 'AED'
  );
  const [areaUnit, setAreaUnit] = useState<string>(() =>
    typeof window !== 'undefined' ? localStorage.getItem('jj_area_unit') || 'sqft' : 'sqft'
  );
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const [unitOpen, setUnitOpen] = useState(false);

  useEffect(() => {
    const onCurrency = (e: Event) => setActiveCurrency((e as CustomEvent).detail);
    const onUnit = (e: Event) => setAreaUnit((e as CustomEvent).detail);
    window.addEventListener('currencyChange', onCurrency);
    window.addEventListener('areaUnitChange', onUnit);
    return () => {
      window.removeEventListener('currencyChange', onCurrency);
      window.removeEventListener('areaUnitChange', onUnit);
    };
  }, []);

  const handleCurrency = (code: string) => {
    setActiveCurrency(code);
    localStorage.setItem('jj_currency', code);
    window.dispatchEvent(new CustomEvent('currencyChange', { detail: code }));
    setCurrencyOpen(false);
  };
  const handleUnit = (unit: string) => {
    setAreaUnit(unit);
    localStorage.setItem('jj_area_unit', unit);
    window.dispatchEvent(new CustomEvent('areaUnitChange', { detail: unit }));
    setUnitOpen(false);
  };

  const currentCur = SUPPORTED_CURRENCIES.find(c => c.code === activeCurrency);

  return (
    <div className="mt-6 flex flex-col items-center gap-3">
      <p className="text-gold/60 text-xs uppercase tracking-[0.15em]">Currency & Unit</p>
      <div className="flex items-center gap-3">
        {/* Currency Dropdown */}
        <div className="relative">
          <button
            onClick={() => { setCurrencyOpen(!currencyOpen); setUnitOpen(false); }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-gold/40 bg-gradient-to-br from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] text-black text-sm font-semibold transition-all hover:border-gold"
            style={{
              boxShadow: '0 6px 20px rgba(200,167,102,0.3), inset 0 1px 3px rgba(255,255,255,0.7), inset 0 -1px 3px rgba(200,167,102,0.2)',
            }}
          >
            <span>{currentCur?.flag} {activeCurrency}</span>
            <ChevronDown className={cn("w-4 h-4 text-gold transition-transform", currencyOpen && "rotate-180")} />
          </button>
          {currencyOpen && (
            <div 
              className="absolute bottom-full mb-2 left-0 w-52 rounded-xl border-2 border-gold/40 bg-gradient-to-br from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] overflow-hidden z-50 max-h-80 overflow-y-auto"
              style={{
                boxShadow: '0 10px 30px rgba(200,167,102,0.4), 0 6px 15px rgba(0,0,0,0.2)',
              }}
            >
              {SUPPORTED_CURRENCIES.map((cur) => (
                <button
                  key={cur.code}
                  onClick={() => handleCurrency(cur.code)}
                  className={cn(
                    "w-full flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors text-left",
                    activeCurrency === cur.code
                      ? "bg-gold/30 text-black font-bold"
                      : "text-black/80 hover:bg-gold/15"
                  )}
                >
                  <span>{cur.flag}</span>
                  <span>{cur.code}</span>
                  <span className="text-black/50 text-xs ml-auto">{cur.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Vertical gold divider */}
        <div className="w-px h-8 bg-gradient-to-b from-transparent via-gold/40 to-transparent" />

        {/* Area Unit Inline Toggle */}
        <div className="flex rounded-xl border-2 border-gold/40 overflow-hidden"
          style={{
            boxShadow: '0 6px 20px rgba(200,167,102,0.3), inset 0 1px 3px rgba(255,255,255,0.7), inset 0 -1px 3px rgba(200,167,102,0.2)',
          }}
        >
          {(['sqft', 'sqm'] as const).map((unit) => (
            <button
              key={unit}
              onClick={() => handleUnit(unit)}
              className={cn(
                "px-4 py-2.5 text-sm font-semibold transition-all",
                areaUnit === unit
                  ? "bg-gradient-to-br from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] text-black"
                  : "bg-[#F5EBD7]/40 text-black/50 hover:bg-[#F5EBD7]/70 hover:text-black/80"
              )}
            >
              {unit === 'sqft' ? 'sq ft' : 'sq m'}
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
  const { isBrokerMode, isInvestorMode, isCombinedMode } = useUserModeContext();
  const currentYear = new Date().getFullYear();
  const location = useLocation();

  // Hide NewsletterBand in back-office contexts
  const isBackOfficeContext = location.pathname.startsWith('/listing-admin') || location.pathname.startsWith('/admin');

  // Properties
  const propertiesLinks = [
    { label: t('footer.buyProperties') || "Buy Properties", href: "/properties?transaction=buy" },
    { label: t('footer.rentProperties') || "Rent Properties", href: "/properties?transaction=rent" },
    { label: "Projects", href: "/properties" },
    { label: "Developers", href: "/developers" },
    { label: t('footer.listYourProperty') || "List Your Property", href: "/listing-portal" },
    { label: "Communities", href: "/communities" },
    { label: "Resale Properties", href: "/properties?transaction=resale" },
    { label: "Property Map", href: "/map" },
    { label: "Property Evaluator", href: "/property-evaluator" },
    { label: "Rental Index", href: "/rental-index" },
    { label: "Property Measurement", href: "/calculator/measurement" },
  ];

  // Sell
  const sellLinks = [
    { label: "Sell Your Property", href: "/listing-portal" },
    { label: t('footer.sellerGuide') || "Seller's Guide", href: "/seller-guide" },
    { label: "Property Valuation", href: "/sell/valuation" },
    { label: "Selling Advisory", href: "/services/selling-advisory" },
  ];

  // Services
  const servicesLinks = [
    { label: "Explore All Services", href: "/services" },
    { label: t('footer.buyerAdvisory') || "Buyer Advisory", href: "/services/buying-advisory" },
    { label: t('footer.sellerAdvisory') || "Seller Advisory", href: "/services/selling-advisory" },
    { label: t('footer.leasingAdvisory') || "Leasing Advisory", href: "/services/leasing-advisory" },
    { label: t('footer.investmentAdvisory') || "Investment Advisory", href: "/services/investment-advisory" },
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
    { label: "Design & Build", href: "/services/design-and-build" },
    { label: "Law Firm", href: "/services/law-firm" },
    { label: "Broker Certification", href: "/services/broker-certification" },
    { label: "Complaint Procedures", href: "/services/complaint-procedures" },
    { label: "Testimonials", href: "/reviews" },
    { label: "Referral Partner", href: "/services/referral-partner" },
    { label: "Signature Collection", href: "/services/signature-collection" },
  ];

  // Investor Hub - Always visible
  const investorHubLinks = [
    { label: "Investor Hub", href: "/investor/portfolio-views" },
    { label: "Investor Services", href: "/services/investment-advisory" },
    { label: "Join Investor List", href: "/investor/join" },
    { label: t('footer.investorEducation') || "Investor Education", href: "/investor-education" },
    { label: t('footer.investorFaqs') || "Investor FAQs", href: "/investor-faq" },
    { label: t('footer.investorTools') || "Investor Tools", href: "/ai-hub" },
    { label: "Investor Dashboard", href: "/investor-dashboard" },
    { label: "Portfolio Views", href: "/investor-dashboard/portfolio" },
  ];

  // Guides
  const guidesLinks = [
    { label: t('footer.buyerGuide') || "Buyer Guide", href: "/buyer-guide" },
    { label: t('footer.sellerGuide') || "Seller Guide", href: "/seller-guide" },
    { label: t('footer.landlordGuide') || "Landlord Guide", href: "/landlord-guide" },
    { label: t('footer.tenantGuide') || "Tenant Guide", href: "/tenant-guide" },
    { label: t('footer.areaGuides') || "Area Guides", href: "/areas" },
    { label: "Golden Visa Guide", href: "/guides/golden-visa-uae" },
    { label: "Buyer FAQs", href: "/buyer-faq" },
    { label: "Seller FAQs", href: "/seller-faq" },
    { label: "Landlord FAQs", href: "/landlord-faq" },
    { label: "Tenant FAQs", href: "/tenant-faq" },
    { label: t('footer.generalFaqs') || "General FAQs", href: "/faq" },
    { label: "Broker FAQs", href: "/broker-faq" },
    { label: "Investor FAQs", href: "/investor-faq" },
    { label: "Broker Education", href: "/broker-education" },
    { label: "Books Library", href: "/education-hub" },
  ];

  // Market Intelligence
  const marketIntelLinks = [
    { label: t('footer.marketOverview') || "Market Overview", href: "/market-intelligence/overview" },
    { label: t('footer.areaIntelligence') || "Area Intelligence", href: "/market-intelligence/areas" },
    { label: t('footer.marketReports') || "Market Reports", href: "/market-intelligence/reports" },
    { label: t('footer.methodology') || "Methodology & Data Sources", href: "/market-intelligence/methodology" },
  ];

  // About & Careers
  const aboutLinks = [
    { label: t('footer.aboutJbj') || "About JBJ", href: "/about" },
    ...(isFounderVisible ? [{ label: t('footer.founderLeadership') || "Founder & Leadership", href: "/founder" }] : []),
    { label: t('footer.meetTheTeam') || "Meet the Team", href: "/team" },
    { label: t('footer.awardsRecognition') || "Awards & Recognition", href: "/awards" },
    { label: t('footer.newsInsights') || "News & Insights", href: "/news" },
    { label: "Press Kit", href: "/press-kit" },
    { label: "Company Profile", href: "/company-profile" },
    { label: "Philanthropy", href: "/philanthropy" },
    { label: "Reviews", href: "/reviews" },
    { label: "Our Brokers", href: "/our-brokers" },
    { label: "Partner Governance", href: "/partner-governance" },
  ];

  // Career Links
  const careerLinks = [
    { href: "/join", label: t('footer.applyJoin') || "Apply to Join Our Team" },
    { href: "/hr-agent", label: "Connect with Our HR" },
  ];

  // Broker & Academy
  const brokerAcademyLinks = [
    { href: "/broker-toolkit", label: "Broker Portal" },
    { href: "/onboarding", label: "JBJ Academy" },
    { href: "/academy-graduates", label: "Academy Graduates" },
    { href: "/broker-education", label: "Broker Education" },
    { href: "/broker-resources", label: "Broker Resources" },
    { href: "/listing-portal", label: "Listing Portal" },
    { href: "/broker/training", label: "Broker Training" },
    { href: "/broker-hub", label: "Broker Hub" },
    { href: "/broker-dashboard", label: "Broker Dashboard" },
    { href: "/ai-broker-workspace", label: "AI Broker Workspace" },
  ];

  // Partners
  const partnersLinks = [
    { href: "/services/mortgage", label: "Mortgage" },
    { href: "/services/law-firm", label: "Legal" },
    { href: "/services/company-setup", label: "Company Setup" },
    { href: "/services/visa", label: "Visa Services" },
    { href: "/partner-governance", label: "Partners Hub" },
  ];

  // Legal Links
  const legalLinks = [
    { label: "Terms of Service", href: "/terms" },
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Cookie Policy", href: "/cookies" },
    { label: "Disclaimers", href: "/disclaimers" },
    { label: "Intellectual Property", href: "/intellectual-property" },
    { label: "AML & KYC Policy", href: "/aml-kyc" },
    { label: "Accessibility", href: "/accessibility" },
    { label: "Risk Disclosure", href: "/risk-disclosure" },
    { label: "Trust & Audit", href: "/trust-and-audit-center" },
  ];

  // Creative Toolkit
  const creativeToolkitLinks = [
    { href: "/toolkit", label: "AI Tools Hub" },
    { href: "/toolkit/ai-video-studio", label: "AI Video Studio" },
    { href: "/toolkit/video-resize-pack", label: "Video Resize Pack" },
    { href: "/toolkit/voice-studio", label: "Voice Studio" },
    { href: "/toolkit/pdf-from-photos", label: "Photo to PDF" },
    { href: "/toolkit/image-resize", label: "Image Resizer" },
    { href: "/toolkit/captions-translate", label: "Captions & Translate" },
    { href: "/toolkit/background-ai", label: "Background Remover" },
    { href: "/toolkit/beauty-filters", label: "Beauty Filters" },
    { href: "/toolkit/stamp-generator", label: "AI Stamp Generator" },
    { href: "/toolkit/scan-sign", label: "Scan & Sign" },
    { href: "/e-signature", label: "JBJ E-Sign" },
    { href: "/studio", label: "Creative Suite" },
  ];

  // Business Suites
  const businessSuitesLinks = [
    { href: "/business-suite/all", label: "All Tools Suite" },
    { href: "/business-suite/real-estate", label: "Real Estate Suite" },
    { href: "/business-suite/broker", label: "Broker Intelligence Suite" },
    { href: "/business-suite/creative", label: "Creative & Communication" },
    { href: "/business-suite/productivity", label: "Productivity Suite" },
  ];

  // Productivity Tools
  const productivityLinks = [
    { href: "/spreadsheet", label: "Spreadsheet" },
    { href: "/documents", label: "Documents" },
    { href: "/toolkit/corporate-suite/qr-generator", label: "QR Generator" },
    { href: "/video-meeting", label: "Video Meeting" },
    { href: "/presentations", label: "Presentations" },
    { href: "/e-signature", label: "E-Signature" },
    { href: "/meeting-center", label: "Meeting Center" },
    { href: "/contract-forms", label: "Contract Forms" },
    { href: "/pricing", label: "Pricing" },
    { href: "/onboarding", label: "Onboarding" },
    { href: "/client-portal", label: "Client Portal" },
  ];

  // Professional Tools
  const professionalTools = [
    { href: "/compare", label: "Property Comparison" },
    { href: "/property-evaluator", label: "JBJ Property Evaluator" },
    { href: "/rental-index", label: "JBJ Rental Index" },
    { href: "/mortgage-calculator", label: "Mortgage Calculator" },
    { href: "/quiz", label: "AI Home Finder" },
    { href: "/interior-design-ai", label: "AI Interior Design" },
    { href: "/virtual-staging-ai", label: "AI Virtual Staging" },
    { href: "/ai-price-predictor", label: "AI Price Predictor" },
    { href: "/ai-neighborhood-insights", label: "AI Neighborhood Insights" },
    { href: "/ai-property-analyzer", label: "AI Property Analyzer" },
    { href: "/ai-lead-qualification", label: "AI Lead Qualification" },
    { href: "/ai-follow-up-scheduler", label: "AI Follow-up Scheduler" },
    { href: "/ai-objection-handler", label: "AI Objection Handler" },
    { href: "/ai-client-matcher", label: "AI Client Matcher" },
    { href: "/ai-market-report", label: "AI Market Report" },
    { href: "/ai-competitor-analysis", label: "AI Competitor Analysis" },
    { href: "/ai-roi-calculator", label: "AI ROI Calculator" },
    { href: "/ai-investment-report", label: "AI Investment Report" },
    { href: "/ai-meeting-summarizer", label: "AI Meeting Summarizer" },
    { href: "/ai-translation-hub", label: "AI Translation Hub" },
    { href: "/ai-video-tour-script", label: "AI Video Tour Script" },
    { href: "/ai-email-generator", label: "AI Email Generator" },
    { href: "/ai-social-media", label: "AI Social Media" },
    { href: "/ai-description-writer", label: "AI Description Writer" },
    { href: "/ai-contract-reviewer", label: "AI Contract Reviewer" },
    { href: "/ai-document-generator", label: "AI Document Generator" },
    { href: "/business-card-scanner", label: "Business Card Scanner" },
    { href: "/whiteboard", label: "Whiteboard" },
    { href: "/mind-map", label: "Mind Map" },
    { href: "/form-builder", label: "Form Builder" },
    { href: "/kanban-board", label: "Kanban Board" },
    { href: "/digital-card", label: "Digital Card" },
    { href: "/ai-hub", label: "AI Hub" },
    { href: "/sitemap", label: "Sitemap" },
  ];

  // Education Hub - Link to /guides (contains all books, market reports, guides)
  const educationHubLink = { href: "/education-hub", label: "Education Hub" };

  return (
    <>
      <footer id="site-footer" className="relative overflow-x-hidden bg-black">
      {/* Pure black background - no gradients */}
      <div className="absolute inset-0 bg-black" />
      
      {/* Premium Gold Divider at top - 3D layered effect with symmetric spacing */}
      <div className="relative py-8 sm:py-10 md:py-12">
        <div className="w-full max-w-4xl mx-auto px-8">
          <div className="h-[3px] bg-gradient-to-r from-transparent via-gold to-transparent" />
          <div className="h-[2px] bg-gradient-to-r from-transparent via-gold/60 to-transparent mt-[1px]" />
          <div className="h-[1px] bg-gradient-to-r from-transparent via-gold/30 to-transparent mt-[1px]" />
        </div>
      </div>
      
      {/* Full-width footer content */}
      <div className="relative w-full pt-0 pb-8 sm:pb-12 md:pb-16 lg:pb-20 px-1 sm:px-2 md:px-3 lg:px-4 bg-black">
        {/* NOW BELOW THE 3D CARD: Logo + Company Name Section - COMES FIRST */}
        <div className="flex flex-col items-center justify-center text-center w-full max-w-7xl mx-auto relative bg-black pt-4 pb-8">
          {/* Pure black background */}
          <div className="absolute inset-0 bg-black pointer-events-none" />
          
          <Link to="/" className="inline-block group relative">
            {/* 3D Logo with multi-layer shadow depth */}
            <div className="relative transform-gpu transition-all duration-700 group-hover:scale-[1.03] group-hover:-translate-y-1">
              {/* Deep shadow layer 3 - furthest */}
              <img 
                src={jbjMonogramLightTransparent} 
                alt="" 
                aria-hidden="true"
                className="absolute h-48 sm:h-60 md:h-72 lg:h-80 w-auto object-contain mx-auto opacity-[0.08] blur-[3px] translate-y-4 translate-x-2 pointer-events-none"
              />
              {/* Shadow layer 2 */}
              <img 
                src={jbjMonogramLightTransparent} 
                alt="" 
                aria-hidden="true"
                className="absolute h-48 sm:h-60 md:h-72 lg:h-80 w-auto object-contain mx-auto opacity-[0.12] blur-[2px] translate-y-2 translate-x-1 pointer-events-none"
              />
              {/* Shadow layer 1 - closest */}
              <img 
                src={jbjMonogramLightTransparent} 
                alt="" 
                aria-hidden="true"
                className="absolute h-48 sm:h-60 md:h-72 lg:h-80 w-auto object-contain mx-auto opacity-[0.15] blur-[1px] translate-y-1 translate-x-0.5 pointer-events-none"
              />
              {/* Main logo with subtle lift */}
              <img 
                src={jbjMonogramLightTransparent} 
                alt="JBJ Global Real Estate" 
                className="relative h-48 sm:h-60 md:h-72 lg:h-80 w-auto object-contain mx-auto mb-4 sm:mb-6 drop-shadow-[0_6px_12px_rgba(0,0,0,0.8)] transition-all duration-500 group-hover:drop-shadow-[0_12px_24px_rgba(0,0,0,0.9)]"
              />
            </div>
          </Link>
          
          {/* Company Name with Enhanced Readability */}
          <h2 
            className="relative text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-semibold tracking-[0.08em] sm:tracking-[0.12em] md:tracking-[0.15em] lg:tracking-[0.18em] mb-2 sm:mb-3 md:mb-4 px-2 transition-all duration-500 hover:scale-[1.01]"
            style={{
              color: '#FFFFFF',
              textShadow: '0 2px 4px rgba(0,0,0,0.9), 0 4px 8px rgba(0,0,0,0.7), 0 0 30px rgba(200,167,102,0.4)',
              letterSpacing: '0.12em',
            }}
          >
            JBJ GLOBAL REAL ESTATE
          </h2>
          
          {/* Tagline with Premium Gold Styling */}
          <p 
            className="relative text-sm sm:text-base md:text-lg tracking-[0.15em] sm:tracking-[0.2em] uppercase font-semibold transition-all duration-500 px-4 py-2"
            style={{
              background: 'linear-gradient(135deg, #D4AF37 0%, #F5E6C8 30%, #E8D5A3 50%, #F5E6C8 70%, #D4AF37 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              filter: 'drop-shadow(0 2px 8px rgba(200,167,102,0.6))',
            }}
          >
            Excellence in Real Estate
          </p>
        </div>

        {/* ULTRA PREMIUM 3D Card - License + Newsletter + Social - BELOW logo */}
        <div className="relative bg-black pt-4 sm:pt-6 md:pt-8 pb-4">
          <div 
            className="w-full max-w-7xl mx-auto rounded-2xl sm:rounded-3xl relative overflow-hidden"
            style={{
              background: 'linear-gradient(165deg, rgba(12,12,14,0.99) 0%, rgba(8,8,10,1) 40%, rgba(4,4,6,1) 100%)',
              boxShadow: `
                0 50px 100px -30px rgba(0,0,0,0.98),
                0 30px 60px -20px rgba(0,0,0,0.9),
                0 0 0 2px rgba(200,167,102,0.5),
                0 0 40px rgba(200,167,102,0.15),
                inset 0 1px 0 rgba(200,167,102,0.15),
                inset 0 -1px 0 rgba(0,0,0,0.8)
              `,
            }}
          >
            {/* Outer Gold Border Ring */}
            <div className="absolute inset-0 rounded-2xl sm:rounded-3xl border-2 border-gold/50 pointer-events-none" />
            <div className="absolute inset-[3px] rounded-2xl sm:rounded-3xl border border-gold/25 pointer-events-none" />
            
            {/* Animated Shimmer Sweep */}
            <div 
              className="absolute inset-0 rounded-2xl sm:rounded-3xl pointer-events-none opacity-60"
              style={{
                background: 'linear-gradient(110deg, transparent 20%, rgba(200,167,102,0.08) 40%, rgba(245,230,200,0.15) 50%, rgba(200,167,102,0.08) 60%, transparent 80%)',
                backgroundSize: '250% 100%',
                animation: 'shimmer 6s ease-in-out infinite',
              }}
            />
          
          {/* Premium Gold Corner Accents - BOLD */}
          <div className="absolute top-0 left-0 w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 pointer-events-none">
            <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-gold via-gold/80 to-transparent rounded-tl-2xl sm:rounded-tl-3xl" />
            <div className="absolute top-0 left-0 h-full w-[3px] bg-gradient-to-b from-gold via-gold/80 to-transparent rounded-tl-2xl sm:rounded-tl-3xl" />
          </div>
          <div className="absolute top-0 right-0 w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 pointer-events-none">
            <div className="absolute top-0 right-0 w-full h-[3px] bg-gradient-to-l from-gold via-gold/80 to-transparent rounded-tr-2xl sm:rounded-tr-3xl" />
            <div className="absolute top-0 right-0 h-full w-[3px] bg-gradient-to-b from-gold via-gold/80 to-transparent rounded-tr-2xl sm:rounded-tr-3xl" />
          </div>
          <div className="absolute bottom-0 left-0 w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 pointer-events-none">
            <div className="absolute bottom-0 left-0 w-full h-[3px] bg-gradient-to-r from-gold via-gold/80 to-transparent rounded-bl-2xl sm:rounded-bl-3xl" />
            <div className="absolute bottom-0 left-0 h-full w-[3px] bg-gradient-to-t from-gold via-gold/80 to-transparent rounded-bl-2xl sm:rounded-bl-3xl" />
          </div>
          <div className="absolute bottom-0 right-0 w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 pointer-events-none">
            <div className="absolute bottom-0 right-0 w-full h-[3px] bg-gradient-to-l from-gold via-gold/80 to-transparent rounded-br-2xl sm:rounded-br-3xl" />
            <div className="absolute bottom-0 right-0 h-full w-[3px] bg-gradient-to-t from-gold via-gold/80 to-transparent rounded-br-2xl sm:rounded-br-3xl" />
          </div>
          
          {/* Inner Content Container with padding */}
          <div className="relative p-5 sm:p-8 md:p-10 lg:p-12">
            {/* Decorative Top Emblem */}
            <div className="flex justify-center mb-4 sm:mb-6">
              <div 
                className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-xl sm:rounded-2xl flex items-center justify-center relative"
                style={{
                  background: 'linear-gradient(145deg, rgba(200,167,102,0.2) 0%, rgba(200,167,102,0.08) 100%)',
                  boxShadow: '0 8px 32px -8px rgba(200,167,102,0.4), inset 0 1px 0 rgba(255,255,255,0.15), inset 0 -1px 0 rgba(0,0,0,0.2)',
                  border: '1px solid rgba(200,167,102,0.4)',
                }}
              >
                <div className="absolute inset-0 rounded-xl sm:rounded-2xl bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
                <span 
                  className="text-2xl sm:text-3xl md:text-4xl font-bold relative"
                  style={{
                    background: 'linear-gradient(135deg, #D4AF37 0%, #F5E6C8 40%, #D4AF37 60%, #C8A766 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    filter: 'drop-shadow(0 2px 4px rgba(200,167,102,0.5))',
                  }}
                >✦</span>
              </div>
            </div>
            
            {/* Licensed Badge - ULTRA Enhanced */}
            <div className="relative flex items-center justify-center gap-2 sm:gap-3 md:gap-4 mb-3 sm:mb-4 md:mb-5 flex-wrap px-1">
              <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-3.5 md:h-3.5 bg-gradient-to-br from-gold via-gold/90 to-gold/60 rounded-full animate-pulse shadow-[0_0_20px_rgba(200,167,102,0.7),0_0_40px_rgba(200,167,102,0.3)]" />
              <p className="text-white font-medium text-sm sm:text-base md:text-lg lg:text-xl tracking-wide text-center leading-relaxed">
                <span 
                  className="font-bold"
                  style={{
                    background: 'linear-gradient(135deg, #D4AF37 0%, #F5E6C8 30%, #E8D5A3 50%, #F5E6C8 70%, #D4AF37 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    filter: 'drop-shadow(0 0 10px rgba(200,167,102,0.5))',
                  }}
                >Licensed</span> 
                <span className="text-gold/60 mx-1 sm:mx-2">✦</span> 
                BUY 
                <span className="text-gold/60 mx-1 sm:mx-2">✦</span> 
                SELL 
                <span className="text-gold/60 mx-1 sm:mx-2">✦</span> 
                RENT 
                <span className="text-gold/60 mx-1 sm:mx-2">✦</span> 
                <span className="font-bold">REAL ESTATE</span> In The 
                <span 
                  className="font-bold ml-1"
                  style={{
                    background: 'linear-gradient(135deg, #D4AF37 0%, #F5E6C8 30%, #E8D5A3 50%, #F5E6C8 70%, #D4AF37 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    filter: 'drop-shadow(0 0 10px rgba(200,167,102,0.5))',
                  }}
                > UAE</span>
              </p>
              <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-3.5 md:h-3.5 bg-gradient-to-br from-gold via-gold/90 to-gold/60 rounded-full animate-pulse shadow-[0_0_20px_rgba(200,167,102,0.7),0_0_40px_rgba(200,167,102,0.3)]" />
            </div>
            <p className="relative text-zinc-400 text-xs sm:text-sm md:text-base mb-6 sm:mb-8 md:mb-10 text-center px-2 max-w-2xl mx-auto">
              Mortgage, legal, visa, and corporate support is provided through independent licensed partners.
            </p>

            {/* Premium Divider with intense glow */}
            <div className="relative h-[2px] mb-6 sm:mb-8 md:mb-10 max-w-lg mx-auto">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gold to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gold/50 to-transparent blur-md" />
              <div className="absolute -inset-1 bg-gradient-to-r from-transparent via-gold/20 to-transparent blur-xl" />
            </div>

            {/* Stay in the Loop - Newsletter inside the 3D card */}
            {!isBackOfficeContext && (
              <div className="relative mb-6 sm:mb-8 md:mb-10 px-2 sm:px-4">
                <div className="bg-gradient-to-br from-champagne-light via-champagne to-champagne-dark rounded-2xl border border-gold/30 shadow-[0_0_40px_rgba(200,167,102,0.18)] p-6 md:p-8">
                  {/* Premium Title */}
                  <h3 
                    className="text-center text-2xl md:text-3xl font-bold mb-3 uppercase tracking-[0.15em]"
                    style={{
                      fontFamily: "Poppins, sans-serif",
                      background: 'linear-gradient(135deg, #1a1a1a 0%, #333333 30%, #D4AF37 50%, #333333 70%, #1a1a1a 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }}
                  >
                    ✦ Stay in the Loop ✦
                  </h3>
                  <p className="text-center text-zinc-600 text-sm md:text-base mb-6 max-w-xl mx-auto">
                    Be the first to access new listings, market updates, and personalized brokerage guidance.
                  </p>
                  <div className="max-w-lg mx-auto">
                    <NewsletterBrevo variant="compact" source="footer_licensed_card" />
                  </div>
                </div>
              </div>
            )}

            {/* Divider before social links */}
            <div className="relative h-[2px] mb-6 sm:mb-8 md:mb-10 max-w-lg mx-auto">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gold to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gold/50 to-transparent blur-md" />
            </div>

            {/* Social Links with enhanced container */}
            <div className="relative flex flex-col items-center gap-4">
              {/* Connect With Us Label */}
              <p className="text-gold/80 text-sm uppercase tracking-[0.2em] font-medium">
                Connect With Us
              </p>
              <div 
                className="px-6 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl"
                style={{
                  background: 'linear-gradient(145deg, rgba(12,12,14,0.95) 0%, rgba(6,6,8,1) 100%)',
                  boxShadow: 'inset 0 1px 0 rgba(200,167,102,0.1), inset 0 -1px 0 rgba(0,0,0,0.4)',
                  border: '1px solid rgba(200,167,102,0.3)',
                }}
              >
                <SocialLinks variant="glow" iconClassName="w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9" />
              </div>
              
              {/* Google My Business - Relocated here */}
              <GoogleMyBusinessLink />
              
              {/* Mode Switcher - Allow users to switch modes from footer with themed styling */}
              <div className="mt-4 flex flex-col items-center gap-2">
                <p className="text-gold/60 text-xs uppercase tracking-[0.15em]">Your Mode</p>
              <div className="p-1 rounded-xl bg-black/40">
                <ModeSwitcher variant="header" showForUnselected={true} />
              </div>
              </div>
              
              {/* Currency & Unit Switcher */}
              <FooterCurrencyUnit />
            </div>
          </div>
          
          {/* Bottom Radial Glow */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-24 bg-gradient-to-t from-gold/8 to-transparent blur-2xl pointer-events-none" />
        </div>
        </div>

        {/* Premium Divider with glow - on pure black */}
        <div className="relative bg-black py-6 flex items-center justify-center">
          <div className="relative h-[2px] w-full max-w-7xl mx-auto">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gold to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gold/40 to-transparent blur-md" />
          </div>
        </div>

        {/* ZONE 2: ULTRA PREMIUM Navigation + Tools + Contact Block - on pure black */}
        <div className="relative bg-black py-4">
          <div 
            className="w-full max-w-7xl mx-auto rounded-2xl sm:rounded-3xl overflow-hidden relative"
            style={{
              background: 'linear-gradient(165deg, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 40%, rgba(0,0,0,1) 100%)',
              boxShadow: `
                0 50px 100px -30px rgba(0,0,0,0.98),
                0 30px 60px -20px rgba(0,0,0,0.9),
                0 0 0 2px rgba(200,167,102,0.5),
                0 0 40px rgba(200,167,102,0.15),
                inset 0 1px 0 rgba(200,167,102,0.15),
                inset 0 -1px 0 rgba(0,0,0,0.8)
              `,
            }}
          >
            {/* Outer Gold Border Ring - Enhanced */}
            <div className="absolute inset-0 rounded-2xl sm:rounded-3xl border-2 border-gold/50 pointer-events-none" />
            <div className="absolute inset-[3px] rounded-2xl sm:rounded-3xl border border-gold/25 pointer-events-none" />
            
            {/* Animated Shimmer Sweep */}
            <div 
              className="absolute inset-0 rounded-2xl sm:rounded-3xl pointer-events-none opacity-50"
              style={{
                background: 'linear-gradient(110deg, transparent 20%, rgba(200,167,102,0.06) 40%, rgba(245,230,200,0.12) 50%, rgba(200,167,102,0.06) 60%, transparent 80%)',
                backgroundSize: '250% 100%',
                animation: 'shimmer 8s ease-in-out infinite',
              }}
            />
          
          {/* Premium Gold Corner Accents - BOLD with gradients */}
          <div className="absolute top-0 left-0 w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 pointer-events-none">
            <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-gold via-gold/80 to-transparent rounded-tl-2xl sm:rounded-tl-3xl" />
            <div className="absolute top-0 left-0 h-full w-[3px] bg-gradient-to-b from-gold via-gold/80 to-transparent rounded-tl-2xl sm:rounded-tl-3xl" />
          </div>
          <div className="absolute top-0 right-0 w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 pointer-events-none">
            <div className="absolute top-0 right-0 w-full h-[3px] bg-gradient-to-l from-gold via-gold/80 to-transparent rounded-tr-2xl sm:rounded-tr-3xl" />
            <div className="absolute top-0 right-0 h-full w-[3px] bg-gradient-to-b from-gold via-gold/80 to-transparent rounded-tr-2xl sm:rounded-tr-3xl" />
          </div>
          <div className="absolute bottom-0 left-0 w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 pointer-events-none">
            <div className="absolute bottom-0 left-0 w-full h-[3px] bg-gradient-to-r from-gold via-gold/80 to-transparent rounded-bl-2xl sm:rounded-bl-3xl" />
            <div className="absolute bottom-0 left-0 h-full w-[3px] bg-gradient-to-t from-gold via-gold/80 to-transparent rounded-bl-2xl sm:rounded-bl-3xl" />
          </div>
          <div className="absolute bottom-0 right-0 w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 pointer-events-none">
            <div className="absolute bottom-0 right-0 w-full h-[3px] bg-gradient-to-l from-gold via-gold/80 to-transparent rounded-br-2xl sm:rounded-br-3xl" />
            <div className="absolute bottom-0 right-0 h-full w-[3px] bg-gradient-to-t from-gold via-gold/80 to-transparent rounded-br-2xl sm:rounded-br-3xl" />
          </div>
          
          {/* Premium Champagne Inner Layer - Wraps Navigation + Tools + Contact - Fills to gold border */}
          <div className="bg-gradient-to-br from-champagne-light via-champagne to-champagne-dark rounded-2xl border border-gold/30 shadow-[0_0_40px_rgba(200,167,102,0.18)] m-1 overflow-hidden">
            
            {/* Navigation Grid Section - Card-Based 2-Column Layout */}
            <div className="p-4 sm:p-6 md:p-8">
              {/* Merged Navigation Grid: 3 per row desktop, 2 tablet, 1 mobile */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-4 auto-rows-auto">
                <FooterCard title={t('footer.properties') || 'Properties'} links={propertiesLinks} />
                <FooterCard title={t('footer.servicesSection') || 'Services'} links={servicesLinks} />
                <FooterCard title={t('footer.guides') || 'Guides'} links={guidesLinks} />
                <FooterCard title="About & Careers" links={[...aboutLinks, ...careerLinks]} />
                <FooterCard title="Sell" links={sellLinks} />
                <FooterCard title="Investor Hub" links={investorHubLinks} />
                <FooterCard title="Broker & Academy" links={brokerAcademyLinks} />
                <FooterCard title="Partners" links={partnersLinks} />
                <FooterCard title="Legal" links={legalLinks} />
                <FooterCard title="Business Suites" links={businessSuitesLinks} />
                <FooterCard title="Productivity" links={productivityLinks} />
                <FooterCard title="Education Hub" links={[
                  { href: "/broker-education", label: "Books" },
                  { href: "/guides", label: "Guides" },
                  { href: "/market-intelligence/reports", label: "Market Reports" },
                  { href: "/education-hub", label: "Education Hub" },
                ]} />
              </div>

              {/* ROW 2: AI Tools, Creative Toolkit, Market Intelligence */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 auto-rows-auto">
                {/* AI Tools (Top 10 + View All) */}
                <FooterCard title="AI Tools" links={[
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
                ]} viewAllHref="/ai-hub" viewAllLabel="View All 40+ Tools →" />

                {/* Market Intelligence */}
                <FooterCard title="Market Intelligence" links={marketIntelLinks} />

                {/* Creative Suites Hub */}
                <FooterCard title="Creative Suites" links={[
                  { href: "/toolkit/corporate-suite", label: "Corporate Suite" },
                  { href: "/toolkit/property-suite", label: "Real Estate Suite" },
                  { href: "/toolkit/video-suite", label: "Video Suite" },
                  { href: "/toolkit/photo-suite", label: "Photo & Image Suite" },
                  { href: "/toolkit/voice-suite", label: "Voice & Audio Suite" },
                  { href: "/toolkit/pdf-suite", label: "PDF & Documents Suite" },
                  { href: "/toolkit/stamp-generator", label: "AI Stamp Generator" },
                  { href: "/toolkit/corporate-suite/business-card", label: "Business Card" },
                  { href: "/toolkit/corporate-suite/cv-builder", label: "Resume / CV" },
                  { href: "/toolkit/corporate-suite/cover-letter", label: "Cover Letter" },
                  { href: "/e-signature", label: "JBJ E-Sign" },
                  { href: "/toolkit/scan-sign", label: "Scan & Sign" },
                ]} viewAllHref="/toolkit" viewAllLabel="View All Creative Tools →" />
              </div>
            </div>

          {/* Internal Divider */}
          <div className="h-[2px] bg-gradient-to-r from-gold/20 via-gold/80 to-gold/20 mx-6" />

          {/* Contact Section - Premium on Champagne */}
          <div className="p-3 sm:p-5 md:p-8 text-center relative">
            <h4 className="font-bold text-sm sm:text-base md:text-lg uppercase tracking-[0.15em] sm:tracking-[0.2em] mb-3 sm:mb-4 md:mb-5 text-gold">
              Get in Touch
            </h4>
            
            {/* Location with Gold Circle Background */}
            <div className="flex items-center justify-center gap-2 sm:gap-3 text-zinc-700 text-xs sm:text-sm md:text-base mb-3 sm:mb-4 md:mb-5 px-1">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gold/20 flex items-center justify-center flex-shrink-0">
                <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-black" />
              </div>
              <span className="break-words text-center">{CONTACT_INFO.address}</span>
            </div>
            
            {/* Phone, WhatsApp, Email - With Colored Circle Backgrounds */}
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-center sm:gap-6 md:gap-8">
              {/* Phone - Blue */}
              <a
                href={getCallUrl()}
                className="flex items-center justify-center gap-2 sm:gap-3 text-zinc-700 hover:text-blue-600 transition-all duration-300 text-xs sm:text-sm md:text-base py-1"
              >
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <Phone className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
                </div>
                <span>{CONTACT_INFO.phone}</span>
              </a>
              
              {/* WhatsApp - Green */}
              <a
                href={getWhatsAppUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 sm:gap-3 text-zinc-700 hover:text-emerald-600 transition-all duration-300 text-xs sm:text-sm md:text-base py-1"
              >
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500" />
                </div>
                <span>WhatsApp Us</span>
              </a>
              
              {/* Email - Gold */}
              <a
                href={getEmailUrl()}
                className="flex items-center justify-center gap-2 sm:gap-3 text-zinc-700 hover:text-gold transition-all duration-300 text-xs sm:text-sm md:text-base py-1"
              >
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gold/20 flex items-center justify-center">
                  <Mail className="w-4 h-4 sm:w-5 sm:h-5 text-gold" />
                </div>
                <span className="break-all">{CONTACT_INFO.emailCapitalized}</span>
              </a>
            </div>
          </div>
          
          {/* Close Premium Champagne Inner Layer */}
          </div>
        </div>
        </div>

        {/* Premium Divider before Legal Zone - on pure black */}
        <div className="relative bg-black py-4">
          <div className="relative h-[2px] max-w-7xl mx-auto">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gold to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gold/40 to-transparent blur-md" />
          </div>
        </div>

        {/* ZONE 3: ULTRA PREMIUM Legal + Google Review Block - on pure black */}
        <div className="relative bg-black py-4">
          <div 
            className="w-full max-w-7xl mx-auto rounded-2xl sm:rounded-3xl overflow-hidden relative"
            style={{
              background: 'linear-gradient(165deg, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 40%, rgba(0,0,0,1) 100%)',
              boxShadow: `
                0 50px 100px -30px rgba(0,0,0,0.98),
                0 30px 60px -20px rgba(0,0,0,0.9),
                0 0 0 2px rgba(200,167,102,0.5),
                0 0 40px rgba(200,167,102,0.15),
                inset 0 1px 0 rgba(200,167,102,0.15),
                inset 0 -1px 0 rgba(0,0,0,0.8)
              `,
            }}
          >
          {/* Outer Gold Border Ring - Enhanced */}
          <div className="absolute inset-0 rounded-2xl sm:rounded-3xl border-2 border-gold/50 pointer-events-none" />
          <div className="absolute inset-[3px] rounded-2xl sm:rounded-3xl border border-gold/25 pointer-events-none" />
          
          {/* Animated Shimmer Sweep */}
          <div 
            className="absolute inset-0 rounded-2xl sm:rounded-3xl pointer-events-none opacity-50"
            style={{
              background: 'linear-gradient(110deg, transparent 20%, rgba(200,167,102,0.06) 40%, rgba(245,230,200,0.12) 50%, rgba(200,167,102,0.06) 60%, transparent 80%)',
              backgroundSize: '250% 100%',
              animation: 'shimmer 8s ease-in-out infinite',
            }}
          />
          
          {/* Top Radial Glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2/3 h-20 bg-gradient-to-b from-gold/8 to-transparent blur-2xl pointer-events-none" />
          
          {/* Premium Gold Corner Accents - BOLD with gradients */}
          <div className="absolute top-0 left-0 w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 pointer-events-none">
            <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-gold via-gold/80 to-transparent rounded-tl-2xl sm:rounded-tl-3xl" />
            <div className="absolute top-0 left-0 h-full w-[3px] bg-gradient-to-b from-gold via-gold/80 to-transparent rounded-tl-2xl sm:rounded-tl-3xl" />
          </div>
          <div className="absolute top-0 right-0 w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 pointer-events-none">
            <div className="absolute top-0 right-0 w-full h-[3px] bg-gradient-to-l from-gold via-gold/80 to-transparent rounded-tr-2xl sm:rounded-tr-3xl" />
            <div className="absolute top-0 right-0 h-full w-[3px] bg-gradient-to-b from-gold via-gold/80 to-transparent rounded-tr-2xl sm:rounded-tr-3xl" />
          </div>
          <div className="absolute bottom-0 left-0 w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 pointer-events-none">
            <div className="absolute bottom-0 left-0 w-full h-[3px] bg-gradient-to-r from-gold via-gold/80 to-transparent rounded-bl-2xl sm:rounded-bl-3xl" />
            <div className="absolute bottom-0 left-0 h-full w-[3px] bg-gradient-to-t from-gold via-gold/80 to-transparent rounded-bl-2xl sm:rounded-bl-3xl" />
          </div>
          <div className="absolute bottom-0 right-0 w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 pointer-events-none">
            <div className="absolute bottom-0 right-0 w-full h-[3px] bg-gradient-to-l from-gold via-gold/80 to-transparent rounded-br-2xl sm:rounded-br-3xl" />
            <div className="absolute bottom-0 right-0 h-full w-[3px] bg-gradient-to-t from-gold via-gold/80 to-transparent rounded-br-2xl sm:rounded-br-3xl" />
          </div>

          <div className="relative p-5 sm:p-8 md:p-10 lg:p-12">
            {/* Legal Disclaimer Section */}
            <div className="bg-gradient-to-br from-champagne-light via-champagne to-champagne-dark rounded-2xl border border-gold/30 shadow-[0_0_40px_rgba(200,167,102,0.18)] p-6 md:p-8 text-center">
              <h4 
                className="font-bold text-base sm:text-lg md:text-xl uppercase tracking-[0.15em] sm:tracking-[0.2em] mb-4 sm:mb-5"
                style={{
                  background: 'linear-gradient(135deg, #1a1a1a 0%, #333333 30%, #D4AF37 50%, #333333 70%, #1a1a1a 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                ✦ Legal Disclaimer ✦
              </h4>
              
              <p className="text-zinc-700 text-xs sm:text-sm md:text-base leading-relaxed mb-4 sm:mb-5 max-w-3xl mx-auto">
                <span className="text-zinc-900 font-semibold">JBJ Global Real Estate</span> is a Dubai mainland real estate brokerage licensed for Buy, Sell, and Rent transactions across the UAE. 
                For legal, mortgage, visa, and corporate support, we can introduce you to independent, licensed partners. 
                Clients contract directly with partners under the partner's own terms and licence.
              </p>
              
              {/* English Legal Line */}
              <p className="text-zinc-600 text-[11px] sm:text-xs md:text-sm leading-relaxed mb-3 sm:mb-4 font-medium max-w-3xl mx-auto">
                Licensed Real Estate Brokerage — Buy, Sell, Rent (Dubai Mainland). Operated by <Link to="/about" className="text-gold hover:underline font-semibold">JBJ Global Real Estate L.L.C S.O.C.</Link>
                <FounderContent fallback={null}>
                  {" "}Owned & led by <Link to="/founder" className="text-gold hover:underline font-semibold">Jane Bou Jaoude (جاين بو جودة)</Link>, Founder & CEO.
                </FounderContent>
              </p>
              
              {/* Arabic Disclaimer */}
              <p className="text-zinc-500 text-[11px] sm:text-xs md:text-sm leading-relaxed mb-3 sm:mb-4 max-w-3xl mx-auto" dir="rtl">
                جي بي جي للعقارات هي وساطة عقارية مرخصة في دبي للبيع والشراء والإيجار. للخدمات القانونية أو التمويل العقاري أو التأشيرات أو الخدمات المؤسسية، يمكننا ربطك بشركاء مستقلين ومرخصين. يتم التعاقد مباشرة بين العميل والشريك وفق ترخيصه وشروطه الخاصة.
              </p>
              
              {/* Arabic Legal Line */}
              <p className="text-zinc-500 text-[11px] sm:text-xs md:text-sm leading-relaxed mb-3 sm:mb-4 max-w-3xl mx-auto" dir="rtl">
                وساطة عقارية مرخصة للبيع والشراء والإيجار في دبي (البر الرئيسي). يتم تشغيل الموقع من قبل JBJ Global Real Estate L.L.C S.O.C.
              </p>
              
              <p className="text-zinc-500 text-[11px] sm:text-xs md:text-sm leading-relaxed mb-5 sm:mb-6 max-w-3xl mx-auto">
                All website content, branding, designs, and software are protected intellectual property of 
                <FounderContent fallback={<Link to="/about" className="text-gold hover:underline font-semibold"> JBJ Global Real Estate</Link>}>
                  <Link to="/founder" className="text-gold hover:underline font-semibold"> Jane Bou Jaoude (جاين بو جودة)</Link> and <Link to="/about" className="text-gold hover:underline font-semibold">JBJ Global Real Estate</Link>
                </FounderContent>. Unauthorized copying, reuse, mirroring, or reproduction is prohibited.
              </p>
              
              {/* Premium unified legal badge */}
              <div className="flex items-center justify-center">
                <div 
                  className="px-5 sm:px-6 md:px-8 py-2.5 sm:py-3 md:py-4 rounded-xl relative overflow-hidden bg-zinc-900/90 border border-gold/40"
                  style={{
                    boxShadow: '0 8px 25px -8px rgba(0,0,0,0.5)',
                  }}
                >
                  <span 
                    className="font-bold tracking-wider relative z-10 text-xs sm:text-sm md:text-base"
                    style={{
                      background: 'linear-gradient(135deg, #D4AF37 0%, #F5E6C8 30%, #E8D5A3 50%, #F5E6C8 70%, #D4AF37 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }}
                  >
                    JBJ Global Real Estate &nbsp;|&nbsp; All Rights Reserved &nbsp;|&nbsp; © {currentYear}
                  </span>
                </div>
              </div>
            </div>

            {/* Google My Business Link - Relocated to Social Links section */}
          </div>
          
          {/* Bottom Radial Glow */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2/3 h-20 bg-gradient-to-t from-gold/8 to-transparent blur-2xl pointer-events-none" />
        </div>
        </div>
      </div>
      
      {/* Bottom gold accent line - Enhanced */}
      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-gold to-transparent" />
      <div className="absolute bottom-[2px] left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-gold/40 to-transparent blur-sm" />
    </footer>
     </>
  );
};

export default Footer;
