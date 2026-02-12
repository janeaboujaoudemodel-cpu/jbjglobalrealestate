

## Fix Filters and Currency Across All Pages

### Problems Identified

1. **Currency selector has no effect on project cards**: The `ProjectFilters` component has a currency dropdown, but no page passes `filters.currency` or `filters.sizeUnit` to `<ProjectCard>`. The cards always display prices in AED regardless of selection.

2. **Same issue on every page using ProjectCard**: `DeveloperDetail`, `CommunityDetail`, `Favorites`, and `QuizResults` all render `<ProjectCard project={project} />` without `currency` or `sizeUnit` props.

3. **FilterShortcutBar search query not connected on DeveloperDetail**: The `FilterShortcutBar` has a `searchQuery` field in its state but the `applyShortcutFilters` utility applies it generically. Meanwhile `ProjectFilters` also has its own `search` field. Both exist but may not be consistently wired.

### Solution

**Pass `currency` and `sizeUnit` from filter state to every `ProjectCard` instance across all affected pages.**

### Files to Modify

| File | Change |
|------|--------|
| `src/pages/DeveloperDetail.tsx` | Pass `currency={filters.currency}` and `sizeUnit={filters.sizeUnit}` to every `<ProjectCard>` |
| `src/pages/CommunityDetail.tsx` | Add filter state for currency/sizeUnit, pass to `<ProjectCard>` |
| `src/pages/Favorites.tsx` | Add currency/sizeUnit state, pass to `<ProjectCard>` |
| `src/pages/QuizResults.tsx` | Add currency/sizeUnit state, pass to `<ProjectCard>` |

### Technical Details

**DeveloperDetail.tsx (line 404)**:
Change from:
```tsx
<ProjectCard key={project.id} project={project} />
```
To:
```tsx
<ProjectCard key={project.id} project={project} currency={filters.currency} sizeUnit={filters.sizeUnit} />
```

This ensures that when the user selects USD, EUR, or GBP in the currency dropdown within `ProjectFilters`, every project card on that page immediately re-renders with converted prices.

**CommunityDetail.tsx, Favorites.tsx, QuizResults.tsx**: These pages either need to add a currency selector or inherit a default. For pages without `ProjectFilters` (like Favorites), a simple currency/sizeUnit toggle will be added at the top, and the selected values passed to each `ProjectCard`.

### What This Fixes
- Selecting "USD" in the currency dropdown on the Developer Detail page will convert all card prices to USD
- Selecting "sq m" will convert size displays accordingly
- Search, tier, and developer dropdown filters on the Developers listing page already work correctly (verified in code)
- The FilterShortcutBar sort/filter pills on DeveloperDetail already apply through `applyShortcutFilters` correctly

