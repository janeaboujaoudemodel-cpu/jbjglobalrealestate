import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface Props {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

/**
 * Global premium empty-state.
 *
 * Renders the JBJ system contract automatically:
 *  - Champagne surface with a thin gold hairline (top)
 *  - Emerald icon tile + WHITE glyph (auto-painted by index.css)
 *  - Strong black headline, refined supporting copy
 *  - Single optional CTA slot
 *
 * Pages must NEVER style empty states locally — use this component
 * (or `data-empty-state` on any wrapper) so the system inherits.
 */
export default function BrokerEmptyState({ icon, title, description, action, className }: Props) {
  return (
    <div
      data-empty-state=""
      data-surface="champagne"
      className={cn(
        "relative overflow-hidden rounded-2xl bg-[#FDFBF7] border border-[color:var(--emerald-1)]/18",
        "px-8 py-12 text-center shadow-[0_10px_30px_-22px_rgba(6,78,59,0.35)]",
        className,
      )}
    >
      {/* gold hairline top */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-[#B89555]/55 to-transparent"
      />
      {/* soft emerald radial */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(6,78,59,0.07),transparent_55%)]"
      />

      {icon && (
        <div
          data-icon-tile=""
          data-icon-tile-tone="emerald"
          data-empty-state-icon=""
          className="relative mx-auto mb-5 grid place-items-center h-14 w-14 rounded-2xl jj-icon-tile-emerald shadow-[0_10px_24px_-14px_rgba(6,78,59,0.65)]"
        >
          <span className="text-white [&>svg]:h-6 [&>svg]:w-6 [&>svg]:stroke-white">{icon}</span>
        </div>
      )}

      <div className="relative font-display text-lg md:text-xl font-semibold text-[#1A1A1A] tracking-tight">
        {title}
      </div>

      {/* accent rule */}
      <div className="relative mt-3 flex items-center justify-center gap-2" aria-hidden="true">
        <span className="block h-px w-8 bg-gradient-to-r from-transparent via-[color:var(--emerald-1)]/45 to-transparent" />
        <span className="block w-1 h-1 rotate-45 bg-[color:var(--emerald-1)]/60" />
        <span className="block h-px w-8 bg-gradient-to-r from-transparent via-[color:var(--emerald-1)]/45 to-transparent" />
      </div>

      {description && (
        <p className="relative mt-3 text-sm text-[#1A1A1A]/70 max-w-md mx-auto leading-relaxed">
          {description}
        </p>
      )}

      {action && <div className="relative mt-6 flex justify-center">{action}</div>}
    </div>
  );
}
