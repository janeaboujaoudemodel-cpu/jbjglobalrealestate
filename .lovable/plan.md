

# Fix Map Page Structure — Complete Overhaul

## Summary

The map page has a blue duplicate header bar, wrong positioning, and broken list view. This plan restructures it to match the home page exactly: champagne header with filters inside, then a separate light toolbar below for map controls.

## Changes

### 1. PropertyMap.tsx — Complete restructure

**Remove**: The entire fixed blue bar (lines 164-188) that duplicates the header with its own FilterShortcutBar. This is the "blue strip" the user sees.

**Add**: A new **Map Control Bar** below the header (not fixed to header, just sticky below it). Light/neutral style (white/soft beige), containing:
- LEFT: `"{count} Properties"` badge
- CENTER/RIGHT: View toggle buttons (Map / List / **Grid** — Grid is new), Sorting dropdown (Newest, Low→High, High→Low, A→Z), Hide Sold toggle, Views filter
- Sticky at `top-[88px]` with `z-[60]` — visually separate from the header

**Fix map container**: 
- Remove `pt-[52px]` — the map should start directly after the control bar
- Use `h-[calc(100vh-88px-48px)]` (viewport minus header minus control bar) so the map fills remaining space without being cropped
- No background color on wrapper (transparent)

**Fix list panel**:
- Position `top` to account for header + control bar (136px)
- Add a search input at the top of the list panel, synced with main filters
- Fix image rendering (ensure SafeImage has proper fallback and aspect ratio)
- Increase price contrast: use `text-foreground font-bold` instead of `text-primary` (which may be too faded)

**Add Grid view**:
- New `viewMode` state: `'map' | 'list' | 'grid'`
- Grid shows cards in a responsive grid layout (2-3 columns) in a panel similar to list
- Map remains interactive underneath in all modes

### 2. HorizontalUtilityBar.tsx — Show Row 2 on /map

**Revert** the `/map` exclusion (lines 537-551): Remove the `location.pathname !== "/map"` condition so the filter row (Row 2) renders on the map page too — exactly matching the home page. The map page should NOT have its own filter bar; it uses the global one.

Wire the global filter change event so PropertyMap listens to `globalFilterChange` custom events to update its local filter state.

### 3. PropertyMap.tsx — Listen to global filters

Instead of having its own FilterShortcutBar, PropertyMap listens for `globalFilterChange` events from the HorizontalUtilityBar and applies those filters to its data. Add a `useEffect` that listens for this event.

### 4. AIChatWidget / CollapsedChatButton — Force small only

In `CollapsedChatButton.tsx`, always render the small circular button (the `else` branch, lines 113-125). Remove the medium/attention-pulse expanded state (lines 78-112). The widget should only show the small circle; it expands on click.

### 5. Sidebar mega-menus — Already fixed

PropertiesVerticalNav already uses `top: '88px'`. No changes needed.

### 6. Dropdowns/panels z-index

All dropdown content already uses `z-[10000]`+ which is above the header's `z-[9998]`. The key fix is ensuring `top` positioning starts at 88px, which is already done. No additional changes.

## Files to modify

| File | Change |
|------|--------|
| `src/pages/PropertyMap.tsx` | Remove blue filter bar, add light control bar with Grid view, fix map height, fix list panel, add search in list, listen to global filter events |
| `src/components/navigation/HorizontalUtilityBar.tsx` | Remove `/map` exclusion from Row 2 so filters show on map page |
| `src/components/chat/CollapsedChatButton.tsx` | Always render small circular button, remove medium/attention state |

