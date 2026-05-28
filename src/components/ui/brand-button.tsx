import * as React from "react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * BrandButton — thin wrapper around the global `<Button />` that
 * commits to one of the three brand-locked colour stories:
 *
 *   • navy           : navy fill, white text, gold hairline
 *   • gold-outline   : champagne surface + gold 1px border + ink text
 *   • navy-on-gold   : champagne tile + navy text + gold border
 *
 * Use this anywhere a CTA must visually reinforce the blue/gold
 * identity (forms, footers, lead-capture, careers, etc.). All
 * colours route through the `--brand-*` CSS variables, so a
 * single token swap re-themes every BrandButton in the app.
 */

export type BrandButtonTone = "navy" | "gold-outline" | "navy-on-gold";

const TONE_CLASS: Record<BrandButtonTone, string> = {
  navy:
    "bg-brand-blue hover:bg-brand-blue-hover text-white border border-brand-gold/70 hover:border-brand-gold shadow-sm hover:shadow-md transition-colors",
  "gold-outline":
    "bg-[hsl(var(--champagne-1))] hover:bg-[hsl(var(--champagne-2))] text-[hsl(var(--foreground))] border border-brand-gold hover:border-brand-gold-hover transition-colors",
  "navy-on-gold":
    "bg-[hsl(var(--champagne-2))] hover:bg-[hsl(var(--champagne-3))] text-brand-blue border border-brand-gold hover:border-brand-gold-hover transition-colors",
};

export interface BrandButtonProps extends Omit<ButtonProps, "variant"> {
  tone?: BrandButtonTone;
}

export const BrandButton = React.forwardRef<HTMLButtonElement, BrandButtonProps>(
  ({ tone = "navy", className, ...props }, ref) => {
    return (
      <Button
        ref={ref}
        variant="primary"
        data-allow-dark-cta={tone === "navy" ? "" : undefined}
        className={cn(
          // strip default primary gradient so tone class wins cleanly
          "!bg-none !shadow-none hover:!shadow-none",
          TONE_CLASS[tone],
          className,
        )}
        {...props}
      />
    );
  },
);
BrandButton.displayName = "BrandButton";

export default BrandButton;
