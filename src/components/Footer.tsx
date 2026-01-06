import { Link } from "react-router-dom";
import { useState } from "react";
import {
  MapPin,
  Phone,
  Mail,
  MessageCircle,
  ChevronDown,
  ExternalLink,
  Send,
} from "lucide-react";
import { CONTACT_INFO, getWhatsAppUrl, getCallUrl, getEmailUrl } from "@/constants/stats";
import { JJLogoImage } from "@/components/JJLogoImage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { toast } from "sonner";

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
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    
    setIsSubmitting(true);
    // Simulate submission
    setTimeout(() => {
      toast.success("Welcome to the JJ Global Capital inner circle!", {
        description: "You'll receive exclusive updates and insights.",
      });
      setEmail("");
      setIsSubmitting(false);
    }, 1000);
  };

  // Our Divisions — required hierarchy with working pages
  const divisions = [
    {
      title: "Buy & Sell",
      href: "/properties",
      items: [
        { label: "Off-Plan Properties", href: "/properties?status=off-plan" },
        { label: "Ready Properties", href: "/properties?status=ready" },
        { label: "Property Search", href: "/quiz" },
      ],
    },
    {
      title: "Leasing",
      href: "/properties?status=ready",
      items: [],
    },
    {
      title: "Holiday Homes",
      href: "/contact",
      items: [],
    },
    { 
      title: "Design & Build", 
      href: "/services/design-build", 
      items: [
        { label: "Architecture", href: "/services/architecture" },
        { label: "Interior Design", href: "/services/interior-design" },
        { label: "Fit-Out", href: "/services/fit-out" },
      ],
    },
    { title: "Luxury Concierge", href: "/concierge", items: [] },
  ];

  // Menu — required order
  const menuLinks = [
    { href: "/", label: "Home" },
    { href: "/founder", label: "Founder & Leadership" },
    { href: "/about", label: "About Us" },
    { href: "/company-profile", label: "Company Profile" },
    { href: "/press-kit", label: "Press Kit" },
    { href: "/properties", label: "Properties" },
    { href: "/concierge", label: "Services" },
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
    { href: "/property-evaluator", label: "Property Evaluator" },
    { href: "/rental-index", label: "Rental Index Analysis" },
    { href: "/document-scanner", label: "Document Scanner" },
    { href: "/property-measurement", label: "Property Measurement" },
    { href: "/interior-design-ai", label: "AI Interior Design" },
    { href: "/ai-hub", label: "AI Hub" },
  ];

  return (
    <footer className="bg-black border-t border-zinc-800">
      <div className="container mx-auto px-4 py-10 md:py-14">
        {/* Logo + Description */}
        <div className="text-center mb-10 md:mb-14">
          <Link to="/" className="inline-block">
            <JJLogoImage variant="dark" size="footer" showText={false} />
          </Link>
          <p className="text-gold text-xs uppercase tracking-[0.2em] mt-3 mb-2">Real Estate Brokerage</p>
          <p className="text-zinc-400 text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
            Real estate brokerage specializing in property sales, leasing, and holiday homes 
            across the UAE — with trusted partner introductions for legal, mortgage, and specialist services.
          </p>
        </div>

        {/* Newsletter Section - Premium Style */}
        <div className="mb-10 md:mb-14">
          <div className="max-w-xl mx-auto text-center">
            <h4 className="text-gold font-semibold text-sm uppercase tracking-[0.3em] mb-2">
              Stay in the Loop
            </h4>
            <p className="text-zinc-400 text-sm mb-4">
              Join our exclusive circle for market insights and premium opportunities
            </p>
            <form onSubmit={handleNewsletterSubmit} className="flex gap-2">
              <Input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 bg-zinc-900/50 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-gold/50 focus:ring-gold/20"
                required
              />
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="bg-gold hover:bg-gold-light text-black font-semibold px-6"
              >
                {isSubmitting ? (
                  <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                ) : (
                  <>
                    Subscribe
                    <Send className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </form>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-zinc-700 to-transparent mb-10" />

        {/* Menu + Divisions + Academy Grid - Premium Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 md:gap-12 mb-10 max-w-6xl mx-auto">
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

          {/* Our Divisions */}
          <div className="text-center md:text-left">
            <h4 className="text-gold font-semibold mb-5 text-sm uppercase tracking-[0.2em]">
              Our Divisions
            </h4>
            <div className="space-y-2.5">
              {divisions.map((div) => (
                <DivisionAccordion key={div.title} title={div.title} items={div.items} href={div.href} />
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
            <p className="text-zinc-400 text-sm leading-relaxed mb-4">
              <span className="text-white font-medium">JJ Global Capital</span> is a real estate brokerage. 
              We do not provide legal, mortgage, financial, or investment advice. Third-party services 
              (legal, mortgage, property management) are provided by{" "}
              <span className="text-gold font-semibold">independent licensed professionals</span> who contract 
              directly with clients.
            </p>
            <p className="text-zinc-500 text-xs leading-relaxed mb-4">
              All content, design, and technology on this platform are the intellectual property of 
              Jane Abou Jaoude and JJ Global Capital. Unauthorized reproduction is strictly prohibited.
            </p>
            <p className="text-zinc-500 text-xs leading-relaxed mb-4" dir="rtl">
              جي جي جلوبال كابيتال تقدم خدمات وساطة عقارية وتقديم إحالات فقط. نحن لا نقدم استشارات قانونية أو تمويلية أو استثمارية. الخدمات المقدمة من الجهات الأخرى تتم عبر جهات مستقلة ومرخصة.
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

        {/* Bottom - Copyright & Legal */}
        <div className="flex flex-col items-center gap-4 text-sm text-zinc-500">
          <div className="text-center space-y-2">
            <p className="font-medium text-white">
              © {currentYear} JJ Global Capital Real Estate Brokerage. All Rights Reserved.
            </p>
            <p className="text-xs text-zinc-600">
              Created and Developed by{" "}
              <span className="text-gold font-medium">Jane Abou Jaoude</span> | Brokerage Services Only
            </p>
            <p className="mt-2">
              Powered by{" "}
              <a
                href={CONTACT_INFO.holdingGroupUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gold hover:underline inline-flex items-center gap-1"
              >
                JJ Holding Group <ExternalLink className="w-3.5 h-3.5" />
              </a>
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
