import { Link } from "react-router-dom";
import NavigationTabs from "@/components/NavigationTabs";
import DeveloperGrid from "@/components/DeveloperGrid";
import WhyDubaiSection from "@/components/WhyDubaiSection";
import ServicesSection from "@/components/ServicesSection";
import { Sparkles, ArrowUpRight, Building2, ClipboardCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

const INQUIRY_FORM_URL = "https://jjglobalcapital.com/form/property-investment-inquiry-form/";

// Property shortcut buttons (excluding AI CTA which is separate)
const propertyShortcuts = [
  { href: "/?status=off-plan", label: "Off-Plan Properties", icon: Building2 },
  { href: "/?status=ready", label: "Ready to Move", icon: ClipboardCheck },
];

const Index = () => {
  return (
    <section className="relative w-full min-h-screen bg-[hsl(var(--premium-bg))]">
      {/* Hero Section */}
      <div className="py-12 md:py-20 relative">
        {/* Subtle gradient */}
        <div className="absolute top-0 left-0 right-0 h-[400px] pointer-events-none bg-gradient-to-b from-black/80 to-transparent" />

        <div className="relative z-10 container mx-auto px-4">
          <h1 
            className="text-white text-4xl md:text-6xl font-bold mb-4"
            style={{ fontFamily: "Poppins, sans-serif" }}
          >
            UAE Real Estate
          </h1>
          <p className="text-zinc-400 text-lg mb-8 max-w-2xl">
            Your trusted partner for premium properties across the UAE's most exclusive communities
          </p>

          {/* Quick Access Shortcuts */}
          <div className="flex flex-wrap gap-3 mb-6">
            {propertyShortcuts.map((shortcut) => (
              <Link key={shortcut.href} to={shortcut.href}>
                <Button 
                  variant="outline"
                  className="bg-zinc-900/60 border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white hover:border-gold/50 h-12 px-6"
                >
                  <shortcut.icon className="w-4 h-4 mr-2" />
                  {shortcut.label}
                </Button>
              </Link>
            ))}
          </div>

          {/* Large Purple AI CTA - Full Width */}
          <Link to="/quiz" className="block mb-10">
            <div className="w-full bg-gradient-to-r from-purple-600 via-purple-500 to-violet-600 hover:from-purple-500 hover:via-purple-400 hover:to-violet-500 rounded-xl p-6 md:p-8 transition-all duration-300 shadow-2xl shadow-purple-500/30 hover:shadow-purple-500/50 group cursor-pointer">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 md:w-16 md:h-16 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                    <Sparkles className="w-7 h-7 md:w-8 md:h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-white text-xl md:text-2xl font-bold" style={{ fontFamily: "Poppins, sans-serif" }}>
                      Let AI Choose Your Home
                    </h3>
                    <p className="text-purple-100 text-sm md:text-base mt-1">
                      Complimentary personalized property matching
                    </p>
                  </div>
                </div>
                <div className="hidden sm:flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2 group-hover:bg-white/30 transition-colors">
                  <span className="text-white font-medium">Start Now</span>
                  <ArrowUpRight className="w-5 h-5 text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </div>
              </div>
            </div>
          </Link>

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
