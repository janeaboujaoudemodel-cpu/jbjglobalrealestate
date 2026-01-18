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

  // Our Services — required hierarchy with working pages
  const serviceLinks = [
    {
      title: "Buy, Sell & Rent Brokerage",
      href: "/properties",
      items: [
        { label: "Off-Plan Properties", href: "/properties?status=off-plan" },
        { label: "Ready Properties", href: "/properties?status=ready" },
        { label: "Rentals", href: "/properties?type=rent" },
        { label: "Property Search", href: "/quiz" },
      ],
    },
    { 
      title: "Design & Build Partners", 
      href: "/services/design-build", 
      items: [
        { label: "Architecture", href: "/services/architecture" },
        { label: "Interior Design", href: "/services/interior-design" },
        { label: "Fit-Out", href: "/services/fit-out" },
      ],
    },
    {
      title: "Legal Partners",
      href: "/services/law-firm",
      items: [],
    },
    {
      title: "Mortgage Partners",
      href: "/mortgage-calculator",
      items: [],
    },
  ];

  // Menu — required order
  const menuLinks = [
    { href: "/", label: "Home" },
    { href: "/founder", label: "Founder & Leadership" },
    { href: "/about", label: "About Us" },
    { href: "/company-profile", label: "Company Profile" },
    { href: "/press-kit", label: "Press Kit" },
    { href: "/properties", label: "Properties" },
    { href: "/areas", label: "Area Guides" },
    { href: "/market-intelligence", label: "Market Intelligence" },
    { href: "/buyer-guide", label: "Buyer Guide" },
    { href: "/services", label: "Services" },
    { href: "/awards", label: "Awards" },
    { href: "/news", label: "News & Insights" },
    { href: "/contact", label: "Contact" },
  ];

  // Broker Hub & Resources
  const academyLinks = [
    { href: "/broker-toolkit", label: "Broker Hub" },
    { href: "/my-account", label: "My Dashboard" },
    { href: "/jbj-design-studio", label: "Graphic Designer" },
    { href: "/video-builder", label: "Videographer" },
  ];

  const professionalTools = [
    { href: "/ai-hub", label: "JBJ Broker Hub" },
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

        {/* Menu + Services + Toolkit Grid - Unified Premium White Section */}
        <div className="bg-white rounded-2xl p-6 md:p-8 border border-zinc-200 shadow-lg mb-10 max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 lg:gap-0 lg:divide-x divide-gold/20">
            {/* Menu */}
            <div className="lg:px-5 lg:first:pl-0">
              <h4 className="text-gold font-semibold text-sm uppercase tracking-[0.15em] mb-4 pb-2 border-b border-gold/20 lg:border-b-0">
                Menu
              </h4>
              <ul className="space-y-2">
                {menuLinks.map((link) => (
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
            
            {/* Our Services */}
            <div className="lg:px-5">
              <h4 className="text-gold font-semibold text-sm uppercase tracking-[0.15em] mb-4 pb-2 border-b border-gold/20 lg:border-b-0">
                Our Services
              </h4>
              <div className="space-y-3">
                {serviceLinks.map((svc) => (
                  <div key={svc.title}>
                    <Link 
                      to={svc.href}
                      className="text-black hover:text-gold transition-colors text-sm font-medium block"
                    >
                      {svc.title}
                    </Link>
                    {svc.items.length > 0 && (
                      <div className="pl-3 mt-1.5 space-y-1.5 border-l-2 border-gold/30">
                        {svc.items.map((item) => (
                          <Link
                            key={item.label}
                            to={item.href}
                            className="block text-gold hover:text-gold-dark transition-colors text-xs"
                          >
                            {item.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Broker Hub */}
            <div className="lg:px-5">
              <h4 className="text-gold font-semibold text-sm uppercase tracking-[0.15em] mb-4 pb-2 border-b border-gold/20 lg:border-b-0">
                Broker Hub
              </h4>
              <p className="text-zinc-500 text-xs mb-3 italic">Tools, Training & Support</p>
              <ul className="space-y-2">
                {academyLinks.map((link) => (
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

            {/* Professional Tools */}
            <div className="lg:px-5">
              <h4 className="text-gold font-semibold text-sm uppercase tracking-[0.15em] mb-4 pb-2 border-b border-gold/20 lg:border-b-0">
                Professional Tools
              </h4>
              <p className="text-zinc-500 text-xs mb-3 italic">AI-Powered Assistants</p>
              <ul className="space-y-2">
                {professionalTools.map((link) => (
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

            {/* Careers */}
            <div className="lg:px-5 lg:last:pr-0">
              <h4 className="text-gold font-semibold text-sm uppercase tracking-[0.15em] mb-4 pb-2 border-b border-gold/20 lg:border-b-0">
                Careers
              </h4>
              <p className="text-zinc-500 text-xs mb-3 italic">Join Our Team</p>
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

        {/* Contact Section - Improved Layout */}
        <div className="border-t border-zinc-800 pt-8 mb-8">
          <h4 className="text-gold font-semibold mb-5 text-sm uppercase tracking-[0.2em] text-center">
            Get in Touch
          </h4>
          
          {/* Location */}
          <div className="flex items-center justify-center gap-3 text-white text-base mb-4">
            <MapPin className="w-5 h-5 text-gold flex-shrink-0" />
            <span>{CONTACT_INFO.address}</span>
          </div>
          
          {/* Phone, WhatsApp, Email - Same Line */}
          <div className="flex flex-wrap items-center justify-center gap-4 md:gap-8">
            <a
              href={getCallUrl()}
              className="flex items-center gap-2 text-white hover:text-gold transition-colors text-sm md:text-base"
            >
              <Phone className="w-4 h-4 text-blue-500 flex-shrink-0" />
              <span>{CONTACT_INFO.phone}</span>
            </a>
            <span className="text-zinc-600 hidden md:inline">|</span>
            <a
              href={getWhatsAppUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-white hover:text-gold transition-colors text-sm md:text-base"
            >
              <MessageCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
              <span>WhatsApp Us</span>
            </a>
            <span className="text-zinc-600 hidden md:inline">|</span>
            <a
              href={getEmailUrl()}
              className="flex items-center gap-2 text-white hover:text-gold transition-colors text-sm md:text-base"
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

        {/* Trust Signals */}
        <div className="flex flex-wrap justify-center gap-4 mb-8">
          <GoogleMyBusinessLink variant="badge" />
        </div>

        {/* Bottom - Copyright & Legal with Founder Attribution */}
        <div className="flex flex-col items-center gap-4 text-sm text-zinc-500">
          <div className="text-center space-y-3">
            <p className="font-medium text-white">
              © {currentYear} <Link to="/about" className="hover:text-gold transition-colors">JBJ Global Real Estate</Link>. All Rights Reserved.
            </p>
            <div className="space-y-1">
              <p className="text-gold font-medium text-sm">
                Developed, Created & Implemented by The Founder & CEO, Jane Abou Jaoude
              </p>
              <p className="text-zinc-500 text-xs">
                Designed exclusively for <Link to="/about" className="text-gold hover:underline">JBJ Global Real Estate</Link>
              </p>
              <Link to="/about" className="inline-block text-white hover:text-gold transition-colors text-sm font-medium mt-2">
                First Global Real Estate Platform of Its Kind →
              </Link>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 md:gap-5">
            <Link to="/trust-and-audit-center" className="hover:text-gold transition-colors">
              Trust & Compliance
            </Link>
            <Link to="/privacy" className="hover:text-gold transition-colors">
              Privacy Policy
            </Link>
            <Link to="/terms" className="hover:text-gold transition-colors">
              Terms of Service
            </Link>
            <Link to="/cookies" className="hover:text-gold transition-colors">
              Cookies
            </Link>
            <Link to="/intellectual-property" className="hover:text-gold transition-colors">
              Intellectual Property
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
