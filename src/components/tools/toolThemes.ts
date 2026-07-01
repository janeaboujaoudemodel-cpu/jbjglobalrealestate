/**
 * Tool Theme Registry — Unified Emerald Ombré + Gold Hairline.
 *
 * Every tool (front-end + owner/back-end) renders on the same emerald
 * ombré surface pioneered by Interior Design AI / Property Measurement:
 *   background: linear-gradient(180deg, #064E3B 0%, #042c1c 48%, #000000 100%)
 * Text is pure white; hairlines are gold #B89555; primary CTAs are emerald
 * metallic with white ink. No champagne fills inside a tool.
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
const GOLD = "#B89555";
const WHITE = "#FFFFFF";

// Ombré used everywhere (page wash, hero, body)
const OMBRE = `linear-gradient(180deg, ${EMERALD_DEEP} 0%, ${EMERALD_MID} 48%, ${EMERALD_INK} 100%)`;

const emeraldTheme = (id: ToolTheme["id"], label: string): ToolTheme => ({
  id,
  label,
  accent: GOLD,
  heroGradient: `linear-gradient(180deg, ${EMERALD_DEEP} 0%, ${EMERALD_MID} 60%, ${EMERALD_INK} 100%)`,
  accentSoft: `rgba(184,149,85,0.12)`,
  accentBorder: `rgba(184,149,85,0.55)`,
  // Primary CTA: emerald metallic → deeper emerald
  ctaGradient: `linear-gradient(135deg, #10B981 0%, #059669 55%, ${EMERALD_DEEP} 100%)`,
  ctaHover: `linear-gradient(135deg, ${EMERALD_DEEP} 0%, #059669 55%, #10B981 100%)`,
  chipBg: `rgba(6,78,59,0.55)`,
  chipBorder: `rgba(184,149,85,0.55)`,
  // Outer shell border: gold hairline (subtle) — no rainbow
  borderConic: `conic-gradient(from 0deg, ${GOLD}, rgba(184,149,85,0.35), ${GOLD}, rgba(184,149,85,0.35), ${GOLD})`,
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
  "linear-gradient(135deg, rgba(6,78,59,0.96) 0%, rgba(4,44,28,0.96) 55%, rgba(0,0,0,0.98) 100%)";
export const TOOL_INK = WHITE;
export const TOOL_GOLD = GOLD;
