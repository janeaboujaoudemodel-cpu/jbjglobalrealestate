

# Fix Sidebar Mega-Menu Panels Hidden Behind Header

## Problem
When clicking sidebar items like "Buy", "Rent", "Developers" etc. in the vertical sidebar, the mega-menu flyout panels appear with `top: 0` and only `mt-8` (32px) top margin. The horizontal header is 88px tall at `z-[9998]`, so the top ~56px of the mega-menu content is clipped behind the header — making the first items invisible.

## Root Cause
In `src/components/navigation/PropertiesVerticalNav.tsx` (lines 110-115):
- The mega-menu container is `fixed` with `top: 0`
- The inner panel uses `mt-8` (32px) — not enough to clear the 88px header
- Even though `z-[10000]` is above the header's `z-[9998]`, the visual overlap makes content inaccessible

## Fix

### File: `src/components/navigation/PropertiesVerticalNav.tsx`

**Change the mega-menu panel positioning** to start below the header:

1. **Line 112**: Change `top: 0` to `top: '88px'` so the panel container starts below the header
2. **Line 115**: Change `mt-8` to `mt-2` since the 88px offset now handles the header clearance
3. **Line 115**: Adjust `max-h-[60vh]` to `max-h-[calc(100vh-100px)]` to use available vertical space properly

This ensures all mega-menu items (Buy options, Rent options, Developers, Projects, Areas, Insights) are fully visible below the header.

### Files affected
- `src/components/navigation/PropertiesVerticalNav.tsx` — the only file with this sidebar mega-menu pattern

