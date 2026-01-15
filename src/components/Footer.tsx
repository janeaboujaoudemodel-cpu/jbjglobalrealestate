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
      title: "Buy & Sell Brokerage",
      href: "/properties",
      items: [
        { label: "Off-Plan Properties", href: "/properties?status=off-plan" },
        { label: "Ready Properties", href: "/properties?status=ready" },
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
    { href: "/buyer-guide", label: "Buyer Guide" },
    { href: "/services", label: "Services" },
    { href: "/awards", label: "Awards" },
    { href: "/news", label: "News & Insights" },
    { href: "/contact", label: "Contact" },
  ];

  // Broker Toolkit & Resources
  const academyLinks = [
    { href: "/broker-toolkit", label: "Broker Toolkit" },
    { href: "/broker-toolkit/dashboard", label: "My Dashboard" },
    { href: "/tools-guide", label: "Guides & Resources" },
  ];

  const professionalTools = [
    { href: "/compare", label: "Property Comparison" },
    { href: "/property-evaluator", label: "JBJ Property Evaluator" },
    { href: "/rental-index", label: "JBJ Rental Index" },
    { href: "/document-scanner", label: "JBJ Scan & Sign" },
    { href: "/property-measurement", label: "JBJ Property Measurement" },
    { href: "/interior-design-ai", label: "JBJ AI Interior Design" },
    { href: "/ai-hub", label: "JBJ Broker Hub" },
  ];

  // Career Links
  const careerLinks = [
    { href: "/join", label: "Apply to Join" },
    { href: "/hr-agent", label: "Chat with Jessica" },
    { href: "/onboarding", label: "Training Portal" },
  ];

  return (
    <footer className="bg-black border-t border-zinc-800">
      <div className="container mx-auto px-4 py-10 md:py-14">
        {/* Logo + Company Name - Matching Coming Soon Style */}
        <div className="text-center mb-10 md:mb-14">
          <Link to="/" className="inline-block">
            <img 
              src={jbjMonogramDark} 
              alt="JBJ Global Real Estate" 
              className="h-24 md:h-32 lg:h-40 w-auto object-contain mx-auto mb-6"
            />
          </Link>
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-light tracking-[0.3em] text-gold mb-4">
            JBJ GLOBAL REAL ESTATE
          </h2>
          <p className="text-zinc-400 text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
            Dubai mainland real estate brokerage — with trusted partner introductions for legal, mortgage, and specialist services.
          </p>
        </div>

        {/* Newsletter Section - Premium Style */}
        <div className="mb-10 md:mb-14">
          <div className="max-w-xl mx-auto text-center">
            <h4 className="text-gold font-semibold text-sm uppercase tracking-[0.3em] mb-2">
              Stay in the Loop
            </h4>
            <p className="text-zinc-400 text-sm mb-4">
              Be the first to access new listings, market updates, and personalized brokerage guidance.
            </p>
            <NewsletterBrevo variant="compact" source="footer" />
          </div>
        </div>

        {/* Social Links */}
        <div className="flex justify-center mb-8">
          <SocialLinks variant="gold" iconClassName="w-6 h-6" />
        </div>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-zinc-700 to-transparent mb-10" />

        {/* Menu + Services + Toolkit Grid - Premium Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 md:gap-8 mb-10 max-w-6xl mx-auto">
          {/* Menu */}
          <div className="text-center md:text-left">
            <h4 className="text-gold font-semibold mb-5 text-sm uppercase tracking-[0.2em]">
              Menu
            </h4>
            <ul className="space-y-2.5">
              {menuLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-white hover:text-gold transition-colors text-base inline-block"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Our Services */}
          <div className="text-center md:text-left">
            <h4 className="text-gold font-semibold mb-5 text-sm uppercase tracking-[0.2em]">
              Our Services
            </h4>
            <div className="space-y-2.5">
              {serviceLinks.map((svc) => (
                <DivisionAccordion key={svc.title} title={svc.title} items={svc.items} href={svc.href} />
              ))}
            </div>
          </div>

          {/* Broker Toolkit */}
          <div className="text-center md:text-left">
            <h4 className="text-gold font-semibold mb-5 text-sm uppercase tracking-[0.2em]">
              Broker Toolkit
            </h4>
            <p className="text-zinc-500 text-xs mb-4">Guides & Resources</p>
            <ul className="space-y-2.5">
              {academyLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-white hover:text-gold transition-colors text-base inline-block"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Professional Tools */}
          <div className="text-center md:text-left">
            <h4 className="text-gold font-semibold mb-5 text-sm uppercase tracking-[0.2em]">
              Professional Tools
            </h4>
            <p className="text-zinc-500 text-xs mb-4">AI-Powered Work Assistants</p>
            <ul className="space-y-2.5">
              {professionalTools.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-white hover:text-gold transition-colors text-base inline-block"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Careers */}
          <div className="text-center md:text-left">
            <h4 className="text-gold font-semibold mb-5 text-sm uppercase tracking-[0.2em]">
              Careers
            </h4>
            <p className="text-zinc-500 text-xs mb-4">Join Our Team</p>
            <ul className="space-y-2.5">
              {careerLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-white hover:text-gold transition-colors text-base inline-block"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
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
              <Phone className="w-4 h-4 text-gold flex-shrink-0" />
              <span>{CONTACT_INFO.phone}</span>
            </a>
            <span className="text-zinc-600 hidden md:inline">|</span>
            <a
              href={getWhatsAppUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-white hover:text-gold transition-colors text-sm md:text-base"
            >
              <MessageCircle className="w-4 h-4 text-gold flex-shrink-0" />
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

        {/* Comprehensive Copyright & Legal Section */}
        <div className="max-w-4xl mx-auto mb-8">
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="w-8 h-8 bg-gold/10 border border-gold/30 rounded-lg flex items-center justify-center">
                <span className="text-gold text-lg font-bold">©</span>
              </div>
              <h4 className="text-white font-semibold">Legal Disclaimer</h4>
            </div>
            
            {/* English Disclaimer */}
            <p className="text-zinc-400 text-sm leading-relaxed mb-4">
              <span className="text-white font-medium">JBJ Global Real Estate</span> is a Dubai mainland real estate brokerage. 
              For legal services and mortgage support, we can connect you with independent licensed partners. 
              Clients contract and transact directly with the partner under the partner's own terms.
            </p>
            
            {/* English Legal Line */}
            <p className="text-zinc-300 text-xs leading-relaxed mb-4 font-medium">
              Licensed Real Estate Brokerage in Dubai (Mainland). Operated by JBJ Global Real Estate L.L.C S.O.C. Owned & Led by Jane Abou Jaoude.
            </p>
            
            {/* Arabic Disclaimer */}
            <p className="text-zinc-500 text-xs leading-relaxed mb-4" dir="rtl">
              جي بي جي العقارية العالمية هي وساطة عقارية مرخصة في دبي. للخدمات القانونية والتمويل العقاري، يمكننا ربطك بشركاء مستقلين ومرخصين. يكون التعاقد مباشرة بين العميل والشريك وفق شروط الشريك.
            </p>
            
            {/* Arabic Legal Line */}
            <p className="text-zinc-400 text-xs leading-relaxed mb-4" dir="rtl">
              وساطة عقارية مرخصة في دبي (البر الرئيسي). يتم تشغيل الموقع من قبل JBJ Global Real Estate L.L.C S.O.C.
            </p>
            
            <p className="text-zinc-500 text-xs leading-relaxed mb-4">
              All content, design, and technology on this platform are the intellectual property of 
              Jane Abou Jaoude and JBJ Global Real Estate. Unauthorized reproduction is strictly prohibited.
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
          <div className="text-center space-y-2">
            <p className="font-medium text-white">
              © {currentYear} JBJ Global Real Estate. All Rights Reserved.
            </p>
            <p className="text-xs text-zinc-600">
              <span className="text-gold font-medium">Developed, Created & Implemented by the Founder, Jane Abou Jaoude</span> | Brokerage Services Only
            </p>
            <p className="text-xs text-zinc-600 mt-1">
              Platform Vision by{" "}
              <span className="text-gold font-medium">Jane Abou Jaoude</span> — First Global Real Estate Platform of Its Kind
            </p>
          </div>
          <div className="flex items-center gap-5">
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
