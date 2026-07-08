import { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { MapNavigationControls } from "@/components/maps/MapNavigationControls";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { getMapTiles, type MapViewType } from "@/constants/mapTiles";
import { SAFE_LEAFLET_MAP_OPTIONS, SAFE_TILE_LAYER_OPTIONS } from "@/utils/leafletSafety";
import { PricePill } from "@/components/ui/price-pill";
import { DeveloperLink } from "@/components/ui/developer-link";
import { pushBackStack } from "@/lib/browsingHistory";
import { useCurrency } from "@/hooks/useCurrency";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

type FilterMode = "nearby" | "area" | "emirate";

const escapeHtml = (value: string) => value.replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[char] || char));



// Premium project pin — minimal white label (no red pill, no all-caps),
// paired with a discreet gold-outlined pin. Keeps the map feeling editorial.
const buildCurrentPin = () => `
<div style="position:relative;width:42px;height:54px;display:flex;align-items:flex-end;justify-content:center;pointer-events:none;">
  <svg xmlns="http://www.w3.org/2000/svg" width="42" height="54" viewBox="0 0 58 74" fill="none">
    <defs>
      <filter id="jjPinShadow" x="-8" y="-6" width="74" height="88" filterUnits="userSpaceOnUse"><feDropShadow dx="0" dy="6" stdDeviation="4" flood-color="#000000" flood-opacity="0.55"/></filter>
    </defs>
    <path filter="url(#jjPinShadow)" d="M29 3C14.1 3 2 14.9 2 29.6 2 50.2 29 72 29 72s27-21.8 27-42.4C56 14.9 43.9 3 29 3z" fill="#D71920" stroke="#FFFFFF" stroke-width="2"/>
  </svg>
</div>`;

const createCurrentPinIcon = () => L.divIcon({
  html: buildCurrentPin(),
  className: "jj-map-pin",
  iconSize: [42, 54],
  iconAnchor: [21, 54],
  popupAnchor: [0, -54],
});

// Small champagne/gold dot pin for peer projects — no price label on the map
// (price still shows inside the hover popup). Keeps Amra the visual focus.
const createChampagneMarkerIcon = () => L.divIcon({
  html: `<div style="width:18px;height:18px;border-radius:999px;background:radial-gradient(circle at 30% 30%,#F1D488 0%,#B89555 55%,#6E5227 100%);border:2px solid #FFFFFF;box-shadow:0 6px 14px -6px rgba(0,0,0,0.75),inset 0 1px 0 rgba(255,255,255,0.55);"></div>`,
  className: "custom-marker jj-map-pin",
  iconSize: [18, 18],
  iconAnchor: [9, 9],
  popupAnchor: [0, -12],
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
  emirate?: string | null;
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
  emirate: string | null;
};

function MapResizeRuntime() {
  const map = useMap();
  useEffect(() => {
    const id = window.setTimeout(() => map.invalidateSize(), 120);
    return () => window.clearTimeout(id);
  }, [map]);
  return null;
}

function FitBoundsRuntime({ points }: { points: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (!points.length) return;
    if (points.length === 1) {
      // Zoom out enough to show coastline / surrounding context, not just a blank tile.
      map.setView(points[0], 12, { animate: false });
      return;
    }
    const bounds = L.latLngBounds(points.map(([a, b]) => L.latLng(a, b)));
    map.fitBounds(bounds, { padding: [60, 60], maxZoom: 13, animate: false });
  }, [map, points]);
  return null;
}

function ScrollLockRuntime() {
  const map = useMap();
  useEffect(() => {
    map.scrollWheelZoom.disable();
    // Prevent leaflet from stealing keyboard scroll
    map.keyboard?.disable();
    map.options.zoomSnap = 0.25;
    map.options.zoomDelta = 0.5;
    map.doubleClickZoom.enable();
    map.touchZoom.enable();
    map.dragging.enable();
  }, [map]);
  return null;
}


