

## Plan: Fix Stamp Rendering — Complete Rewrite of Bottom Arc + Geometry

### Root Cause Analysis

The `renderBottomArcText` function is fundamentally broken:
- Uses `270°` as "bottom" but in SVG math: `cos(270°)=0, sin(270°)=-1` = **TOP** of circle, not bottom
- Characters are placed at wrong positions, spiraling vertically up the right side
- The individually-placed character approach is fragile and produces uneven spacing

**The fix**: Replace `renderBottomArcText` with a **textPath-based approach** (same as top arc), using a bottom-half arc path. This is how professional SVG stamps work — text follows a path, not individual character placement.

### Changes (single file: `src/lib/stampOfficialTemplate.ts`)

#### 1. Replace `renderBottomArcText` with `renderBottomArcTextPath`
- Use SVG `<textPath>` on a bottom-half arc path: `M cx+r cy A r r 0 1 1 cx-r cy` (sweeps through bottom)
- Characters auto-space along the path, read left-to-right naturally
- No manual trigonometry, no rotation math bugs

#### 2. Fix ring geometry — widen gaps
Current radii produce rings too close together:
- `OUTER_R_PCT`: 0.47 → **0.46** (slightly tighter to give more room)
- `MIDDLE_R_PCT`: 0.35 → **0.33** (push inward for wider premium gap = 13% of S)
- `INNER_R_PCT`: 0.24 → **0.22** (push inward for better location band)

This creates: outer-to-middle gap = ~42px at 320px size, middle-to-inner gap = ~35px

#### 3. Fix location arcs  
- Location English top arc: use textPath (same as company top arc, just smaller radius)
- Location Arabic bottom arc: use textPath (bottom arc path, not individual chars)

#### 4. Increase font sizes for visibility
- Arabic top arc: 17 → **16** (slightly smaller to prevent overlap on long names)
- English bottom arc: 15 → **13** (textPath handles spacing better)
- Location text: keep at 10

#### 5. Fix separator positioning
- Separators at 3 o'clock (x=cx+r, y=cy) and 9 o'clock (x=cx-r, y=cy) — already correct in code

### Files Modified

| File | Change |
|------|--------|
| `src/lib/stampOfficialTemplate.ts` | Replace renderBottomArcText with textPath approach, fix ring radii, fix location arcs |

