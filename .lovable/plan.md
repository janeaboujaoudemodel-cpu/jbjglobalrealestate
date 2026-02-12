

## Connect Filter Shortcuts to Listings and Replace Header on Scroll

### Problem
1. **Two headers stacking**: When the filter bar becomes fixed on scroll, the main GlobalHeader remains visible, resulting in two headers stacked on top of each other. The user wants only the filter bar to show when scrolled.
2. **Shortcut filters disconnected**: The `shortcutFilters` state (hideSoldOut, sortBy, constructionStatuses, propertyCategory, propertyTypes, bedrooms, statuses) is never applied to the actual project listing. Clicking "Hide Sold Out" or any other shortcut does nothing to the displayed projects.

### Root Cause Analysis

**Header issue**: The fixed filter bar uses `top-24 sm:top-28 lg:top-32` to position below the GlobalHeader. Both are visible simultaneously.

**Filter disconnect**: In `DeveloperDetail.tsx`, filtering uses `useFilteredProjects(projects, filters)` where `filters` is of type `FilterState` -- a completely separate state from `shortcutFilters` (`ShortcutFilterState`). The shortcut filter values are stored but never read by any filtering logic. Same issue in `AreaProjectsGrid.tsx`.

### Solution

#### Part 1: Hide GlobalHeader when filter bar is fixed

Add a global signal (CSS class on `<body>`) that the filter bar sets when it becomes fixed. GlobalHeader will read this and hide itself with a smooth transition.

**Files:**
- `src/components/area-detail/AreaProjectsGrid.tsx` -- add/remove `filter-bar-fixed` class on body when `isFixed && !bottomReached`
- `src/pages/DeveloperDetail.tsx` -- same body class logic when `isFilterFixed && !bottomReached`
- `src/components/GlobalHeader.tsx` -- listen for `filter-bar-fixed` class on body via MutationObserver or scroll event, and hide header with `translate-y` transition
- Fixed filter bar position changes from `top-24` to `top-0` since the header will be hidden

#### Part 2: Connect shortcutFilters to project filtering

Merge relevant shortcutFilters values into the filtering pipeline:

**In `AreaProjectsGrid.tsx`** -- apply shortcutFilters in the existing `filteredProjects` useMemo:
- `hideSoldOut`: skip projects where `sale_status`/`status_label` contains "sold" or "out of stock", or `is_sold_out === true`
- `sortBy`: apply sorting (newest, price_asc, price_desc, alpha)
- `constructionStatuses`: filter by `construction_status` field
- `statuses`: filter by `status_label` / `sale_status`
- `propertyTypes` + `propertyCategory`: filter by `property_type_label`
- `bedrooms`: filter by `bedrooms_min` / `bedrooms_max`
- `priceMin` / `priceMax`: filter by `price_from`

**In `DeveloperDetail.tsx`** -- sync shortcutFilters into the existing `FilterState` so `useFilteredProjects` picks them up:
- Use a `useEffect` to map shortcutFilters values into `filters` state
- Or apply shortcutFilters as a post-filter on top of `filteredProjects`

The simpler approach is a post-filter: take the output of `useFilteredProjects` and apply shortcut filters on top, so both filter systems work together without complex state syncing.

### Technical Details

**Body class approach for header hiding:**
```tsx
// In AreaProjectsGrid / DeveloperDetail (inside useEffect):
useEffect(() => {
  if (isFixed && !bottomReached) {
    document.body.classList.add('filter-bar-fixed');
  } else {
    document.body.classList.remove('filter-bar-fixed');
  }
  return () => document.body.classList.remove('filter-bar-fixed');
}, [isFixed, bottomReached]);
```

```tsx
// In GlobalHeader:
const [filterBarActive, setFilterBarActive] = useState(false);
useEffect(() => {
  const observer = new MutationObserver(() => {
    setFilterBarActive(document.body.classList.contains('filter-bar-fixed'));
  });
  observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
  return () => observer.disconnect();
}, []);

// Apply hide class:
<header className={cn("...", filterBarActive && "-translate-y-full opacity-0 pointer-events-none")} />
```

**Post-filter approach for shortcut filters:**
```tsx
// Shared utility function
function applyShortcutFilters(projects: Project[], sf: ShortcutFilterState): Project[] {
  let result = [...projects];
  
  if (sf.hideSoldOut) {
    result = result.filter(p => {
      const label = (p.status_label || '').toLowerCase();
      return !label.includes('sold') && !label.includes('out of stock') && !p.is_sold_out;
    });
  }
  
  if (sf.constructionStatuses.length > 0) {
    result = result.filter(p => sf.constructionStatuses.includes(p.construction_status || ''));
  }
  
  if (sf.statuses.length > 0) {
    result = result.filter(p => sf.statuses.includes(p.status_label || p.sale_status || ''));
  }
  
  if (sf.propertyTypes.length > 0) {
    result = result.filter(p => {
      const type = (p.property_type_label || '').toLowerCase();
      return sf.propertyTypes.some(t => type.includes(t));
    });
  }
  
  if (sf.bedrooms.length > 0) {
    result = result.filter(p => {
      return sf.bedrooms.some(b => {
        if (b === 'studio') return (p.bedrooms_min ?? 0) === 0;
        const num = parseInt(b);
        return num >= (p.bedrooms_min ?? 0) && num <= (p.bedrooms_max ?? 99);
      });
    });
  }
  
  // Sorting
  if (sf.sortBy === 'newest') result.sort((a, b) => /* created_at desc */);
  if (sf.sortBy === 'price_asc') result.sort((a, b) => (a.price_from || 0) - (b.price_from || 0));
  if (sf.sortBy === 'price_desc') result.sort((a, b) => (b.price_from || 0) - (a.price_from || 0));
  if (sf.sortBy === 'alpha') result.sort((a, b) => a.name.localeCompare(b.name));
  
  return result;
}
```

### Files Summary

| File | Action |
|------|--------|
| `src/utils/applyShortcutFilters.ts` | New utility function to apply ShortcutFilterState to any project array |
| `src/components/area-detail/AreaProjectsGrid.tsx` | Add body class on fix; apply shortcut filters to `filteredProjects` |
| `src/pages/DeveloperDetail.tsx` | Add body class on fix; apply shortcut filters to `filteredProjects` |
| `src/components/GlobalHeader.tsx` | Hide header when `filter-bar-fixed` class is on body |

