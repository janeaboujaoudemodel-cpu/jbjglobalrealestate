
Goal: fix two blockers in one pass: (1) force consistent L-shape navigation on desktop across the full frontend, and (2) make center-logo click immediately enable monogram color editing (including blue) with instant visual update.

Locked decisions from your answers:
- Navigation: L-frame on all desktop pages (1024px+), not only studio routes.
- Center click behavior: auto-switch to Monogram edit.

What is broken now (root causes found):
1) In `MainLayout.tsx`, non-studio pages still use `xl` (1280) for sidebar/utility bar, so at 1166px they still show old header.
2) In `GlobalVerticalNav.tsx`, homepage has delayed nav reveal logic (3s/scroll), causing inconsistent shell behavior.
3) Monogram color in generator flow is not truly live:
   - `StampGeneratorPage.tsx` stores monogram color state but doesn’t auto-apply to active SVG on each change.
   - `applyMonogramColors` is regex-based and fails on SVGs already using `<tspan>`.
   - center click path does not force Monogram mode + open Monogram controls.
4) Save/load path does not fully persist/rehydrate monogram edit state in a deterministic way.

Implementation plan:

1) Unify desktop shell breakpoints (site-wide)
- File: `src/components/MainLayout.tsx`
- Remove split behavior (`isToolkitGeneratorRoute ? lg : xl`) for shell visibility and paddings.
- Use one desktop threshold (`lg`) for:
  - hiding old `GlobalHeader`
  - showing `GlobalVerticalNav` + `HorizontalUtilityBar`
  - body left offsets and top offsets.
- Keep mobile behavior below 1024 intact.

2) Remove delayed vertical-nav reveal on homepage
- File: `src/components/navigation/GlobalVerticalNav.tsx`
- Disable timed/scroll gated reveal for desktop routes; sidebar should be present immediately.
- Keep collapse/expand behavior and persisted collapsed state.

3) Center click => auto Monogram edit
- Files: `StampProjectWizard.tsx`, `StampGeneratorPage.tsx`, `StampInteractivePreview.tsx`, `StampLeftPanel.tsx`
- On center element selection/click:
  - auto-switch center mode to `MONOGRAM`
  - if monogram text empty, derive initials from company name
  - auto-open/focus Center Content section so color controls are visible immediately.

4) Make monogram color changes live and reliable
- Files: `MonogramColorEditor.tsx`, `StampGeneratorPage.tsx`
- Replace regex mutation path with DOMParser/XMLSerializer-based updater that:
  - handles existing `<tspan>` monograms
  - updates per-letter fills + divider line color robustly
  - works repeatedly without corrupting SVG.
- Apply color edits immediately to active standard preview (no extra “Apply” required for current design).
- Keep “Apply to Stamps” as bulk action for all variations.

5) Persist and rehydrate monogram edit state
- File: `StampGeneratorPage.tsx`
- Save `localIconStyle`, `localMonogramText`, `monogramLetterColors` inside project `layout_json` during Save.
- Rehydrate these values on load so refresh/crash keeps monogram mode and colors.

6) Validation proof checklist (after implementation)
- Navigation screenshots at 1166px and 1024px on:
  - `/`
  - `/toolkit/stamp-generator/new`
  showing left sidebar + gold utility bar, no old restricted header.
- Monogram interaction screenshots:
  - click center/logo area -> auto Monogram mode
  - change monogram to blue -> preview updates instantly
  - save, refresh, reopen -> blue monogram persists.
- Quick mobile sanity screenshot (<1024) to confirm mobile header still works.

Files to modify:
- `src/components/MainLayout.tsx`
- `src/components/navigation/GlobalVerticalNav.tsx`
- `src/components/stamp-generator/StampProjectWizard.tsx`
- `src/components/stamp-generator/StampGeneratorPage.tsx`
- `src/components/stamp-generator/StampInteractivePreview.tsx`
- `src/components/stamp-generator/StampLeftPanel.tsx`
- `src/components/stamp-generator/MonogramColorEditor.tsx`
