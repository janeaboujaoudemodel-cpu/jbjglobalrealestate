

# Session 5 — Generate Concepts Engine + Design Library + Standard Model Logic

## Root Cause Analysis

### Problem 1: Edge function generates low-quality concepts with broken layouts
The `ai-stamp-generator` edge function's `buildSVG()` uses a completely separate rendering engine from the client-side `generateOfficialStampSVG()`. It has its own `topArcText`, `bottomArcTextChars`, `fitFontSize`, and `bilingualCircularStamp` functions with different spacing logic, different safe zones, and different charW values. Arabic text gets the wrong charW (0.48 vs 0.68), location arcs stack incorrectly, and per-character bottom arc placement uses a simplistic `spreadDeg = Math.min(150, n * 10)` that produces illegible results for long names. The VARIATIONS action calls `buildSVG()` with invented template keys (e.g., `sep-star`, `color-navy`) which fall through to the `default` case and all render as `classic-double`.

### Problem 2: Standard Model not stable across regeneration
When "Regenerate" is clicked, `generateConcepts()` calls the edge function which **deletes all non-favorite designs** (`DELETE ... is_favorite = false`) including the current standard model if it hasn't been favorited. The standard concept survives in React state but its DB row is gone, causing inconsistency on reload.

### Problem 3: Generating state UX confusion
`setGenerating(true)` is set in both the "no standard" and "has standard" paths (lines 513-515), but the center preview conditionally shows a spinner only when `!activeStandard && concepts.length === 0`. When a standard exists, regeneration shows skeleton cards in the right panel but the toast "Design applied as Standard" fires misleadingly during generation.

### Problem 4: Concept apply swaps standard into concepts list
`handleSelectConcept` (line 595-636) swaps the old standard into the regular concepts array and promotes the clicked concept. This is correct behavior but triggers a confusing "Design applied as Standard" toast plus an async DB insert that can race with the generating state.

### Problem 5: Variations produce broken SVGs
The VARIATIONS action in the edge function creates configs like `sep-star`, `color-navy` which are **not valid template keys** in `buildSVG()`. They all fall through to the `default` case (`classic-double`), so all 12 "variations" look identical except for minor color differences.

## Implementation Plan

### 1. Replace edge function `buildSVG()` with `generateOfficialStampSVG()` for all concepts

The edge function currently duplicates the entire stamp rendering engine poorly. Instead:

- Import and bundle the `stampOfficialTemplate.ts` logic into the edge function (or replicate the key generation function with the corrected Arabic charW, spacing floor, and ring padding from Session 4).
- For the `generate` action, produce 6-8 concepts by varying **config parameters** passed to the official template engine, not by switching between different `buildSVG` template keys. Each concept varies: `borderStyle`, `separatorStyle`, `circleGap`, `dividerStyle`, `centerMode`, and optionally `arabicArcSpread`/`englishArcSpread`.
- For the `variations` action, produce 8-12 variations by systematically varying separator style, color scheme overrides, border style, and monogram treatment — all rendered through the official template.
- Remove the entire `buildSVG()` function and all legacy template rendering from the edge function.

Concept presets (replacing the old TEMPLATES array):

```text
1. Classic Official — DOUBLE border, star separators, circleGap 13
2. Luxury Triple Ring — RING border, diamond separators, circleGap 16
3. Modern Minimal — SINGLE border, dot separators, circleGap 10
4. Vintage Seal — DOUBLE border, ornament separators, circleGap 15, dotted inner
5. Bold Corporate — DOUBLE border, square separators, circleGap 12
6. Elegant Diamond — RING border, floral separators, circleGap 14
7. Legal Standard — DOUBLE border, line separators, circleGap 13, show registration
8. Premium Executive — RING border, star separators, circleGap 18
```

Each concept inherits the same bilingual layout logic, ring structure, Arabic charW, and spacing rules.

### 2. Protect Standard Model during regeneration

In the edge function `generate` action:
- Do NOT delete the design row that matches `selected_design_id` from the project. Change the delete query to: `DELETE ... is_favorite = false AND id != selected_design_id`.
- On the client side in `generateConcepts()`, preserve `standardConcept` in state (already done) AND ensure its DB row survives.

### 3. Fix generating state UX

In `StampGeneratorPage.tsx`:
- When `standardConcept` exists, do NOT show full-screen spinner. Only show a subtle "Regenerating concepts..." badge in the right panel header (already partially done via skeleton cards).
- Remove the premature "Design applied as Standard" toast from `handleSelectConcept` when generation is still in progress. Replace with a deferred toast that only fires after `generating` transitions to `false`.
- Add a visible "Generating 8 concepts..." progress indicator in the right panel Concepts tab header when `generating === true`.

### 4. Fix concept apply behavior

In `handleSelectConcept()`:
- The swap logic (old standard → concepts, clicked → standard) is correct. Keep it.
- Add a guard: if `generating` is true, queue the selection and apply after generation completes, or block selection during generation with a toast "Please wait for generation to finish."
- Suppress the "Design applied as Standard" toast and replace with a softer "Active design changed" toast.

### 5. Fix variations to use official template

Replace the VARIATIONS action in the edge function:
- Instead of calling `buildSVG(varProject, vc.key)` with invalid keys, call the official template generator with varied configs.
- Each variation changes ONE dimension: separator style, border style, color palette, or monogram treatment.
- Variations inherit all project data (company names, locations, language mode) correctly.

### 6. Ensure all right panel tabs work

Currently all 5 tabs (Concepts, Favorites, Variations, Library, History) render content. Issues:
- **Library tab**: `StampLibraryPanel` reads from `localStorage('stamp-custom-presets')` — functional but empty for new users. Add a "Save Current as Preset" button inside the Library tab itself.
- **History tab**: `HistoryList` has a bug — it dynamically imports `useAuth` (line 509) which doesn't work inside a non-component function. Fix: pass supabase client directly or use the already-imported module.

## Files Modified

| File | Changes |
|------|---------|
| `supabase/functions/ai-stamp-generator/index.ts` | Remove `buildSVG()`, replace with official template generation. Fix `generate` action to produce 8 config-varied concepts. Fix `variations` action. Protect standard model from deletion. |
| `src/components/stamp-generator/StampGeneratorPage.tsx` | Fix generating state: block concept selection during generation, improve toast messaging, fix standard model preservation during regen. |
| `src/components/stamp-generator/StampRightPanel.tsx` | Add generating progress indicator in Concepts tab header. Fix HistoryList dynamic import bug. Add "Save as Preset" to Library tab. |

## What Will NOT Change
- StampLeftPanel (sidebar controls)
- StampInteractivePreview (click-to-edit)
- StampSVGRenderer (color tinting)
- stampOfficialTemplate.ts (rendering engine — already fixed in Session 4)
- Database schema
- Export flow

