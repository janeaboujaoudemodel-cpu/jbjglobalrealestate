

# Fix Map Page White Gap, Background Color + Sidebar Mega-Menu Still Hidden

## Problems Found (verified in code)

### 1. Map Page — White background and gap
**PropertyMap.tsx line 165**: The fixed filter bar uses `bg-background/95` (white). It should match the header's champagne gradient (`from-[#E8DCC8] via-[#DCCFB5] to-[#D4C4A8]`).

**PropertyMap.tsx line 191**: `pt-[52px]` padding on the map container, but since MainLayout already adds `pt-[88px]` to the `<main>`, and then the map's own fixed filter bar is at `top-[88px]`, the map content needs to account for the filter bar height (~52px) below that. The white gap is because `bg-background` (white) shows through. The map container's outer div (line 163) uses `bg-background` — should be transparent or match the page.

**Root fix**: The map page filter bar at `top-[88px]` with `bg-background/95` creates a white strip. Change it to match the header gradient. The map container `pt-[52px]` is roughly correct for the filter bar height, but the outer wrapper `bg-background` creates white around it.

### 2. Map Page — Filter bar appears as separate band
The filter bar (line 165) is a separate fixed div below the header with a different background color (white vs champagne). It should visually merge with the header by using the same gradient and removing the visible border gap.

### 3. Sidebar mega-menu — ALREADY FIXED
The `PropertiesVerticalNav.tsx` line 112 already shows `top: '88px'` — this was fixed in the previous edit. If the user still sees it hidden, it may be a cache issue, but the code is correct.

## Fix Plan

### File: `src/pages/PropertyMap.tsx`

1. **Line 163**: Change `bg-background` to no background or transparent — the map fills the space
2. **Line 165**: Change the fixed filter bar background from `bg-background/95 backdrop-blur-md border-b border-gold/20` to `bg-gradient-to-r from-[#E8DCC8] via-[#DCCFB5] to-[#D4C4A8] border-b border-[hsl(var(--gold)/0.2)] shadow-[0_1px_3px_hsl(var(--gold)/0.12)]` — matching the header exactly
3. **Line 191**: Verify `pt-[52px]` is correct (filter bar is ~52px tall with badge row + filter row). This looks right.

### File: `src/components/navigation/HorizontalUtilityBar.tsx`

Already correctly hides Row 2 on `/map` (lines 537-551). No change needed.

### Verification of other pages (from previous plan)

- **AreaDetail.tsx** — already patched to `top-[88px]` ✓
- **Developers.tsx** — already patched to `top-[88px]` ✓  
- **DeveloperHubShell.tsx** — already patched to `top-[88px]` / `h-[calc(100vh-88px)]` ✓
- **PropertiesVerticalNav.tsx** — already patched to `top: '88px'` ✓

### Summary of changes
- **`src/pages/PropertyMap.tsx`**: Change filter bar background to match header gradient, remove white outer background

