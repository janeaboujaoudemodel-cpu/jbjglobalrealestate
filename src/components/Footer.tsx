import { Link } from "react-router-dom";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  MapPin, Phone, Mail, ArrowRight, MessageCircle, ChevronDown, ExternalLink
} from "lucide-react";
import { toast } from "sonner";
import { CONTACT_INFO, getWhatsAppUrl, getCallUrl, getEmailUrl } from "@/constants/stats";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

// Premium centered logo - larger with refined thin divider
const JJLogoLarge = () => (
  <div className="flex flex-col items-center">
    <div className="flex items-center justify-center">
      <span className="text-[#A8925A] font-extralight text-7xl md:text-8xl lg:text-9xl" style={{ fontFamily: "Poppins, sans-serif" }}>J</span>
      <span className="text-white/90 mx-4 md:mx-6 font-thin text-8xl md:text-9xl lg:text-[10rem] leading-none" style={{ transform: 'scaleY(1.6)' }}>|</span>
      <span className="text-[#A8925A] font-extralight text-7xl md:text-8xl lg:text-9xl" style={{ fontFamily: "Poppins, sans-serif" }}>J</span>
    </div>
    <span className="text-white font-light text-xl md:text-2xl lg:text-3xl tracking-[0.4em] mt-6" style={{ fontFamily: "Poppins, sans-serif" }}>
      GLOBAL CAPITAL
    </span>
  </div>
);

