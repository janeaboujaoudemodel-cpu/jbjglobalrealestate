import { Link } from "react-router-dom";
import NavigationTabs from "@/components/NavigationTabs";
import DeveloperGrid from "@/components/DeveloperGrid";
import WhyDubaiSection from "@/components/WhyDubaiSection";
import ServicesSection from "@/components/ServicesSection";
import { Sparkles, ArrowDown, Building2, ClipboardCheck, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

const INQUIRY_FORM_URL = "https://jjglobalcapital.com/form/property-investment-inquiry-form/";

// Property shortcut buttons
const propertyShortcuts = [
  { href: "/?status=off-plan", label: "Off-Plan Properties", icon: Building2 },
  { href: "/?status=ready", label: "Ready to Move", icon: ClipboardCheck },
  { href: "/quiz", label: "Take the Quiz", icon: Sparkles, highlight: true },
];

const Index = () => {
  return (
    <section className="relative w-full min-h-screen bg-zinc-950">
      {/* Hero Section */}
      <div className="py-12 md:py-20 relative">
        {/* Subtle gradient */}
        <div className="absolute top-0 left-0 right-0 h-[400px] pointer-events-none bg-gradient-to-b from-black/80 to-transparent" />

        <div className="relative z-10 container mx-auto px-4">
          <h1 
            className="text-white text-4xl md:text-6xl font-bold mb-4"
            style={{ fontFamily: "Poppins, sans-serif" }}
          >
            <span className="text-gold">J</span>
            <span className="text-zinc-500 mx-1">|</span>
            <span className="text-gold">J</span>
            <span className="text-white ml-3">Real Estate</span>
          </h1>
          <p className="text-zinc-400 text-lg mb-8 max-w-2xl">
            Your trusted partner for premium properties across the UAE's most exclusive communities
          </p>

          {/* Quick Access Shortcuts */}
          <div className="flex flex-wrap gap-3 mb-10">
            {propertyShortcuts.map((shortcut) => (
              <Link key={shortcut.href} to={shortcut.href}>
                <Button 
                  variant={shortcut.highlight ? "default" : "outline"}
                  className={shortcut.highlight 
                    ? "bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white border-0 shadow-lg shadow-purple-500/30" 
                    : "bg-zinc-900 border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white hover:border-gold/50"
                  }
                >
                  <shortcut.icon className="w-4 h-4 mr-2" />
                  {shortcut.label}
                  {shortcut.highlight && <ArrowDown className="w-4 h-4 ml-2" />}
                </Button>
              </Link>
            ))}
          </div>

          <NavigationTabs />
          <DeveloperGrid />
        </div>
      </div>

      {/* Why Dubai Section */}
      <WhyDubaiSection />

      {/* Services Section */}
      <ServicesSection />

      {/* Contact CTA Section */}
      <div className="container mx-auto px-4">
        <div className="text-center py-16 border-t border-zinc-800">
          <h3 className="text-2xl font-semibold text-white mb-4" style={{ fontFamily: "Poppins, sans-serif" }}>
            Ready to Invest?
          </h3>
          <p className="text-zinc-400 mb-6 max-w-xl mx-auto">
            Get personalized investment advice from our expert team
          </p>
          <a href={INQUIRY_FORM_URL} target="_blank" rel="noopener noreferrer">
            <Button className="bg-gradient-to-r from-gold to-gold-dark text-black hover:opacity-90 px-8 py-3 h-auto font-semibold">
              Contact Us
            </Button>
          </a>
        </div>
      </div>
    </section>
  );
};

export default Index;
