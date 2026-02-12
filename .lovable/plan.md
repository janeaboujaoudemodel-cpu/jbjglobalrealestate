

## Fixes: Status Label "Sold Out", Advanced Filter, Hover Effects, Icons, Row 1 Layout, and Developer Page Separation

### 1. Replace "Out of Stock" with "Sold Out" Everywhere in UI

The status option in `FilterShortcutBar.tsx` (line 102) shows "Out of Stock" as the display label. This must be changed to "Sold Out".

**Files to update:**
- `src/components/filters/FilterShortcutBar.tsx` line 102: Change `label: 'Out of Stock'` to `label: 'Sold Out'`
- `src/components/ProjectFilters.tsx` line 43: Update comment from `'Out of Stock'` to `'Sold Out'`

The `filterConfig.ts` and `saleStatus.ts` already correctly map to "Sold Out" internally -- no changes needed there. The `SaleStatusFilter.tsx` uses `SALE_STATUS_OPTIONS` from `filterConfig.ts` which already shows "Sold Out" as the label.

### 2. Add Advanced Filters Button to FilterShortcutBar (Row 2)

Add an "Advanced" pill button at the end of Row 2 (after Hide Sold, before Reset All) that opens a popover/sheet containing advanced criteria:
- Views (Sea View, City View, Canal View, Park View, Golf View, Landmark View)
- Amenities (Pool, Gym, Spa, Kids Play Area, BBQ, Concierge)
- Premium features (Beachfront, Waterfront, Golf Course, Private Pool)
- Furnished status (Furnished, Semi-Furnished, Unfurnished)

### 3. Add Hover Effects on Filter Dropdown Options

Currently, the toggle pill options inside popovers (Property Type, Bedrooms, Status, Construction, Handover selects) lack visible hover effects.

**Fix in `FilterShortcutBar.tsx`:**
- Update `togglePillOff` class (line 160) to include a stronger hover: `hover:bg-gold/10 hover:border-gold/50 hover:shadow-sm`
- Add hover transition to all option buttons inside popovers

### 4. Residential/Commercial Tab Buttons -- Match Dropdown Color with Gold Active State

The Residential/Commercial `TabsTrigger` buttons (line 404-406) use default `bg-white/60` styling. 

**Fix:**
- Change the `TabsList` background to match the popover champagne gradient
- Add a gold champagne active state for the selected tab: `data-[state=active]:bg-gradient-to-br data-[state=active]:from-[#F5EBD7] data-[state=active]:via-[#EDE0C8] data-[state=active]:to-[#D4C4A8] data-[state=active]:border-gold data-[state=active]:text-black data-[state=active]:font-bold`

### 5. Make Heart Icon Bigger Next to "Save"

Line 508: Change `Heart` icon from `w-3.5 h-3.5` to `w-4.5 h-4.5`

### 6. Remove Dot Behind "Construction" and Remove Icons Before Filter Pills

Line 481-485: The `HardHat` icon before "Construction" shows as a dot-like element. Remove the small icons before these pill triggers:
- Remove icon from Apartments/Property Type pill (Building2)
- Remove icon from Handover pill (Calendar) 
- Remove icon from Payments pill (CreditCard)
- Remove icon from Bedrooms pill (Bed)

Actually, the user says "remove it" for the small icons but then says "if the other icons you want to keep, you have to make them bigger." So the fix is: **make all pill trigger icons bigger** -- change from `w-3.5 h-3.5` to `w-4.5 h-4.5` across all pill triggers. For the Status icon (Activity), make it even more visible at `w-5 h-5`.

### 7. Move Utility Buttons (Map, Saved, Currency, Mode) to the RIGHT Side

The user has repeatedly asked for these 4 buttons to be on the RIGHT side, with sort pills centered. Currently they are on the LEFT (lines 191-198).

**Fix in `FilterShortcutBar.tsx` (lines 189-212):**
- Restructure Row 1: Sort pills on the left/center (`flex-1 justify-center`), utility buttons (Map, Saved, Currency, Mode) on the RIGHT (`flex-shrink-0`)
- Swap the order of the two `div` groups

### 8. Filter Bar Header -- Match Background and Edge-to-Edge

The filter bar background should match the page layer color and extend full edge-to-edge. This applies to the inline filter bar in `DeveloperDetail.tsx` (line 347) and the fixed portal bar (line 368).

### 9. Developer Page -- Separate Listings from DLD Market Widget

On `DeveloperDetail.tsx`:
- Wrap the project cards grid and "Explore All X Projects" button inside a champagne-background container card to visually separate them from the DLD Market Widget below
- Add padding/margin between the listing container and the DLD widget
- The DLD widget width should match the card grid width

### Technical Summary

| File | Changes |
|------|---------|
| `src/components/filters/FilterShortcutBar.tsx` | (1) Fix "Out of Stock" to "Sold Out"; (2) Add Advanced filter popover; (3) Hover effects on toggle pills; (4) Gold active state for Residential/Commercial tabs; (5) Bigger heart icon; (6) Bigger pill icons; (7) Move utility buttons to RIGHT side; (8) Match background color |
| `src/components/ProjectFilters.tsx` | Fix "Out of Stock" comment to "Sold Out" |
| `src/pages/DeveloperDetail.tsx` | Wrap listings in champagne container; add spacing before DLD widget; match DLD width to cards |

