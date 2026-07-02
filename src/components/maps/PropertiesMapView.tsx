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

function formatMarkerPrice(price: number | null | undefined) {
  if (!price) return "Ask";
  if (price >= 1000000) return `${(price / 1000000).toFixed(1)}M`;
  return `${Math.round(price / 1000)}K`;
}

function createEmeraldMarkerIcon(price: number | null | undefined, highlighted = false) {
  const priceText = formatMarkerPrice(price);
  const scale = highlighted ? 1.08 : 1;
  return L.divIcon({
    html: `
      <div class="jj-map-marker-pill" style="transform: scale(${scale});">
        ${priceText}
      </div>
    `,
    className: "custom-marker",
    iconSize: [72, 32] as [number, number],
    iconAnchor: [36, 32] as [number, number],
    popupAnchor: [0, -32] as [number, number],
  });
}

function DynamicTileLayer({ mapView, language }: { mapView: MapViewType; language: string }) {
  const map = useMap();
  const layerRef = useRef<L.TileLayer | null>(null);

  useEffect(() => {
    if (layerRef.current) map.removeLayer(layerRef.current);
    const tiles = getMapTiles(language);
    const { url, attribution, subdomains } = tiles[mapView];
    const tileOptions: L.TileLayerOptions = {
      attribution,
      maxZoom: 18,
      minZoom: 5,
      keepBuffer: 2,
      updateWhenIdle: true,
      updateWhenZooming: false,
      detectRetina: false,
      crossOrigin: true,
    };
    if (subdomains) tileOptions.subdomains = subdomains;
    layerRef.current = L.tileLayer(url, tileOptions);
    layerRef.current.addTo(map);
    return () => { if (layerRef.current) map.removeLayer(layerRef.current); };
  }, [mapView, language, map]);

  return null;
}

function MapViewToggle({ mapView, onViewChange, t }: { mapView: MapViewType; onViewChange: (v: MapViewType) => void; t: (key: string) => string }) {
  return (
    <div className="absolute top-4 left-4 z-[1000] flex flex-col gap-2">
      <div className="jj-map-layer-switcher">
        {(["satellite", "street", "terrain"] as MapViewType[]).map((view) => (
          <button
            key={view}
            onClick={() => onViewChange(view)}
            className="jj-map-layer-button"
            data-active={mapView === view ? "true" : "false"}
            data-surface={mapView === view ? "emerald" : "champagne"}
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
    map.fitBounds(bounds, { padding: [36, 36], maxZoom: 12, animate: false });
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
      <div className="h-full w-full rounded-xl overflow-hidden border border-white/15" style={{ touchAction: "pan-y" }} data-map-page data-map-shell>
        <MapContainer
          center={center}
          zoom={11}
          scrollWheelZoom={false}
          dragging={true}
          touchZoom={true}
          preferCanvas={true}
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
              icon={createEmeraldMarkerIcon(project.price_from, hoveredProjectId === project.id)}
              eventHandlers={{
                mouseover: (e: any) => {
                  e.target.openPopup();
                  onProjectHover(project.id);
                },
                mouseout: () => onProjectHover(null),
                click: () => onProjectClick(project.id),
              }}
            >
              <Popup className="jj-map-popup">
                <div className="min-w-[220px] max-w-[260px] jj-map-popup-card">
                  {project.cover_image_url && (
                    <img src={project.cover_image_url} alt={project.name} className="w-full h-32 object-cover" loading="lazy"  decoding="async" />
                  )}
                  <div className="p-3">
                    <Link to={`/project/${project.slug}`} className="font-bold text-sm block leading-tight mb-1">
                      {project.name}
                    </Link>
                    {project.developer_name && (
                      <p className="text-[11px]">{t('map.by')} {project.developer_name}</p>
                    )}
                    {project.price_from ? (
                      <p className="text-xs font-semibold mt-1">
                        {t('map.from')} AED {Math.round(Number(project.price_from)).toLocaleString()}
                      </p>
                    ) : (
                      <p className="text-xs font-semibold mt-1">{t('map.priceOnRequest')}</p>
                    )}
                    <div className="flex items-center gap-2 mt-1 text-[11px]">
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
                      <p className="text-[11px] mt-0.5">
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
