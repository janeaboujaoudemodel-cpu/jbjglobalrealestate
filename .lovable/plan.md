
# Three SVG Template Bug Fixes — stampTemplates.ts

## Bug 1: T2 Modern Minimal — Text Overflows the Circle Boundary

### Root Cause (precise)
The clip-path `t2clip` clips to `r - 4 = 104px` radius. But the horizontal rule lines (`hRule`) are drawn from `cx - pad` to `cx + pad` where `pad = safeR - 4 = 84`. A chord at y-offset from centre can still reach outside the visual circle if `pad` is wider than the chord width at that y-position. More critically: `wrapText` emits two `<tspan>` lines when name > 24 chars, centred on `nameY`. The lower tspan lands at `nameY + lineH/2 = nameY + nameFontSize * 0.65`. For long names this tspan can push past `cy + safeR`, below the circle boundary.

The clip-path IS present but DOMPurify strips the `clip-path` attribute from the `<g>` tag in `StampSVGRenderer` unless explicitly whitelisted. However, the prior plan already added `clip-path` to `ADD_ATTR`. The remaining real issue is the layout arithmetic:

- **hRule width** is too wide — `pad = safeR - 4 = 84` but at `y = nameY - 14` (which could be far from centre), the chord half-width is `sqrt(r² - (y - cy)²)` which may be less than 84.
- **nameY** is not clamped tightly enough for two-line names. When `name.length > 24`, the second tspan lands at `nameY + nameFontSize * 1.3 / 2`, and this is not validated against `safeR`.

### Fix
1. Clamp `nameY` so even the **bottom** of a two-line name stays within `cy + safeR - 12`: `nameY = Math.min(nameY, cy + safeR - (name.length > 24 ? nameFontSize * 1.3 + 10 : 8))`
2. Replace `pad` (static) with a function that computes the safe chord half-width at a given `y` coordinate: `function chordHalf(r, cy, y) { return Math.sqrt(Math.max(0, r*r - (y - cy)**2)) - 4 }`
3. Apply `chordHalf` to each `hRule` call so the lines never exceed the circle at their y-position.
4. Clamp `cityY` so it cannot be closer than `nameFontSize + 6` below the bottom of the last name tspan.
5. Remove the bottom horizontal rule at `cityY + 12/14` entirely — it is the main overflower — or clamp it strictly.

---

## Bug 2: T7 Geometric Modern — Ring Text Overlaps the Center Rectangle

### Root Cause (precise)
The `ringText` function draws a path: `M cx-r cy A r r 0 1 1 cx+r-0.01 cy` — this is the **top semicircle** (counterclockwise upper half). The text string is `◆ NAME ◆ CITY ◆` with `startOffset="50%"` and `text-anchor="middle"`. For typical company names (25–35 chars + city), the total string can be 50+ characters. At `fontSize = 7.5` with `letterSpacing = 1.4`, this overflows the upper arc and the tail of the string descends down the sides of the circle and intrudes into the space where the center rectangle sits.

The center rectangle (non-monogram path) is `104 × 52` at `cy - 26`. The ring text path descends to `cy` at both left and right ends, so long strings wrap around and their endpoints appear right next to the rectangle frame — visually overlapping.

Additionally, `wrapText` for the center name is centred on `cy` with the second tspan at `cy + nameFontSize * 0.65`. But the rectangle bottom is `cy + 26` — so if `nameFontSize * 0.65 > 20` (which happens at font size ≥ 31, impossible given `autoFontSize` max of 10.5) that's fine. The real issue is purely ring text overlap.

### Fix
1. **Separate name and city into two separate arcs** — top arc for the name only, bottom arc for city only (using `bottomArcText`). This way each arc carries a shorter string that stays within its half.
2. For the non-monogram center: replace the double-rect frame with a **single cleaner rect** and shrink it slightly to `94 × 48` to give the ring text more breathing room. Keep `wrapText` centred at `cy`.
3. Increase `ringTextR` slightly — use `outerR - 7` for name arc and `outerR - 7` for city arc (same as other templates that work). The current `outerR - 8` is fine but needs two separate paths.

---

## Bug 3: T8 Square Premium — Company Name Clips Below the Footer Band

### Root Cause (precise)
The city label is rendered **twice**:
1. In the **footer band** (correct, white text on dark fill) — this is intentional.
2. In the **content zone** at `cityY` (dark text on white) — this is a redundant duplicate.

The duplicate city label at `cityY` is the element that visually "clips below the footer band" when the company name is long (two-line wrap). Here's why: when `name.length > 22`, `nameLineH = nameFontSize * 1.3 * 2 ≈ 27.3` (two lines). Then `nameY ≈ cy - 13.65`. And `cityY = Math.min(nameY + 27.3 + 4, cy + 58.5) = cy + 17.7`. But if `nameFontSize` is reduced for very long names (e.g. to 8.6 via `autoFontSize`), the two-line height is smaller but `cityY` still follows directly. The footer band starts at `y1 + s*2 - 6 - ftrH = cy + 106 - 28 = cy + 78`. So `cityY = cy + 17.7` is ABOVE the footer — that's not the overflow.

**The actual bug is different from what was previously diagnosed.** Re-reading line 439: `cityY = Math.min(nameY + (name.length > 22 ? nameFontSize * 1.3 * 2 + 4 : nameFontSize + 10), contentBot - cityFontSize - 2)`. This formula adds `nameFontSize * 1.3 * 2 + 4` to `nameY` — but `nameY` is already the **centre** of the name block, not the bottom. So the actual bottom of the two-line name is `nameY + nameFontSize * 1.3` (one line height below centre), and the city label should be placed `nameY + nameFontSize * 1.3 + 8`, not `nameY + nameFontSize * 1.3 * 2 + 4` (which double-counts the upper half).

This means `cityY` is pushed **too far down** by roughly `nameFontSize * 0.65 ≈ 6–8px` more than needed. For very long names at small font sizes, combined with low `contentBot`, this pushes `cityY` past `contentBot`, into the footer band zone.

Also — the **duplicate city label** inside the content zone should simply be **removed**. The footer band already shows the city. Removing the duplicate from the content zone entirely fixes the overlap and cleans up the layout.

### Fix
1. **Remove the redundant city `<text>` from inside the content zone** (line 458). The footer band already shows the city — no need to show it twice.
2. Adjust `nameY` to be better centred: for the non-monogram, single-line case: `nameY = contentCy`. For the two-line case: `nameY = contentCy - nameFontSize * 0.65` (so lines straddle the centre).
3. Add a `<clipPath>` around the content zone to enforce the safe area and prevent any text from visually entering the header/footer bands even with extreme inputs.

---

## Exact Lines Being Changed

| Template | File Lines | Change |
|---|---|---|
| T2 Modern Minimal | 208–241 | Tighten `nameY` clamp for two-line names; replace static `pad` with `chordHalf()` function; remove bottom hRule that overflows; clamp `cityY` relative to bottom of last tspan not centre |
| T7 Geometric Modern | 384–417 | Split ring text into separate top-arc (name) and bottom-arc (city); tighten center rect to `94 × 46` |
| T8 Square Premium | 422–462 | Remove duplicate city label from content zone; fix `nameY` to be truly centred in content area; add `<clipPath>` guard for content zone |

---

## What Does NOT Change
- All other templates (T1, T3, T4, T5, T6, T9, T10, T11, T12)
- Export logic, color picker, modal, DOMPurify settings
- Database schema, edge functions, authentication
- `StampSVGRenderer.tsx`, `StampExportPage.tsx`, or any other file
