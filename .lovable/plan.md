

# Standardize Area Map to Match Approved Map Card

## Problem
The `AreaMapSection` uses a basic OpenStreetMap tile layer with no view toggle (satellite/street/terrain), no navigation controls (zoom/recenter/3D), and no error boundary. The approved map card pattern (used in `ProjectLocationMap.tsx`) includes all of these features.

## Changes

### File: `src/components/area-detail/AreaMapSection.tsx` -- Full Rewrite

Replace the current basic map with the approved map card pattern:

1. **Satellite default view** with satellite/street/terrain toggle (same `MapViewToggle` + `DynamicTileLayer` pattern from `ProjectLocationMap.tsx`)
2. **Navigation controls** -- import and add `MapNavigationControls` (zoom in/out, recenter, 3D Google Earth button)
3. **Error boundary** -- wrap in `MapErrorBoundary`
4. **External link** -- "Open in Google Maps" button via `Maximize` icon
5. **Disable default zoom control** (`zoomControl={false}`) since custom controls replace it
6. **Hide attribution** (`attributionControl={false}`) for cleaner look
7. **Gold-bordered, rounded card** with `border-gold/30` and `touch-action: none`
8. **Project popups** -- keep existing project marker popups with images and links

### File: `src/pages/AreaDetail.tsx` -- Wrap map in error boundary

Wrap `AreaMapSection` with `MapErrorBoundary` for resilience.

## Technical Details

The approved map card uses these components internally:
- `DynamicTileLayer` -- switches tile source (satellite via Esri, street via OSM, terrain via Stamen)
- `MapViewToggle` -- left-side button group for view switching + external maps button
- `MapNavigationControls` -- right-side zoom/recenter/3D buttons (from `src/components/maps/MapNavigationControls.tsx`)

These will be added directly inside `AreaMapSection.tsx` (inline components like `ProjectLocationMap` does) so the area map matches the project map exactly. The map height stays at 500px, satellite is the default view, and all project markers with popups are preserved.

