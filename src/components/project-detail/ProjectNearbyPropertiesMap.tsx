import { useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { MapNavigationControls } from "@/components/maps/MapNavigationControls";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { getMapTiles } from "@/constants/mapTiles";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Gold pin icon
const GOLD_PIN_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="32" height="42" viewBox="0 0 32 42" fill="none">
  <defs>
    <linearGradient id="gpin" x1="16" y1="0" x2="16" y2="38" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#B89555"/>
      <stop offset="100%" stop-color="#8B6914"/>
    </linearGradient>
  </defs>
  <path d="M16 0C7 0 0 7 0 16c0 12 16 26 16 26s16-14 16-26C32 7 25 0 16 0z" fill="url(#gpin)"/>
  <circle cx="16" cy="14" r="6" fill="white" opacity="0.9"/>
  <circle cx="16" cy="14" r="3" fill="#B89555"/>
</svg>`;

const GoldIcon = L.divIcon({
  html: GOLD_PIN_SVG,
  className: "gold-map-pin",
  iconSize: [32, 42],
  iconAnchor: [16, 42],
  popupAnchor: [0, -42],
});

// Red pin for current project
const RED_PIN_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="36" height="46" viewBox="0 0 36 46" fill="none">
  <defs>
    <linearGradient id="rpin" x1="18" y1="0" x2="18" y2="42" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#DC2626"/>
      <stop offset="100%" stop-color="#991B1B"/>
    </linearGradient>
  </defs>
  <path d="M18 0C8 0 0 8 0 18c0 14 18 28 18 28s18-14 18-28C36 8 28 0 18 0z" fill="url(#rpin)"/>
  <circle cx="18" cy="16" r="7" fill="white" opacity="0.9"/>
  <circle cx="18" cy="16" r="3.5" fill="#DC2626"/>
</svg>`;

const RedIcon = L.divIcon({
  html: RED_PIN_SVG,
  className: "gold-map-pin",
  iconSize: [36, 46],
  iconAnchor: [18, 46],
  popupAnchor: [0, -46],
});

interface ProjectNearbyPropertiesMapProps {
  currentProjectId: string;
  currentProjectName: string;
  latitude: number;
  longitude: number;
  areaName?: string | null;
  className?: string;
}

export default function ProjectNearbyPropertiesMap({
  currentProjectId,
  currentProjectName,
  latitude,
  longitude,
  areaName,
  className = "",
}: ProjectNearbyPropertiesMapProps) {
  const { t, language } = useLanguage();
  const tiles = getMapTiles(language);

  const { data: nearbyProjects } = useQuery({
    queryKey: ["nearby-projects-map", currentProjectId, areaName, latitude, longitude],
    queryFn: async () => {
      // 1) Try matching by area name
      if (areaName) {
        const { data } = await supabase
          .from("projects")
          .select("id, name, slug, latitude, longitude, price_from, cover_image_url")
          .neq("id", currentProjectId)
          .ilike("location", `%${areaName}%`)
          .not("latitude", "is", null)
          .not("longitude", "is", null)
          .limit(40);
        const valid = (data || []).filter(
          (p) =>
            typeof p.latitude === "number" &&
            typeof p.longitude === "number" &&
            !isNaN(p.latitude) &&
            !isNaN(p.longitude) &&
            !(p.latitude === 0 && p.longitude === 0),
        );
        if (valid.length > 0) return valid;
      }

      // 2) Fallback: lat/lng bounding box (~10km radius) so the map is never empty
      const delta = 0.1; // ~11km
      const { data } = await supabase
        .from("projects")
        .select("id, name, slug, latitude, longitude, price_from, cover_image_url")
        .neq("id", currentProjectId)
        .gte("latitude", latitude - delta)
        .lte("latitude", latitude + delta)
        .gte("longitude", longitude - delta)
        .lte("longitude", longitude + delta)
        .not("latitude", "is", null)
        .not("longitude", "is", null)
        .limit(40);
      return (data || []).filter(
        (p) =>
          typeof p.latitude === "number" &&
          typeof p.longitude === "number" &&
          !isNaN(p.latitude) &&
          !isNaN(p.longitude) &&
          !(p.latitude === 0 && p.longitude === 0),
      );
    },
    staleTime: 5 * 60 * 1000,
  });

  const markers = useMemo(() => nearbyProjects || [], [nearbyProjects]);

  if (markers.length === 0) return null;

  return (
    <div className={`rounded-2xl overflow-hidden ${className}`} style={{ height: 380, border: '2px solid hsl(42 45% 59% / 0.5)', boxShadow: '0 4px 16px rgba(200,167,102,0.15)' }}>
      <style>{`
        .gold-map-pin { background: none !important; border: none !important; }
      `}</style>
      <MapContainer
        center={[latitude, longitude]}
        zoom={13}
        scrollWheelZoom={false}
        touchZoom={true}
        dragging={true}
        style={{ height: "100%", width: "100%" }}
        zoomControl={false}
        attributionControl={false}
      >
        <TileLayer
          url={tiles.satellite.url}
          attribution={tiles.satellite.attribution}
          maxZoom={19}
        />
        <MapNavigationControls latitude={latitude} longitude={longitude} />

        {/* Current project marker (red) */}
        <Marker position={[latitude, longitude]} icon={RedIcon}>
          <Popup>
            <div className="min-w-[180px] max-w-[260px]">
              <div className="p-3">
                <div className="text-sm font-bold">{currentProjectName}</div>
                <div className="text-xs text-muted-foreground">{t('map.thisProject')}</div>
              </div>
            </div>
          </Popup>
        </Marker>

        {/* Nearby projects (gold) */}
        {markers.map((p) => (
          <Marker key={p.id} position={[p.latitude!, p.longitude!]} icon={GoldIcon}>
            <Popup>
              <div className="min-w-[200px] max-w-[280px]">
                {p.cover_image_url && (
                  <img src={p.cover_image_url} alt={p.name} className="w-full h-24 object-cover" loading="lazy" />
                )}
                <div className="p-3">
                  <Link to={`/project/${p.slug}`} className="text-sm font-semibold text-blue-600 hover:underline block">
                    {p.name}
                  </Link>
                  {p.price_from && (
                    <p className="text-xs font-semibold text-amber-700 mt-1">
                      From AED {Math.round(Number(p.price_from)).toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
