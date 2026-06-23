import * as React from "react";
import { cn } from "@/lib/utils";

type Variant = "solid" | "soft" | "outline";

export interface EmeraldPillProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: Variant;
}

/**
 * EmeraldPill — pill-shaped emerald chip for status labels:
 * "Starter", "Broker Workspace", "Live Roles", "21 Open",
 * AI chips, online state, chatbot, notification badges.
 */
export const EmeraldPill = React.forwardRef<HTMLSpanElement, EmeraldPillProps>(
  ({ className, variant = "solid", ...props }, ref) => {
    const variantCls = "jj-official-emerald jj-surface-emerald";
    return (
      <span
        ref={ref}
        data-emerald-ok="pill"
        data-surface="emerald"
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold whitespace-nowrap transition-colors",
          variantCls,
          className
        )}
        {...props}
      />
    );
  }
);
EmeraldPill.displayName = "EmeraldPill";
