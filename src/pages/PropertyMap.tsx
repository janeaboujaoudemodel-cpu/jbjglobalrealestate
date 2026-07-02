import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { MapContainer, Marker, useMap } from "react-leaflet";
import { DivIcon } from "leaflet";
import L from "leaflet";
import { useProjectsListing } from "@/hooks/useProjects";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";
import { MapPin, List, X, ChevronRight, ExternalLink, Bed, Maximize, Calendar, Grid3X3, ArrowUpDown, Search, EyeOff } from "lucide-react";
import { SafeImage } from "@/components/SafeImage";
import { MapNavigationControls } from "@/components/maps/MapNavigationControls";
import { type ShortcutFilterState, defaultShortcutFilters } from "@/components/filters/FilterShortcutBar";
import { applyShortcutFilters } from "@/utils/applyShortcutFilters";
import { useLanguage } from "@/contexts/LanguageContext";
import { getMapTiles, type MapViewType } from "@/constants/mapTiles";
import "leaflet/dist/leaflet.css";

function DynamicTileLayer({ mapView, language }: { mapView: MapViewType; language: string }) {
  const map = useMap();
  const layerRef = useRef<L.TileLayer | null>(null);

  useEffect(() => {
    if (layerRef.current) map.removeLayer(layerRef.current);
    const tiles = getMapTiles(language);
    const { url, attribution, subdomains } = tiles[mapView];
    layerRef.current = L.tileLayer(url, {
      attribution,
      maxZoom: 18,
      minZoom: 5,
      keepBuffer: 2,
      updateWhenIdle: true,
      updateWhenZooming: false,
      detectRetina: false,
      crossOrigin: true,
      subdomains,
    });
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
  useEffect(() => {
    if (coords.length === 0) return;
    const bounds = L.latLngBounds(coords);
    map.fitBounds(bounds, { padding: [36, 36], maxZoom: 12, animate: false });
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
          .slice(0, 360)
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
      <div style="
        background: linear-gradient(135deg, #d4af37 0%, #b8962e 100%);
        color: #1A1A1A;
        padding: 6px 10px;
        border-radius: 20px;
        font-weight: bold;
        font-size: 12px;
        white-space: nowrap;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        border: 2px solid #fff;
        cursor: pointer;
      ">
        ${priceText}
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

const PropertyMap = () => {
  const { t, language } = useLanguage();
  const { data: allProjects = [], isLoading } = useProjectsListing();
  const [selectedProject, setSelectedProject] = useState<any | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("map");
  const [mapView, setMapView] = useState<MapViewType>("satellite");
  const [filters, setFilters] = useState<ShortcutFilterState>(defaultShortcutFilters);
  const [sortMode, setSortMode] = useState<SortMode>("newest");
  const [hideSold, setHideSold] = useState(false);
  const [listSearch, setListSearch] = useState("");
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
  useEffect(() => { setSelectedProject(null); setHoveredProject(null); }, [filters, sortMode, hideSold]);


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
    let result = applyShortcutFilters(allProjects, { ...filters, hideSoldOut: hideSold || filters.hideSoldOut });

    // Local list search
    if (listSearch.trim()) {
      const q = listSearch.trim().toLowerCase();
      result = result.filter(p => {
        const name = (p.name || '').toLowerCase();
        const dev = (p.developer_name || '').toLowerCase();
        const area = (p.area_name || p.location || '').toLowerCase();
        return name.includes(q) || dev.includes(q) || area.includes(q);
      });
    }

    // Sort
    if (sortMode === 'newest') result.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
    else if (sortMode === 'price_asc') result.sort((a, b) => (a.price_from || 0) - (b.price_from || 0));
    else if (sortMode === 'price_desc') result.sort((a, b) => (b.price_from || 0) - (a.price_from || 0));
    else if (sortMode === 'alpha') result.sort((a, b) => (a.name || '').localeCompare(b.name || ''));

    return result;
  }, [allProjects, filters, hideSold, listSearch, sortMode]);

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
    if (!visibleMarkerIds) return projectsWithCoords.slice(0, 360);
    return projectsWithCoords.filter((project) => visibleMarkerIds.has(project.id));
  }, [projectsWithCoords, visibleMarkerIds]);

  const showPanel = viewMode === "list" || viewMode === "grid";

  const sortOptions: { value: SortMode; label: string }[] = [
    { value: "newest", label: "Newest" },
    { value: "price_asc", label: "Low → High" },
    { value: "price_desc", label: "High → Low" },
    { value: "alpha", label: "A → Z" },
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-88px)] overflow-hidden" data-map-page>
      {/* ── MAP CONTROL BAR — below header, NOT part of header ── */}
      <div className="jj-map-command-bar shrink-0 z-10">
        <div className="flex items-center gap-2 px-3 py-2 flex-wrap">
          {/* Left: count */}
          <Badge variant="secondary" className="jj-map-count-pill gap-1 shrink-0">
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
              data-surface={viewMode === "map" ? "emerald" : "champagne"}
            >
              <MapPin className="h-3.5 w-3.5 inline mr-1" />
              Map
            </button>
            <button
              onClick={() => setViewMode("list")}
              className="jj-map-segment"
              data-active={viewMode === "list" ? "true" : "false"}
              data-surface={viewMode === "list" ? "emerald" : "champagne"}
            >
              <List className="h-3.5 w-3.5 inline mr-1" />
              List
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className="jj-map-segment"
              data-active={viewMode === "grid" ? "true" : "false"}
              data-surface={viewMode === "grid" ? "emerald" : "champagne"}
            >
              <Grid3X3 className="h-3.5 w-3.5 inline mr-1" />
              Grid
            </button>
          </div>

          {/* Sort dropdown */}
          <div className="relative">
            <select
              value={sortMode}
              onChange={(e) => setSortMode(e.target.value as SortMode)}
              className="jj-map-sort-select appearance-none"
            >
              {sortOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <ArrowUpDown className="h-3 w-3 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Hide Sold toggle */}
          <button
            onClick={() => setHideSold(!hideSold)}
            className="jj-map-filter-toggle"
            data-active={hideSold ? "true" : "false"}
            data-surface={hideSold ? "emerald" : "champagne"}
          >
            <EyeOff className="h-3.5 w-3.5" />
            Hide Sold
          </button>
        </div>
      </div>

      {/* ── MAP CONTAINER ── */}
      <div ref={mapContainerRef} className="flex-1 relative overflow-hidden" onClick={(e) => { if (e.target === e.currentTarget) { setSelectedProject(null); setHoveredProject(null); } }}>
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
                  setHoveredProject(null);
                  setSelectedProject(project);
                  if (mapInstanceRef.current && mapContainerRef.current) {
                    setClickPos(getCardPosition(mapInstanceRef.current, [project.lat, project.lng], 384, 340, mapContainerRef.current));
                  }
                },
                mouseover: () => {
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
        {hoveredProject && !selectedProject && hoverPos && (
          <div
            className="absolute z-[1000] pointer-events-none"
            style={{ left: hoverPos.left, top: hoverPos.top, width: 220 }}
          >
            <Card className="shadow-lg border border-[#B89555]/30 pointer-events-auto">
              <CardContent className="p-0">
                {hoveredProject.cover_image_url && (
                  <SafeImage src={hoveredProject.cover_image_url} alt={hoveredProject.name} className="w-full h-20 object-cover rounded-t-lg" />
                )}
                <div className="p-2">
                  <h4 className="font-semibold text-xs truncate">{hoveredProject.name}</h4>
                  <p data-developer-name className="text-[10px] text-muted-foreground whitespace-normal break-words [overflow-wrap:anywhere] leading-snug overflow-visible">{hoveredProject.developer_name} • {hoveredProject.area_name || hoveredProject.location}</p>
                  <p className="text-xs font-bold text-foreground mt-1">{formatPrice(hoveredProject.price_from)}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ── CLICK CARD (detailed) ── */}
        {selectedProject && clickPos && (
          <div
            className="absolute z-[1000]"
            style={{ left: clickPos.left, top: clickPos.top, width: 384, maxWidth: 'calc(100% - 24px)' }}
          >
            <Card className="jj-map-project-card shadow-xl" data-map-project-card>
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
                    <SafeImage src={selectedProject.cover_image_url} alt={selectedProject.name} className="w-full h-full object-cover rounded-t-lg" />
                    <Badge className="jj-map-status-badge absolute bottom-2 left-2" data-surface="emerald">
                      {selectedProject.status || "Off-Plan"}
                    </Badge>
                  </div>
                )}
                <div className="p-3">
                  <h3 className="font-semibold text-base mb-1">{selectedProject.name}</h3>
                  <p className="text-xs text-muted-foreground mb-2">
                    {t('map.by')} {selectedProject.developer_name} • {selectedProject.area_name || selectedProject.location}
                  </p>
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    <div className="text-center p-1.5 bg-muted rounded-lg">
                      <Bed className="h-3.5 w-3.5 mx-auto mb-0.5 text-muted-foreground" />
                      <p className="text-[10px] font-medium">{selectedProject.bedrooms_min || "—"}-{selectedProject.bedrooms_max || "—"} BR</p>
                    </div>
                    <div className="text-center p-1.5 bg-muted rounded-lg">
                      <Maximize className="h-3.5 w-3.5 mx-auto mb-0.5 text-muted-foreground" />
                      <p className="text-[10px] font-medium">{selectedProject.size_min || "—"} sqft</p>
                    </div>
                    <div className="text-center p-1.5 bg-muted rounded-lg">
                      <Calendar className="h-3.5 w-3.5 mx-auto mb-0.5 text-muted-foreground" />
                      <p className="text-[10px] font-medium">{selectedProject.handover_date || "TBA"}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-muted-foreground">{t('map.startingFrom')}</p>
                      <p className="text-lg font-bold text-foreground">{formatPrice(selectedProject.price_from)}</p>
                    </div>
                    <Link to={`/project/${selectedProject.slug}`}>
                      <Button size="sm" className="gap-1.5">
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
      </div>

      {/* ── LIST / GRID PANEL (overlay on right, map still interactive) ── */}
      {showPanel && (
        <div className="fixed top-[132px] right-0 bottom-0 w-full sm:w-[420px] bg-background/98 backdrop-blur-sm border-l border-border z-[999] overflow-hidden flex flex-col">
          {/* Panel header with search */}
          <div className="p-3 border-b border-border space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-sm">{filteredProjects.length} {t('map.properties')}</h2>
              <Button variant="ghost" size="sm" onClick={() => setViewMode("map")}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search properties..."
                value={listSearch}
                onChange={(e) => setListSearch(e.target.value)}
                className="pl-9 h-8 text-xs"
              />
            </div>
          </div>

          {/* Scrollable content */}
          <div className={`flex-1 overflow-auto p-3 ${viewMode === "grid" ? "grid grid-cols-2 gap-3 auto-rows-min" : "space-y-3"}`}>
            {filteredProjects.slice(0, 100).map((project) => (
              <Card
                key={project.id}
                className="cursor-pointer hover:border-[#B89555]/50 transition-colors"
                onClick={() => setSelectedProject(project)}
              >
                <CardContent className="p-0">
                  {/* Image */}
                  <div className={viewMode === "grid" ? "h-28 w-full" : "h-24 w-full"}>
                    <SafeImage
                      src={project.cover_image_url || "/placeholder.svg"}
                      alt={project.name}
                      className="w-full h-full object-cover rounded-t-lg"
                      fallbackSrc="/placeholder.svg"
                    />
                  </div>
                  <div className="p-2.5">
                    <h3 className="font-semibold text-xs truncate">{project.name}</h3>
                    <p data-developer-name className="text-[11px] text-muted-foreground whitespace-normal break-words [overflow-wrap:anywhere] leading-snug overflow-visible">{project.developer_name}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{project.area_name || project.location}</p>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <span className="text-sm font-bold text-foreground">{formatPrice(project.price_from)}</span>
                      {project.bedrooms_min != null && (
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                          {project.bedrooms_min}-{project.bedrooms_max} BR
                        </Badge>
                      )}
                    </div>
                    <Link to={`/project/${project.slug}`} onClick={(e) => e.stopPropagation()}>
                      <Button size="sm" variant="outline" className="w-full mt-2 h-7 text-xs">
                        View Details <ExternalLink className="h-3 w-3 ml-1" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      </div>
  );
};

export default PropertyMap;
