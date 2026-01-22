import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/**
 * ============================================================
 * GLOBAL BUTTON SYSTEM - JBJ GLOBAL REAL ESTATE (LOCKED)
 * ============================================================
 * ALLOWED BRANDED STYLES:
 * - primary: 3D Champagne Gold with split text (used for main CTAs)
 * - secondary: Transparent bg with gold border → champagne fill on hover
 * - tertiary: White/champagne fill (for dark backgrounds) with black text/border
 *             On hover: text becomes gold, arrow becomes black
 * - media: For image/video backgrounds (white text → gold on hover)
 * - dark: Black bg with gold text → champagne on hover
 *
 * ENFORCEMENT:
 * - Any visual overrides passed via className are automatically stripped
 *   (bg-*, gradient from/to/via, shadow-*, scale-*, text/border color overrides).
 * - Legacy/utility variants remain ONLY as aliases to prevent build breaks;
 *   they render as one of the branded styles.
 * ============================================================
 */

/**
 * PRIMARY BUTTON LOGIC (GLOBAL RULE):
 * - Icon BEFORE text: Gold icon → Black first half → Gold second half
 * - Icon AFTER text: Black first half → Gold second half → Black icon
 * - On HOVER: All colors invert
 */

/**
 * Gradients must use HSL tokens (no hex).
 * Locked Champagne (Layer 3) is represented by --pearl-* vars.
 */
const LOCKED_CHAMPAGNE_BG =
  "bg-[linear-gradient(135deg,hsl(var(--pearl-1)),hsl(var(--pearl-2)),hsl(var(--pearl-3)))]";

const BTN_3D =
  "shadow-[0_10px_30px_hsl(var(--gold)/0.35),0_6px_15px_hsl(0_0%_0%/0.22),inset_0_1px_0_hsl(0_0%_100%/0.65)]";
const BTN_3D_HOVER =
  "hover:shadow-[0_14px_45px_hsl(var(--gold)/0.45),0_10px_25px_hsl(0_0%_0%/0.28),inset_0_1px_0_hsl(0_0%_100%/0.75)]";

// PRIMARY: 3D locked champagne fill on load + gold border; hover lifts.
const BRAND_PRIMARY =
  `${LOCKED_CHAMPAGNE_BG} text-foreground border-2 border-gold/80 ${BTN_3D} ${BTN_3D_HOVER} hover:-translate-y-0.5 active:translate-y-0`;

// SECONDARY: transparent on load; on hover becomes locked champagne with dark text.
const BRAND_SECONDARY =
  `bg-transparent text-gold border-2 border-gold/80 ${BTN_3D} hover:${LOCKED_CHAMPAGNE_BG} hover:text-foreground hover:-translate-y-0.5 active:translate-y-0 ${BTN_3D_HOVER}`;

// TERTIARY: For dark backgrounds (filled) with dark text.
const BRAND_TERTIARY =
  `${LOCKED_CHAMPAGNE_BG} text-foreground border-2 border-foreground/70 ${BTN_3D} ${BTN_3D_HOVER} hover:border-gold/80`;

// HERO: matches homepage hero button behavior (transparent → locked champagne on hover).
const BRAND_HERO =
  `bg-transparent text-primary-foreground border-2 border-primary-foreground/70 shadow-[0_14px_45px_hsl(0_0%_0%/0.35),inset_0_1px_0_hsl(0_0%_100%/0.18)] hover:${LOCKED_CHAMPAGNE_BG} hover:text-foreground hover:border-gold/80 hover:-translate-y-0.5 active:translate-y-0 [&_svg]:text-gold`;

// MEDIA (kept for backwards compatibility): alias to HERO.
const BRAND_MEDIA = BRAND_HERO;

// DARK: black surface with gold border; hover becomes locked champagne.
const BRAND_DARK =
  `bg-premium-bg text-gold border-2 border-gold/80 ${BTN_3D} hover:${LOCKED_CHAMPAGNE_BG} hover:text-foreground ${BTN_3D_HOVER} hover:-translate-y-0.5 active:translate-y-0`;

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-semibold ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 cursor-pointer tracking-[0.02em]",
  {
    variants: {
      variant: {
        // LOCKED branded variants
        primary: BRAND_PRIMARY,
        secondary: BRAND_SECONDARY,
        tertiary: BRAND_TERTIARY,
        hero: BRAND_HERO,
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
  // Backgrounds + gradients (but allow hover:bg-gradient for our champagne styling)
  new RegExp(`(^|:)(?!hover:)bg-(?!gradient)`),
  new RegExp(`(^|:)(?!hover:)(from-|via-|to-)(?!white|\\[#FD|\\[#F5)`),
  // Shadows / glows
  new RegExp(`(^|:)shadow`),
  new RegExp(`(^|:)drop-shadow`),
  // Scaling / transforms used as effects
  new RegExp(`(^|:)(hover:)?scale-`),
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
