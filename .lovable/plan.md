

## Plan: Align Sidebar Header with Horizontal Header Bars

### Problem
The horizontal header consists of two fixed bars totaling exactly **88px** (48px Utility Bar + ~40px Filter Bar). The vertical sidebar's champagne header section is slightly taller/shorter, creating a misalignment at the bottom edge.

### Fix

**File: `src/components/navigation/GlobalVerticalNav.tsx`** (lines 1071-1093)

Set the sidebar header block to an explicit `h-[88px]` to match the combined height of the two horizontal bars. This ensures the gold divider line at the bottom of the sidebar header sits on the exact same horizontal line as the bottom border of the GlobalFilterBar.

- Change the header wrapper from implicit height (`py-4`) to a fixed `h-[88px]` with flexbox centering
- Keep the 1px gold gradient divider at the very bottom of that 88px block

This is a single-line CSS change — set the outer header `div` to `h-[88px]` and adjust internal padding to center the monogram + text within that fixed height.

### Files to edit
- `src/components/navigation/GlobalVerticalNav.tsx` — sidebar header height

