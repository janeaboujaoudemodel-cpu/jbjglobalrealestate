
Goal: restore fully working Stamp Studio behavior with immediate live preview wiring, correct Arabic/English arc rendering, working shape/border/typography controls, clickable element editing + AI assistant, reliable concept generation, and stable responsive layout.

Deep audit findings (what is actually broken now):
1) Arc/layout engine mismatch:
- `generateOfficialStampSVG` always forces Arabic top + English bottom (`stampOfficialTemplate.ts`), so EN-only/AR-only modes break.
- Arabic location/company arc controls are only partially wired; `arc_text_spacing`, `separator_distance` are not applied.
- OVAL/RECTANGLE style appears broken in bilingual flow because round/bilingual path always uses circular template.
2) Style controls not reflecting:
- Theme/shape/border settings are partially ignored in official template path.
- Single/Double/Ring currently render too similarly for user expectations.
- Dotted “single vs double + thickness” options do not exist yet.
3) Preview interactivity gap:
- Wizard preview click only switches tabs; no highlight, no local action panel, no nudge controls.
- Console confirms ref issue in `StampProjectWizard` (`OptionButton` needs ref-safe component).
4) Generate Concepts friction:
- Button is disabled by hard conditions and auth-gated with weak feedback; appears “off” to user.
5) Header/scroll UX issue:
- Wizard/Studio use rigid `100vh` math and nested scroll areas, causing partial-header stick behavior on scroll.
6) Edge function drift:
- `ai-stamp-generator` still uses older SVG builder logic and legacy token assumptions; not aligned with latest layout rules.

Implementation plan (approved scope):
Phase 1 — Unified stamp render model (core fix)
- Update `src/lib/stampOfficialTemplate.ts` to support:
  - true language modes (EN-only, AR-only, BILINGUAL) without forced second line
  - full-width arc behavior for Arabic and English, both company and location
  - per-field text mode: `arc` or `straight` (default arc); add “Kurdistani straight” option
  - shape geometry for round/oval/rectangle/square in official path
  - border model split: ring count (single/double), pattern (solid/dotted/dashed), weight (thin/normal/thick)
  - separator distance + arc text spacing + center size + ring gap properly applied
- Keep company name centered in ring gap for all languages/modes.

Phase 2 — Wire every control to live preview (instant reflection)
- `StampProjectWizard.tsx` + `LiveStampPreview.tsx`:
  - pass all style/layout/typography fields end-to-end
  - remove dead controls or map them to real SVG parameters
  - add “Ink Color Standard (Navy)” label next to navy swatch
  - expand quick color section into full palette + presets (not only swatches).

Phase 3 — Interactive click-to-edit + section highlighting
- Upgrade wizard preview interaction:
  - click on element => highlight selected SVG part
  - open compact contextual action panel (nudge, size, spacing, mode toggle arc/straight, reset)
  - auto-focus corresponding form section
- Fix `OptionButton` ref warning by converting to ref-safe component (forwardRef or native button component extraction).

Phase 4 — Embedded AI assistant per selected element
- Add floating/minimizable “Smart Assistant” in wizard and studio:
  - contextual suggestions based on selected element (e.g., “match English curvature”)
  - prompt sends targeted instruction and updates selected element only
  - keep it always available and dismissible.

Phase 5 — Generate Concepts reliability
- Make CTA always visibly actionable:
  - if company name missing: inline helper state, not silent disable
  - if auth required: clear gate modal + continue flow after login
- Ensure “Generate Concepts” in wizard routes correctly and consistently.
- Preserve standard model behavior (generated options never overwrite main preview unless user applies).

Phase 6 — Edge function alignment + deployment
- Refactor `supabase/functions/ai-stamp-generator/index.ts` to mirror current official template rules:
  - language modes, arc/straight options, shape and border semantics, spacing controls
  - remove any user-facing wording that includes prohibited “government” labeling
- Validate actions: `generate`, `refine`, `variations`, `refine-image`.
- Redeploy updated stamp function and verify responses end-to-end.

Phase 7 — Header/scroll stability
- Replace rigid `100vh` usage with `100dvh` + consistent container offsets in wizard/studio pages.
- Normalize sticky/header behavior so scrolling always returns to full Stamp Studio header state (no half-stuck tabs/header).

Phase 8 — Export parity (including PDF everywhere requested)
- In wizard export, add direct PDF download to match full export flow.
- Keep full-kit download options (SVG/PNG/JPG/WEBP/PDF + color packs) discoverable and consistent.

Validation & test plan (with screenshots):
1) Language matrix test:
- EN-only, AR-only, BILINGUAL; company+location each in arc and straight mode; all centered and visible.
2) Shape/border matrix:
- round/oval/rectangle/square + single/double + dotted/solid + thin/normal/thick; clear visual differences.
3) Controls wiring:
- typography, Arabic controls, spacing sliders, color palette, ink mode all update preview immediately.
4) Interactivity:
- click-highlight works; element toolbar opens; nudge/resize/spacing applies to selected element.
5) Generate flow:
- Generate Concepts works from wizard and studio; no disabled dead-end state.
6) Responsive and UX:
- desktop/tablet/mobile checks + capture screenshots for each major section.
7) Edge verification:
- function calls return correct concepts with updated layout semantics and no policy-violating labels.

Result after implementation:
- Arabic and English arcs behave consistently edge-to-edge when chosen.
- Single-language modes are no longer broken.
- All style/typography/color controls visibly and immediately affect preview.
- Click-to-edit + AI assistant become usable in real workflow.
- Concept generation and export (including PDF) are stable and discoverable.
