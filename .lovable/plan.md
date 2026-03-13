
Confirmed from your choices:
- Priority: Stamp readability first
- Studio behavior on your screen: fixed center preview + tabbed controls (no long scrolling)
- Delete behavior: hide per design (undo restores)

Root-cause audit (from current code):
1) Text readability + thin lines  
- `stampOfficialTemplate.ts` uses thin default strokes and limited fit logic.  
- Border/style choices from wizard are mostly ignored for the bilingual official path.
2) Bottom English arc direction  
- Bottom arc path orientation in official template is causing reversed/uncomfortable reading.
3) “I move empty layers” issue  
- `InteractiveStampCanvas.tsx` uses rectangular overlay boxes, not actual SVG text/logo nodes.  
- Layer state is also reset from form changes in `StampProjectWizard.tsx`, so edits feel broken.
4) Layout crop/scroll problems  
- Wizard uses stacked layout below `lg`; at 912px wide it falls into non-3-panel mode and causes scrolling/cropping perception.
5) Sidebar active highlight issue  
- `GlobalVerticalNav.tsx` only exact-matches most routes (`/toolkit/stamp-generator/new` not treated as active for `/toolkit/stamp-generator`).

Implementation plan (next pass):
Phase A — Readability + official geometry (first)
- Refactor `src/lib/stampOfficialTemplate.ts`:
  - Enforce robust arc-safe text fitting (shrink, letter-spacing adjust, final ellipsis fallback).
  - Increase minimum stroke widths and text weights for legibility.
  - Fix bottom English path to left→right readable orientation (and same fix for location English arc).
  - Keep Arabic top / English bottom default.
  - Add explicit official border presets so SINGLE/DOUBLE/RING/DOTTED/ROPE visibly differ even on bilingual official mode.
  - Keep default location “Dubai, UAE”; keep license hidden by default and optional toggle.
- Wire style props fully from `LiveStampPreview.tsx` to official renderer so typography/border updates are immediate.

Phase B — Centered fixed frame (no long scrolling)
- Rebuild wizard shell in `src/components/stamp-generator/StampProjectWizard.tsx` as fixed frame:
  - Full studio viewport container with persistent centered preview.
  - Tabbed side controls around the preview (Company, Style, Logo, Export/Actions), matching your “fixed center + tabs” choice.
  - Independent panel scrolling only inside tabs (not full page).
  - Stable top offsets so header never overlays/crops the studio.
  - Visible frame border around the studio area.

Phase C — True direct on-canvas editing (real elements, not empty boxes)
- Upgrade `InteractiveStampCanvas.tsx` + official SVG ids:
  - Give real SVG groups stable IDs (`topText`, `bottomText`, `locationTop`, `locationBottom`, `monogram/logo`, `separators`, `license`).
  - Select/move/scale/hide these real groups directly; no fake rectangular overlay behavior.
  - Delete = hide for current design only (as requested), with undo support.
  - Preserve layer transforms/visibility across form edits (remove destructive reset behavior and merge state instead).
- Extend history to include layer operations, not just form fields.

Phase D — UX completeness + navigation + proof
- Add clear labeled actions (not icon-only): Save Draft, Save Project, Print Preview, Export Kit.
- Show draft state text (“Draft saved locally at HH:MM”).
- Fix left sidebar active state in `GlobalVerticalNav.tsx` with prefix matching for stamp generator routes and keep section expanded.
- Produce screenshot proof pack after implementation:
  1) Readability inside circle (Arabic/English/location all fitting)
  2) Centered frame at current viewport
  3) Real element drag/resize/delete/hide behavior
  4) Save/print/export visibility
  5) Sidebar active highlight on stamp generator routes

Technical details (implementation-specific):
- Files to update:
  - `src/lib/stampOfficialTemplate.ts`
  - `src/components/stamp-generator/LiveStampPreview.tsx`
  - `src/components/stamp-generator/InteractiveStampCanvas.tsx`
  - `src/components/stamp-generator/StampProjectWizard.tsx`
  - `src/components/navigation/GlobalVerticalNav.tsx`
- No database migration required for this pass.
- Existing backend generation can remain; this pass is focused on deterministic studio correctness and UI reliability first.
- After this stabilization pass, we can do the deeper “tool/model/workflow/export kit automation expansion” safely without breaking core editing behavior again.

Acceptance criteria for this pass:
- No text escapes rings in official template with long company names.
- Bottom English reads naturally left→right on lower arc.
- Preview stays centered while switching tabs; no full-page scrolling required for normal editing.
- Clicking/dragging affects actual text/logo elements (not empty overlays).
- Delete hides element per design and undo restores it.
- Stamp Generator route is visibly active in left sidebar on `/toolkit/stamp-generator/new` and related subroutes.
- Labeled save/print/export controls are visible and understandable.
