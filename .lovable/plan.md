

## Enforce English Map Labels by Default + Translate Map UI

### Problem
All 5 map components use OpenStreetMap tiles for "street" view, which renders labels in mixed/local languages. Maps should show **English labels by default** for all languages, and only switch to Arabic labels when Arabic is selected. All map UI text (buttons, overlays, popups) needs translation support.

### Approach

**1. Create centralized map tile config** — `src/constants/mapTiles.ts`
- Single source of truth for tile URLs, replacing duplicated `MAP_TILES` across 5 files
- Language-aware street tiles: use **CartoDB Voyager** (`basemaps.cartocdn.com/rastertiles/voyager/`) which renders clean English labels by default
- When Arabic is selected, switch street tiles to standard OSM (which shows Arabic labels for Dubai/UAE areas)
- Satellite (Esri) and Terrain stay unchanged (no text labels on satellite)
- Export a `getMapTiles(language)` function that returns the correct tile set

**2. Update all 5 map components** to use centralized tiles + translate UI:
- `src/pages/PropertyMap.tsx`
- `src/components/maps/PropertiesMapView.tsx`
- `src/components/project-detail/ProjectLocationMap.tsx`
- `src/components/developer/DeveloperProjectsMap.tsx`
- `src/components/area-detail/AreaMapSection.tsx`

Changes per component:
- Import `getMapTiles` + `useLanguage`
- Replace local `MAP_TILES` with `getMapTiles(language)`
- Translate UI strings: "Satellite"/"Street"/"Terrain" buttons, "Click to enable map interaction", "Loading properties...", "Properties", "List", "View", "Price on request", "Starting from", "View Details", "Handover:", popup labels
- Pass `language` to `DynamicTileLayer` so tiles update when language changes

**3. Add translation keys** to `src/translations/en.ts` and Arabic (`ar.ts`) + other language files:
- `map.satellite`, `map.street`, `map.terrain`
- `map.clickToEnable`, `map.loadingProperties`, `map.priceOnRequest`, `map.startingFrom`, `map.viewDetails`, `map.handover`, `map.view`, `map.properties`, `map.list`, `map.noLocations`, `map.openInGoogleMaps`

### Files
- **New**: `src/constants/mapTiles.ts`
- **Edit**: 5 map components (remove local `MAP_TILES`, use centralized + `useLanguage`)
- **Edit**: `src/translations/en.ts`, `src/translations/ar.ts` (add map keys, propagate to other language files)

