import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/**
 * ============================================================
 * GLOBAL BUTTON SYSTEM - JBJ GLOBAL REAL ESTATE
 * MONOCHROME DESIGN SYSTEM — Black, White, Grayscale Only
 * ============================================================
 */

// PRIMARY: Solid black button — strong CTA on white pages
const BRAND_PRIMARY =
  "bg-black text-white border-2 border-black hover:bg-gray-800 hover:border-gray-800 shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0";

// SECONDARY: Outlined — black border on white
const BRAND_SECONDARY =
  "bg-transparent text-black border-2 border-gray-300 hover:bg-gray-100 hover:border-gray-400 hover:-translate-y-0.5 active:translate-y-0";

// TERTIARY: Subtle ghost
const BRAND_TERTIARY =
  "bg-gray-100 text-gray-700 border-2 border-gray-200 hover:bg-gray-200 hover:text-black hover:border-gray-300";

// HERO: transparent with white border on dark images (keep dark for hero overlays)
const BRAND_HERO =
  "bg-transparent text-white border-2 border-white/60 shadow-[0_14px_45px_hsl(0_0%_0%/0.35),inset_0_1px_0_hsl(0_0%_100%/0.18)] hover:bg-white hover:text-black hover:border-white hover:-translate-y-0.5 active:translate-y-0";

// MEDIA: alias to HERO
const BRAND_MEDIA = BRAND_HERO;

// DARK: dark surface (for dark sections only)
const BRAND_DARK =
  "bg-gray-900 text-white border-2 border-gray-700 hover:bg-white hover:text-black hover:border-gray-300 hover:-translate-y-0.5 active:translate-y-0";

// AI Tool button variants — dark unified
const AI_MONO = "bg-gray-900 hover:bg-gray-800 text-white border border-gray-700 shadow-sm";

// Dark theme variants (for use on dark sections)
const DARK_GHOST = "bg-transparent text-white border-2 border-gray-600 hover:bg-white/10 hover:border-white/40 transition-all";
const DARK_OUTLINE = "bg-transparent text-white border-2 border-white/40 hover:bg-white/10 hover:border-white/60 transition-all";

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
        default: "h-10 px-6 py-2",
        sm: "h-9 rounded-md px-4",
        lg: "h-12 rounded-md px-8 text-base",
        icon: "h-10 w-10 !translate-y-0 hover:!translate-y-0 active:!translate-y-0",
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

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
