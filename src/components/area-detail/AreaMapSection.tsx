import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { Link } from "react-router-dom";
import { Map as MapIcon, Maximize } from "lucide-react";
import { MapNavigationControls } from "@/components/maps/MapNavigationControls";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix leaflet default marker icons
const defaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

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

interface AreaMapSectionProps {
  areaName: string;
  areaLat?: number | null;
  areaLng?: number | null;
}

export const AreaMapSection = ({ areaName, areaLat, areaLng }: AreaMapSectionProps) => {
  const [mapView, setMapView] = useState<MapViewType>("satellite");

  const { data: projects } = useQuery({
    queryKey: ["area-map-projects", areaName],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("id, name, slug, latitude, longitude, developer_name, cover_image_url, price_from, handover_date, developer:developers(logo_url)")
        .ilike("area_name", `%${areaName}%`)
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
  const handleOpenExternal = () => {
    window.open(externalMapsUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <section className="py-16 bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3]">
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-3 mb-8">
          <MapIcon className="w-6 h-6 text-gold" />
          <h2 className="text-2xl md:text-3xl font-bold text-black" style={{ fontFamily: "Poppins, sans-serif" }}>
            Map of {areaName}
          </h2>
        </div>

        <div className="rounded-xl overflow-hidden border border-gold/30 shadow-2xl" style={{ height: 500, touchAction: "none" }}>
          <MapContainer
            center={center}
            zoom={13}
            scrollWheelZoom={true}
            dragging={true}
            touchZoom={true}
            style={{ height: "100%", width: "100%" }}
            zoomControl={false}
            attributionControl={false}
          >
            <DynamicTileLayer mapView={mapView} />
            <MapViewToggle
              mapView={mapView}
              onViewChange={setMapView}
              onOpenExternal={handleOpenExternal}
            />
            <MapNavigationControls latitude={center[0]} longitude={center[1]} />
            {projectsWithCoords.map((project: any) => (
              <Marker
                key={project.id}
                position={[Number(project.latitude), Number(project.longitude)]}
                icon={defaultIcon}
                eventHandlers={{
                  mouseover: (e: any) => e.target.openPopup(),
                }}
              >
                <Popup>
                  <div className="min-w-[200px] max-w-[240px]">
                    {project.cover_image_url && (
                      <img src={project.cover_image_url} alt={project.name} className="w-full h-28 object-cover rounded mb-2" />
                    )}
                    <div className="flex items-center gap-2 mb-1">
                      {project.developer_logo && (
                        <img src={project.developer_logo} alt="" className="w-6 h-6 object-contain rounded" />
                      )}
                      <Link to={`/project/${project.slug}`} className="font-bold text-sm text-blue-600 hover:underline block leading-tight">
                        {project.name}
                      </Link>
                    </div>
                    {project.developer_name && (
                      <p className="text-[11px] text-zinc-500">by {project.developer_name}</p>
                    )}
                    {project.price_from && (
                      <p className="text-xs font-semibold text-amber-700 mt-1">
                        From AED {Number(project.price_from).toLocaleString()}
                      </p>
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
      </div>
    </section>
  );
};
