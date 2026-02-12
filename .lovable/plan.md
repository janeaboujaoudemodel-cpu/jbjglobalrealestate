

## Fix Filter Bar Styling, Layout, and Add Missing Options

### Issues to Fix

1. **Active pill color** -- currently uses old gold gradient (`from-[#C8A766] to-[#B8944A] text-white`). Should match the champagne gold style used elsewhere (e.g., the sqft/emirate buttons): champagne background with gold border and dark text
2. **Bedroom options** -- missing 6 BR and 7+ BR options
3. **Handover year dropdowns** -- years are cropped/unreadable due to tight `min-w-[68px]` on the select elements
4. **Two-row layout is overcrowded** -- sort pills, Hide Sold Out, and Save are all crammed into Row 2 with the filter popovers. Move them up to Row 1 alongside Map/Saved/Currency/Mode

### Changes

**File: `src/components/filters/FilterShortcutBar.tsx`**

#### 1. Fix active pill style (line ~140)
Change `pillActive` for the light variant from the gold gradient with white text to a champagne-themed active state:
```
// Before (old gold)
"bg-gradient-to-r from-[#C8A766] to-[#B8944A] text-white border border-[#C8A766] shadow-lg"

// After (champagne active -- matches sqft/emirate style)
"bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold text-black font-bold shadow-md"
```
Also update `togglePillOn` (line ~146) to the same champagne style instead of gold gradient.

#### 2. Add bedroom options (lines 75-82)
Add `6 BR` and `7+ BR` to `BEDROOM_OPTIONS`:
```
{ value: '6', label: '6 BR' },
{ value: '7+', label: '7+ BR' },
```

#### 3. Fix handover year dropdowns (lines 315-320, 334-339)
Increase the year select width from `min-w-[68px]` to `min-w-[80px]` so the full year is visible without cropping.

#### 4. Redistribute items across two rows
Move sorting pills (Newest, Low-High, High-Low, A-Z), Hide Sold Out, and Save button from Row 2 up to Row 1, alongside the existing utility buttons:

```
Row 1 (left): Map | Saved | Currency | Mode    (right): Newest | Low-High | High-Low | A-Z | Hide Sold Out | Save
Row 2: Price | Payments | Handover | Property Type | Bedrooms | Status | Construction | Reset All
```

Row 1 becomes `justify-between` with utility buttons on the left and sort/toggle shortcuts on the right.

### Files Summary

| File | Action |
|------|--------|
| `src/components/filters/FilterShortcutBar.tsx` | Fix active pill color, add 6BR/7+BR, widen handover year selects, move sort/hide/save to Row 1 |

