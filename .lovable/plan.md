

## Plan: Merge Horizontal Header to 2 Rows (Utility + Filter)

### Current State (3 rows)
```text
┌──────────────────────────────────────────┐
│ Row 1: HorizontalUtilityBar (48px)       │ ← Back, Search, Buy/Rent/Sell, Favorites, ft²/m², Lang, Currency, Filter, CRM, Tasks, etc.
├──────────────────────────────────────────┤
│ Row 2: FilterShortcutBar Row 1           │ ← Search input, Sort pills, Map, Saved Filters
├──────────────────────────────────────────┤
│ Row 3: FilterShortcutBar Row 2           │ ← Price, Bedrooms, Type, Status, Construction, Hide Sold, etc.
└──────────────────────────────────────────┘
```

### Target (2 rows)
```text
┌──────────────────────────────────────────┐
│ Row 1: HorizontalUtilityBar (48px)       │ ← Same as now (aligned with sidebar header)
├──────────────────────────────────────────┤
│ Row 2: Single merged filter row          │ ← All filter controls on ONE line
└──────────────────────────────────────────┘
```

### Changes

**1. `FilterShortcutBar.tsx` — Merge 2 internal rows into 1**
- Collapse the current Row 1 (search, sort pills, map, saved) and Row 2 (filter popovers) into a single scrollable row
- Order: Search input → Filter popovers (Price, Bedrooms, Type, Status, Construction, Size, Views, Hide Sold) → Sort pills → Map → Saved Filters → Reset → Results badge
- Remove the `flex-col gap-2` wrapper and use a single `flex items-center` row
- Keep all filter popovers as compact pills on one line with horizontal scroll

**2. `GlobalFilterBar.tsx` — Match champagne color exactly**
- Update gradient to match the sidebar header: `from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8]` (same as utility bar)
- Reduce vertical padding from `py-1.5` to `py-1` for a tighter fit
- Keep `top-[48px]` positioning

**3. `MainLayout.tsx` — Adjust spacing**
- Update main content padding from `md:pt-[100px]` to `md:pt-[88px]` since the filter bar is now a single compact row (~40px instead of ~52px with two rows)

### Files to edit
- `src/components/filters/FilterShortcutBar.tsx` — merge 2 rows into 1
- `src/components/navigation/GlobalFilterBar.tsx` — match champagne gradient
- `src/components/MainLayout.tsx` — adjust top padding

