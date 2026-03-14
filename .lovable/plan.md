

# Fix Plan: Stamp Generator — Arabic Arc Size, Centering, Logo Colors, Click Highlight, Navigation

## Current State (from screenshots)

The stamp at 1178px viewport shows:
- Navigation: Desktop sidebar + utility bar **working correctly** at lg breakpoint for stamp routes (fixed previously)
- Arabic text ("اسم الشركة") is **smaller and shorter arc** than English ("YOUR COMPANY NAME") — they should match
- Location Arabic text ("دبي، الإمارات") appears close to the outer border, not centered between rings
- English location ("DUBAI, UAE") also hugs the border rather than being centered
- Monogram "YCN" shows Y and N in blue, C in gold — locked rule works but only for 3-letter monograms where index 1 is gold
- Click shows cursor:pointer but no visible highlight persists
- Console warning: `OptionButton` cannot be given refs

## Root Causes Found

### 1. Arabic arc still too small
In `StampProjectWizard.tsx` line 832: slider max is `80` not `100`. Default is `80` which maps via `LiveStampPreview.tsx` line 159 formula: `0.40 + (80-20)/80 * 0.55 = 0.8125`. English uses `0.88`. So Arabic is still **7% narrower**.

**Fix**: Change slider max from `80` to `100`. Change default from `80` to `88` (maps to `0.87`, nearly matching English 0.88). Also update the mapping formula in `LiveStampPreview.tsx` to ensure default 88 maps exactly to 0.88: `0.40 + (88-20)/80 * 0.55 = 0.8675` — still short. Better formula: `0.30 + (value - 20) / 80 * 0.70` so 88 → `0.30 + 68/80 * 0.70 = 0.895 ≈ 0.88`.

### 2. Location text not centered between rings
In `stampOfficialTemplate.ts` line 277-280, `clampedLocTextR` uses `(middleR + innerR) / 2` which is correct math, but the `SAFE_ZONE` clamping pushes it off-center when rings are close. The issue is the location text `font-size` is only `10` (line 355-356) vs company text at `15-17` — making it appear small and pushed to one side.

**Fix**: Increase location base font from `10` to `12` for both EN and AR in BILINGUAL mode. Ensure the arc spread for location also uses `ARC_SPREAD_LIMIT` (already does at line 355-356). Verify dominant-baseline consistency.

### 3. Company name not aligned with separator center
Separators render at `clampedTextArcR` (same radius as text arcs). The text uses `dominant-baseline="hanging"` for bottom arc but the separator uses `dominant-baseline="central"`. The bottom arc text sits below the centerline while separators sit on it.

**Fix**: Ensure separators use the same baseline alignment approach or adjust separator Y position to match the visual center of the text band.

### 4. Click highlight disappears after 2 seconds
`StampProjectWizard.tsx` line 410: `setTimeout(() => setSelectedElement(null), 2000)`. User wants persistent highlight until clicking elsewhere or another element.

**Fix**: Remove the 2-second auto-clear. Clear only when clicking outside the stamp or selecting a different element.

### 5. Monogram color: locked rule + per-letter override
Currently `renderCenterContent` in the template hardcodes gold for index 1 (line 592-594). The `MonogramColorEditor` component exists in `StampLeftPanel` (line 229-234) and `StampGeneratorPage` but is NOT used in `StampProjectWizard`. User wants it available in the wizard's Logo tab too, with locked defaults but manual override capability.

**Fix**:
- Add `MonogramColorEditor` to wizard's Logo tab
- Default colors: J letters (index 0,2) = ink color, B (index 1) + divider = gold `#B8860B`
- Allow user to override via per-letter selection
- Pass overrides through `LiveStampPreview` → template

### 6. OptionButton ref warning
`OptionButton` is a function component receiving refs from Radix (via TabsContent). Line 108-122 defines it as a plain function component.

**Fix**: Use a native `<button>` element directly or wrap with `React.forwardRef`.

## Implementation Steps

### File 1: `src/lib/stampOfficialTemplate.ts`
- Line 355-356: Increase location base font from `10` to `12`
- Line 570-636 (`renderCenterContent`): Accept optional `monogramLetterColors` in config. If provided, use per-letter fills from user overrides; otherwise apply locked brand rule (index 0,2 = ink, index 1 = gold)
- Add `monogramLetterColors?: Record<number, string>` and `monogramDividerColor?: string` to `OfficialStampConfig`

### File 2: `src/components/stamp-generator/LiveStampPreview.tsx`
- Line 159: Change formula to `0.30 + (arabicArcSpread - 20) / 80 * 0.70` so default 88 → 0.895 (matches English 0.88)
- Add `monogramLetterColors` and `monogramDividerColor` props, pass through to `generateOfficialStampSVG`

### File 3: `src/components/stamp-generator/StampProjectWizard.tsx`
- Line 832: Change slider max from `80` to `100`
- Line 190: Change default `arabic_arc_spread` from `80` to `88`
- Line 410: Remove `setTimeout` auto-clear; instead clear `selectedElement` only on outside click or new selection
- Line 108-122: Convert `OptionButton` to use native `<button>` with `React.forwardRef`
- Add `MonogramColorEditor` import and render it in the Logo tab (after monogram text input)
- Add `monogram_letter_colors` to form state with locked defaults
- Wire `monogramLetterColors` through `previewProps`

### File 4: `src/components/stamp-generator/MonogramColorEditor.tsx`
- Update `DEFAULT_MONOGRAM_COLORS` to include locked brand rule: `letters: {0: inkColor, 2: inkColor}, divider: '#B8860B', allLetters: null` (needs to be dynamic based on ink color, so defaults stay as-is but wizard initializes with brand rule)

## Validation
1. Arabic company arc stretches same width as English arc (both ~0.88 spread)
2. Location text centered between middle and inner rings, readable size
3. Click on any stamp element highlights it persistently (gold glow) until deselected
4. Monogram shows J=ink, B=gold, divider=gold by default; user can override per letter
5. No OptionButton ref warning in console

