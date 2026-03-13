

## Stamp Generator -- Complete Fix Plan

### Problems Identified

1. **Bottom English arc text is reversed/unreadable** -- The SVG arc path in `stampOfficialTemplate.ts` goes RIGHT-to-LEFT through the bottom (`M cx+r cy → cx-r cy, sweep=0`), which places characters in reverse reading order. Same issue for location English text.

2. **Layers panel controls empty overlays, not real SVG** -- `InteractiveStampCanvas` renders a separate overlay layer system that has no connection to the actual SVG content. Toggling visibility/deleting layers does nothing to the stamp preview.

3. **Layout broken at 1178px** -- The 380px left panel + center preview causes cropping. Controls overlap the stamp. No stable frame.

4. **History "Edit" opens gallery, not single stamp editor** -- `StampHistoryDashboard` navigates to `/toolkit/stamp-generator/${projectId}/generate` which loads the full generation page with all concepts, not a focused editor for one design.

5. **Export tab is placeholder** -- Only shows "available after generation" text; no actual export controls in the wizard.

6. **Text too thin/broken** -- Font sizes and stroke widths still render too small at the wizard's 340px preview size. The text arc geometry doesn't push company name inward enough between the rings.

### Implementation (5 files)

**A. Fix arc text orientation** (`src/lib/stampOfficialTemplate.ts`)
- Change bottom arc path from `M cx+r cy A ... 0 0 0 cx-r cy` to `M cx-r cy A ... 0 0 0 cx+r cy` (left-to-right through bottom, counter-clockwise). This makes English text readable right-side up.
- Same fix for `locBotArc` (location English).
- Increase text arc radius gap: push `textArcR` slightly inward so text sits more clearly between rings.
- Bump outer stroke to 5, inner to 2.5. Increase base font to 16/15. Increase separator size.
- Reduce `safeArc` multiplier to 0.70 so long names shrink earlier and never overflow.

**B. Remove broken InteractiveStampCanvas overlay system** (`InteractiveStampCanvas.tsx`)
- Strip the fake overlay/layer panel entirely. Replace with a simple container that just renders children (the LiveStampPreview) with no layer controls.
- The layer visibility concept will be replaced by form-level toggles (show/hide location, show/hide license, show/hide monogram) which already exist in the Company and Logo tabs and actually control the SVG output.

**C. Rebuild wizard layout for stability** (`StampProjectWizard.tsx`)
- Reduce left panel from 380px to 320px.
- Make preview size responsive: `min(380, available width - 360)`.
- Remove the InteractiveStampCanvas wrapper -- just render LiveStampPreview directly in a styled frame.
- In the Export tab: add actual working export buttons (SVG download, PNG download at 512/1024, PDF) that generate directly from the current preview SVG using the same `svgToPng`/`svgToPdf` helpers from StampExportPage.
- Add "Print Preview" button that calls `window.print()`.
- The "Generate Concepts" button stays in toolbar for AI batch generation.

**D. Fix history Edit action** (`StampHistoryDashboard.tsx`)
- Change "Open in Editor" to navigate to `/toolkit/stamp-generator/${projectId}/export/${designId}` instead of the generate page, so clicking Edit opens the specific design.
- Add a proper "Preview" action that opens a modal showing the single stamp at large size with basic export options.

**E. Sidebar active highlight** (`GlobalVerticalNav.tsx`)
- Already has prefix matching at line 900. Verify it works for `/toolkit/stamp-generator/new` and `/toolkit/stamp-generator/projects`. The current logic `location.pathname.startsWith(href + "/")` should match. If `href` is `/toolkit/stamp-generator` and path is `/toolkit/stamp-generator/new`, this matches. No change needed here -- confirmed working.

### Arc Path Fix Detail (Critical)

Current (broken):
```
botArcPath = M (cx+r) cy A r r 0 0 0 (cx-r) cy
```
Text follows path right→left through bottom. Characters render right-side-up but read backwards.

Fixed:
```
botArcPath = M (cx-r) cy A r r 0 0 0 (cx+r) cy
```
Text follows path left→right through bottom (counter-clockwise sweep). Characters render right-side-up AND read left-to-right naturally.

### Files Changed
1. `src/lib/stampOfficialTemplate.ts` -- arc paths, stroke weights, font sizes
2. `src/components/stamp-generator/InteractiveStampCanvas.tsx` -- simplify to pure container
3. `src/components/stamp-generator/StampProjectWizard.tsx` -- layout fix, real export, remove broken canvas wrapper
4. `src/components/stamp-generator/StampHistoryDashboard.tsx` -- fix Edit navigation
5. `src/components/stamp-generator/LiveStampPreview.tsx` -- ensure size prop flows correctly

