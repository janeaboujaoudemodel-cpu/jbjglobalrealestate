

# Fix Mega Menu Panels Rendering Under Header

## Root Cause

In `src/components/navigation/GlobalVerticalNav.tsx`, all three mega menu flyout containers use `top: '40px'` — but the fixed header is 88px tall. This means the top 48px of each panel is hidden behind the header.

The `PropertiesVerticalNav.tsx` correctly uses `top: '88px'` — this file was already fixed at some point.

## Fix

**File: `src/components/navigation/GlobalVerticalNav.tsx`**

Change `top: '40px'` to `top: '88px'` in all three mega menu panel containers:

1. **Line 850** — Shortcuts flyout: `top: '40px'` → `top: '88px'`
2. **Line 928** — Developers/Areas flyout: `top: '40px'` → `top: '88px'`
3. **Line 1014** — Default mega menu flyout: `top: '40px'` → `top: '88px'`

Also update the corresponding `max-h` calculations to account for the new top offset:
- `max-h-[calc(100vh-60px)]` → `max-h-[calc(100vh-100px)]` (lines 853, 931)
- `max-h-[calc(100vh-120px)]` → `max-h-[calc(100vh-160px)]` (line 1017 for smaller menus)
- `max-h-[calc(100vh-60px)]` → `max-h-[calc(100vh-100px)]` (line 1017 for large menus)

No other files need changes. No styling or branding modifications.

## Files to modify
- `src/components/navigation/GlobalVerticalNav.tsx` — 3 occurrences of `top: '40px'` → `top: '88px'` + max-height adjustments

