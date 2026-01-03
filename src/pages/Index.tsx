import { Link } from "react-router-dom";
import NavigationTabs from "@/components/NavigationTabs";
import DeveloperGrid from "@/components/DeveloperGrid";
import WhyDubaiSection from "@/components/WhyDubaiSection";
import { Sparkles, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";

const INQUIRY_FORM_URL = "https://jjglobalcapital.com/form/property-investment-inquiry-form/";

const Index = () => {
  return (
    <section className="relative w-full min-h-screen bg-zinc-950">
      {/* Hero Section */}
      <div className="py-16 md:py-24 relative">
        {/* Subtle gradient */}
        <div className="absolute top-0 left-0 right-0 h-[400px] pointer-events-none bg-gradient-to-b from-zinc-900/50 to-transparent" />

        <div className="relative z-10 container mx-auto px-4">
          <h1 className="text-white text-4xl md:text-6xl font-bold mb-4">
            UAE Real Estate
          </h1>
          <p className="text-zinc-400 text-lg mb-8 max-w-2xl">
            Discover premium properties from the UAE's top developers across exclusive communities
          </p>

          {/* Quiz CTA - Purple/Violet theme with arrow */}
          <Link to="/quiz">
            <Button className="mb-10 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white px-6 py-3 h-auto shadow-lg shadow-purple-500/30 group">
              <Sparkles className="w-5 h-5 mr-2" />
              Take the Property Quiz
              <ArrowDown className="w-4 h-4 ml-2 group-hover:translate-y-0.5 transition-transform" />
              <span className="ml-2 text-xs opacity-70">~30 sec</span>
            </Button>
          </Link>

          <NavigationTabs />
          <DeveloperGrid />
        </div>
      </div>

      {/* Why Dubai Section */}
      <WhyDubaiSection />

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
