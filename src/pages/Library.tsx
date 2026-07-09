import { useMemo, useState } from "react";
import { SEOHead } from "@/components/SEOHead";
import { FileText, Download, Filter, Sparkles, BookOpen } from "lucide-react";
import { LIBRARY_DOCS, LIBRARY_CATEGORIES } from "@/content/library";
import { PremiumGate } from "@/components/premium/PremiumGate";
import ConversionBand from "@/components/marketing/ConversionBand";

export default function Library() {
  const [cat, setCat] = useState("All");
  const filtered = useMemo(
    () => (cat === "All" ? LIBRARY_DOCS : LIBRARY_DOCS.filter((d) => d.category === cat)),
    [cat],
  );

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#1A1A1A]">
      <SEOHead
        title="The JBJ Library — Guides, Playbooks & Research"
        description="A premium knowledge center for investors and brokers: JBJ Guides, Investment Playbooks, Market Research, White Papers, and Educational PDFs."
        canonical="/library"
      />
      <section className="relative overflow-hidden bg-gradient-to-br from-[#064E3B] via-[#032A1E] to-[#000000] text-white">
        <div className="absolute inset-0 opacity-20 [background:radial-gradient(60%_80%_at_80%_20%,rgba(184,149,85,0.32),transparent),radial-gradient(50%_60%_at_15%_85%,rgba(184,149,85,0.24),transparent)]" />
        <div className="relative mx-auto max-w-7xl px-6 lg:px-12 py-20 lg:py-28 grid gap-10 lg:grid-cols-[1fr_auto] items-end">
          <div>
            <div className="inline-flex items-center gap-2 text-[10px] tracking-[0.42em] uppercase text-[#D4B87A]">
              <BookOpen className="w-3 h-3" /> The Library
            </div>
            <h1 className="mt-4 font-serif text-4xl md:text-6xl lg:text-[64px] leading-[1.03] max-w-4xl">
              A private library
              <span className="italic text-[#D4B87A]"> for serious operators.</span>
            </h1>
            <p className="mt-5 max-w-2xl text-white/75 text-base md:text-lg">
              JBJ guides, investment playbooks, market research and government resources —
              curated and continuously updated.
            </p>
          </div>
          <div className="hidden lg:flex flex-col items-end gap-2 text-white/70 text-xs tracking-[0.28em] uppercase">
            <span>{LIBRARY_DOCS.length} documents</span>
            <span>{LIBRARY_CATEGORIES.length - 1} categories</span>
            <span>Members-only downloads</span>
          </div>
        </div>
      </section>

      <div className="sticky top-0 z-30 border-b border-[#B89555]/25 bg-[#FDFBF7]/95 backdrop-blur">
        <div className="mx-auto max-w-7xl px-6 lg:px-12 py-3 flex items-center gap-2 overflow-x-auto">
          <Filter className="w-4 h-4 text-[#0d3a2b] shrink-0" />
          {LIBRARY_CATEGORIES.map((c) => {
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

      <section className="mx-auto max-w-7xl px-6 lg:px-12 py-16">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((doc) => (
            <PremiumGate
              key={doc.slug}
              action="library_document"
              next={`/library/${doc.slug}`}
              soft
              className="rounded-lg overflow-hidden border border-[#B89555]/30 bg-white flex flex-col hover:-translate-y-1 hover:shadow-[0_20px_40px_-24px_rgba(6,78,59,0.35)] transition-all"
            >
              <div className="relative aspect-[4/3] overflow-hidden bg-[#F7F2EA]">
                <img src={doc.cover} alt={doc.title} className="w-full h-full object-cover" loading="lazy" />
                <span className="absolute top-3 left-3 text-[10px] tracking-[0.24em] uppercase bg-[#0d3a2b] text-white rounded-full px-2.5 py-1">
                  {doc.format}
                </span>
              </div>
              <div className="p-5 flex-1 flex flex-col">
                <div className="text-[10px] tracking-[0.32em] uppercase text-[#B89555]">{doc.category}</div>
                <h3 className="mt-2 font-serif text-lg leading-tight text-[#0d3a2b]">{doc.title}</h3>
                <p className="mt-2 text-sm text-[#1A1A1A]/70 line-clamp-3 flex-1">{doc.description}</p>
                <div className="mt-4 flex items-center justify-between text-[11px] text-[#1A1A1A]/60 pt-3 border-t border-[#B89555]/20">
                  <span className="inline-flex items-center gap-1.5"><FileText className="w-3 h-3" /> {doc.pages} pages · {doc.size}</span>
                  <span className="inline-flex items-center gap-1 text-[#064E3B] font-semibold"><Download className="w-3 h-3" /> Download</span>
                </div>
              </div>
            </PremiumGate>
          ))}
        </div>
        <div className="mt-14 text-center text-[11px] tracking-[0.28em] uppercase text-[#1A1A1A]/50">
          <Sparkles className="inline w-3 h-3 mr-2 text-[#B89555]" />
          Updated weekly — created by the JBJ research desk
        </div>
      </section>

      <ConversionBand />
    </div>
  );
}
