

## Plan: Unified FilterShortcutBar Across All Pages + Mode Selection Toast Enhancement

### Problem
1. **Developers page** uses its own custom filter UI (search + tier dropdown + developer dropdown) instead of the shared `FilterShortcutBar` component that Projects, Areas, and Resale pages use.
2. The `FilterShortcutBar` doesn't have a concept of "priority filter" — all filters are shown in the same order regardless of page context.
3. **Mode selection toast** only lasts 5 seconds and uses default sonner styling — user wants it longer, and on mobile it should appear as a bottom champagne popup (not a horizontal header bar).

### Changes

#### 1. Add `priorityFilter` prop to `FilterShortcutBar`

**File**: `src/components/filters/FilterShortcutBar.tsx`

- Add new prop `priorityFilter?: 'developers' | 'areas' | 'emirates' | 'projects'` to `FilterShortcutBarProps`
- In the Row 2 filter popovers rendering, reorder the filter pills so the priority filter appears first (leftmost position)
- For `developers` priority: Developers popover renders first
- For `areas` priority: Areas popover renders first
- For `emirates` priority: Emirates popover renders first
- Default (projects): Current order unchanged

#### 2. Replace Developers page custom filters with `FilterShortcutBar`

**File**: `src/pages/Developers.tsx`

- Remove the custom search + tier + developer dropdown filter UI (lines 287-401 and the fixed portal copy at lines 411-491)
- Replace with the same `FilterShortcutBar` component pattern used on PropertiesReelly/AreaGuides
- Pass `priorityFilter="developers"` so developers filter is highlighted first
- Keep the tier filter as an additional row below the FilterShortcutBar (unique to developers page)
- Wire `shortcutFilters` to the developer filtering logic (already partially done)

#### 3. Add `priorityFilter` to existing page usages

| Page | `priorityFilter` value |
|------|----------------------|
| `PropertiesReelly.tsx` (Projects) | `undefined` (default order) |
| `Properties.tsx` | `undefined` (default order) |
| `AreaGuides.tsx` | `'areas'` |
| `AreaDetail.tsx` | `'areas'` |
| `DeveloperDetail.tsx` | `'developers'` |
| `Developers.tsx` | `'developers'` |

#### 4. Enhance Mode Selection Toast

**File**: `src/components/ModeSelectionModal.tsx`

- Increase toast `duration` from `5000` to `8000` ms (8 seconds) for all modes
- Add custom toast className with champagne gradient background: `bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border border-gold/30 text-black`
- Use sonner's `position: 'bottom-center'` for the mode confirmation toast so on mobile it renders as a bottom popup
- Remove the horizontal bar appearance by setting `style` to ensure it's a contained card, not a full-width bar

### Files Summary

| File | Changes |
|------|---------|
| `FilterShortcutBar.tsx` | Add `priorityFilter` prop, reorder filter pills based on context |
| `Developers.tsx` | Replace custom filters with `FilterShortcutBar`, pass `priorityFilter="developers"` |
| `AreaGuides.tsx` | Add `priorityFilter="areas"` |
| `AreaDetail.tsx` | Add `priorityFilter="areas"` |
| `DeveloperDetail.tsx` | Add `priorityFilter="developers"` |
| `ModeSelectionModal.tsx` | Increase toast duration to 8s, champagne bottom popup styling |

