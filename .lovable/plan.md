
Goal: one recovery patch to make stamp preset/draft saving discoverable and reliable, fix export/download flows (including print separation), and enforce navigation/floating behavior exactly as requested.

1) Navigation rule lock (all frontend)
- Enforce L-shape shell (vertical sidebar + utility bar) on all non-phone screens.
- Set phone-only mode to standard phone sizes: `<768px`.
- Keep mobile header/hamburger only on phones; keep horizontal shortcuts swipeable on phone.
- Remove any remaining hybrid/legacy header behavior on tablet/desktop refresh.

Implementation targets:
- `src/components/MainLayout.tsx`
- `src/components/navigation/GlobalVerticalNav.tsx`
- `src/components/navigation/HorizontalUtilityBar.tsx`
- `src/components/GlobalHeader.tsx`

2) Presets + drafts: visible, recoverable, immediate
- Add a dedicated “Library” surface with two sections:
  - Custom Presets
  - Drafts
- Place it where users look now:
  - Generator right panel: new tab next to History
  - Wizard tabs: add “Library” next to Logo/Export
- Fix “saved but not visible” root issue by lifting preset state (no stale local-only init).
- Keep “Save Current as Custom Preset” but make saved item appear instantly in Library.
- Add draft list with explicit actions: Restore, Rename, Delete, Continue editing.

Implementation targets:
- `src/components/stamp-generator/StampRightPanel.tsx`
- `src/components/stamp-generator/StampProjectWizard.tsx`
- `src/components/stamp-generator/StampPresetLibrary.tsx`
- `src/components/stamp-generator/StampGeneratorPage.tsx`
- `src/components/toolkit/SaveProjectBar.tsx` (pattern reuse)

3) Draft architecture standardization
- Replace ad-hoc keys with standardized draft storage:
  - snapshot keys: `jbj_draft_stamp-generator_{timestamp}`
  - optional working pointer per project/session
- Persist full draft payload (form/style/selected concept/preset references), not only metadata.
- Rehydrate from Library “Drafts” list in both wizard and generator.
- Keep existing project save path, but align “draft save” and “project save” so both are findable.

4) Export reliability fix (download button actually works)
- Root-cause fix: before navigating to export, ensure selected design has a DB id.
- Add a single `ensurePersistedDesignForExport()` used by:
  - header Export button
  - right panel Export button
  - canvas quick export
- If local UUID exists, insert first, update `selected_design_id`, then navigate with real id.

Implementation targets:
- `src/components/stamp-generator/StampGeneratorPage.tsx`
- `src/components/stamp-generator/StampProjectHeader.tsx`
- `src/components/stamp-generator/StampRightPanel.tsx`

5) Export UX/spec alignment
- Add explicit export options and one-click full kit.
- “Download PDF” must download file, not trigger print.
- Add separate “Print” action.
- Enforce requested backgrounds:
  - SVG: transparent/vector
  - PNG: always generate BOTH transparent + white-background versions
  - PDF: white background only
- Add “User Preset” artifact into export kit (e.g., `user_preset.json` with active preset/config used for this export).
- Clarify sizes and remove confusing labels.

Implementation targets:
- `src/components/stamp-generator/StampExportPage.tsx`
- `src/components/stamp-generator/StampProjectWizard.tsx` (quick export tab behavior)

6) Floating collision fixes (recommended popup / chat / nav)
- Recommendation popup must always appear above nav arrows + support bubble until dismissed.
- Raise popup stack level and reserve safe bottom offset.
- Rework floating offsets on medium widths so chat and nav never touch/overlap.
- Keep drag behavior and viewport clamping.

Implementation targets:
- `src/components/PropertyRecommendationPopup.tsx`
- `src/components/PageNavigation.tsx`
- `src/components/chat/CollapsedChatButton.tsx`
- `src/components/AIChatWidget.tsx` (if shared offset constants needed)

7) Validation gates before release
- Navigation: verify at 1166, 1024, 834, 768, and phone width (<768) after hard refresh.
- Presets/drafts:
  - save preset → appears immediately in Library
  - save draft → visible in Drafts list and restorable
- Export:
  - from generator header/right panel always opens working export page
  - full kit contains SVG + PNG transparent + PNG white + PDF white + user preset file
  - separate Print action works independently
- Floating UI:
  - recommendation popup always above nav/chat
  - chat/nav no overlap on medium/tablet.

Technical details (implementation notes)
- Keep existing stamp table RLS pattern (`auth.uid() = user_id`) and reuse for any new stamp library persistence if added.
- Do not edit generated integration files.
- If backend schema extension is needed for durable preset/draft sync across devices, add `stamp_user_presets` and optional `stamp_user_drafts` with strict user-bound RLS and no privileged client-side role checks.
- Use one source of truth for breakpoints:
  - phone: `<768`
  - non-phone: `>=768` uses L-frame shell consistently.
