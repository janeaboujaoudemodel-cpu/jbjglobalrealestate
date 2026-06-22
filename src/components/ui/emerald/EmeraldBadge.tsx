import * as React from "react";
import { cn } from "@/lib/utils";

type Variant = "solid" | "soft" | "outline";
type Size = "sm" | "md";

export interface EmeraldBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: Variant;
  size?: Size;
}

/**
 * EmeraldBadge — the ONE official emerald badge.
 * Replaces every raw `bg-green-* / bg-emerald-*` badge in the app.
 */
export const EmeraldBadge = React.forwardRef<HTMLSpanElement, EmeraldBadgeProps>(
  ({ className, variant = "solid", size = "sm", ...props }, ref) => {
    const sizeCls =
      size === "md" ? "text-sm px-3 py-1" : "text-xs px-2.5 py-0.5";
    const variantCls =
      variant === "solid"
        ? "jj-surface-emerald"
        : variant === "soft"
        ? "jj-surface-emerald-soft"
        : "jj-surface-emerald-outline";
    return (
      <span
        ref={ref}
        data-emerald-ok="badge"
        data-surface={variant === "solid" ? "emerald" : "champagne"}
        className={cn(
          "inline-flex items-center gap-1 rounded-md font-semibold whitespace-nowrap transition-colors",
          sizeCls,
          variantCls,
          className
        )}
        {...props}
      />
    );
  }
);
EmeraldBadge.displayName = "EmeraldBadge";
