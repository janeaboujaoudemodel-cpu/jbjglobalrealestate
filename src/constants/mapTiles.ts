// Centralized map tile configuration with language-aware street tiles
// English labels by default (CartoDB Voyager), Arabic OSM when Arabic is selected

export type MapViewType = "satellite" | "street" | "terrain";

export interface TileConfig {
  url: string;
  attribution: string;
  subdomains?: string | string[];
}

/**
 * Returns tile configuration based on the current language.
 * - Satellite & Terrain: language-independent (no text labels on satellite, terrain uses standard)
 * - Street: CartoDB Voyager (English labels) by default; standard OSM for Arabic
 */
export function getMapTiles(language: string = "en"): Record<MapViewType, TileConfig> {
  const isArabic = language === "ar";

  return {
    satellite: {
      url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      attribution: "Tiles &copy; Esri",
    },
    street: isArabic
      ? {
          url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        }
      : {
          url: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
        },
    terrain: {
      url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
      attribution: 'Map data &copy; OpenStreetMap contributors, SRTM | Map style &copy; OpenTopoMap',
      subdomains: ["a", "b", "c"],
    },
  };
}
