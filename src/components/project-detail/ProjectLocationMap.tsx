import { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { Button } from "@/components/ui/button";
import { Layers, Maximize, MousePointer } from "lucide-react";
import { MapNavigationControls } from "@/components/maps/MapNavigationControls";
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

// Map view types
type MapViewType = "satellite" | "street" | "terrain";

const MAP_TILES: Record<MapViewType, { url: string; attribution: string }> = {
  satellite: {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: "Tiles &copy; Esri",
  },
  street: {
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  },
  terrain: {
    url: "https://stamen-tiles-{s}.a.ssl.fastly.net/terrain/{z}/{x}/{y}{r}.png",
    attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>',
  },
};

// View toggle controls (satellite/street/terrain)
function MapViewToggle({ 
  mapView, 
  onViewChange,
  onOpenExternal,
}: { 
  mapView: MapViewType; 
  onViewChange: (view: MapViewType) => void;
  onOpenExternal: () => void;
}) {
  return (
    <div className="absolute top-4 left-4 z-[1000] flex flex-col gap-2">
      <div className="bg-card/95 backdrop-blur-sm rounded-lg border border-gold/40 shadow-lg p-1 flex flex-col gap-1">
        {(["satellite", "street", "terrain"] as MapViewType[]).map((view) => (
          <button
            key={view}
            onClick={() => onViewChange(view)}
            className={`px-3 py-2 text-xs font-medium rounded transition-all ${
              mapView === view 
                ? "bg-gold text-foreground" 
                : "hover:bg-gold/20 text-muted-foreground"
            }`}
          >
            {view.charAt(0).toUpperCase() + view.slice(1)}
          </button>
        ))}
      </div>
      <button
        onClick={onOpenExternal}
        className="w-11 h-11 flex items-center justify-center rounded-lg bg-card/95 backdrop-blur-sm border border-gold/40 shadow-lg hover:bg-gold/20 active:bg-gold/30 transition-all"
        aria-label="Open in Google Maps"
      >
        <Maximize className="w-5 h-5 text-foreground" />
      </button>
    </div>
  );
}

// Tile layer switcher component
function DynamicTileLayer({ mapView }: { mapView: MapViewType }) {
  const map = useMap();
  const layerRef = useRef<L.TileLayer | null>(null);

  useEffect(() => {
    if (layerRef.current) {
      map.removeLayer(layerRef.current);
    }
    const { url, attribution } = MAP_TILES[mapView];
    layerRef.current = L.tileLayer(url, { attribution, maxZoom: 19 });
    layerRef.current.addTo(map);

    return () => {
      if (layerRef.current) {
        map.removeLayer(layerRef.current);
      }
    };
  }, [mapView, map]);

  return null;
}

// Scroll zoom enabler on click
function ScrollZoomEnabler({ enabled, onEnable }: { enabled: boolean; onEnable: () => void }) {
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
  const [mapView, setMapView] = useState<MapViewType>("satellite");
  const [coordinates, setCoordinates] = useState<[number, number] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [scrollZoomEnabled, setScrollZoomEnabled] = useState(false);

  const defaultLat = 25.2048;
  const defaultLng = 55.2708;

  const mapQuery = `${projectName}${location ? `, ${location}` : ""}, Dubai, UAE`;
  const externalMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}`;

  const handleOpenExternal = () => {
    window.open(externalMapsUrl, "_blank", "noopener,noreferrer");
  };

  useEffect(() => {
    if (latitude && longitude) {
      setCoordinates([latitude, longitude]);
      setIsLoading(false);
      return;
    }

    const geocodeLocation = async () => {
      try {
        const query = encodeURIComponent(mapQuery);
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=1`
        );
        const data = await response.json();
        if (data && data.length > 0) {
          setCoordinates([parseFloat(data[0].lat), parseFloat(data[0].lon)]);
        } else {
          setCoordinates([defaultLat, defaultLng]);
        }
      } catch (error) {
        console.error("Geocoding failed:", error);
        setCoordinates([defaultLat, defaultLng]);
      } finally {
        setIsLoading(false);
      }
    };

    geocodeLocation();
  }, [latitude, longitude, mapQuery, defaultLat, defaultLng]);

  if (isLoading) {
    return (
      <div className={`rounded-xl overflow-hidden border border-gold/30 bg-muted ${className}`} style={{ height: 450 }}>
        <div className="w-full h-full flex items-center justify-center">
          <div className="animate-pulse text-muted-foreground">Loading map...</div>
        </div>
      </div>
    );
  }

  if (!coordinates) {
    return (
      <div className={`rounded-xl overflow-hidden border border-gold/30 bg-muted ${className}`} style={{ height: 450 }}>
        <div className="w-full h-full flex flex-col items-center justify-center gap-4">
          <p className="text-muted-foreground">Unable to load map</p>
          <Button variant="secondary" size="sm" onClick={handleOpenExternal}>
            Open in Google Maps
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-xl overflow-hidden border border-gold/30 relative ${className}`} style={{ height: 450 }}>
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
        <DynamicTileLayer mapView={mapView} />
        <ScrollZoomEnabler enabled={scrollZoomEnabled} onEnable={() => setScrollZoomEnabled(true)} />
        <MapViewToggle 
          mapView={mapView} 
          onViewChange={setMapView}
          onOpenExternal={handleOpenExternal}
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
          <div className="bg-black/50 backdrop-blur-sm text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 pointer-events-none">
            <MousePointer className="w-4 h-4" />
            Click to enable map interaction
          </div>
        </div>
      )}
    </div>
  );
}
