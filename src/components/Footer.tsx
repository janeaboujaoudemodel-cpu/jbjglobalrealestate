import { Link } from "react-router-dom";
import { useState } from "react";
import {
  MapPin,
  Phone,
  Mail,
  MessageCircle,
  ChevronDown,
} from "lucide-react";
import { CONTACT_INFO, getWhatsAppUrl, getCallUrl, getEmailUrl } from "@/constants/stats";
import jbjMonogramDark from "@/assets/jbj-monogram-dark-bg.png";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { SocialLinks } from "@/components/marketing/SocialLinks";
import { NewsletterBrevo } from "@/components/marketing/NewsletterBrevo";
import { GoogleMyBusinessLink } from "@/components/marketing/GoogleMyBusinessLink";
import { useLanguage } from "@/contexts/LanguageContext";

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

const Footer = () => {
  const { t } = useLanguage();
  const currentYear = new Date().getFullYear();

  // Properties
  const propertiesLinks = [
    { label: t('footer.buyProperties') || "Buy Properties", href: "/properties?transaction=buy" },
    { label: t('footer.rentProperties') || "Rent Properties", href: "/properties?transaction=rent" },
    { label: "Developers", href: "/developers" },
    { label: t('footer.listYourProperty') || "List Your Property", href: "/seller-listing" },
  ];

  // Services
  const servicesLinks = [
    { label: t('footer.buyerAdvisory') || "Buyer Advisory", href: "/services/buyer-advisory" },
    { label: t('footer.sellerAdvisory') || "Seller Advisory", href: "/services/seller-advisory" },
    { label: t('footer.leasingAdvisory') || "Leasing Advisory", href: "/services/leasing-advisory" },
    { label: t('footer.investmentAdvisory') || "Investment Advisory", href: "/services/investment-advisory" },
  ];

  // Investor Hub
  const investorHubLinks = [
    { label: t('footer.investorEducation') || "Investor Education", href: "/investor-education" },
    { label: t('footer.investorFaqs') || "Investor FAQs", href: "/investor-faq" },
    { label: t('footer.investorTools') || "Investor Tools", href: "/ai-hub" },
  ];

  // Broker Hub
  const brokerHubLinks = [
    { label: t('footer.brokerTools') || "Broker Tools", href: "/broker-toolkit" },
    { label: t('footer.brokerEducation') || "Broker Education", href: "/broker-education" },
    { label: t('footer.brokerFaqs') || "Broker FAQs", href: "/broker-faq" },
  ];

  // Guides
  const guidesLinks = [
    { label: t('footer.buyerGuide') || "Buyer Guide", href: "/buyer-guide" },
    { label: t('footer.sellerGuide') || "Seller Guide", href: "/seller-guide" },
    { label: t('footer.landlordGuide') || "Landlord Guide", href: "/landlord-guide" },
    { label: t('footer.tenantGuide') || "Tenant Guide", href: "/tenant-guide" },
    { label: t('footer.areaGuides') || "Area Guides", href: "/areas" },
    { label: t('footer.generalFaqs') || "General FAQs", href: "/faq" },
  ];

  // Market Intelligence
  const marketIntelLinks = [
    { label: t('footer.marketOverview') || "Market Overview", href: "/market-intelligence/overview" },
    { label: t('footer.areaIntelligence') || "Area Intelligence", href: "/market-intelligence/areas" },
    { label: t('footer.marketReports') || "Market Reports", href: "/market-intelligence/reports" },
    { label: t('footer.methodology') || "Methodology & Data Sources", href: "/market-intelligence/methodology" },
  ];

  // About
  const aboutLinks = [
    { label: t('footer.aboutJbj') || "About JBJ", href: "/about" },
    { label: t('footer.founderLeadership') || "Founder & Leadership", href: "/founder" },
    { label: t('footer.meetTheTeam') || "Meet the Team", href: "/team" },
    { label: t('footer.awardsRecognition') || "Awards & Recognition", href: "/awards" },
    { label: t('footer.newsInsights') || "News & Insights", href: "/news" },
    { label: t('footer.careers') || "Careers", href: "/join" },
  ];

  // Professional Tools
  const professionalTools = [
    { href: "/compare", label: t('footer.propertyComparison') || "Property Comparison" },
    { href: "/property-evaluator", label: t('footer.propertyEvaluator') || "JBJ Property Evaluator" },
    { href: "/rental-index", label: t('footer.rentalIndex') || "JBJ Rental Index" },
    { href: "/mortgage-calculator", label: t('footer.mortgageCalculator') || "Mortgage Calculator" },
    { href: "/quiz", label: t('footer.aiHomeFinder') || "AI Home Finder" },
    { href: "/interior-design-ai", label: t('footer.aiInteriorDesign') || "AI Interior Design" },
    { href: "/business-card-scanner", label: t('footer.businessCardScanner') || "Business Card Scanner" },
    { href: "/documents", label: t('footer.documentsSpreadsheets') || "Documents & Spreadsheets" },
    { href: "/video-meeting", label: t('footer.videoMeet') || "Video Meet" },
    { href: "/ai-calendar", label: t('footer.calendarNotes') || "Calendar & Notes" },
  ];

  // Career Links
  const careerLinks = [
    { href: "/join", label: t('footer.applyJoin') || "Apply to Join Our Team" },
    { href: "/hr-agent", label: t('footer.contactHr') || "Contact Our HR · Jessica" },
    { href: "/onboarding", label: t('footer.trainingPortal') || "Training Portal" },
  ];

  return (
    <footer className="bg-black border-t border-zinc-800 overflow-x-hidden">
      <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-10 md:py-14 max-w-full">
        {/* Logo + Company Name - Matching Coming Soon Style */}
        <div className="text-center mb-6 sm:mb-8 md:mb-10">
          <Link to="/" className="inline-block">
            <img 
              src={jbjMonogramDark} 
              alt="JBJ Global Real Estate" 
              className="h-16 sm:h-20 md:h-28 lg:h-36 w-auto object-contain mx-auto mb-4 sm:mb-6"
            />
          </Link>
          <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-light tracking-[0.15em] sm:tracking-[0.2em] md:tracking-[0.3em] text-gold mb-4 sm:mb-6 px-2 break-words">
            JBJ GLOBAL REAL ESTATE
          </h2>
        </div>

        {/* Premium Champagne Section - License + Newsletter + Social */}
        <div className="bg-gradient-to-br from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-10 border border-gold/30 shadow-lg mb-6 sm:mb-8 md:mb-10 max-w-3xl mx-auto">
          {/* Licensed Badge */}
          <div className="flex items-center justify-center gap-2 sm:gap-3 mb-3 sm:mb-4 flex-wrap">
            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gold rounded-full animate-pulse hidden sm:block" />
            <p className="text-black font-medium text-xs sm:text-sm md:text-base tracking-wide text-center leading-relaxed">
              <span className="text-gold font-semibold">Licensed</span> · BUY · SELL · RENT · <span className="font-bold">REAL ESTATE</span> In The <span className="text-gold font-semibold">UAE</span>
            </p>
            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gold rounded-full animate-pulse hidden sm:block" />
          </div>
          <p className="text-black text-xs sm:text-sm mb-4 sm:mb-6 text-center px-2">
            Mortgage, legal, visa, and corporate services are provided through licensed partners.
          </p>

          {/* Divider */}
          <div className="h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent mb-4 sm:mb-6" />

          {/* Stay in the Loop */}
          <h4 className="text-black font-semibold text-xs sm:text-sm uppercase tracking-[0.15em] sm:tracking-[0.3em] mb-2 text-center">
            Stay in the Loop
          </h4>
          <p className="text-zinc-600 text-xs sm:text-sm mb-4 sm:mb-5 text-center px-2">
            Be the first to access new listings, market updates, and personalized brokerage guidance.
          </p>
          <div className="max-w-md mx-auto mb-4 sm:mb-6 px-2">
            <NewsletterBrevo variant="compact" source="footer" />
          </div>

          {/* Social Links - Gold Glowing */}
          <div className="flex justify-center">
            <SocialLinks variant="glow" iconClassName="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-zinc-700 to-transparent mb-6 sm:mb-8 md:mb-10" />

        {/* Navigation Grid - Champagne styling */}
        <div className="bg-gradient-to-br from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 border border-gold/30 shadow-lg mb-6 sm:mb-8 md:mb-10 max-w-6xl mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-0 lg:divide-x divide-gold/20">
            
            {/* Column 1: Properties + Services */}
            <div className="lg:px-5 lg:first:pl-0">
              <h4 className="text-gold font-semibold text-xs sm:text-sm uppercase tracking-[0.1em] sm:tracking-[0.15em] mb-2 sm:mb-4 pb-1 sm:pb-2 border-b border-gold/20 lg:border-b-0">
                {t('footer.properties') || 'Properties'}
              </h4>
              <ul className="space-y-1.5 sm:space-y-2 mb-4 sm:mb-6">
                {propertiesLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      to={link.href}
                      className="text-black hover:text-gold transition-colors text-xs sm:text-sm inline-block"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
              
              <h4 className="text-gold font-semibold text-xs sm:text-sm uppercase tracking-[0.1em] sm:tracking-[0.15em] mb-2 sm:mb-4 pb-1 sm:pb-2 border-b border-gold/20 lg:border-b-0">
                {t('footer.servicesSection') || 'Services'}
              </h4>
              <ul className="space-y-1.5 sm:space-y-2">
                {servicesLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      to={link.href}
                      className="text-black hover:text-gold transition-colors text-xs sm:text-sm inline-block"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            
            {/* Column 2: Investor Hub + Broker Hub */}
            <div className="lg:px-5">
              <h4 className="text-gold font-semibold text-xs sm:text-sm uppercase tracking-[0.1em] sm:tracking-[0.15em] mb-2 sm:mb-4 pb-1 sm:pb-2 border-b border-gold/20 lg:border-b-0">
                {t('footer.investorHub') || 'Investor Hub'}
              </h4>
              <ul className="space-y-1.5 sm:space-y-2 mb-4 sm:mb-6">
                {investorHubLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      to={link.href}
                      className="text-black hover:text-gold transition-colors text-xs sm:text-sm inline-block"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
              
              <h4 className="text-gold font-semibold text-xs sm:text-sm uppercase tracking-[0.1em] sm:tracking-[0.15em] mb-2 sm:mb-4 pb-1 sm:pb-2 border-b border-gold/20 lg:border-b-0">
                {t('footer.brokerHub') || 'Broker Hub'}
              </h4>
              <ul className="space-y-1.5 sm:space-y-2">
                {brokerHubLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      to={link.href}
                      className="text-black hover:text-gold transition-colors text-xs sm:text-sm inline-block"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 3: Guides + Market Intelligence */}
            <div className="lg:px-5">
              <h4 className="text-gold font-semibold text-xs sm:text-sm uppercase tracking-[0.1em] sm:tracking-[0.15em] mb-2 sm:mb-4 pb-1 sm:pb-2 border-b border-gold/20 lg:border-b-0">
                {t('footer.guides') || 'Guides'}
              </h4>
              <ul className="space-y-1.5 sm:space-y-2 mb-4 sm:mb-6">
                {guidesLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      to={link.href}
                      className="text-black hover:text-gold transition-colors text-xs sm:text-sm inline-block"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
              
              <h4 className="text-gold font-semibold text-xs sm:text-sm uppercase tracking-[0.1em] sm:tracking-[0.15em] mb-2 sm:mb-4 pb-1 sm:pb-2 border-b border-gold/20 lg:border-b-0">
                Market Intel
              </h4>
              <ul className="space-y-1.5 sm:space-y-2">
                {marketIntelLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      to={link.href}
                      className="text-black hover:text-gold transition-colors text-xs sm:text-sm inline-block"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 4: About + Careers */}
            <div className="lg:px-5 lg:last:pr-0">
              <h4 className="text-gold font-semibold text-xs sm:text-sm uppercase tracking-[0.1em] sm:tracking-[0.15em] mb-2 sm:mb-4 pb-1 sm:pb-2 border-b border-gold/20 lg:border-b-0">
                About
              </h4>
              <ul className="space-y-1.5 sm:space-y-2 mb-4 sm:mb-6">
                {aboutLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      to={link.href}
                      className="text-black hover:text-gold transition-colors text-xs sm:text-sm inline-block"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
              
              <h4 className="text-gold font-semibold text-xs sm:text-sm uppercase tracking-[0.1em] sm:tracking-[0.15em] mb-2 sm:mb-4 pb-1 sm:pb-2 border-b border-gold/20 lg:border-b-0">
                Careers
              </h4>
              <ul className="space-y-1.5 sm:space-y-2">
                {careerLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      to={link.href}
                      className="text-black hover:text-gold transition-colors text-xs sm:text-sm inline-block"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Professional Tools Section - Champagne styling */}
        <div className="bg-gradient-to-br from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 border border-gold/30 shadow-lg mb-6 sm:mb-8 md:mb-10 max-w-6xl mx-auto">
          <h4 className="text-gold font-semibold text-xs sm:text-sm uppercase tracking-[0.1em] sm:tracking-[0.15em] mb-3 sm:mb-4 text-center">
            Professional Tools
          </h4>
          <p className="text-zinc-500 text-[10px] sm:text-xs mb-3 sm:mb-4 italic text-center">AI-Powered Assistants</p>
          <div className="flex flex-wrap justify-center gap-1.5 sm:gap-2 md:gap-3">
            {professionalTools.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className="text-black hover:text-gold transition-colors text-[10px] sm:text-xs md:text-sm px-2 sm:px-3 py-1 sm:py-1.5 border border-zinc-200 rounded-md sm:rounded-lg hover:border-gold/30"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Contact Section - Champagne styling */}
        <div className="bg-gradient-to-br from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 border border-gold/30 shadow-lg mb-6 sm:mb-8 md:mb-10 max-w-6xl mx-auto">
          <h4 className="text-gold font-semibold mb-3 sm:mb-5 text-xs sm:text-sm uppercase tracking-[0.15em] sm:tracking-[0.2em] text-center">
            Get in Touch
          </h4>
          
          {/* Location */}
          <div className="flex items-center justify-center gap-2 sm:gap-3 text-black text-xs sm:text-sm md:text-base mb-3 sm:mb-4 text-center px-2">
            <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-gold flex-shrink-0" />
            <span className="break-words">{CONTACT_INFO.address}</span>
          </div>
          
          {/* Phone, WhatsApp, Email - Stack on mobile */}
          <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-2 sm:gap-4 md:gap-8">
            <a
              href={getCallUrl()}
              className="flex items-center gap-2 text-black hover:text-gold transition-colors text-xs sm:text-sm md:text-base"
            >
              <Phone className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-500 flex-shrink-0" />
              <span>{CONTACT_INFO.phone}</span>
            </a>
            <span className="text-gold/30 hidden sm:inline">|</span>
            <a
              href={getWhatsAppUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-black hover:text-gold transition-colors text-xs sm:text-sm md:text-base"
            >
              <MessageCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-500 flex-shrink-0" />
              <span>WhatsApp Us</span>
            </a>
            <span className="text-gold/30 hidden sm:inline">|</span>
            <a
              href={getEmailUrl()}
              className="flex items-center gap-2 text-black hover:text-gold transition-colors text-xs sm:text-sm md:text-base"
            >
              <Mail className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gold flex-shrink-0" />
              <span className="break-all">{CONTACT_INFO.emailCapitalized}</span>
            </a>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-zinc-700 to-transparent mb-4 sm:mb-6" />

        {/* Comprehensive Copyright & Legal Section - Premium White */}
        <div className="max-w-4xl mx-auto mb-6 sm:mb-8">
          <div className="bg-gradient-to-br from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] border border-gold/30 rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 text-center shadow-lg">
            <div className="flex items-center justify-center gap-2 mb-3 sm:mb-4">
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gold/20 border border-gold/40 rounded-md sm:rounded-lg flex items-center justify-center">
                <span className="text-gold text-sm sm:text-lg font-bold">©</span>
              </div>
              <h4 className="text-black font-semibold text-sm sm:text-base">Legal Disclaimer</h4>
            </div>
            
            <p className="text-zinc-600 text-xs sm:text-sm leading-relaxed mb-3 sm:mb-4 px-2">
              <span className="text-black font-medium">JBJ Global Real Estate</span> is a Dubai mainland Real Estate brokerage licensed to BUY, SELL & RENT properties across the UAE. 
              For legal services, mortgage support, visa, and corporate services, we can connect you with independent licensed partners. 
              Clients contract and transact directly with the partner under the partner's own terms.
            </p>
            
            {/* English Legal Line */}
            <p className="text-zinc-700 text-[10px] sm:text-xs leading-relaxed mb-3 sm:mb-4 font-medium px-2">
              Licensed Real Estate Brokerage for Buy, Sell & Rent in Dubai (Mainland). Operated by <Link to="/about" className="text-gold hover:underline">JBJ Global Real Estate</Link> L.L.C S.O.C. Owned & Led by Jane Bou Jaoude (جاين بو جودة) Founder & CEO <Link to="/about" className="text-gold hover:underline">JBJ Global Real Estate</Link>.
            </p>
            
            {/* Arabic Disclaimer */}
            <p className="text-zinc-500 text-[10px] sm:text-xs leading-relaxed mb-3 sm:mb-4 px-2" dir="rtl">
              جي بي جي العقارية العالمية هي وساطة عقارية مرخصة في دبي للبيع والشراء والإيجار. للخدمات القانونية والتمويل العقاري والتأشيرات، يمكننا ربطك بشركاء مستقلين ومرخصين. يكون التعاقد مباشرة بين العميل والشريك وفق شروط الشريك.
            </p>
            
            {/* Arabic Legal Line */}
            <p className="text-zinc-500 text-[10px] sm:text-xs leading-relaxed mb-3 sm:mb-4 px-2" dir="rtl">
              وساطة عقارية مرخصة للبيع والشراء والإيجار في دبي (البر الرئيسي). يتم تشغيل الموقع من قبل JBJ Global Real Estate L.L.C S.O.C.
            </p>
            
            <p className="text-zinc-500 text-[10px] sm:text-xs leading-relaxed mb-3 sm:mb-4 px-2">
              All content, design, and technology on this platform are the intellectual property of 
              Jane Bou Jaoude (جاين بو جودة) Founder & CEO <Link to="/about" className="text-gold hover:underline">JBJ Global Real Estate</Link>. Unauthorized reproduction is strictly prohibited.
            </p>
            
            <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs text-zinc-600">
              <span>Real Estate Brokerage</span>
              <span className="text-gold">•</span>
              <span>All Rights Reserved</span>
              <span className="text-gold">•</span>
              <span>© {currentYear}</span>
            </div>
          </div>
        </div>

        {/* Google My Business Link - Keep if exists */}
        <div className="text-center">
          <GoogleMyBusinessLink />
        </div>
      </div>
    </footer>
  );
};

export default Footer;
