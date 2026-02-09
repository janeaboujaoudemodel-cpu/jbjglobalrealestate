import { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { Button } from "@/components/ui/button";
import { Layers, Navigation, ZoomIn, ZoomOut, Maximize } from "lucide-react";
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

// Control component for map operations
function MapControls({ 
  mapView, 
  onViewChange,
  onOpenExternal,
}: { 
  mapView: MapViewType; 
  onViewChange: (view: MapViewType) => void;
  onOpenExternal: () => void;
}) {
  const map = useMap();

  const handleZoomIn = () => map.zoomIn();
  const handleZoomOut = () => map.zoomOut();
  const handleRecenter = () => {
    const center = map.getCenter();
    map.setView(center, 15, { animate: true });
  };

  return (
    <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
      {/* View Toggle */}
      <div className="bg-card/95 backdrop-blur-sm rounded-lg border border-gold/30 shadow-lg p-1 flex flex-col gap-1">
        <button
          onClick={() => onViewChange("satellite")}
          className={`px-3 py-1.5 text-xs font-medium rounded transition-all ${
            mapView === "satellite" 
              ? "bg-gold text-foreground" 
              : "hover:bg-gold/20 text-muted-foreground"
          }`}
        >
          Satellite
        </button>
        <button
          onClick={() => onViewChange("street")}
          className={`px-3 py-1.5 text-xs font-medium rounded transition-all ${
            mapView === "street" 
              ? "bg-gold text-foreground" 
              : "hover:bg-gold/20 text-muted-foreground"
          }`}
        >
          Street
        </button>
        <button
          onClick={() => onViewChange("terrain")}
          className={`px-3 py-1.5 text-xs font-medium rounded transition-all ${
            mapView === "terrain" 
              ? "bg-gold text-foreground" 
              : "hover:bg-gold/20 text-muted-foreground"
          }`}
        >
          Terrain
        </button>
      </div>

      {/* Zoom Controls */}
      <div className="bg-card/95 backdrop-blur-sm rounded-lg border border-gold/30 shadow-lg p-1 flex flex-col gap-1">
        <button
          onClick={handleZoomIn}
          className="p-2 hover:bg-gold/20 rounded transition-all"
          aria-label="Zoom in"
        >
          <ZoomIn className="w-4 h-4 text-foreground" />
        </button>
        <button
          onClick={handleZoomOut}
          className="p-2 hover:bg-gold/20 rounded transition-all"
          aria-label="Zoom out"
        >
          <ZoomOut className="w-4 h-4 text-foreground" />
        </button>
        <button
          onClick={handleRecenter}
          className="p-2 hover:bg-gold/20 rounded transition-all"
          aria-label="Recenter"
        >
          <Navigation className="w-4 h-4 text-foreground" />
        </button>
      </div>

      {/* Open External */}
      <button
        onClick={onOpenExternal}
        className="bg-card/95 backdrop-blur-sm rounded-lg border border-gold/30 shadow-lg p-2 hover:bg-gold/20 transition-all"
        aria-label="Open in Google Maps"
      >
        <Maximize className="w-4 h-4 text-foreground" />
      </button>
    </div>
  );
}

// Tile layer switcher component
function DynamicTileLayer({ mapView }: { mapView: MapViewType }) {
  const map = useMap();
  const layerRef = useRef<L.TileLayer | null>(null);

  useEffect(() => {
    // Remove existing layer
    if (layerRef.current) {
      map.removeLayer(layerRef.current);
    }

    // Add new layer
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

  // Default to Dubai coordinates if not provided
  const defaultLat = 25.2048;
  const defaultLng = 55.2708;

  // Build external maps URL
  const mapQuery = `${projectName}${location ? `, ${location}` : ""}, Dubai, UAE`;
  const externalMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}`;

  const handleOpenExternal = () => {
    window.open(externalMapsUrl, "_blank", "noopener,noreferrer");
  };

  // Geocode location if no coordinates provided
  useEffect(() => {
    if (latitude && longitude) {
      setCoordinates([latitude, longitude]);
      setIsLoading(false);
      return;
    }

    // Use Nominatim for geocoding (free, no API key needed)
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
          // Fallback to default Dubai coordinates
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
    <div className={`rounded-xl overflow-hidden border border-gold/30 ${className}`} style={{ height: 450 }}>
      <MapContainer
        center={coordinates}
        zoom={15}
        scrollWheelZoom={true}
        style={{ height: "100%", width: "100%" }}
        zoomControl={false}
        attributionControl={false}
      >
        <DynamicTileLayer mapView={mapView} />
        <MapControls 
          mapView={mapView} 
          onViewChange={setMapView}
          onOpenExternal={handleOpenExternal}
        />
        <Marker position={coordinates}>
          <Popup>
            <div className="text-sm font-medium">{projectName}</div>
            {location && <div className="text-xs text-muted-foreground">{location}</div>}
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}