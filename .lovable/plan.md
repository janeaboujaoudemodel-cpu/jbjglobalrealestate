
# Restore Search Dropdown Behavior -- Hover-Out Fix Only

## What Went Wrong

The search dropdown content (`MegaMenuSearch`) was NOT changed -- it remains identical. The only change was how the search icon triggers it (now uses the mega-menu hover system). This part is actually correct and should stay.

The real problem is that the search/language/account mega-menu panel (lines 1480-1519) uses a `fixed inset-0` overlay that covers the **entire screen** below the header. Since the mouse cursor is always "inside" this overlay, the `onMouseLeave` event never fires when moving sideways or downward -- it only fires if you move the mouse back up into the header.

The nav mega menus (Buy, Sell, Rent, etc.) work correctly because they use a relatively-positioned panel that the mouse can actually leave.

## The Fix

**File: `src/components/GlobalHeader.tsx`**

Change the utility mega-menu panel (search/language/account) container from a full-screen `fixed inset-0` overlay to a right-aligned positioned panel (similar to how nav mega menus work). This way:

1. The backdrop still captures clicks to close
2. The panel content area has real boundaries the mouse can leave
3. When the cursor moves away from the panel, `onMouseLeave` fires and closes it after a short delay

Specifically:
- Keep the backdrop as `fixed inset-0` for click-to-close
- Move the actual panel content into a container with defined dimensions (not full-screen) so `onMouseLeave` works naturally
- Add `onMouseEnter` on the panel content to cancel the close timeout (same as nav menus)
- The `MegaMenuSearch` component itself remains completely unchanged

This is a structural fix to the hover container only -- no changes to the search dropdown content, layout, or functionality.

## Technical Details

**Lines 1480-1519 of `GlobalHeader.tsx`** -- restructure the utility panel:

```
Before:
  <div className="fixed inset-0" onMouseLeave={handleMegaMenuLeave}>
    <div className="backdrop" />        -- covers everything
    <div className="absolute top-0 right-6">  -- panel content
      <MegaMenuSearch />
    </div>
  </div>

After:
  <div className="fixed inset-0">              -- backdrop only, click-to-close
    <div className="backdrop" onClick={closeMegaMenu} />
  </div>
  <div className="absolute top-full right-6"    -- panel with real boundaries
       onMouseEnter={handleMegaMenuPanelEnter}
       onMouseLeave={handleMegaMenuLeave}>
    <MegaMenuSearch />
  </div>
```

The panel will be positioned relative to the header icon group, with real edges the cursor can cross to trigger closure -- exactly like the nav mega menus already work.

## Files to Modify

| File | Change |
|---|---|
| `src/components/GlobalHeader.tsx` | Restructure utility mega-menu panel container so hover-out works; no changes to MegaMenuSearch content |
