import * as React from "react";
import { cn } from "@/lib/utils";
import { formatDisplayDate } from "@/utils/formatDate";

interface HandoverPillProps {
  /** Raw handover date string (e.g. "Q4 2026", "2027-06", or explicit "Ready"). */
  value?: string | null;
  className?: string;
  /** Kept for compatibility; empty values never render a fake status. */
  hideIfEmpty?: boolean;
}

/**
 * Site-wide handover label. Mirrors the "Starting price" chrome
 * (`.price-pill-premium`) — translucent champagne glass, 1.5px solid gold
 * hairline, ink text, 8px radius. Never filled metallic, never orange.
 * Per legal-risk rule: never infer or default to "Ready".
 */
export function HandoverPill({ value, className, hideIfEmpty }: HandoverPillProps) {
  const display = React.useMemo(() => {
    if (!value) return null;
    const lower = String(value).toLowerCase();
    if (lower.includes("ready")) return "Ready";
    const formatted = formatDisplayDate(value);
    return formatted || String(value).trim() || null;
  }, [value, hideIfEmpty]);

  if (!display) return null;

  return (
    <span
      data-handover-pill
      data-no-contrast-guard
      className={cn(
        "inline-flex items-center whitespace-nowrap",
        className,
      )}
      style={{
        // Visual twin of .price-pill-premium
        background: "rgba(253, 251, 247, 0.55)",
        backdropFilter: "blur(14px) saturate(160%)",
        WebkitBackdropFilter: "blur(14px) saturate(160%)",
        border: "1.5px solid #B89555",
        borderRadius: 8,
        boxShadow:
          "0 6px 18px rgba(0,0,0,0.22), inset 0 1px 0 rgba(255,255,255,0.85), 0 0 0 1px rgba(184,149,85,0.25)",
        padding: "6px 12px",
        color: "#1A1A1A",
        fontFamily:
          "'Inter', system-ui, -apple-system, sans-serif",
        fontWeight: 900,
        fontSize: 14,
        lineHeight: 1,
        letterSpacing: "-0.01em",
        fontVariantNumeric: "tabular-nums",
        WebkitTextFillColor: "#1A1A1A",
      }}
    >
      {display}
    </span>
  );
}

export default HandoverPill;
