

## Stamp Generator — Ink Texture, Multi-Color Export, Smart Auto-Fill, and Left Panel Width Fix

### Issues to Fix

1. **Ink Impression texture not working** — `StampSVGRenderer` injects the `inkTexture` SVG filter correctly, but DOMPurify strips critical filter elements. The `ADD_TAGS` list includes `feTurbulence`, `feComposite` etc., but `feComponentTransfer` and `feFuncA` may be getting stripped because DOMPurify's SVG profile is restrictive. Need to verify the sanitize config allows all filter primitives and the `opacity` attribute on `<g>`.

2. **Multi-color download at export time** — The Export page already has `PACK_COLORS` (line 194) but users need to select a color and download in that color on-the-fly. Add a "Download in Color" section to the Export page where users pick from the palette (Black, White, Gold, Ink Blue, etc.) and each download applies that tint before rendering.

3. **Smart Auto-Fill showing again inside generator** — The `StampLicenseUploader` section (lines 842-873) is always visible in the center panel. Since trade license was already uploaded in the wizard step before reaching generation, this should be hidden by default. Only show a small "Re-upload License" link, not the full uploader panel.

4. **Smart Auto-Fill padding issue** — When expanded, the `StampLicenseUploader` content (line 854) has `px-3 pb-3` but no `pt-2`, so content touches the top border divider.

5. **Left panel tab labels broken/wrapping** — The tab switcher at line 575 uses `w-[200px]` panel with 5 tabs (`Colors`, `Fonts`, `Text`, `Art`, `Logo`). At 200px with padding, the text wraps to two lines. Need to widen the panel to 240px or abbreviate labels.

### Implementation

**A. Fix ink impression texture** (`StampSVGRenderer.tsx`)
- Add `opacity` to `ADD_ATTR` list in DOMPurify config
- Add `feFuncR`, `feFuncG`, `feFuncB` to `ADD_TAGS` for completeness
- Verify the filter chain works by testing the `inkMode` toggle renders visible texture differences

**B. Multi-color download** (`StampExportPage.tsx`)
- In the export UI, add a "Color Variant" selector showing the existing `PACK_COLORS` palette
- When user selects a color, apply `tintSvgFull()` with that color as primary before generating PNG/SVG/PDF
- Add a "Download All Colors" button that generates a ZIP with the stamp in every palette color

**C. Hide Smart Auto-Fill by default** (`StampGeneratorPage.tsx`)
- Change `licenseOpen` initial state to `false` (already is)
- Collapse the entire uploader section to just a single-line "Re-scan Trade License" link
- Remove the accordion-style card wrapper; show just a small text button

**D. Fix padding** (`StampGeneratorPage.tsx`)
- Add `pt-2` to the license uploader content div (line 854)

**E. Widen left panel** (`StampGeneratorPage.tsx`)
- Change `w-[200px]` to `w-[240px]` on the left panel (line 572)
- This gives each of the 5 tabs enough room to display without wrapping

### Files to modify
1. `src/components/stamp-generator/StampSVGRenderer.tsx` — fix DOMPurify config for ink texture
2. `src/components/stamp-generator/StampGeneratorPage.tsx` — widen panel, fix auto-fill UI/padding
3. `src/components/stamp-generator/StampExportPage.tsx` — multi-color download feature

