import { useMemo, useState } from "react";
import { SEOHead } from "@/components/SEOHead";
import { Link } from "react-router-dom";
import { Clock, ArrowRight, Sparkles, Filter } from "lucide-react";
import { INSIGHT_ITEMS, INSIGHT_CATEGORIES } from "@/content/insights";
import { PremiumGate } from "@/components/premium/PremiumGate";
import ConversionBand from "@/components/marketing/ConversionBand";

export default function Insights() {
  const [cat, setCat] = useState("All");
  const filtered = useMemo(
    () => (cat === "All" ? INSIGHT_ITEMS : INSIGHT_ITEMS.filter((i) => i.category === cat)),
    [cat],
  );

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#1A1A1A]">
      <SEOHead
        title="Market Insights & Guides — JBJ Global Real Estate"
        description="Dubai market reports, area guides, investment insights, Golden Visa, tax, rental and off-plan guides. The JBJ knowledge hub."
        canonical="/insights"
      />
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#064E3B] via-[#032A1E] to-[#000000] text-white">
        <div className="absolute inset-0 opacity-20 [background:radial-gradient(60%_80%_at_20%_20%,rgba(184,149,85,0.35),transparent),radial-gradient(50%_60%_at_85%_85%,rgba(184,149,85,0.2),transparent)]" />
        <div className="relative mx-auto max-w-7xl px-6 lg:px-12 py-20 lg:py-28">
          <div className="inline-flex items-center gap-2 text-[10px] tracking-[0.42em] uppercase text-[#D4B87A]">
            <Sparkles className="w-3 h-3" /> Knowledge Hub
          </div>
          <h1 className="mt-4 font-serif text-4xl md:text-6xl lg:text-[64px] leading-[1.03] max-w-4xl">
            Market intelligence,
            <span className="italic text-[#D4B87A]"> for the operators.</span>
          </h1>
          <p className="mt-5 max-w-2xl text-white/75 text-base md:text-lg">
            Deep-dive reports, area guides and investor playbooks — the same research we
            share with our private-client desk.
          </p>
        </div>
      </section>

      {/* Filter bar */}
      <div className="sticky top-0 z-30 border-b border-[#B89555]/25 bg-[#FDFBF7]/95 backdrop-blur">
        <div className="mx-auto max-w-7xl px-6 lg:px-12 py-3 flex items-center gap-2 overflow-x-auto">
          <Filter className="w-4 h-4 text-[#0d3a2b] shrink-0" />
          {INSIGHT_CATEGORIES.map((c) => {
            const active = c === cat;
            return (
              <button
                key={c}
                onClick={() => setCat(c)}
                className={`shrink-0 rounded-full border px-4 py-1.5 text-xs font-medium tracking-wide transition-all ${
                  active
                    ? "bg-[#064E3B] text-white border-[#064E3B] shadow-[0_6px_14px_-6px_rgba(6,78,59,0.45)]"
                    : "bg-white text-[#1A1A1A] border-[#B89555]/40 hover:border-[#064E3B]"
                }`}
              >
                {c}
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid */}
      <section className="mx-auto max-w-7xl px-6 lg:px-12 py-16">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((item) => (
            <PremiumGate
              key={item.slug}
              action="insights_article"
              next={`/insights/${item.slug}`}
              soft
              className="rounded-lg overflow-hidden border border-[#B89555]/25 bg-white hover:-translate-y-1 hover:shadow-[0_20px_40px_-24px_rgba(6,78,59,0.35)] transition-all"
            >
              <div className="relative aspect-[16/10] overflow-hidden">
                <img src={item.cover} alt={item.title} className="w-full h-full object-cover" loading="lazy" />
                <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/60 to-transparent" />
                <span className="absolute top-3 left-3 text-[10px] tracking-[0.24em] uppercase bg-white/95 text-[#0d3a2b] rounded-full px-2.5 py-1">
                  {item.category}
                </span>
              </div>
              <div className="p-5">
                <h3 className="font-serif text-xl leading-tight text-[#0d3a2b]">{item.title}</h3>
                <p className="mt-2 text-sm text-[#1A1A1A]/70 line-clamp-2">{item.excerpt}</p>
                <div className="mt-4 flex items-center justify-between text-[11px] text-[#1A1A1A]/60">
                  <span className="inline-flex items-center gap-1.5"><Clock className="w-3 h-3" /> {item.readMinutes} min read</span>
                  <span>{item.date}</span>
                </div>
                <div className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-[#064E3B]">
                  Read insight <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </PremiumGate>
          ))}
        </div>
      </section>

      <ConversionBand />
    </div>
  );
}
