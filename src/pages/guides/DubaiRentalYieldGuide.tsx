import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  TrendingUp, MapPin, Home, Building2, Calculator, HelpCircle,
  ArrowRight, CheckCircle2, DollarSign, BarChart3, Info, PieChart,
} from "lucide-react";
import { SEOHead } from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";

/**
 * Dubai Rental Yield Comparison Guide
 * SEO focus: "Dubai rental yield", "best areas to invest in Dubai",
 * "rental yield calculator Dubai", "highest ROI Dubai property".
 *
 * Follows GoldenVisaGuide visual system (ivory + gold accents).
 */

interface AreaRow {
  slug: string;
  area: string;
  type: "Apartment" | "Villa" | "Studio";
  avgPrice: string;      // AED, indicative
  avgRent: string;       // AED / year, indicative
  grossYield: number;    // %
  netYield: number;      // %
  tier: "high" | "mid" | "premium";
}

// Indicative 2026 figures — sourced from DLD open data, Bayut & Property Finder
// market snapshots. Presented as ranges/averages, not personalized advice.
const YIELD_TABLE: AreaRow[] = [
  { slug: "jumeirah-village-circle", area: "Jumeirah Village Circle (JVC)", type: "Apartment", avgPrice: "950,000", avgRent: "75,000", grossYield: 7.9, netYield: 6.5, tier: "high" },
  { slug: "dubai-sports-city",       area: "Dubai Sports City",              type: "Apartment", avgPrice: "780,000", avgRent: "60,000", grossYield: 7.7, netYield: 6.3, tier: "high" },
  { slug: "international-city",      area: "International City",             type: "Studio",    avgPrice: "380,000", avgRent: "29,000", grossYield: 7.6, netYield: 6.2, tier: "high" },
  { slug: "dubai-silicon-oasis",     area: "Dubai Silicon Oasis",            type: "Apartment", avgPrice: "720,000", avgRent: "55,000", grossYield: 7.6, netYield: 6.2, tier: "high" },
  { slug: "town-square",             area: "Town Square Dubai",              type: "Apartment", avgPrice: "820,000", avgRent: "60,000", grossYield: 7.3, netYield: 6.0, tier: "high" },
  { slug: "business-bay",            area: "Business Bay",                   type: "Apartment", avgPrice: "1,650,000", avgRent: "110,000", grossYield: 6.7, netYield: 5.4, tier: "mid" },
  { slug: "dubai-marina",            area: "Dubai Marina",                   type: "Apartment", avgPrice: "1,900,000", avgRent: "125,000", grossYield: 6.6, netYield: 5.3, tier: "mid" },
  { slug: "jumeirah-beach-residence",area: "Jumeirah Beach Residence (JBR)", type: "Apartment", avgPrice: "2,100,000", avgRent: "135,000", grossYield: 6.4, netYield: 5.1, tier: "mid" },
  { slug: "downtown-dubai",          area: "Downtown Dubai",                 type: "Apartment", avgPrice: "2,650,000", avgRent: "150,000", grossYield: 5.7, netYield: 4.6, tier: "mid" },
  { slug: "dubai-hills-estate",      area: "Dubai Hills Estate",             type: "Villa",     avgPrice: "6,800,000", avgRent: "360,000", grossYield: 5.3, netYield: 4.3, tier: "mid" },
  { slug: "arabian-ranches",         area: "Arabian Ranches",                type: "Villa",     avgPrice: "5,900,000", avgRent: "310,000", grossYield: 5.3, netYield: 4.3, tier: "mid" },
  { slug: "palm-jumeirah",           area: "Palm Jumeirah",                  type: "Apartment", avgPrice: "3,900,000", avgRent: "195,000", grossYield: 5.0, netYield: 4.0, tier: "premium" },
  { slug: "emirates-hills",          area: "Emirates Hills",                 type: "Villa",     avgPrice: "24,000,000", avgRent: "950,000", grossYield: 4.0, netYield: 3.2, tier: "premium" },
];

