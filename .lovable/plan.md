
Goal
- Rebuild the Company Stamp Generator into a premium, centered, live-edit studio with direct on-canvas interaction, reliable project creation, better bilingual layout, and stronger automation from trade license upload.
- Confirmed choices: Corporate-official standard only (no government emblems), remove “AI” wording from UI labels, default bilingual order = Arabic top / English bottom (with reverse toggle).

What is currently broken (from code review)
- “Failed to create project” likely caused by DB constraint mismatch: UI offers typography values (GOTHIC, ARABIC_MODERN) but database check only allows SERIF/SANS/MONOSPACE/CALLIGRAPHY.
- Border styles look identical because generation templates mostly ignore project.border_style.
- Many controls don’t reflect because generator outputs static template SVGs instead of a structured editable scene model.
- Live preview is a side panel, not centered with controls around it.
- Logo quality degrades when low-resolution raster uploads are used; no quality guidance/locking workflow.
- Language placement/reverse is not consistently applied across all generated templates.

Implementation plan

Phase 1 — Stability and data model hardening
1) Database migration
- Expand typography constraint to include GOTHIC + ARABIC_MODERN.
- Add persistent columns to stamp_projects:
  - language_reversed boolean default true (AR top default per your selection)
  - show_license_number boolean default true
  - show_location boolean default true
  - location_text_mode text default 'CITY_COUNTRY'
  - business_type text
  - layout_json jsonb default '{}' (for draggable positions/sizes/locks)
- Add server validation trigger for safe bounds in layout_json (no invalid coordinates/sizes).

2) Fix create flow error surfacing
- In StampProjectWizard, show exact backend error message (not generic “Failed to create project”).
- Add inline validation before insert for invalid typography value and oversized embedded logo payload.

Phase 2 — “Premium Studio” layout + centered live canvas
3) Reframe StampGeneratorPage into a true center-canvas editor
- 3-zone composition:
  - Left: structure/tools (text layers, border/dividers, logo/monogram, language order, location toggle)
  - Center: large live canvas (always visible, centered)
  - Right: style controls (palette, fonts, sizes, spacing, ring styles, presets)
- Move quick actions (undo/redo/reset/save draft/new/resume/delete) into sticky top toolbar around canvas.

4) Direct interaction on preview (click/drag/edit)
- Build layer-based editing model over SVG:
  - text layers: Arabic top arc, English bottom arc, location arc, registration line
  - center layer: logo/monogram/icon
  - divider/ring layers
- Enable:
  - click to select layer
  - drag to move (where allowed)
  - resize handles for logo/monogram/text scale
  - delete/hide layer
  - lock/unlock layer
- Add history stack (undo/redo) and reset-to-template.

Phase 3 — Stamp standards + visual quality
5) Corporate standard preset engine
- Add “Corporate Official Blue” default preset:
  - ink blue default
  - circular official style
  - bilingual arc default AR top / EN bottom
  - center options: monogram/logo/title/icon
- Keep compliance guard: no government emblems/titles.
- Add one-click reverse language order (EN top / AR bottom).

6) Real border + typography behavior
- Refactor template generation so border_style actually changes geometry/strokes:
  - SINGLE/DOUBLE/RING/DOTTED/ROPE/CUSTOM visually distinct in output SVG.
- Ensure typography selection affects all text layers immediately (live + exported).

7) High-quality logo pipeline
- Prefer SVG uploads when available.
- For raster uploads: preserve original dimensions, render at high internal resolution, and export at 2x/4x for crisp center mark.
- Add quality warning for tiny logos and an auto-fit/center tool.

Phase 4 — Trade license automation + business type
8) Upgrade license extraction and auto-configuration
- Extend ai-stamp-extract output with:
  - business_type (e.g., Real Estate)
  - normalized location fields for stamp display logic
- Auto-apply extracted business_type to style recommendations and preset variants.
- Auto-fill + lock mapped fields where required, with manual override for non-locked items.

9) Workflow automation
- Auto-regenerate concepts only when meaningful fields change (debounced), avoiding unnecessary model delays.
- Save draft continuously (project + layout_json + active controls).
- Resume session from last state reliably.

Phase 5 — Labeling + polish
10) Remove “AI” wording from stamp UI labels only
- Rename visible labels to “Smart”, “Auto”, or neutral wording while keeping automation.
- Keep route/functionality unchanged.

11) Premium visual polish
- Improve contrast/hover/readability across dropdowns/buttons.
- Make controls consistent with company luxury theme and accessible on mobile breakpoints.

Edge functions and deployment plan
- Update and deploy only related functions first:
  - ai-stamp-generator
  - ai-stamp-extract
  - document-ocr (only if reused for fallback extraction)
- Keep auth enforcement and CORS headers intact.
- Add explicit 402/429 user-facing errors.
- Run targeted smoke calls after deploy (generate, refine, extract).

Testing and proof (including screenshots you requested)
- End-to-end test checklist:
  1) New project creation with each typography option (including GOTHIC/ARABIC_MODERN).
  2) Border style visual differences verified.
  3) AR-top default + reverse toggle verified.
  4) Layer drag/resize/lock/delete reflected live and persisted after reload.
  5) Logo quality at preview and export verified.
  6) Trade license upload auto-fills company, city, business_type, and updates stamp.
  7) Save draft/resume/undo/redo/reset flows verified.
- Capture before/after screenshots per section:
  - centered live canvas
  - interactive layer selection
  - border style differences
  - bilingual order toggle
  - successful project creation
  - extraction auto-fill and generated output

Files that will be updated (implementation stage)
- src/components/stamp-generator/StampProjectWizard.tsx
- src/components/stamp-generator/StampGeneratorPage.tsx
- src/components/stamp-generator/StampSVGRenderer.tsx
- src/components/stamp-generator/LiveStampPreview.tsx
- src/components/stamp-generator/StampTextEditor.tsx
- src/lib/stampTemplates.ts
- supabase/functions/ai-stamp-generator/index.ts
- supabase/functions/ai-stamp-extract/index.ts
- new migration: stamp_projects schema + typography constraint update + validation trigger
