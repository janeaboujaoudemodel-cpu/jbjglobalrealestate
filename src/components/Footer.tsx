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

// Removed: AI_TOOL_COLORS and CREATIVE_TOOL_COLORS maps (no longer needed with card layout)

/** Reusable footer navigation card with centered title and 2-column link grid */
const FooterCard = ({ title, links, viewAllHref, viewAllLabel }: {
  title: string;
  links: { label: string; href: string }[];
  viewAllHref?: string;
  viewAllLabel?: string;
}) => (
  <div className="group relative bg-white border border-gray-200 rounded-none px-6 py-5 hover:border-gray-300 transition-all duration-300 shadow-sm hover:shadow-md">
    <h4 className="text-center font-bold text-sm sm:text-base md:text-lg uppercase tracking-[0.15em] mb-3 pb-2.5 border-b border-gray-200 text-black"
      
    >{title}</h4>
    <div className="relative">
      {/* Gold vertical divider between columns — hidden on single-column */}
      <div className="hidden min-[375px]:block absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-gray-200 to-transparent -translate-x-1/2" />
      <div className="grid grid-cols-1 min-[375px]:grid-cols-2 gap-x-5 gap-y-2">
        {links.map((link) => (
          <Link key={link.href} to={link.href} className="text-gray-600 hover:text-black transition-all duration-300 text-xs sm:text-sm inline-block hover:translate-x-1">
            {link.label}
          </Link>
        ))}
      </div>
    </div>
    {viewAllHref && (
      <Link to={viewAllHref} className="block text-center mt-3.5 pt-2.5 border-t border-gray-200 text-black text-xs sm:text-sm font-semibold hover:text-gray-600 transition-colors">
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
        className="flex items-center gap-2 text-gray-700 hover:text-black transition-colors text-base justify-center md:justify-start"
      >
        {title}
      </Link>
    );
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="flex items-center gap-2 text-gray-700 hover:text-black transition-colors text-base w-full justify-center md:justify-start group">
        {title}
        <ChevronDown
          className={`w-4 h-4 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        />
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-2 space-y-2 pl-4 border-l border-gray-200">
        {items.map((item) => (
          <Link
            key={item.label}
            to={item.href}
            className="block text-gray-500 hover:text-black transition-colors text-sm"
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
    <div className="flex items-center gap-3">
      <p className="text-gray-500 text-[10px] uppercase tracking-wider whitespace-nowrap">Currency</p>
      <div className="flex items-center gap-2">
        {/* Currency Dropdown */}
        <div className="relative">
          <button
            onClick={() => { setCurrencyOpen(!currencyOpen); setUnitOpen(false); }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-300 bg-white text-black text-sm font-semibold transition-all hover:border-gray-400"
            style={{
              boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
            }}
          >
            <span>{currentCur?.flag} {activeCurrency}</span>
            <ChevronDown className={cn("w-4 h-4 text-gray-400 transition-transform", currencyOpen && "rotate-180")} />
          </button>
          {currencyOpen && (
            <div 
              className="absolute bottom-full mb-2 left-0 w-52 rounded-xl border border-gray-200 bg-white overflow-hidden z-50 max-h-80 overflow-y-auto"
              style={{
                boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
              }}
            >
              {SUPPORTED_CURRENCIES.map((cur) => (
                <button
                  key={cur.code}
                  onClick={() => handleCurrency(cur.code)}
                  className={cn(
                    "w-full flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors text-left",
                    activeCurrency === cur.code
                      ? "bg-gray-100 text-black font-bold"
                      : "text-gray-700 hover:bg-gray-50"
                  )}
                >
                  <span>{cur.flag}</span>
                  <span>{cur.code}</span>
                  <span className="text-gray-400 text-xs ml-auto">{cur.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Vertical divider */}
        <div className="w-px h-8 bg-gradient-to-b from-transparent via-gray-300 to-transparent" />

        {/* Area Unit Inline Toggle */}
        <div className="flex rounded-xl border border-gray-300 overflow-hidden"
          style={{
            boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
          }}
        >
          {(['sqft', 'sqm'] as const).map((unit) => (
            <button
              key={unit}
              onClick={() => handleUnit(unit)}
              className={cn(
                "px-4 py-2.5 text-sm font-semibold transition-all",
                areaUnit === unit
                  ? "bg-gray-100 text-black"
                  : "bg-white text-gray-500 hover:bg-gray-50 hover:text-black"
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
    { label: "Property Measurement", href: "/property-measurement" },
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
    { label: t('footer.leasingAdvisory') || "Rental Advisory", href: "/services/rental-advisory" },
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
    { label: "Design & Build", href: "/services/design-build" },
    { label: "Law Firm", href: "/services/law-firm" },
    { label: "Broker Certification", href: "/services/broker-certification" },
    { label: "Complaint Procedures", href: "/services/complaint-procedures" },
    { label: "Testimonials", href: "/reviews" },
    { label: "Referral Partner", href: "/referral-partner" },
    { label: "Signature Collection", href: "/services/signature-collection" },
  ];

  // Investor Hub - Always visible
  const investorHubLinks = [
    { label: "Investor Hub", href: "/investor/portfolio-views" },
    { label: "Investor Services", href: "/services/investment-advisory" },
    { label: "Join Investor List", href: "/investors/join" },
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
    { label: "Our Brokers", href: "/brokers" },
    { label: "Partner Governance", href: "/governance/partners" },
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
    { href: "/academy/graduates", label: "Academy Graduates" },
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
    { href: "/partners/mortgage", label: "Mortgage" },
    { href: "/partners/legal", label: "Legal" },
    { href: "/partners/company-setup", label: "Company Setup" },
    { href: "/partners/visa-services", label: "Visa Services" },
    { href: "/governance/partners", label: "Partners Hub" },
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
    
    { label: "Trust & Audit", href: "/trust-and-audit-center" },
  ];

  // Creative Toolkit
  const creativeToolkitLinks = [
    { href: "/ai-hub", label: "AI Tools Hub" },
    { href: "/toolkit/video-suite", label: "Video Suite" },
    { href: "/toolkit/video-resize-pack", label: "Video Resize Pack" },
    { href: "/toolkit/voice-studio", label: "Voice Studio" },
    { href: "/toolkit/pdf-from-photos", label: "Photo to PDF" },
    { href: "/toolkit/image-resize", label: "Image Resizer" },
    { href: "/toolkit/captions-translate", label: "Captions & Translate" },
    { href: "/toolkit/background-ai", label: "Background Remover" },
    { href: "/toolkit/beauty-filters", label: "Beauty Filters" },
    { href: "/toolkit/stamp-generator", label: "Smart Stamp Generator" },
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

  // Professional Tools
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

  // Education Hub - Link to /guides (contains all books, market reports, guides)
  const educationHubLink = { href: "/education-hub", label: "Education Hub" };

  return (
    <>
      <footer id="site-footer" className="relative overflow-x-hidden bg-white">
      {/* Dark premium brown background */}
      <div className="absolute inset-0 bg-white" />
      
      {/* Premium Gold Divider at top - 3D layered effect with symmetric spacing */}
      <div className="relative py-4">
        <div className="w-full max-w-4xl mx-auto px-8">
          <div className="h-[1px] bg-gradient-to-r from-transparent via-gray-300 to-transparent" />
          <div className="h-[1px] bg-gradient-to-r from-transparent via-gray-200 to-transparent mt-[1px]" />
          <div className="h-[1px] bg-transparent mt-[1px]" />
        </div>
      </div>
      
      {/* Full-width footer content */}
      <div className="relative w-full pt-0 pb-8 sm:pb-12 md:pb-16 lg:pb-20">
        {/* NOW BELOW THE 3D CARD: Logo + Company Name Section - COMES FIRST */}
        <div className="flex flex-col items-center justify-center text-center w-full relative pt-4 pb-8">
          {/* Dark luxury brown background for monogram section */}
          <div className="absolute inset-0 bg-white pointer-events-none" />
          
          <Link to="/" className="inline-block group">
            <img 
              src={jbjMonogramNobuffer} 
              alt="JBJ Global Real Estate" 
              className="h-32 sm:h-40 md:h-48 w-auto object-contain mx-auto mb-4 sm:mb-6 drop-shadow-[0_2px_4px_rgba(0,0,0,0.08)] transition-all duration-500 group-hover:scale-[1.02]"
            />
          </Link>
          
          {/* Company Name with Enhanced Readability */}
          <h2 
            className="relative text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-semibold tracking-[0.08em] sm:tracking-[0.12em] md:tracking-[0.15em] lg:tracking-[0.18em] mb-2 sm:mb-3 md:mb-4 px-2 transition-all duration-500 hover:scale-[1.01]"
            style={{
              color: '#111111',
              
              letterSpacing: '0.12em',
              
            }}
          >
            JBJ GLOBAL REAL ESTATE
          </h2>
          
          {/* Tagline with Premium Gold Styling */}
          <p 
            className="relative text-sm sm:text-base md:text-lg tracking-[0.15em] sm:tracking-[0.2em] uppercase font-semibold transition-all duration-500 px-4 py-2"
            style={{
              color: '#555555',
              
            }}
          >
            Excellence in Real Estate
          </p>
        </div>

        {/* ULTRA PREMIUM 3D Card - License + Newsletter + Social - BELOW logo */}
        <div className="relative pt-4 sm:pt-6 md:pt-8 pb-4">
          <div 
            className="w-full rounded-none relative overflow-hidden"
            style={{
              background: '#FFFFFF',
              boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04)',
            }}
          >
            <div className="absolute inset-0 border border-gray-200 pointer-events-none" />
          
          <div className="relative p-5 sm:p-8 md:p-10 lg:p-12">
            
            {/* Licensed Badge - ULTRA Enhanced */}
            <div className="relative flex items-center justify-center gap-2 sm:gap-3 md:gap-4 mb-3 sm:mb-4 md:mb-5 flex-wrap px-1">
              <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-3.5 md:h-3.5 bg-gray-400 rounded-full" />
              <p 
                className="font-bold text-sm sm:text-base md:text-lg lg:text-xl tracking-wide text-center leading-relaxed uppercase"
                style={{
                  
                  color: '#111111',
                }}
              >
                Licensed ✦ BUY ✦ SELL ✦ RENT ✦ REAL ESTATE In The UAE
              </p>
              <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-3.5 md:h-3.5 bg-gray-400 rounded-full" />
            </div>
            <p className="relative text-gray-500 text-xs sm:text-sm md:text-base mb-6 sm:mb-8 md:mb-10 text-center px-2 max-w-2xl mx-auto">
              Mortgage, legal, visa, and corporate support is provided through independent licensed partners.
            </p>

            <div className="h-px bg-gray-200 mb-6 sm:mb-8 md:mb-10 max-w-lg mx-auto" />

            {/* Stay in the Loop - Newsletter inside the 3D card */}
            {!isBackOfficeContext && (
              <div className="relative mb-6 sm:mb-8 md:mb-10 px-2 sm:px-4">
                <div 
                  className="bg-gray-50 rounded-2xl border border-gray-200 p-6 md:p-8"
                  style={{
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                  }}
                >
                  {/* Premium Title */}
                  <h3 
                    className="text-center text-2xl md:text-3xl font-bold mb-3 uppercase tracking-[0.15em]"
                    style={{
                      
                      color: '#111111',
                    }}
                  >
                    ✦ Stay in the Loop ✦
                  </h3>
                  <p className="text-center text-gray-500 text-sm md:text-base mb-6 max-w-xl mx-auto">
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
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-200 to-transparent blur-md" />
            </div>

            {/* Single Premium Strip: Social + Write Us + Google + Mode + Currency/Unit */}
            <div className="relative flex flex-col items-center gap-0">
              <div 
                className="w-full flex flex-col md:flex-row items-center justify-center gap-0 rounded-none overflow-hidden"
                style={{
                  background: '#F5F5F5',
                  border: '1px solid rgba(0,0,0,0.06)',
                }}
              >
                {/* Social Icons */}
                <div className="flex items-center gap-4 px-6 py-4 border-b md:border-b-0 md:border-r border-gray-200">
                  <p className="text-gray-500 text-xs uppercase tracking-[0.15em] font-medium whitespace-nowrap">Connect</p>
                  <SocialLinks variant="glow" iconClassName="w-6 h-6 sm:w-7 sm:h-7" />
                </div>

                {/* Write Us */}
                <a
                  href={getEmailUrl()}
                  className="flex items-center gap-3 px-6 py-4 border-b md:border-b-0 md:border-r border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  <Mail className="w-5 h-5 text-gray-700" />
                  <div>
                    <p className="text-gray-400 text-[10px] uppercase tracking-wider">Write Us</p>
                    <p className="text-gray-700 text-sm font-semibold">{CONTACT_INFO.email}</p>
                  </div>
                </a>

                {/* Google Business */}
                <div className="flex items-center px-6 py-4 border-b md:border-b-0 md:border-r border-gray-200">
                  <GoogleMyBusinessLink />
                </div>

                {/* Mode */}
                <div className="flex items-center gap-3 px-6 py-4 border-b md:border-b-0 md:border-r border-gray-200">
                  <p className="text-gray-500 text-[10px] uppercase tracking-wider whitespace-nowrap">Mode</p>
                  <ModeSwitcher variant="header" showForUnselected={true} />
                </div>

                {/* Currency & Unit */}
                <div className="flex items-center px-6 py-4">
                  <FooterCurrencyUnit />
                </div>
              </div>
            </div>
          </div>
          
          {/* Bottom Radial Glow */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-24 hidden pointer-events-none" />
        </div>
        </div>

        {/* Thin inline divider */}
        <div className="relative py-2">
          <div className="h-[1px] bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
        </div>

        {/* ZONE 2: ULTRA PREMIUM Navigation + Tools + Contact Block */}
        <div className="relative py-4">
          <div 
            className="w-full rounded-none overflow-hidden relative"
            style={{
              background: '#FFFFFF',
              boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04)',
            }}
          >
            {/* Outer Gold Border Ring - Enhanced */}
            <div className="absolute inset-0 rounded-none border border-gray-200 pointer-events-none" />
            <div className="absolute inset-[3px] rounded-none border border-gray-100 pointer-events-none" />
            
            {/* Animated Shimmer Sweep */}
            <div 
              className="absolute inset-0 rounded-none pointer-events-none opacity-50"
              style={{
                background: 'none',
              }}
            />
          
          {/* Edge-to-edge: no corner accents needed */}
          
          {/* Inner Layer */}
          <div className="bg-white rounded-none border border-gray-200 m-0 overflow-hidden">
            
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
                <FooterCard title="Professional Tools" links={professionalTools} />
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
                  { href: "/ai-personal-shopper", label: "AI Personal Shopper" },
                  { href: "/ai-calendar", label: "AI Calendar" },
                  { href: "/ai-budget-planner", label: "AI Budget Planner" },
                  { href: "/ai-investment-report", label: "AI Investment Report" },
                  { href: "/ai-call-summarizer", label: "AI Call Summarizer" },
                  { href: "/ai-client-matcher", label: "AI Client Matcher" },
                  { href: "/ai-description-writer", label: "AI Description Writer" },
                  { href: "/my-ai-history", label: "AI History" },
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
                ]} viewAllHref="/ai-hub" viewAllLabel="View All Creative Tools →" />
              </div>
            </div>

          {/* Internal Divider */}
          <div className="h-[1px] bg-gray-200 mx-6" />

          {/* Contact Section - Premium on Champagne */}
          <div className="p-3 sm:p-5 md:p-8 text-center relative">
            <h4 className="font-bold text-sm sm:text-base md:text-lg uppercase tracking-[0.15em] sm:tracking-[0.2em] mb-3 sm:mb-4 md:mb-5 text-gray-700">
              Get in Touch
            </h4>
            
            {/* Location with Gold Circle Background */}
            <div className="flex items-center justify-center gap-2 sm:gap-3 text-gray-600 text-xs sm:text-sm md:text-base mb-3 sm:mb-4 md:mb-5 px-1">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-black" />
              </div>
              <span className="break-words text-center">{CONTACT_INFO.address}</span>
            </div>
            
            {/* Phone, WhatsApp, Email - With Colored Circle Backgrounds */}
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-center sm:gap-6 md:gap-8">
              {/* Phone - Blue */}
              <a
                href={getCallUrl()}
                className="flex items-center justify-center gap-2 sm:gap-3 text-gray-600 hover:text-black transition-all duration-300 text-xs sm:text-sm md:text-base py-1"
              >
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gray-100 flex items-center justify-center">
                  <Phone className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
                </div>
                <span>{CONTACT_INFO.phone}</span>
              </a>
              
              {/* WhatsApp - Green */}
              <a
                href={getWhatsAppUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 sm:gap-3 text-gray-600 hover:text-black transition-all duration-300 text-xs sm:text-sm md:text-base py-1"
              >
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gray-100 flex items-center justify-center">
                  <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
                </div>
                <span>WhatsApp Us</span>
              </a>
              
              {/* Email - Gold */}
              <a
                href={getEmailUrl()}
                className="flex items-center justify-center gap-2 sm:gap-3 text-gray-600 hover:text-black transition-all duration-300 text-xs sm:text-sm md:text-base py-1"
              >
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gray-100 flex items-center justify-center">
                  <Mail className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700" />
                </div>
                <span className="break-all">{CONTACT_INFO.emailCapitalized}</span>
              </a>
            </div>
          </div>
          
          {/* Close Premium Champagne Inner Layer */}
          </div>
        </div>
        </div>

        {/* Thin inline divider */}
        <div className="relative py-2">
          <div className="h-[1px] bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
        </div>

        {/* ZONE 3: ULTRA PREMIUM Legal + Google Review Block */}
        <div className="relative py-4">
          <div 
            className="w-full rounded-none overflow-hidden relative"
            style={{
              background: '#FFFFFF',
              boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04)',
            }}
          >
          {/* Outer Gold Border Ring - Enhanced */}
          <div className="absolute inset-0 rounded-none border border-gray-200 pointer-events-none" />
          <div className="absolute inset-[3px] rounded-none border border-gray-100 pointer-events-none" />
          
          {/* Animated Shimmer Sweep */}
          <div 
            className="absolute inset-0 rounded-none pointer-events-none opacity-50"
            style={{
              background: 'none',
            }}
          />
          
          {/* Top Radial Glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2/3 h-20 hidden pointer-events-none" />
          
          {/* Edge-to-edge: no corner accents needed */}

          <div className="relative p-5 sm:p-8 md:p-10 lg:p-12">
            {/* Legal Disclaimer Section */}
            <div className="bg-gray-50 rounded-2xl border border-gray-200 p-6 md:p-8 text-center">
              <h4 
                className="font-bold text-base sm:text-lg md:text-xl uppercase tracking-[0.15em] sm:tracking-[0.2em] mb-4 sm:mb-5"
                style={{
                  color: '#111111',
                }}
              >
                ✦ Legal Disclaimer ✦
              </h4>
              
              <p className="text-gray-600 text-xs sm:text-sm md:text-base leading-relaxed mb-4 sm:mb-5 max-w-3xl mx-auto">
                <span className="text-gray-900 font-semibold">JBJ Global Real Estate</span> is a Dubai mainland real estate brokerage licensed for Buy, Sell, and Rent transactions across the UAE. 
                For legal, mortgage, visa, and corporate support, we can introduce you to independent, licensed partners. 
                Clients contract directly with partners under the partner's own terms and licence.
              </p>
              
              {/* English Legal Line */}
              <p className="text-gray-500 text-[11px] sm:text-xs md:text-sm leading-relaxed mb-3 sm:mb-4 font-medium max-w-3xl mx-auto">
                Licensed Real Estate Brokerage — Buy, Sell, Rent (Dubai Mainland). Operated by <Link to="/about" className="text-gray-700 hover:underline font-semibold">JBJ Global Real Estate L.L.C S.O.C.</Link>
                <FounderContent fallback={null}>
                  {" "}Owned & led by <Link to="/founder" className="text-gray-700 hover:underline font-semibold">Jane Bou Jaoude (جاين بو جودة)</Link>, Founder & CEO.
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
                <FounderContent fallback={<Link to="/about" className="text-gray-700 hover:underline font-semibold"> JBJ Global Real Estate</Link>}>
                  <Link to="/founder" className="text-gray-700 hover:underline font-semibold"> Jane Bou Jaoude (جاين بو جودة)</Link> and <Link to="/about" className="text-gray-700 hover:underline font-semibold">JBJ Global Real Estate</Link>
                </FounderContent>. Unauthorized copying, reuse, mirroring, or reproduction is prohibited.
              </p>
              
              {/* Premium unified legal badge */}
              <div className="flex items-center justify-center">
                <div 
                  className="px-5 sm:px-6 md:px-8 py-2.5 sm:py-3 md:py-4 rounded-xl relative overflow-hidden bg-black border border-gray-800"
                  style={{
                    boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
                  }}
                >
                  <span 
                    className="font-bold tracking-wider relative z-10 text-xs sm:text-sm md:text-base"
                    style={{
                      color: '#FFFFFF',
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
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2/3 h-20 hidden pointer-events-none" />
        </div>
        </div>
      </div>
      
      {/* Bottom accent line - Enhanced */}
      <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gray-200" />
      <div className="absolute bottom-[2px] left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-gray-200 to-transparent blur-sm" />
    </footer>
     </>
  );
};

export default Footer;
