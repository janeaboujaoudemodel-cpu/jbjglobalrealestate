

## Recovery Plan: Stamp Generator Critical Fixes

### Issues Identified

1. **"Create Your Stamp" → My Projects**: `handleCTA()` in `StampGeneratorPage.tsx` line 50 allows `stamp_last_route` to be `/toolkit/stamp-generator/projects`, sending users to projects instead of new stamp.
2. **Monogram color changes borders instead**: The left panel color stops (Primary/Secondary/Accent) control border tinting via `StampSVGRenderer`. When user clicks monogram and picks a color, they're changing the `activeStop` color which recolors borders. The `MonogramColorEditor` exists but only works when the "Center Content" accordion is open and only applies via `applyMonogramColors()` — the color swatches in the Colors section are NOT wired to monogram-only editing.
3. **Separator panel empty**: Lines 300-302 just show a text hint with no actual controls (style picker, color, size, centering sliders).
4. **Separator distance default is 8 instead of 50**: Line 172 defaults to `8`, should be `50` (centered).
5. **Arabic location arc smaller than English**: Line 412 uses `englishSpread` for Arabic location too, but the `safeArcFontSize` computes different results for Arabic characters.
6. **Downloads broken**: Export buttons may use popup-dependent logic that fails on iPad/Safari.
7. **Upload refresh loses monogram**: `loadProject()` overwrites `localMonogramText` from DB which may not have the uploaded monogram persisted.

### Implementation

**1. Fix "Create Your Stamp" routing** (`src/pages/toolkit/StampGeneratorPage.tsx`)
- In `handleCTA()`, filter out `/projects` from `lastRoute` — if last route is the projects dashboard, go to `/new` instead.
- Change line 50: add `&& !lastRoute.includes('/projects')` condition.

**2. Fix monogram color isolation** (`src/components/stamp-generator/StampGeneratorPage.tsx`, `StampLeftPanel.tsx`)
- Root cause: clicking monogram dispatches `stamp-open-center-panel` which opens the Center Content accordion, but the Colors accordion's swatches still change `primaryColor` (borders). The user expects clicking a color swatch to affect the monogram when monogram is selected.
- Fix: When center panel is focused (monogram selected), route color changes from the Colors section through `monogramLetterColors.allLetters` instead of `primaryColor`. Add a `focusedElement` state that tracks what was last clicked on the canvas. When `focusedElement === 'center'`, color swatch clicks should call `onSetMonogramLetterColors` with `allLetters` set.
- In `StampLeftPanel.tsx`: add `focusedElement` state driven by the same custom events. When focused on center, color picker targets monogram colors.

**3. Add real separator controls** (`src/components/stamp-generator/StampLeftPanel.tsx`)
- Replace the text hint (lines 300-302) with actual controls:
  - Separator style grid (all `ALL_SEPARATOR_STYLES` as clickable options)
  - Separator color picker
  - Separator distance slider (already exists in Spacing section, but duplicate here for discoverability)
  - Centering toggle
- Wire to parent via new props: `currentSeparatorStyle`, `onSeparatorStyleChange`.

**4. Fix separator distance default** (`src/components/stamp-generator/StampGeneratorPage.tsx`)
- Change line 172: default from `8` to `50`.

**5. Fix Arabic location arc parity** (`src/lib/stampOfficialTemplate.ts`)
- Line 412: change `locArSafe` to use `arabicSpread` instead of `englishSpread`.
- Ensure Arabic company arc and location arc use the same spread as English for visual fullness.

**6. Fix downloads** (`src/components/stamp-generator/StampProjectWizard.tsx`, `StampExportPage.tsx`)
- Implement Safari-safe anchor-based downloads for all formats (PNG, JPG, WEBP, SVG, PDF).
- Use canvas-based rendering for raster formats, `jspdf` or `pdf-lib` for PDF file download.
- Separate "Download PDF" (file) from "Print" (window.print).
- Add "Download All" bulk action.

**7. Fix upload persistence** (`src/components/stamp-generator/StampGeneratorPage.tsx`)
- In `loadProject()`, preserve `localMonogramText` if it was set by the user before the reload — check localStorage draft before overwriting.
- Save uploaded logo URL to the DB project record on upload, not just localStorage.

**8. Default centering for all elements** (`src/lib/stampOfficialTemplate.ts`)
- All arcs use `startOffset="50%" text-anchor="middle"` (already implemented).
- Separator default at 50% (fix from item 4).
- Monogram centered (already centered via `cx`/`cy`).

### Files to modify
- `src/pages/toolkit/StampGeneratorPage.tsx` — routing fix
- `src/components/stamp-generator/StampGeneratorPage.tsx` — separator default, monogram color routing, upload persistence
- `src/components/stamp-generator/StampLeftPanel.tsx` — separator controls, context-aware color targeting
- `src/lib/stampOfficialTemplate.ts` — Arabic arc spread fix
- `src/components/stamp-generator/StampProjectWizard.tsx` — export reliability
- `src/components/stamp-generator/StampExportPage.tsx` — export reliability

