import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { MapContainer, Marker, useMap } from "react-leaflet";
import { DivIcon } from "leaflet";
import L from "leaflet";
import { useProjectsMapListing } from "@/hooks/useProjects";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link } from "react-router-dom";
import { MapPin, List, X, ChevronRight, ExternalLink, Bed, Maximize, Calendar, Grid3X3, ArrowUpDown, Search } from "lucide-react";
import { SafeImage } from "@/components/SafeImage";
import { MapNavigationControls } from "@/components/maps/MapNavigationControls";
import { type ShortcutFilterState, defaultShortcutFilters } from "@/components/filters/FilterShortcutBar";
import { applyShortcutFilters } from "@/utils/applyShortcutFilters";
import { useLanguage } from "@/contexts/LanguageContext";
import { getMapTiles, type MapViewType } from "@/constants/mapTiles";
import { SAFE_LEAFLET_MAP_OPTIONS, SAFE_TILE_LAYER_OPTIONS, safelyRemoveLayer } from "@/utils/leafletSafety";
import "leaflet/dist/leaflet.css";
import { SEOHead } from "@/components/SEOHead";

function DynamicTileLayer({ mapView, language }: { mapView: MapViewType; language: string }) {
  const map = useMap();
  const layerRef = useRef<L.TileLayer | null>(null);

  useEffect(() => {
    if (layerRef.current) safelyRemoveLayer(map, layerRef.current);
    const tiles = getMapTiles(language);
    const { url, attribution, subdomains } = tiles[mapView];
    const tileOptions: L.TileLayerOptions = {
      ...SAFE_TILE_LAYER_OPTIONS,
      attribution,
      maxZoom: 18,
      minZoom: 5,
      crossOrigin: true,
    };

    // Do not pass `subdomains: undefined` into Leaflet. Doing so overrides
    // Leaflet's default and crashes `_getSubdomain()` on satellite/street
    // tile layers, which blanked the entire /map route before controls could
    // render. Only attach it for providers that explicitly need it.
    if (subdomains) tileOptions.subdomains = subdomains;

    layerRef.current = L.tileLayer(url, tileOptions);
    layerRef.current.addTo(map);
    return () => { safelyRemoveLayer(map, layerRef.current); layerRef.current = null; };
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

// Expose Leaflet map instance to parent via callback
function MapRefGetter({ onMap }: { onMap: (map: L.Map) => void }) {
  const map = useMap();
  useEffect(() => { onMap(map); }, [map, onMap]);
  return null;
}

// Smart card positioning: keeps card visible, avoids sidebar/header
function getCardPosition(
  map: L.Map,
  latlng: [number, number],
  cardWidth: number,
  cardHeight: number,
  containerEl: HTMLElement
) {
  const point = map.latLngToContainerPoint(latlng);
  const rect = containerEl.getBoundingClientRect();
  const cw = rect.width;
  const ch = rect.height;
  const sidebarSafe = 80; // left sidebar width + margin
  const padding = 12;
  const markerOffset = 20;

  // Horizontal: prefer right of marker, flip left if near right edge
  let left = point.x + markerOffset;
  if (left + cardWidth + padding > cw) {
    left = point.x - cardWidth - markerOffset;
  }
  // Ensure not behind sidebar
  if (left < sidebarSafe) {
    left = sidebarSafe;
  }

  // Vertical: center on marker, clamp to container
  let top = point.y - cardHeight / 2;
  if (top < padding) top = padding;
  if (top + cardHeight + padding > ch) top = ch - cardHeight - padding;

  return { left, top };
}

function ScrollWheelZoomGuard() {
  const map = useMap();
  useEffect(() => {
    map.scrollWheelZoom.disable();
    const enableOnClick = () => { map.scrollWheelZoom.enable(); };
    const disableOnBlur = () => { map.scrollWheelZoom.disable(); };
    map.getContainer().addEventListener("click", enableOnClick);
    map.getContainer().addEventListener("mouseleave", disableOnBlur);
    return () => {
      map.getContainer().removeEventListener("click", enableOnClick);
      map.getContainer().removeEventListener("mouseleave", disableOnBlur);
    };
  }, [map]);
  return null;
}

function FitBounds({ coords }: { coords: [number, number][] }) {
  const map = useMap();
  const hasFitRef = useRef(false);
  useEffect(() => {
    if (hasFitRef.current || coords.length === 0) return;
    hasFitRef.current = true;
    window.requestAnimationFrame(() => {
      const bounds = L.latLngBounds(coords.slice(0, 160));
      map.fitBounds(bounds, { padding: [36, 36], maxZoom: 11, animate: false });
    });
  }, [coords, map]);
  return null;
}

function ViewportMarkerGate({
  projects,
  onVisibleIds,
}: {
  projects: Array<{ id: string | number; lat: number; lng: number }>;
  onVisibleIds: (ids: Set<string | number>) => void;
}) {
  const map = useMap();

  useEffect(() => {
    let raf = 0;
    const update = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const bounds = map.getBounds().pad(0.3);
        const visible = projects
          .filter((project) => bounds.contains([project.lat, project.lng]))
          .slice(0, 180)
          .map((project) => project.id);
        onVisibleIds(new Set(visible));
      });
    };

    update();
    map.on("moveend zoomend resize", update);
    return () => {
      cancelAnimationFrame(raf);
      map.off("moveend zoomend resize", update);
    };
  }, [map, onVisibleIds, projects]);

  return null;
}

