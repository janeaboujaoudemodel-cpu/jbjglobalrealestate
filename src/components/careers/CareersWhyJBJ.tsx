import { Crown, TrendingUp, Globe2, Headphones, Rocket, ShieldCheck, type LucideIcon } from "lucide-react";
import { SectionEyebrow } from "@/components/ui/SectionEyebrow";
import { IconTile } from "@/components/ui/icon-tile";

const BENEFITS: Array<{ icon: LucideIcon; title: string; description: string }> = [
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
          <SectionEyebrow>Why JBJ</SectionEyebrow>
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
                className="surface-champagne group relative overflow-hidden rounded-2xl border border-[#047857]/20 bg-gradient-to-br from-[#FDFBF7] to-[#F7F2EA] p-6 transition-all hover:-translate-y-1 hover:shadow-[0_20px_50px_-25px_rgba(6,78,59,0.22)] hover:border-[#047857]/40"
              >
                <div className="pointer-events-none absolute -bottom-12 -right-12 h-32 w-32 rounded-full bg-[#047857]/[0.07] blur-3xl group-hover:bg-[#047857]/[0.12] transition" />

                <div className="relative">
                  <IconTile icon={Icon} tone="emerald" size="lg" />
                  <h3 className="mt-4 text-xl font-bold text-[#1A1A1A] leading-snug">{b.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{b.description}</p>
                </div>

                <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#047857]/30 to-transparent" />
              </article>

            );
          })}
        </div>
      </div>
    </section>
  );
}

export default CareersWhyJBJ;