export default function ProjectNearbyPropertiesMap({
  currentProjectId,
  currentProjectName,
  currentProjectSlug,
  currentDeveloperId,
  currentDeveloperName,
  latitude,
  longitude,
  areaName,
  emirate,
  className = "",
}: ProjectNearbyPropertiesMapProps) {
  const { t, language } = useLanguage();
  const { formatPrice } = useCurrency();
  const navigate = useNavigate();
  const tiles = getMapTiles(language);
  const [mapView, setMapView] = useState<MapViewType>("satellite");

  const hasOwnCoords =
    typeof latitude === "number" && typeof longitude === "number" && !isNaN(latitude) && !isNaN(longitude);

  

  const { data: nearbyProjects } = useQuery({
    queryKey: ["nearby-projects-map", currentProjectId, areaName, emirate, latitude, longitude, currentDeveloperId],
    enabled: hasOwnCoords || !!areaName || !!emirate || !!currentDeveloperId,
    queryFn: async (): Promise<NearbyRow[]> => {
      const select =
        "id, name, slug, latitude, longitude, price_from, cover_image_url, area_name, emirate, developer_id, developer:developers(name, slug)";

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
            emirate: p.emirate ?? null,
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

      // 3) Same emirate peers — important where area names are less familiar than the emirate.
      if (emirate) {
        const { data: byEmirate } = await supabase
          .from("projects")
          .select(select)
          .neq("id", currentProjectId)
          .eq("is_published", true)
          .ilike("emirate", emirate)
          .not("latitude", "is", null)
          .not("longitude", "is", null)
          .limit(80);
        shape(byEmirate as any[]).forEach((r) => {
          if (!merged.has(r.id)) merged.set(r.id, r);
        });
      }

      // 4) Bounding-box fallback
      if (merged.size === 0 && hasOwnCoords) {
        const delta = 0.18;
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

  const distanceKm = useMemo(() => (p: NearbyRow) => {
        if (!hasOwnCoords || typeof p.latitude !== "number" || typeof p.longitude !== "number") return Number.POSITIVE_INFINITY;
        const toRad = (v: number) => (v * Math.PI) / 180;
        const r = 6371;
        const dLat = toRad(p.latitude - (latitude as number));
        const dLng = toRad(p.longitude - (longitude as number));
        const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(latitude as number)) * Math.cos(toRad(p.latitude)) * Math.sin(dLng / 2) ** 2;
        return 2 * r * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      },
    [allMarkers, latitude, longitude, hasOwnCoords],
  );
  // Show ALL peer projects on the same map. Prefer same-developer projects (Citi Developers'
  // other projects) — they are the story we want to tell. If there are none, fall back to the
  // full merged set so the map is never empty.
  const markers = useMemo(() => {
    if (currentDeveloperId) {
      const sameDev = allMarkers.filter((m) => m.developer_id === currentDeveloperId);
      if (sameDev.length > 0) return sameDev;
    }
    const sorted = [...allMarkers].sort((a, b) => distanceKm(a) - distanceKm(b));
    return sorted.slice(0, 16);
  }, [allMarkers, currentDeveloperId, distanceKm]);


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





  // Build the list of points for auto-fit — always include the current project pin
  // plus all visible nearby markers, so users see everything (Siniyah Island, UAQ, etc.)
  // without having to manually zoom out.
  const fitPoints = useMemo<[number, number][]>(() => {
    const pts: [number, number][] = [];
    if (hasOwnCoords) pts.push([latitude as number, longitude as number]);
    markers.forEach((m) => {
      if (typeof m.latitude === "number" && typeof m.longitude === "number") {
        pts.push([m.latitude, m.longitude]);
      }
    });
    return pts;
  }, [hasOwnCoords, latitude, longitude, markers]);

  return (
    <div className={className}>
      {/* Single connected frame: header + map share the same rounded shell so the tabs never look detached */}
      <div
        data-map-shell
        className="rounded-2xl overflow-hidden"
        style={{
          border: "1px solid rgba(184,149,85,0.35)",
          boxShadow: "0 28px 60px -34px rgba(0,0,0,0.82), inset 0 1px 0 rgba(255,255,255,0.16)",
          background: "#F7F2EA",
        }}
      >
        <div style={{ height: 460, position: "relative" }}>
        <style>{`
          .jj-map-pin { background: none !important; border: none !important; }
          .leaflet-popup-tip-container, .leaflet-popup-tip { display: none !important; }
          .leaflet-popup-content-wrapper { border-radius: 18px; border: 1px solid rgba(255,255,255,0.16); background: transparent; padding: 0; }
          .leaflet-popup-content { margin: 0; }
          .leaflet-container { background: #0a1f18; }
          .leaflet-control-zoom { display: block !important; }
          .leaflet-control-zoom a { background:#F7F2EA !important; color:#064E3B !important; border:1px solid rgba(184,149,85,0.55) !important; font-weight:900; }
          .leaflet-control-zoom a:hover { background:#EFE7D6 !important; }
        `}</style>
        <MapContainer
          center={resolvedCenter}
          zoom={13}
          scrollWheelZoom={true}
          touchZoom={true}
          dragging={true}
          style={{ height: "100%", width: "100%" }}
          zoomControl={false}
          attributionControl={false}
          zoomSnap={0.25}
          zoomDelta={0.5}
          wheelPxPerZoomLevel={60}
          {...SAFE_LEAFLET_MAP_OPTIONS}
        >
          <MapResizeRuntime />
          <FitBoundsRuntime points={fitPoints} />
          <TileLayer {...SAFE_TILE_LAYER_OPTIONS} url={tiles[mapView].url} attribution={tiles[mapView].attribution} {...(tiles[mapView].subdomains ? { subdomains: tiles[mapView].subdomains } : {})} maxZoom={19} />
          <div className="absolute top-4 left-4 z-[1000] flex flex-col gap-2">
            {(["satellite", "street", "terrain"] as MapViewType[]).map((view) => {
              const active = mapView === view;
              return (
                <button
                  key={view}
                  type="button"
                  onClick={() => setMapView(view)}
                  data-emerald-action={active ? "true" : undefined}
                  className={
                    active
                      ? "jj-emerald-action inline-flex items-center justify-center h-9 min-w-[104px] px-4 rounded-full text-xs font-bold capitalize shadow-md border border-transparent"
                      : "inline-flex items-center justify-center h-9 min-w-[104px] px-4 rounded-full text-xs font-bold capitalize bg-[#FDFBF7]/95 text-[#064E3B] border border-[#B89555]/55 shadow-md hover:bg-[#EFE6D6]"
                  }
                >
                  {view}
                </button>
              );
            })}
          </div>
          <MapNavigationControls latitude={resolvedCenter[0]} longitude={resolvedCenter[1]} />


        {/* Current project marker (red, with attached name label) */}
        {hasOwnCoords && (
          <Marker position={[latitude as number, longitude as number]} icon={createCurrentPinIcon()}>
            <Popup className="jj-map-popup" closeButton={false}>
              <div className="jj-map-popup-card min-w-[200px] max-w-[260px] p-3 bg-white rounded-2xl">
                <div className="text-sm font-bold text-[#1A1A1A]">{currentProjectName}</div>
                <div className="text-xs mt-1 text-[#1A1A1A]/70">
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
            icon={createChampagneMarkerIcon()}
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
            <Popup className="jj-map-popup" autoPan={false} closeButton={false}>
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
    </div>
  );
}

