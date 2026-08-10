import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";

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
  /** When the developer already has its own description above, the explainer is not repeated. */
  hideExplainer?: boolean;
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
  hideExplainer = false,
  className = "",
}: DeveloperAboutPanelProps) {
  const { name, slug } = developer;
  const trackedCount = projectCount ?? developer.completed_projects ?? null;

  const explainer = projectName
    ? `${projectName} is built and delivered by ${name} — the property developer behind the master plan, the construction and the final handover of your unit. JBJ works directly with ${name} on this launch, so pricing, availability and payment terms you see here come from the developer's own inventory.`
    : `${name} is a property developer: the company that buys the land, designs the master plan, builds the towers or villas and hands the finished homes over to owners. Everything listed below is inventory JBJ tracks directly from ${name}, so pricing, availability and payment terms are taken from the developer's own release — not from resale listings.`;

  return (
    <section
      data-developer-about-panel="true"
      className={`rounded-2xl border border-[#B89555]/35 p-5 md:p-6 ${className}`}
      style={{
        background: "linear-gradient(135deg, #FDFBF7 0%, #F7F2EA 62%, #EFE6D6 100%)",
        boxShadow: "0 10px 32px rgba(184,149,85,0.16), inset 0 1px 2px rgba(255,255,255,0.42)",
      }}
    >
      {!hideExplainer && (
        <p className="text-[#1A1A1A]/80 text-sm md:text-base leading-relaxed">{explainer}</p>
      )}

      {slug && (
        <Link
          to={`/developer/${slug}`}
          data-emerald-action="true"
          className={`jj-emerald-action group ${hideExplainer ? "" : "mt-5"} flex items-center justify-between gap-4 rounded-xl px-5 py-4 transition-transform active:scale-[0.99]`}
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
