import { Link } from "react-router-dom";
import { Globe, Shield, TrendingUp, BadgeCheck, ArrowRight, Building2, Users, Sparkles, ShieldCheck, Globe2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PearlButton } from "@/components/ui/pearl-button";

const dubaiStats = [
  { value: "0%",   label: "Income Tax",    icon: Sparkles },
  { value: "10Y",  label: "Golden Visa",   icon: ShieldCheck },
  { value: "#1",   label: "Safety Rank",   icon: Globe2 },
  { value: "200+", label: "Nationalities", icon: Users },
];

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
    <section className="bg-[#FDFBF7]">
      <div className="jj-layer-2">
        {/* Badge */}
        <div className="text-center mb-6 md:mb-8">
          <span className="inline-flex items-center gap-1.5 md:gap-2 px-3 md:px-5 py-1.5 md:py-2 bg-[#F7F2EA] border border-[#B89555]/30 rounded-full text-[10px] md:text-xs uppercase tracking-[0.15em] md:tracking-[0.2em] font-semibold">
            <Globe className="w-3 h-3 md:w-3.5 md:h-3.5 text-[#1A1A1A]/70" />
            <span className="text-[#1A1A1A]">Global Investment Hub</span>
          </span>
        </div>

        {/* Hero content */}
        <div className="max-w-4xl mx-auto text-center mb-8 md:mb-10 animate-fade-in-up">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#102540] mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
            Invest in Dubai From Anywhere in the World
          </h2>
          <p className="text-[#1A1A1A]/70 text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
            Strategic location, world-class infrastructure, and long-term government execution
            make Dubai the most investable city in the region — with zero income tax, full foreign
            ownership, and a 10-year Golden Visa for qualifying investors.
          </p>
        </div>

        {/* Dubai Capital Stats — merged from former "Why Dubai" section */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 max-w-4xl mx-auto mb-10 md:mb-12">
          {dubaiStats.map((s, i) => {
            const Icon = s.icon;
            return (
              <div
                key={s.label}
                className="rounded-2xl bg-[#F7F2EA] border border-[#B89555]/40 p-4 md:p-5 text-center shadow-sm hover:shadow-md hover:border-[#B89555]/70 transition-all duration-300 animate-fade-in-up"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div className="mx-auto mb-2.5 w-9 h-9 md:w-10 md:h-10 rounded-xl bg-[#1A1A1A] flex items-center justify-center">
                  <Icon className="w-4 h-4 md:w-5 md:h-5 text-[#B89555]" />
                </div>
                <div className="text-2xl md:text-3xl font-bold text-[#1A1A1A] leading-none tabular-nums">
                  {s.value}
                </div>
                <div className="mt-1.5 text-[10px] md:text-[11px] uppercase tracking-[0.14em] font-semibold text-[#1A1A1A]/70 whitespace-nowrap">
                  {s.label}
                </div>
              </div>
            );
          })}
        </div>

        {/* Highlights Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 max-w-5xl mx-auto mb-8 md:mb-10">
          {highlights.map((item, i) => (
            <div
              key={item.label}
              className="bg-[#F7F2EA] border border-[#B89555]/30 rounded-2xl p-4 md:p-5 text-center hover:border-[#B89555]/30 hover:shadow-lg transition-all duration-300 animate-fade-in-up"
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <div className="w-10 h-10 md:w-12 md:h-12 mx-auto rounded-xl bg-[#EFE6D6] border border-[#B89555]/30 flex items-center justify-center mb-3">
                <item.icon className="w-5 h-5 md:w-6 md:h-6 text-[#1A1A1A]/70" />
              </div>
              <h4 className="text-[#1A1A1A] text-xs md:text-sm font-bold mb-1">{item.label}</h4>
              <p className="text-[#1A1A1A]/70 text-[10px] md:text-xs leading-tight">{item.desc}</p>
            </div>
          ))}
        </div>

        {/* Reassurance text */}
        <div className="max-w-3xl mx-auto text-center mb-8 animate-fade-in-up">
          <p className="text-[#1A1A1A]/70 text-xs md:text-sm italic leading-relaxed">
            "From your first inquiry to key collection — our multilingual team guides international investors through every step. 
            Property selection, legal structuring, visa processing, and ongoing asset management. You don't need to be in Dubai. We are."
          </p>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-wrap justify-center gap-4 md:gap-6 mb-12 md:mb-16">
          <PearlButton
            to="/guides/golden-visa-uae"
            size="lg"
            leadingIcon={<Shield strokeWidth={2.2} />}
          >
            Golden Visa for Investors
          </PearlButton>
          <PearlButton
            to="/investor-hub"
            size="lg"
            variant="secondary"
            leadingIcon={<TrendingUp strokeWidth={2.2} />}
            trailingIcon={<ArrowRight strokeWidth={2.2} />}
          >
            Explore Investment Options
          </PearlButton>

        </div>
      </div>
    </section>
  );
};

export default OverseasInvestorsBanner;