const priceMarkerIconCache = new globalThis.Map<string, DivIcon>();

const createCustomIcon = (price: number | null) => {
  const priceText = price ? `${(price / 1000000).toFixed(1)}M` : "Ask";
  const cachedIcon = priceMarkerIconCache.get(priceText);
  if (cachedIcon) return cachedIcon;

  const icon = new DivIcon({
    className: "custom-marker",
    html: `
      <div class="jj-map-price-marker" style="
        background: linear-gradient(135deg, #0B5A45 0%, #073B2F 55%, #03251F 100%);
        color: #FFFFFF !important;
        -webkit-text-fill-color: #FFFFFF !important;
        text-shadow: 0 1px 2px rgba(0,0,0,0.35);
        padding: 6px 10px;
        border-radius: 20px;
        font-weight: 800;
        font-size: 12px;
        line-height: 1;
        white-space: nowrap;
        box-shadow: 0 8px 18px rgba(0,0,0,0.28);
        border: 2px solid rgba(255,255,255,0.96);
        cursor: pointer;
      ">
        <span style="color:#FFFFFF !important;-webkit-text-fill-color:#FFFFFF !important;">${priceText}</span>
      </div>
    `,

    iconSize: [60, 30],
    iconAnchor: [30, 30],
  });

  priceMarkerIconCache.set(priceText, icon);
  return icon;
};

type ViewMode = "map" | "list" | "grid";
type SortMode = "newest" | "price_asc" | "price_desc" | "alpha";
type SearchTarget = "all" | "project" | "developer" | "location";

