import { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { MapNavigationControls } from "@/components/maps/MapNavigationControls";
import { useLanguage } from "@/contexts/LanguageContext";
import { getMapTiles, type MapViewType } from "@/constants/mapTiles";
import { SAFE_LEAFLET_MAP_OPTIONS, SAFE_TILE_LAYER_OPTIONS, safelyRemoveLayer } from "@/utils/leafletSafety";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix Leaflet default marker icons
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

L.Marker.prototype.options.icon = DefaultIcon;

const PROJECT_PIN_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="46" height="60" viewBox="0 0 46 60" fill="none">
  <path d="M23 0C10.3 0 0 10 0 22.4 0 39.7 23 60 23 60s23-20.3 23-37.6C46 10 35.7 0 23 0z" fill="#D71920" stroke="#FFFFFF" stroke-width="2"/>
  <circle cx="23" cy="22" r="8" fill="#FFFFFF"/>
  <circle cx="23" cy="22" r="4" fill="#D71920"/>
</svg>`;

const PROJECT_LOCATION_ICON = L.divIcon({
  className: "custom-marker jj-map-pin",
  html: PROJECT_PIN_SVG,
  iconSize: [46, 60],
  iconAnchor: [23, 60],
  popupAnchor: [0, -60],
});

// View toggle controls
function MapViewToggle({ 
  mapView, 
  onViewChange,
  t,
}: { 
  mapView: MapViewType; 
  onViewChange: (view: MapViewType) => void;
  t: (key: string) => string;
}) {
  return (
    <div className="absolute top-4 left-4 z-[1000] flex flex-col gap-2 items-start" style={{ maxWidth: 'calc(100% - 2rem)' }}>
      <div className="jj-map-layer-switcher inline-flex flex-row flex-nowrap gap-1" style={{ width: 'auto' }}>
        {(["satellite", "street", "terrain"] as MapViewType[]).map((view) => (
          <button
            key={view}
            onClick={() => onViewChange(view)}
            className="jj-map-layer-button"
            data-active={mapView === view ? "true" : "false"}
            data-surface="emerald"
            data-emerald-action="true"
            data-no-contrast-guard
            style={{ whiteSpace: 'nowrap', writingMode: 'horizontal-tb', minWidth: 'max-content', flex: '0 0 auto' }}
          >
            {t(`map.${view}`)}
          </button>
        ))}
      </div>
    </div>
  );
}


function MapViewController({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom, { animate: true });
    window.setTimeout(() => map.invalidateSize(), 80);
  }, [center, zoom, map]);
  return null;
}

// Tile layer switcher component
function DynamicTileLayer({ mapView, language }: { mapView: MapViewType; language: string }) {
  const map = useMap();
  const layerRef = useRef<L.TileLayer | null>(null);

  useEffect(() => {
    if (layerRef.current) {
      safelyRemoveLayer(map, layerRef.current);
    }
    const tiles = getMapTiles(language);
    const { url, attribution, subdomains } = tiles[mapView];
    const tileOptions: L.TileLayerOptions = { ...SAFE_TILE_LAYER_OPTIONS, attribution, maxZoom: 19 };
    if (subdomains) tileOptions.subdomains = subdomains;
    layerRef.current = L.tileLayer(url, tileOptions);
    layerRef.current.addTo(map);

    return () => {
      if (layerRef.current) {
        safelyRemoveLayer(map, layerRef.current);
        layerRef.current = null;
      }
    };
  }, [mapView, language, map]);

  return null;
}

// Scroll zoom is deliberately kept off by default so the page scroll never stalls.
function SmoothMapRuntime() {
  const map = useMap();

  useEffect(() => {
    map.scrollWheelZoom.disable();
    map.options.zoomSnap = 0.25;
    map.options.zoomDelta = 0.5;
    map.options.wheelPxPerZoomLevel = 90;
  }, [map]);

  return null;
}

interface ProjectLocationMapProps {
  projectName: string;
  location?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  className?: string;
}

export default function ProjectLocationMap({
  projectName,
  location,
  latitude,
  longitude,
  className = "",
}: ProjectLocationMapProps) {
  const { t, language } = useLanguage();
  const [mapView, setMapView] = useState<MapViewType>("satellite");

  const defaultLat = 25.2048;
  const defaultLng = 55.2708;

  const coordinates: [number, number] = latitude && longitude ? [latitude, longitude] : [defaultLat, defaultLng];
  const mapCenter = coordinates;
  const mapZoom = /amra/i.test(projectName) ? 16 : 15;

  // Prefer coordinates for accurate Google Maps deep-link (avoids ambiguous name searches)
  const hasCoords = !!(latitude && longitude);
  const mapQuery = hasCoords
    ? `${latitude},${longitude}`
    : `${projectName}${location ? `, ${location}` : ""}, UAE`;
  const externalMapsUrl = hasCoords
    ? `https://maps.google.com/?q=${latitude},${longitude}`
    : `https://maps.google.com/?q=${encodeURIComponent(mapQuery)}`;

  return (
    <div data-map-shell className={`rounded-2xl overflow-hidden relative ${className}`} style={{ height: 450, border: '1px solid rgba(255,255,255,0.16)', boxShadow: '0 28px 60px -34px rgba(0,0,0,0.82), inset 0 1px 0 rgba(255,255,255,0.16)' }}>
      <MapContainer
        center={mapCenter}
        zoom={mapZoom}
        scrollWheelZoom={false}
        touchZoom={true}
        dragging={true}
        style={{ height: "100%", width: "100%" }}
        zoomControl={false}
        attributionControl={false}
        zoomSnap={0.25}
        zoomDelta={0.5}
        wheelPxPerZoomLevel={90}
        {...SAFE_LEAFLET_MAP_OPTIONS}
      >
        <DynamicTileLayer mapView={mapView} language={language} />
        <SmoothMapRuntime />
        <MapViewController center={mapCenter} zoom={mapZoom} />
        <MapViewToggle 
          mapView={mapView} 
          onViewChange={setMapView}
          t={t}
        />
        <MapNavigationControls latitude={coordinates[0]} longitude={coordinates[1]} />
        <Marker position={coordinates} icon={PROJECT_LOCATION_ICON}>
          <Popup className="jj-map-popup">
            <div className="jj-map-popup-card min-w-[200px] max-w-[260px] p-3" data-map-project-card data-surface="emerald">
              <div className="text-sm font-medium">{projectName}</div>
              {location && <div className="text-xs">{location}</div>}
            </div>
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}
