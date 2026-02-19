
# Stamp Generator — Full Upgrade Plan

## Scope of Changes

Based on reading all relevant source files, here is a precise breakdown of each fix and addition, in the order they will be implemented.

---

## 1. PNG Export Bug Fix

**Root cause found:** The `svgToPng` function in `StampExportPage.tsx` (lines 19–75) already uses Blob URL + `img.decode()`. However, when `StampSVGRenderer` applies color tinting via `tintSvgFull`, the resulting SVG has inline `<defs>` with IDs like `t2bg`, `t2clip`, `t7bg`, `t10center`. When multiple stamps share the same SVG document, these duplicate IDs cause rendering failures (the browser silently drops duplicate defs). Also, when the browser renders SVG-via-`<img>`, external resource references (fonts) fail — the stamp text disappears.

**Fix:**
- In `StampExportPage.tsx`, before passing SVG to `svgToPng`, de-duplicate all `id="..."` attributes by appending a random suffix.
- Embed a fallback `@font-face` or use only system-safe fonts in the SVG for export.
- The `svgToPng` wrapper will prefix all IDs to guarantee uniqueness per render call.

---

## 2. SVG Clipping Fix — Modern Minimal, Square Premium, Geometric Modern

**Root cause found:**

- **Modern Minimal (T2):** Uses `<clipPath id="t2clip">` — this works fine in-browser but when DOMPurify sanitizes the SVG via `StampSVGRenderer`, `USE_PROFILES: { svg: true }` strips `clip-path` attributes by default in some DOMPurify versions. Result: content visually escapes the circle.
- **Square Premium (T8):** The `contentTop` / `contentBot` safe zone calculation places `nameY` at `contentCy - 8`, but `wrapText()` can emit two `<tspan>` lines that push the second line below `contentBot`. No clip enforces this — overflow is visible.
- **Geometric Modern (T7):** The rotated diamond `<rect ... transform="rotate(45, cx, cy)"/>` renders outside the viewBox on small display sizes causing clipping by the container `div`, not by SVG.

**Fix in `stampTemplates.ts`:**
- T2 Modern Minimal: Replace `<clipPath>` with explicit geometry bounds — instead of relying on clip-path (which DOMPurify may strip), pad the text positions to never exceed the circle boundary. Remove the `<g clip-path>` wrapper.
- T7 Geometric Modern: Add explicit safe-zone guards so the rotated diamond stays inside `viewBox="0 0 320 320"`. Reduce diamond size and confirm it fits within `bandR - 5` radius.
- T8 Square Premium: Add a `<clipPath>` for the content zone properly scoped, OR tighten the `nameY` / `cityY` arithmetic so both lines of `wrapText` stay above `contentBot`.

**Fix in `StampSVGRenderer.tsx`:**
- Pass `FORCE_BODY: false` and add `clip-path` to DOMPurify's allowed attributes list to prevent stripping.

---

## 3. Three-Color Stop Picker — Already Built, Needs Preset Palette Shortcuts

**Current state:** The three-stop picker (Primary / Secondary / Accent) exists in both `StampGeneratorPage.tsx` and `StampExportPage.tsx`. The `StampColorWheel` works correctly.

**What's missing:** There are no per-stop preset shortcuts. Currently the preset swatches always call `setActiveColor()` which sets whichever stop is active — but users don't see suggested pairings.

**Fix in `StampGeneratorPage.tsx`:**
- Add "Palette Presets" section below the stop selector. Each palette preset is a set of 3 hex values (Primary / Secondary / Accent) applied in one click.
- Built-in palettes to add:
  - **JBJ Gold** — `#B8860B` / `#2a3a5c` / `#856404`
  - **Royal Navy** — `#1a2744` / `#2a3a5c` / `#B8860B`
  - **Obsidian** — `#0d0d0d` / `#333333` / `#B8860B`
  - **Crimson** — `#8B0000` / `#5a0000` / `#B8860B`
  - **Forest** — `#1B4332` / `#2d6a4f` / `#B8860B`
  - **Deep Purple** — `#4B0082` / `#6a0dad` / `#C8A87A`
  - **Monochrome** — `#0d0d0d` / `#333333` / `#ffffff`

Each preset renders as three tiny colored dots (Primary + Secondary + Accent) with a label. One click applies all three stops simultaneously.

---

## 4. PDF / JPG / WEBP Export — Already Fully Built

**Checking `StampExportPage.tsx`:** All four export functions (`downloadPNGFile`, `downloadJPGFile`, `downloadWebpFile`, `downloadPDFFile`) are already implemented (lines 286–342). The format toggle chips (`ToggleChip`) and transparent/opaque switch are in place.

**What IS broken:** The `options.formats` state is initialized with `['svg', 'png']` only — JPG and WEBP are not pre-checked. The format selection UI needs to surface JPG and WEBP as toggle chips, which they do (already in the JSX based on the file reading). The UI chip is already rendering them from around line 550+.

