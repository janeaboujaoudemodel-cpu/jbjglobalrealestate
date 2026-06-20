/**
 * Tool Theme Registry — Premium per-tool ombré system.
 *
 * Each theme renders as: accent → ink black ombré, full saturation accent
 * used for the animated outer border, icons, focus rings, status chips and
 * primary CTAs. Champagne/gold survives only as the page background tint —
 * never as a card fill inside a tool.
 */

export type ToolTheme = {
  /** Internal id */
  id:
    | "emerald"
    | "navy"
    | "burgundy"
    | "violet"
    | "teal"
    | "rose"
    | "amber"
    | "indigo";

  /** Display label */
  label: string;
  /** Tailwind/CSS values for the hero band gradient */
  heroGradient: string;
  /** Solid accent (used for icon tile + asterisk) */
  accent: string;
  /** Soft accent tint for surfaces/borders (rgba) */
  accentSoft: string;
  /** Border colour for accent-tinted hairlines (rgba) */
  accentBorder: string;
  /** Primary CTA gradient (accent → ink) */
  ctaGradient: string;
  /** Hover state CTA gradient (ink → accent reverse) */
  ctaHover: string;
  /** Eyebrow chip bg + border */
  chipBg: string;
  chipBorder: string;
  /** Animated outer-shell conic border (accent → ink → accent) */
  borderConic: string;
  /** Soft page tint behind the shell (very subtle wash) */
  pageWash: string;
};

/**
 * BRAND LOCK — all tool themes flatten to the JBJ champagne/gold/ink palette.
 * Accent = gold #B89555 (hairline only), dark = clean ink #0A0A0A, hero wash =
 * champagne. No more emerald/navy/burgundy/violet/teal/rose/amber/indigo per
 * tool — every tool reads as one unified brand surface.
 */
const BRAND_GOLD = "#B89555";
const BRAND_INK = "#0A0A0A";
const BRAND_CHAMPAGNE = "#FDFBF7";
const BRAND_RAISED = "#EFE6D6";

const brandTheme = (id: ToolTheme["id"], label: string): ToolTheme => ({
  id,
  label,
  accent: BRAND_GOLD,
  // Hero band: clean ink black with a subtle gold radial — matches /compare hero
  heroGradient: `radial-gradient(1200px 600px at 50% -10%, rgba(184,149,85,0.18), transparent 60%), ${BRAND_INK}`,
  accentSoft: `rgba(184,149,85,0.10)`,
  accentBorder: `rgba(184,149,85,0.45)`,
  // Primary CTA: clean ink black with gold hairline — matches .jj-cta-dark
  ctaGradient: BRAND_INK,
  ctaHover: `#1F1F1F`,
  chipBg: `rgba(184,149,85,0.12)`,
  chipBorder: `rgba(184,149,85,0.45)`,
  // Outer shell border: subtle gold hairline (no animated rainbow conic)
  borderConic: `conic-gradient(from 0deg, ${BRAND_GOLD}, rgba(184,149,85,0.35), ${BRAND_GOLD}, rgba(184,149,85,0.35), ${BRAND_GOLD})`,
  // Page wash: champagne, no colored radial
  pageWash: `radial-gradient(1200px 600px at 50% -10%, rgba(184,149,85,0.08), transparent 60%), ${BRAND_CHAMPAGNE}`,
});

export const toolThemes: Record<ToolTheme["id"], ToolTheme> = {
  emerald: brandTheme("emerald", "Champagne"),
  navy: brandTheme("navy", "Champagne"),
  burgundy: brandTheme("burgundy", "Champagne"),
  violet: brandTheme("violet", "Champagne"),
  teal: brandTheme("teal", "Champagne"),
  rose: brandTheme("rose", "Champagne"),
  amber: brandTheme("amber", "Champagne"),
  indigo: brandTheme("indigo", "Champagne"),
};

/** Universal champagne page background + ink text */
export const TOOL_PAGE_BG = "#FDFBF7";
export const TOOL_CARD_BG = "#F7F2EA";
export const TOOL_INK = "#1A1A1A";
export const TOOL_GOLD = "#B89555";
