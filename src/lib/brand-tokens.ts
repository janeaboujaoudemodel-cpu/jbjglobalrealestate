/**
 * ============================================================
 * BRAND TOKENS — single source of truth for navy + gold palette
 * ============================================================
 * These JS constants mirror the `--brand-*` CSS variables defined
 * in `src/styles/theme-tokens.css` and the `brand.*` Tailwind
 * namespace in `tailwind.config.ts`.
 *
 * Use these from any file that needs the colour as a JS string
 * (inline `style={{ color: BRAND.gold }}`, canvas, chart configs,
 * jsPDF, etc.). For CSS / className work, prefer the Tailwind
 * tokens (`text-brand-gold`, `bg-brand-blue`, ...) so a single
 * token swap cascades everywhere.
 * ============================================================ */

export const BRAND = {
  blue:       "#102540",
  blueHover:  "#1a3d63",
  blueDeep:   "#143052",
  blueSoft:   "rgba(16, 37, 64, 0.22)",
  blueRing:   "rgba(16, 37, 64, 0.18)",
  blueTint:   "rgba(16, 37, 64, 0.06)",

  gold:       "#B89555",
  goldHover:  "#C9A66B",
  goldDeep:   "#A68444",
  goldSoft:   "rgba(184, 149, 85, 0.40)",
  goldFaint:  "rgba(184, 149, 85, 0.25)",
  goldRing:   "rgba(184, 149, 85, 0.55)",

  ink:        "#1A1A1A",
  page:       "#FDFBF7",
  surface:    "#F7F2EA",
  raised:     "#EFE6D6",
} as const;

/** CSS var() helpers for inline styles that want live-token swap. */
export const BRAND_VAR = {
  blue:       "var(--brand-blue)",
  blueHover:  "var(--brand-blue-hover)",
  blueDeep:   "var(--brand-blue-deep)",
  gold:       "var(--brand-gold)",
  goldHover:  "var(--brand-gold-hover)",
  goldSoft:   "var(--brand-gold-soft)",
  goldRing:   "var(--brand-gold-ring)",
} as const;

export default BRAND;
