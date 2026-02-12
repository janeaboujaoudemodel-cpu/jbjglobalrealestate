

## Add Backdrop Blur to All Header Mega Menu Dropdowns

### Problem
When hovering over the **Search**, **Language**, or **Account** icons, a blurred backdrop overlay appears behind the dropdown -- dimming and blurring the page content (including background videos). However, when hovering over the main navigation items (**Buy**, **Sell**, **Rent**, **Projects**, **Areas**, **Developers**, **Insights**), their mega menu panels open without any backdrop, leaving the background video fully visible and distracting.

### Solution
Add the same `backdrop-blur-sm` overlay to the main navigation mega menus, matching the utility menus exactly.

### Technical Details

**File: `src/components/GlobalHeader.tsx`**

**Change 1 -- Add backdrop blur for main nav mega menus (around line 1400-1423)**

Currently the main mega menu panels render without a backdrop. Add a `fixed inset-0 bg-black/40 backdrop-blur-sm` overlay (identical to the one at line 1491) before the mega menu panel content. This overlay will:
- Cover the page below the header
- Apply the same blur + dark tint effect
- Close the menu when clicked (using `closeMegaMenu`)

The existing invisible bridge zone and panel container stay the same -- only a backdrop div is inserted before them.

**Change 2 -- Improve switching speed between menus (line 120)**

The current close timeout is `120ms`. To make switching between nav items feel snappier, reduce this to `80ms`. This makes the transition between Buy -> Sell -> Rent feel more responsive while still providing enough buffer to prevent accidental closes.

### Files Summary

| File | Change |
|------|--------|
| `src/components/GlobalHeader.tsx` | Add backdrop blur overlay for main nav mega menus (Buy through Insights); reduce hover close timeout from 120ms to 80ms |
