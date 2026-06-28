import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * DsBadge — JBJ Design System (Phase 1.A)
 *
 * One badge primitive covering Featured / Partner / Top / Live / Neutral / Success / Warn.
 * Sized so text is never cropped. Auto-adapts foreground based on surface:
 *   - emerald  → pure white text/icons
 *   - champagne→ ink text/icons, gold hairline
 *   - pearl    → ink text/icons, soft hairline
 *   - inverse  → ink fill, white text (e.g. "21 OPEN" counter)
 *
 * No blue, no navy, no random green. No oversized variants.
 */

const ds = cva(
  [
    "inline-flex items-center gap-1.5 whitespace-nowrap",
    "rounded-full font-semibold tracking-[0.04em]",
    "h-7 px-3 text-[11px] leading-none uppercase",
    "[&_svg]:w-3.5 [&_svg]:h-3.5 [&_svg]:shrink-0",
  ].join(" "),
  {
    variants: {
      tone: {
        featured:  "bg-[#F7F2EA] text-[#1A1A1A] border border-[#B89555]/55",
        partner:   "bg-[#EFE6D6] text-[#1A1A1A] border border-[#B89555]/55",
        top:       "text-white border border-transparent",
        live:      "bg-[#F7F2EA] text-[#047857] border border-[#047857]/30",
        neutral:   "bg-[#F7F2EA] text-[#1A1A1A] border border-[#1A1A1A]/12",
        success:   "bg-[#F0FAF5] text-[#047857] border border-[#047857]/25",
        warn:      "bg-[#FBF3E6] text-[#8a5a13] border border-[#B89555]/45",
        inverse:   "text-white border border-transparent",
      },
      size: {
        sm: "h-6 px-2.5 text-[10px] [&_svg]:w-3 [&_svg]:h-3",
        md: "h-7 px-3 text-[11px]",
        lg: "h-8 px-3.5 text-[12px]",
      },
    },
    defaultVariants: { tone: "featured", size: "md" },
  },
);

export interface DsBadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof ds> {}

export const DsBadge = React.forwardRef<HTMLSpanElement, DsBadgeProps>(
  ({ className, tone, size, style, children, ...props }, ref) => {
    const isEmerald = tone === "top" || tone === "inverse";
    const mergedStyle: React.CSSProperties | undefined =
      tone === "top"
        ? { backgroundImage: "var(--jj-emerald-ombre)", color: "#FFFFFF", ...style }
        : tone === "inverse"
        ? { backgroundColor: "#1A1A1A", color: "#FFFFFF", ...style }
        : style;
    return (
      <span
        ref={ref}
        data-jjds-badge=""
        data-jjds-tone={tone ?? "featured"}
        data-no-contrast-guard={isEmerald ? "" : undefined}
        data-surface={isEmerald ? "emerald" : "light"}
        className={cn(isEmerald && "allow-white", ds({ tone, size }), className)}
        style={mergedStyle}
        {...props}
      >
        {children}
      </span>
    );
  },
);
DsBadge.displayName = "DsBadge";

export default DsBadge;
