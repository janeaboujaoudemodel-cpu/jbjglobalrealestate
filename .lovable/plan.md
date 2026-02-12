

## Revamp Utility Buttons and Add Sorting/Status Shortcuts

### Problem
1. The sqft/sqm toggle in the utility row is redundant (already available elsewhere on the page)
2. The "Saved" button navigates to a saved properties page instead of opening saved filters
3. No quick sorting shortcuts (Newest, Price sorting, A-Z)
4. No "Hide Sold Out" toggle
5. No construction status quick filter (Completed, Under Construction, Presale)

### Changes

**File: `src/components/filters/FilterShortcutBar.tsx`**

#### 1. UtilityButtons -- Remove sqft/sqm, rename mode toggle
- Remove the `Ruler` / sqft/sqm toggle button (lines 484-487)
- Keep: Map, Saved, Currency, Mode
- Rename the mode toggle label from showing the mode name to always show "Mode" as the label prefix for clarity (e.g., "Mode: Investor")
- The "Saved" button will open a popover listing saved filters from localStorage (`jbj-saved-filters`) instead of navigating to `/properties?saved=true`. Each saved filter will be clickable to apply, with a delete option

#### 2. Add sorting shortcut pills to Row 2
Add these as toggle pills after the existing Status filter and before Reset All:
- **Newest** -- sort by newest first
- **Low to High** -- price ascending
- **High to Low** -- price descending
- **A to Z** -- alphabetical sort

Only one sort can be active at a time (radio-style selection).

#### 3. Add "Hide Sold Out" toggle pill
A toggle pill that, when active, filters out projects with sale status "Sold Out" / "Out of Stock". This will be a simple boolean in the filter state.

#### 4. Add Construction Status filter pill
A new popover pill labeled "Construction" with toggle options:
- Completed
- Under Construction
- Presale

Multi-select, same pattern as the existing Status (sale status) pill.

#### 5. Update ShortcutFilterState interface
Add new fields:
- `sortBy: 'newest' | 'price_asc' | 'price_desc' | 'alpha' | null` (default: `null`)
- `hideSoldOut: boolean` (default: `false`)
- `constructionStatuses: string[]` (default: `[]`)

Update `defaultShortcutFilters` and `hasActiveFilters` accordingly.

### Updated Row Layout

```
Row 1 (right):  Map | Saved (opens filter list) | AED | Mode: Investor
Row 2 (left):   Price | Payments | Handover | Apartment | Bedrooms | Status | Construction | Newest | Low-High | High-Low | A-Z | Hide Sold Out | Reset All | Save
```

### Technical Details

**Saved Filters Popover** (replaces navigation):
- The "Saved" button in Row 1 becomes a Popover trigger
- Content lists all filters from `localStorage('jbj-saved-filters')`
- Each item shows filter name + date, clickable to apply those filters via `onFilterChange`
- A trash icon per item to delete
- Empty state: "No saved filters yet"

**Sort pills** behave as radio buttons -- clicking the active one deselects it (returns to default sort). These are styled as smaller pills in the filter row.

**Construction Status** uses the constants from `src/constants/constructionStatus.ts` (Completed, Under Construction, Presale).

### Files Summary

| File | Action |
|------|--------|
| `src/components/filters/FilterShortcutBar.tsx` | Update UtilityButtons (remove sqft, add saved popover, rename mode); add sort pills, hide sold out toggle, construction status filter; extend ShortcutFilterState |

