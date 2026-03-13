

## Plan: Fix Stamp Generator — Critical Rendering Issues

### What's Wrong (from screenshots)

I can see the stamp preview rendering in the wizard. Here are the **confirmed issues**:

1. **English bottom arc text reads wrong** — Characters like "AL HABTOOR REAL ESTATE" spiral upward on the right side instead of reading naturally along the bottom arc. The `renderBottomArcText` function uses `270°` center (which is the BOTTOM of SVG coordinate system) but the rotation math `deg + 90` produces wrong character orientations.

2. **Arabic text missing on top arc** — In bilingual mode, no Arabic text appears because the wizard doesn't auto-populate Arabic when only English company name is entered. The template falls back to placeholder `'اسم الشركة'` which IS rendering but is too small/faint to see clearly.

3. **Ring spacing too tight** — The radii percentages (`OUTER_R_PCT = 0.46`, `MIDDLE_R_PCT = 0.33`, `INNER_R_PCT = 0.25`) produce rings that are too close together. The "premium wide gap" between outer and middle needs to be wider to match the reference image.

4. **Text too small in arcs** — The company name text doesn't fill the arc band properly. Font sizes and letter spacing are too conservative, making the arcs look empty.

5. **Location text barely visible** — Between middle and inner rings, the location arcs are crammed into a tiny band.

### Fixes

#### 1. Fix `renderBottomArcText` rotation math (`stampOfficialTemplate.ts`)
- The bottom arc should place characters along the bottom half of the circle (from ~170° to ~10° going clockwise through 270°/bottom)
- Each character rotation should be `deg - 90` (not `deg + 90`) so characters face outward and read left-to-right
- Fix the spread calculation: use `90°` center (bottom in standard math) instead of `270°`

#### 2. Fix ring geometry proportions
- Widen outer ring: `OUTER_R_PCT = 0.47` (slightly larger)
- Push middle ring inward: `MIDDLE_R_PCT = 0.35` → creates wider premium gap
- Keep inner ring: `INNER_R_PCT = 0.24`
- This creates the visible tapering hierarchy matching the reference

#### 3. Increase text sizes and letter spacing for arcs
- Arabic top arc base font size: `15` → `17`
- English bottom arc base font size: `13` → `15`  
- Increase letter spacing for English: `2.5` → `4`
- Widen `ARC_SPREAD_LIMIT` from `0.58` → `0.70` so text fills more of the semicircle

#### 4. Fix location arc sizing
- Location font sizes: increase base from `8`/`9` to `9`/`10`
- Location arc spread: `0.60` → `0.70`

#### 5. Improve separator rendering
- Increase separator font size from `10` → `13` for standard glyphs
- Position at exact 3 and 9 o'clock on the text arc radius

### Files Modified

| File | Change |
|------|--------|
| `src/lib/stampOfficialTemplate.ts` | Fix bottom arc rotation, ring proportions, text sizing, separator sizing |

This is a single-file fix focused entirely on the SVG generation math.

