

## Move Utility Buttons Above the Filter Pills

### Problem
Currently, the utility buttons (Map, Saved, AED, sqft, Client Mode) sit inline with the filter pills on the same row, separated by a vertical divider. The user wants the Reelly layout: utility buttons on a **first row** above, and filter pills on a **second row** below.

### Changes

**File: `src/components/filters/FilterShortcutBar.tsx`**

1. **Restructure the layout** from a single `flex` row to a two-row stack:
   - **Row 1 (top-right)**: `UtilityButtons` -- right-aligned with `justify-end`
   - **Row 2 (below)**: All filter pills (Price, Payments, Handover, Property Type, Bedrooms, Status, Reset All, Save)
2. **Remove** the vertical divider (`w-px h-6`) that currently separates pills from utility buttons
3. **Remove** the `UtilityButtons` call from inside the pills row and place it in its own row above
4. Wrap both rows in a `flex flex-col gap-2` container

### Result

```
Row 1:  [right-aligned]  Map | Saved | AED | sqft | Investor
Row 2:  Price | Payments | Handover | Apartment | Bedrooms | Status | Reset All | Save
```

### Files Summary

| File | Action |
|------|--------|
| `src/components/filters/FilterShortcutBar.tsx` | Restructure from 1-row to 2-row layout; move UtilityButtons to top row |

