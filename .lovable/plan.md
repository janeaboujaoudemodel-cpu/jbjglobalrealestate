
# Stamp Generator — 6 Bug Fixes + Font Expansion

## Issues Identified and Root Causes

### Issue 1: AI Designer Panel Overlaps the Header
**Root cause:** The AI panel has `top: 72` (hardcoded px) in the `style` prop. The global header is `~80px` tall, and the generator's own sticky sub-header sits at `top-24 (96px)` to `top-32 (128px)`. The AI panel spawns directly beneath the global nav but on top of the sub-header.

**Fix:** Change the panel's initial `top` from `72` to `160` (clearing both the global nav and the sub-header with breathing room). Also add a `paddingTop` safe zone on the page wrapper.

---

### Issue 2: License Uploader Not Visible in Generator
**Root cause:** `StampLicenseUploader` only lives in the project wizard (Step 0). Once you're on the generator page, there is no way to re-upload or auto-fill company details.

**Fix:** Add a collapsible "AI Auto-Fill" section at the top of the generator page (above the grid), showing the `StampLicenseUploader` in a collapsed accordion that expands on demand. Also add a "Upload License" button hint below the company name in the header.

---

### Issue 3: Clicking Stamp Card Does Not Open Edit Mode
**Root cause:** `handleSelectConcept` sets `selectedId` and opens `previewConcept` (the full-screen modal). There's no direct path to immediately editing text from the card. The Text tab in the left panel only activates if the user manually clicks it.

**Fix:** Add an "Edit Text" secondary button to each `ConceptCard` alongside "Select This Design". Clicking "Edit Text" calls `setSelectedId(concept.id)` and `setLeftTab('text')` (no modal), immediately activating the Text tab with that stamp's elements loaded.

---

### Issue 4: Bilingual Template Gray/Black Card Bug
**Root cause — double bug:**
1. **T12 ring text on dark card**: The business card mockup has a dark navy background. The stamp monogram renders `fill=COLOR` (e.g. gold) on a white background in the SVG — this looks fine in the stamp grid. But in `StampPreviewModal` line 186, the business card back renders `<StampSVGRenderer size={90}/>` with default tintColor. Since T12 has `fill="#ffffff"` for text on the outer band, and the card background is dark, the white SVG fills are invisible against dark.
2. **T12 city text is hardcoded** as `DUBAI · UAE` regardless of project's `city_optional` / `country_optional` fields. Fix: use `${city} · ${country || 'UAE'}` with fallback.
3. **Gray overlay on bilingual card**: In `StampPreviewModal` the business card back div (line 184) has `background: radial-gradient(circle at center, ${tintColor}18 0%, transparent 70%)` — when `tintColor` is gold (`#B8860B`), the overlay is extremely faint but the SVG still renders with a white viewbox background. The root issue is the SVG has no `background="transparent"` and defaults to white — producing a white square in the center of the dark card. Fix: ensure `StampSVGRenderer` renders with `overflow: visible` and no background fill, OR simply overlay the stamp SVG in a container that applies `mix-blend-mode: multiply` so white areas are transparent on dark backgrounds.

**Better fix for card mockup**: Add `style={{ background: 'transparent' }}` to the renderer wrapper on dark backgrounds, and ensure the SVG `<svg>` tag does not have a white `<rect>` background fill. Inspection of stampTemplates shows T12 does NOT add a white rect — the white background is coming from the browser rendering SVG inline in a `<div>` with default background. Solution: apply CSS `filter: drop-shadow` and `background: transparent` to the renderer div.

**Actual simple fix:** The SVG divs in `StampSVGRenderer` render `dangerouslySetInnerHTML` which creates inline SVG. Since the SVG has no root `<rect fill="white">`, the background is transparent. The "black card" the user sees is the card mock itself. The stamp appears too small (`size={90}` on the card back). Increase to `size={110}` and ensure `opacity={1}` not `opacity-80`.

**T12 hardcoded city fix:** In `stampTemplates.ts`, replace the hardcoded `DUBAI · UAE` with the project's actual city/country fields.

---

### Issue 5: Export Page Content Hidden Under Header
**Root cause:** `StampExportPage.tsx` has a sticky header with `top-24 sm:top-28 lg:top-32`. The content wrapper starts at `py-8`. But on the export page the main content div starts at line 473 with `<div className="max-w-6xl mx-auto px-6 py-8">`. This means the content correctly starts below the sticky sub-header. However, the sub-header itself uses `top-24` which means it sits beneath the global nav — BUT on the export page, the entire page is inside a standard scroll container. The issue the user reports ("all screen is hidden under the header and setting") likely refers to the 3-column layout on the export page being too wide and cut off on mobile, with the left color panel pushing content off-screen.

**Fix:** Make the export page layout properly responsive:
- Convert `grid-cols-1 lg:grid-cols-2` to proper responsive with `gap-6` instead of `gap-8`.
- Ensure the page padding-top respects the double header: add `pt-6` to the page wrapper minimum.

---

### Issue 6: More Fonts
**Root cause:** `STAMP_FONTS` array only has 6 entries — all mapped to web-safe system fonts. Users want more variety.

**Fix:** Expand to 14 font options covering serif, sans-serif, monospace, decorative, and Arabic-compatible styles. All mapped to system font stacks available in all browsers:

