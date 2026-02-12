

## Connect FilterShortcutBar to Actually Filter Results on All Pages

### Problem
The FilterShortcutBar appears on multiple pages but is not wired up to filter results everywhere:

1. **Properties.tsx** -- Has `shortcutFilters` state but **never calls `applyShortcutFilters()`** on the project list. The bar is purely visual.
2. **AreaStickySearchBar.tsx** -- Has its own isolated `shortcutFilters` state that is **not shared** with `AreaProjectsGrid`, which maintains a separate copy. Changes in the sticky bar do not affect the grid.
3. **ProjectDetailLayout.tsx** -- Has `shortcutFilters` in the sticky nav but does not use them to filter the "Similar Projects" or nearby listings.

### Fix

#### 1. Properties.tsx -- Apply shortcut filters to the sorted project list

- Import `applyShortcutFilters` from `@/utils/applyShortcutFilters`
- After `sortedProjects` is computed (line ~320), add a new `useMemo` that runs `applyShortcutFilters(sortedProjects, shortcutFilters)` to produce `finalProjects`
- Replace all downstream references from `sortedProjects` to `finalProjects` (the grid rendering, count display, pagination)
- This makes every shortcut filter pill (price, bedrooms, status, construction, handover, property type, sort, hide sold out) instantly affect the Properties listing

#### 2. AreaStickySearchBar.tsx + AreaProjectsGrid.tsx -- Share filter state

Currently these are sibling components that each maintain their own `shortcutFilters`. The fix is to **lift the state up**:

- **AreaStickySearchBar**: Accept `filters` and `onFilterChange` as props instead of managing its own `shortcutFilters` state. Remove the internal `useState`.
- **Parent page (AreaDetail.tsx or wherever both are rendered)**: Own the single `shortcutFilters` state, pass it down to both `AreaStickySearchBar` and `AreaProjectsGrid`.
- **AreaProjectsGrid**: Already applies `applyShortcutFilters` correctly (line 172). It just needs to receive the same state instance that `AreaStickySearchBar` controls.

#### 3. ProjectDetailLayout.tsx -- Wire filters to similar/nearby projects

- The shortcut filters in the sticky nav should filter any "Similar Projects" or "Nearby Projects" sections if present
- Apply `applyShortcutFilters` to those project arrays before rendering

### Files to Change

| File | Change |
|------|--------|
| `src/pages/Properties.tsx` | Import `applyShortcutFilters`; add `finalProjects = applyShortcutFilters(sortedProjects, shortcutFilters)`; replace `sortedProjects` with `finalProjects` in rendering |
| `src/components/area-detail/AreaStickySearchBar.tsx` | Accept `filters` + `onFilterChange` props instead of internal state; pass them to `FilterShortcutBar` |
| Parent of AreaStickySearchBar + AreaProjectsGrid (likely `src/pages/AreaDetail.tsx` or similar) | Lift `shortcutFilters` state here; pass to both child components |
| `src/components/project-detail/ProjectDetailLayout.tsx` | Apply `applyShortcutFilters` to any similar/nearby project arrays rendered on the page |

### Result
Every filter change -- clicking a pill, selecting a dropdown option, toggling "Hide Sold Out", changing sort order -- will **instantly** update the visible project results on all pages without requiring any "Search" button click.