const FAQS = [
  {
    question: "What is a good rental yield in Dubai in 2026?",
    answer:
      "A gross rental yield of 6–8% is considered strong in Dubai. Premium beachfront and prestige villa communities (Palm Jumeirah, Emirates Hills, Downtown) tend to deliver 4–5.5%, while high-yield apartment districts like JVC, Dubai Sports City and International City routinely produce 7–8%+.",
  },
  {
    question: "Which Dubai communities have the highest rental yields?",
    answer:
      "Jumeirah Village Circle (JVC), Dubai Sports City, International City, Dubai Silicon Oasis and Town Square consistently rank among the top-yielding communities, with gross yields of 7.3–7.9% on apartments and studios.",
  },
  {
    question: "How is rental yield calculated?",
    answer:
      "Gross rental yield = (annual rent ÷ property price) × 100. Net rental yield deducts annual costs — service charges, maintenance, agency fees, DEWA setup, and vacancy — typically 15–20% of gross rent in Dubai.",
  },
  {
    question: "Do off-plan properties in Dubai offer better yields?",
    answer:
      "Off-plan can deliver capital appreciation during construction, but yield only starts on handover. Ready properties in the same community usually produce higher immediate cash-on-cash returns, while off-plan is stronger for medium-term appreciation.",
  },
  {
    question: "Is rental income in Dubai taxable?",
    answer:
      "The UAE currently levies no personal income tax on rental income. Landlords pay a 5% Dubai Municipality housing fee (collected via the tenant's DEWA bill) plus annual service charges. Corporate tax applies to companies at 9% above AED 375,000 profit.",
  },
  {
    question: "What ongoing costs eat into rental yield?",
    answer:
      "Service charges (AED 10–35 per sq ft/year depending on community), property management (5–8% of rent), maintenance reserve (~5% of rent), Ejari renewal (AED 220), and one-off DLD/agency fees on new leases. Budgeting 15–20% of gross rent for costs is a realistic baseline.",
  },
  {
    question: "Can foreigners earn rental income from Dubai property?",
    answer:
      "Yes. Foreign nationals can own freehold property in designated freehold zones — including all communities in this guide — and receive rental income in AED or the currency of their choice via a UAE bank account.",
  },
];

const tierBadge = (tier: AreaRow["tier"]) => {
  if (tier === "high") return { label: "High Yield", cls: "bg-emerald-50 text-emerald-800 border-emerald-200" };
  if (tier === "mid")  return { label: "Balanced",  cls: "bg-[#F7F1E6] text-[#8B7340] border-[#B89555]/40" };
  return { label: "Prestige", cls: "bg-neutral-50 text-neutral-700 border-neutral-200" };
};