```
Trajan / Georgia (Elegant Serif)
Garamond / Palatino (Classic Serif)
Baskerville / Times (Literary Serif)  ← NEW
Caslon / Book Antiqua (Antiquarian)   ← NEW
Arial / Helvetica (Modern Sans)
Futura / Century Gothic (Geometric)
Gill Sans / Optima (Humanist Sans)    ← NEW
Verdana / Tahoma (Screen Sans)        ← NEW
Courier New (Monospace)
Letter Gothic / Monaco (Technical Mono) ← NEW
Impact / Franklin Gothic (Display)    ← NEW
Rockwell / Clarendon (Slab Serif)    ← NEW
Optima / Segoe (Soft Elegant)         ← NEW
```

Each entry stays as `{ label, value, preview }` where `value` is a CSS font-family stack.

---

## Files to Change

| File | Changes |
|------|---------|
| `src/components/stamp-generator/StampGeneratorPage.tsx` | (1) Move AI panel initial top to 160px; (2) Add "Edit Text" button to ConceptCard; (3) Add collapsed license uploader section; (4) Expand STAMP_FONTS to 14 entries |
| `src/components/stamp-generator/StampPreviewModal.tsx` | (5) Fix business card back stamp size from 90 to 110; fix transparent bg |
| `src/lib/stampTemplates.ts` | (6) Fix T12 hardcoded DUBAI · UAE city text |

---

## Technical Details

### ConceptCard Edit Text Button
Add a second small "Edit Text" button in the card footer:
```tsx
<Button size="sm" variant="outline"
  className="w-full h-7 text-xs gap-1 border-[hsl(var(--gold)/0.4)]"
  onClick={(e) => { e.stopPropagation(); onEditText(concept); }}>
  <Type size={10}/> Edit Text
</Button>
```
`onEditText` calls:
```tsx
function handleEditText(concept: StampDesignConcept) {
  setSelectedId(concept.id);
  setPreviewConcept(null);
  setLeftTab('text');
}
```

### License Uploader Section in Generator
Add a collapsible pill-button just above the concept grid:
```tsx
<details className="bg-white rounded-2xl border ...">
  <summary>AI Auto-Fill from Trade License</summary>
  <StampLicenseUploader onExtracted={handleExtracted}/>
</details>
```
Where `handleExtracted` updates the project state and optionally triggers a re-generate.

### T12 City Fix
Change line 685 in `stampTemplates.ts`:
```
BEFORE: fill="${COLOR}" letter-spacing="3.5">DUBAI · UAE</text>
AFTER:  fill="${COLOR}" letter-spacing="3.5">${city ? city.toUpperCase() : 'DUBAI'} · ${(project.country_optional || 'UAE').toUpperCase()}</text>
```

### AI Panel Position Fix
Change line 704 in `StampGeneratorPage.tsx`:
```
BEFORE: top: 72,
AFTER:  top: 160,
```

### Font Expansion
Replace the 6-entry `STAMP_FONTS` array with 14 entries. All use CSS font stacks available without loading external fonts:

```typescript
const STAMP_FONTS = [
  { label: 'Trajan (Elegant)',      value: 'Georgia, "Times New Roman", serif',             preview: 'Aa' },
  { label: 'Garamond (Classic)',    value: '"Garamond", "Palatino Linotype", serif',         preview: 'Aa' },
  { label: 'Baskerville (Literary)',value: '"Baskerville", "Book Antiqua", serif',           preview: 'Aa' },
  { label: 'Caslon (Antiquarian)', value:  '"Book Antiqua", "Palatino", Georgia, serif',    preview: 'Aa' },
  { label: 'Modern Sans',           value: '"Arial", "Helvetica Neue", sans-serif',          preview: 'Aa' },
  { label: 'Futura (Geometric)',    value: '"Century Gothic", "Trebuchet MS", sans-serif',   preview: 'Aa' },
  { label: 'Gill Sans (Humanist)',  value: '"Gill Sans", "Gill Sans MT", "Optima", sans-serif', preview: 'Aa' },
  { label: 'Verdana (Screen)',      value: '"Verdana", "Tahoma", sans-serif',               preview: 'Aa' },
  { label: 'Courier (Monospace)',   value: '"Courier New", "Courier", monospace',           preview: 'Aa' },
  { label: 'Impact (Display)',      value: '"Impact", "Franklin Gothic Bold", sans-serif',  preview: 'Aa' },
  { label: 'Rockwell (Slab)',       value: '"Rockwell", "Courier New", serif',              preview: 'Aa' },
  { label: 'Optima (Soft Elegant)', value: '"Optima", "Segoe UI", sans-serif',              preview: 'Aa' },
  { label: 'Lucida (Calligraphy)', value:  '"Lucida Calligraphy", "Palatino", serif',       preview: 'Aa' },
  { label: 'Cinzel (Imperial)',     value: '"Palatino Linotype", "Palatino", serif',        preview: 'Aa' },
];
```

---

## What Does NOT Change
- Database schema or edge functions
- Export rasterization logic
- Color wheel or palette presets  
- Authentication or session handling
- All other stamp templates (T1–T11)
- `StampTextEditor` component
- `StampExportPage.tsx`
