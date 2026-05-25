import {
  Building2, Users, Bot, GraduationCap, Globe2, Megaphone,
  Sparkles, Award, Briefcase,
} from "lucide-react";

interface PillarTile {
  icon: React.ElementType;
  title: string;
  description: string;
}

const PILLARS: PillarTile[] = [
  {
    icon: Building2,
    title: "Direct Developer Access",
    description:
      "Tier-1 relationships with the most active Dubai developers — early off-plan allocations, exclusive inventory, and direct commercial channels.",
  },
  {
    icon: Bot,
    title: "AI Sales Infrastructure",
    description:
      "CRM, lead routing, AI follow-ups, and Jessica-powered investor qualification engineered to multiply broker productivity from day one.",
  },
  {
    icon: Globe2,
    title: "Global Investor Network",
    description:
      "Multilingual investor base across the GCC, Europe, CIS, India, and the Far East — supported by translation, compliance, and timezone-aware operations.",
  },
  {
    icon: GraduationCap,
    title: "Training & RERA Pathway",
    description:
      "Structured onboarding, Dubai market masterclasses, product certifications, and guided RERA progression for qualifying sales hires.",
  },
  {
    icon: Megaphone,
    title: "Marketing & Lead Engine",
    description:
      "Performance media, social, content, and SEO infrastructure generating a continuous pipeline of qualified, intent-verified investor leads.",
  },
  {
    icon: Award,
    title: "Personal Brand Support",
    description:
      "Professional photography, broker landing pages, branded presentations, and luxury collateral aligned with JBJ's institutional standards.",
  },
  {
    icon: Briefcase,
    title: "Off-Plan & Resale Expertise",
    description:
      "Deep research, comparable-data tooling, and senior advisory support across off-plan launches, secondary market, and prime-resale transactions.",
  },
  {
    icon: Users,
    title: "Private Events & Roadshows",
    description:
      "Closed-door investor dinners, developer launches, and international roadshows where brokers connect with HNW clients face-to-face.",
  },
  {
    icon: Sparkles,
    title: "Elite Onboarding",
    description:
      "Hands-on integration with leadership, structured 30/60/90-day milestones, and dedicated operational support so every hire ramps quickly.",
  },
];

export function CareersEcosystem() {
  return (
    <section className="relative py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-[#F7F2EA] via-[#FDFBF7] to-[#EFE6D6]">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#B89555]/70 bg-[#FDFBF7] px-3.5 py-1 text-[11px] font-bold uppercase tracking-[0.22em] text-[#102540]">
            <Sparkles className="h-3 w-3 text-[#B89555]" /> Broker Growth Ecosystem
          </div>
          <h2 className="mt-5 text-3xl md:text-5xl font-semibold text-[#1A1A1A] tracking-tight">
            The JBJ Broker Growth Ecosystem
          </h2>
          <p className="mt-4 text-base md:text-lg text-[#1A1A1A]/75 max-w-3xl mx-auto leading-relaxed">
            A live operating platform — direct developer access, AI sales infrastructure,
            a global investor base, and dedicated marketing, training, and onboarding —
            engineered to amplify the performance of every JBJ broker.
          </p>
        </div>


        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {PILLARS.map((tile) => {
            const Icon = tile.icon;
            return (
              <article
                key={tile.title}
                className="group relative overflow-hidden rounded-2xl border border-[#B89555]/40 bg-[#FDFBF7] p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_22px_55px_-28px_rgba(16,37,64,0.35)] hover:border-[#B89555]"
              >
                {/* Decorative glow */}
                <div className="pointer-events-none absolute -top-16 -left-16 h-32 w-32 rounded-full bg-[#102540]/[0.04] blur-3xl group-hover:bg-[#102540]/[0.09] transition" />

                <div className="relative">
                  <div className="grid h-12 w-12 place-items-center rounded-xl border border-[#B89555]/70 bg-gradient-to-br from-[#FDFBF7] to-[#EFE6D6]">
                    <Icon className="h-6 w-6 text-[#102540]" strokeWidth={1.75} />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-[#1A1A1A] leading-snug tracking-tight">
                    {tile.title}
                  </h3>
                  <p className="mt-2 text-sm text-[#1A1A1A]/72 leading-relaxed">
                    {tile.description}
                  </p>
                </div>

                {/* Bottom hairline */}
                <div className="absolute inset-x-6 bottom-0 h-px bg-gradient-to-r from-transparent via-[#B89555]/40 to-transparent" />
              </article>
            );
          })}
        </div>

        <p className="mt-12 text-center text-sm font-semibold text-[#102540]/80">
          Every section above reflects current JBJ operations — not a roadmap.
        </p>
      </div>
    </section>
  );
}

export default CareersEcosystem;
