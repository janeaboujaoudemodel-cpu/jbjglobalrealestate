import { Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  MapPin, Phone, Mail, 
  Building2, Briefcase, Scale, Palette, Crown 
} from "lucide-react";

const INQUIRY_FORM_URL = "https://jjglobalcapital.com/form/property-investment-inquiry-form/";

const JJLogo = () => (
  <span className="font-bold tracking-wide text-xl" style={{ fontFamily: "Poppins, sans-serif" }}>
    <span className="text-gold">J</span>
    <span className="text-gold mx-1">|</span>
    <span className="text-gold">J</span>
    <span className="text-white ml-2">GLOBAL CAPITAL</span>
  </span>
);

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const mainLinks = [
    { href: "/", label: "Home" },
    { href: "/about", label: "About Us" },
    { href: "/awards", label: "Awards" },
    { href: "/news", label: "UAE News & Economics" },
    { href: INQUIRY_FORM_URL, label: "Contact", external: true },
  ];

  const divisions = [
    { href: "/?status=off-plan", label: "Real Estate", icon: Building2 },
    { href: "/services/advisory", label: "Real Estate Advisory", icon: Briefcase },
    { href: "/services/law", label: "Law Firm", icon: Scale },
    { href: "/services/design", label: "Design & Build", icon: Palette },
    { href: "/services/concierge", label: "Luxury Concierge", icon: Crown },
  ];

  const advisoryLinks = [
    { href: "/services/mortgages", label: "Mortgages" },
    { href: "/services/investment", label: "Investment Advisory" },
    { href: "/services/management", label: "Property Management" },
    { href: "/services/commercial", label: "Commercial" },
  ];

  const conciergeLinks = [
    { href: "/services/jets", label: "Private Jet Charter" },
    { href: "/services/helicopters", label: "Helicopter Charter" },
    { href: "/services/limousine", label: "Limousine Service" },
    { href: "/services/cars", label: "Luxury Car Rental" },
  ];

  return (
    <footer className="bg-black border-t border-zinc-800">
      <div className="container mx-auto px-4 py-16">
        {/* Top Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          {/* Logo & Contact */}
          <div className="lg:col-span-1">
            <Link to="/" className="inline-block mb-6">
              <JJLogo />
            </Link>
            <p className="text-zinc-400 text-sm mb-6 leading-relaxed">
              Your trusted partner for premium investments across the UAE's most exclusive opportunities.
            </p>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-3 text-zinc-400">
                <MapPin className="w-4 h-4 mt-0.5 text-gold" />
                <span>Headquartered in Downtown Dubai,<br />United Arab Emirates</span>
              </div>
              <div className="flex items-center gap-3 text-zinc-400">
                <Phone className="w-4 h-4 text-gold" />
                <span>+971-56-591-1000</span>
              </div>
              <div className="flex items-center gap-3 text-zinc-400">
                <Mail className="w-4 h-4 text-gold" />
                <span>invest@jjglobalcapital.com</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Quick Links</h4>
            <ul className="space-y-2">
              {mainLinks.map((link) => (
                <li key={link.href}>
                  {link.external ? (
                    <a 
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-zinc-400 hover:text-gold transition-colors text-sm"
                    >
                      {link.label}
                    </a>
                  ) : (
                    <Link 
                      to={link.href}
                      className="text-zinc-400 hover:text-gold transition-colors text-sm"
                    >
                      {link.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Our Divisions */}
          <div>
            <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Our Divisions</h4>
            <ul className="space-y-2">
              {divisions.map((div) => (
                <li key={div.href}>
                  <Link 
                    to={div.href}
                    className="flex items-center gap-2 text-zinc-400 hover:text-gold transition-colors text-sm"
                  >
                    <div.icon className="w-3.5 h-3.5" />
                    {div.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Keep in the Loop</h4>
            <p className="text-zinc-400 text-sm mb-4">
              Subscribe for exclusive market insights and investment opportunities.
            </p>
            <div className="flex gap-2">
              <Input 
                placeholder="Your email" 
                className="bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-gold"
              />
              <Button className="bg-gold hover:bg-gold-dark text-black font-semibold px-6 whitespace-nowrap">
                Subscribe
              </Button>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-zinc-800 mb-8" />

        {/* Bottom Section */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-zinc-500">
          <p>© {currentYear} JJ Global Capital. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link to="/privacy" className="hover:text-gold transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-gold transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