const DubaiRentalYieldGuide = () => {
  const [price, setPrice] = useState<number>(1_500_000);
  const [rent, setRent] = useState<number>(105_000);
  const [costPct, setCostPct] = useState<number>(18);

  const { gross, net } = useMemo(() => {
    if (!price || price <= 0) return { gross: 0, net: 0 };
    const g = (rent / price) * 100;
    const n = ((rent * (1 - costPct / 100)) / price) * 100;
    return { gross: g, net: n };
  }, [price, rent, costPct]);

  const sorted = [...YIELD_TABLE].sort((a, b) => b.grossYield - a.grossYield);

  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      <SEOHead
        title="Dubai Rental Yield Guide 2026 — Best Areas to Invest"
        description="Compare 2026 rental yields across 13 Dubai communities. Interactive yield calculator, net vs gross returns, and where to buy for the highest ROI."
        keywords="Dubai rental yield, best areas to invest in Dubai, highest ROI Dubai property, Dubai rental yield calculator, Dubai property investment, JVC rental yield, Business Bay yield, Palm Jumeirah rental yield, Dubai Marina yield, buy-to-let Dubai"
        canonicalPath="/guides/dubai-rental-yield"
        faqItems={FAQS}
      />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#0d1f18] via-[#0a1712] to-[#0a1712] text-white">
        <div className="absolute inset-0 opacity-30 bg-[radial-gradient(ellipse_at_top,_rgba(184,149,85,0.35),_transparent_60%)]" />
        <div className="relative max-w-5xl mx-auto px-6 md:px-8 py-20 md:py-28 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#B89555]/60 text-[#E9D9AE] text-xs tracking-widest uppercase mb-6">
            <TrendingUp className="w-3.5 h-3.5" /> 2026 Market Data
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold tracking-tight mb-6">
            Dubai Rental Yield Guide <span className="text-[#E9D9AE]">2026</span>
          </h1>
          <p className="text-lg md:text-xl text-white/80 max-w-3xl mx-auto leading-relaxed mb-10">
            Where does your dirham work hardest? Compare gross and net rental yields across 13 Dubai communities — from 4% prestige waterfront to 7.9% high-yield apartment districts.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <a href="#comparison" className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#B89555] text-[#0a1712] font-semibold hover:bg-[#C9A66B] transition">
              Compare Communities <ArrowRight className="w-4 h-4" />
            </a>
            <a href="#calculator" className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-white/30 text-white hover:bg-white/10 transition">
              Yield Calculator <Calculator className="w-4 h-4" />
            </a>
          </div>
        </div>
      </section>

      {/* Snapshot bar */}
      <section className="border-y border-[#EFE6D6] bg-white">
        <div className="max-w-5xl mx-auto px-6 py-10 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { label: "Top Yield Area", value: "JVC — 7.9%", icon: TrendingUp },
            { label: "Communities Covered", value: "13", icon: MapPin },
            { label: "Yield Range", value: "4.0% – 7.9%", icon: BarChart3 },
            { label: "Personal Tax", value: "0%", icon: DollarSign },
          ].map((s) => (
            <div key={s.label}>
              <s.icon className="w-6 h-6 mx-auto text-[#B89555] mb-2" />
              <div className="text-2xl font-serif font-bold text-[#1A1A1A]">{s.value}</div>
              <div className="text-xs uppercase tracking-widest text-[#8B7340] mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Comparison table */}
      <section id="comparison" className="py-16 md:py-20 scroll-mt-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex items-center gap-3 mb-2">
            <PieChart className="w-6 h-6 text-[#B89555]" />
            <span className="text-xs uppercase tracking-widest text-[#8B7340]">Community Comparison</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-[#1A1A1A] mb-4">
            Dubai rental yields, ranked
          </h2>
          <p className="text-[#3D3D3D] max-w-3xl mb-8">
            Indicative 2026 gross and net yields across Dubai's most-searched investment communities. Sorted highest to lowest. Prices and rents are community averages — actual returns vary by tower, unit size, and floor.
          </p>

          <div className="overflow-x-auto rounded-2xl border border-[#EFE6D6] bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-[#FAF6EE] text-[#8B7340] uppercase text-xs tracking-widest">
                <tr>
                  <th className="text-left px-5 py-4">Community</th>
                  <th className="text-left px-5 py-4">Type</th>
                  <th className="text-right px-5 py-4">Avg Price (AED)</th>
                  <th className="text-right px-5 py-4">Avg Rent (AED/yr)</th>
                  <th className="text-right px-5 py-4">Gross Yield</th>
                  <th className="text-right px-5 py-4">Net Yield</th>
                  <th className="text-center px-5 py-4">Tier</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((row) => {
                  const badge = tierBadge(row.tier);
                  return (
                    <tr key={row.slug} className="border-t border-[#F1EADB] hover:bg-[#FDFBF7] transition">
                      <td className="px-5 py-4 font-semibold text-[#1A1A1A]">{row.area}</td>
                      <td className="px-5 py-4 text-[#3D3D3D]">{row.type}</td>
                      <td className="px-5 py-4 text-right text-[#3D3D3D] tabular-nums">{row.avgPrice}</td>
                      <td className="px-5 py-4 text-right text-[#3D3D3D] tabular-nums">{row.avgRent}</td>
                      <td className="px-5 py-4 text-right font-bold text-[#0a1712] tabular-nums">{row.grossYield.toFixed(1)}%</td>
                      <td className="px-5 py-4 text-right text-[#3D3D3D] tabular-nums">{row.netYield.toFixed(1)}%</td>
                      <td className="px-5 py-4 text-center">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] uppercase tracking-widest border ${badge.cls}`}>{badge.label}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <p className="text-xs text-[#8B7340] mt-4 flex items-start gap-2">
            <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
            Figures compiled from DLD transaction data, Bayut and Property Finder market snapshots (2026). Indicative only — request a bespoke yield report for a specific address from our team.
          </p>
        </div>
      </section>

      {/* Calculator */}
      <section id="calculator" className="py-16 md:py-20 bg-gradient-to-br from-[#FAF6EE] via-[#F7F1E6]/40 to-[#FAF6EE] scroll-mt-24">
        <div className="max-w-4xl mx-auto px-6">
          <div className="flex items-center gap-3 mb-2">
            <Calculator className="w-6 h-6 text-[#B89555]" />
            <span className="text-xs uppercase tracking-widest text-[#8B7340]">Interactive Tool</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-[#1A1A1A] mb-4">Rental yield calculator</h2>
          <p className="text-[#3D3D3D] mb-8">Plug in your numbers to see gross and net yields for any Dubai property.</p>

          <div className="rounded-2xl border border-[#EFE6D6] bg-white p-6 md:p-8 shadow-sm grid md:grid-cols-2 gap-8">
            <div className="space-y-5">
              <label className="block">
                <span className="text-xs uppercase tracking-widest text-[#8B7340] block mb-2">Property price (AED)</span>
                <input
                  type="number" min={100000} step={50000}
                  value={price}
                  onChange={(e) => setPrice(Number(e.target.value) || 0)}
                  className="w-full rounded-lg border border-[#EFE6D6] bg-[#FDFBF7] px-4 py-3 text-[#1A1A1A] font-semibold tabular-nums focus:outline-none focus:ring-2 focus:ring-[#B89555]"
                />
              </label>
              <label className="block">
                <span className="text-xs uppercase tracking-widest text-[#8B7340] block mb-2">Annual rent (AED)</span>
                <input
                  type="number" min={0} step={1000}
                  value={rent}
                  onChange={(e) => setRent(Number(e.target.value) || 0)}
                  className="w-full rounded-lg border border-[#EFE6D6] bg-[#FDFBF7] px-4 py-3 text-[#1A1A1A] font-semibold tabular-nums focus:outline-none focus:ring-2 focus:ring-[#B89555]"
                />
              </label>
              <label className="block">
                <span className="text-xs uppercase tracking-widest text-[#8B7340] block mb-2">Ongoing costs (% of rent) — {costPct}%</span>
                <input
                  type="range" min={0} max={35} step={1}
                  value={costPct}
                  onChange={(e) => setCostPct(Number(e.target.value))}
                  className="w-full accent-[#B89555]"
                />
                <span className="text-xs text-[#8B7340]">Includes service charges, mgmt, maintenance and vacancy.</span>
              </label>
            </div>

            <div className="flex flex-col justify-center rounded-xl bg-gradient-to-br from-[#0d1f18] to-[#0a1712] text-white p-6">
              <span className="text-xs uppercase tracking-widest text-[#E9D9AE] mb-1">Gross Yield</span>
              <div className="text-4xl font-serif font-bold mb-6 tabular-nums">{gross.toFixed(2)}%</div>
              <span className="text-xs uppercase tracking-widest text-[#E9D9AE] mb-1">Net Yield</span>
              <div className="text-4xl font-serif font-bold mb-6 tabular-nums text-[#E9D9AE]">{net.toFixed(2)}%</div>
              <div className="text-xs text-white/60">
                Annual net income ≈ AED {Math.max(0, Math.round(rent * (1 - costPct / 100))).toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How to read yields */}
      <section className="py-16 md:py-20">
        <div className="max-w-5xl mx-auto px-6">
          <div className="flex items-center gap-3 mb-2">
            <BarChart3 className="w-6 h-6 text-[#B89555]" />
            <span className="text-xs uppercase tracking-widest text-[#8B7340]">The framework</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-[#1A1A1A] mb-8">Yield is only half the story</h2>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: TrendingUp, title: "Yield", body: "Annual cash return. High-yield districts (JVC, Sports City) hand you 7%+ from day one — best for cash-flow investors." },
              { icon: Building2, title: "Appreciation", body: "Prestige beachfront and prime downtown appreciate faster over 5–10 years. Yield sacrifices are recovered in capital gains." },
              { icon: Home, title: "Liquidity", body: "Popular apartment communities sell in weeks. Ultra-prime villas can take 6–12 months to exit at target price." },
            ].map((c) => (
              <motion.div
                key={c.title}
                className="rounded-2xl border border-[#EFE6D6] bg-white p-6 shadow-sm"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
              >
                <c.icon className="w-8 h-8 text-[#B89555] mb-3" />
                <h3 className="text-xl font-serif font-bold text-[#1A1A1A] mb-2">{c.title}</h3>
                <p className="text-sm text-[#3D3D3D] leading-relaxed">{c.body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 md:py-20 bg-[#FAF6EE]">
        <div className="max-w-4xl mx-auto px-6">
          <div className="flex items-center gap-3 mb-2">
            <HelpCircle className="w-6 h-6 text-[#B89555]" />
            <span className="text-xs uppercase tracking-widest text-[#8B7340]">Answers</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-[#1A1A1A] mb-8">Frequently asked questions</h2>

          <Accordion type="single" collapsible className="rounded-2xl border border-[#EFE6D6] bg-white overflow-hidden">
            {FAQS.map((f, i) => (
              <AccordionItem key={i} value={`f-${i}`} className="border-b border-[#F1EADB] last:border-b-0 px-5">
                <AccordionTrigger className="text-left text-[#1A1A1A] hover:no-underline py-5">
                  <span className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-[#B89555] mt-0.5 flex-shrink-0" />
                    <span className="font-semibold">{f.question}</span>
                  </span>
                </AccordionTrigger>
                <AccordionContent className="text-[#3D3D3D] leading-relaxed pb-5 pl-8">
                  {f.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 md:py-20 bg-gradient-to-br from-[#0d1f18] via-[#0a1712] to-black text-white">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-serif font-bold mb-4">
            Want a yield report for a <span className="text-[#E9D9AE]">specific address?</span>
          </h2>
          <p className="text-white/70 mb-8 leading-relaxed">
            Our brokers pull DLD sold-comparables, current market rents, and community service-charge data into a personalized 1-page yield report — delivered within 24 hours.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link to="/contact" className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#B89555] text-[#0a1712] font-semibold hover:bg-[#C9A66B] transition">
              Request Yield Report <ArrowRight className="w-4 h-4" />
            </Link>
            <Link to="/properties" className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-white/30 text-white hover:bg-white/10 transition">
              Browse Investment Properties
            </Link>
          </div>
          <div className="mt-10 pt-8 border-t border-white/10 text-sm text-white/60 flex flex-wrap justify-center gap-x-6 gap-y-2">
            <Link to="/guides" className="hover:text-[#E9D9AE]">All Guides</Link>
            <Link to="/guides/golden-visa-uae" className="hover:text-[#E9D9AE]">Golden Visa Guide</Link>
            <Link to="/buyer-guide" className="hover:text-[#E9D9AE]">Buyer Guide</Link>
            <Link to="/landlord-guide" className="hover:text-[#E9D9AE]">Landlord Guide</Link>
            <Link to="/market-intelligence" className="hover:text-[#E9D9AE]">Market Intelligence</Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default DubaiRentalYieldGuide;
