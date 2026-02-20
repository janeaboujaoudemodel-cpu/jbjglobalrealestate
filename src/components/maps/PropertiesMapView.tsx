import { useState, useEffect, useRef, useMemo } from "react";
import { MapContainer, Marker, Popup, useMap } from "react-leaflet";
import { Link } from "react-router-dom";
import { MapNavigationControls } from "@/components/maps/MapNavigationControls";
import { MapErrorBoundary } from "@/components/MapErrorBoundary";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import type { UnifiedProject } from "@/types/unifiedProject";

// Custom gold SVG marker pin
function createGoldMarkerIcon(highlighted = false) {
  const size = highlighted ? 44 : 34;
  const svg = `
    <svg width="${size}" height="${size + 8}" viewBox="0 0 34 42" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="pinGrad" cx="40%" cy="30%" r="70%">
          <stop offset="0%" stop-color="#F5D78E"/>
          <stop offset="60%" stop-color="#C8A766"/>
          <stop offset="100%" stop-color="#A07840"/>
        </radialGradient>
        <filter id="shadow" x="-30%" y="-10%" width="160%" height="160%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="rgba(0,0,0,0.35)"/>
        </filter>
      </defs>
      <!-- Pin body -->
      <path d="M17 1C9.82 1 4 6.82 4 14c0 9.33 13 26 13 26S30 23.33 30 14C30 6.82 24.18 1 17 1z"
            fill="url(#pinGrad)" stroke="#8B6914" stroke-width="1.2" filter="url(#shadow)"/>
      <!-- Inner circle -->
      <circle cx="17" cy="14" r="5.5" fill="white" opacity="0.92"/>
      <circle cx="17" cy="14" r="3.5" fill="#C8A766"/>
    </svg>
  `;
  const anchor = highlighted ? [22, 52] : [17, 42];
  return L.divIcon({
    html: svg,
    className: '',
    iconSize: [size, size + 8] as [number, number],
    iconAnchor: anchor as [number, number],
    popupAnchor: [0, -(size + 4)] as [number, number],
  });
}

const defaultIcon = createGoldMarkerIcon(false);
const highlightedIcon = createGoldMarkerIcon(true);

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
