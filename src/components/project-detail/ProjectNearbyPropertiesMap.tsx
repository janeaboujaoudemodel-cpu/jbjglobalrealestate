import { useMemo, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { MapNavigationControls } from "@/components/maps/MapNavigationControls";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { getMapTiles } from "@/constants/mapTiles";
import { SAFE_LEAFLET_MAP_OPTIONS, SAFE_TILE_LAYER_OPTIONS } from "@/utils/leafletSafety";
import { PricePill } from "@/components/ui/price-pill";
import { DeveloperLink } from "@/components/ui/developer-link";
import { pushBackStack } from "@/lib/browsingHistory";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

type FilterMode = "all" | "developer" | "area";

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

const formatMarkerPrice = (price: number | null | undefined) => {
  if (!price) return "Ask";
  if (price >= 1000000) return `${(price / 1000000).toFixed(1)}M`;
  return `${Math.round(price / 1000)}K`;
};

const createEmeraldMarkerIcon = (price: number | null | undefined) => L.divIcon({
  html: `<div class="jj-map-marker-pill">${formatMarkerPrice(price)}</div>`,
  className: "custom-marker",
  iconSize: [72, 32],
  iconAnchor: [36, 32],
  popupAnchor: [0, -32],
});

interface ProjectNearbyPropertiesMapProps {
  currentProjectId: string;
  currentProjectName: string;
  currentProjectSlug?: string | null;
  currentDeveloperId?: string | null;
  currentDeveloperName?: string | null;
  /** May be null when the project itself has no coords — we'll derive a centroid from area peers. */
  latitude: number | null;
  longitude: number | null;
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
  developer_id: string | null;
  developer_name: string | null;
  developer_slug: string | null;
  area_name: string | null;
};

export default function ProjectNearbyPropertiesMap({
  currentProjectId,
  currentProjectName,
  currentProjectSlug,
  currentDeveloperId,
  currentDeveloperName,
  latitude,
  longitude,
  areaName,
  className = "",
}: ProjectNearbyPropertiesMapProps) {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const tiles = getMapTiles(language);

  const hasOwnCoords =
    typeof latitude === "number" && typeof longitude === "number" && !isNaN(latitude) && !isNaN(longitude);

  const [filterMode, setFilterMode] = useState<FilterMode>("all");

  const { data: nearbyProjects } = useQuery({
    queryKey: ["nearby-projects-map", currentProjectId, areaName, latitude, longitude, currentDeveloperId],
    enabled: hasOwnCoords || !!areaName || !!currentDeveloperId,
    queryFn: async (): Promise<NearbyRow[]> => {
      const select =
        "id, name, slug, latitude, longitude, price_from, cover_image_url, area_name, developer_id, developer:developers(name, slug)";

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
            developer_id: p.developer_id ?? null,
            developer_name: p.developer?.name ?? null,
            developer_slug: p.developer?.slug ?? null,
            area_name: p.area_name ?? null,
          }))
          .filter(
            (p) =>
              typeof p.latitude === "number" &&
              typeof p.longitude === "number" &&
              !isNaN(p.latitude) &&
              !isNaN(p.longitude) &&
              !(p.latitude === 0 && p.longitude === 0),
          );

      const merged = new Map<string, NearbyRow>();

      // 1) Area peers
      if (areaName) {
        const { data: byArea } = await supabase
          .from("projects")
          .select(select)
          .neq("id", currentProjectId)
          .eq("is_published", true)
          .or(`area_name.ilike.%${areaName}%,location.ilike.%${areaName}%`)
          .not("latitude", "is", null)
          .not("longitude", "is", null)
          .limit(40);
        shape(byArea as any[]).forEach((r) => merged.set(r.id, r));
      }

      // 2) Same developer peers
      if (currentDeveloperId) {
        const { data: byDev } = await supabase
          .from("projects")
          .select(select)
          .neq("id", currentProjectId)
          .eq("developer_id", currentDeveloperId)
          .eq("is_published", true)
          .not("latitude", "is", null)
          .not("longitude", "is", null)
          .limit(40);
        shape(byDev as any[]).forEach((r) => {
          if (!merged.has(r.id)) merged.set(r.id, r);
        });
      }

      // 3) Bounding-box fallback
      if (merged.size === 0 && hasOwnCoords) {
        const delta = 0.1;
        const { data } = await supabase
          .from("projects")
          .select(select)
          .neq("id", currentProjectId)
          .eq("is_published", true)
          .gte("latitude", (latitude as number) - delta)
          .lte("latitude", (latitude as number) + delta)
          .gte("longitude", (longitude as number) - delta)
          .lte("longitude", (longitude as number) + delta)
          .not("latitude", "is", null)
          .not("longitude", "is", null)
          .limit(40);
        shape(data as any[]).forEach((r) => merged.set(r.id, r));
      }

      return Array.from(merged.values());
    },
    staleTime: 5 * 60 * 1000,
  });

  const allMarkers = useMemo(() => nearbyProjects || [], [nearbyProjects]);

  const sameDevCount = useMemo(
    () => (currentDeveloperId ? allMarkers.filter((m) => m.developer_id === currentDeveloperId).length : 0),
    [allMarkers, currentDeveloperId],
  );
  const sameAreaCount = useMemo(
    () =>
      areaName
        ? allMarkers.filter((m) => {
            const a = (m.area_name || "").toLowerCase();
            return a.includes(areaName.toLowerCase());
          }).length
        : 0,
    [allMarkers, areaName],
  );

  const markers = useMemo(() => {
    if (filterMode === "developer" && currentDeveloperId) {
      return allMarkers.filter((m) => m.developer_id === currentDeveloperId);
    }
    if (filterMode === "area" && areaName) {
      const a = areaName.toLowerCase();
      return allMarkers.filter((m) => (m.area_name || "").toLowerCase().includes(a));
    }
    return allMarkers;
  }, [allMarkers, filterMode, currentDeveloperId, areaName]);

  // Derive a map center: project coords if available, otherwise the centroid of area peers.
  const center = useMemo<[number, number] | null>(() => {
    if (hasOwnCoords) return [latitude as number, longitude as number];
    if (markers.length > 0) {
      const lat = markers.reduce((s, m) => s + (m.latitude as number), 0) / markers.length;
      const lng = markers.reduce((s, m) => s + (m.longitude as number), 0) / markers.length;
      return [lat, lng];
    }
    if (allMarkers.length > 0) {
      const lat = allMarkers.reduce((s, m) => s + (m.latitude as number), 0) / allMarkers.length;
      const lng = allMarkers.reduce((s, m) => s + (m.longitude as number), 0) / allMarkers.length;
      return [lat, lng];
    }
    return null;
  }, [hasOwnCoords, latitude, longitude, markers, allMarkers]);

  // When we have no center at all (no own coords AND no peers found), fall back to Dubai centroid
  // so the user still sees a map for the project (red pin will be omitted if no coords).
  const resolvedCenter: [number, number] = center ?? [25.1972, 55.2744];
  const hasAnyPin = hasOwnCoords || allMarkers.length > 0;
  if (!hasAnyPin) {
    return (
      <div className={`rounded-xl border border-[#B89555]/30 bg-[#F7F2EA] p-6 text-center ${className}`}>
        <p className="text-[14px] text-[#1A1A1A]/75">
          No other developer projects mapped near {currentProjectName} yet.
        </p>
      </div>
    );
  }

  const handleOpenNearby = (slug: string | null) => {
    if (!slug) return;
    if (currentProjectSlug) {
      pushBackStack({ slug: currentProjectSlug, name: currentProjectName });
    }
    navigate(`/project/${slug}`);
  };

  const chip = (mode: FilterMode, label: string, count: number, disabled = false) => {
    const isActive = filterMode === mode;
    return (
      <button
        key={mode}
        type="button"
        onClick={() => !disabled && setFilterMode(mode)}
        disabled={disabled}
        className={`jj-map-filter-toggle inline-flex w-full min-w-0 items-center justify-center gap-1.5 rounded-md px-3 py-2 text-xs font-semibold border transition-colors ${isActive ? "jj-emerald-action" : "bg-[#F7F2EA] text-[#1A1A1A] border-[#B89555]/35"} ${disabled ? "cursor-not-allowed" : ""}`}
        data-active={isActive ? "true" : "false"}
        data-disabled={disabled ? "true" : "false"}
        data-surface={isActive ? "emerald" : "champagne"}
        data-emerald-action={isActive ? "true" : undefined}
      >
        <span className="min-w-0 truncate">{label}</span>
        <span className="text-[10px] tabular-nums">
          {count}
        </span>
      </button>
    );
  };

  return (
    <div className={className}>
      <div data-map-shell className="mb-2 grid grid-cols-1 sm:grid-cols-3 gap-2 w-full pb-1">
        {chip("all", "All nearby", allMarkers.length)}
        {chip("developer", currentDeveloperName ? `Same developer · ${currentDeveloperName}` : "Same developer", sameDevCount, sameDevCount === 0)}
        {chip("area", areaName ? `Same area · ${areaName}` : "Same area", sameAreaCount, sameAreaCount === 0)}
      </div>
      <div
        data-map-shell
        className="rounded-2xl overflow-hidden"
        style={{
          height: 380,
          border: "1px solid rgba(255,255,255,0.16)",
          boxShadow: "0 28px 60px -34px rgba(0,0,0,0.82), inset 0 1px 0 rgba(255,255,255,0.16)",
        }}
      >
      <style>{`
        .jj-map-pin { background: none !important; border: none !important; }
        .leaflet-popup-content-wrapper { border-radius: 18px; border: 1px solid rgba(255,255,255,0.16); background: transparent; }
        .leaflet-popup-content { margin: 0; }
      `}</style>
      <MapContainer
        center={resolvedCenter}
        zoom={13}
        scrollWheelZoom={false}
        touchZoom={true}
        dragging={true}
        style={{ height: "100%", width: "100%" }}
        zoomControl={false}
        attributionControl={false}
        {...SAFE_LEAFLET_MAP_OPTIONS}
      >
        <TileLayer {...SAFE_TILE_LAYER_OPTIONS} url={tiles.satellite.url} attribution={tiles.satellite.attribution} {...(tiles.satellite.subdomains ? { subdomains: tiles.satellite.subdomains } : {})} maxZoom={19} />
        <MapNavigationControls latitude={center[0]} longitude={center[1]} />

        {/* Current project marker (red) — only when we have real coords */}
        {hasOwnCoords && (
          <Marker position={[latitude as number, longitude as number]} icon={RedIcon}>
            <Popup className="jj-map-popup">
              <div className="jj-map-popup-card min-w-[200px] max-w-[260px] p-3">
                <div className="text-sm font-bold">{currentProjectName}</div>
                <div className="text-xs mt-1">
                  {t("map.thisProject") || "This project"}
                </div>
              </div>
            </Popup>
          </Marker>
        )}


        {/* Nearby projects */}
        {markers.map((p) => (
          <Marker
            key={p.id}
            position={[p.latitude!, p.longitude!]}
            icon={createEmeraldMarkerIcon(p.price_from)}
            eventHandlers={{
              mouseover: (e) => e.target.openPopup(),
              mouseout: (e) => {
                // Keep popup open if user is hovering over it
                setTimeout(() => {
                  const popup = e.target.getPopup();
                  if (popup && !popup.getElement()?.matches(':hover')) {
                    e.target.closePopup();
                  }
                }, 250);
              },
            }}
          >
            <Popup className="jj-map-popup">
              <div className="jj-map-popup-card min-w-[220px] max-w-[280px]">
                {p.cover_image_url && (
                  <img
                    src={p.cover_image_url}
                    alt={p.name}
                    className="w-full h-24 object-cover"
                    loading="eager"
                    decoding="async"
                    {...({ fetchpriority: "high" } as any)} />
                )}
                <div className="p-3 space-y-2">
                  {p.slug ? (
                    <button
                      type="button"
                      onClick={() => handleOpenNearby(p.slug)}
                      className="text-sm font-semibold hover:underline text-left block w-full"
                    >
                      {p.name}
                    </button>
                  ) : (
                    <div className="text-sm font-semibold">{p.name}</div>
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
                      className="mt-1 text-[11px] font-medium underline underline-offset-2"
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
    </div>
  );
}
