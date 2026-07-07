import { Building2, Leaf, Route, Sparkles, Handshake, Check } from "lucide-react";
// Visuals mirrored 1:1 from the developer brochure — same photograph used on
// each corresponding slide of the AMRA English Factsheet.
import brochureEmiratesRoad from "@/assets/amra-brochure/brochure-emirates-road.jpg";      // Slide: UAE Road Infrastructure
import brochureInvestorPath from "@/assets/amra-brochure/brochure-investor-path.jpg";      // Slide: Investor Proposition
import brochureCitiApp from "@/assets/amra-brochure/brochure-citi-app.jpg";                // Slide: Citi Developers App / AMRA BNB
import brochureDesignArches from "@/assets/amra-brochure/brochure-design-ethos-arches.jpg";// Slide: Design Ethos & Partners
import brochureYacht from "@/assets/amra-brochure/brochure-yacht-partnerships.jpg";        // Slide: Brand Partnerships
import seaTurtles from "@/assets/amra-brochure/sea-turtles.jpg";                            // UAQ Blue Carbon zone

/**
 * Amra-only fact panel — content is quoted verbatim from the AMRA English Factsheet
 * (developer document). Rendered only for the Amra project on Project Detail.
 * Visual standard: emerald premium surfaces + supporting photography from the brochure.
 */

const EMERALD = "linear-gradient(135deg,#064E3B 0%,#042C1C 58%,#000000 100%)";

const bnbFeatures = [
  "Switch short-stay renting on or off anytime",
  "Choose which nights to rent; block personal stays in one tap",
  "One-stop management across Airbnb, holiday-home partners & Amra portals",
  "Optional smart pricing based on demand trends",
  "Income dashboard for bookings, nightly rates & payouts",
  "Guest KYC and concierge-managed check-in / check-out",
];

const sustainabilityInitiatives = [
  "Gardens & vertical green façades",
  "Solar farming on the rooftop",
  "Seawater cooling & pool water re-use",
  "Energy-generating jogging track",
  "Energy-efficient appliances & LED lighting",
  "High-performance insulation & water-saving fixtures",
  "Natural ventilation via skylights & cross-breezes",
  "Green roofs & living walls",
  "Smart-home energy management",
];

const designPartners = [
  "1508 London",
  "ARGENT",
  "TRUSH Design",
  "Design Nomad",
  "HSI Design Group",
  "THX",
  "Tangent Landscaping",
];

const brandPartners = [
  { name: "Xclusive Boat Club", role: "Maritime Partner" },
  { name: "Eden Gallery", role: "Art Partner" },
  { name: "Eden One", role: "Wellness Partner" },
  { name: "Blue Coral Concept", role: "F&B Partner" },
  { name: "Valor Hospitality", role: "Hospitality & Maintenance Partner" },
  { name: "Spinneys", role: "Supermarket Partner" },
  { name: "Life Pharmacy", role: "Pharmacy Partner" },
  { name: "Venus", role: "Beauty Clinic Partner" },
];

interface Props {
  projectName: string;
}

function EmeraldCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-2xl overflow-hidden border border-[#B89555]/40 shadow-[0_18px_50px_-30px_rgba(4,44,28,0.55)] ${className}`}
      style={{ background: EMERALD }}
      data-surface="emerald"
      data-no-contrast-guard
    >
      {children}
    </div>
  );
}

function SectionEyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="text-[10px] uppercase tracking-[0.36em] font-semibold mb-2"
      style={{ color: "#E9D9A8", WebkitTextFillColor: "#E9D9A8" }}
    >
      {children}
    </p>
  );
}

