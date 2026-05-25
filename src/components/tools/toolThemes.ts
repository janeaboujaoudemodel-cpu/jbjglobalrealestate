/**
 * Tool Theme Registry
 * Single source of truth for the per-tool ombré accent used across
 * Rental Index, Property Evaluator and Property Comparison.
 *
 * Each theme defines a deep gradient that fades into ink black and
 * a matching accent for icons, hairlines, hover and CTAs.
 * Gold (#B89555) is the universal 1px hairline shared by all themes.
 */

export type ToolTheme = {
  /** Internal id */
  id: "emerald" | "navy" | "burgundy";
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
};

export const toolThemes: Record<ToolTheme["id"], ToolTheme> = {
  emerald: {
    id: "emerald",
    label: "Emerald",
    heroGradient:
      "linear-gradient(135deg, #0F3D2E 0%, #082018 55%, #000000 100%)",
    accent: "#0F3D2E",
    accentSoft: "rgba(15,61,46,0.10)",
    accentBorder: "rgba(15,61,46,0.45)",
    ctaGradient:
      "linear-gradient(135deg, #0F3D2E 0%, #082018 60%, #000000 100%)",
    ctaHover:
      "linear-gradient(135deg, #000000 0%, #082018 40%, #0F3D2E 100%)",
    chipBg: "rgba(15,61,46,0.12)",
    chipBorder: "rgba(15,61,46,0.40)",
  },
  navy: {
    id: "navy",
    label: "Navy",
    heroGradient:
      "linear-gradient(135deg, #102540 0%, #0A1830 55%, #000000 100%)",
    accent: "#102540",
    accentSoft: "rgba(16,37,64,0.10)",
    accentBorder: "rgba(16,37,64,0.45)",
    ctaGradient:
      "linear-gradient(135deg, #102540 0%, #0A1830 60%, #000000 100%)",
    ctaHover:
      "linear-gradient(135deg, #000000 0%, #0A1830 40%, #102540 100%)",
    chipBg: "rgba(16,37,64,0.12)",
    chipBorder: "rgba(16,37,64,0.40)",
  },
  burgundy: {
    id: "burgundy",
    label: "Burgundy",
    heroGradient:
      "linear-gradient(135deg, #5A0F1A 0%, #2E0810 55%, #000000 100%)",
    accent: "#5A0F1A",
    accentSoft: "rgba(90,15,26,0.10)",
    accentBorder: "rgba(90,15,26,0.45)",
    ctaGradient:
      "linear-gradient(135deg, #5A0F1A 0%, #2E0810 60%, #000000 100%)",
    ctaHover:
      "linear-gradient(135deg, #000000 0%, #2E0810 40%, #5A0F1A 100%)",
    chipBg: "rgba(90,15,26,0.12)",
    chipBorder: "rgba(90,15,26,0.40)",
  },
};

/** Universal champagne page background + ink text */
export const TOOL_PAGE_BG = "#FDFBF7";
export const TOOL_CARD_BG = "#F7F2EA";
export const TOOL_INK = "#1A1A1A";
export const TOOL_GOLD = "#B89555";
