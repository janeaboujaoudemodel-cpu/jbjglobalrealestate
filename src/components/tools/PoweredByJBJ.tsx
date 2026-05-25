import { TOOL_GOLD } from "./toolThemes";

/**
 * Replacement for the legacy Jane / Founder block on tool pages.
 * Renders a clean "Powered by JBJ Global Real Estate" lockup with
 * a single gold hairline above. Brand-first, no personal attribution.
 */
export const PoweredByJBJ = ({
  className = "",
  onDark = false,
}: {
  className?: string;
  onDark?: boolean;
}) => {
  const ink = onDark ? "rgba(255,255,255,0.85)" : "#1A1A1A";
  const muted = onDark ? "rgba(255,255,255,0.55)" : "rgba(26,26,26,0.55)";

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div
        aria-hidden
        className="h-px flex-1 max-w-[80px]"
        style={{ background: `${TOOL_GOLD}` }}
      />
      <div className="flex items-center gap-2">
        <span
          className="text-[10px] uppercase tracking-[0.22em] font-semibold"
          style={{ color: muted }}
        >
          Powered by
        </span>
        <span
          className="text-xs font-bold tracking-[0.14em]"
          style={{ color: ink }}
        >
          JBJ GLOBAL REAL ESTATE
        </span>
      </div>
      <div
        aria-hidden
        className="h-px flex-1 max-w-[80px]"
        style={{ background: `${TOOL_GOLD}` }}
      />
    </div>
  );
};
