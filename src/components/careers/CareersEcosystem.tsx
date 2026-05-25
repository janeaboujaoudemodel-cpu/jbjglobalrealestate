import {
  Brain, Video, GraduationCap, BarChart3, Users, Award,
  Sparkles, Clock,
} from "lucide-react";

interface EcosystemTile {
  icon: React.ElementType;
  title: string;
  description: string;
  eta: string;
}

const TILES: EcosystemTile[] = [
  {
    icon: Brain,
    title: "AI CV Matching",
    description: "Jessica AI scores every CV against role requirements and surfaces top candidates instantly.",
    eta: "Q2 2026",
  },
  {
    icon: Video,
    title: "Async Video Interviews",
    description: "Candidates record one-take answers; AI summarises tone, fluency, and culture-fit signals.",
    eta: "Q2 2026",
  },
  {
    icon: GraduationCap,
    title: "JBJ Sales Academy",
    description: "On-demand RERA prep, Dubai market masterclasses, and developer-specific training tracks.",
    eta: "Q3 2026",
  },
  {
    icon: BarChart3,
    title: "Performance Dashboard",
    description: "Live deal velocity, conversion analytics, and AI coaching tips for every hire.",
    eta: "Q3 2026",
  },
  {
    icon: Users,
    title: "Talent Referral Network",
    description: "Earn rewards for referring vetted brokers, marketers, and operators into JBJ.",
    eta: "Q4 2026",
  },
  {
    icon: Award,
    title: "Elite Broker Certification",
    description: "Tiered recognition program with public profile, premium leads, and partner benefits.",
    eta: "Q4 2026",
  },
];

export function CareersEcosystem() {
  return (
    <section className="relative py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-[#F7F2EA] via-[#FDFBF7] to-[#EFE6D6]">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#B89555] bg-[#FDFBF7] px-3.5 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-[#102540]">
            <Sparkles className="h-3 w-3 text-[#B89555]" /> Recruitment Ecosystem
          </div>
          <h2 className="mt-4 text-3xl md:text-5xl font-semibold text-[#1A1A1A] tracking-tight">
            More than a job — a launchpad
          </h2>
          <p className="mt-3 text-base md:text-lg text-[#1A1A1A]/75 max-w-2xl mx-auto">
            The JBJ Careers platform is expanding into a full talent operating system. Here's what's coming next.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {TILES.map((tile) => {
            const Icon = tile.icon;
            return (
              <article
                key={tile.title}
                className="group relative overflow-hidden rounded-2xl border border-[#B89555]/40 bg-[#FDFBF7] p-6 transition-all hover:-translate-y-1 hover:shadow-[0_20px_50px_-25px_rgba(16,37,64,0.35)] hover:border-[#102540]"
              >
                {/* Coming soon ribbon */}
                <div className="absolute top-4 right-4 flex items-center gap-1.5 rounded-full border border-[#102540]/25 bg-[#F7F2EA] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#102540]">
                  <Clock className="h-3 w-3" />
                  {tile.eta}
                </div>

                {/* Decorative glow */}
                <div className="pointer-events-none absolute -top-16 -left-16 h-32 w-32 rounded-full bg-[#102540]/5 blur-3xl group-hover:bg-[#102540]/10 transition" />

                <div className="relative">
                  <div className="grid h-12 w-12 place-items-center rounded-xl border border-[#B89555] bg-gradient-to-br from-[#FDFBF7] to-[#EFE6D6]">
                    <Icon className="h-6 w-6 text-[#102540]" strokeWidth={2} />
                  </div>
                  <h3 className="mt-4 text-lg font-bold text-[#1A1A1A] leading-snug">{tile.title}</h3>
                  <p className="mt-2 text-sm text-[#1A1A1A]/70 leading-relaxed">{tile.description}</p>
                </div>

                {/* Bottom hairline */}
                <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#B89555]/40 to-transparent" />
              </article>
            );
          })}
        </div>

        <p className="mt-10 text-center text-sm font-semibold text-[#102540]/80">
          Want early access to these tools? Apply above — accepted candidates get first invitation.
        </p>
      </div>
    </section>
  );
}

export default CareersEcosystem;
