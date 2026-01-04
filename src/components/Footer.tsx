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
import { JJLogo } from "@/components/JJLogo";
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
      title: "Real Estate",
      href: "/properties",
      items: [
        { label: "Property Advisory", href: "/properties" },
        { label: "Investment Advisory", href: "/about" },
        { label: "Mortgage Advisory", href: "/mortgage-advisory" },
        { label: "Golden Visa", href: "/concierge" },
      ],
    },
    { title: "Law Firm", href: "/services/law-firm", items: [] },
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
    { href: "/properties", label: "Properties" },
    { href: "/concierge", label: "Services" },
    { href: "/awards", label: "Awards" },
    { href: "/news", label: "News & Insights" },
    { href: "/contact", label: "Contact" },
  ];

  return (
    <footer className="bg-black border-t border-zinc-800">
      <div className="container mx-auto px-4 py-10 md:py-14">
        {/* Logo + Description */}
        <div className="text-center mb-10 md:mb-14">
          <Link to="/" className="inline-block">
            <JJLogo size="footer" />
          </Link>
          <p className="text-zinc-400 text-base md:text-lg mt-6 max-w-2xl mx-auto leading-relaxed">
            A founder-led advisory group specializing in UAE and Dubai real estate,
            supported by a global platform of investment, advisory, legal, design,
            and concierge services.
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

        {/* Menu + Divisions Grid - Premium Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-20 mb-10 max-w-4xl mx-auto">
          {/* Menu - LEFT */}
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

          {/* Our Divisions - RIGHT */}
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

        {/* Bottom */}
        <div className="flex flex-col items-center gap-3 text-sm text-zinc-500">
          <div className="text-center">
            <p>© {currentYear} JJ Global Capital. All rights reserved.</p>
            <p className="mt-1">
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
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