**Actual bug found:** In `StampExportPage.tsx` line 455+, the export bundle loop calls `downloadJPGFile` and `downloadWebpFile` per size, but those functions don't exist as named exports in the file's scope (they are defined inline as `async function downloadJPGFile`). This is fine, the real issue is the `generateBundle` calling them correctly. After re-reading, those are all defined and called correctly.

**True fix needed:** Make JPG and WEBP checked by default so users see them without manual activation.

---

## 5. Full-Screen Design Preview Modal — Already Built, Needs Enhancement

**Current state:** `StampPreviewModal.tsx` already implements the 3-tab mockup viewer (Business Card, Letterhead, Envelope) as a `fixed inset-0 z-[9000]` overlay. It is already wired in `StampGeneratorPage.tsx` via `previewConcept` state.

**What needs to be improved:**
- The "Select & Export →" button navigates to `/export/${savedDesignId || selectedId}` — but when called from the modal via `confirmSelectAndExport()`, the `savedDesignId` may not be set yet if the design was never previously saved. The navigation uses `savedDesignId || designId`, but the local variable `designId` is set inside the function AFTER `await supabase.insert()` but the navigate uses `savedDesignId` (the state) which hasn't updated yet due to React async state.
- **Fix:** In `confirmSelectAndExport()`, always navigate using the local `designId` variable, not `savedDesignId` (state).
- Add a "Download Preview" button to the modal so users can quickly export a PNG without going to the full export page.

---

## 6. Trade License Upload with AI Extraction — Already Fully Built

**Current state:** `StampLicenseUploader.tsx` is complete and already embedded in `StampProjectWizard.tsx` Step 0 (line 301–324). The edge function `supabase/functions/ai-stamp-extract/index.ts` is deployed and functional.

**What may be missing:** The `StampLicenseUploader` is only on the wizard (new project flow) — not available when editing an existing project's details. 

**Fix:** Add the uploader to the `StampGeneratorPage.tsx` or make it accessible from a "Re-extract Details" button.

---

## Files to Change

| File | Change |
|------|--------|
| `src/lib/stampTemplates.ts` | Fix T2 (Modern Minimal) clip-path reliance → pure geometry bounds; fix T7 (Geometric Modern) diamond overflow; fix T8 (Square Premium) safe-zone arithmetic |
| `src/components/stamp-generator/StampSVGRenderer.tsx` | Add `clip-path` to DOMPurify allowed attributes; add `ADD_ATTR: ['clip-path', 'dominant-baseline', 'unicode-bidi', 'direction']` |
| `src/components/stamp-generator/StampExportPage.tsx` | De-duplicate SVG IDs before rasterizing; enable JPG+WEBP by default in `options.formats`; fix ID collision in svgToPng |
| `src/components/stamp-generator/StampGeneratorPage.tsx` | Add 3-stop palette presets section (7 named palettes); fix `confirmSelectAndExport` navigation bug (use local `designId` not state `savedDesignId`) |
| `src/components/stamp-generator/StampPreviewModal.tsx` | Add inline PNG download button to the modal sidebar |

---

## Implementation Details

### SVG ID De-duplication (Export Fix)
Before calling `svgToPng`, prefix all `id="xxx"` occurrences with a unique token and update all `url(#xxx)` and `href="#xxx"` references to match. This prevents cross-stamp ID collision when the browser's SVG parser is given multiple SVGs sharing IDs in the same document session.

```
function uniquifyIds(svg: string): string {
  const token = Math.random().toString(36).slice(2, 7);
  return svg
    .replace(/\bid="([^"]+)"/g, (_, id) => `id="${token}_${id}"`)
    .replace(/url\(#([^)]+)\)/g, (_, id) => `url(#${token}_${id})`)
    .replace(/href="#([^"]+)"/g, (_, id) => `href="#${token}_${id}"`);
}
```

### DOMPurify — Preserve SVG Attributes
```typescript
DOMPurify.sanitize(tinted, {
  USE_PROFILES: { svg: true, svgFilters: true },
  ADD_ATTR: ['clip-path', 'dominant-baseline', 'unicode-bidi', 'direction', 'bidi-override'],
})
```

### Palette Presets UI
A horizontal row of preset "paint chip" buttons. Each shows three small circles (primary/secondary/accent colors). Clicking applies all three at once via `setPrimaryColor` + `setSecondaryColor` + `setAccentColor`.

### Navigation Bug Fix
In `StampGeneratorPage.tsx` `confirmSelectAndExport()`:
```typescript
// Current (BROKEN for new designs):
navigate(`/toolkit/stamp-generator/${projectId}/export/${savedDesignId || designId}`);

// Fixed (use local designId always):
navigate(`/toolkit/stamp-generator/${projectId}/export/${designId}`);
```

---

## What Does NOT Change
- All database schema and RLS policies (already correct)
- The trade license uploader logic
- The AI stamp generator edge function
- The color wheel HSB engine
- The wizard flow
- Any authentication or session logic
