import { Building2, Leaf, Route, Sparkles, Handshake } from "lucide-react";

/**
 * Amra-only fact panel — content is quoted verbatim from the AMRA English Factsheet
 * (developer document) so nothing here is inferred or generated. Rendered only for
 * the Amra project on the Project Detail page.
 *
 * Sources (AMRA_English_Factsheet.pdf):
 *  - Amra BNB integrated rental facility & Citi Developers App (Investor Proposition + Investor Friendly sections)
 *  - "A Dh750 million Emirates Road Enhancement Project" (UAE Road Infrastructure section)
 *  - "Minimum of seven sustainability initiative requirements" (Sustainability & Regenerative section)
 *  - Design Partners / B2B Partners list (Design Ethos & Partners + Brand Partnerships sections)
 */

const bnbFeatures = [
  "Switch short-stay renting on or off anytime",
  "Choose which nights to rent; block personal stays in one tap",
  "One-stop management across Airbnb, holiday-home partners and Amra portals",
  "Optional smart pricing based on demand trends",
  "Income dashboard for bookings, nightly rates and payouts",
  "Guest KYC and concierge-managed check-in / check-out",
];

const sustainabilityInitiatives = [
  "Gardens and vertical green façades",
  "Solar farming on the rooftop",
  "Seawater cooling and pool water re-use",
  "Energy-generating jogging track",
  "Energy-efficient appliances and LED lighting",
  "High-performance insulation and water-saving fixtures",
  "Natural ventilation via skylights and cross-breezes",
  "Green roofs and living walls",
  "Smart-home systems for automated energy management",
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
];

interface Props {
  projectName: string;
}

export default function AmraFactSheetInsights({ projectName }: Props) {
  if (!/amra/i.test(projectName)) return null;

  return (
    <div className="mb-14 scroll-mt-40 space-y-6" id="amra-factsheet-insights">
      {/* Amra BNB — Investor management */}
      <div className="jj-card-inner">
        <div className="flex items-start gap-3 mb-4">
          <Building2 className="w-5 h-5 text-[#1A1A1A] mt-1" />
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-[#1A1A1A]/60 font-semibold mb-1">
              Investor Proposition
            </p>
            <h3 className="text-h3-sm font-medium text-foreground">
              Amra BNB — Integrated Rental Facility
            </h3>
            <p className="text-sm text-[#1A1A1A]/78 mt-2 max-w-3xl">
              Amra BNB is the developer-operated short-stay platform for owners at Amra.
              Listings are distributed across Airbnb, holiday-home partners and Amra's own
              portals and controlled from the Citi Developers App — verbatim from the Amra factsheet.
            </p>
          </div>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 mt-4">
          {bnbFeatures.map((feature) => (
            <div
              key={feature}
              className="flex items-start gap-2 rounded-md border border-[#B89555]/25 bg-[#F7F2EA] px-3 py-2 text-sm font-medium text-[#1A1A1A]"
            >
              <Sparkles className="w-4 h-4 text-[#064E3B] mt-0.5 flex-shrink-0" />
              <span>{feature}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Emirates Road AED 750M infrastructure */}
      <div className="jj-card-inner">
        <div className="flex items-start gap-3">
          <Route className="w-5 h-5 text-[#1A1A1A] mt-1" />
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-[#1A1A1A]/60 font-semibold mb-1">
              UAE Road Infrastructure
            </p>
            <h3 className="text-h3-sm font-medium text-foreground">
              AED 750 M Emirates Road Enhancement — Faster Access to Amra
            </h3>
          </div>
        </div>
        <ul className="mt-4 space-y-2 text-sm text-[#1A1A1A]/85 max-w-3xl">
          <li>
            • The UAE is investing in its federal highway network with a{" "}
            <strong>AED 750 million Emirates Road Enhancement Project</strong>, widening
            the corridor from Dubai to Umm Al Quwain.
          </li>
          <li>
            • By 2027, travel capacity is projected to increase by <strong>65%</strong>,
            cutting journey times by up to <strong>45%</strong> between Dubai, UAQ and Ras Al Khaimah.
          </li>
          <li>
            • The upgrade improves accessibility to Amra as a residential, tourism and
            investment destination.
          </li>
          <li>
            • On-property mobility: yachts limo service, private-marina yacht parking deck,
            and heli / air-taxi landing pad availability.
          </li>
        </ul>
      </div>

      {/* Sustainability & Regenerative */}
      <div className="jj-card-inner">
        <div className="flex items-start gap-3 mb-4">
          <Leaf className="w-5 h-5 text-[#064E3B] mt-1" />
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-[#1A1A1A]/60 font-semibold mb-1">
              Sustainability & Regenerative
            </p>
            <h3 className="text-h3-sm font-medium text-foreground">
              Designed to meet a minimum of seven sustainability initiatives
            </h3>
          </div>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {sustainabilityInitiatives.map((item) => (
            <div
              key={item}
              className="flex items-start gap-2 rounded-md border border-[#B89555]/25 bg-[#F7F2EA] px-3 py-2 text-sm text-[#1A1A1A]"
            >
              <Leaf className="w-4 h-4 text-[#064E3B] mt-0.5 flex-shrink-0" />
              <span>{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Design Partners & Brand Partnerships */}
      <div className="jj-card-inner">
        <div className="flex items-start gap-3 mb-4">
          <Handshake className="w-5 h-5 text-[#1A1A1A] mt-1" />
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-[#1A1A1A]/60 font-semibold mb-1">
              Design Ethos & Partners
            </p>
            <h3 className="text-h3-sm font-medium text-foreground">
              Design studios and brand partners named in the Amra factsheet
            </h3>
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <h4 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-3">
              Design Partners
            </h4>
            <div className="flex flex-wrap gap-2">
              {designPartners.map((studio) => (
                <span
                  key={studio}
                  className="inline-flex items-center rounded-md border border-[#B89555]/40 px-3 py-1 text-xs font-semibold"
                  style={{ background: "#FDFBF7", color: "#1A1A1A" }}
                >
                  {studio}
                </span>
              ))}
            </div>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-3">
              Brand Partnerships (B2B)
            </h4>
            <ul className="space-y-2">
              {brandPartners.map((partner) => (
                <li key={partner.name} className="flex items-center justify-between gap-3 text-sm">
                  <span className="font-semibold text-[#1A1A1A]">{partner.name}</span>
                  <span className="text-[#1A1A1A]/65 text-xs uppercase tracking-wider">
                    {partner.role}
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-[#1A1A1A]/60">
              Additional F&amp;B, supermarket, pharmacy and beauty clinic partners marked
              as TBC in the developer factsheet.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
