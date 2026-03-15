
Goal: fix the stamp studio UI/UX regression in one pass: sidebar hover clipping under the horizontal header, cramped/cheap header cells, broken download/print actions (especially from the wizard export tab on iPad/desktop), missing bulk export affordances, and Arabic/English arc spacing/centering consistency.

What I confirmed from the code and preview
- The horizontal utility bar uses `overflow-y-hidden` and tightly packed standalone rounded cells in `HorizontalUtilityBar.tsx`, which contributes to clipped hover/dropdown behavior and “cheap” segmented look.
- Collapsed sidebar tooltips in `GlobalVerticalNav.tsx` are rendered without explicit high-priority layering/portal strategy, so they can visually conflict with the top bar stack.
- Wizard export tab (`StampProjectWizard.tsx`) still uses popup/print-window style PDF flow and non-unified download logic; this is the primary “click but nothing happens” risk on iPad/Safari (popup-blocking + async user-gesture loss).
- Full export page (`StampExportPage.tsx`) has richer export actions, but wizard export does not expose equivalent bulk actions and still behaves differently.
- Round template text math in `stampOfficialTemplate.ts` can make Arabic arcs feel underfilled versus English due to sizing/spacing heuristics and spread handling, especially in bilingual/location arcs.
- Your clarification received:
  - Header grouping: apply to horizontal header fields.
  - English ARC spacing: smart defaults + manual override.

Implementation plan

1) Fix L-header overlap + minimized sidebar hover clipping
- File: `src/components/navigation/HorizontalUtilityBar.tsx`
  - Remove vertical clipping on the top bar container (`overflow-y-hidden` -> safe visible strategy).
  - Keep horizontal scrolling behavior.
  - Increase separation between Settings and Mode with a hard divider and spacing token.
- File: `src/components/navigation/GlobalVerticalNav.tsx`
  - Raise collapsed-hover tooltip/flyout stacking and ensure hover content is not constrained by parent clipping.
  - Add explicit tooltip layering class and collision padding so topmost icons don’t tuck under the utility bar.
- File: `src/components/MainLayout.tsx` (if needed)
  - Verify top offsets and z-index ordering for sidebar/header remain consistent at 1166x729 and tablet widths.

2) Redesign horizontal utility bar to premium connected segmented fields
- File: `src/components/navigation/HorizontalUtilityBar.tsx`
  - Keep minimizer as standalone button (as requested).
  - Convert remaining horizontal header controls into one connected “segmented rail” style:
    - square/clean edges, no cheap rounded pills per cell,
    - exactly three vertical dividers between grouped sections,
    - integrated Back + heart + core fields with consistent height.
  - Replace tiny bordered icon chips with unified segment cells and internal dividers.
- Keep behavior intact (search, filter, mode switcher, settings, unit toggles, links).

3) Make download/print actions reliable everywhere (wizard + export page)
- File: `src/components/stamp-generator/StampProjectWizard.tsx`
  - Replace ad-hoc export handlers with unified robust client-side export helpers (SVG/PNG/JPG/WEBP/PDF).
  - Eliminate popup-dependent “Download PDF opens print dialog” flow from download action.
  - Implement true “Download PDF file” and separate “Print Preview” action.
  - Ensure all downloads are triggered with Safari/iPad-safe anchor flow.
- File: `src/components/stamp-generator/StampExportPage.tsx`
  - Reuse the same export helper path and error handling so wizard/export page are consistent.
  - Ensure per-format buttons surface clear toast for success/failure.
- Add resilient fallback error toasts for blocked popups/failed canvas conversions.

4) Add bulk actions where user expects them
- File: `src/components/stamp-generator/StampProjectWizard.tsx`
  - Add “Download All Types” bulk action directly in wizard Export tab:
    - SVG (transparent),
    - PNG transparent + PNG white,
    - JPG white,
    - WEBP (transparent/white strategy),
    - PDF white.
  - Keep user in studio (no forced context switch).
- File: `src/components/stamp-generator/StampExportPage.tsx`
  - Keep and harden full kit flow, and expose missing quick bulk presets if needed.

5) ARC text quality fixes (English token spacing + Arabic full-arc parity + centering)
- File: `src/lib/stampOfficialTemplate.ts`
  - Add smart English token normalization:
    - tighten “J B J” style initial clusters,
    - keep “LLC” tight,
    - add small controlled gap after “LLC” before following token (e.g., SOC),
    - keep manual slider override (`arcTextSpacing`) as final user control.
  - Rebalance Arabic arc sizing heuristics to avoid underfilled arcs versus English:
    - adjust Arabic width/spacing assumptions,
    - keep spread consistent for bilingual company/location arcs,
    - ensure location/company arcs are centered in their ring gaps.
  - Keep separator and location centered on ring-mid geometry.
- File: `src/components/stamp-generator/StampProjectWizard.tsx`
  - Maintain manual spacing sliders so user can override smart defaults.

6) UI quality pass for hover/dropdowns/previews
- Files: `HorizontalUtilityBar.tsx`, `GlobalVerticalNav.tsx`, optionally shared tooltip/dropdown wrappers used there.
  - Normalize hover states and dropdown shadows for premium appearance.
  - Ensure hover previews/tooltips are fully visible and not cut off at top bar boundaries.

Validation plan before release
- Layout/hover:
  - Collapse sidebar, hover top icons: no clipping under header.
  - Header fields are connected segmented style with 3 dividers; minimizer remains standalone.
  - Settings and Mode have visible spacing/divider, no overlap.
- Export reliability:
  - Wizard Export tab: SVG/PNG/JPG/WEBP/PDF each download successfully.
  - Wizard “Download All Types” works in one click.
  - “Download PDF” downloads file; “Print Preview” opens print flow separately.
  - Export page buttons still work and match wizard behavior.
- Typography/arcs:
  - English arc shows improved JBJ/LLC/SOC spacing behavior by default.
  - Arabic company and location render as full arcs comparable to English.
  - Separator and location are centered in ring gaps.
- Cross-device:
  - Test at current viewport (1166x729), tablet width, and phone width to ensure no regressions in L-shape behavior.

Technical details
- Primary files to update:
  - `src/components/navigation/HorizontalUtilityBar.tsx`
  - `src/components/navigation/GlobalVerticalNav.tsx`
  - `src/components/MainLayout.tsx` (only if stacking offset adjustment is required)
  - `src/components/stamp-generator/StampProjectWizard.tsx`
  - `src/components/stamp-generator/StampExportPage.tsx`
  - `src/lib/stampOfficialTemplate.ts`
- Root causes addressed:
  - clipping from header container overflow/stacking,
  - fragmented cell styling and tight spacing in utility bar,
  - popup/async export flow in wizard causing blocked/no-op behavior,
  - inconsistent export logic across wizard vs export page,
  - Arabic/English arc sizing heuristic mismatch.
