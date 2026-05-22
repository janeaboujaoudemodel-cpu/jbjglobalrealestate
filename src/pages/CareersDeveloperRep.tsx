import { Link } from "react-router-dom";
import { Building2, ArrowRight, CheckCircle2, TrendingUp, Globe, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Careers — Developer Representative
 *
 * Public landing page for developer mode users. Reuses the existing
 * /careers application form (JoinApplication) as the apply endpoint.
 */
export default function CareersDeveloperRep() {
  const HIGHLIGHTS = [
    {
      icon: Building2,
      title: "Represent leading developers",
      body: "Liaison between top UAE & GCC developers and our institutional buyer network.",
    },
    {
      icon: TrendingUp,
      title: "Performance-based earnings",
      body: "Competitive commission structure on direct developer revenue + retainer for senior reps.",
    },
    {
      icon: Globe,
      title: "Global investor reach",
      body: "Access to JBJ Global Real Estate's international investor base across 40+ countries.",
    },
    {
      icon: Briefcase,
      title: "Senior-track role",
      body: "Direct visibility to founder leadership; clear path into developer-relations leadership.",
    },
  ];

  const RESPONSIBILITIES = [
    "Own developer relationships end-to-end across launches and re-sales",
    "Coordinate marketing collateral, brochures, and project data feeds with developers",
    "Negotiate commission terms, allocations, and inventory access",
    "Co-host launch events with developer teams",
    "Surface inventory, price changes, and incentives to internal sales + investor desks",
  ];

  return (
    <main className="min-h-screen bg-[#FDFBF7] text-[#1A1A1A]">
      {/* Hero */}
      <section className="border-b border-[#B89555]/25 bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6]">
        <div className="max-w-5xl mx-auto px-6 py-20 sm:py-28">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#B89555]/40 bg-[#EFE6D6] text-[11px] font-bold tracking-[0.18em] uppercase">
            <Building2 className="w-3.5 h-3.5" />
            Careers · Developer Track
          </div>
          <h1 className="mt-6 text-4xl sm:text-5xl md:text-6xl font-bold leading-[1.05] tracking-tight">
            Developer Representative
          </h1>
          <p className="mt-5 max-w-2xl text-base sm:text-lg text-[#1A1A1A]/75 leading-relaxed">
            Join JBJ Global Real Estate as a Developer Representative.
            Be the senior point of contact between major UAE developers and our
            institutional investor desks — own relationships, allocations, and
            launch execution.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/careers?role=developer_representative">
              <Button
                size="lg"
                className="h-12 px-6 bg-[#1A1A1A] hover:bg-[#0A0A0A] text-white font-bold rounded-xl border border-[#B89555]/40"
              >
                Apply now
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link to="/team">
              <Button
                variant="outline"
                size="lg"
                className="h-12 px-6 rounded-xl border-[#1A1A1A]/30 text-[#1A1A1A] hover:bg-[#EFE6D6]"
              >
                Meet the team
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Highlights */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <div className="grid sm:grid-cols-2 gap-5">
          {HIGHLIGHTS.map(({ icon: Icon, title, body }) => (
            <div
              key={title}
              className="rounded-2xl border border-[#B89555]/25 bg-[#F7F2EA] p-6"
            >
              <div className="w-11 h-11 rounded-xl border border-[#B89555]/40 bg-[#EFE6D6] flex items-center justify-center">
                <Icon className="w-5 h-5 text-[#1A1A1A]" />
              </div>
              <h3 className="mt-4 font-bold text-lg">{title}</h3>
              <p className="mt-1.5 text-sm text-[#1A1A1A]/70 leading-relaxed">
                {body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Responsibilities */}
      <section className="border-t border-[#B89555]/20 bg-[#F7F2EA]">
        <div className="max-w-5xl mx-auto px-6 py-16">
          <h2 className="text-2xl sm:text-3xl font-bold">What you'll own</h2>
          <ul className="mt-6 space-y-3">
            {RESPONSIBILITIES.map((r) => (
              <li key={r} className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-[#1A1A1A] mt-0.5 shrink-0" />
                <span className="text-[15px] text-[#1A1A1A]/85 leading-relaxed">{r}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Apply CTA */}
      <section className="border-t border-[#B89555]/25 bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6]">
        <div className="max-w-3xl mx-auto px-6 py-16 text-center">
          <h2 className="text-3xl font-bold">Ready to apply?</h2>
          <p className="mt-3 text-[#1A1A1A]/75">
            Complete the standard careers application — mention
            "Developer Representative" in your role preference.
          </p>
          <Link to="/careers?role=developer_representative" className="inline-block mt-7">
            <Button
              size="lg"
              className="h-12 px-7 bg-[#1A1A1A] hover:bg-[#0A0A0A] text-white font-bold rounded-xl border border-[#B89555]/40"
            >
              Start application
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </div>
      </section>
    </main>
  );
}
