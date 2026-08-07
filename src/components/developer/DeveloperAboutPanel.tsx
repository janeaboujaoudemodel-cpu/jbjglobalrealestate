import { Link } from "react-router-dom";
import { ArrowUpRight, Building2, MapPin, ShieldCheck, Layers } from "lucide-react";

interface DeveloperAboutPanelProps {
  developer: {
    name: string;
    slug?: string | null;
    founded_year?: number | null;
    headquarters?: string | null;
    specialization?: string | null;
    completed_projects?: number | null;
    total_units_delivered?: number | null;
  };
  /** Number of projects JBJ currently tracks for this developer. */
  projectCount?: number;
  /** Optional project name — used on the project page copy. */
  projectName?: string;
  className?: string;
}

/**
 * Plain-language "who is this developer" explainer.
 * Shown under the developer description on the developer page and on every
 * project page, so a first-time client immediately understands what the
 * developer is and can jump to the full portfolio in one click.
 */
export default function DeveloperAboutPanel({
  developer,
  projectCount,
  projectName,
  className = "",
}: DeveloperAboutPanelProps) {
  const { name, slug } = developer;
  const trackedCount = projectCount ?? developer.completed_projects ?? null;

  const explainer = projectName
    ? `${projectName} is built and delivered by ${name} — the property developer behind the master plan, the construction and the final handover of your unit. JBJ works directly with ${name} on this launch, so pricing, availability and payment terms you see here come from the developer's own inventory.`
    : `${name} is a property developer: the company that buys the land, designs the master plan, builds the towers or villas and hands the finished homes over to owners. Everything listed below is inventory JBJ tracks directly from ${name}, so pricing, availability and payment terms are taken from the developer's own release — not from resale listings.`;

  const facts = [
    {
      icon: Building2,
      label: "What they do",
      value: developer.specialization || "Residential & mixed-use development",
    },
    {
      icon: MapPin,
      label: "Based in",
      value: developer.headquarters || "United Arab Emirates",
    },
    {
      icon: Layers,
      label: "Tracked by JBJ",
      value: trackedCount ? `${trackedCount.toLocaleString()} project${trackedCount === 1 ? "" : "s"}` : "Live inventory",
    },
    {
      icon: ShieldCheck,
      label: "Since",
      value: developer.founded_year ? String(developer.founded_year) : "Verified developer",
    },
  ];

  return (
    <section
      data-developer-about-panel="true"
      className={`rounded-2xl border border-[#B89555]/35 p-5 md:p-6 ${className}`}
      style={{
        background: "linear-gradient(135deg, #FDFBF7 0%, #F7F2EA 62%, #EFE6D6 100%)",
        boxShadow: "0 10px 32px rgba(184,149,85,0.16), inset 0 1px 2px rgba(255,255,255,0.42)",
      }}
    >
      <h3 className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#064E3B]">
        Who is this developer?
      </h3>
      <p className="mt-2 text-[#1A1A1A]/80 text-sm md:text-base leading-relaxed max-w-4xl">
        {explainer}
      </p>

      <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {facts.map((fact) => (
          <div
            key={fact.label}
            className="rounded-xl border border-[#B89555]/30 bg-[#FDFBF7] px-4 py-3 min-w-0"
          >
            <div className="flex items-center gap-2">
              <fact.icon className="w-3.5 h-3.5 text-[#064E3B] shrink-0" aria-hidden />
              <span className="text-[10px] uppercase tracking-[0.16em] font-bold text-[#064E3B]">
                {fact.label}
              </span>
            </div>
            <p className="mt-1 text-sm font-semibold text-[#1A1A1A] break-words">{fact.value}</p>
          </div>
        ))}
      </div>

      {slug && (
        <Link
          to={`/developer/${slug}`}
          data-emerald-action="true"
          className="jj-emerald-action group mt-5 flex items-center justify-between gap-4 rounded-xl px-5 py-4 transition-transform active:scale-[0.99]"
        >
          <span className="min-w-0">
            <span className="block text-[10px] uppercase tracking-[0.2em] font-bold opacity-80">
              Developer portfolio
            </span>
            <span className="mt-1 block text-sm md:text-base font-semibold whitespace-normal break-words [text-wrap:balance]">
              See every project by {name}
            </span>
          </span>
          <ArrowUpRight
            strokeWidth={2.2}
            className="w-5 h-5 shrink-0 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
            aria-hidden
          />
        </Link>
      )}
    </section>
  );
}
