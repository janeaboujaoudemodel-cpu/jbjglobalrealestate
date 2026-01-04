import { Link } from "react-router-dom";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  MapPin, Phone, Mail, 
  Building2, Briefcase, Scale, Palette, Crown 
} from "lucide-react";
import { toast } from "sonner";

const INQUIRY_FORM_URL = "https://jjglobalcapital.com/form/property-investment-inquiry-form/";
const JJ_HOLDING_URL = "https://jjholdinggroup.com";

const JJLogo = () => (
  <span className="font-bold tracking-wide text-2xl" style={{ fontFamily: "Poppins, sans-serif" }}>
    <span className="text-gold">J</span>
    <span className="text-gold mx-1">|</span>
    <span className="text-gold">J</span>
    <span className="text-white ml-2">GLOBAL CAPITAL</span>
  </span>
);

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

  // Our Divisions with children
  const divisions = [
    { 
      label: "Real Estate", 
      href: "/?status=off-plan",
      children: []
    },
    { 
      label: "Advisory", 
      href: "/services/advisory",
      children: [
        { label: "Mortgages", href: "/services/mortgages" },
        { label: "Investment Advisory", href: "/services/investment" },
        { label: "Property Management", href: "/services/management" },
        { label: "Commercial", href: "/services/commercial" },
      ]
    },
    { 
      label: "Law Firm", 
      href: "/services/law",
      children: []
    },
    { 
      label: "Design & Build", 
      href: "/services/design",
      children: [
        { label: "Architecture", href: "/services/architecture" },
        { label: "Interior Design", href: "/services/interior" },
        { label: "Fit-Out", href: "/services/fitout" },
      ]
    },
    { 
      label: "Luxury Concierge", 
      href: "/services/concierge",
      children: [
        { label: "Private Jet Charter", href: "/services/jets" },
        { label: "Helicopter Charter", href: "/services/helicopters" },
        { label: "Limousine Service", href: "/services/limousine" },
        { label: "Luxury Car Rental", href: "/services/cars" },
      ]
    },
  ];

  const quickLinks = [
    { href: "/", label: "Home" },
    { href: "/about", label: "About Us" },
    { href: "/founder", label: "Founder & Leadership" },
    { href: "/awards", label: "Awards" },
    { href: "/news", label: "UAE News & Economics" },
    { href: INQUIRY_FORM_URL, label: "Contact", external: true },
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
              <a 
                href="tel:+971565911000" 
                className="flex items-center gap-3 text-zinc-400 hover:text-gold transition-colors group"
              >
                <Phone className="w-4 h-4 text-gold" />
                <span className="group-hover:text-gold">+971 56 591 1000</span>
              </a>
              <a 
                href="mailto:Invest@JJGlobalCapital.com" 
                className="flex items-center gap-3 text-zinc-400 hover:text-gold transition-colors group"
              >
                <Mail className="w-4 h-4 text-gold" />
                <span className="group-hover:text-gold">Invest@JJGlobalCapital.com</span>
              </a>
            </div>
          </div>

          {/* Our Divisions */}
          <div>
            <h4 className="text-gold font-semibold mb-4 text-sm uppercase tracking-wider">Our Divisions</h4>
            <ul className="space-y-2">
              {divisions.map((div) => (
                <li key={div.label}>
                  <Link 
                    to={div.href}
                    className="text-zinc-400 hover:text-gold transition-colors text-sm font-medium"
                  >
                    {div.label}
                  </Link>
                  {div.children.length > 0 && (
                    <ul className="ml-3 mt-1 space-y-1">
                      {div.children.map((child) => (
                        <li key={child.label}>
                          <Link 
                            to={child.href}
                            className="text-zinc-500 hover:text-gold transition-colors text-xs"
                          >
                            {child.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-gold font-semibold mb-4 text-sm uppercase tracking-wider">Quick Links</h4>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
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

          {/* Newsletter */}
          <div>
            <h4 className="text-gold font-semibold mb-4 text-sm uppercase tracking-wider">Keep in the Loop</h4>
            <p className="text-zinc-400 text-sm mb-4">
              Subscribe for exclusive market insights and investment opportunities.
            </p>
            <div className="space-y-3">
              <Input 
                placeholder="Your email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-gold"
              />
              <div className="flex items-start gap-2">
                <Checkbox 
                  id="privacy-agree"
                  checked={agreedToPolicy}
                  onCheckedChange={(checked) => setAgreedToPolicy(checked as boolean)}
                  className="border-zinc-600 data-[state=checked]:bg-gold data-[state=checked]:border-gold mt-0.5"
                />
                <label htmlFor="privacy-agree" className="text-zinc-500 text-xs leading-tight">
                  I agree to the{" "}
                  <Link to="/privacy" className="text-gold hover:underline">Privacy Policy</Link>
                  {" "}and{" "}
                  <Link to="/terms" className="text-gold hover:underline">Terms of Service</Link>
                </label>
              </div>
              <Button 
                onClick={handleSubscribe}
                className="w-full bg-gold hover:bg-gold-dark text-black font-semibold"
              >
                Subscribe
              </Button>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-zinc-800 mb-8" />

        {/* Bottom Section */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-zinc-500">
          <div className="text-center md:text-left">
            <p>© {currentYear} JJ Global Capital. All rights reserved.</p>
            <p className="text-xs mt-1">
              Part of{" "}
              <a 
                href={JJ_HOLDING_URL} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-gold hover:underline"
              >
                JJ Holding Group
              </a>
            </p>
          </div>
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