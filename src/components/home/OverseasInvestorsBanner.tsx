import { Globe, Shield, TrendingUp, BadgeCheck, ArrowRight, Building2, Users, Sparkles, ShieldCheck, Globe2, Cpu, Layers } from "lucide-react";
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

/* Layers of the AI intelligence "cake" — bottom (data) to top (decision). */
const aiLayers = [
  { label: "Live Market Data", detail: "1,398 projects, 40+ developers, refreshed daily" },
  { label: "Verification Layer", detail: "Every listing checked against developer source" },
  { label: "AI Matching Engine", detail: "Yield, handover and payment-plan fit scored per investor" },
  { label: "Advisory Layer", detail: "Human advisors validate every AI recommendation" },
  { label: "Your Decision", detail: "One shortlist, fully explained, ready to sign remotely" },
];

const OverseasInvestorsBanner = () => {
  return (
    <section className="bg-[#FDFBF7]">
      <div className="jj-layer-2">
        {/* Badge */}
        <div className="text-center mb-6 md:mb-8">
          <span className="inline-flex items-center gap-1.5 md:gap-2 px-3 md:px-5 py-1.5 md:py-2 bg-[#F7F2EA] border border-[#064E3B]/30 rounded-full text-[10px] md:text-xs uppercase tracking-[0.15em] md:tracking-[0.2em] font-semibold">
            <Cpu className="w-3 h-3 md:w-3.5 md:h-3.5 text-[#1A1A1A]" />
            <span className="text-[#1A1A1A]">Layers of Innovation</span>
          </span>
        </div>

        {/* Hero content */}
        <div className="max-w-4xl mx-auto text-center mb-8 md:mb-10 animate-fade-in-up">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#1A1A1A] mb-4" style={{ fontFamily: "'Cormorant Garamond', 'Playfair Display', serif" }}>
            Invest in Dubai From Anywhere in the World
          </h2>
          <p className="text-[#1A1A1A] text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
            Every recommendation you see is built in layers — live market data, verification,
            AI matching and human advisory stacked on top of each other. Zero income tax,
            full foreign ownership and a 10-year Golden Visa, engineered into one decision.
          </p>
        </div>

        {/* ── Layer cake: animated stack of intelligence layers ── */}
        <div className="jj-layers-stage max-w-3xl mx-auto mb-10 md:mb-14">
          <div className="jj-layer-slab flex flex-col-reverse gap-2 md:gap-2.5">
            {aiLayers.map((layer, i) => (
              <div
                key={layer.label}
                className="jj-layer-sheen relative overflow-hidden rounded-2xl border border-[#064E3B]/25 bg-[#F7F2EA] px-4 py-3 md:px-6 md:py-4 shadow-sm animate-fade-in-up"
                style={{
                  animationDelay: `${i * 90}ms`,
                  marginLeft: `${i * 10}px`,
                  marginRight: `${(aiLayers.length - 1 - i) * 6}px`,
                }}
              >
                <div className="flex items-center gap-3">
                  <span
                    className="w-8 h-8 md:w-9 md:h-9 shrink-0 rounded-lg flex items-center justify-center text-[11px] font-bold text-white"
                    style={{ background: "linear-gradient(135deg, #064E3B 0%, #042C1C 58%, #000000 100%)" }}
                  >
                    {aiLayers.length - i}
                  </span>
                  <div className="min-w-0">
                    <div className="text-[13px] md:text-sm font-bold text-[#1A1A1A]">{layer.label}</div>
                    <div className="text-[11px] md:text-xs text-[#1A1A1A] leading-snug">{layer.detail}</div>
                  </div>
                  <Layers className="ml-auto w-4 h-4 shrink-0 text-[#064E3B]" aria-hidden />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Dubai Capital Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 max-w-4xl mx-auto mb-10 md:mb-12">
          {dubaiStats.map((s, i) => {
            const Icon = s.icon;
            return (
              <div
                key={s.label}
                className="rounded-2xl bg-[#F7F2EA] border border-[#064E3B]/25 p-4 md:p-5 text-center shadow-sm hover:shadow-md hover:border-[#064E3B]/50 transition-all duration-300 animate-fade-in-up"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div
                  className="mx-auto mb-2.5 w-9 h-9 md:w-10 md:h-10 rounded-xl flex items-center justify-center"
                  style={{ background: "linear-gradient(135deg, #064E3B 0%, #042C1C 58%, #000000 100%)" }}
                >
                  <Icon className="w-4 h-4 md:w-5 md:h-5 text-white" />
                </div>
                <div className="text-2xl md:text-3xl font-bold text-[#1A1A1A] leading-none tabular-nums">
                  {s.value}
                </div>
                <div className="mt-1.5 text-[10px] md:text-[11px] uppercase tracking-[0.14em] font-semibold text-[#1A1A1A] whitespace-nowrap">
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
              className="bg-[#F7F2EA] border border-[#064E3B]/25 rounded-2xl p-4 md:p-5 text-center hover:border-[#064E3B]/50 hover:shadow-lg transition-all duration-300 animate-fade-in-up"
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <div
                className="w-10 h-10 md:w-12 md:h-12 mx-auto rounded-xl flex items-center justify-center mb-3"
                style={{ background: "linear-gradient(135deg, #064E3B 0%, #042C1C 58%, #000000 100%)" }}
              >
                <item.icon className="w-5 h-5 md:w-6 md:h-6 text-white" />
              </div>
              <h4 className="text-[#1A1A1A] text-xs md:text-sm font-bold mb-1">{item.label}</h4>
              <p className="text-[#1A1A1A] text-[10px] md:text-xs leading-tight">{item.desc}</p>
            </div>
          ))}
        </div>

        {/* Reassurance text */}
        <div className="max-w-3xl mx-auto text-center mb-8 animate-fade-in-up">
          <p className="text-[#1A1A1A] text-xs md:text-sm italic leading-relaxed">
            "From your first inquiry to key collection — our multilingual team guides international investors through every step.
            Property selection, legal structuring, visa processing, and ongoing asset management. You don't need to be in Dubai. We are."
          </p>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-wrap justify-center gap-4 md:gap-6 mb-12 md:mb-16">
          <PearlButton to="/guides/golden-visa-uae" size="lg" leadingIcon={<Shield strokeWidth={2.2} />}>
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
