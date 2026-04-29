## Hairline Design Tokens — Plan

Goal: introduce a single source of truth for divider/hairline color and opacity values so the `<AdaptiveHairline />` primitive, Footer, and any future section can reference the same premium champagne styling without magic numbers scattered across files.

### Tokens to add (`src/index.css`, `:root` block, near existing `--gold` group)

```css
/* ─── Hairline / divider tokens ───────────────────────────────────
 * Premium champagne hairlines for section dividers on dark surfaces.
 * Color triplets are RGB (no `rgb()` wrapper) so they compose into
 * rgba(...) inside gradient strings. Alphas are baseline values that
 * useAdaptiveHairline scales per underlay luminance.
 */
--hairline-champagne-rgb: 200, 167, 102; /* #C8A766 — brand champagne */
--hairline-white-rgb:    255, 255, 255;
--hairline-ink-rgb:        10,   9,   8; /* obsidian footer surface */

/* Baseline alphas (multiplied by useAdaptiveHairline) */
--hairline-alpha-white:        0.14;
--hairline-alpha-white-soft:   0.10;
--hairline-alpha-gold:         0.35;
--hairline-alpha-gold-peak:    0.40;

/* Static fallbacks for SSR / non-adaptive contexts */
--hairline-static-gold:  rgba(200,167,102, 0.35);
--hairline-static-white: rgba(255,255,255, 0.14);
```

A matching `.dark` override is unnecessary — the adaptive hook handles luminance shifts at runtime.

### TypeScript token mirror (`src/styles/hairlineTokens.ts` — new)

A small typed module so the `<AdaptiveHairline />` primitive and `useAdaptiveHairline` hook stop hard-coding `"200,167,102"` / `0.14` literals:

```ts
export const HAIRLINE_TOKENS = {
  champagneRgb: "200,167,102",
  whiteRgb: "255,255,255",
  baseline: {
    white: 0.14,
    whiteSoft: 0.10,
    gold: 0.35,
    goldPeak: 0.40,
  },
  // Alpha ceilings used by the adaptive hook (prevents over-boost on pitch-black).
  ceilings: {
    white: 0.32,
    whiteSoft: 0.24,
    gold: 0.60,
    goldPeak: 0.70,
  },
} as const;
```

### Refactors (token adoption)

1. **`src/components/ui/AdaptiveHairline.tsx`** — replace local `ACCENT`/`WHITE` const strings with `HAIRLINE_TOKENS.champagneRgb` / `whiteRgb`.
2. **`src/hooks/useAdaptiveHairline.ts`** — replace the hard-coded `BASELINE` object and `Math.min(0.32, ...)` ceilings with `HAIRLINE_TOKENS.baseline` / `.ceilings`.
3. **`src/components/Footer.tsx`** — the 4 CSS-var assignments (`--fh-white`, `--fh-white-soft`, `--fh-gold`, `--fh-gold-peak`) keep their dynamic alphas but switch the hard-coded `200,167,102` / `255,255,255` strings to template-interpolated `HAIRLINE_TOKENS.champagneRgb` / `whiteRgb`. No visual change.

### Documentation comment (`src/index.css`, just above the new tokens)

```css
/* Section-divider hairlines on dark surfaces:
 *   - Always render via <AdaptiveHairline /> (src/components/ui/AdaptiveHairline.tsx)
 *   - Tokens below are the SOURCE OF TRUTH; do not inline new rgba(200,167,102,…)
 *     gradients in components.
 */
```

### Memory update

Append a one-liner to the existing **Adaptive Hairline** memory: "Color/opacity literals live in `--hairline-*` tokens (`src/index.css`) and `HAIRLINE_TOKENS` (`src/styles/hairlineTokens.ts`). New components reference these — never hard-code `200,167,102` or alpha floats."

### Files

**Create**
- `src/styles/hairlineTokens.ts`

**Edit**
- `src/index.css` — add `--hairline-*` token group + comment.
- `src/components/ui/AdaptiveHairline.tsx` — consume tokens.
- `src/hooks/useAdaptiveHairline.ts` — consume tokens for baseline + ceilings.
- `src/components/Footer.tsx` — interpolate tokens into the 4 CSS-var values.
- `mem://ui-ux/visual-standards/adaptive-hairline-standard` — append token reference.

### Out of scope

- Tailwind config additions: hairlines are gradient-based, not single-color borders, so a `border-hairline` utility wouldn't compose correctly. Tokens stay CSS-var + TS-const only.
- Any visual change. This refactor produces byte-equivalent rendered output; only the source of the literals changes.

### Risk

Very low. Pure indirection — no logic, alpha curve, or gradient shape changes. Easy to verify in `/dev/footer-preview` (luminance + alpha read-out should be identical pre/post).