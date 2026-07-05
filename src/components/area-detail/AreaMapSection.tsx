import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { Link } from "react-router-dom";
import { Map as MapIcon, Maximize } from "lucide-react";
import { MapNavigationControls } from "@/components/maps/MapNavigationControls";
import { useLanguage } from "@/contexts/LanguageContext";
import { getMapTiles, type MapViewType } from "@/constants/mapTiles";
import { SAFE_LEAFLET_MAP_OPTIONS, SAFE_TILE_LAYER_OPTIONS, safelyRemoveLayer } from "@/utils/leafletSafety";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

const formatMarkerPrice = (price: number | null | undefined) => {
  if (!price) return "Ask";
  if (price >= 1000000) return `${(price / 1000000).toFixed(1)}M`;
  return `${Math.round(price / 1000)}K`;
};

const createEmeraldMarkerIcon = (price: number | null | undefined) => L.divIcon({
  className: "custom-marker",
  html: `<div class="jj-map-marker-pill">${formatMarkerPrice(price)}</div>`,
  iconSize: [72, 32],
  iconAnchor: [36, 32],
  popupAnchor: [0, -32],
});

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

function EnableMapInteraction({ enabled }: { enabled: boolean }) {
  const map = useMap();
  useEffect(() => {
    if (enabled) {
      map.scrollWheelZoom.enable();
      map.touchZoom.enable();
    }
  }, [enabled, map]);
  return null;
}

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
      <a
        href={externalUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="jj-map-square-control"
        data-surface="emerald"
        aria-label={t('map.openInGoogleMaps')}
      >
        <Maximize className="w-5 h-5" />
      </a>
    </div>
  );
}

interface AreaMapSectionProps {
  areaName: string;
  areaLat?: number | null;
  areaLng?: number | null;
}

export const AreaMapSection = ({ areaName, areaLat, areaLng }: AreaMapSectionProps) => {
  const { t, language } = useLanguage();
  const [mapView, setMapView] = useState<MapViewType>("satellite");
  const [mapInteractive, setMapInteractive] = useState(false);

  const { data: projects } = useQuery({
    queryKey: ["area-map-projects", areaName],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("id, name, slug, latitude, longitude, developer_name, cover_image_url, price_from, handover_date, developer:developers(logo_url)")
        .ilike("area_name", `%${areaName}%`)
        .or("listing_kind.is.null,listing_kind.neq.leasing")
        .not("latitude", "is", null)
        .not("longitude", "is", null)
        .limit(50);
      if (error) throw error;
      return (data || []).map((p: any) => ({
        ...p,
        developer_logo: p.developer?.[0]?.logo_url || p.developer?.logo_url || null,
      }));
    },
    staleTime: 5 * 60 * 1000,
  });

  const projectsWithCoords = projects?.filter(p => p.latitude && p.longitude) || [];

  let center: [number, number] = [25.2048, 55.2708];
  if (projectsWithCoords.length > 0) {
    const avgLat = projectsWithCoords.reduce((s, p) => s + Number(p.latitude), 0) / projectsWithCoords.length;
    const avgLng = projectsWithCoords.reduce((s, p) => s + Number(p.longitude), 0) / projectsWithCoords.length;
    center = [avgLat, avgLng];
  } else if (areaLat && areaLng) {
    center = [areaLat, areaLng];
  }

  if (projectsWithCoords.length === 0 && !areaLat) return null;

  const externalMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${areaName}, Dubai, UAE`)}`;

  return (
    <section className="py-16 bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6]">
      <div className="mx-1 sm:mx-2 md:mx-3 lg:mx-4">
        <div className="flex items-center gap-3 mb-8">
          <MapIcon className="w-6 h-6 text-[#1A1A1A]" />
          <h2 className="text-2xl md:text-3xl font-bold text-[#1A1A1A]">
            {t('map.mapOf')} {areaName}
          </h2>
        </div>

        <div data-map-shell className="rounded-xl overflow-hidden border border-white/15 shadow-2xl relative" style={{ height: 500, touchAction: "none" }}>
          {/* Click to enable overlay */}
          {!mapInteractive && (
            <div
              className="absolute inset-0 z-[500] flex items-center justify-center cursor-pointer bg-[#1A1A1A]/5"
              onClick={() => setMapInteractive(true)}
            >
              <div className="jj-map-enable-chip px-4 py-2 rounded-full text-sm font-medium">
                {t('map.clickToEnable')}
              </div>
            </div>
          )}
          <MapContainer
            center={center}
            zoom={13}
            scrollWheelZoom={false}
            dragging={true}
            touchZoom={false}
            preferCanvas={true}
            style={{ height: "100%", width: "100%" }}
            zoomControl={false}
            attributionControl={false}
            {...SAFE_LEAFLET_MAP_OPTIONS}
          >

            <DynamicTileLayer mapView={mapView} language={language} />
            <EnableMapInteraction enabled={mapInteractive} />
            <MapViewToggle
              mapView={mapView}
              onViewChange={setMapView}
              externalUrl={externalMapsUrl}
              t={t}
            />
            <MapNavigationControls latitude={center[0]} longitude={center[1]} />
            {projectsWithCoords.map((project: any) => (
              <Marker
                key={project.id}
                position={[Number(project.latitude), Number(project.longitude)]}
                icon={createEmeraldMarkerIcon(project.price_from)}
                eventHandlers={{
                  mouseover: (e: any) => e.target.openPopup(),
                }}
              >
                <Popup className="jj-map-popup">
                  <div className="jj-map-popup-card min-w-[220px] max-w-[260px]">
                    {project.cover_image_url && (
                      <img src={project.cover_image_url} alt={project.name} className="w-full h-32 object-cover" loading="eager" decoding="async" {...({ fetchpriority: "high" } as any)} />
                    )}
                      <div className="p-3">
                      <div className="flex items-center gap-2 mb-1">
                        {project.developer_logo && (
                          <img src={project.developer_logo} alt="" className="w-6 h-6 object-contain rounded" loading="eager" decoding="async" {...({ fetchpriority: "high" } as any)} />
                        )}
                        <Link to={`/project/${project.slug}`} className="font-bold text-sm hover:underline block leading-tight">
                          {project.name}
                        </Link>
                      </div>
                      {project.developer_name && (
                        <p className="text-[11px]">{t('map.by')} {project.developer_name}</p>
                      )}
                      {project.price_from && (
                        <p className="text-xs font-semibold mt-1">
                          {t('map.from')} AED {Math.round(Number(project.price_from)).toLocaleString()}
                        </p>
                      )}
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
      </div>
    </section>
  );
};
