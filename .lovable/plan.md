

# Search Filter UI Fixes — 5 Tasks

## Task 1: Fix Filter Overlay on Sidebar

**Problem**: The fixed filter bar on PropertiesReelly.tsx uses `top-[40px]` instead of `top-[48px]` (the utility bar height), and Developers.tsx uses `top-[48px]` with correct sidebar offsets. PropertiesReelly.tsx has the sidebar offset pattern but with the wrong top value.

**Fix**:
- `src/pages/PropertiesReelly.tsx` line 273: Change `top-[40px]` → `top-[48px]` to align below the 48px utility bar consistently.

Both pages already have `[body.jj-vertical-nav-active_&]:lg:left-[200px]` and `[body.jj-vertical-nav-collapsed_&]:lg:left-[48px]` for sidebar offset, so the left-side overlay issue should be resolved with the top fix. If `left-0` is still being used without the body class conditions on any other filter portals, those will be updated too.

## Task 2: Always Show Horizontal Header

**Problem**: The horizontal utility bar (`HorizontalUtilityBar.tsx`) is already `fixed top-0` with `z-[9998]`, so it should always be visible. The issue is the filter bar at `top-[40px]` (wrong) could overlap it.

**Fix**: Correcting Task 1's `top-[48px]` ensures the header is never covered. No changes needed to the utility bar itself.

## Task 3: Restructure Filter Rows — Add "All Tiers" + Developer Count to Row 2

**Problem**: User wants navigation arrows removed from the second row and replaced with "All Tiers" and "Developer Count" inline.

**Fix** in `src/components/filters/FilterShortcutBar.tsx`:
- Remove the `scrollRow` function and `row1CanScroll`/`row2CanScroll` state and the scroll indicator arrow buttons (the gold `ChevronRightIcon` scroll hints).
- The `priorityFilter` prop already exists. When `priorityFilter === 'developers'`, render an "All Tiers" pill and a developer count badge at the start of Row 2 (before Price, Payments, etc.).
- Accept new optional props: `tierFilter`, `onTierFilterChange`, `resultCount`, and `tierOptions` to wire this from the Developers page.

Update `src/pages/Developers.tsx`:
- Pass `tierFilter`, `onTierFilterChange`, `resultCount` to `FilterShortcutBar` and remove the separate tier filter row below the bar (lines 303-341 and 371-405).

## Task 4: Remove Gold Scroller

**Problem**: The scroll indicator arrows (gold chevrons that appear when rows overflow) take up space.

**Fix** in `src/components/filters/FilterShortcutBar.tsx`:
- Remove `row1Ref`, `row2Ref`, `row1CanScroll`, `row2CanScroll`, `scrollRow`, and the `useEffect` that tracks scroll state (lines 265-297).
- Remove any gold scroll hint overlays/buttons from both rows. The rows will still be horizontally scrollable via touch/mouse but without visible arrow indicators.

## Task 5: Fix Search Bar Cropping

**Problem**: `GlobalSearchModal.tsx` modal container uses `px-4 sm:px-6` padding with `top-[60px] sm:top-[72px]`, but on desktop with the sidebar, the modal is centered on the full viewport rather than the content area, causing visual cropping.

**Fix** in `src/components/GlobalSearchModal.tsx` line 423:
- Add sidebar-aware left offset: add `[body.jj-vertical-nav-active_&]:lg:left-[calc(50%+100px)] [body.jj-vertical-nav-collapsed_&]:lg:left-[calc(50%+24px)]` to shift the modal center rightward to account for the sidebar.
- Increase horizontal padding to `px-6 sm:px-8` to prevent edge cropping.
- Ensure `top-[60px]` becomes `top-[56px]` to sit just below the 48px utility bar with minimal gap.

## Files Changed

| File | Changes |
|------|---------|
| `src/pages/PropertiesReelly.tsx` | Fix `top-[40px]` → `top-[48px]` |
| `src/components/filters/FilterShortcutBar.tsx` | Remove scroll indicators/arrows, add optional tier filter + result count props for developer context |
| `src/pages/Developers.tsx` | Pass tier props to FilterShortcutBar, remove duplicate tier row |
| `src/components/GlobalSearchModal.tsx` | Fix modal centering with sidebar offset and padding |

