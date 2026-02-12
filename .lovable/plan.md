

## Phase 1: Filter Bar Consolidation + Area Detail Gap Fix

This plan addresses the identified gaps and restructures the filter bar layout into a more compact, single-purpose design.

---

### 1. Add FilterShortcutBar to Area Detail Page

The Area detail page (`src/pages/AreaDetail.tsx`) is the only major page missing the unified filter bar. It will be added with the same sticky/fixed pattern used on Properties and Developer pages.

**File:** `src/pages/AreaDetail.tsx`
- Import `FilterShortcutBar`, `ShortcutFilterState`, `defaultShortcutFilters`
- Add filter state management with `useState`
- Add `IntersectionObserver` sentinel + `isFilterFixed` logic (same pattern as PropertiesReelly)
- Add `filter-bar-fixed` body class sync for GlobalHeader hide
- Insert the FilterShortcutBar between the Hero and About sections
- Apply filters to the projects grid via `applyShortcutFilters`

---

### 2. Restructure FilterShortcutBar Layout (Compact Two-Row to Single-Row Priority)

**Current layout (2 rows):**
- Row 1: Search + Map + Saved + Currency + Mode | Sort pills (center)
- Row 2: Price, Payments, Handover, Property Type, Bedrooms, Status, Construction, Advanced, Save, Hide Sold

**New layout (2 rows, consolidated):**
- Row 1 (Controls): Compact search input (smaller width) | Developer dropdown | All Emirates | Map | Saved | Currency dropdown (replaces AED label) | Mode | Filter (Advanced)
- Row 2 (Filters + Sort): Price | Payments | Handover | Property Type | Bedrooms | Status | Construction | Hide Sold | Newest | Low-High | High-Low | A-Z

**Specific changes in `src/components/filters/FilterShortcutBar.tsx`:**
- Make search input slot narrower (w-36 instead of w-48/64)
- Move Map and Saved buttons into Row 1 (they are already there, just ensure consistent placement)
- Replace the separate `CurrencySwitcher` icon-only button with a currency pill that shows current code (e.g., "AED") and opens the currency dropdown on click -- this replaces both the old AED label and the dollar icon
- Move Mode dropdown next to the Advanced/Filter button in Row 1
- In Row 2, merge sort pills (Newest, Low-High, High-Low, A-Z) inline with the filter popovers instead of centering them separately
- Remove the separate Save pill from Row 2 (it is already in Row 1 as "Saved")

---

### 3. Vertical Nav Shows Main Navigation When Filter Bar Replaces Header

This is already implemented via `PropertiesVerticalNav` appearing when `isFilterFixed` is true. The same pattern will be applied to the Area Detail page as part of change 1.

**File:** `src/pages/AreaDetail.tsx`
- Import and render `PropertiesVerticalNav` when `isFilterFixed` is true (desktop only)
- Offset content by 200px (same as PropertiesReelly)

---

### Summary of File Changes

| File | Change |
|------|--------|
| `src/pages/AreaDetail.tsx` | Add FilterShortcutBar with sticky/fixed behavior, vertical nav, filter state |
| `src/components/filters/FilterShortcutBar.tsx` | Consolidate layout: compact search, merge sort into Row 2, currency pill replaces dollar icon, move Mode next to Filter |

### Technical Details

- The `applyShortcutFilters` utility will be applied to the area's projects grid, filtering `AreaProjectsGrid` results client-side
- The `AreaProjectsGrid` component will need to accept an optional `filters` prop or the filtering will happen at the page level
- The IntersectionObserver pattern is identical to PropertiesReelly (lines 100-120) for consistency
- Currency pill will reuse the existing `CurrencySwitcher` dropdown logic but with a pill-styled trigger showing the currency code instead of a dollar icon

