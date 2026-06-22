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
        variant={tone === "solid" ? "primary" : "secondary"}
        data-emerald-ok="button"
        data-surface={tone === "solid" ? "emerald" : "champagne"}
        data-cta={tone === "solid" ? "primary" : "outline"}
        data-ink-emerald={tone === "solid" ? "" : undefined}
        className={cn(
          "font-semibold transition-colors",
          tone === "solid" ? "jj-emerald-solid" : "jj-emerald-outline",
          className
        )}
        {...props}
      />
    );
  }
);
EmeraldButton.displayName = "EmeraldButton";
