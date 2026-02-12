

## Add Residential/Commercial Category Toggle to Property Type Filter

### Problem
The Property Type filter currently shows all types in a flat list. The user wants a two-step selection: first choose **Residential** or **Commercial**, then see only the relevant property types for that category.

### Changes

**File: `src/components/filters/FilterShortcutBar.tsx`**

#### 1. Add category constants

Define two category arrays:

```
RESIDENTIAL_TYPES = [
  { value: 'apartments', label: 'Apartments' },
  { value: 'villa', label: 'Villa' },
  { value: 'townhouse', label: 'Townhouse' },
  { value: 'duplex', label: 'Duplex' },
  { value: 'penthouse', label: 'Penthouse' },
]

COMMERCIAL_TYPES = [
  { value: 'plot', label: 'Plot' },
  { value: 'retail', label: 'Retail' },
  { value: 'commercial', label: 'Commercial' },
  { value: 'offices', label: 'Offices' },
]
```

#### 2. Update state interface

Add `propertyCategory` field to `ShortcutFilterState`:

```
propertyCategory: 'residential' | 'commercial' | null  // default: null
```

Update `defaultShortcutFilters` with `propertyCategory: null`.

#### 3. Update the Property Type popover UI

Inside the popover, add a Residential/Commercial toggle at the top using the existing `Tabs` component:
- When **Residential** is selected, show residential type pills below
- When **Commercial** is selected, show commercial type pills below
- Switching category clears any selected `propertyTypes` from the other category

#### 4. Update `hasActiveFilters` and `resetAll`

Include `propertyCategory` in the active filter check and reset logic.

#### 5. Update pill label logic

Update `getPropertyTypeLabel()` to show the category name when no specific types are selected but a category is chosen (e.g., "Residential" or "Commercial").

### Layout in the Popover

```
+----------------------------------+
| [  Residential  ] [ Commercial ] |   <-- Tabs toggle
+----------------------------------+
| Apartments  Villa  Townhouse     |   <-- shown when Residential
| Duplex  Penthouse                |
+----------------------------------+
```

### Files Summary

| File | Action |
|------|--------|
| `src/components/filters/FilterShortcutBar.tsx` | Add propertyCategory to state, split types into Residential/Commercial with tab toggle in popover |

