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

const BTN_3D =
  "shadow-[0_10px_30px_hsl(0_0%_100%/0.08),0_6px_15px_hsl(0_0%_0%/0.22),inset_0_1px_0_hsl(0_0%_100%/0.15)]";
const BTN_3D_HOVER =
  "hover:shadow-[0_14px_45px_hsl(0_0%_100%/0.12),0_10px_25px_hsl(0_0%_0%/0.28),inset_0_1px_0_hsl(0_0%_100%/0.2)]";

// PRIMARY: White bg, black text
const BRAND_PRIMARY =
  `bg-white text-black border-2 border-white/80 ${BTN_3D} ${BTN_3D_HOVER} hover:-translate-y-0.5 active:translate-y-0 hover:bg-white/90`;

// SECONDARY: transparent with white border
const BRAND_SECONDARY =
  `bg-transparent text-white border-2 border-white/40 ${BTN_3D} hover:bg-white hover:text-black hover:border-white hover:-translate-y-0.5 active:translate-y-0 ${BTN_3D_HOVER}`;

// TERTIARY: Dark surface
const BRAND_TERTIARY =
  `bg-[#1A1A1A] text-white border-2 border-white/20 ${BTN_3D} ${BTN_3D_HOVER} hover:border-white/40`;

// HERO: transparent with white border on dark images
const BRAND_HERO =
  `bg-transparent text-white border-2 border-white/60 shadow-[0_14px_45px_hsl(0_0%_0%/0.35),inset_0_1px_0_hsl(0_0%_100%/0.18)] hover:bg-white hover:text-black hover:border-white hover:-translate-y-0.5 active:translate-y-0`;

// MEDIA: alias to HERO
const BRAND_MEDIA = BRAND_HERO;

// DARK: dark surface with white border
const BRAND_DARK =
  `bg-[#0A0A0A] text-white border-2 border-white/30 ${BTN_3D} hover:bg-white hover:text-black ${BTN_3D_HOVER} hover:-translate-y-0.5 active:translate-y-0`;

// AI Tool button variants — all monochrome grayscale
const AI_MONO = "bg-gradient-to-r from-zinc-700 to-zinc-600 hover:from-zinc-600 hover:to-zinc-500 text-white border border-white/20 shadow-lg shadow-black/20";

// Dark theme variants
const DARK_GHOST = "bg-transparent text-white border-2 border-zinc-600 hover:bg-white/10 hover:border-white/40 transition-all";
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
