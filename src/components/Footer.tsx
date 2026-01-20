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
  const currentYear = new Date().getFullYear();

  // Properties
  const propertiesLinks = [
    { label: "Buy Properties", href: "/properties?transaction=buy" },
    { label: "Rent Properties", href: "/properties?transaction=rent" },
    { label: "List Your Property", href: "/seller-listing" },
  ];

  // Services
  const servicesLinks = [
    { label: "Buyer Advisory", href: "/services/buyer-advisory" },
    { label: "Seller Advisory", href: "/services/seller-advisory" },
    { label: "Leasing Advisory", href: "/services/leasing-advisory" },
    { label: "Investment Advisory", href: "/services/investment-advisory" },
  ];

  // Investor Hub
  const investorHubLinks = [
    { label: "Investor Education", href: "/investor-education" },
    { label: "Investor FAQs", href: "/investor-faq" },
    { label: "Investment Playbooks", href: "/investment-playbooks" },
  ];

  // Broker Hub
  const brokerHubLinks = [
    { label: "Broker Tools", href: "/broker-toolkit" },
    { label: "Broker Education", href: "/broker-education" },
    { label: "Broker FAQs", href: "/broker-faq" },
  ];

  // Guides (CLEANED)
  const guidesLinks = [
    { label: "Buyer Guide", href: "/buyer-guide" },
    { label: "Seller Guide", href: "/seller-guide" },
    { label: "Landlord Guide", href: "/landlord-guide" },
    { label: "Tenant Guide", href: "/tenant-guide" },
    { label: "Area Guides", href: "/areas" },
    { label: "General FAQs", href: "/faq" },
  ];

  // Market Intelligence
  const marketIntelLinks = [
    { label: "Market Overview", href: "/market-intelligence/overview" },
    { label: "Area Intelligence", href: "/market-intelligence/areas" },
    { label: "Market Reports", href: "/market-intelligence/reports" },
    { label: "Methodology & Data Sources", href: "/market-intelligence/methodology" },
  ];

  // About
  const aboutLinks = [
    { label: "About JBJ", href: "/about" },
    { label: "Founder & Leadership", href: "/founder" },
    { label: "Meet the Team", href: "/team" },
    { label: "Awards & Recognition", href: "/awards" },
    { label: "News & Insights", href: "/news" },
    { label: "Careers", href: "/join" },
  ];

  // Professional Tools
  const professionalTools = [
    { href: "/compare", label: "Property Comparison" },
    { href: "/property-evaluator", label: "JBJ Property Evaluator" },
    { href: "/rental-index", label: "JBJ Rental Index" },
    { href: "/mortgage-calculator", label: "Mortgage Calculator" },
    { href: "/quiz", label: "AI Home Finder" },
    { href: "/interior-design-ai", label: "AI Interior Design" },
    { href: "/business-card-scanner", label: "Business Card Scanner" },
    { href: "/documents", label: "Documents & Spreadsheets" },
    { href: "/video-meeting", label: "Video Meet" },
    { href: "/ai-calendar", label: "Calendar & Notes" },
  ];

  // Career Links
  const careerLinks = [
    { href: "/join", label: "Apply to Join Our Team" },
    { href: "/hr-agent", label: "Contact Our HR · Jessica" },
    { href: "/onboarding", label: "Training Portal" },
  ];

  return (
    <footer className="bg-black border-t border-zinc-800">
      <div className="container mx-auto px-4 py-10 md:py-14">
        {/* Logo + Company Name - Matching Coming Soon Style */}
        <div className="text-center mb-8 md:mb-10">
          <Link to="/" className="inline-block">
            <img 
              src={jbjMonogramDark} 
              alt="JBJ Global Real Estate" 
              className="h-24 md:h-32 lg:h-40 w-auto object-contain mx-auto mb-6"
            />
          </Link>
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-light tracking-[0.3em] text-gold mb-6">
            JBJ GLOBAL REAL ESTATE
          </h2>
        </div>

        {/* Premium White/Champagne Section - License + Newsletter + Social */}
        <div className="bg-gradient-to-br from-white via-[#FDFBF7] to-[#F5F0E6] rounded-2xl p-6 md:p-10 border border-gold/30 shadow-lg mb-10 max-w-3xl mx-auto">
          {/* Licensed Badge */}
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-2 h-2 bg-gold rounded-full animate-pulse" />
            <p className="text-black font-medium text-sm md:text-base tracking-wide text-center">
              <span className="text-gold font-semibold">Licensed</span> · BUY · SELL · RENT <span className="font-bold">REAL ESTATE</span> In The <span className="text-gold font-semibold">UAE</span>
            </p>
            <div className="w-2 h-2 bg-gold rounded-full animate-pulse" />
          </div>
          <p className="text-black text-sm mb-6 text-center">
            Mortgage, legal, visa, and corporate services are provided through licensed partners.
          </p>

          {/* Divider */}
          <div className="h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent mb-6" />

          {/* Stay in the Loop */}
          <h4 className="text-black font-semibold text-sm uppercase tracking-[0.3em] mb-2 text-center">
            Stay in the Loop
          </h4>
          <p className="text-zinc-600 text-sm mb-5 text-center">
            Be the first to access new listings, market updates, and personalized brokerage guidance.
          </p>
          <div className="max-w-md mx-auto mb-6">
            <NewsletterBrevo variant="compact" source="footer" />
          </div>

          {/* Social Links - Gold Glowing */}
          <div className="flex justify-center">
            <SocialLinks variant="glow" iconClassName="w-6 h-6" />
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-zinc-700 to-transparent mb-10" />

        {/* Navigation Grid - Updated Structure */}
        <div className="bg-white rounded-2xl p-6 md:p-8 border border-zinc-200 shadow-lg mb-10 max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-0 lg:divide-x divide-gold/20">
            
            {/* Column 1: Properties + Services */}
            <div className="lg:px-5 lg:first:pl-0">
              <h4 className="text-gold font-semibold text-sm uppercase tracking-[0.15em] mb-4 pb-2 border-b border-gold/20 lg:border-b-0">
                Properties
              </h4>
              <ul className="space-y-2 mb-6">
                {propertiesLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      to={link.href}
                      className="text-black hover:text-gold transition-colors text-sm inline-block"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
              
              <h4 className="text-gold font-semibold text-sm uppercase tracking-[0.15em] mb-4 pb-2 border-b border-gold/20 lg:border-b-0">
                Services
              </h4>
              <ul className="space-y-2">
                {servicesLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      to={link.href}
                      className="text-black hover:text-gold transition-colors text-sm inline-block"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            
            {/* Column 2: Investor Hub + Broker Hub */}
            <div className="lg:px-5">
              <h4 className="text-gold font-semibold text-sm uppercase tracking-[0.15em] mb-4 pb-2 border-b border-gold/20 lg:border-b-0">
                Investor Hub
              </h4>
              <ul className="space-y-2 mb-6">
                {investorHubLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      to={link.href}
                      className="text-black hover:text-gold transition-colors text-sm inline-block"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
              
              <h4 className="text-gold font-semibold text-sm uppercase tracking-[0.15em] mb-4 pb-2 border-b border-gold/20 lg:border-b-0">
                Broker Hub
              </h4>
              <ul className="space-y-2">
                {brokerHubLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      to={link.href}
                      className="text-black hover:text-gold transition-colors text-sm inline-block"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 3: Guides + Market Intelligence */}
            <div className="lg:px-5">
              <h4 className="text-gold font-semibold text-sm uppercase tracking-[0.15em] mb-4 pb-2 border-b border-gold/20 lg:border-b-0">
                Guides
              </h4>
              <ul className="space-y-2 mb-6">
                {guidesLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      to={link.href}
                      className="text-black hover:text-gold transition-colors text-sm inline-block"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
              
              <h4 className="text-gold font-semibold text-sm uppercase tracking-[0.15em] mb-4 pb-2 border-b border-gold/20 lg:border-b-0">
                Market Intelligence
              </h4>
              <ul className="space-y-2">
                {marketIntelLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      to={link.href}
                      className="text-black hover:text-gold transition-colors text-sm inline-block"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 4: About + Careers */}
            <div className="lg:px-5 lg:last:pr-0">
              <h4 className="text-gold font-semibold text-sm uppercase tracking-[0.15em] mb-4 pb-2 border-b border-gold/20 lg:border-b-0">
                About
              </h4>
              <ul className="space-y-2 mb-6">
                {aboutLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      to={link.href}
                      className="text-black hover:text-gold transition-colors text-sm inline-block"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
              
              <h4 className="text-gold font-semibold text-sm uppercase tracking-[0.15em] mb-4 pb-2 border-b border-gold/20 lg:border-b-0">
                Careers
              </h4>
              <ul className="space-y-2">
                {careerLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      to={link.href}
                      className="text-black hover:text-gold transition-colors text-sm inline-block"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Professional Tools Section */}
        <div className="bg-white rounded-2xl p-6 md:p-8 border border-zinc-200 shadow-lg mb-10 max-w-6xl mx-auto">
          <h4 className="text-gold font-semibold text-sm uppercase tracking-[0.15em] mb-4 text-center">
            Professional Tools
          </h4>
          <p className="text-zinc-500 text-xs mb-4 italic text-center">AI-Powered Assistants</p>
          <div className="flex flex-wrap justify-center gap-3">
            {professionalTools.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className="text-black hover:text-gold transition-colors text-sm px-3 py-1.5 border border-zinc-200 rounded-lg hover:border-gold/30"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Contact Section - Matching Navigation Card Style */}
        <div className="bg-white rounded-2xl p-6 md:p-8 border border-zinc-200 shadow-lg mb-10 max-w-6xl mx-auto">
          <h4 className="text-gold font-semibold mb-5 text-sm uppercase tracking-[0.2em] text-center">
            Get in Touch
          </h4>
          
          {/* Location */}
          <div className="flex items-center justify-center gap-3 text-black text-base mb-4">
            <MapPin className="w-5 h-5 text-gold flex-shrink-0" />
            <span>{CONTACT_INFO.address}</span>
          </div>
          
          {/* Phone, WhatsApp, Email - Same Line */}
          <div className="flex flex-wrap items-center justify-center gap-4 md:gap-8">
            <a
              href={getCallUrl()}
              className="flex items-center gap-2 text-black hover:text-gold transition-colors text-sm md:text-base"
            >
              <Phone className="w-4 h-4 text-blue-500 flex-shrink-0" />
              <span>{CONTACT_INFO.phone}</span>
            </a>
            <span className="text-gold/30 hidden md:inline">|</span>
            <a
              href={getWhatsAppUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-black hover:text-gold transition-colors text-sm md:text-base"
            >
              <MessageCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
              <span>WhatsApp Us</span>
            </a>
            <span className="text-gold/30 hidden md:inline">|</span>
            <a
              href={getEmailUrl()}
              className="flex items-center gap-2 text-black hover:text-gold transition-colors text-sm md:text-base"
            >
              <Mail className="w-4 h-4 text-gold flex-shrink-0" />
              <span>{CONTACT_INFO.emailCapitalized}</span>
            </a>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-zinc-700 to-transparent mb-6" />

        {/* Comprehensive Copyright & Legal Section - Premium White */}
        <div className="max-w-4xl mx-auto mb-8">
          <div className="bg-gradient-to-br from-white via-[#FDFBF7] to-[#F5F0E6] border border-gold/30 rounded-2xl p-6 md:p-8 text-center shadow-lg">
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="w-8 h-8 bg-gold/20 border border-gold/40 rounded-lg flex items-center justify-center">
                <span className="text-gold text-lg font-bold">©</span>
              </div>
              <h4 className="text-black font-semibold">Legal Disclaimer</h4>
            </div>
            
            <p className="text-zinc-600 text-sm leading-relaxed mb-4">
              <span className="text-black font-medium">JBJ Global Real Estate</span> is a Dubai mainland Real Estate brokerage licensed to BUY, SELL & RENT properties across the UAE. 
              For legal services, mortgage support, visa, and corporate services, we can connect you with independent licensed partners. 
              Clients contract and transact directly with the partner under the partner's own terms.
            </p>
            
            {/* English Legal Line */}
            <p className="text-zinc-700 text-xs leading-relaxed mb-4 font-medium">
              Licensed Real Estate Brokerage for Buy, Sell & Rent in Dubai (Mainland). Operated by <Link to="/about" className="text-gold hover:underline">JBJ Global Real Estate</Link> L.L.C S.O.C. Owned & Led by Jane Abou Jaoude Founder & CEO <Link to="/about" className="text-gold hover:underline">JBJ Global Real Estate</Link>.
            </p>
            
            {/* Arabic Disclaimer */}
            <p className="text-zinc-500 text-xs leading-relaxed mb-4" dir="rtl">
              جي بي جي العقارية العالمية هي وساطة عقارية مرخصة في دبي للبيع والشراء والإيجار. للخدمات القانونية والتمويل العقاري والتأشيرات، يمكننا ربطك بشركاء مستقلين ومرخصين. يكون التعاقد مباشرة بين العميل والشريك وفق شروط الشريك.
            </p>
            
            {/* Arabic Legal Line */}
            <p className="text-zinc-500 text-xs leading-relaxed mb-4" dir="rtl">
              وساطة عقارية مرخصة للبيع والشراء والإيجار في دبي (البر الرئيسي). يتم تشغيل الموقع من قبل JBJ Global Real Estate L.L.C S.O.C.
            </p>
            
            <p className="text-zinc-500 text-xs leading-relaxed mb-4">
              All content, design, and technology on this platform are the intellectual property of 
              Jane Abou Jaoude Founder & CEO <Link to="/about" className="text-gold hover:underline">JBJ Global Real Estate</Link>. Unauthorized reproduction is strictly prohibited.
            </p>
            
            <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-zinc-600">
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
