
# Fix Search Dropdown Hover-Out (Structural Alignment with Nav Menus)

## Problem

The utility mega-menu panel (search/language/account) at line 1499 uses `absolute top-full right-6` but:
1. Uses `onMouseEnter`/`onMouseLeave` instead of `onPointerEnter`/`onPointerLeave` (nav menus use pointer events which are more reliable)
2. Has no invisible bridge zone between the icon buttons and the panel (nav menus have a 4px bridge at line 1396-1400)
3. The panel may not be closing because mouse events behave differently than pointer events with overlapping elements

## The Fix

**File: `src/components/GlobalHeader.tsx`** (lines 1498-1503)

Three small changes to match the nav mega menu pattern exactly:

1. Change `onMouseEnter` to `onPointerEnter` and `onMouseLeave` to `onPointerLeave` (matching lines 1404-1405)
2. Add an invisible bridge zone between the icon buttons and the dropdown panel (matching lines 1396-1400)
3. Add `pointer-events-auto` class (matching line 1402)

No changes to MegaMenuSearch content. No changes to how the search icon triggers the menu. Just aligning the panel container events with the working nav pattern.

## Technical Details

```
Lines 1498-1503 change from:
  <div 
    className="absolute top-full right-6 z-[9998]"
    onMouseEnter={handleMegaMenuPanelEnter}
    onMouseLeave={handleMegaMenuLeave}
  >

To:
  {/* Bridge zone */}
  <div 
    className="absolute right-0 h-4 z-[9998] pointer-events-auto"
    style={{ top: '100%' }}
    onPointerEnter={handleMegaMenuPanelEnter}
  />
  <div 
    className="absolute right-6 z-[9998] pointer-events-auto"
    style={{ top: 'calc(100% + 12px)' }}
    onPointerEnter={handleMegaMenuPanelEnter}
    onPointerLeave={handleMegaMenuLeave}
  >
```

## Files to Modify

| File | Change |
|---|---|
| `src/components/GlobalHeader.tsx` | Switch to pointer events + add bridge zone on utility panel container (lines 1498-1503) |