// Division accordion item
const DivisionAccordion = ({ 
  title, 
  items, 
  defaultOpen = false 
}: { 
  title: string; 
  items: { label: string; href: string }[];
  defaultOpen?: boolean;
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  
  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="flex items-center gap-2 text-white hover:text-[#A8925A] transition-colors text-sm w-full justify-center md:justify-start group">
        {title}
        <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-2 space-y-1.5 pl-4 border-l border-zinc-800">
        {items.map((item) => (
          <Link
            key={item.label}
            to={item.href}
            className="block text-zinc-500 hover:text-[#A8925A] transition-colors text-xs"
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
  const [agreedToPolicy, setAgreedToPolicy] = useState(false);

  const handleSubscribe = () => {
    if (!email) {
      toast.error("Please enter your email");
      return;
    }
    if (!agreedToPolicy) {
      toast.error("Please agree to the Privacy Policy");
      return;
    }
    toast.success("Thank you for subscribing!");
    setEmail("");
    setAgreedToPolicy(false);
  };

  // Quick shortcuts
  const shortcuts = [
    { href: "/properties?status=off-plan", label: "Off-Plan Properties" },
    { href: "/properties?status=ready", label: "Ready to Move" },
    { href: "/quiz", label: "AI Home Finder" },
    { href: "/mortgage-calculator", label: "Mortgage Calculator" },
    { href: "/contact", label: "Contact Us" },
  ];

  // Our Divisions with correct hierarchy
  const divisions = [
    { 
      title: "Real Estate", 
      items: []
    },
    { 
      title: "Advisory", 
      items: [
        { label: "Investment Advisory", href: CONTACT_INFO.inquiryFormUrl },
        { label: "Mortgage Advisory", href: CONTACT_INFO.inquiryFormUrl },
        { label: "Residency & Immigration", href: CONTACT_INFO.inquiryFormUrl },
        { label: "Golden Visa", href: CONTACT_INFO.inquiryFormUrl },
        { label: "Relocation Services", href: CONTACT_INFO.inquiryFormUrl },
      ]
    },
    { 
      title: "Law Firm", 
      items: [
        { label: "Real Estate Law", href: CONTACT_INFO.inquiryFormUrl },
        { label: "Corporate Law", href: CONTACT_INFO.inquiryFormUrl },
        { label: "Contract Review", href: CONTACT_INFO.inquiryFormUrl },
      ]
    },
    { 
      title: "Design & Build", 
      items: [
        { label: "Architecture", href: CONTACT_INFO.inquiryFormUrl },
        { label: "Interior Design", href: CONTACT_INFO.inquiryFormUrl },
        { label: "Fit-Out", href: CONTACT_INFO.inquiryFormUrl },
      ]
    },
    { 
      title: "Luxury Concierge", 
      items: [
        { label: "Private Jet Charter", href: CONTACT_INFO.inquiryFormUrl },
        { label: "Yacht Charter", href: CONTACT_INFO.inquiryFormUrl },
        { label: "Limousine Services", href: CONTACT_INFO.inquiryFormUrl },
        { label: "VIP Experiences", href: CONTACT_INFO.inquiryFormUrl },
      ]
    },
  ];

  // About links - Updated order: Home, Founder, About, Properties, Services, Awards, News, Contact
  const aboutLinks = [
    { href: "/", label: "Home" },
    { href: "/founder", label: "Founder & Leadership" },
    { href: "/about", label: "About Us" },
    { href: "/properties", label: "Properties" },
    { href: "/#services", label: "Services" },
    { href: "/awards", label: "Awards" },
    { href: "/news", label: "News & Insights" },
    { href: "/contact", label: "Contact" },
  ];

  return (
    <footer className="bg-black border-t border-zinc-800">
      {/* Main Footer Content - Compact */}
      <div className="container mx-auto px-4 py-12 md:py-16">
        
        {/* Logo Section - Full Width Centered */}
        <div className="text-center mb-12">
          <Link to="/" className="inline-block">
            <JJLogoLarge />
          </Link>
          <p className="text-zinc-500 text-sm mt-6 max-w-lg mx-auto leading-relaxed">
            A founder-led advisory group specializing in UAE and Dubai real estate, supported by a global platform of investment, advisory, legal, design, and concierge services.
          </p>
        </div>

        {/* Shortcuts Bar */}
        <div className="flex flex-wrap justify-center gap-2 md:gap-3 mb-12">
          {shortcuts.map((shortcut) => (
            <Link
              key={shortcut.href}
              to={shortcut.href}
              className="inline-flex items-center gap-2 bg-zinc-900 hover:bg-[#A8925A]/10 border border-zinc-800 hover:border-[#A8925A]/30 text-white text-xs px-3 py-2 rounded-full transition-all duration-300"
            >
              {shortcut.label}
              <ArrowRight className="w-3 h-3" />
            </Link>
          ))}
        </div>

        {/* Three Column Grid - Horizontal */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          
          {/* Our Divisions */}
          <div className="text-center md:text-left">
            <h4 className="text-[#A8925A] font-semibold mb-4 text-xs uppercase tracking-[0.2em]">
              Our Divisions
            </h4>
            <div className="space-y-3">
              {divisions.map((div) => (
                div.items.length > 0 ? (
                  <DivisionAccordion key={div.title} title={div.title} items={div.items} />
                ) : (
                  <Link 
                    key={div.title}
                    to="/properties"
                    className="block text-white hover:text-[#A8925A] transition-colors text-sm"
                  >
                    {div.title}
                  </Link>
                )
              ))}
            </div>
          </div>

          {/* About */}
          <div className="text-center md:text-left">
            <h4 className="text-[#A8925A] font-semibold mb-4 text-xs uppercase tracking-[0.2em]">
              About
            </h4>
            <ul className="space-y-2">
              {aboutLinks.map((link) => (
                <li key={link.href}>
                  <Link 
                    to={link.href}
                    className="text-white hover:text-[#A8925A] transition-colors text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div className="text-center md:text-left">
            <h4 className="text-[#A8925A] font-semibold mb-4 text-xs uppercase tracking-[0.2em]">
              Get in Touch
            </h4>
            <div className="space-y-3">
              <div className="flex items-center justify-center md:justify-start gap-3 text-white text-sm">
                <MapPin className="w-4 h-4 text-[#A8925A] flex-shrink-0" />
                <span>{CONTACT_INFO.address}</span>
              </div>
              <a 
                href={getCallUrl()} 
                className="flex items-center justify-center md:justify-start gap-3 text-white hover:text-[#A8925A] transition-all text-sm group"
              >
                <Phone className="w-4 h-4 text-[#A8925A] flex-shrink-0 group-hover:scale-110 transition-transform" />
                <span>{CONTACT_INFO.phone}</span>
              </a>
              <a 
                href={getEmailUrl()} 
                className="flex items-center justify-center md:justify-start gap-3 text-white hover:text-[#A8925A] transition-all text-sm group"
              >
                <Mail className="w-4 h-4 text-[#A8925A] flex-shrink-0 group-hover:scale-110 transition-transform" />
                <span>{CONTACT_INFO.emailCapitalized}</span>
              </a>
              <a 
                href={getWhatsAppUrl()} 
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center md:justify-start gap-3 text-white hover:text-green-400 transition-all text-sm group"
              >
                <MessageCircle className="w-4 h-4 text-green-500 flex-shrink-0 group-hover:scale-110 transition-transform" />
                <span>WhatsApp Us</span>
              </a>
            </div>
          </div>
        </div>

        {/* Newsletter Section - Compact */}
        <div className="max-w-md mx-auto text-center mb-10">
          <h4 className="text-[#A8925A] font-semibold mb-3 text-xs uppercase tracking-[0.2em]">
            Keep in the Loop
          </h4>
          <div className="flex gap-2">
            <Input 
              placeholder="Your email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-[#A8925A] text-sm"
            />
            <Button 
              onClick={handleSubscribe}
              className="bg-[#A8925A] hover:bg-[#A8925A]/90 text-black font-semibold px-6"
            >
              Subscribe
            </Button>
          </div>
          <div className="flex items-center justify-center gap-2 mt-3">
            <Checkbox 
              id="privacy-agree"
              checked={agreedToPolicy}
              onCheckedChange={(checked) => setAgreedToPolicy(checked as boolean)}
              className="border-zinc-600 data-[state=checked]:bg-[#A8925A] data-[state=checked]:border-[#A8925A]"
            />
            <label htmlFor="privacy-agree" className="text-zinc-500 text-xs">
              I agree to the{" "}
              <Link to="/privacy" className="text-[#A8925A] hover:underline">Privacy Policy</Link>
            </label>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-zinc-700 to-transparent mb-6" />

        {/* Bottom Section */}
        <div className="flex flex-col items-center gap-3 text-xs text-zinc-500">
          <div className="text-center">
            <p>© {currentYear} JJ Global Capital. All rights reserved.</p>
            <p className="mt-1">
              Part of{" "}
              <a 
                href={CONTACT_INFO.holdingGroupUrl} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-[#A8925A] hover:underline inline-flex items-center gap-1"
              >
                JJ Holding Group <ExternalLink className="w-3 h-3" />
              </a>
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/privacy" className="hover:text-[#A8925A] transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-[#A8925A] transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;