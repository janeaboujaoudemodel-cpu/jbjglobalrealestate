

# Stamp Generator Premium Overhaul — Batch 2

This is a continuation of the upgrade. The codebase already has a solid foundation (3-column layout, interactive preview with hit zones, edge function with generate/refine/variations). The key remaining issues from the user's detailed feedback are organized into focused fixes.

## Batch 2A: Critical Fixes (This Implementation)

### 1. Fix "Failed to create project" error
**Root cause**: The `generate` action in the edge function (line 556-561) runs a `DELETE` query on `stamp_designs` before inserting new ones, but it deletes designs that may still be referenced by `stamp_projects.selected_design_id` (foreign key constraint violation).
**Fix**: Add `ON DELETE SET NULL` handling or skip the delete when the project has a `selected_design_id` that would be affected. Also catch and surface the actual DB error message to the client.
**File**: `supabase/functions/ai-stamp-generator/index.ts`

### 2. Fix border styles looking identical
**Root cause**: In `stampOfficialTemplate.ts`, the `SINGLE` border correctly hides the middle ring (line 480), and `RING` makes the middle ring thicker (line 482). However, `DOUBLE` and default both render the same middle ring at 2.5px — the visual difference is too subtle at 320px. Also the decorative ring (line 475-477) renders for both DOUBLE and RING identically.
**Fix**: Make SINGLE show only the outer ring (already works). DOUBLE shows outer + middle at distinct widths. RING shows outer + decorative + middle + inner all visible with bolder strokes. Increase visual contrast between styles.
**File**: `src/lib/stampOfficialTemplate.ts` lines 459-491, and mirror in edge function

### 3. Fix typography not reflecting in live preview
**Root cause**: `project?.typography_style` is in the dependency array (line 281) but the `LiveStampPreview` receives `typographyStyle` which maps to a font family. The issue is the `useEffect` triggers re-render but the font family used comes from `fontFamily` state, not from `project.typography_style`. When user clicks a typography option in the wizard, it updates `project.typography_style` but doesn't update `fontFamily`.
**Fix**: Add a sync effect that maps `project.typography_style` → `fontFamily` state when the project typography changes.
**File**: `src/components/stamp-generator/StampGeneratorPage.tsx`

### 4. Fix monogram quality and scaling
**Root cause**: `centerContentScale` in `renderCenterContent` divides by 50 (line 676 of template), so a slider value of 40 gives 0.8x scale. The logo `imgSize = innerR * 1.5 * centerScale` results in a small image. Also `injectCenterArt` uses `centerR * 2.2` but doesn't respect the slider.
**Fix**: Wire `centerContentSize` slider to both `renderCenterContent` (via config) AND `injectCenterArt`. Increase base logo size. Add `image-rendering="optimizeQuality"` everywhere.
**Files**: `src/lib/stampOfficialTemplate.ts`, `src/components/stamp-generator/StampGeneratorPage.tsx`

### 5. Fix location text: "UAE" not "United Arab Emirates"
**Root cause**: Already partially fixed — the template defaults to "Dubai, UAE". But the wizard's `city_optional` + `country_optional` fields may still produce "Dubai, United Arab Emirates" if the user typed the full country name.
**Fix**: Add a normalization step that replaces "United Arab Emirates" → "UAE" in the location text pipeline.
**Files**: `src/lib/stampOfficialTemplate.ts`, edge function

### 6. Fix "Standard" color reset
**Root cause**: No mechanism to reset ink color to default `#1B3A8C` when user selects "Standard" preset.
**Fix**: Add a "Reset to Standard Ink" button in the color section that resets `primaryColor` to `#1B3A8C`. When "Ink Blue (Standard)" palette preset is selected, also reset.
**File**: `src/components/stamp-generator/StampLeftPanel.tsx` (already has `onResetColors` wired)

### 7. Remove "Official Stamp" text from stamp
**Root cause**: Some generated stamps may include "OFFICIAL STAMP" or "Bilingual Official" text from legacy template labels. The SVG should never contain these administrative labels.
**Fix**: Filter out any text elements containing "Official Stamp" or "Bilingual Official" from generated SVGs in the template engine.
**File**: `src/lib/stampOfficialTemplate.ts`, edge function

### 8. Redeploy edge function
Deploy the updated `ai-stamp-generator` with all fixes synced.

---

## Technical Details

### Files Modified
| File | Changes |
|------|---------|
| `supabase/functions/ai-stamp-generator/index.ts` | Fix delete cascade, sync border styles, location normalization, remove "Official Stamp" text |
| `src/lib/stampOfficialTemplate.ts` | Border style visual differentiation, location normalization, monogram scaling |
| `src/components/stamp-generator/StampGeneratorPage.tsx` | Typography sync effect, monogram scale wiring |

### Key Logic Changes

**Border differentiation** — make SINGLE/DOUBLE/RING visually distinct:
- SINGLE: outer ring only, no decorative, no middle, no inner
- DOUBLE: outer ring + middle ring (no decorative), distinct stroke widths (4px outer, 2px middle)
- RING: outer + decorative + middle + inner, all visible, thicker strokes overall

**Typography sync** — when project.typography_style changes, auto-update fontFamily:
```typescript
useEffect(() => {
  if (!project?.typography_style) return;
  const FONT_MAP = { SERIF: 'Georgia...', SANS: 'Arial...', ... };
  const mapped = FONT_MAP[project.typography_style];
  if (mapped && mapped !== fontFamily) setFontFamily(mapped);
}, [project?.typography_style]);
```

**Location normalization**:
```typescript
function normalizeLocation(text: string): string {
  return text.replace(/United Arab Emirates/gi, 'UAE');
}
```

## Future Batches
- **Batch 2B**: Trade license auto-detection via AI (upload → extract business type → auto-configure stamp style)
- **Batch 3**: Full interactive drag/resize on preview elements, undo/redo fully wired
- **Batch 4**: Owner's official standard lock, premium export, 3-ring model with location text