export default function AmraFactSheetInsights({ projectName }: Props) {
  if (!/amra/i.test(projectName)) return null;

  return (
    <div className="mb-14 scroll-mt-40 space-y-6" id="amra-factsheet-insights">
      {/* 1. Amra BNB — Investor management */}
      <EmeraldCard>
        <div className="grid grid-cols-1 lg:grid-cols-[0.85fr_1.15fr]">
          <div className="relative min-h-[280px] lg:min-h-[420px]">
            <img
              src={brochureInvestorPath}
              alt="Amra brochure — investor arrival through palm-lined path (Investor Proposition slide)"
              className="absolute inset-0 w-full h-full object-cover"
              loading="lazy"
              decoding="async"
            />
            <div className="absolute inset-0 bg-gradient-to-tr from-black/55 via-transparent to-transparent" />
            <div className="absolute bottom-4 left-4">
              <img
                src={brochureCitiApp}
                alt="Amra brochure — Citi Developers App / AMRA BNB management slide"
                className="w-28 h-20 md:w-36 md:h-24 object-cover rounded-md border border-white/40 shadow-lg"
                loading="lazy"
              />
            </div>
          </div>
          <div className="p-6 md:p-8">
            <div className="flex items-start gap-3 mb-3">
              <div className="w-10 h-10 rounded-full border border-[#E9D9A8]/40 flex items-center justify-center" style={{ background: "rgba(255,255,255,0.08)" }}>
                <Building2 className="w-5 h-5" style={{ color: "#E9D9A8" }} />
              </div>
              <div>
                <SectionEyebrow>Investor Proposition</SectionEyebrow>
                <h3 className="text-2xl md:text-[26px] font-semibold" style={{ color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" }}>
                  Amra BNB — Integrated Rental Facility
                </h3>
              </div>
            </div>
            <p className="text-sm md:text-[15px] leading-relaxed mb-5" style={{ color: "rgba(255,255,255,0.85)", WebkitTextFillColor: "rgba(255,255,255,0.85)" }}>
              Amra BNB is the developer-operated short-stay platform for owners at Amra.
              Listings are distributed across Airbnb, holiday-home partners and Amra's own
              portals and controlled from the Citi Developers App.
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {bnbFeatures.map((f) => (
                <div
                  key={f}
                  className="flex items-start gap-2 rounded-md border border-[#E9D9A8]/25 px-3 py-2 text-sm font-medium"
                  style={{ background: "rgba(255,255,255,0.06)", color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" }}
                >
                  <Check className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: "#E9D9A8" }} />
                  <span>{f}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </EmeraldCard>

      {/* 2. Emirates Road AED 750M */}
      <EmeraldCard>
        <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="p-6 md:p-8">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-full border border-[#E9D9A8]/40 flex items-center justify-center" style={{ background: "rgba(255,255,255,0.08)" }}>
                <Route className="w-5 h-5" style={{ color: "#E9D9A8" }} />
              </div>
              <div>
                <SectionEyebrow>UAE Road Infrastructure</SectionEyebrow>
                <h3 className="text-2xl md:text-[26px] font-semibold" style={{ color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" }}>
                  AED 750 M Emirates Road Enhancement
                </h3>
                <p className="text-xs uppercase tracking-[0.24em] mt-1" style={{ color: "#E9D9A8" }}>
                  Faster access to Amra
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-5">
              <div className="rounded-lg border border-[#E9D9A8]/30 p-4" style={{ background: "rgba(255,255,255,0.06)" }}>
                <p className="text-3xl md:text-4xl font-bold" style={{ color: "#E9D9A8" }}>65%</p>
                <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.78)" }}>Travel capacity increase by 2027</p>
              </div>
              <div className="rounded-lg border border-[#E9D9A8]/30 p-4" style={{ background: "rgba(255,255,255,0.06)" }}>
                <p className="text-3xl md:text-4xl font-bold" style={{ color: "#E9D9A8" }}>-45%</p>
                <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.78)" }}>Journey times between Dubai, UAQ & RAK</p>
              </div>
            </div>
            <ul className="space-y-2 text-sm" style={{ color: "rgba(255,255,255,0.88)", WebkitTextFillColor: "rgba(255,255,255,0.88)" }}>
              <li className="flex gap-2"><Sparkles className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: "#E9D9A8" }} /><span>Federal highway widening from Dubai to Umm Al Quwain</span></li>
              <li className="flex gap-2"><Sparkles className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: "#E9D9A8" }} /><span>Amra positioned as a residential, tourism & investment destination</span></li>
              <li className="flex gap-2"><Sparkles className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: "#E9D9A8" }} /><span>On-property mobility: yachts limo service, private-marina yacht deck, heli / air-taxi landing pad</span></li>
            </ul>
          </div>
          <div className="relative min-h-[280px] lg:min-h-[420px]">
            <img
              src={brochureEmiratesRoad}
              alt="Amra brochure — Emirates Road interchange at night (UAE Road Infrastructure slide)"
              className="absolute inset-0 w-full h-full object-cover"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-l from-transparent to-black/40" />
          </div>
        </div>
      </EmeraldCard>

      {/* 3. Sustainability & Regenerative */}
      <EmeraldCard>
        <div className="grid grid-cols-1 lg:grid-cols-[0.85fr_1.15fr]">
          <div className="relative min-h-[260px] lg:min-h-[480px]">
            <img
              src={seaTurtles}
              alt="Umm Al Quwain sea turtles — Blue Carbon Zone biodiversity"
              className="absolute inset-0 w-full h-full object-cover"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-tr from-black/55 via-transparent to-transparent" />
            <div className="absolute bottom-4 left-4">
              <span
                className="text-[10px] uppercase tracking-[0.28em] font-semibold px-3 py-1 rounded-full border"
                style={{ color: "#FFFFFF", borderColor: "rgba(233,217,168,0.55)", background: "rgba(4,44,28,0.55)" }}
              >
                Blue Carbon Zone · UAQ
              </span>
            </div>
          </div>
          <div className="p-6 md:p-8">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-full border border-[#E9D9A8]/40 flex items-center justify-center" style={{ background: "rgba(255,255,255,0.08)" }}>
                <Leaf className="w-5 h-5" style={{ color: "#E9D9A8" }} />
              </div>
              <div>
                <SectionEyebrow>Sustainability & Regenerative</SectionEyebrow>
                <h3 className="text-2xl md:text-[26px] font-semibold" style={{ color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" }}>
                  Designed to meet a minimum of seven sustainability initiatives
                </h3>
              </div>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {sustainabilityInitiatives.map((item) => (
                <div
                  key={item}
                  className="flex items-start gap-2 rounded-md border border-[#E9D9A8]/25 px-3 py-2 text-sm"
                  style={{ background: "rgba(255,255,255,0.06)", color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" }}
                >
                  <Leaf className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: "#E9D9A8" }} />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </EmeraldCard>

      {/* 4. Design Ethos & Partners */}
      <EmeraldCard>
        <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="p-6 md:p-8">
            <div className="flex items-start gap-3 mb-5">
              <div className="w-10 h-10 rounded-full border border-[#E9D9A8]/40 flex items-center justify-center" style={{ background: "rgba(255,255,255,0.08)" }}>
                <Handshake className="w-5 h-5" style={{ color: "#E9D9A8" }} />
              </div>
              <div>
                <SectionEyebrow>Design Ethos & Partners</SectionEyebrow>
                <h3 className="text-2xl md:text-[26px] font-semibold" style={{ color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" }}>
                  Design studios & brand partners at Amra
                </h3>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <p className="text-[11px] uppercase tracking-[0.28em] font-semibold mb-3" style={{ color: "#E9D9A8" }}>
                  Design Partners
                </p>
                <ul className="space-y-1.5">
                  {designPartners.map((studio) => (
                    <li key={studio} className="flex items-center gap-2 text-sm" style={{ color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" }}>
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#E9D9A8" }} />
                      <span className="font-semibold">{studio}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-[0.28em] font-semibold mb-3" style={{ color: "#E9D9A8" }}>
                  Brand Partnerships
                </p>
                <ul className="space-y-2">
                  {brandPartners.map((p) => (
                    <li key={p.name} className="flex items-start justify-between gap-3 text-sm border-b border-[#E9D9A8]/15 pb-1.5 last:border-0">
                      <span className="font-semibold" style={{ color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" }}>{p.name}</span>
                      <span className="text-[10px] uppercase tracking-[0.18em] text-right" style={{ color: "#E9D9A8" }}>{p.role}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-3 text-[11px]" style={{ color: "rgba(255,255,255,0.6)" }}>
                  Spinneys, Life Pharmacy and Venus confirmed by Amra management. Additional F&amp;B partners TBC.
                </p>
              </div>
            </div>
          </div>
          <div className="relative min-h-[300px] lg:min-h-[520px]">
            <img
              src={brochureDesignArches}
              alt="Amra brochure — travertine arched corridor (Design Ethos & Partners slide)"
              className="absolute inset-0 w-full h-full object-cover"
              loading="lazy"
            />
            <img
              src={brochureYacht}
              alt="Amra brochure — yacht partnership lifestyle (Brand Partnerships slide)"
              className="absolute bottom-4 right-4 w-40 h-28 object-cover rounded-md border border-white/40 shadow-lg hidden md:block"
              loading="lazy"
            />
          </div>
        </div>
      </EmeraldCard>
    </div>
  );
}
