
Scope confirmed from your answers:
- Full editor scope: both stamp pages (`/toolkit/stamp-generator/new` and `/:projectId/generate`)
- Export behavior: support both ZIP (primary) + individual file downloads
- Keep onboarding popup behavior unchanged

What I observed now
1) I captured the current state screenshot: the Guided Tour modal is on top (dark overlay + welcome dialog), and the stamp canvas is blocked behind it.
2) In code, your current `/new` page uses `LiveStampPreview` (click highlight only), not the full interactive editor.
3) Arabic/English parity is incomplete: Arabic has arc spread control; English spread is fixed in template.
4) Arc alignment controls are too limited (no explicit radial positioning controls for company/location arcs).
5) Export on `/new` relies on direct SVG→canvas conversion with multiple immediate downloads, which is fragile and matches your “PNG failed / malformed file” symptoms.

Implementation plan (single batch)

1) Unify editing capabilities across both stamp pages
- Reuse the interactive editing stack in both pages (not only generate page):
  - bring `StampInteractivePreview` + enhanced controls into `/new`
  - keep `/generate` as advanced editor and add the same missing controls there
- Ensure same behavior in both:
  - select element on preview
  - drag/nudge selected element
  - show size/color/position controls for selected monogram and text arcs
  - keep letter-level editing via `StampTextEditor` for all text segments

2) Fix arc geometry and “full spread to separator” behavior
- Extend template config to support separate spread + radial offsets:
  - `englishArcSpread` (new)
  - keep `arabicArcSpread`
  - `companyArcBandOffset` (new)
  - `locationArcBandOffset` (new)
- Update `stampOfficialTemplate.ts`:
  - compute arc spread for English and Arabic independently
  - anchor spread against separator radius so “full spread” reaches separator endpoints
  - recenter company/location arcs between ring boundaries using explicit offset controls
- Add mirrored controls in both editors:
  - English arc spread slider
  - Arabic arc spread slider
  - Company arc vertical/radial offset (up/down)
  - Location arc vertical/radial offset (up/down)
- Keep default values tuned so current good English look remains preserved.

3) Make drag truly work for arc/location text and center art
- Current nudge logic mutates `x/y` on `<text>` and is unreliable for `<textPath>`.
- Refactor interaction model:
  - map selected element -> semantic control target (company arc, location arc, center content, separators)
  - drag/nudge updates layout state values (offsets, separator distance, center X/Y) instead of raw SVG text attributes
- Add center controls:
  - center X/Y offset
  - size slider
  - color controls (existing monogram colors remain, plus quick selected-element controls)

4) Add per-border editability (color + thickness) as requested
- Add data hooks in SVG for ring elements (outer/middle/inner) to make them selectable.
- Add style controls for selected border:
  - stroke color
  - stroke width
- Keep global ink color available, but selected-border override takes priority when set.

5) Harden exports and fix “PNG export failed / bad bulk output”
- On `/new` export:
  - add JSZip-based bulk export as primary “Download All Types (ZIP)”
  - preserve individual buttons (PNG/JPG/WEBP/PDF/SVG)
- Improve SVG->canvas reliability:
  - sanitize/uniquify IDs before rasterization
  - guard against tainted canvas/image decode failures with explicit fallback and user-safe error handling
  - produce deterministic filenames and MIME-safe blobs
- Align `/new` export behavior with robust logic already used in `StampExportPage`.

6) Keep onboarding popup behavior (per your preference)
- No suppression of guided popup on toolkit routes.
- But I will ensure stamp editor state and selection survive modal open/close cycles (no reset, no frozen interaction after dismissal).

Files to update (planned)
- `src/lib/stampOfficialTemplate.ts`
  - add new geometry config fields and centered spread math
  - add selectable border element data attributes
- `src/components/stamp-generator/LiveStampPreview.tsx`
  - pass new English spread + arc/band offsets + center offsets into template
- `src/components/stamp-generator/StampProjectWizard.tsx`
  - upgrade preview/editor interactions to match generate page capabilities
  - add new arc/border/center controls
  - replace bulk export flow with ZIP-primary + individual fallback
- `src/components/stamp-generator/StampInteractivePreview.tsx`
  - semantic drag/nudge model (state-driven, not raw textPath mutation)
  - element-specific toolbar extensions for monogram/text/borders
- `src/components/stamp-generator/StampLeftPanel.tsx`
  - mirrored controls for English+Arabic spreads, arc offsets, border thickness/color
- `src/components/stamp-generator/StampGeneratorPage.tsx`
  - wire in new shared controls/state for parity with `/new`

Technical details
- Root cause of “not movable”:
  - arc text is rendered via `<textPath>`; mutating `x/y` on `<text>` does not reliably move arc content.
  - fix is to move geometry parameters, not node attributes.
- Root cause of alignment complaints:
  - fixed spread constants and limited radial controls cause mismatch between separators and arc text bands.
- Root cause of export fragility:
  - direct multi-file triggering + raster conversion edge-cases can fail in some environments; ZIP-first workflow is safer.

Acceptance checks I will run after implementation
1) English + Arabic company/location arcs can be independently spread and moved up/down in both pages.
2) Arc text visually aligns with separator height and stays centered between rings.
3) Monogram can be selected, resized, recolored, and repositioned from preview controls.
4) Border rings are selectable and support per-ring color/thickness edits.
5) “Download All Types” creates a valid ZIP with SVG/PNG/JPG/WEBP/PDF; individual exports still work.
6) No “PNG export failed” in normal flow with and without uploaded logo/monogram.
