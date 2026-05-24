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

// PRIMARY: champagne mother-of-pearl with gold hairline — premium default CTA
// Replaces the legacy black/white look site-wide per brand standard.
const BRAND_PRIMARY =
  "bg-[linear-gradient(135deg,#FDFBF7_0%,#F7F1E6_50%,#ECE2D2_100%)] text-[#1A1A1A] border border-[#B89555] hover:bg-[linear-gradient(135deg,#FFFFFF_0%,#FAF4E8_50%,#EFE2C9_100%)] hover:border-[#A68444] shadow-[0_4px_14px_-4px_rgba(184,149,85,0.35),inset_0_1px_0_rgba(255,255,255,0.9)] hover:shadow-[0_10px_28px_-8px_rgba(184,149,85,0.5),inset_0_1px_0_rgba(255,255,255,0.95)] hover:-translate-y-0.5 active:translate-y-0 font-semibold";

// SECONDARY: champagne surface, gold border
const BRAND_SECONDARY =
  "bg-[#F7F2EA] text-[#1A1A1A] border-2 border-[#B89555]/40 hover:bg-[#EFE6D6] hover:border-[#B89555] hover:-translate-y-0.5 active:translate-y-0";

// TERTIARY: subtle champagne ghost
const BRAND_TERTIARY =
  "bg-[#F7F2EA] text-[#1A1A1A]/75 border-2 border-[#B89555]/20 hover:bg-[#EFE6D6] hover:text-[#1A1A1A] hover:border-[#B89555]/40";

// GOLD: cream champagne tile with thin gold border (debranded fill)
const BRAND_GOLD =
  "bg-[#EFE6D6] text-[#1A1A1A] border border-[#B89555] hover:bg-[#F7F2EA] hover:border-[#A68444] shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 font-semibold";

// HERO: transparent with white border on dark images (dark hero overlays)
const BRAND_HERO =
  "bg-transparent text-white border-2 border-white/60 shadow-[0_14px_45px_hsl(0_0%_0%/0.35),inset_0_1px_0_hsl(0_0%_100%/0.18)] hover:bg-[#FDFBF7] hover:text-[#1A1A1A] hover:border-white hover:-translate-y-0.5 active:translate-y-0";

const BRAND_MEDIA = BRAND_HERO;

// DARK: dark surface (for dark sections only)
const BRAND_DARK =
  "bg-[#1A1A1A] text-white border-2 border-[#B89555]/40 hover:bg-[#2A2A2A] hover:text-white hover:border-[#B89555] hover:-translate-y-0.5 active:translate-y-0";

// AI Tool button variants — keep AI premium purple identity
const AI_MONO = "bg-[#1A1A1A] hover:bg-[#2A2A2A] text-white border border-[#B89555]/40 shadow-sm";

// Dark theme variants (for use on dark sections)
const DARK_GHOST = "bg-transparent text-white border-2 border-[#B89555]/40 hover:bg-[#FDFBF7]/10 hover:border-[#B89555] transition-all";
const DARK_OUTLINE = "bg-transparent text-white border-2 border-white/40 hover:bg-[#FDFBF7]/10 hover:border-white/60 transition-all";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap [word-break:keep-all] rounded-md text-sm font-semibold ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-60 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 cursor-pointer tracking-[0.02em]",
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
