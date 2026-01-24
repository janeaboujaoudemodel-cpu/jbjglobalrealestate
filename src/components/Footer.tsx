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
    <footer className="relative overflow-x-hidden">
      {/* Premium gradient background with depth */}
      <div className="absolute inset-0 bg-gradient-to-b from-zinc-950 via-black to-zinc-950" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gold/5 via-transparent to-transparent" />
      
      {/* Top border with 3D gold accent */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-gold to-transparent" />
      <div className="absolute top-[2px] left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-gold/30 to-transparent" />
      
      {/* Full-width footer content */}
      <div className="relative w-full py-8 sm:py-12 md:py-16 lg:py-20 px-3 sm:px-4 md:px-6 lg:px-8">
        
        {/* Logo + Company Name with 3D glow */}
        <div className="text-center mb-8 sm:mb-10 md:mb-12 lg:mb-14">
          <Link to="/" className="inline-block group">
            <div className="relative">
              {/* Glow effect behind logo */}
              <div className="absolute inset-0 bg-gold/20 blur-3xl rounded-full scale-150 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <img 
                src={jbjMonogramDark} 
                alt="JBJ Global Real Estate" 
                className="relative h-16 sm:h-20 md:h-28 lg:h-36 w-auto object-contain mx-auto mb-4 sm:mb-6 drop-shadow-[0_0_30px_rgba(200,167,102,0.3)] group-hover:drop-shadow-[0_0_40px_rgba(200,167,102,0.5)] transition-all duration-500"
              />
            </div>
          </Link>
          <h2 
            className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-light tracking-[0.1em] sm:tracking-[0.15em] md:tracking-[0.2em] lg:tracking-[0.25em] mb-3 sm:mb-4 md:mb-6 px-1"
            style={{
              background: 'linear-gradient(135deg, #D4AF37 0%, #F5E6C8 25%, #C8A766 50%, #E8D5A3 75%, #D4AF37 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textShadow: '0 2px 20px rgba(200,167,102,0.3)',
            }}
          >
            JBJ GLOBAL REAL ESTATE
          </h2>
        </div>

        {/* Premium 3D Card - License + Newsletter + Social */}
        <div 
          className="max-w-3xl mx-auto mb-8 sm:mb-10 md:mb-12 lg:mb-14 p-4 sm:p-6 md:p-8 lg:p-10 rounded-xl sm:rounded-2xl relative"
          style={{
            background: 'linear-gradient(145deg, rgba(39,39,42,0.9) 0%, rgba(24,24,27,0.95) 100%)',
            boxShadow: `
              0 15px 35px -10px rgba(0,0,0,0.8),
              0 0 0 1px rgba(200,167,102,0.15),
              inset 0 1px 0 rgba(255,255,255,0.05),
              inset 0 -1px 0 rgba(0,0,0,0.3)
            `,
          }}
        >
          {/* Corner accents - smaller on mobile */}
          <div className="absolute top-0 left-0 w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 border-t-2 border-l-2 border-gold/40 rounded-tl-xl sm:rounded-tl-2xl" />
          <div className="absolute top-0 right-0 w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 border-t-2 border-r-2 border-gold/40 rounded-tr-xl sm:rounded-tr-2xl" />
          <div className="absolute bottom-0 left-0 w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 border-b-2 border-l-2 border-gold/40 rounded-bl-xl sm:rounded-bl-2xl" />
          <div className="absolute bottom-0 right-0 w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 border-b-2 border-r-2 border-gold/40 rounded-br-xl sm:rounded-br-2xl" />
          
          {/* Licensed Badge */}
          <div className="flex items-center justify-center gap-1.5 sm:gap-2 md:gap-3 mb-3 sm:mb-4 md:mb-5 flex-wrap px-1">
            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 md:w-2.5 md:h-2.5 bg-gold rounded-full animate-pulse shadow-[0_0_10px_rgba(200,167,102,0.5)]" />
            <p className="text-white font-medium text-xs sm:text-sm md:text-base lg:text-lg tracking-wide text-center leading-relaxed">
              <span className="text-gold font-semibold">Licensed</span> · BUY · SELL · RENT · <span className="font-bold">REAL ESTATE</span> In The <span className="text-gold font-semibold">UAE</span>
            </p>
            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 md:w-2.5 md:h-2.5 bg-gold rounded-full animate-pulse shadow-[0_0_10px_rgba(200,167,102,0.5)]" />
          </div>
          <p className="text-zinc-400 text-[11px] sm:text-xs md:text-sm mb-4 sm:mb-6 md:mb-8 text-center px-1">
            Mortgage, legal, visa, and corporate services are provided through licensed partners.
          </p>

          {/* Premium Divider */}
          <div className="h-px bg-gradient-to-r from-transparent via-gold/50 to-transparent mb-4 sm:mb-6 md:mb-8" />

          {/* Stay in the Loop */}
          <h4 
            className="font-semibold text-xs sm:text-sm md:text-base uppercase tracking-[0.15em] sm:tracking-[0.2em] md:tracking-[0.3em] mb-2 sm:mb-3 text-center"
            style={{
              background: 'linear-gradient(135deg, #FFFFFF 0%, #D4AF37 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Stay in the Loop
          </h4>
          <p className="text-zinc-400 text-[11px] sm:text-xs md:text-sm mb-4 sm:mb-5 md:mb-6 text-center px-1">
            Be the first to access new listings, market updates, and personalized brokerage guidance.
          </p>
          <div className="max-w-md mx-auto mb-4 sm:mb-6 md:mb-8 px-1">
            <NewsletterBrevo variant="compact" source="footer" />
          </div>

          {/* Social Links */}
          <div className="flex justify-center">
            <SocialLinks variant="glow" iconClassName="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
          </div>
        </div>

        {/* Premium Divider */}
        <div className="relative h-px mb-6 sm:mb-8 md:mb-10 lg:mb-14 max-w-6xl mx-auto">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-y-[1px]" />
        </div>

        {/* Navigation Grid - Seamless Connected Layout */}
        <div className="w-full mb-4 sm:mb-6 md:mb-10 lg:mb-14">
          <div className="grid grid-cols-2 lg:grid-cols-4 max-w-7xl mx-auto border border-gold/20 rounded-xl sm:rounded-2xl overflow-hidden"
            style={{
              background: 'linear-gradient(145deg, rgba(39,39,42,0.7) 0%, rgba(24,24,27,0.8) 100%)',
              boxShadow: '0 15px 35px -10px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.03)',
            }}
          >
            
            {/* Column 1: Properties + Services */}
            <div className="p-2 sm:p-3 md:p-5 border-r border-b lg:border-b-0 border-gold/10">
              <h4 
                className="font-bold text-[10px] sm:text-xs md:text-sm uppercase tracking-[0.08em] sm:tracking-[0.15em] mb-1.5 sm:mb-2 md:mb-4 pb-1 sm:pb-2 border-b border-gold/30"
                style={{
                  background: 'linear-gradient(135deg, #FFFFFF 0%, #E8D5A3 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                {t('footer.properties') || 'Properties'}
              </h4>
              <ul className="space-y-1 sm:space-y-1.5 md:space-y-2.5 mb-3 sm:mb-4 md:mb-6">
                {propertiesLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      to={link.href}
                      className="text-zinc-400 hover:text-gold transition-all duration-300 text-[10px] sm:text-xs md:text-sm inline-block hover:translate-x-1"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
              
              <h4 
                className="font-bold text-[10px] sm:text-xs md:text-sm uppercase tracking-[0.08em] sm:tracking-[0.15em] mb-1.5 sm:mb-2 md:mb-4 pb-1 sm:pb-2 border-b border-gold/30"
                style={{
                  background: 'linear-gradient(135deg, #FFFFFF 0%, #E8D5A3 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                {t('footer.servicesSection') || 'Services'}
              </h4>
              <ul className="space-y-1 sm:space-y-1.5 md:space-y-2.5">
                {servicesLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      to={link.href}
                      className="text-zinc-400 hover:text-gold transition-all duration-300 text-[10px] sm:text-xs md:text-sm inline-block hover:translate-x-1"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            
            {/* Column 2: Investor Hub + Broker Hub */}
            <div className="p-2 sm:p-3 md:p-5 border-b lg:border-b-0 lg:border-r border-gold/10">
              <h4 
                className="font-bold text-[10px] sm:text-xs md:text-sm uppercase tracking-[0.08em] sm:tracking-[0.15em] mb-1.5 sm:mb-2 md:mb-4 pb-1 sm:pb-2 border-b border-gold/30"
                style={{
                  background: 'linear-gradient(135deg, #FFFFFF 0%, #E8D5A3 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                {t('footer.investorHub') || 'Investor Hub'}
              </h4>
              <ul className="space-y-1 sm:space-y-1.5 md:space-y-2.5 mb-3 sm:mb-4 md:mb-6">
                {investorHubLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      to={link.href}
                      className="text-zinc-400 hover:text-gold transition-all duration-300 text-[10px] sm:text-xs md:text-sm inline-block hover:translate-x-1"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
              
              <h4 
                className="font-bold text-[10px] sm:text-xs md:text-sm uppercase tracking-[0.08em] sm:tracking-[0.15em] mb-1.5 sm:mb-2 md:mb-4 pb-1 sm:pb-2 border-b border-gold/30"
                style={{
                  background: 'linear-gradient(135deg, #FFFFFF 0%, #E8D5A3 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                {t('footer.brokerHub') || 'Broker Hub'}
              </h4>
              <ul className="space-y-1 sm:space-y-1.5 md:space-y-2.5">
                {brokerHubLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      to={link.href}
                      className="text-zinc-400 hover:text-gold transition-all duration-300 text-[10px] sm:text-xs md:text-sm inline-block hover:translate-x-1"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 3: Guides + Market Intelligence */}
            <div className="p-2 sm:p-3 md:p-5 border-r border-gold/10">
              <h4 
                className="font-bold text-[10px] sm:text-xs md:text-sm uppercase tracking-[0.08em] sm:tracking-[0.15em] mb-1.5 sm:mb-2 md:mb-4 pb-1 sm:pb-2 border-b border-gold/30"
                style={{
                  background: 'linear-gradient(135deg, #FFFFFF 0%, #E8D5A3 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                {t('footer.guides') || 'Guides'}
              </h4>
              <ul className="space-y-1 sm:space-y-1.5 md:space-y-2.5 mb-3 sm:mb-4 md:mb-6">
                {guidesLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      to={link.href}
                      className="text-zinc-400 hover:text-gold transition-all duration-300 text-[10px] sm:text-xs md:text-sm inline-block hover:translate-x-1"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
              
              <h4 
                className="font-bold text-[10px] sm:text-xs md:text-sm uppercase tracking-[0.08em] sm:tracking-[0.15em] mb-1.5 sm:mb-2 md:mb-4 pb-1 sm:pb-2 border-b border-gold/30"
                style={{
                  background: 'linear-gradient(135deg, #FFFFFF 0%, #E8D5A3 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                Market Intel
              </h4>
              <ul className="space-y-1 sm:space-y-1.5 md:space-y-2.5">
                {marketIntelLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      to={link.href}
                      className="text-zinc-400 hover:text-gold transition-all duration-300 text-[10px] sm:text-xs md:text-sm inline-block hover:translate-x-1"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 4: About + Careers */}
            <div className="p-2 sm:p-3 md:p-5">
              <h4 
                className="font-bold text-[10px] sm:text-xs md:text-sm uppercase tracking-[0.08em] sm:tracking-[0.15em] mb-1.5 sm:mb-2 md:mb-4 pb-1 sm:pb-2 border-b border-gold/30"
                style={{
                  background: 'linear-gradient(135deg, #FFFFFF 0%, #E8D5A3 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                About
              </h4>
              <ul className="space-y-1 sm:space-y-1.5 md:space-y-2.5 mb-3 sm:mb-4 md:mb-6">
                {aboutLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      to={link.href}
                      className="text-zinc-400 hover:text-gold transition-all duration-300 text-[10px] sm:text-xs md:text-sm inline-block hover:translate-x-1"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
              
              <h4 
                className="font-bold text-[10px] sm:text-xs md:text-sm uppercase tracking-[0.08em] sm:tracking-[0.15em] mb-1.5 sm:mb-2 md:mb-4 pb-1 sm:pb-2 border-b border-gold/30"
                style={{
                  background: 'linear-gradient(135deg, #FFFFFF 0%, #E8D5A3 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                Careers
              </h4>
              <ul className="space-y-1 sm:space-y-1.5 md:space-y-2.5">
                {careerLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      to={link.href}
                      className="text-zinc-400 hover:text-gold transition-all duration-300 text-[10px] sm:text-xs md:text-sm inline-block hover:translate-x-1"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Premium Divider */}
        <div className="relative h-px mb-4 sm:mb-6 md:mb-10 lg:mb-14 max-w-6xl mx-auto">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
        </div>


        {/* Professional Tools Section - Premium 3D Card */}
        <div 
          className="w-full mb-4 sm:mb-6 md:mb-10 lg:mb-14 max-w-5xl mx-auto p-3 sm:p-5 md:p-8 rounded-xl sm:rounded-2xl relative"
          style={{
            background: 'linear-gradient(145deg, rgba(39,39,42,0.9) 0%, rgba(24,24,27,0.95) 100%)',
            boxShadow: `
              0 15px 35px -10px rgba(0,0,0,0.8),
              0 0 0 1px rgba(200,167,102,0.15),
              inset 0 1px 0 rgba(255,255,255,0.05)
            `,
          }}
        >
          <h4 
            className="font-bold text-[10px] sm:text-sm md:text-base uppercase tracking-[0.08em] sm:tracking-[0.15em] md:tracking-[0.2em] mb-1 sm:mb-2 text-center"
            style={{
              background: 'linear-gradient(135deg, #FFFFFF 0%, #D4AF37 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Professional Tools
          </h4>
          <p className="text-zinc-400 text-[9px] sm:text-xs md:text-sm mb-2 sm:mb-4 md:mb-6 italic text-center">AI-Powered Assistants</p>
          <div className="flex flex-wrap justify-center gap-1 sm:gap-2 md:gap-3">
            {professionalTools.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className="text-zinc-300 hover:text-gold transition-all duration-300 text-[9px] sm:text-[11px] md:text-xs lg:text-sm px-1.5 sm:px-3 md:px-4 py-0.5 sm:py-1.5 md:py-2 rounded-md sm:rounded-lg hover:scale-105"
                style={{
                  background: 'linear-gradient(145deg, rgba(50,50,55,0.8) 0%, rgba(30,30,35,0.9) 100%)',
                  boxShadow: '0 4px 15px -3px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
                  border: '1px solid rgba(200,167,102,0.2)',
                }}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Premium Divider */}
        <div className="relative h-px mb-4 sm:mb-6 md:mb-10 lg:mb-12 max-w-4xl mx-auto">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
        </div>

        {/* Contact Section - Premium 3D Card */}
        <div 
          className="w-full mb-4 sm:mb-6 md:mb-10 lg:mb-12 max-w-3xl mx-auto p-3 sm:p-5 md:p-8 rounded-xl sm:rounded-2xl text-center relative"
          style={{
            background: 'linear-gradient(145deg, rgba(39,39,42,0.9) 0%, rgba(24,24,27,0.95) 100%)',
            boxShadow: `
              0 15px 35px -10px rgba(0,0,0,0.8),
              0 0 0 1px rgba(200,167,102,0.2),
              inset 0 1px 0 rgba(255,255,255,0.05)
            `,
          }}
        >
          {/* Corner accents - smaller on mobile */}
          <div className="absolute top-0 left-0 w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 border-t-2 border-l-2 border-gold/50 rounded-tl-xl sm:rounded-tl-2xl" />
          <div className="absolute top-0 right-0 w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 border-t-2 border-r-2 border-gold/50 rounded-tr-xl sm:rounded-tr-2xl" />
          <div className="absolute bottom-0 left-0 w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 border-b-2 border-l-2 border-gold/50 rounded-bl-xl sm:rounded-bl-2xl" />
          <div className="absolute bottom-0 right-0 w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 border-b-2 border-r-2 border-gold/50 rounded-br-xl sm:rounded-br-2xl" />
          
          <h4 
            className="font-bold text-xs sm:text-sm md:text-base uppercase tracking-[0.15em] sm:tracking-[0.2em] mb-3 sm:mb-4 md:mb-5"
            style={{
              background: 'linear-gradient(135deg, #FFFFFF 0%, #D4AF37 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Get in Touch
          </h4>
          
          {/* Location */}
          <div className="flex items-center justify-center gap-1.5 sm:gap-2 md:gap-3 text-zinc-200 text-xs sm:text-sm md:text-base mb-3 sm:mb-4 md:mb-5 px-1">
            <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-gold flex-shrink-0 drop-shadow-[0_0_8px_rgba(200,167,102,0.5)]" />
            <span className="break-words text-center">{CONTACT_INFO.address}</span>
          </div>
          
          {/* Phone, WhatsApp, Email - Stack on mobile */}
          <div className="flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:items-center sm:justify-center sm:gap-4 md:gap-5">
            <a
              href={getCallUrl()}
              className="flex items-center justify-center gap-1.5 sm:gap-2 text-zinc-200 hover:text-gold transition-all duration-300 text-xs sm:text-sm md:text-base hover:scale-105 py-1"
            >
              <Phone className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 text-blue-400 flex-shrink-0" />
              <span>{CONTACT_INFO.phone}</span>
            </a>
            <span className="text-gold/40 hidden sm:inline">|</span>
            <a
              href={getWhatsAppUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 sm:gap-2 text-zinc-200 hover:text-gold transition-all duration-300 text-xs sm:text-sm md:text-base hover:scale-105 py-1"
            >
              <MessageCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 text-green-400 flex-shrink-0" />
              <span>WhatsApp Us</span>
            </a>
            <span className="text-gold/40 hidden sm:inline">|</span>
            <a
              href={getEmailUrl()}
              className="flex items-center justify-center gap-1.5 sm:gap-2 text-zinc-200 hover:text-gold transition-all duration-300 text-xs sm:text-sm md:text-base hover:scale-105 py-1"
            >
              <Mail className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 text-gold flex-shrink-0 drop-shadow-[0_0_8px_rgba(200,167,102,0.5)]" />
              <span className="break-all">{CONTACT_INFO.emailCapitalized}</span>
            </a>
          </div>
        </div>

        {/* Premium Divider */}
        <div className="relative h-px mb-4 sm:mb-6 max-w-4xl mx-auto">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
        </div>

        {/* Legal Section - Premium 3D Card */}
        <div 
          className="max-w-4xl mx-auto mb-4 sm:mb-6 p-3 sm:p-5 md:p-8 rounded-xl sm:rounded-2xl text-center relative"
          style={{
            background: 'linear-gradient(145deg, rgba(30,30,33,0.95) 0%, rgba(18,18,20,0.98) 100%)',
            boxShadow: `
              0 15px 30px -12px rgba(0,0,0,0.7),
              0 0 0 1px rgba(200,167,102,0.1),
              inset 0 1px 0 rgba(255,255,255,0.03)
            `,
          }}
        >
          <div className="flex items-center justify-center gap-2 sm:gap-3 mb-3 sm:mb-4 md:mb-5">
            <div 
              className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-lg sm:rounded-xl flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, rgba(200,167,102,0.2) 0%, rgba(200,167,102,0.1) 100%)',
                boxShadow: '0 4px 15px -3px rgba(200,167,102,0.3), inset 0 1px 0 rgba(255,255,255,0.1)',
                border: '1px solid rgba(200,167,102,0.3)',
              }}
            >
              <span className="text-gold text-sm sm:text-lg md:text-xl font-bold drop-shadow-[0_0_10px_rgba(200,167,102,0.5)]">©</span>
            </div>
            <h4 
              className="font-bold text-sm sm:text-base md:text-lg"
              style={{
                background: 'linear-gradient(135deg, #FFFFFF 0%, #E8D5A3 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Legal Disclaimer
            </h4>
          </div>
          
          <p className="text-zinc-300 text-[10px] sm:text-xs md:text-sm leading-relaxed mb-3 sm:mb-4 md:mb-5 px-1">
            <span className="text-white font-semibold">JBJ Global Real Estate</span> is a Dubai mainland Real Estate brokerage licensed to BUY, SELL & RENT properties across the UAE. 
            For legal services, mortgage support, visa, and corporate services, we can connect you with independent licensed partners. 
            Clients contract and transact directly with the partner under the partner's own terms.
          </p>
          
          {/* English Legal Line */}
          <p className="text-zinc-200 text-[10px] sm:text-[11px] md:text-xs leading-relaxed mb-3 sm:mb-4 font-medium px-1">
            Licensed Real Estate Brokerage for Buy, Sell & Rent in Dubai (Mainland). Operated by <Link to="/about" className="text-gold hover:underline font-semibold">JBJ Global Real Estate</Link> L.L.C S.O.C. Owned & Led by Jane Bou Jaoude (جاين بو جودة) Founder & CEO <Link to="/about" className="text-gold hover:underline font-semibold">JBJ Global Real Estate</Link>.
          </p>
          
          {/* Arabic Disclaimer */}
          <p className="text-zinc-400 text-[10px] sm:text-[11px] md:text-xs leading-relaxed mb-3 sm:mb-4 px-1" dir="rtl">
            جي بي جي العقارية العالمية هي وساطة عقارية مرخصة في دبي للبيع والشراء والإيجار. للخدمات القانونية والتمويل العقاري والتأشيرات، يمكننا ربطك بشركاء مستقلين ومرخصين. يكون التعاقد مباشرة بين العميل والشريك وفق شروط الشريك.
          </p>
          
          {/* Arabic Legal Line */}
          <p className="text-zinc-400 text-[10px] sm:text-[11px] md:text-xs leading-relaxed mb-3 sm:mb-4 px-1" dir="rtl">
            وساطة عقارية مرخصة للبيع والشراء والإيجار في دبي (البر الرئيسي). يتم تشغيل الموقع من قبل JBJ Global Real Estate L.L.C S.O.C.
          </p>
          
          <p className="text-zinc-400 text-[10px] sm:text-[11px] md:text-xs leading-relaxed mb-4 sm:mb-5 px-1">
            All content, design, and technology on this platform are the intellectual property of 
            Jane Bou Jaoude (جاين بو جودة) Founder & CEO <Link to="/about" className="text-gold hover:underline font-semibold">JBJ Global Real Estate</Link>. Unauthorized reproduction is strictly prohibited.
          </p>
          
          {/* Premium badge row - stack on mobile */}
          <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-1.5 sm:gap-2 md:gap-3 text-[10px] sm:text-xs md:text-sm">
            <span 
              className="px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full"
              style={{
                background: 'linear-gradient(135deg, rgba(200,167,102,0.15) 0%, rgba(200,167,102,0.05) 100%)',
                border: '1px solid rgba(200,167,102,0.3)',
              }}
            >
              <span className="text-gold font-medium">Real Estate Brokerage</span>
            </span>
            <span className="text-gold text-sm sm:text-lg hidden sm:inline">•</span>
            <span 
              className="px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full"
              style={{
                background: 'linear-gradient(135deg, rgba(200,167,102,0.15) 0%, rgba(200,167,102,0.05) 100%)',
                border: '1px solid rgba(200,167,102,0.3)',
              }}
            >
              <span className="text-gold font-medium">All Rights Reserved</span>
            </span>
            <span className="text-gold text-sm sm:text-lg hidden sm:inline">•</span>
            <span 
              className="px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full"
              style={{
                background: 'linear-gradient(135deg, rgba(200,167,102,0.15) 0%, rgba(200,167,102,0.05) 100%)',
                border: '1px solid rgba(200,167,102,0.3)',
              }}
            >
              <span className="text-gold font-medium">© {currentYear}</span>
            </span>
          </div>
        </div>

        {/* Google My Business Link */}
        <div className="text-center pb-2 sm:pb-4">
          <GoogleMyBusinessLink />
        </div>
      </div>
      
      {/* Bottom gold accent line */}
      <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-gold/30 to-transparent" />
    </footer>
  );
};

export default Footer;
