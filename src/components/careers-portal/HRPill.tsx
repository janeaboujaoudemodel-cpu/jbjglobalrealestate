import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * HRPill — canonical Careers Portal filter / segmented-control pill.
 *
 * Every status / lifecycle / stage filter inside the Careers Portal
 * (CV Center stages, Approvals tabs, Onboarding tabs, Comms filters,
 *  Warnings filters, AI Recruiting modes, etc.) MUST use this primitive
 * so active/idle/hover state is consistent everywhere.
 *
 * Rules (Phase 3):
 *  • Active   → solid JBJ navy (#102540), white label, gold hairline.
 *  • Idle     → champagne fill, ink label, faded gold hairline.
 *  • Hover    → deeper champagne tint; text NEVER turns white-on-white.
 *  • Count badge slot is rendered INSIDE the pill, never detached/floating.
 */
export interface HRPillProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  icon?: React.ComponentType<{ className?: string }>;
  count?: number | null;
  size?: "sm" | "md";
}

export const HRPill = React.forwardRef<HTMLButtonElement, HRPillProps>(
  (
    { active, icon: Icon, count, size = "md", className, style, children, ...rest },
    ref,
  ) => {
    const pad = size === "sm" ? "px-2.5 py-1 text-[12px]" : "px-3 py-1.5 text-[13px]";
    // Inline style beats any stylesheet (including contrast guards) and any
    // runtime DOM mutation. Active = navy fill + white text at ALL states
    // (idle, hover, focus). Idle = champagne + ink. No ambiguity.
    const lockedStyle: React.CSSProperties = active
      ? { backgroundColor: "#102540", color: "#FFFFFF", borderColor: "#B89555" }
      : { backgroundColor: "#FDFBF7", color: "#1A1A1A" };
    return (
      <button
        ref={ref}
        type="button"
        aria-pressed={active}
        data-active={active ? "true" : "false"}
        data-hr-pill=""
        data-allow-dark-cta={active ? "" : undefined}
        data-no-contrast-guard={active ? "" : undefined}
        style={{ ...lockedStyle, ...style }}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border font-semibold whitespace-nowrap transition-colors select-none",
          pad,
          active
            ? "border-[#B89555] shadow-sm hover:bg-[#1a3d63]"
            : "border-[#B89555]/40 hover:bg-[#EFE6D6] hover:border-[#B89555]",
          className,
        )}
        {...rest}
      >
        {Icon ? (
          <Icon
            data-no-contrast-guard
            style={{ color: active ? "#FFFFFF" : "#1A1A1A", stroke: "currentColor" }}
            className={cn(
              "h-3.5 w-3.5 shrink-0",
              active ? "allow-white" : "",
            )}
          />
        ) : null}
        <span
          data-no-contrast-guard
          style={{ color: active ? "#FFFFFF" : "#1A1A1A" }}
          className="inline-flex items-baseline gap-1"
        >
          <span>{children}</span>
          {typeof count === "number" && (
            <span
              data-no-contrast-guard
              style={{ color: active ? "rgba(255,255,255,0.85)" : "rgba(26,26,26,0.65)" }}
              className="tabular-nums text-[11px] font-semibold"
            >
              ({count})
            </span>
          )}
        </span>
      </button>
    );
  },
);
HRPill.displayName = "HRPill";

export default HRPill;
