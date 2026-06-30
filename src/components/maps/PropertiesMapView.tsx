import { useState, useEffect, useRef, useMemo } from "react";
import { MapContainer, Marker, Popup, useMap } from "react-leaflet";
import { Link } from "react-router-dom";
import { MapNavigationControls } from "@/components/maps/MapNavigationControls";
import { MapErrorBoundary } from "@/components/MapErrorBoundary";
import { useLanguage } from "@/contexts/LanguageContext";
import { getMapTiles, type MapViewType } from "@/constants/mapTiles";
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
          <stop offset="60%" stop-color="#B89555"/>
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
      <circle cx="17" cy="14" r="3.5" fill="#B89555"/>
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

function DynamicTileLayer({ mapView, language }: { mapView: MapViewType; language: string }) {
  const map = useMap();
  const layerRef = useRef<L.TileLayer | null>(null);

  useEffect(() => {
    if (layerRef.current) map.removeLayer(layerRef.current);
    const tiles = getMapTiles(language);
    const { url, attribution } = tiles[mapView];
    layerRef.current = L.tileLayer(url, { attribution, maxZoom: 19 });
    layerRef.current.addTo(map);
    return () => { if (layerRef.current) map.removeLayer(layerRef.current); };
  }, [mapView, language, map]);

  return null;
}

function MapViewToggle({ mapView, onViewChange, t }: { mapView: MapViewType; onViewChange: (v: MapViewType) => void; t: (key: string) => string }) {
  return (
    <div className="absolute top-4 left-4 z-[1000] flex flex-col gap-2">
      <div className="bg-card/95 backdrop-blur-sm rounded-lg border border-[#B89555]/40 shadow-lg p-1 flex flex-col gap-1">
        {(["satellite", "street", "terrain"] as MapViewType[]).map((view) => (
          <button
            key={view}
            onClick={() => onViewChange(view)}
            className={`px-3 py-2 text-xs font-medium rounded transition-all ${
              mapView === view ? "bg-[#EFE6D6] text-foreground" : "hover:bg-[#EFE6D6]/20 text-muted-foreground"
            }`}
          >
            {t(`map.${view}`)}
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
  const { t, language } = useLanguage();
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
      <div className="h-full w-full rounded-xl overflow-hidden border border-[#B89555]/30" style={{ touchAction: "pan-y" }}>
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
          <DynamicTileLayer mapView={mapView} language={language} />
          <MapViewToggle mapView={mapView} onViewChange={setMapView} t={t} />
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
                <div className="min-w-[220px] max-w-[260px]">
                  {project.cover_image_url && (
                    <img src={project.cover_image_url} alt={project.name} className="w-full h-32 object-cover" loading="lazy"  decoding="async" />
                  )}
                  <div className="p-3">
                    <Link to={`/project/${project.slug}`} className="font-bold text-sm text-blue-600 hover:underline block leading-tight mb-1">
                      {project.name}
                    </Link>
                    {project.developer_name && (
                      <p className="text-[11px] text-[#1A1A1A]/70">{t('map.by')} {project.developer_name}</p>
                    )}
                    {project.price_from ? (
                      <p className="text-xs font-semibold text-orange-600 mt-1">
                        {t('map.from')} AED {Math.round(Number(project.price_from)).toLocaleString()}
                      </p>
                    ) : (
                      <p className="text-xs font-semibold text-orange-600 mt-1">{t('map.priceOnRequest')}</p>
                    )}
                    <div className="flex items-center gap-2 mt-1 text-[11px] text-[#1A1A1A]/70">
                      {(project.bedrooms_min != null || project.bedrooms_max != null) && (
                        <span>
                          {project.bedrooms_min === 0 ? 'Studio' : `${project.bedrooms_min ?? '?'}`}
                          {project.bedrooms_max != null && project.bedrooms_max !== project.bedrooms_min ? ` - ${project.bedrooms_max} BR` : project.bedrooms_min !== 0 ? ' BR' : ''}
                        </span>
                      )}
                      {project.size_min != null && (
                        <span>{Math.round(Number(project.size_min)).toLocaleString()} sqft</span>
                      )}
                    </div>
                    {project.handover_date && (
                      <p className="text-[11px] text-orange-500 mt-0.5">
                        {t('map.handover')}: {project.handover_date}
                      </p>
                    )}
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </MapErrorBoundary>
  );
}
