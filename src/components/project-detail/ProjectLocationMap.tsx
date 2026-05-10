import { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { Button } from "@/components/ui/button";
import { Maximize, MousePointer } from "lucide-react";
import { MapNavigationControls } from "@/components/maps/MapNavigationControls";
import { useLanguage } from "@/contexts/LanguageContext";
import { getMapTiles, type MapViewType } from "@/constants/mapTiles";
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
    <div className="absolute top-4 left-4 z-[1000] flex flex-col gap-2">
      <div className="bg-card/95 backdrop-blur-sm rounded-lg border border-[#B89555]/40 shadow-lg p-1 flex flex-col gap-1">
        {(["satellite", "street", "terrain"] as MapViewType[]).map((view) => (
          <button
            key={view}
            onClick={() => onViewChange(view)}
            className={`px-3 py-2 text-xs font-medium rounded transition-all ${
              mapView === view 
                ? "bg-[#EFE6D6] text-foreground" 
                : "hover:bg-[#EFE6D6]/20 text-muted-foreground"
            }`}
          >
            {t(`map.${view}`)}
          </button>
        ))}
      </div>
      <a
        href={externalUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="w-11 h-11 flex items-center justify-center rounded-lg bg-card/95 backdrop-blur-sm border border-[#B89555]/40 shadow-lg hover:bg-[#EFE6D6]/20 active:bg-[#EFE6D6]/30 transition-all"
        aria-label={t('map.openInGoogleMaps')}
      >
        <Maximize className="w-5 h-5 text-foreground" />
      </a>
    </div>
  );
}

// Tile layer switcher component
function DynamicTileLayer({ mapView, language }: { mapView: MapViewType; language: string }) {
  const map = useMap();
  const layerRef = useRef<L.TileLayer | null>(null);

  useEffect(() => {
    if (layerRef.current) {
      map.removeLayer(layerRef.current);
    }
    const tiles = getMapTiles(language);
    const { url, attribution } = tiles[mapView];
    layerRef.current = L.tileLayer(url, { attribution, maxZoom: 19 });
    layerRef.current.addTo(map);

    return () => {
      if (layerRef.current) {
        map.removeLayer(layerRef.current);
      }
    };
  }, [mapView, language, map]);

  return null;
}

// Scroll zoom enabler on click
function ScrollZoomEnabler({ enabled }: { enabled: boolean }) {
  const map = useMap();

  useEffect(() => {
    if (enabled) {
      map.scrollWheelZoom.enable();
    } else {
      map.scrollWheelZoom.disable();
    }
  }, [enabled, map]);

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
  const [scrollZoomEnabled, setScrollZoomEnabled] = useState(false);
  const [hasRefined, setHasRefined] = useState(false);
  const [refinedCoords, setRefinedCoords] = useState<[number, number] | null>(null);

  const defaultLat = 25.2048;
  const defaultLng = 55.2708;

  const coordinates: [number, number] = refinedCoords
    ?? (latitude && longitude ? [latitude, longitude] : [defaultLat, defaultLng]);

  const mapQuery = `${projectName}${location ? `, ${location}` : ""}, Dubai, UAE`;
  const externalMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}`;

  return (
    <div className={`rounded-2xl overflow-hidden relative ${className}`} style={{ height: 450, border: '3px solid hsl(42 45% 59%)', boxShadow: '0 8px 32px rgba(200,167,102,0.25), 0 4px 16px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.1)' }}>
      <MapContainer
        center={coordinates}
        zoom={15}
        scrollWheelZoom={false}
        touchZoom={true}
        dragging={true}
        style={{ height: "100%", width: "100%" }}
        zoomControl={false}
        attributionControl={false}
      >
        <DynamicTileLayer mapView={mapView} language={language} />
        <ScrollZoomEnabler enabled={scrollZoomEnabled} />
        <MapViewToggle 
          mapView={mapView} 
          onViewChange={setMapView}
          externalUrl={externalMapsUrl}
          t={t}
        />
        <MapNavigationControls latitude={coordinates[0]} longitude={coordinates[1]} />
        <Marker position={coordinates}>
          <Popup>
            <div className="text-sm font-medium">{projectName}</div>
            {location && <div className="text-xs text-muted-foreground">{location}</div>}
          </Popup>
        </Marker>
      </MapContainer>

      {/* Click to enable scroll zoom overlay */}
      {!scrollZoomEnabled && (
        <div
          className="absolute inset-0 z-[999] flex items-center justify-center cursor-pointer"
          onClick={() => setScrollZoomEnabled(true)}
        >
          <div className="bg-[#1A1A1A]/50 backdrop-blur-sm text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 pointer-events-none">
            <MousePointer className="w-4 h-4" />
            {t('map.clickToEnable')}
          </div>
        </div>
      )}
    </div>
  );
}
