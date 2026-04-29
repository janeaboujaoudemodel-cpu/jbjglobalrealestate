## Adaptive Footer Hairlines — Plan

Make footer hairline strokes **respond to the brightness of whatever sits behind/around the footer** so they never look too faint on pure black or too harsh on lighter underlays.

### Approach

The footer paints `#0A0908`, but the **effective** background can change: the page above can show through during scroll transitions, and some routes mount the footer over brighter ambient gradients. Today all hairlines use fixed alphas (e.g. `rgba(255,255,255,0.10)`, `rgba(200,167,102,0.35)`), so they read inconsistently.

I'll measure the perceived luminance of the nearest non-transparent ancestor at runtime, then scale every hairline alpha through CSS variables.

### 1. New hook — `src/hooks/useAdaptiveHairline.ts`

- Walks up from the footer ref, skipping itself, to find the first ancestor with a non-transparent `background-color`.
- Computes sRGB → relative luminance (WCAG formula).
- Maps luminance → alpha multiplier via a smooth piecewise curve:

| Underlay luminance | Multiplier | Effect |
|---|---|---|
| `≤ 0.005` (pure black) | ×1.25 | Boost — line wouldn't read otherwise |
| `0.005–0.05` (obsidian, baseline) | ×1.25 → 1.0 | Smooth taper |
| `0.05–0.18` (warm dark) | ×1.0 → 0.85 | Slight reduction |
| `0.18–0.5` (mid-dark) | ×0.85 → 0.65 | Visibly softened |
| `> 0.5` (light) | ×0.6 | Minimum — never harsh |

- Returns `{ luminance, white, gold, goldPeak }` clamped alphas.
- Re-measures on: mount, `ResizeObserver` (footer + parent), window resize, `<html>` class/style/data-theme mutations (theme toggle).
- No rAF loop; observers only.

### 2. Footer integration — `src/components/Footer.tsx`

- Add a `footerRef`, call `useAdaptiveHairline(footerRef)`.
- Expose alphas as CSS custom properties on the `<footer>` element:
  ```ts
  style={{
    '--fh-white': `rgba(255,255,255,${alphas.white})`,
    '--fh-white-soft': `rgba(255,255,255,${alphas.white * 0.7})`,
    '--fh-gold': `rgba(200,167,102,${alphas.gold})`,
    '--fh-gold-peak': `rgba(200,167,102,${alphas.goldPeak})`,
  }}
  ```
- Replace the 5 hardcoded hairline gradients/borders with these vars:
  - Top + bottom accent hairlines (lines 476, 658) → `var(--fh-gold-peak)` for the center stop.
  - Above-grid + below-grid champagne hairlines (530–539, 571–580) → use `var(--fh-white-soft)` and `var(--fh-gold)`.
  - Copyright divider `borderColor: HAIRLINE` (line 638) → `var(--fh-white)`.
  - The brand-lockup mini hairline (502) and ambient overlays stay as-is (they're decorative gold washes, not separators).
- Keep the existing `HAIRLINE` / `ACCENT_HAIRLINE` constants as fallbacks for SSR-first paint.

### 3. Verification in `/dev/footer-preview`

The preview tool already lets me cycle 8 dark backgrounds. I'll add a small **"Hairline alphas"** read-out to its toolbar showing the live luminance + computed alphas — purely informational, no behavior change to the footer. This makes the adaptation visible during QA.

### 4. Files

**Create**
- `src/hooks/useAdaptiveHairline.ts`

**Edit**
- `src/components/Footer.tsx` — wire the hook + replace 5 hairline declarations with CSS-var references.
- `src/pages/dev/FooterPreviewPage.tsx` — show live alpha read-out (small chip in the toolbar).

### 5. Out of scope

- No changes to footer layout, copy, links, social icons, or ambient gradients.
- No changes to `MainLayout`, header, or sidebar.
- The accent hairline center peak stays gold; the curve only adjusts opacity, never hue.

### 6. Risk / fallbacks

- If `getComputedStyle` returns nothing usable (very early paint, SSR), the hook falls back to the baseline alphas — identical to today's footer. No regression possible.
- All multipliers are clamped (`white ≤ 0.32`, `gold ≤ 0.6`) so the line can never spike to harsh values even if luminance detection misfires.