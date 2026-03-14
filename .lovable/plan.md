

## Plan: Search Filter UI Fixes — 5 Tasks

### Current State

- **FilterShortcutBar** (953 lines): 2-row filter toolbar used across Properties, Developers, Areas, PropertyMap pages. Row 2 has a `PremiumHorizontalScrollHint` component (gold scroller with arrows + draggable rail).
- **HorizontalUtilityBar** (376 lines): Fixed 48px bar at top, already sidebar-aware with `[body.jj-vertical-nav-active_&]:left-[200px]` and `[body.jj-vertical-nav-collapsed_&]:left-[48px]`.
- **Fixed filter bars** on several pages use `left-0` or hardcoded `left: "200px"` — inconsistent sidebar awareness.
- **GlobalSearchModal**: Uses `fixed left-1/2 -translate-x-1/2` centered overlay with `top-4` — may crop on small screens.

### Changes

#### Task 1: Fix Filter Overlay on Sidebar

Multiple pages render the fixed filter bar with `left-0` which overlaps the sidebar:

| File | Current | Fix |
|------|---------|-----|
| `Developers.tsx` line 355 | `fixed top-0 left-0 right-0` | Add sidebar-aware classes: `lg:left-[200px] [body.jj-vertical-nav-collapsed_&]:lg:left-[48px]` |
| `AreaGuides.tsx` line 286-289 | Fixed with `left: "200px"` hardcoded (no collapsed awareness) | Replace inline style with CSS classes matching HorizontalUtilityBar pattern |
| `PropertyMap.tsx` line 179 | Already has `lg:left-[200px]` but no collapsed state | Add `[body.jj-vertical-nav-collapsed_&]:lg:left-[48px]` |
| `PropertiesReelly.tsx` line 273-274 | Already correct with both classes | No change needed |
| `Properties.tsx` line 1140 | Already correct | No change needed |

Also add `top-[48px]` where missing to sit below the utility bar (Developers, AreaGuides currently use `top-0`).

#### Task 2: Always Show Horizontal Header

The HorizontalUtilityBar has `hidden lg:flex` (line 112) — hidden on mobile/tablet. Change to `flex` so it's always visible. Reduce padding on smaller screens to fit.

#### Task 3: Restructure Filter Rows — Move Arrows to Row 2, Add Tier/Count to Row 1

In `FilterShortcutBar.tsx`:
- The `PremiumHorizontalScrollHint` (arrows + gold rail) currently renders below Row 2. Move it inline within Row 2 (before the filter pills).
- Add two new elements to Row 1 (the connected toolbar bar): an "All Tiers" dropdown and a developer count badge. These will only render when `priorityFilter === 'developers'`.
- Remove the separate tier filter row from `Developers.tsx` (lines 303-340 and 371-405) since it will now live inside FilterShortcutBar.

#### Task 4: Remove Gold Scroller

Delete the `PremiumHorizontalScrollHint` component usage from `FilterShortcutBar.tsx` (line 725). The arrows from Task 3 are also removed — the row will rely on native horizontal scroll. Remove the import.

Also remove from `ProjectDetailLayout.tsx` (line 726) if used there.

Keep the `PremiumHorizontalScrollHint.tsx` file itself (may be used elsewhere).

#### Task 5: Fix Search Bar Cropping

In `GlobalSearchModal.tsx` line 423: the modal uses `top-4 sm:top-12 md:top-16` and `px-4`. On mobile with the utility bar always visible (Task 2), add `top-[60px]` to account for the 48px bar + spacing. Also add `sm:top-[72px]` for breathing room. Increase `px-4` to `px-4 sm:px-6` for side padding.

### Files Summary

| File | Change |
|------|--------|
| `src/pages/Developers.tsx` | Fix fixed filter `left` classes + `top-[48px]`, move tier filter into FilterShortcutBar props |
| `src/pages/AreaGuides.tsx` | Fix fixed filter sidebar-aware classes + `top-[48px]` |
| `src/pages/PropertyMap.tsx` | Add collapsed sidebar class |
| `src/components/navigation/HorizontalUtilityBar.tsx` | Remove `hidden lg:flex` → `flex`, responsive adjustments |
| `src/components/filters/FilterShortcutBar.tsx` | Remove PremiumHorizontalScrollHint, add optional tier dropdown + count badge in Row 1 when `priorityFilter === 'developers'` |
| `src/components/GlobalSearchModal.tsx` | Fix top offset and padding for non-cropped display |
| `src/components/project-detail/ProjectDetailLayout.tsx` | Remove PremiumHorizontalScrollHint usage |

### Implementation Order

1. Fix sidebar overlay on all fixed filter bars (Task 1)
2. Make HorizontalUtilityBar always visible (Task 2)
3. Remove gold scroller from FilterShortcutBar and ProjectDetailLayout (Task 4)
4. Add tier/count to FilterShortcutBar Row 1 for developers context (Task 3)
5. Fix GlobalSearchModal padding/positioning (Task 5)

