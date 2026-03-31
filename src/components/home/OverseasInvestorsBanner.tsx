import { Link } from "react-router-dom";
import { Globe, Shield, TrendingUp, BadgeCheck, ArrowRight, Building2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

const highlights = [
  { icon: Shield, label: "0% Income Tax", desc: "No personal income or capital gains tax in the UAE" },
  { icon: TrendingUp, label: "10–20 Year ROI", desc: "Proven appreciation with 6–10% average rental yields" },
  { icon: BadgeCheck, label: "Golden Visa Eligible", desc: "AED 2M+ property investments qualify for 10-year residency" },
  { icon: Building2, label: "Full Foreign Ownership", desc: "100% freehold ownership in designated zones" },
  { icon: Users, label: "End-to-End Support", desc: "From property selection to handover — we manage every step" },
  { icon: Globe, label: "Remote Purchase Ready", desc: "Buy from anywhere — virtual viewings, digital signing, full coordination" },
];

const OverseasInvestorsBanner = () => {
  return (
    <section className="bg-white">
      <div className="jj-layer-2">
        {/* Badge */}
        <div className="text-center mb-6 md:mb-8">
          <span className="inline-flex items-center gap-1.5 md:gap-2 px-3 md:px-5 py-1.5 md:py-2 bg-gray-100 border border-gray-300 rounded-full text-[10px] md:text-xs uppercase tracking-[0.15em] md:tracking-[0.2em] font-semibold">
            <Globe className="w-3 h-3 md:w-3.5 md:h-3.5 text-gray-600" />
            <span className="text-black">International Investors</span>
          </span>
        </div>

        {/* Hero content */}
        <div className="max-w-4xl mx-auto text-center mb-8 md:mb-12 animate-fade-in-up">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-black mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
            Invest in Dubai From Anywhere in the World
          </h2>
          <p className="text-gray-600 text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
            Whether you're in Europe, Asia, the Americas, or CIS markets — Dubai offers the world's most investor-friendly environment. 
            Zero income tax, world-class infrastructure, and a 10-year Golden Visa make it the ideal destination for wealth preservation and growth.
          </p>
        </div>

        {/* Highlights Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 max-w-5xl mx-auto mb-8 md:mb-10">
          {highlights.map((item, i) => (
            <div
              key={item.label}
              className="bg-white border border-gray-200 rounded-2xl p-4 md:p-5 text-center hover:border-gray-400 hover:shadow-lg transition-all duration-300 animate-fade-in-up"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className="w-10 h-10 md:w-12 md:h-12 mx-auto rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center mb-3">
                <item.icon className="w-5 h-5 md:w-6 md:h-6 text-gray-600" />
              </div>
              <h4 className="text-black text-xs md:text-sm font-bold mb-1">{item.label}</h4>
              <p className="text-gray-500 text-[10px] md:text-xs leading-tight">{item.desc}</p>
            </div>
          ))}
        </div>

        {/* Reassurance text */}
        <div className="max-w-3xl mx-auto text-center mb-8 animate-fade-in-up">
          <p className="text-gray-500 text-xs md:text-sm italic leading-relaxed">
            "From your first inquiry to key collection — our multilingual team guides international investors through every step. 
            Property selection, legal structuring, visa processing, and ongoing asset management. You don't need to be in Dubai. We are."
          </p>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-wrap justify-center gap-4 md:gap-6 mb-12 md:mb-16">
          <Link to="/guides/golden-visa-uae">
            <Button className="bg-black hover:bg-gray-800 text-white font-bold px-8 md:px-10 py-4 md:py-5 rounded-xl text-base md:text-lg border border-gray-800">
              <Shield className="w-5 h-5 mr-2" />
              Golden Visa for Investors
            </Button>
          </Link>
          <Link to="/investor-hub">
            <Button variant="outline" className="font-bold px-8 md:px-10 py-4 md:py-5 rounded-xl text-base md:text-lg border-2 border-gray-300 hover:border-gray-400 text-black bg-white hover:bg-gray-50">
              <TrendingUp className="w-5 h-5 mr-2" />
              Explore Investment Options
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default OverseasInvestorsBanner;
