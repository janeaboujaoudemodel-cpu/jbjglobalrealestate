import { Link } from "react-router-dom";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  MapPin, Phone, Mail, ArrowRight, Building2
} from "lucide-react";
import { toast } from "sonner";

const INQUIRY_FORM_URL = "https://jjglobalcapital.com/form/property-investment-inquiry-form/";
const JJ_HOLDING_URL = "https://jjholdinggroup.com";

// Premium centered logo - larger and more prominent
const JJLogoLarge = () => (
  <div className="flex flex-col items-center">
    <span className="font-bold tracking-widest text-4xl md:text-5xl lg:text-6xl" style={{ fontFamily: "Poppins, sans-serif" }}>
      <span className="text-gold">J</span>
      <span className="text-white mx-2">|</span>
      <span className="text-gold">J</span>
    </span>
    <span className="text-white text-lg md:text-xl lg:text-2xl tracking-[0.4em] mt-2" style={{ fontFamily: "Poppins, sans-serif" }}>
      GLOBAL CAPITAL
    </span>
  </div>
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

  // Quick shortcuts
  const shortcuts = [
    { href: "/?status=off-plan", label: "Off-Plan Properties" },
    { href: "/?status=ready", label: "Ready to Move" },
    { href: "/quiz", label: "AI Home Finder" },
    { href: "/mortgage-calculator", label: "Mortgage Calculator" },
    { href: "/contact", label: "Contact Us" },
  ];

  // Our Divisions
  const divisions = [
    { label: "Real Estate", href: "/?status=off-plan" },
    { label: "Advisory", href: "/services/advisory" },
    { label: "Law Firm", href: "/services/law" },
    { label: "Design & Build", href: "/services/design" },
    { label: "Luxury Concierge", href: "/services/concierge" },
  ];

  // About links
  const aboutLinks = [
    { href: "/", label: "Home" },
    { href: "/about", label: "About Us" },
    { href: "/founder", label: "Founder & Leadership" },
    { href: "/awards", label: "Awards" },
    { href: "/news", label: "News & Insights" },
  ];

  return (
    <footer className="bg-black border-t border-zinc-800">
      {/* Main Footer Content */}
      <div className="container mx-auto px-4 py-16 md:py-20">
        
        {/* Logo Section - Full Width Centered */}
        <div className="text-center mb-16 md:mb-20">
          <Link to="/" className="inline-block">
            <JJLogoLarge />
          </Link>
          <p className="text-zinc-500 text-sm mt-6 max-w-md mx-auto">
            Your trusted partner for premium real estate investments across the UAE's most exclusive opportunities.
          </p>
        </div>

        {/* Shortcuts Bar */}
        <div className="flex flex-wrap justify-center gap-3 md:gap-4 mb-16 md:mb-20">
          {shortcuts.map((shortcut) => (
            <Link
              key={shortcut.href}
              to={shortcut.href}
              className="inline-flex items-center gap-2 bg-zinc-900 hover:bg-gold/10 border border-zinc-800 hover:border-gold/30 text-white text-sm px-4 py-2.5 rounded-full transition-all duration-300"
            >
              {shortcut.label}
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          ))}
        </div>

        {/* Three Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8 lg:gap-16 mb-16 md:mb-20">
          
          {/* Our Divisions */}
          <div className="text-center">
            <h4 className="text-gold font-semibold mb-6 text-sm uppercase tracking-[0.2em]">
              Our Divisions
            </h4>
            <ul className="space-y-3">
              {divisions.map((div) => (
                <li key={div.label}>
                  <Link 
                    to={div.href}
                    className="text-white hover:text-gold transition-colors text-sm"
                  >
                    {div.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* About */}
          <div className="text-center">
            <h4 className="text-gold font-semibold mb-6 text-sm uppercase tracking-[0.2em]">
              About
            </h4>
            <ul className="space-y-3">
              {aboutLinks.map((link) => (
                <li key={link.href}>
                  <Link 
                    to={link.href}
                    className="text-white hover:text-gold transition-colors text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div className="text-center">
            <h4 className="text-gold font-semibold mb-6 text-sm uppercase tracking-[0.2em]">
              Get in Touch
            </h4>
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-3 text-white text-sm">
                <MapPin className="w-4 h-4 text-gold flex-shrink-0" />
                <span>Downtown Dubai, UAE</span>
              </div>
              <a 
                href="tel:+971565911000" 
                className="flex items-center justify-center gap-3 text-white hover:text-gold transition-colors text-sm"
              >
                <Phone className="w-4 h-4 text-gold flex-shrink-0" />
                <span>+971 56 591 1000</span>
              </a>
              <a 
                href="mailto:Invest@JJGlobalCapital.com" 
                className="flex items-center justify-center gap-3 text-white hover:text-gold transition-colors text-sm"
              >
                <Mail className="w-4 h-4 text-gold flex-shrink-0" />
                <span>Invest@JJGlobalCapital.com</span>
              </a>
            </div>
          </div>
        </div>

        {/* Newsletter Section */}
        <div className="max-w-md mx-auto text-center mb-16 md:mb-20">
          <h4 className="text-gold font-semibold mb-4 text-sm uppercase tracking-[0.2em]">
            Keep in the Loop
          </h4>
          <p className="text-white text-sm mb-6">
            Subscribe for exclusive market insights and investment opportunities.
          </p>
          <div className="space-y-4">
            <Input 
              placeholder="Your email address" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-gold text-center"
            />
            <div className="flex items-start justify-center gap-2">
              <Checkbox 
                id="privacy-agree"
                checked={agreedToPolicy}
                onCheckedChange={(checked) => setAgreedToPolicy(checked as boolean)}
                className="border-zinc-600 data-[state=checked]:bg-gold data-[state=checked]:border-gold mt-0.5"
              />
              <label htmlFor="privacy-agree" className="text-zinc-400 text-xs leading-tight text-left">
                I agree to the{" "}
                <Link to="/privacy" className="text-gold hover:underline">Privacy Policy</Link>
                {" "}and{" "}
                <Link to="/terms" className="text-gold hover:underline">Terms of Service</Link>
              </label>
            </div>
            <Button 
              onClick={handleSubscribe}
              className="w-full bg-gold hover:bg-gold/90 text-black font-semibold"
            >
              Subscribe
            </Button>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-zinc-700 to-transparent mb-8" />

        {/* Bottom Section */}
        <div className="flex flex-col items-center gap-4 text-sm text-zinc-500">
          <div className="text-center">
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
