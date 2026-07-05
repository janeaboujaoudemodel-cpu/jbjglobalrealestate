import L from "leaflet";

/**
 * Leaflet's zoom transition can call _getMapPanePos after a React unmount or
 * route transition, which throws `_leaflet_pos` when the pane was removed.
 * Keep maps deterministic and non-animated across the app.
 */
export const SAFE_LEAFLET_MAP_OPTIONS: L.MapOptions = {
  zoomAnimation: false,
  fadeAnimation: false,
  markerZoomAnimation: false,
  trackResize: true,
};

export const SAFE_TILE_LAYER_OPTIONS: L.TileLayerOptions = {
  keepBuffer: 1,
  updateWhenIdle: true,
  updateWhenZooming: false,
  detectRetina: false,
};

export function safelyRemoveLayer(map: L.Map, layer: L.Layer | null) {
  if (!layer) return;
  try {
    if (map.hasLayer(layer)) map.removeLayer(layer);
  } catch {
    // Map is already tearing down; ignore stale Leaflet internals.
  }
}

export function safelyDisposeMap(map: L.Map | null) {
  if (!map) return;
  try {
    map.stop();
    map.off();
    map.closePopup();
    map.remove();
  } catch {
    // Route changes can remove panes before Leaflet finishes cleanup.
  }
}
