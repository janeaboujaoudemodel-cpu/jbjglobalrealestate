import * as React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

/**
 * BrandCheckbox — wraps the shadcn Checkbox and pins it to the
 * "white box + gold hairline + gold ✓" treatment via brand tokens.
 *
 * The global override in `src/styles/theme-tokens.css` also enforces
 * this look for every Radix checkbox in the app; this component is
 * the explicit, typed entry point you should reach for in new code,
 * so the gold tick stays consistent even if the global override is
 * ever opted-out via `data-no-gold-check`.
 */

export type BrandCheckboxProps = React.ComponentProps<typeof Checkbox>;

export const BrandCheckbox = React.forwardRef<
  React.ElementRef<typeof Checkbox>,
  BrandCheckboxProps
>(({ className, ...props }, ref) => {
  return (
    <Checkbox
      ref={ref}
      className={cn(
        "bg-[hsl(var(--page))] border-[1.5px] border-brand-gold text-brand-gold",
        "data-[state=checked]:bg-[hsl(var(--page))] data-[state=checked]:text-brand-gold",
        "data-[state=checked]:border-brand-gold",
        "data-[state=checked]:shadow-[0_0_0_3px_var(--brand-gold-soft)]",
        "focus-visible:ring-2 focus-visible:ring-brand-gold-ring focus-visible:ring-offset-0",
        className,
      )}
      {...props}
    />
  );
});
BrandCheckbox.displayName = "BrandCheckbox";

export default BrandCheckbox;
