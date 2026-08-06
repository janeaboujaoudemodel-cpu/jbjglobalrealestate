/**
 * Two-card chooser (List Manually / List with AI) used in:
 *   - /broker/listings/new (dedicated page)
 *   - /broker/listings (My Listings) inline section + empty state
 *
 * Keep this component as the single source of truth so both surfaces stay in sync.
 *
 * Surface: JBJ emerald ombré (#064E3B → #042c1c → #000) with pure-white ink and
 * white translucent hairlines. Never gold borders on emerald.
 */
import { Link } from "react-router-dom";
import { ClipboardCheck, Wand2, Sparkles, ArrowRight } from "lucide-react";

const WHITE = "#FFFFFF";
const EMERALD_OMBRE =
  "linear-gradient(135deg, #064E3B 0%, #042c1c 55%, #000000 100%)";

export function ListingModeCards({
  manualTo = "/broker/listings/new/manual",
  aiTo = "/broker/listings/new/ai",
}: {
  manualTo?: string;
  aiTo?: string;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      <ListingModeCard
        to={manualTo}
        icon={<ClipboardCheck className="w-6 h-6" style={{ color: WHITE, stroke: WHITE }} />}
        eyebrow="Full Control"
        title="List Manually"
        description="Fill in every field yourself — price, location, photos, amenities and contact preferences. Best when you already have the full property details ready."
        tag="≈ 4–6 minutes"
      />
      <ListingModeCard
        to={aiTo}
        icon={<Wand2 className="w-6 h-6" style={{ color: WHITE, stroke: WHITE }} />}
        eyebrow="AI-Assisted"
        title="List with AI"
        description="Paste any portal link, brochure or short description. Our AI auto-fills the listing in seconds — you only review and confirm before submitting."
        tag="≈ 60 seconds"
        accent
      />
    </div>
  );
}

function ListingModeCard({
  to,
  icon,
  eyebrow,
  title,
  description,
  tag,
  accent,
}: {
  to: string;
  icon: React.ReactNode;
  eyebrow: string;
  title: string;
  description: string;
  tag: string;
  accent?: boolean;
}) {
  return (
    <Link
      to={to}
      data-surface="dark"
      data-ink-emerald
      data-no-contrast-guard
      className="group relative flex flex-col rounded-2xl p-6 md:p-7 transition-all hover:-translate-y-0.5"
      style={{
        backgroundImage: EMERALD_OMBRE,
        border: "1px solid rgba(255,255,255,0.22)",
        boxShadow:
          "0 18px 40px -26px rgba(0,0,0,0.75), inset 0 1px 0 rgba(255,255,255,0.14)",
        color: WHITE,
        WebkitTextFillColor: WHITE,
      }}
    >
      <div className="flex items-start justify-between gap-4">
        <div
          className="w-12 h-12 rounded-xl grid place-items-center shrink-0"
          style={{
            background: "rgba(255,255,255,0.08)",
            border: "1px solid rgba(255,255,255,0.28)",
          }}
        >
          {icon}
        </div>
        {accent && (
          <span
            className="inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.18em] font-bold px-2 py-0.5 rounded-full"
            style={{
              color: WHITE,
              WebkitTextFillColor: WHITE,
              background: "rgba(255,255,255,0.10)",
              border: "1px solid rgba(255,255,255,0.34)",
            }}
          >
            <Sparkles className="w-3 h-3" style={{ color: WHITE, stroke: WHITE }} /> Recommended
          </span>
        )}
      </div>

      <div className="mt-5">
        <div
          className="text-xs uppercase tracking-[0.18em] font-semibold"
          style={{ color: "rgba(255,255,255,0.72)", WebkitTextFillColor: "rgba(255,255,255,0.72)" }}
        >
          {eyebrow}
        </div>
        <h2
          className="mt-1 text-xl md:text-2xl font-bold leading-tight"
          style={{ color: WHITE, WebkitTextFillColor: WHITE }}
        >
          {title}
        </h2>
        <p
          className="mt-2 text-sm leading-relaxed"
          style={{ color: "rgba(255,255,255,0.82)", WebkitTextFillColor: "rgba(255,255,255,0.82)" }}
        >
          {description}
        </p>
      </div>

      <div className="mt-6 flex items-center justify-between gap-3">
        <span
          className="text-xs font-semibold rounded-md px-2 py-1"
          style={{
            color: WHITE,
            WebkitTextFillColor: WHITE,
            background: "rgba(255,255,255,0.08)",
            border: "1px solid rgba(255,255,255,0.24)",
          }}
        >
          {tag}
        </span>
        <span
          className="inline-flex items-center gap-1.5 text-sm font-semibold group-hover:gap-2 transition-all"
          data-no-contrast-guard
          style={{ color: WHITE, WebkitTextFillColor: WHITE }}
        >
          Start
          <ArrowRight className="w-4 h-4" style={{ color: WHITE, stroke: WHITE }} />
        </span>
      </div>
    </Link>
  );
}
