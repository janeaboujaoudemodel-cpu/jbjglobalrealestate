import { Crown, TrendingUp, Globe2, Headphones, Rocket, ShieldCheck } from "lucide-react";

const BENEFITS = [
  {
    icon: Crown,
    title: "Elite Clientele",
    description: "Work with HNWIs, family offices, and institutional investors on Dubai's most prestigious assets.",
  },
  {
    icon: TrendingUp,
    title: "Uncapped Earnings",
    description: "Industry-leading commission structures with transparent splits and fast payouts.",
  },
  {
    icon: Globe2,
    title: "Global Reach",
    description: "Multilingual platform serving investors across 60+ countries with localized intelligence.",
  },
  {
    icon: Rocket,
    title: "AI-Powered Workflow",
    description: "Concierge, CRM, presentations, and outreach tools that 10x your productivity.",
  },
  {
    icon: Headphones,
    title: "Executive Support",
    description: "Amanda Clarke and the JBJ ops team handle scheduling, follow-ups, and admin so you can sell.",
  },
  {
    icon: ShieldCheck,
    title: "Brand Authority",
    description: "Institutional positioning, RERA compliance, and a brand that opens doors immediately.",
  },
];

export function CareersWhyJBJ() {
  return (
    <section data-surface="page" className="surface-page relative py-16 px-4 sm:px-6 lg:px-8 bg-[#FDFBF7]">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#B89555] bg-[#F7F2EA] px-3.5 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-[#0A0A0A]">
            Why JBJ
          </div>
          <h2 className="mt-4 text-3xl md:text-5xl font-semibold text-[#1A1A1A] tracking-tight">
            Built for the top 1% of real estate talent
          </h2>
          <p className="mt-3 text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
            JBJ GLOBAL REAL ESTATE is engineered to amplify exceptional people. Here's what sets us apart.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {BENEFITS.map((b) => {
            const Icon = b.icon;
            return (
              <article
                key={b.title}
                data-surface="champagne"
                className="surface-champagne group relative overflow-hidden rounded-2xl border border-[#B89555]/40 bg-gradient-to-br from-[#FDFBF7] to-[#F7F2EA] p-6 transition-all hover:-translate-y-1 hover:shadow-[0_20px_50px_-25px_rgba(184,149,85,0.4)] hover:border-[#B89555]"
              >
                <div className="pointer-events-none absolute -bottom-12 -right-12 h-32 w-32 rounded-full bg-[#B89555]/8 blur-3xl group-hover:bg-[#B89555]/15 transition" />

                <div className="relative">
                  <div className="grid h-14 w-14 place-items-center rounded-2xl border-2 border-[#B89555] bg-[#FDFBF7]">
                    <Icon className="h-7 w-7 text-[#0A0A0A]" strokeWidth={2} />
                  </div>
                  <h3 className="mt-4 text-xl font-bold text-[#1A1A1A] leading-snug">{b.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{b.description}</p>
                </div>

                <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#B89555]/40 to-transparent" />
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default CareersWhyJBJ;
