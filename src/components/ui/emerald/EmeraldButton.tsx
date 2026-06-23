import * as React from "react";
import { cn } from "@/lib/utils";
import { Button, type ButtonProps } from "@/components/ui/button";

export interface EmeraldButtonProps extends Omit<ButtonProps, "variant"> {
  tone?: "solid" | "outline";
}

/**
 * EmeraldButton — the ONE official emerald CTA.
 * Used for: Apply, Meet Jessica, primary CTAs that need brand emerald.
 */
export const EmeraldButton = React.forwardRef<HTMLButtonElement, EmeraldButtonProps>(
  ({ className, tone = "solid", ...props }, ref) => {
    return (
      <Button
        ref={ref}
        variant="primary"
        data-emerald-ok="button"
        data-surface="emerald"
        data-cta="primary"
        className={cn(
          "font-semibold transition-colors",
          "jj-official-emerald jj-surface-emerald",
          className
        )}
        {...props}
      />
    );
  }
);
EmeraldButton.displayName = "EmeraldButton";
