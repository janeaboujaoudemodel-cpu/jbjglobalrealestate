import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/**
 * ============================================================
 * GLOBAL BUTTON SYSTEM - JBJ GLOBAL REAL ESTATE
 * ============================================================
 * IMPORTANT:
 * - Primary CTAs must use the platform “active” color (theme primary), not gold/yellow.
 * - We still keep the premium 3D feel, but the hue comes from --primary.
 * - className color overrides are stripped to enforce consistency.
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

// ACTIVE (Layer 2) champagne gradient used across the platform.
// NOTE: It's a gradient, so we must apply it via `background` (not background-color).
const ACTIVE_CHAMPAGNE_BG = "[background:var(--jj-gradient-active)]";

const BTN_3D =
  "shadow-[0_10px_30px_hsl(var(--primary)/0.25),0_6px_15px_hsl(0_0%_0%/0.22),inset_0_1px_0_hsl(0_0%_100%/0.55)]";
const BTN_3D_HOVER =
  "hover:shadow-[0_14px_45px_hsl(var(--primary)/0.32),0_10px_25px_hsl(0_0%_0%/0.28),inset_0_1px_0_hsl(0_0%_100%/0.65)]";

// PRIMARY: Active (Layer 2) champagne gradient with GOLD borders (not black).
const BRAND_PRIMARY =
  `${ACTIVE_CHAMPAGNE_BG} text-foreground border-2 border-gold/60 ${BTN_3D} ${BTN_3D_HOVER} hover:-translate-y-0.5 active:translate-y-0 hover:border-gold`;

// SECONDARY: transparent on load with DARK TEXT for readability; gold borders (not black).
const BRAND_SECONDARY =
  `bg-transparent text-foreground border-2 border-gold/50 ${BTN_3D} hover:${LOCKED_CHAMPAGNE_BG} hover:text-foreground hover:border-gold hover:-translate-y-0.5 active:translate-y-0 ${BTN_3D_HOVER}`;

// TERTIARY: For dark backgrounds (filled) with dark text and gold borders.
const BRAND_TERTIARY =
  `${LOCKED_CHAMPAGNE_BG} text-foreground border-2 border-gold/60 ${BTN_3D} ${BTN_3D_HOVER} hover:border-gold`;

// HERO: matches homepage hero button behavior (transparent → locked champagne on hover).
const BRAND_HERO =
  `bg-transparent text-primary-foreground border-2 border-primary-foreground/70 shadow-[0_14px_45px_hsl(0_0%_0%/0.35),inset_0_1px_0_hsl(0_0%_100%/0.18)] hover:${LOCKED_CHAMPAGNE_BG} hover:text-foreground hover:border-gold/80 hover:-translate-y-0.5 active:translate-y-0 [&_svg]:text-gold`;

// MEDIA (kept for backwards compatibility): alias to HERO.
const BRAND_MEDIA = BRAND_HERO;

// DARK: black surface with gold border; hover becomes locked champagne.
const BRAND_DARK =
  `bg-premium-bg text-gold border-2 border-gold/80 ${BTN_3D} hover:${LOCKED_CHAMPAGNE_BG} hover:text-foreground ${BTN_3D_HOVER} hover:-translate-y-0.5 active:translate-y-0`;

// AI Tool button variants - vibrant gradients that bypass sanitization
const AI_EMERALD = "bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white border border-emerald-400/30 shadow-lg shadow-emerald-500/20";
const AI_PURPLE = "bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white border border-purple-400/30 shadow-lg shadow-purple-500/20";
const AI_BLUE = "bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white border border-blue-400/30 shadow-lg shadow-blue-500/20";
const AI_TEAL = "bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-500 hover:to-teal-400 text-white border border-teal-400/30 shadow-lg shadow-teal-500/20";
const AI_ORANGE = "bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 text-white border border-orange-400/30 shadow-lg shadow-orange-500/20";
const AI_INDIGO = "bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white border border-indigo-400/30 shadow-lg shadow-indigo-500/20";
const AI_ROSE = "bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white border border-rose-400/30 shadow-lg shadow-rose-500/20";
const AI_CYAN = "bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white border border-cyan-400/30 shadow-lg shadow-cyan-500/20";
const AI_VIOLET = "bg-gradient-to-r from-violet-600 to-violet-500 hover:from-violet-500 hover:to-violet-400 text-white border border-violet-400/30 shadow-lg shadow-violet-500/20";
const AI_AMBER = "bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white border border-amber-400/30 shadow-lg shadow-amber-500/20";
const AI_PINK = "bg-gradient-to-r from-pink-600 to-pink-500 hover:from-pink-500 hover:to-pink-400 text-white border border-pink-400/30 shadow-lg shadow-pink-500/20";
const AI_RED = "bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white border border-red-400/30 shadow-lg shadow-red-500/20";
const AI_LIME = "bg-gradient-to-r from-lime-600 to-lime-500 hover:from-lime-500 hover:to-lime-400 text-white border border-lime-400/30 shadow-lg shadow-lime-500/20";
const AI_SKY = "bg-gradient-to-r from-sky-600 to-sky-500 hover:from-sky-500 hover:to-sky-400 text-white border border-sky-400/30 shadow-lg shadow-sky-500/20";
const AI_GOLD = "bg-gradient-to-r from-gold to-gold-light hover:from-gold-light hover:to-gold text-gold-foreground border border-gold/30 shadow-lg shadow-gold/20";
const AI_FUCHSIA = "bg-gradient-to-r from-fuchsia-600 to-fuchsia-500 hover:from-fuchsia-500 hover:to-fuchsia-400 text-white border border-fuchsia-400/30 shadow-lg shadow-fuchsia-500/20";

// Dark theme variants for buttons on dark backgrounds
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

        // Legacy aliases (render as branded variants)
        default: BRAND_PRIMARY,
        destructive: BRAND_PRIMARY,
        outline: BRAND_SECONDARY,
        ghost: BRAND_SECONDARY,
        link: BRAND_SECONDARY,

        // AI Tool variants - bypass sanitization for dark theme usage
        "ai-emerald": AI_EMERALD,
        "ai-purple": AI_PURPLE,
        "ai-blue": AI_BLUE,
        "ai-teal": AI_TEAL,
        "ai-orange": AI_ORANGE,
        "ai-indigo": AI_INDIGO,
        "ai-rose": AI_ROSE,
        "ai-cyan": AI_CYAN,
        "ai-violet": AI_VIOLET,
        "ai-amber": AI_AMBER,
        "ai-pink": AI_PINK,
        "ai-red": AI_RED,
        "ai-lime": AI_LIME,
        "ai-sky": AI_SKY,
        "ai-gold": AI_GOLD,
        "ai-fuchsia": AI_FUCHSIA,

        // Dark theme variants - visible on dark backgrounds
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

function sanitizeButtonClassName(className?: string, variant?: string | null) {
  // Skip sanitization for AI tool variants and dark theme variants - they need their colors
  if (variant?.startsWith("ai-") || variant?.startsWith("dark-")) {
    return className;
  }
  if (!className) return undefined;
  const tokens = className.split(/\s+/).filter(Boolean);
  const kept = tokens.filter((t) => !forbiddenClassPatterns.some((re) => re.test(t)));
  return kept.join(" ") || undefined;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    const safeClassName = sanitizeButtonClassName(className, variant);

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
