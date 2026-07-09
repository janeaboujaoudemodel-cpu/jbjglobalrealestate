import { SEOHead } from "@/components/SEOHead";
import { Quote, TrendingUp } from "lucide-react";
import { SUCCESS_STORIES } from "@/content/success-stories";
import ConversionBand from "@/components/marketing/ConversionBand";

export default function SuccessStories() {
  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#1A1A1A]">
      <SEOHead
        title="Success Stories — JBJ Global Real Estate"
        description="Case studies from investors and family offices who partnered with JBJ Global Real Estate."
        
      />
      <section className="relative overflow-hidden bg-gradient-to-br from-[#064E3B] via-[#032A1E] to-[#000000] text-white">
        <div className="absolute inset-0 opacity-20 [background:radial-gradient(60%_80%_at_15%_20%,rgba(184,149,85,0.35),transparent),radial-gradient(50%_60%_at_85%_85%,rgba(184,149,85,0.2),transparent)]" />
        <div className="relative mx-auto max-w-7xl px-6 lg:px-12 py-20 lg:py-28">
          <div className="inline-flex items-center gap-2 text-[10px] tracking-[0.42em] uppercase text-[#D4B87A]">
            <TrendingUp className="w-3 h-3" /> Client Outcomes
          </div>
          <h1 className="mt-4 font-serif text-4xl md:text-6xl lg:text-[64px] leading-[1.03] max-w-4xl">
            Real portfolios,
            <span className="italic text-[#D4B87A]"> real outcomes.</span>
          </h1>
          <p className="mt-5 max-w-2xl text-white/75 text-base md:text-lg">
            A selection of JBJ engagements — from single-unit off-plan reservations to
            multi-country family-office relocations.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 lg:px-12 py-20">
        <div className="space-y-16">
          {SUCCESS_STORIES.map((s, i) => (
            <article
              key={s.slug}
              className={`grid gap-10 lg:grid-cols-2 items-center ${i % 2 ? "lg:[direction:rtl] lg:[&>*]:[direction:ltr]" : ""}`}
            >
              <div className="relative rounded-lg overflow-hidden aspect-[4/3] shadow-[0_30px_60px_-30px_rgba(6,78,59,0.45)]">
                <img src={s.cover} alt={s.headline} className="w-full h-full object-cover" loading="lazy" />
                <span className="absolute top-4 left-4 text-[10px] tracking-[0.28em] uppercase bg-white/95 text-[#0d3a2b] rounded-full px-3 py-1.5">
                  {s.tag}
                </span>
              </div>
              <div>
                <div className="text-[11px] tracking-[0.32em] uppercase text-[#B89555]">{s.client}</div>
                <h2 className="mt-3 font-serif text-3xl md:text-4xl leading-tight text-[#0d3a2b]">{s.headline}</h2>
                <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#F7F2EA] border border-[#B89555]/30 px-4 py-2 text-sm font-semibold text-[#0d3a2b]">
                  <TrendingUp className="w-3.5 h-3.5 text-[#064E3B]" />
                  {s.outcome}
                </div>
                <p className="mt-5 text-[#1A1A1A]/75 leading-relaxed">
                  <Quote className="inline w-4 h-4 text-[#B89555] mr-1" />
                  {s.body}
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <ConversionBand />
    </div>
  );
}
