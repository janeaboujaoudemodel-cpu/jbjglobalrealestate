import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/**
 * ============================================================
 * GLOBAL BUTTON SYSTEM — JBJ GLOBAL REAL ESTATE
 * CHAMPAGNE / GOLD DESIGN SYSTEM
 *  - Page #FDFBF7 · surface #F7F2EA · raised #EFE6D6
 *  - Gold #B89555 · gold-deep #A68444 · ink #1A1A1A
 * ============================================================
 */

// PRIMARY: locked JBJ Emerald gradient with white foreground.
// Contrast is locked globally by .jj-cta-* primitives in index.css.
const BRAND_PRIMARY =
  "jj-cta-primary jj-cta-emerald allow-white border-transparent shadow-[0_4px_14px_-4px_rgba(6,78,59,0.45),inset_0_1px_0_rgba(255,255,255,0.18)] hover:shadow-[0_10px_28px_-8px_rgba(6,78,59,0.55),inset_0_1px_0_rgba(255,255,255,0.22)] hover:-translate-y-0.5 active:translate-y-0";

// SECONDARY: champagne surface, gold border
const BRAND_SECONDARY =
  "jj-cta-outline hover:-translate-y-0.5 active:translate-y-0";

// TERTIARY: subtle champagne ghost
const BRAND_TERTIARY =
  "jj-cta-outline border-[#B89555]/25";

// GOLD: cream champagne tile with thin gold border (debranded fill)
const BRAND_GOLD =
  BRAND_PRIMARY;

// HERO: transparent with white border on dark images (dark hero overlays)
const BRAND_HERO =
  "surface-dark bg-transparent text-white border-2 border-white/45 shadow-[0_14px_45px_hsl(0_0%_0%/0.35),inset_0_1px_0_hsl(0_0%_100%/0.18)] hover:bg-white/10 hover:text-white hover:border-white/70 hover:-translate-y-0.5 active:translate-y-0";

const BRAND_MEDIA = BRAND_HERO;

// DARK: dark surface (for dark sections only)
const BRAND_DARK =
  "jj-cta-dark hover:-translate-y-0.5 active:translate-y-0";

// AI Tool button variants — same locked CTA identity as primary actions.
const AI_MONO = BRAND_PRIMARY;

// Dark theme variants (for use on dark sections)
const DARK_GHOST = "bg-transparent text-white border-2 border-[#B89555]/40 hover:bg-[#FDFBF7]/10 hover:border-[#B89555] transition-all";
const DARK_OUTLINE = "bg-transparent text-white border-2 border-white/40 hover:bg-[#FDFBF7]/10 hover:border-white/60 transition-all";

const DARK_SURFACE_VARIANTS = new Set(["hero", "media", "dark", "dark-ghost", "dark-outline"]);
const LIGHT_CTA_VARIANTS = new Set(["primary", "secondary", "tertiary", "gold", "default", "destructive", "outline", "ghost", "link"]);

const buttonVariants = cva(
  "inline-flex min-h-11 items-center justify-center text-center gap-2 whitespace-normal [word-break:normal] rounded-xl text-sm font-semibold leading-[1.18] ring-offset-background transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-60 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 cursor-pointer tracking-[0.02em] min-w-0 max-w-full overflow-visible",
  {
    variants: {
      variant: {
        // LOCKED branded variants
        primary: BRAND_PRIMARY,
        secondary: BRAND_SECONDARY,
        tertiary: BRAND_TERTIARY,
        gold: BRAND_GOLD,
        hero: BRAND_HERO,
        media: BRAND_MEDIA,
        dark: BRAND_DARK,

        // Legacy aliases
        default: BRAND_PRIMARY,
        destructive: BRAND_PRIMARY,
        outline: BRAND_SECONDARY,
        ghost: BRAND_SECONDARY,
        link: BRAND_SECONDARY,

        // AI Tool variants — all use monochrome
        "ai-emerald": AI_MONO,
        "ai-purple": AI_MONO,
        "ai-blue": AI_MONO,
        "ai-teal": AI_MONO,
        "ai-orange": AI_MONO,
        "ai-indigo": AI_MONO,
        "ai-rose": AI_MONO,
        "ai-cyan": AI_MONO,
        "ai-violet": AI_MONO,
        "ai-amber": AI_MONO,
        "ai-pink": AI_MONO,
        "ai-red": AI_MONO,
        "ai-lime": AI_MONO,
        "ai-sky": AI_MONO,
        "ai-gold": AI_MONO,
        "ai-fuchsia": AI_MONO,

        // Dark theme variants
        "dark-ghost": DARK_GHOST,
        "dark-outline": DARK_OUTLINE,
      },
      size: {
        default: "h-11 px-6 py-2.5",
        sm: "min-h-10 rounded-xl px-4 py-2",
        lg: "h-12 rounded-xl px-8 text-base",
        icon: "h-11 w-11 !translate-y-0 hover:!translate-y-0 active:!translate-y-0",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  },
);

type ButtonVariant = NonNullable<VariantProps<typeof buttonVariants>["variant"]>;
type ButtonSize = NonNullable<VariantProps<typeof buttonVariants>["size"]>;

export interface ButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "color"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    const effectiveVariant = variant ?? "primary";
    const isPrimaryCta = effectiveVariant === "primary" || effectiveVariant === "default" || effectiveVariant === "destructive" || effectiveVariant === "gold" || effectiveVariant.startsWith("ai-");
    const surface = DARK_SURFACE_VARIANTS.has(effectiveVariant) ? "dark" : isPrimaryCta ? "emerald" : "champagne";
    const cta = DARK_SURFACE_VARIANTS.has(effectiveVariant)
      ? "dark"
      : LIGHT_CTA_VARIANTS.has(effectiveVariant)
        ? effectiveVariant === "outline" || effectiveVariant === "ghost" || effectiveVariant === "link" || effectiveVariant === "secondary" || effectiveVariant === "tertiary"
          ? "outline"
          : "primary"
        : undefined;

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        data-jbj-button=""
        data-surface={surface}
        data-cta={cta}
        ref={ref}
        {...props}
        style={{ color: isPrimaryCta ? "#FFFFFF" : undefined, ...(props.style ?? {}) }}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
