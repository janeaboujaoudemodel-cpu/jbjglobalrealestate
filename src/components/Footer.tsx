import { Link } from "react-router-dom";
import { useState } from "react";
import {
  MapPin,
  Phone,
  Mail,
  MessageCircle,
  ChevronDown,
  ExternalLink,
} from "lucide-react";
import { CONTACT_INFO, getWhatsAppUrl, getCallUrl, getEmailUrl } from "@/constants/stats";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

// Premium centered logo (text-based fallback). Replace with provided image asset when available.
const JJLogoLarge = () => (
  <div className="flex flex-col items-center">
    <div className="flex items-center justify-center">
      <span
        className="text-gold font-extralight text-7xl md:text-8xl lg:text-9xl"
        style={{ fontFamily: "Poppins, sans-serif" }}
      >
        J
      </span>
      <span
        className="text-white/90 mx-3 md:mx-4 font-thin text-8xl md:text-9xl lg:text-[10rem] leading-none"
        style={{ transform: "scaleY(1.58)" }}
      >
        |
      </span>
      <span
        className="text-gold font-extralight text-7xl md:text-8xl lg:text-9xl"
        style={{ fontFamily: "Poppins, sans-serif" }}
      >
        J
      </span>
    </div>

    <div
      className="mt-5 flex items-center justify-center gap-3 text-white"
      style={{ fontFamily: "Poppins, sans-serif" }}
    >
      <span className="font-medium text-base md:text-lg tracking-[0.35em]">GLOBAL</span>
      <span className="w-1.5 h-1.5 rounded-full bg-white/70" />
      <span className="font-medium text-base md:text-lg tracking-[0.35em]">CAPITAL</span>
    </div>
  </div>
);

const DivisionAccordion = ({
  title,
  items,
}: {
  title: string;
  items: { label: string; href: string }[];
}) => {
  const [isOpen, setIsOpen] = useState(false);

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

  // Our Divisions — required hierarchy
  const divisions = [
    {
      title: "Real Estate",
      items: [
        { label: "Advisory", href: CONTACT_INFO.inquiryFormUrl },
        { label: "Investment Advisory", href: CONTACT_INFO.inquiryFormUrl },
        { label: "Mortgage Advisory", href: CONTACT_INFO.inquiryFormUrl },
        { label: "Residency & Immigration", href: CONTACT_INFO.inquiryFormUrl },
        { label: "Golden Visa", href: CONTACT_INFO.inquiryFormUrl },
        { label: "Relocation Services", href: CONTACT_INFO.inquiryFormUrl },
      ],
    },
    { title: "Law Firm", items: [] },
    { title: "Design & Build", items: [] },
    { title: "Luxury Concierge", items: [] },
  ];

  // Menu — required order: Home, Founder, About, Properties, Services, Awards, News, Contact
  const menuLinks = [
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
      <div className="container mx-auto px-4 py-6 md:py-8">
        {/* Logo + Description (compact) */}
        <div className="text-center mb-6">
          <Link to="/" className="inline-block">
            <JJLogoLarge />
          </Link>
          <p className="text-zinc-400 text-sm md:text-base mt-4 max-w-2xl mx-auto leading-relaxed">
            A founder-led advisory group specializing in UAE and Dubai real estate,
            supported by a global platform of investment, advisory, legal, design,
            and concierge services.
          </p>
        </div>

        {/* Divisions + Menu on the same line (desktop) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10">
          {/* Our Divisions */}
          <div className="text-center md:text-left">
            <h4 className="text-gold font-semibold mb-3 text-sm uppercase tracking-[0.2em]">
              Our Divisions
            </h4>
            <div className="space-y-2.5">
              {divisions.map((div) => (
                <DivisionAccordion key={div.title} title={div.title} items={div.items} />
              ))}
            </div>
          </div>

          {/* Menu */}
          <div className="text-center md:text-left">
            <h4 className="text-gold font-semibold mb-3 text-sm uppercase tracking-[0.2em]">
              Menu
            </h4>
            <ul className="space-y-2">
              {menuLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-white hover:text-gold transition-colors text-base md:text-lg"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Contact details under Divisions + Menu */}
        <div className="mt-7 pt-7 border-t border-zinc-800">
          <div className="text-center md:text-left">
            <h4 className="text-gold font-semibold mb-3 text-sm uppercase tracking-[0.2em]">
              Get in Touch
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
              <div className="flex items-center justify-center md:justify-start gap-3 text-white text-base md:text-lg">
                <MapPin className="w-5 h-5 text-gold flex-shrink-0" />
                <span>{CONTACT_INFO.address}</span>
              </div>
              <a
                href={getCallUrl()}
                className="flex items-center justify-center md:justify-start gap-3 text-white hover:text-gold transition-colors text-base md:text-lg"
              >
                <Phone className="w-5 h-5 text-gold flex-shrink-0" />
                <span>{CONTACT_INFO.phone}</span>
              </a>
              <a
                href={getEmailUrl()}
                className="flex items-center justify-center md:justify-start gap-3 text-white hover:text-gold transition-colors text-base md:text-lg"
              >
                <Mail className="w-5 h-5 text-gold flex-shrink-0" />
                <span>{CONTACT_INFO.emailCapitalized}</span>
              </a>
              <a
                href={getWhatsAppUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="md:col-span-3 flex items-center justify-center md:justify-start gap-3 text-white hover:text-gold transition-colors text-base md:text-lg"
              >
                <MessageCircle className="w-5 h-5 text-gold flex-shrink-0" />
                <span>WhatsApp Us</span>
              </a>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-zinc-700 to-transparent my-6" />

        {/* Bottom */}
        <div className="flex flex-col items-center gap-3 text-sm text-zinc-500">
          <div className="text-center">
            <p>© {currentYear} JJ Global Capital. All rights reserved.</p>
            <p className="mt-1">
              Part of{" "}
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
