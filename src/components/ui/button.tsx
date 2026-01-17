import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/**
 * ============================================================
 * GLOBAL BUTTON SYSTEM - JBJ GLOBAL REAL ESTATE (LOCKED)
 * ============================================================
 * ALLOWED BRANDED STYLES:
 * - primary: White bg → transparent on hover
 * - secondary: Transparent bg → white on hover
 * - media: For image/video backgrounds (white text → gold on hover)
 *
 * ENFORCEMENT:
 * - Any visual overrides passed via className are automatically stripped
 *   (bg-*, gradient from/to/via, shadow-*, scale-*, text/border color overrides).
 * - Legacy/utility variants remain ONLY as aliases to prevent build breaks;
 *   they render as one of the 3 branded styles.
 * ============================================================
 */

const BRAND_PRIMARY =
  "bg-white text-gold border-2 border-gold hover:bg-transparent hover:text-gold";
const BRAND_SECONDARY =
  "bg-transparent text-gold border-2 border-gold hover:bg-white hover:text-gold";
const BRAND_MEDIA =
  "bg-transparent text-white border-2 border-white hover:bg-white hover:text-gold hover:border-gold";
const BRAND_DARK =
  "bg-black text-gold border-2 border-gold hover:bg-gold hover:text-black";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-semibold ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 cursor-pointer tracking-[0.02em]",
  {
    variants: {
      variant: {
        // LOCKED branded variants
        primary: BRAND_PRIMARY,
        secondary: BRAND_SECONDARY,
        media: BRAND_MEDIA,
        dark: BRAND_DARK,

        // Legacy aliases (render as branded variants)
        default: BRAND_PRIMARY,
        destructive: BRAND_PRIMARY,
        outline: BRAND_SECONDARY,
        ghost: BRAND_SECONDARY,
        link: BRAND_SECONDARY,
      },
      size: {
        default: "h-10 px-6 py-2",
        sm: "h-9 rounded-md px-4",
        lg: "h-12 rounded-md px-8 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const COLOR_WORDS =
  "gold|white|black|zinc|gray|slate|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose";

const forbiddenClassPatterns: RegExp[] = [
  // Backgrounds + gradients
  new RegExp(`(^|:)(bg-|from-|via-|to-)`),
  // Shadows / glows
  new RegExp(`(^|:)shadow`),
  new RegExp(`(^|:)drop-shadow`),
  // Scaling / transforms used as effects
  new RegExp(`(^|:)(hover:)?scale-`),
  // Hover color overrides
  new RegExp(`(^|:)hover:(bg-|text-|border-)`),
  // Text color overrides (but NOT sizing like text-sm)
  new RegExp(`(^|:)text-(${COLOR_WORDS})(-|/|$)`),
  // Border color overrides (but NOT widths like border-2)
  new RegExp(`(^|:)border-(${COLOR_WORDS})(-|/|$)`),
];

function sanitizeButtonClassName(className?: string) {
  if (!className) return undefined;
  const tokens = className.split(/\s+/).filter(Boolean);
  const kept = tokens.filter((t) => !forbiddenClassPatterns.some((re) => re.test(t)));
  return kept.join(" ") || undefined;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    const safeClassName = sanitizeButtonClassName(className);

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className: safeClassName }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
