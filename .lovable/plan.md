

## Stamp Generator — Layout, Arc Text, and Interaction Fix

### Problems Identified (from screenshot + code)

1. **Massive gap below header on generation page** — `StampGeneratorPage.tsx` line 466 has `pt-24 sm:pt-28 lg:pt-32` (128px padding-top on desktop), plus sticky header at `top-24/28/32`. This creates the huge empty gap visible in the screenshot. The page also uses `min-h-screen` with scrolling layout instead of a fixed viewport.

2. **Bottom arc English text is still upside-down/unreadable** — In `stampOfficialTemplate.ts` line 108, the bottom arc path `M cx-r cy A r r 0 1 0 cx+r cy` renders text with characters pointing inward (toward center), which is upside-down from the reader's perspective. The same issue affects the location English text on the inner ring.

3. **"Apply Logo to Stamp" doesn't work** — In `StampGeneratorPage.tsx` line 844-854, clicking "Apply Logo to Stamps" calls `generateConcepts(updated)` which triggers a full regeneration cycle (calls the edge function or `generateStampConcepts`). The existing concept cards don't update because the logo is stored in `project` state but `StampSVGRenderer` doesn't re-render the existing SVG strings — they're static SVG source strings baked at generation time.

4. **Concept grid requires scrolling** — All 8-11 concepts render in a single grid with no pagination, forcing long vertical scroll.

5. **Left panel controls (Color/Fonts/Text/Art/Logo) are hidden on this viewport** — The left panel has `hidden lg:flex` (line 539) which hides it below 1024px. At the user's 1178px viewport it should show, but the `sticky top-[calc(theme(spacing.32)+56px)]` creates misalignment.

6. **InteractiveStampCanvas layers are disconnected** — Layer visibility toggles in the layers panel don't affect the SVG rendering because layers are empty overlay boxes, not connected to the actual SVG content.

### Implementation Plan

**A. Fix generation page layout (StampGeneratorPage.tsx)**
- Change the root container from `min-h-screen pt-24 sm:pt-28 lg:pt-32` to `h-[calc(100vh-52px)] overflow-hidden flex flex-col` (same pattern as the wizard).
- Change sticky header from `sticky top-24 sm:top-28 lg:top-32` to `flex-shrink-0` (no sticky needed in a flex column layout).
- Make the 3-column body `flex-1 overflow-hidden` with internal scroll only in the concepts grid area.
- Remove `max-w-[1600px] mx-auto` wrapper; use direct flex children.
- Change left panel from `hidden lg:flex` to always visible with narrower width (200px).
- Change center preview from `hidden lg:flex` to always visible.
- Make concepts grid area use `overflow-y-auto` with its own scroll.

**B. Fix bottom arc text to be readable right-side up (stampOfficialTemplate.ts)**
- Replace `textPath` for bottom arcs with per-character `<text>` elements positioned along the arc.
- Each character is placed at coordinates `(cx + r*cos(θ), cy + r*sin(θ))` with rotation `θ + 90°` so the character top points outward (away from center).
- Characters are distributed evenly across ~160° of the bottom half, centered at 6 o'clock.
- Apply the same technique for the location English text on the inner ring.
- Keep Arabic top arc using `textPath` (Arabic reads correctly on the top arc as-is).

**C. Fix "Apply Logo to Stamp" (StampGeneratorPage.tsx)**
- Instead of calling `generateConcepts(updated)`, update `project` state and then re-render all existing concepts by injecting the logo into their SVG source strings.
- Create a helper `injectLogoIntoSvg(svgSource, logoUrl, monogramText, iconStyle)` that finds the center content area in the SVG and replaces/inserts the logo image or monogram text element.
- Apply this to all concepts via `setSvgOverrides`.

**D. Add pagination to concepts grid (StampGeneratorPage.tsx)**
- Add `conceptPage` state, show 6 concepts per page.
- Render prev/next buttons below the grid.
- Keep favorites section always visible above.

**E. Remove InteractiveStampCanvas from generation page**
- Replace the `InteractiveStampCanvas` wrapper (lines 885-907) with direct `StampSVGRenderer` rendering, same as mobile view already does.
- Remove the broken layers panel. Layer visibility (show/hide location, license, monogram) is already handled by project-level toggles.

### Files to modify
1. `src/lib/stampOfficialTemplate.ts` — per-character bottom arc rendering
2. `src/components/stamp-generator/StampGeneratorPage.tsx` — layout, pagination, logo apply, remove broken canvas

