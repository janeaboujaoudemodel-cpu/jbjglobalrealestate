/**
 * Tool Theme Registry — Unified Emerald Ombré + White Hairline.
 *
 * Every tool (front-end + owner/back-end) renders on the same emerald
 * ombré surface pioneered by Interior Design AI / Property Measurement:
 *   background: linear-gradient(180deg, #041610 0%, #02100a 40%, #000000 100%)
 * Text is pure white; tool-panel hairlines are white; primary CTAs are
 * emerald metallic with white ink. No champagne fills inside a tool body.
 */

export type ToolTheme = {
  id:
    | "emerald"
    | "navy"
    | "burgundy"
    | "violet"
    | "teal"
    | "rose"
    | "amber"
    | "indigo";
  label: string;
  heroGradient: string;
  accent: string;
  accentSoft: string;
  accentBorder: string;
  ctaGradient: string;
  ctaHover: string;
  chipBg: string;
  chipBorder: string;
  borderConic: string;
  pageWash: string;
};

// JBJ Emerald Ombré palette
const EMERALD_DEEP = "#064E3B";
const EMERALD_MID = "#042c1c";
const EMERALD_INK = "#000000";
const WHITE = "#FFFFFF";

// Body wash used for the tool page background — starts very dark so the emerald
// header sits on top as an edge-to-edge band and the body underneath is
// balanced ink-black. Individual tools own their own hero gradient.
const OMBRE = `linear-gradient(180deg, #041610 0%, #02100a 40%, #000000 100%)`;

const emeraldTheme = (id: ToolTheme["id"], label: string): ToolTheme => ({
  id,
  label,
  accent: WHITE,
  heroGradient: `linear-gradient(180deg, ${EMERALD_DEEP} 0%, ${EMERALD_MID} 60%, ${EMERALD_INK} 100%)`,
  accentSoft: `rgba(255,255,255,0.12)`,
  accentBorder: `rgba(255,255,255,0.42)`,
  // Primary CTA: emerald metallic → deeper emerald
  ctaGradient: `linear-gradient(135deg, #065F46 0%, #064E3B 55%, ${EMERALD_DEEP} 100%)`,
  ctaHover: `linear-gradient(135deg, ${EMERALD_DEEP} 0%, #064E3B 55%, #065F46 100%)`,
  chipBg: `rgba(6,78,59,0.55)`,
  chipBorder: `rgba(255,255,255,0.42)`,
  // Outer shell border: white hairline — no gold frame around fullscreen/tools
  borderConic: `conic-gradient(from 0deg, rgba(255,255,255,0.72), rgba(255,255,255,0.24), rgba(255,255,255,0.72), rgba(255,255,255,0.24), rgba(255,255,255,0.72))`,
  pageWash: OMBRE,
});

export const toolThemes: Record<ToolTheme["id"], ToolTheme> = {
  emerald: emeraldTheme("emerald", "Emerald"),
  navy: emeraldTheme("navy", "Emerald"),
  burgundy: emeraldTheme("burgundy", "Emerald"),
  violet: emeraldTheme("violet", "Emerald"),
  teal: emeraldTheme("teal", "Emerald"),
  rose: emeraldTheme("rose", "Emerald"),
  amber: emeraldTheme("amber", "Emerald"),
  indigo: emeraldTheme("indigo", "Emerald"),
};

/** Universal tool surface tokens */
export const TOOL_PAGE_BG = OMBRE;
export const TOOL_CARD_BG =
  "linear-gradient(135deg, rgba(8,18,13,0.96) 0%, rgba(3,8,5,0.98) 58%, rgba(0,0,0,1) 100%)";
export const TOOL_INK = WHITE;
export const TOOL_GOLD = WHITE;
export const TOOL_WHITE_BORDER = "rgba(255,255,255,0.42)";
