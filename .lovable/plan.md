

## Session 10 — Arc Text Engine Fixes (Arabic + English) + AI Model Stability

### Root Cause Analysis

After reviewing both `stampOfficialTemplate.ts` (501 lines) and `stampTemplates.ts` (969 lines), the arc text issues stem from these specific problems:

**1. Arabic text doesn't fill the arc**
- `ARC_SPREAD_LIMIT = 0.72` in `stampOfficialTemplate.ts` line 88 artificially caps text to 72% of the semicircle
- `fitFontSize()` uses conservative `charW` estimates (0.50 for Arabic) that shrink text unnecessarily
- Arabic `letterSpacing` is set to `3` (line 299) which is too tight for full arc distribution

**2. English bottom arc reverses characters incorrectly**
- `renderBottomArcTextPath()` (line 160-178) reverses the entire string character-by-character: `text.split('').reverse().join('')`
- This breaks multi-byte characters and produces unreadable text
- The correct approach: use a bottom arc path that sweeps left-to-right through the bottom half, so text naturally reads left-to-right without reversal

**3. Template inconsistencies (T1–T13)**
- Templates T6, T9 in `stampTemplates.ts` place English on top and Arabic on bottom — violating the mandated structure (Arabic top, English bottom)
- Templates T1–T5, T7–T8, T10–T11 don't use arc text at all for company names — they use centered `wrapText()` or ring text in filled bands
- No consistent enforcement of the Arabic-top/English-bottom rule across AI-generated concepts

**4. Letter collision in AI models**
- `autoFontSize()` in `stampTemplates.ts` doesn't account for arc curvature — only scales based on character count for flat text
- No dynamic `letterSpacing` adjustment based on text length vs available arc length

### Implementation Plan

#### Fix 1: Improve Arabic Arc Distribution (`stampOfficialTemplate.ts`)

- Increase `ARC_SPREAD_LIMIT` from `0.72` to `0.88` — allows text to use ~88% of the semicircle
- Make `letterSpacing` dynamic based on text length vs arc length: compute `availableArc - (textLength * charWidth)` and distribute remaining space as letter-spacing
- Add a new helper `computeArcLetterSpacing(text, fontSize, arcRadius, spreadLimit, charWidth)` that returns optimal spacing

#### Fix 2: Fix English Bottom Arc Reading Direction (`stampOfficialTemplate.ts`)

Replace `renderBottomArcTextPath()` entirely. Instead of reversing the string on a right-to-left path:
- Use a path that sweeps from **left to right through the bottom**: `M (cx-r) cy A r r 0 0 0 (cx+r) cy` (sweep=0, large-arc=0 = bottom semicircle, left to right)
- Place text on this path with `dominant-baseline="hanging"` or a `dy` offset to push text below the path (outside the circle)
- No string reversal needed — text reads naturally left-to-right

#### Fix 3: Enforce Language Structure in All Templates (`stampTemplates.ts`)

For bilingual templates (T6, T9, T12, T13):
- **Top arc = Arabic company name** (always)
- **Bottom arc = English company name** (always)
- Swap T6 and T9 which currently have English on top

For location arcs (inner ring):
- **Upper inner arc = English location**
- **Lower inner arc = Arabic location**
- Already correct in `stampOfficialTemplate.ts` but needs enforcement in template variants

#### Fix 4: Dynamic Anti-Collision Spacing

Create a shared `safeArcFontSize(text, maxRadius, isArabic)` function that:
1. Computes available arc length from radius and spread limit
2. Estimates text width using character count × average glyph width (different for Arabic vs Latin)
3. Returns `{ fontSize, letterSpacing }` that guarantees no overlap
4. Minimum letter-spacing floor: `0.5px` for Arabic, `1px` for English

Apply this function in both `stampOfficialTemplate.ts` and all arc-text templates in `stampTemplates.ts`.

#### Fix 5: Export Consistency

The `StampSVGRenderer.tsx` already uses `dangerouslySetInnerHTML` with the raw SVG — what renders in preview is what exports. No additional changes needed for export fidelity as long as the SVG source is correct.

### Files to Modify

| File | Changes |
|------|---------|
| `src/lib/stampOfficialTemplate.ts` | Replace `renderBottomArcTextPath` with correct left-to-right bottom path; increase `ARC_SPREAD_LIMIT`; add dynamic spacing helper; adjust Arabic letter-spacing |
| `src/lib/stampTemplates.ts` | Swap Arabic/English arc positions in T6 and T9; replace `bottomArcText` helper with fixed version; apply `safeArcFontSize` to all arc text; ensure all bilingual templates follow Arabic-top/English-bottom rule |

No new files. No database changes.

