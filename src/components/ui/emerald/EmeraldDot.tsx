import * as React from "react";
import { cn } from "@/lib/utils";

export interface EmeraldDotProps extends React.HTMLAttributes<HTMLSpanElement> {
  size?: number;
  pulse?: boolean;
}

/**
 * EmeraldDot — single online/active indicator.
 * Replaces ad-hoc `bg-green-500` round spans across the app.
 */
export const EmeraldDot = React.forwardRef<HTMLSpanElement, EmeraldDotProps>(
  ({ className, size = 8, pulse = false, style, ...props }, ref) => {
    return (
      <span
        ref={ref}
        data-emerald-ok="dot"
        className={cn(
          "inline-block rounded-full jj-emerald-dot",
          pulse && "animate-pulse",
          className
        )}
        style={{ width: size, height: size, ...style }}
        {...props}
      />
    );
  }
);
EmeraldDot.displayName = "EmeraldDot";
