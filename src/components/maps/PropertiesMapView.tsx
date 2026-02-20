import { useState, useEffect, useRef, useMemo } from "react";
import { MapContainer, Marker, Popup, useMap } from "react-leaflet";
import { Link } from "react-router-dom";
import { MapNavigationControls } from "@/components/maps/MapNavigationControls";
import { MapErrorBoundary } from "@/components/MapErrorBoundary";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import type { UnifiedProject } from "@/types/unifiedProject";

// Default marker icon
const defaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

const highlightedIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [32, 52],
  iconAnchor: [16, 52],
  popupAnchor: [1, -40],
  className: "highlighted-marker",
});

type MapViewType = "satellite" | "street" | "terrain";

const MAP_TILES: Record<MapViewType, { url: string; attribution: string }> = {
  satellite: {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: "Tiles &copy; Esri",
  },
  street: {
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: '&copy; OpenStreetMap',
  },
  terrain: {
    url: "https://stamen-tiles-{s}.a.ssl.fastly.net/terrain/{z}/{x}/{y}{r}.png",
    attribution: 'Stamen Design',
  },
};

function DynamicTileLayer({ mapView }: { mapView: MapViewType }) {
  const map = useMap();
  const layerRef = useRef<L.TileLayer | null>(null);

  useEffect(() => {
    if (layerRef.current) map.removeLayer(layerRef.current);
    const { url, attribution } = MAP_TILES[mapView];
    layerRef.current = L.tileLayer(url, { attribution, maxZoom: 19 });
    layerRef.current.addTo(map);
    return () => { if (layerRef.current) map.removeLayer(layerRef.current); };
  }, [mapView, map]);

  return null;
}

function MapViewToggle({ mapView, onViewChange }: { mapView: MapViewType; onViewChange: (v: MapViewType) => void }) {
  return (
    <div className="absolute top-4 left-4 z-[1000] flex flex-col gap-2">
      <div className="bg-card/95 backdrop-blur-sm rounded-lg border border-gold/40 shadow-lg p-1 flex flex-col gap-1">
        {(["satellite", "street", "terrain"] as MapViewType[]).map((view) => (
          <button
            key={view}
            onClick={() => onViewChange(view)}
            className={`px-3 py-2 text-xs font-medium rounded transition-all ${
              mapView === view ? "bg-gold text-foreground" : "hover:bg-gold/20 text-muted-foreground"
            }`}
          >
            {view.charAt(0).toUpperCase() + view.slice(1)}
          </button>
        ))}
      </div>
    </div>
  );
}

function FitBounds({ projects }: { projects: { lat: number; lng: number }[] }) {
  const map = useMap();
  useEffect(() => {
    if (projects.length === 0) return;
    const bounds = L.latLngBounds(projects.map(p => [p.lat, p.lng]));
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
  }, [projects, map]);
  return null;
}

interface PropertiesMapViewProps {
  projects: UnifiedProject[];
  hoveredProjectId: string | null;
  onProjectHover: (id: string | null) => void;
  onProjectClick: (id: string) => void;
}

export default function PropertiesMapView({ projects, hoveredProjectId, onProjectHover, onProjectClick }: PropertiesMapViewProps) {
  const [mapView, setMapView] = useState<MapViewType>("satellite");

  const projectsWithCoords = useMemo(
    () => projects.filter(p =>
      p.latitude != null && p.longitude != null &&
      !isNaN(Number(p.latitude)) && !isNaN(Number(p.longitude)) &&
      Number(p.latitude) !== 0 && Number(p.longitude) !== 0
    ).map(p => ({
      ...p,
      lat: Number(p.latitude),
      lng: Number(p.longitude),
    })),
    [projects]
  );

  const center: [number, number] = useMemo(() => {
    if (projectsWithCoords.length === 0) return [25.2048, 55.2708];
    const avgLat = projectsWithCoords.reduce((s, p) => s + p.lat, 0) / projectsWithCoords.length;
    const avgLng = projectsWithCoords.reduce((s, p) => s + p.lng, 0) / projectsWithCoords.length;
    return [avgLat, avgLng];
  }, [projectsWithCoords]);

  return (
    <MapErrorBoundary>
      <div className="h-full w-full rounded-xl overflow-hidden border border-gold/30" style={{ touchAction: "pan-y" }}>
        <MapContainer
          center={center}
          zoom={11}
          scrollWheelZoom={false}
          dragging={true}
          touchZoom={true}
          style={{ height: "100%", width: "100%" }}
          zoomControl={false}
          attributionControl={false}
        >
          <DynamicTileLayer mapView={mapView} />
          <MapViewToggle mapView={mapView} onViewChange={setMapView} />
          <MapNavigationControls latitude={center[0]} longitude={center[1]} />
          <FitBounds projects={projectsWithCoords} />

          {projectsWithCoords.map((project) => (
            <Marker
              key={project.id}
              position={[project.lat, project.lng]}
              icon={hoveredProjectId === project.id ? highlightedIcon : defaultIcon}
              eventHandlers={{
                mouseover: (e: any) => {
                  e.target.openPopup();
                  onProjectHover(project.id);
                },
                mouseout: () => onProjectHover(null),
                click: () => onProjectClick(project.id),
              }}
            >
              <Popup>
                <div className="min-w-[200px] max-w-[240px]">
                  {project.cover_image_url && (
                    <img src={project.cover_image_url} alt={project.name} className="w-full h-28 object-cover rounded mb-2" loading="lazy" />
                  )}
                  <div className="flex items-center gap-2 mb-1">
                    <Link to={`/project/${project.slug}`} className="font-bold text-sm text-blue-600 hover:underline block leading-tight">
                      {project.name}
                    </Link>
                  </div>
                  {project.developer_name && (
                    <p className="text-[11px] text-zinc-500">by {project.developer_name}</p>
                  )}
                  {project.price_from ? (
                    <p className="text-xs font-semibold text-amber-700 mt-1">
                      From AED {Math.round(Number(project.price_from)).toLocaleString()}
                    </p>
                  ) : (
                    <p className="text-xs font-semibold text-amber-700 mt-1">Price on request</p>
                  )}
                  {project.handover_date && (
                    <p className="text-[11px] text-orange-500 mt-0.5">
                      Handover: {project.handover_date}
                    </p>
                  )}
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </MapErrorBoundary>
  );
}
