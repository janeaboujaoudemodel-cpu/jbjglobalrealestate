
Goal: fix stamp flow reliability in one patch: correct “Create Your Stamp” routing behavior, make monogram-only editing actually target monogram, open the correct editing controls on element click, normalize arc/separator geometry to true 0–100 behavior, and complete export/download options (including JPG + WEBP) without leaving the studio experience.

Plan

1) Fix “Create Your Stamp” entry behavior (no forced My Projects)
- Update `src/pages/toolkit/StampGeneratorPage.tsx` CTA logic.
- Add “last stamp screen” memory (`stamp_last_route`) written from:
  - `StampProjectWizard.tsx`
  - `StampGeneratorPage.tsx`
  - `StampProjectsDashboard.tsx`
- CTA behavior:
  - If signed out: auth redirect back to stamp flow.
  - If signed in: open last stamp screen.
  - If last screen has an active draft/session: show action modal:
    - Resume current draft
    - Save current draft and start new
    - Discard current draft and start new
- Ensure “Start new” always lands on `/toolkit/stamp-generator/new`.

2) Fix monogram color bug (color picker must not recolor borders)
- Root fix in `src/components/stamp-generator/StampSVGRenderer.tsx`:
  - Remove broad center fallback recolor that catches central elements globally.
  - Restrict accent application to explicit accent tokens/targets only.
- Strengthen live monogram application in `src/components/stamp-generator/StampGeneratorPage.tsx`:
  - Apply colors using effective monogram text (`localMonogramText || derivedInitials`), not only explicit typed text.
  - Update active standard SVG override immediately on monogram color change.
- Harden selector logic in `src/components/stamp-generator/MonogramColorEditor.tsx` so letter/divider targeting is deterministic for repeated edits.

3) Click-to-edit should auto-open the right controls
- `src/components/stamp-generator/StampInteractivePreview.tsx`:
  - On center click: force monogram mode and emit panel-focus event.
  - On separator click: emit separator-focus event.
  - On arc/location click: emit typography/spacing-focus event with element id.
- `src/components/stamp-generator/StampLeftPanel.tsx`:
  - Add event listeners to open relevant accordion sections automatically.
  - Add explicit separator control block (style, color, size, centering).
  - Add explicit monogram control block (all letters, per-letter, divider, size/width).

4) Normalize spacing controls to true percentage model (0–100, centered=50)
- Fix mismatched units:
  - `StampLeftPanel.tsx` currently uses separator distance in px-like range.
  - `StampProjectWizard.tsx` uses restricted 30–80 range.
- Standardize to:
  - Separator distance slider: 0–100 (default 50).
  - Arc spread sliders per arc group: 0–100 with consistent mapping.
- Ensure mapping to template uses `separatorDistancePct` and consistent spread conversion.

5) Fix Arabic/English arc parity and centering
- `src/lib/stampOfficialTemplate.ts`:
  - Rebalance Arabic location/company sizing so Arabic arcs fill similarly to English arcs.
  - Keep both languages centered on paths (`startOffset=50`, `text-anchor=middle`) with matched safe-zone strategy.
  - Adjust text arc radii to avoid hugging ring borders.
- Verify bilingual location top/bottom arc sizing parity and equal visual fullness.

6) Keep AI concepts inside studio right sidebar with pagination sections
- `src/components/stamp-generator/StampRightPanel.tsx` + `StampVariationsPanel.tsx`:
  - Keep standard preview pinned and locked.
  - Present generated concepts in right sidebar sections with paging (not endless vertical dump).
  - Add category/pagination controls while staying in current studio screen.

7) Complete export options + print separation
- `src/components/stamp-generator/StampProjectWizard.tsx` (quick export) and `StampExportPage.tsx` (full export):
  - Add explicit JPG and WEBP options.
  - “Download PDF” must produce file download only.
  - Separate “Print” action for print flow.
  - Enforce background rules:
    - SVG: transparent
    - PNG: provide transparent + white-background variants
    - JPG: white background
    - WEBP: include transparent + white where supported in kit
    - PDF: white background
  - Add “Download All Types” bundle with clear labels.

8) Draft/preset discoverability and reset actions
- Extend library visibility in both wizard and generator:
  - Presets + drafts in visible “Library” surface.
  - Fast actions: Restore, Rename, Delete, Save & Start New, Discard & Start New.
- Align keys with existing draft convention while preserving project-scoped draft recovery.

9) Stabilize large-screen shell behavior on refresh
- Re-validate shell rendering in:
  - `MainLayout.tsx`
  - `GlobalHeader.tsx`
  - `use-touch-layout.ts`
- Lock behavior: phone-only header under 768; L-shape on 768+ always (including iPad/medium desktop), even after hard refresh/route restore.

Technical details
- Main root causes identified:
  1) Landing CTA still hardcoded to `/projects`.
  2) Center recolor fallback in renderer is too broad and can override unintended elements.
  3) Monogram live-apply depends on explicit monogram text; derived initials path is not fully applied.
  4) Separator slider units are inconsistent across wizard/generator/template.
  5) Arabic arc sizing logic uses different practical constraints vs English, causing underfilled arcs.
- Primary files to update:
  - `src/pages/toolkit/StampGeneratorPage.tsx`
  - `src/components/stamp-generator/StampGeneratorPage.tsx`
  - `src/components/stamp-generator/StampInteractivePreview.tsx`
  - `src/components/stamp-generator/StampLeftPanel.tsx`
  - `src/components/stamp-generator/MonogramColorEditor.tsx`
  - `src/components/stamp-generator/StampProjectWizard.tsx`
  - `src/components/stamp-generator/StampExportPage.tsx`
  - `src/components/stamp-generator/StampRightPanel.tsx`
  - `src/components/stamp-generator/StampVariationsPanel.tsx`
  - `src/lib/stampOfficialTemplate.ts`
  - `src/components/MainLayout.tsx`, `src/components/GlobalHeader.tsx`, `src/hooks/use-touch-layout.ts`

Validation checklist
- Create Your Stamp opens last stamp screen, with resume/save+new/discard+new choices when draft exists.
- Clicking monogram and selecting blue changes monogram only (or selected monogram letters), not borders.
- Clicking separator opens separator editing controls immediately.
- Separator distance can reach full 100 and center at 50 in both wizard and generator.
- Arabic and English company/location arcs show equivalent fullness and centering.
- Export includes SVG, PNG (transparent + white), JPG, WEBP, PDF, plus separate Print.
- Generate concepts/variations remain inside studio right sidebar with pagination, while standard model remains pinned.
- L-shape shell persists on iPad/desktop widths after hard refresh; phone keeps mobile header.
