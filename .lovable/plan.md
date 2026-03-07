

# Plan: Add Resale Statuses, Fix Handover Quarter UI, Add Views Filter

## 3 Changes Required

### 1. Add "Resale Off-Plan" and "Ready Resale" to Construction Status

**Files to modify:**
- `src/constants/constructionStatus.ts` — Add two new options: `"Resale Off-Plan"` and `"Ready Resale"` to `CONSTRUCTION_STATUS_OPTIONS`, `CONSTRUCTION_STATUS_LABELS`, `normalizeConstructionStatus`, and `getConstructionStatusColor`
- `src/components/filters/FilterShortcutBar.tsx` — Add to `CONSTRUCTION_OPTIONS` array (line 122-126)
- `src/components/filters/AdvancedFilterPanel.tsx` — Add to `CONSTRUCTION_OPTIONS` array (line 36-40)
- `src/constants/filterConfig.ts` — Add to `DEVELOPMENT_STATUS_OPTIONS` if used elsewhere

### 2. Fix Handover Quarter Selects — Styling & Multi-Select

The native `<select>` elements for quarters (Q1-Q4) render with browser-default styling causing corrupt/unreadable text. Replace with custom popover-based multi-select chips.

**Changes:**
- **Replace `<select>` with custom quarter picker** in both `FilterShortcutBar.tsx` (lines 500-506, 520-526) and `AdvancedFilterPanel.tsx` (lines 578-604)
- Use styled button chips (Q1, Q2, Q3, Q4) with **gold/champagne active color** instead of blue hover
- Allow **multi-select** — user can pick multiple quarters (e.g., Q1+Q3)
- Center all quarter labels, remove checkmarks, use active background highlight (`bg-gold/20 border-gold text-black`)
- Update `ShortcutFilterState` to change `handoverFrom.quarter` and `handoverTo.quarter` from `string` to `string[]` to support multi-select
- Update `applyShortcutFilters.ts` to handle quarter arrays

### 3. Add "Views" Multi-Select Filter

Add a new filter pill for property views (golf, sea, boulevard, etc.).

**Changes:**
- Add `views: string[]` to `ShortcutFilterState` interface and `defaultShortcutFilters` in `FilterShortcutBar.tsx`
- Add a `VIEWS_OPTIONS` constant with predefined views: Golf Course, Sea View, Boulevard, Street View, City View, Downtown View, Marina View, Lake View, Palm View, Garden View, Pool View, Skyline View, Canal View, Burj Khalifa View, Mountain View
- Add a "Views" popover pill in `FilterShortcutBar.tsx` Row 2 with multi-select toggle pills
- Add views section in `AdvancedFilterPanel.tsx`
- Add views filtering logic in `applyShortcutFilters.ts` — match against a `views` or `property_views` field on projects
- Add views section in `AdvancedFilterPanel.tsx` construction/status area

## Files to Modify
1. `src/constants/constructionStatus.ts` — Add resale statuses
2. `src/constants/filterConfig.ts` — Add `VIEWS_OPTIONS` constant, update `DEVELOPMENT_STATUS_OPTIONS`
3. `src/components/filters/FilterShortcutBar.tsx` — Add resale to construction options, replace quarter `<select>` with styled multi-select chips, add Views filter pill
4. `src/components/filters/AdvancedFilterPanel.tsx` — Same 3 changes (resale, quarter styling, views section)
5. `src/utils/applyShortcutFilters.ts` — Add views filtering logic, update quarter handling

