import { useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { MapNavigationControls } from "@/components/maps/MapNavigationControls";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { getMapTiles } from "@/constants/mapTiles";
import { PricePill } from "@/components/ui/price-pill";
import { DeveloperLink } from "@/components/ui/developer-link";
import { pushBackStack } from "@/lib/browsingHistory";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Red pin — current project
const RED_PIN_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="36" height="46" viewBox="0 0 36 46" fill="none">
  <defs>
    <linearGradient id="rpin" x1="18" y1="0" x2="18" y2="42" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#DC2626"/>
      <stop offset="100%" stop-color="#991B1B"/>
    </linearGradient>
  </defs>
  <path d="M18 0C8 0 0 8 0 18c0 14 18 28 18 28s18-14 18-28C36 8 28 0 18 0z" fill="url(#rpin)"/>
  <circle cx="18" cy="16" r="7" fill="white" opacity="0.95"/>
  <circle cx="18" cy="16" r="3.5" fill="#DC2626"/>
</svg>`;

const RedIcon = L.divIcon({
  html: RED_PIN_SVG,
  className: "jj-map-pin",
  iconSize: [36, 46],
  iconAnchor: [18, 46],
  popupAnchor: [0, -46],
});

// Blue pin — other developers in this area
const BLUE_PIN_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="32" height="42" viewBox="0 0 32 42" fill="none">
  <defs>
    <linearGradient id="bpin" x1="16" y1="0" x2="16" y2="38" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#1D4ED8"/>
      <stop offset="100%" stop-color="#1E3A8A"/>
    </linearGradient>
  </defs>
  <path d="M16 0C7 0 0 7 0 16c0 12 16 26 16 26s16-14 16-26C32 7 25 0 16 0z" fill="url(#bpin)"/>
  <circle cx="16" cy="14" r="6" fill="white" opacity="0.95"/>
  <circle cx="16" cy="14" r="3" fill="#1D4ED8"/>
</svg>`;

const BlueIcon = L.divIcon({
  html: BLUE_PIN_SVG,
  className: "jj-map-pin",
  iconSize: [32, 42],
  iconAnchor: [16, 42],
  popupAnchor: [0, -42],
});

interface ProjectNearbyPropertiesMapProps {
  currentProjectId: string;
  currentProjectName: string;
  currentProjectSlug?: string | null;
  latitude: number;
  longitude: number;
  areaName?: string | null;
  className?: string;
}

type NearbyRow = {
  id: string;
  name: string;
  slug: string | null;
  latitude: number | null;
  longitude: number | null;
  price_from: number | null;
  cover_image_url: string | null;
  developer_name: string | null;
  developer_slug: string | null;
};

export default function ProjectNearbyPropertiesMap({
  currentProjectId,
  currentProjectName,
  currentProjectSlug,
  latitude,
  longitude,
  areaName,
  className = "",
}: ProjectNearbyPropertiesMapProps) {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const tiles = getMapTiles(language);

  const { data: nearbyProjects } = useQuery({
    queryKey: ["nearby-projects-map", currentProjectId, areaName, latitude, longitude],
    queryFn: async (): Promise<NearbyRow[]> => {
      const select =
        "id, name, slug, latitude, longitude, price_from, cover_image_url, developer:developers(name, slug)";

      const shape = (rows: any[]): NearbyRow[] =>
        (rows || [])
          .map((p) => ({
            id: p.id,
            name: p.name,
            slug: p.slug ?? null,
            latitude: p.latitude,
            longitude: p.longitude,
            price_from: p.price_from,
            cover_image_url: p.cover_image_url,
            developer_name: p.developer?.name ?? null,
            developer_slug: p.developer?.slug ?? null,
          }))
          .filter(
            (p) =>
              typeof p.latitude === "number" &&
              typeof p.longitude === "number" &&
              !isNaN(p.latitude) &&
              !isNaN(p.longitude) &&
              !(p.latitude === 0 && p.longitude === 0),
          );

      // 1) Try matching by area name
      if (areaName) {
        const { data } = await supabase
          .from("projects")
          .select(select)
          .neq("id", currentProjectId)
          .ilike("location", `%${areaName}%`)
          .not("latitude", "is", null)
          .not("longitude", "is", null)
          .limit(40);
        const valid = shape(data as any[]);
        if (valid.length > 0) return valid;
      }

      // 2) Fallback: lat/lng bounding box (~11 km radius)
      const delta = 0.1;
      const { data } = await supabase
        .from("projects")
        .select(select)
        .neq("id", currentProjectId)
        .gte("latitude", latitude - delta)
        .lte("latitude", latitude + delta)
        .gte("longitude", longitude - delta)
        .lte("longitude", longitude + delta)
        .not("latitude", "is", null)
        .not("longitude", "is", null)
        .limit(40);
      return shape(data as any[]);
    },
    staleTime: 5 * 60 * 1000,
  });

  const markers = useMemo(() => nearbyProjects || [], [nearbyProjects]);

  if (markers.length === 0) return null;

  const handleOpenNearby = (slug: string | null) => {
    if (!slug) return;
    if (currentProjectSlug) {
      pushBackStack({ slug: currentProjectSlug, name: currentProjectName });
    }
    navigate(`/project/${slug}`);
  };

  return (
    <div
      className={`rounded-2xl overflow-hidden ${className}`}
      style={{
        height: 380,
        border: "1px solid rgba(184,149,85,0.40)",
        boxShadow: "0 4px 16px rgba(184,149,85,0.15)",
      }}
    >
      <style>{`
        .jj-map-pin { background: none !important; border: none !important; }
        .leaflet-popup-content-wrapper { border-radius: 12px; border: 1px solid rgba(184,149,85,0.35); }
        .leaflet-popup-content { margin: 0; }
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
        <TileLayer url={tiles.satellite.url} attribution={tiles.satellite.attribution} maxZoom={19} />
        <MapNavigationControls latitude={latitude} longitude={longitude} />

        {/* Current project marker (red) */}
        <Marker position={[latitude, longitude]} icon={RedIcon}>
          <Popup>
            <div className="min-w-[200px] max-w-[260px] p-3">
              <div className="text-sm font-bold text-[#1A1A1A]">{currentProjectName}</div>
              <div className="text-xs text-[#1A1A1A]/70 mt-1">
                {t("map.thisProject") || "This project"}
              </div>
            </div>
          </Popup>
        </Marker>

        {/* Nearby projects (blue) */}
        {markers.map((p) => (
          <Marker key={p.id} position={[p.latitude!, p.longitude!]} icon={BlueIcon}>
            <Popup>
              <div className="min-w-[220px] max-w-[280px]">
                {p.cover_image_url && (
                  <img
                    src={p.cover_image_url}
                    alt={p.name}
                    className="w-full h-24 object-cover"
                    loading="lazy"
                  />
                )}
                <div className="p-3 space-y-2">
                  {p.slug ? (
                    <button
                      type="button"
                      onClick={() => handleOpenNearby(p.slug)}
                      className="text-sm font-semibold text-[#1A1A1A] hover:underline text-left block w-full"
                    >
                      {p.name}
                    </button>
                  ) : (
                    <div className="text-sm font-semibold text-[#1A1A1A]">{p.name}</div>
                  )}

                  {p.developer_name && (
                    <div className="text-xs">
                      <DeveloperLink
                        name={p.developer_name}
                        slug={p.developer_slug}
                        className="text-xs"
                      />
                    </div>
                  )}

                  {typeof p.price_from === "number" && p.price_from > 0 && (
                    <PricePill price={p.price_from} className="text-xs" />
                  )}

                  {currentProjectSlug && p.slug && (
                    <button
                      type="button"
                      onClick={() => handleOpenNearby(p.slug)}
                      className="mt-1 text-[11px] font-medium text-[#1A1A1A]/70 hover:text-[#1A1A1A] underline underline-offset-2"
                    >
                      Open & remember {currentProjectName} →
                    </button>
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
