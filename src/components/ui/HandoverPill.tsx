import * as React from "react";
import { cn } from "@/lib/utils";
import { formatDisplayDate } from "@/utils/formatDate";

interface HandoverPillProps {
  /** Raw handover date string (e.g. "Q4 2026", "2027-06", or "Ready"). */
  value?: string | null;
  className?: string;
  /** When true, renders nothing instead of falling back to "Ready". */
  hideIfEmpty?: boolean;
}

/**
 * Site-wide handover label. ALWAYS metallic champagne-gold (orange retired
 * across the platform). Use anywhere a project's handover date or "Ready"
 * status is shown.
 *
 * Per memory: never display the word "Handover" — only the date or "Ready".
 */
export function HandoverPill({ value, className, hideIfEmpty }: HandoverPillProps) {
  const display = React.useMemo(() => {
    if (!value) return hideIfEmpty ? null : "Ready";
    const lower = String(value).toLowerCase();
    if (lower.includes("ready")) return "Ready";
    const formatted = formatDisplayDate(value);
    return formatted || "Ready";
  }, [value, hideIfEmpty]);

  if (!display) return null;

  return (
    <span
      data-handover-pill
      data-no-contrast-guard
      className={cn(
        "jj-cta-gold-metallic inline-flex items-center whitespace-nowrap px-2.5 py-1 text-[11px] md:text-xs font-bold",
        className,
      )}
      style={{ borderRadius: 6 }}
    >
      {display}
    </span>
  );
}

export default HandoverPill;
