/**
 * Hairline design tokens — single source of truth for divider/hairline
 * color triplets and baseline opacities.
 *
 * Mirror of the `--hairline-*` CSS custom properties declared in
 * src/index.css. Consumed by:
 *   - useAdaptiveHairline (baseline alphas + ceilings)
 *   - <AdaptiveHairline /> primitive (RGB triplets for gradients)
 *   - Footer.tsx (CSS-var assignments for descendants)
 *
 * Do NOT inline `200,167,102` or alpha float literals in components —
 * always read from this module so future tuning is one-file.
 */

export const HAIRLINE_TOKENS = {
  /** Brand champagne #B89555 as an `R,G,B` string for `rgba(${...},${a})`. */
  champagneRgb: "200,167,102",
  whiteRgb: "255,255,255",

  /** Default alphas before useAdaptiveHairline applies its luminance multiplier. */
  baseline: {
    white: 0.14,
    whiteSoft: 0.1,
    gold: 0.35,
    goldPeak: 0.4,
  },

  /**
   * Upper bounds enforced after the luminance multiplier — prevents
   * over-boost on pitch-black underlays from looking heavy.
   */
  ceilings: {
    white: 0.32,
    whiteSoft: 0.24,
    gold: 0.6,
    goldPeak: 0.7,
  },
} as const;

export type HairlineTokens = typeof HAIRLINE_TOKENS;
