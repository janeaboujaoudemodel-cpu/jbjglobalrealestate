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

const make = (
  id: ToolTheme["id"],
  label: string,
  accent: string,
  dark: string,
): ToolTheme => ({
  id,
  label,
  accent,
  heroGradient: `linear-gradient(135deg, ${accent} 0%, ${dark} 55%, #000000 100%)`,
  accentSoft: `${accent}1A`,
  accentBorder: `${accent}73`,
  ctaGradient: `linear-gradient(135deg, ${accent} 0%, ${dark} 60%, #000000 100%)`,
  ctaHover: `linear-gradient(135deg, #000000 0%, ${dark} 40%, ${accent} 100%)`,
  chipBg: `${accent}1F`,
  chipBorder: `${accent}66`,
  borderConic: `conic-gradient(from 0deg, ${accent}, #000000, ${accent}, #000000, ${accent})`,
  pageWash: `radial-gradient(1200px 600px at 50% -10%, ${accent}14, transparent 60%), #FDFBF7`,
});

export const toolThemes: Record<ToolTheme["id"], ToolTheme> = {
  emerald: make("emerald", "Emerald", "#0F7A4D", "#082018"),
  navy: make("navy", "Navy", "#1E4E8C", "#0A1830"),
  burgundy: make("burgundy", "Burgundy", "#8B1E2E", "#2E0810"),
  violet: make("violet", "Violet", "#6D28D9", "#1E0F3A"),
  teal: make("teal", "Teal", "#0E7490", "#062430"),
  rose: make("rose", "Rose", "#BE185D", "#3A0820"),
  amber: make("amber", "Amber", "#B45309", "#2A1505"),
};

/** Universal champagne page background + ink text */
export const TOOL_PAGE_BG = "#FDFBF7";
export const TOOL_CARD_BG = "#F7F2EA";
export const TOOL_INK = "#1A1A1A";
export const TOOL_GOLD = "#B89555";