const PropertyMap = () => {
  const { t, language } = useLanguage();
  const { data: allProjects = [], isLoading } = useProjectsMapListing();
  const [selectedProject, setSelectedProject] = useState<any | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("map");
  const [mapView, setMapView] = useState<MapViewType>("satellite");
  const [filters, setFilters] = useState<ShortcutFilterState>(defaultShortcutFilters);
  const [sortMode, setSortMode] = useState<SortMode>("newest");
  const [listSearch, setListSearch] = useState("");
  const [searchTarget, setSearchTarget] = useState<SearchTarget>("all");
  const [visibleMarkerIds, setVisibleMarkerIds] = useState<Set<string | number> | null>(null);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const [hoveredProject, setHoveredProject] = useState<any | null>(null);
  const [hoverPos, setHoverPos] = useState<{ left: number; top: number } | null>(null);
  const [clickPos, setClickPos] = useState<{ left: number; top: number } | null>(null);

  const onMapReady = useCallback((map: L.Map) => { mapInstanceRef.current = map; }, []);

  // Listen for global filter changes from the header
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as ShortcutFilterState;
      if (detail) setFilters(detail);
    };
    window.addEventListener("globalFilterChange", handler);
    return () => window.removeEventListener("globalFilterChange", handler);
  }, []);

  // Clear selected/hovered project on view mode change
  useEffect(() => { setSelectedProject(null); setHoveredProject(null); }, [viewMode]);

  // Clear selected/hovered project on filter/sort changes
  useEffect(() => { setSelectedProject(null); setHoveredProject(null); }, [filters, sortMode]);


  // Auto-close card when map container leaves viewport
  useEffect(() => {
    const el = mapContainerRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => { if (!entry.isIntersecting) setSelectedProject(null); },
      { threshold: 0.15 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const formatPrice = (price: number | null) => {
    if (!price) return t('map.priceOnRequest');
    if (price >= 1000000) return `AED ${(price / 1000000).toFixed(1)}M`;
    return `AED ${(price / 1000).toFixed(0)}K`;
  };

  // Apply filters + local sort + hideSold
  const filteredProjects = useMemo(() => {
    let result = applyShortcutFilters(allProjects, { ...filters, hideSoldOut: false });

    // Local search: project, developer, location/community/emirate/country.
    if (listSearch.trim()) {
      const q = listSearch.trim().toLowerCase();
      result = result.filter(p => {
        const projectFields = [p.name, p.slug];
        const developerFields = [p.developer_name, p.developer?.name];
        const locationFields = [p.area_name, p.location, p.community?.name, p.emirate, "UAE", "United Arab Emirates"];
        const matches = (fields: Array<string | null | undefined>) => fields.some((field) => (field || "").toLowerCase().includes(q));

        if (searchTarget === "project") return matches(projectFields);
        if (searchTarget === "developer") return matches(developerFields);
        if (searchTarget === "location") return matches(locationFields);
        return matches([...projectFields, ...developerFields, ...locationFields]);
      });
    }

    // Sort
    if (sortMode === 'newest') result.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
    else if (sortMode === 'price_asc') result.sort((a, b) => (a.price_from || 0) - (b.price_from || 0));
    else if (sortMode === 'price_desc') result.sort((a, b) => (b.price_from || 0) - (a.price_from || 0));
    else if (sortMode === 'alpha') result.sort((a, b) => (a.name || '').localeCompare(b.name || ''));

    return result;
  }, [allProjects, filters, listSearch, searchTarget, sortMode]);

  // Clear if selected project no longer in filtered results
  useEffect(() => {
    if (selectedProject && !filteredProjects.some(p => p.id === selectedProject.id)) {
      setSelectedProject(null);
    }
  }, [selectedProject, filteredProjects]);

  const projectsWithCoords = useMemo(() => {
    return filteredProjects.filter(p =>
      p.latitude != null && p.longitude != null &&
      !isNaN(Number(p.latitude)) && !isNaN(Number(p.longitude)) &&
      Number(p.latitude) !== 0 && Number(p.longitude) !== 0
    ).map(p => ({ ...p, lat: Number(p.latitude), lng: Number(p.longitude) }));
  }, [filteredProjects]);

  const center: [number, number] = useMemo(() => {
    if (projectsWithCoords.length === 0) return [25.2048, 55.2708];
    const avgLat = projectsWithCoords.reduce((s, p) => s + p.lat, 0) / projectsWithCoords.length;
    const avgLng = projectsWithCoords.reduce((s, p) => s + p.lng, 0) / projectsWithCoords.length;
    return [avgLat, avgLng];
  }, [projectsWithCoords]);

  const coordsList = useMemo(() => projectsWithCoords.map(p => [p.lat, p.lng] as [number, number]), [projectsWithCoords]);
  const visibleProjects = useMemo(() => {
    if (!visibleMarkerIds) return projectsWithCoords.slice(0, 120);
    return projectsWithCoords.filter((project) => visibleMarkerIds.has(project.id)).slice(0, 180);
  }, [projectsWithCoords, visibleMarkerIds]);

  // Preload cover images for visible markers at LOW priority so tiles win
  // the network. Runs only when the browser is idle; skips entirely on
  // slow connections and Save-Data.
  useEffect(() => {
    const conn = (navigator as any).connection;
    if (conn?.saveData) return;
    if (conn?.effectiveType && /2g/.test(conn.effectiveType)) return;

    const srcs = visibleProjects
      .slice(0, 18)
      .map((project) => project.cover_image_url)
      .filter(Boolean) as string[];
    if (srcs.length === 0) return;

    const preload = () => {
      srcs.forEach((src) => {
        const image = new Image();
        image.decoding = "async";
        (image as any).fetchPriority = "low";
        image.loading = "lazy";
        image.src = src;
      });
    };

    let idleId: number | null = null;
    let timeoutId: ReturnType<typeof globalThis.setTimeout> | null = null;
    if (typeof window.requestIdleCallback === "function") {
      idleId = window.requestIdleCallback(preload, { timeout: 2000 });
    } else {
      timeoutId = globalThis.setTimeout(preload, 800);
    }

    return () => {
      if (timeoutId !== null) globalThis.clearTimeout(timeoutId);
      if (idleId !== null) window.cancelIdleCallback?.(idleId);
    };
  }, [visibleProjects]);


  const showPanel = viewMode === "list" || viewMode === "grid";

  const sortOptions: { value: SortMode; label: string }[] = [
    { value: "newest", label: "Newest" },
    { value: "price_asc", label: "Low → High" },
    { value: "price_desc", label: "High → Low" },
    { value: "alpha", label: "A → Z" },
  ];

  const searchTargets: { value: SearchTarget; label: string }[] = [
    { value: "all", label: "All" },
    { value: "project", label: "Projects" },
    { value: "developer", label: "Developers" },
    { value: "location", label: "Locations" },
  ];

  const searchPlaceholder = searchTarget === "developer"
    ? "Search developers..."
    : searchTarget === "project"
      ? "Search projects..."
      : searchTarget === "location"
        ? "Search location, community, emirate, country..."
        : "Search projects, developers, locations...";

  return (
    <>
      <SEOHead
        title="Dubai Property Map — Live Listings by Area | JBJ"
        description="Explore Dubai apartments, villas, and off-plan projects on an interactive map. Filter by area, price, bedrooms, and developer across every JBJ listing."
        canonicalPath="/map"
      />
    <div className="relative flex flex-col h-[calc(100vh-88px)] overflow-hidden" data-map-page>
      <style>{`
        /* ── Emerald contract lock — all map chrome: emerald fill + pure white ink ── */
        html body #root [data-map-page] :is(
          .jj-map-status-badge,
          .jj-map-card-close,
          .jj-map-panel-close,
          .jj-map-square-control,
          .jj-map-segment[data-active="true"],
          .jj-map-layer-button[data-active="true"],
          .jj-map-filter-toggle[data-active="true"],
          .jj-map-details-button,
          .jj-map-stat-tile,
          .jj-map-count-pill,
          .jj-map-loading-chip,
          .jj-map-sort-trigger
        ) {
          background: linear-gradient(135deg, #065F46 0%, #064E3B 55%, #032A1E 100%) !important;
          background-color: #064E3B !important;
          color: #FFFFFF !important;
          -webkit-text-fill-color: #FFFFFF !important;
          border: 1px solid rgba(255,255,255,0.28) !important;
          box-shadow: 0 6px 18px -10px rgba(0,0,0,0.55) !important;
        }
        html body #root [data-map-page] :is(
          .jj-map-status-badge,
          .jj-map-card-close,
          .jj-map-panel-close,
          .jj-map-square-control,
          .jj-map-segment[data-active="true"],
          .jj-map-layer-button[data-active="true"],
          .jj-map-filter-toggle[data-active="true"],
          .jj-map-details-button,
          .jj-map-stat-tile,
          .jj-map-count-pill,
          .jj-map-loading-chip,
          .jj-map-sort-trigger
        ) * {
          color: #FFFFFF !important;
          -webkit-text-fill-color: #FFFFFF !important;
        }
        html body #root [data-map-page] :is(
          .jj-map-status-badge,
          .jj-map-card-close,
          .jj-map-panel-close,
          .jj-map-square-control,
          .jj-map-segment[data-active="true"],
          .jj-map-layer-button[data-active="true"],
          .jj-map-filter-toggle[data-active="true"],
          .jj-map-details-button,
          .jj-map-stat-tile
        ) :is(svg, path, line, rect, circle, polyline, polygon) {
          color: #FFFFFF !important;
          stroke: #FFFFFF !important;
          fill: none !important;
        }
        /* Idle (unselected) segment/layer buttons: ink-emerald gradient with white text (no flat green) */
        html body #root [data-map-page] :is(
          .jj-map-segment,
          .jj-map-layer-button,
          .jj-map-filter-toggle
        ):not([data-active="true"]) {
          background: linear-gradient(135deg, #064E3B 0%, #042c1c 55%, #000000 100%) !important;
          background-image: linear-gradient(135deg, #064E3B 0%, #042c1c 55%, #000000 100%) !important;
          color: #FFFFFF !important;
          -webkit-text-fill-color: #FFFFFF !important;
          border: 1px solid rgba(184,149,85,0.42) !important;
        }
        html body #root [data-map-page] :is(
          .jj-map-segment,
          .jj-map-layer-button,
          .jj-map-filter-toggle
        ):not([data-active="true"]) :is(svg, path) {
          color: #FFFFFF !important; stroke: #FFFFFF !important;
        }

        /* Close button: circular emerald with white X */
        html body #root [data-map-page] :is(.jj-map-card-close, .jj-map-panel-close) {
          width: 32px !important; height: 32px !important;
          border-radius: 9999px !important;
          display: inline-flex !important; align-items: center !important; justify-content: center !important;
          padding: 0 !important;
        }
      `}</style>
      {/* ── MAP CONTROL BAR — below header, NOT part of header ── */}
      <div className="jj-map-command-bar shrink-0 z-10">

        <div className="flex items-center gap-2 px-3 py-2 flex-wrap">
          {/* Left: count */}
          <Badge variant="secondary" className="jj-map-count-pill gap-1 shrink-0" data-surface="emerald">
            <MapPin className="h-3 w-3" />
            {filteredProjects.length} {t('map.properties')}
          </Badge>

          <div className="flex-1" />

          {/* View toggles */}
          <div className="jj-map-segmented-control">
            <button
              onClick={() => setViewMode("map")}
              className="jj-map-segment"
              data-active={viewMode === "map" ? "true" : "false"}
              data-surface="emerald"
              data-emerald-shimmer={viewMode === "map" ? "true" : undefined}
            >
              <MapPin className="h-3.5 w-3.5 inline mr-1" />
              Map
            </button>
            <button
              onClick={() => setViewMode("list")}
              className="jj-map-segment"
              data-active={viewMode === "list" ? "true" : "false"}
              data-surface="emerald"
              data-emerald-shimmer={viewMode === "list" ? "true" : undefined}
            >
              <List className="h-3.5 w-3.5 inline mr-1" />
              List
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className="jj-map-segment"
              data-active={viewMode === "grid" ? "true" : "false"}
              data-surface="emerald"
              data-emerald-shimmer={viewMode === "grid" ? "true" : undefined}
            >
              <Grid3X3 className="h-3.5 w-3.5 inline mr-1" />
              Grid
            </button>
          </div>

          {/* Sort dropdown */}
          <div className="relative jj-map-sort-shell">
            <Select value={sortMode} onValueChange={(value) => setSortMode(value as SortMode)}>
              <SelectTrigger
                className="jj-map-sort-select jj-map-sort-trigger min-w-[132px]"
                data-surface="emerald"
                data-emerald-shimmer="true"
                aria-label="Sort map properties"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent data-map-shell className="jj-map-sort-content" align="end">
                {sortOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value} className="jj-map-sort-option">
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <ArrowUpDown className="h-3 w-3 absolute right-8 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Hide Sold intentionally removed — nothing on the site is marked sold */}
        </div>
      </div>

      {/* ── MAP CONTAINER ── */}
      <div ref={mapContainerRef} className="flex-1 relative overflow-hidden" data-map-main-stage onClick={(e) => { if (e.target === e.currentTarget) { setSelectedProject(null); setHoveredProject(null); } }}>
        <MapContainer
          center={center}
          zoom={11}
          scrollWheelZoom={false}
          touchZoom={true}
          dragging={true}
          preferCanvas={true}
          zoomControl={false}
          wheelDebounceTime={150}
          wheelPxPerZoomLevel={120}
          style={{ height: "100%", width: "100%" }}
          className="z-0"
          attributionControl={false}
          {...SAFE_LEAFLET_MAP_OPTIONS}
        >
          <DynamicTileLayer mapView={mapView} language={language} />
          <MapViewToggle mapView={mapView} onViewChange={setMapView} t={t} />
          <MapNavigationControls latitude={center[0]} longitude={center[1]} />
          <ScrollWheelZoomGuard />
          <FitBounds coords={coordsList} />
          <MapRefGetter onMap={onMapReady} />
          <ViewportMarkerGate projects={projectsWithCoords} onVisibleIds={setVisibleMarkerIds} />

          {visibleProjects.map((project) => (
            <Marker
              key={project.id}
              position={[project.lat, project.lng]}
              icon={createCustomIcon(project.price_from)}
              eventHandlers={{
                click: () => {
                  if (showPanel) return;
                  setHoveredProject(null);
                  setSelectedProject(project);
                  if (mapInstanceRef.current && mapContainerRef.current) {
                    setClickPos(getCardPosition(mapInstanceRef.current, [project.lat, project.lng], 384, 340, mapContainerRef.current));
                  }
                },
                mouseover: () => {
                  if (showPanel) return;
                  if (selectedProject?.id === project.id) return;
                  setHoveredProject(project);
                  if (mapInstanceRef.current && mapContainerRef.current) {
                    setHoverPos(getCardPosition(mapInstanceRef.current, [project.lat, project.lng], 220, 140, mapContainerRef.current));
                  }
                },
                mouseout: () => {
                  if (hoveredProject?.id === project.id) setHoveredProject(null);
                },
              }}
            />
          ))}
        </MapContainer>

        {isLoading && (
          <div className="jj-map-loading-chip" role="status" aria-live="polite" data-surface="emerald">
            <span className="jj-map-loading-dot" />
            {t('map.loadingProperties')}
          </div>
        )}

        {/* ── HOVER CARD (compact) ── */}
        {hoveredProject && !selectedProject && !showPanel && hoverPos && (
          <div
            className="absolute z-[1000] pointer-events-none"
            style={{ left: hoverPos.left, top: hoverPos.top, width: 220 }}
          >
            <Card
              surface="emerald"
              className="jj-map-hover-card pointer-events-auto"
              data-map-project-card
              data-surface="emerald"
            >
              <CardContent className="p-0" style={{ color: '#FFFFFF' }}>
                {hoveredProject.cover_image_url && (
                  <SafeImage src={hoveredProject.cover_image_url} alt={hoveredProject.name} className="w-full h-20 object-cover rounded-t-lg" loading="eager" decoding="async" fetchPriority="high" />
                )}
                <div className="p-2" style={{ color: '#FFFFFF' }}>
                  <h4 className="font-semibold text-xs truncate" style={{ color: '#FFFFFF' }}>{hoveredProject.name}</h4>
                  <p data-developer-name className="text-[10px] leading-snug truncate" style={{ color: '#FFFFFF' }}>{hoveredProject.developer_name} • {hoveredProject.area_name || hoveredProject.location}</p>
                  <p className="text-xs font-bold mt-1" style={{ color: '#FFFFFF' }}>{formatPrice(hoveredProject.price_from)}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ── CLICK CARD (detailed) ── */}
        {selectedProject && !showPanel && clickPos && (
          <div
            className="absolute z-[1000]"
            style={{ left: clickPos.left, top: clickPos.top, width: 384, maxWidth: 'calc(100% - 24px)' }}
          >
            <Card surface="emerald" className="jj-map-project-card shadow-xl" data-map-project-card>
              <CardContent className="p-0">
                <button
                  onClick={() => setSelectedProject(null)}
                  className="jj-map-card-close"
                  aria-label="Close property card"
                  data-surface="emerald"
                >
                  <X className="h-4 w-4" />
                </button>
                {selectedProject.cover_image_url && (
                  <div className="relative h-36">
                    <SafeImage src={selectedProject.cover_image_url} alt={selectedProject.name} className="w-full h-full object-cover rounded-t-lg" loading="eager" decoding="async" fetchPriority="high" />
                    <Badge className="jj-map-status-badge absolute bottom-2 left-2" data-surface="emerald">
                      {selectedProject.status || selectedProject.status_label || "Available"}
                    </Badge>
                  </div>
                )}
                <div className="p-3">
                  <h3 className="font-semibold text-base mb-1">{selectedProject.name}</h3>
                  <p className="text-xs mb-2">
                    {t('map.by')} {selectedProject.developer_name} • {selectedProject.area_name || selectedProject.location}
                  </p>
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    <div className="jj-map-stat-tile text-center p-1.5 rounded-lg" data-surface="emerald">
                      <Bed className="h-3.5 w-3.5 mx-auto mb-0.5" />
                      <p className="text-[10px] font-medium">{selectedProject.bedrooms_min || "—"}-{selectedProject.bedrooms_max || "—"} BR</p>
                    </div>
                    <div className="jj-map-stat-tile text-center p-1.5 rounded-lg" data-surface="emerald">
                      <Maximize className="h-3.5 w-3.5 mx-auto mb-0.5" />
                      <p className="text-[10px] font-medium">{selectedProject.size_min || "—"} sqft</p>
                    </div>
                    <div className="jj-map-stat-tile text-center p-1.5 rounded-lg" data-surface="emerald">
                      <Calendar className="h-3.5 w-3.5 mx-auto mb-0.5" />
                      <p className="text-[10px] font-medium">{selectedProject.handover_date || "TBA"}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px]">{t('map.startingFrom')}</p>
                      <p className="text-lg font-bold">{formatPrice(selectedProject.price_from)}</p>
                    </div>
                    <Link to={`/project/${selectedProject.slug}`}>
                      <Button size="sm" className="jj-map-details-button gap-1.5" data-surface="emerald">
                        {t('map.viewDetails')}
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ── LIST / GRID PANEL — attached to map stage, never over the filter bar ── */}
        {showPanel && (
        <div
          data-map-list-panel
          className="absolute top-3 right-3 bottom-3 w-[min(420px,calc(100%-24px))] sm:w-[420px] z-[1200] overflow-hidden flex flex-col pointer-events-auto"
          onPointerEnter={() => setHoveredProject(null)}
          onPointerOver={(event) => {
            event.stopPropagation();
            setHoveredProject(null);
          }}
          onMouseMove={(event) => {
            event.stopPropagation();
            setHoveredProject(null);
          }}
          onClick={(event) => event.stopPropagation()}
          onWheel={() => setHoveredProject(null)}
          onScroll={() => setHoveredProject(null)}
        >
          {/* Panel header with search */}
          <div className="jj-map-panel-header p-3 space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-sm">{filteredProjects.length} {t('map.properties')}</h2>
              <Button variant="ghost" size="sm" onClick={() => setViewMode("map")} className="jj-map-panel-close" data-surface="emerald" aria-label="Close map list panel">
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5" />
              <Input
                placeholder={searchPlaceholder}
                value={listSearch}
                onChange={(e) => setListSearch(e.target.value)}
                className="jj-map-search-input pl-9 h-8 text-xs"
                aria-label="Search properties, developers, and locations"
              />
            </div>
            <div className="jj-map-search-targets" aria-label="Map search type">
              {searchTargets.map((target) => (
                <button
                  key={target.value}
                  type="button"
                  className="jj-map-search-target"
                  data-active={searchTarget === target.value ? "true" : "false"}
                  data-surface="emerald"
                  data-emerald-shimmer={searchTarget === target.value ? "true" : undefined}
                  onClick={() => setSearchTarget(target.value)}
                >
                  {target.label}
                </button>
              ))}
            </div>
          </div>

          {/* Scrollable content */}
          <div className={`flex-1 overflow-auto p-3 ${viewMode === "grid" ? "grid grid-cols-2 gap-3 auto-rows-min" : "space-y-3"}`}>
            {filteredProjects.slice(0, 100).map((project) => (
              <Card
                key={project.id}
                surface="emerald"
                className="jj-map-list-card cursor-pointer transition-colors overflow-hidden"
                onClick={() => {
                  setHoveredProject(null);
                  setClickPos(null);
                  setSelectedProject(project);
                }}
                data-surface="emerald"
                data-map-project-card
              >
                <CardContent className="p-0" style={{ color: '#FFFFFF' }}>
                  {viewMode === "grid" ? (
                    <>
                      {/* GRID: large image on top */}
                      <div className="h-40 w-full">
                        <SafeImage
                          src={project.cover_image_url || "/placeholder.svg"}
                          alt={project.name}
                          className="w-full h-full object-cover"
                          fallbackSrc="/placeholder.svg"
                          loading="eager"
                          decoding="async"
                          fetchPriority="high"
                        />
                      </div>
                      <div className="p-2.5" style={{ color: '#FFFFFF' }}>
                        <h3 className="font-semibold text-xs truncate" style={{ color: '#FFFFFF' }}>{project.name}</h3>
                        <p className="text-[11px] truncate" style={{ color: 'rgba(255,255,255,0.86)' }}>
                          {project.developer_name} • {project.area_name || project.location}
                        </p>
                        <div className="flex items-center justify-between mt-1.5 gap-1.5">
                          <span className="text-sm font-bold" style={{ color: '#FFFFFF' }}>{formatPrice(project.price_from)}</span>
                          {project.bedrooms_min != null && (
                            <Badge variant="secondary" className="jj-map-card-mini-badge text-[10px] px-1.5 py-0" data-surface="emerald" style={{ color: '#FFFFFF' }}>
                              {project.bedrooms_min}-{project.bedrooms_max} BR
                            </Badge>
                          )}
                        </div>
                        <Link to={`/project/${project.slug}`} onClick={(e) => e.stopPropagation()}>
                          <Button size="sm" className="jj-map-details-button w-full mt-2 h-7 text-xs" data-surface="emerald" style={{ color: '#FFFFFF' }}>
                            View Details <ExternalLink className="h-3 w-3 ml-1" />
                          </Button>
                        </Link>
                      </div>
                    </>
                  ) : (
                    <div className="flex">
                      {/* LIST: large image LEFT, single-line details RIGHT */}
                      <div className="w-40 h-36 shrink-0">
                        <SafeImage
                          src={project.cover_image_url || "/placeholder.svg"}
                          alt={project.name}
                          className="w-full h-full object-cover"
                          fallbackSrc="/placeholder.svg"
                          loading="eager"
                          decoding="async"
                          fetchPriority="high"
                        />
                      </div>
                      <div className="flex-1 min-w-0 p-2.5 flex flex-col justify-between" style={{ color: '#FFFFFF' }}>
                        <div className="min-w-0">
                          <h3 className="font-semibold text-sm truncate" style={{ color: '#FFFFFF' }}>{project.name}</h3>
                          {/* All details on ONE line */}
                          <p className="text-[11px] truncate mt-0.5" style={{ color: 'rgba(255,255,255,0.9)' }}>
                            {[
                              project.developer_name,
                              project.area_name || project.location,
                              project.bedrooms_min != null ? `${project.bedrooms_min}-${project.bedrooms_max} BR` : null,
                            ].filter(Boolean).join(' • ')}
                          </p>
                          <p className="text-sm font-bold mt-1" style={{ color: '#FFFFFF' }}>{formatPrice(project.price_from)}</p>
                        </div>
                        <Link to={`/project/${project.slug}`} onClick={(e) => e.stopPropagation()} className="mt-2">
                          <Button size="sm" className="jj-map-details-button w-full h-7 text-xs" data-surface="emerald" style={{ color: '#FFFFFF' }}>
                            View Details <ExternalLink className="h-3 w-3 ml-1" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
        )}
      </div>

      </div>
    </>
  );
};

export default PropertyMap;
