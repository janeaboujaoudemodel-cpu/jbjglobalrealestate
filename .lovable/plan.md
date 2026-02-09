

# Fix All Maps: Touch Controls, Navigation Buttons, and 3D View

## Problems Identified

### 1. Touch Interactions Not Working
On mobile/touch devices, two-finger pinch triggers browser page zoom instead of map zoom because the maps need explicit touch event handling. Leaflet requires `touchZoom: true` and proper touch event capture to prevent browser default behavior.

### 2. Missing Navigation Controls
- **ProjectLocationMap.tsx**: Has `zoomControl={false}` with custom buttons -- but custom buttons may not be prominent enough
- **DeveloperProjectsMap.tsx**: No `zoomControl` setting, no custom buttons at all -- relies on default which may be hidden
- **PropertyMap.tsx**: Has `zoomControl={true}` but native Leaflet controls are tiny and hard to see

### 3. No 3D View
Leaflet is a 2D map library. True 3D (like Google Earth) requires a different library. The practical solution is to add a "3D View" button that opens Google Earth in a new tab with the same coordinates, plus add a tilt/perspective visual effect toggle.

## Plan

### Step 1: Fix Touch Interactions on All 3 Maps

Add these Leaflet options to all map instances:
- `touchZoom: true` -- enable pinch-to-zoom
- `dragging: true` -- enable touch/mouse drag to pan
- `tap: true` -- enable touch tap
- Keep `scrollWheelZoom: false` -- prevent accidental mouse wheel zoom on desktop

Also add a CSS rule to prevent browser zoom on map containers: `touch-action: none` on the map div.

**Files**: All 3 map files

### Step 2: Add Prominent Zoom and Navigation Controls to All Maps

Create a shared `MapNavigationControls` component with:
- Zoom In (+) button
- Zoom Out (-) button  
- Recenter / Fit bounds button
- 3D View button (opens Google Earth)
- Styled with gold/champagne theme, large enough for touch

Apply to all 3 maps consistently.

**New file**: `src/components/maps/MapNavigationControls.tsx`

### Step 3: Add 3D View via Google Earth Link

Add a "3D" button to each map's controls. When clicked, it opens Google Earth web at the same coordinates:
```
https://earth.google.com/web/@{lat},{lng},{zoom}a,0d,35y,0h,45t,0r
```
This gives the user true 3D buildings and terrain without requiring any API key.

### Step 4: Apply CSS Touch Fix

Add a global CSS rule for Leaflet containers to capture touch events properly:
```css
.leaflet-container {
  touch-action: none;
}
```

**File**: `src/index.css`

## Files to Modify

| File | Change |
|---|---|
| `src/index.css` | Add `.leaflet-container { touch-action: none; }` |
| `src/components/maps/MapNavigationControls.tsx` | New shared navigation controls component |
| `src/components/project-detail/ProjectLocationMap.tsx` | Add touch options, use shared controls with 3D button |
| `src/components/developer/DeveloperProjectsMap.tsx` | Add touch options, add navigation controls with 3D button |
| `src/pages/PropertyMap.tsx` | Add touch options, add navigation controls with 3D button |

