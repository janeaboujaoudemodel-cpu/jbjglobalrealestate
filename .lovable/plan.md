

## Stamp Generator Deep Audit & Fix Plan

### Issues Identified

**1. Chat support button overlaps PageNavigation arrows**
- `CollapsedChatButton`: `fixed bottom-20 right-6` (z-index 10050)
- `PageNavigation`: `fixed bottom-24 right-4` (z-index 9995)
- Both occupy the same bottom-right corner. The chat icon sits directly on top of the navigation arrows.

**2. StampProjectsDashboard — no bulk actions**
- Dashboard only has per-project delete/duplicate. No select-all, bulk delete, or bulk recover.

**3. Wizard layout (`/toolkit/stamp-generator/new`) — loading state shows black background**
- Session replay shows `min-h-screen bg-black` loading container — inconsistent with the pearl/champagne theme.

**4. StampGeneratorPage — center preview area has no persistent "standard stamp" preview**
- The center column only shows concept cards in a grid. There's no fixed center preview showing the live stamp (like the Wizard has). The user sees concepts but not a persistent canonical preview.

**5. StampProjectsDashboard — layout uses `pt-24 sm:pt-28 lg:pt-32`**
- Excessive top padding causes gap under header on toolkit pages that already account for the 52px bar.

### Implementation Plan

**A. Fix chat/arrow overlap** (`PageNavigation.tsx` + `CollapsedChatButton.tsx`)
- Move PageNavigation arrows to `left-4` (opposite side from chat button at `right-6`)
- This permanently separates the two fixed elements. Alternatively, shift arrows to `bottom-36` to stack above chat — but left side is cleaner.

**B. Add bulk actions to StampProjectsDashboard** (`StampProjectsDashboard.tsx`)
- Add a `selectedIds: Set<string>` state
- Add a "Select All" checkbox in the header row
- Add per-card checkboxes
- Add a floating bulk action bar (when selection > 0) with: "Delete Selected", "Duplicate Selected", "Clear Selection"
- Bulk delete: loop `supabase.from('stamp_projects').delete().in('id', [...selectedIds])`

**C. Fix loading screen theme** (`StampProjectWizard.tsx` or wherever the loading state renders)
- Change `bg-black` to `bg-gradient-to-br from-[hsl(var(--pearl-1))] via-white to-[hsl(var(--pearl-2))]`

**D. Add persistent center preview to StampGeneratorPage** (`StampGeneratorPage.tsx`)
- In the center column (between left panel and concepts grid), add a sticky/fixed preview area showing the selected concept's stamp at larger size (like the Wizard's `LiveStampPreview`)
- When a concept is selected, render `StampSVGRenderer` at ~280px centered
- When no concept selected, show a placeholder "Select a concept to preview"
- This ensures the "standard stamp" is always visible and consistent with what the user configured

**E. Fix dashboard padding** (`StampProjectsDashboard.tsx`)
- Change `pt-24 sm:pt-28 lg:pt-32` to `pt-4` since the layout already handles the 52px top bar offset

**F. Ensure Wizard/Generator stamp consistency**
- The Wizard uses `LiveStampPreview` (official template) while the Generator shows AI-generated concepts via `StampSVGRenderer`
- Add a "Standard Preview" toggle/section in the Generator's center area that renders `LiveStampPreview` with the project's current settings, so users always see what the "standard" stamp looks like alongside AI concepts

### Files to modify
1. `src/components/PageNavigation.tsx` — move arrows to left side to avoid chat overlap
2. `src/components/chat/CollapsedChatButton.tsx` — no change needed (stays right-6)
3. `src/components/stamp-generator/StampProjectsDashboard.tsx` — bulk select/delete actions, fix padding
4. `src/components/stamp-generator/StampGeneratorPage.tsx` — add persistent center preview with LiveStampPreview
5. `src/components/stamp-generator/StampProjectWizard.tsx` — fix loading bg color if applicable

