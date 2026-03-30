

# Fix Map Card System — Unified Hover + Click Logic

## Root Cause

There are TWO independent card systems rendering simultaneously:
1. **Leaflet `<Popup>`** — opens on marker click (built into react-leaflet), shows a compact card with image/name/price
2. **Custom `selectedProject` card** — also opens on marker click (absolute positioned at bottom-left), shows a larger detail card

Both fire on the same click event, creating duplicate cards. The Popup is anchored to the marker while the detail card is anchored to the container bottom-left. They visually conflict and the detail card can go behind the sidebar.

## Solution

### 1. Remove Leaflet `<Popup>` from markers entirely
The `<Popup>` component inside each `<Marker>` (lines 315-337) will be removed. All card display is handled by the single custom card system.

### 2. Hover → Compact preview via `hoveredProject` state
- Add `hoveredProject` state (separate from `selectedProject`)
- On marker `mouseover`: set `hoveredProject`
- On marker `mouseout`: clear `hoveredProject` (only if not the `selectedProject`)
- Render a small compact card (image, name, developer, price) near the marker's screen position

### 3. Click → Larger detail card via `selectedProject` state
- On marker `click`: set `selectedProject`, clear `hoveredProject`
- The existing detail card (lines 409-461) serves this role
- When a `selectedProject` is active, hover cards are suppressed for that project

### 4. Only one card at a time
- `hoveredProject` card is hidden when `selectedProject` is set
- Clicking a new marker replaces `selectedProject`
- Clicking map background clears both

### 5. Smart positioning (sidebar-aware)
Both cards use a positioning function that:
- Gets the marker's pixel position via Leaflet's `latLngToContainerPoint`
- Checks distance from left edge (sidebar is ~72px wide) → if too close, position card to the RIGHT
- Checks distance from right edge → if too close, position to LEFT
- Checks distance from top (header+toolbar ~132px) → if too close, position BELOW
- Checks distance from bottom → if too close, position ABOVE
- Card is rendered with `position: absolute` + computed `top`/`left` in the map container div

### 6. Implementation detail

**New helper inside the component:**
```tsx
function getCardPosition(map, latlng, cardWidth, cardHeight) {
  const point = map.latLngToContainerPoint(latlng);
  const container = map.getContainer().getBoundingClientRect();
  const sidebarWidth = 72; // vertical sidebar
  let left = point.x + 16;
  let top = point.y - cardHeight / 2;
  // Push right if near left/sidebar
  if (point.x < sidebarWidth + cardWidth + 20) left = point.x + 16;
  // Push left if near right edge
  if (point.x + cardWidth + 20 > container.width) left = point.x - cardWidth - 16;
  // Clamp top
  if (top < 8) top = 8;
  if (top + cardHeight > container.height - 8) top = container.height - cardHeight - 8;
  return { left, top };
}
```

**Access the Leaflet map instance** via a child component that calls `useMap()` and exposes it via a ref/callback.

### 7. Hover card content (compact)
- 220px wide
- Small image (80px tall), name, developer, price — one compact block

### 8. Click card content
- Keep existing detail card (lines 411-460) but position it near the marker instead of fixed bottom-left
- 384px wide, with image/details/CTA

### 9. State cleanup
- All existing cleanup effects (viewMode change, filter change, intersection observer) also clear `hoveredProject`

## Changes

### File: `src/pages/PropertyMap.tsx`

| Change | Detail |
|--------|--------|
| Remove `<Popup>` from markers | Lines 315-337 deleted |
| Add `hoveredProject` state + `mapRef` | New state + ref to access Leaflet map instance |
| Add `MapRefGetter` child component | Tiny component using `useMap()` to pass map instance to parent via callback ref |
| Add marker `mouseover`/`mouseout` handlers | Set/clear `hoveredProject` |
| Add positioning logic | `getCardPosition()` function computing absolute position from latlng |
| Replace bottom-left detail card | Position it near the clicked marker using computed coords |
| Add compact hover card | Rendered when `hoveredProject` is set and `selectedProject` is not the same project |
| Update cleanup effects | Also clear `hoveredProject` |

