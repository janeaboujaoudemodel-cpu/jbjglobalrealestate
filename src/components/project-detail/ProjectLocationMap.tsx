import { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { Maximize, MapPinned } from "lucide-react";
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
<svg xmlns="http://www.w3.org/2000/svg" width="34" height="44" viewBox="0 0 34 44" fill="none">
  <defs>
    <linearGradient id="epin" x1="17" y1="0" x2="17" y2="40" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#0B6E4F"/>
      <stop offset="55%" stop-color="#064E3B"/>
      <stop offset="100%" stop-color="#000000"/>
    </linearGradient>
  </defs>
  <path d="M17 0C7.6 0 0 7.4 0 16.6 0 29.4 17 44 17 44s17-14.6 17-27.4C34 7.4 26.4 0 17 0z" fill="url(#epin)" stroke="rgba(184,149,85,0.55)" stroke-width="1"/>
  <circle cx="17" cy="16" r="5.5" fill="#FFFFFF"/>
</svg>`;

const PROJECT_LOCATION_ICON = L.divIcon({
  className: "custom-marker jj-map-pin",
  html: PROJECT_PIN_SVG,
  iconSize: [34, 44],
  iconAnchor: [17, 44],
  popupAnchor: [0, -44],
});


const attractionIcon = (label: string) => L.divIcon({
  className: "custom-marker",
  html: `<div class="jj-map-marker-pill" style="background:linear-gradient(135deg,#B89555 0%,#F7ECD0 55%,#B89555 100%);color:#1A1A1A;border:1px solid rgba(26,26,26,.25);">${label}</div>`,
  iconSize: [132, 32],
  iconAnchor: [66, 32],
  popupAnchor: [0, -32],
});

// View toggle controls
function MapViewToggle({ 
  mapView, 
  onViewChange,
  externalUrl,
  t,
}: { 
  mapView: MapViewType; 
  onViewChange: (view: MapViewType) => void;
  externalUrl: string;
  t: (key: string) => string;
}) {
  return (
    <div className="absolute top-4 left-4 z-[1000] flex flex-col gap-2 items-start max-w-[calc(100%-2rem)]">
      <div className="jj-map-layer-switcher inline-flex flex-row gap-1">
        {(["satellite", "street", "terrain"] as MapViewType[]).map((view) => (
          <button
            key={view}
            onClick={() => onViewChange(view)}
            className="jj-map-layer-button whitespace-nowrap"
            data-active={mapView === view ? "true" : "false"}
            data-surface="emerald"
            data-emerald-action="true"
            data-no-contrast-guard
          >
            {t(`map.${view}`)}
          </button>
        ))}
      </div>
      <a
        href={externalUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="jj-map-square-control inline-flex flex-row items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 w-auto min-w-fit"
        data-surface="emerald"
        data-emerald-action="true"
        data-no-contrast-guard
        aria-label={t('map.openInGoogleMaps')}
        style={{ backgroundImage: 'var(--jj-emerald-ombre)', color: '#FFFFFF', writingMode: 'horizontal-tb' }}
      >
        <Maximize className="w-4 h-4 shrink-0" />
        <span className="whitespace-nowrap">Open in Google Maps</span>
      </a>
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
  const [distanceView, setDistanceView] = useState<"close" | "far">("close");

  const defaultLat = 25.2048;
  const defaultLng = 55.2708;

  const coordinates: [number, number] = latitude && longitude ? [latitude, longitude] : [defaultLat, defaultLng];
  const isAmra = /amra/i.test(projectName);
  const farCenter: [number, number] = isAmra ? [25.701, 55.942] : coordinates;
  const mapCenter = distanceView === "far" ? farCenter : coordinates;
  const mapZoom = distanceView === "far" ? 10 : 15;
  const attractions = isAmra ? [
    { label: "Siniyah Island", position: [25.617, 55.635] as [number, number], note: "Protected island and nature destination" },
    { label: "Marjan Island", position: [25.666, 55.749] as [number, number], note: "RAK hospitality and casino demand driver" },
    { label: "Wynn Casino", position: [25.679, 55.746] as [number, number], note: "Future regional nightlife landmark" },
  ] : [];

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
          externalUrl={externalMapsUrl}
          t={t}
        />
        <MapNavigationControls latitude={coordinates[0]} longitude={coordinates[1]} />
        {isAmra && (
          <div className="absolute right-4 top-4 z-[1000] jj-map-layer-switcher inline-flex gap-1">
            {(["close", "far"] as const).map((view) => (
              <button
                key={view}
                type="button"
                onClick={() => setDistanceView(view)}
                className="jj-map-layer-button whitespace-nowrap"
                data-active={distanceView === view ? "true" : "false"}
                data-surface="emerald"
                data-emerald-action="true"
                data-no-contrast-guard
              >
                {view === "close" ? "Close view" : "Far view"}
              </button>
            ))}
          </div>
        )}
        <Marker position={coordinates} icon={PROJECT_LOCATION_ICON}>
          <Popup className="jj-map-popup">
            <div className="jj-map-popup-card min-w-[200px] max-w-[260px] p-3" data-map-project-card data-surface="emerald">
              <div className="text-sm font-medium">{projectName}</div>
              {location && <div className="text-xs">{location}</div>}
            </div>
          </Popup>
        </Marker>
        {distanceView === "far" && attractions.map((item) => (
          <Marker key={item.label} position={item.position} icon={attractionIcon(item.label)}>
            <Popup className="jj-map-popup">
              <div className="jj-map-popup-card min-w-[200px] max-w-[260px] p-3" data-map-project-card data-surface="emerald">
                <div className="text-sm font-medium flex items-center gap-2"><MapPinned className="w-4 h-4" />{item.label}</div>
                <div className="text-xs mt-1">{item.note}</div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
