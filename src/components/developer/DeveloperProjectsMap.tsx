import { useEffect, useRef, useState, useCallback } from "react";
import L from "leaflet";
import { Button } from "@/components/ui/button";
import { Layers, AlertTriangle, RefreshCw } from "lucide-react";
import { MapNavigationControlsStandalone } from "@/components/maps/MapNavigationControls";
import { useLanguage } from "@/contexts/LanguageContext";
import { getMapTiles, type MapViewType } from "@/constants/mapTiles";
import "leaflet/dist/leaflet.css";

interface DeveloperProject {
  id: string;
  name: string;
  slug: string;
  latitude: number | null;
  longitude: number | null;
  price_from: number | null;
  cover_image_url: string | null;
  location?: string | null;
}

interface DeveloperProjectsMapProps {
  developerId: string;
  developerName: string;
  projects: DeveloperProject[];
}

export function DeveloperProjectsMap({ developerId, developerName, projects }: DeveloperProjectsMapProps) {
  const { t, language } = useLanguage();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  
  const [tileLayer, setTileLayer] = useState<MapViewType>('satellite');
  const [mapError, setMapError] = useState<string | null>(null);
  const [mapInteractive, setMapInteractive] = useState(false);
  // Bumped after L.map init so <MapNavigationControlsStandalone> re-renders with the real instance
  const [mapReadyTick, setMapReadyTick] = useState(0);

  // Format price for popup
  const formatPrice = useCallback((price: number | null) => {
    if (!price) return t('map.priceOnRequest');
    if (price >= 1000000) return `AED ${(price / 1000000).toFixed(1)}M`;
    return `AED ${(price / 1000).toFixed(0)}K`;
  }, [t]);

  // Filter to projects with coordinates
  const projectsWithCoords = projects.filter(p => p.latitude && p.longitude);

  // Create marker icon
  const createMarkerIcon = useCallback((price: number | null) => {
    const priceText = price ? `${(price / 1000000).toFixed(1)}M` : "Ask";
    
    return L.divIcon({
      className: "custom-marker",
      html: `
        <div style="
          background: linear-gradient(135deg, #0B5A45 0%, #073B2F 58%, #03251F 100%);
          color: #FFFFFF;
          padding: 6px 12px;
          border-radius: 20px;
          font-weight: bold;
          font-size: 12px;
          white-space: nowrap;
          box-shadow: 0 8px 18px rgba(0,0,0,0.28);
          border: 2px solid rgba(255,255,255,0.96);
          cursor: pointer;
          transition: transform 0.2s;
        ">
          ${priceText}
        </div>
      `,
      iconSize: [70, 32],
      iconAnchor: [35, 32],
    });
  }, []);

  // Create popup content
  const createPopupContent = useCallback((project: DeveloperProject) => {
    const imageHtml = project.cover_image_url 
      ? `<div style="height: 128px; overflow: hidden;">
           <img src="${project.cover_image_url}" alt="${project.name}" style="width: 100%; height: 100%; object-fit: cover; display: block;" loading="eager" decoding="async" fetchpriority="high" />
         </div>`
      : '';
    
    const locationHtml = project.location 
      ? `<p style="font-size: 12px; color: rgba(255,255,255,0.84); margin-bottom: 8px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${project.location}</p>`
      : '';

    return `
      <div class="jj-map-popup-card" style="width: 240px; padding: 0; background: linear-gradient(135deg, #0B5A45 0%, #073B2F 58%, #03251F 100%); color: #FFFFFF;">
        ${imageHtml}
        <div style="padding: 12px;">
          <h4 style="font-weight: 600; font-size: 14px; margin-bottom: 4px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; color: #FFFFFF;">${project.name}</h4>
          ${locationHtml}
          <div style="display: flex; align-items: center; justify-content: space-between;">
            <span style="font-weight: 700; color: #FFFFFF; font-size: 14px;">${formatPrice(project.price_from)}</span>
            <a href="/project/${project.slug}" style="display: inline-flex; align-items: center; gap: 4px; padding: 4px 12px; border: 1px solid rgba(255,255,255,0.28); border-radius: 6px; font-size: 12px; text-decoration: none; color: #FFFFFF; background: rgba(255,255,255,0.10);">
              ${t('map.view')} →
            </a>
          </div>
        </div>
      </div>
    `;
  }, [formatPrice, t]);

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || projectsWithCoords.length === 0) return;
    
    // Don't reinitialize if map already exists
    if (mapInstanceRef.current) return;

    try {
      const center: [number, number] = projectsWithCoords[0]
        ? [projectsWithCoords[0].latitude!, projectsWithCoords[0].longitude!]
        : [25.2048, 55.2708];

      const map = L.map(mapContainerRef.current, {
        center,
        zoom: 11,
        // Keep scroll wheel disabled until user opts in (prevents page hijack),
        // but allow touch/drag/keyboard + programmatic zoom so +/- controls
        // respond instantly with no perceived lag.
        scrollWheelZoom: false,
        touchZoom: true,
        doubleClickZoom: true,
        dragging: true,
        keyboard: true,
        zoomControl: false,
        zoomAnimation: true,
        zoomSnap: 0.5,
        wheelDebounceTime: 20,
        fadeAnimation: false,
        markerZoomAnimation: false,
      });

      mapInstanceRef.current = map;
      // Force re-render so the standalone nav controls receive the real map instance
      setMapReadyTick((n) => n + 1);

      const tiles = getMapTiles(language);
      const initialTileConfig = tiles.satellite;
      const initialTileOptions: L.TileLayerOptions = { attribution: initialTileConfig.attribution };
      if (initialTileConfig.subdomains) initialTileOptions.subdomains = initialTileConfig.subdomains;
      const initialTileLayer = L.tileLayer(initialTileConfig.url, initialTileOptions);
      initialTileLayer.addTo(map);
      
      map.attributionControl.remove();
      tileLayerRef.current = initialTileLayer;

      projectsWithCoords.forEach((project) => {
        const marker = L.marker(
          [project.latitude!, project.longitude!],
          { icon: createMarkerIcon(project.price_from) }
        );
        
        marker.bindPopup(createPopupContent(project), {
          maxWidth: 250,
          className: 'developer-map-popup',
        });
        
        marker.addTo(map);
        markersRef.current.push(marker);
      });

      if (projectsWithCoords.length === 1) {
        map.setView([projectsWithCoords[0].latitude!, projectsWithCoords[0].longitude!], 13);
      } else {
        const bounds = L.latLngBounds(
          projectsWithCoords.map(p => [p.latitude!, p.longitude!] as [number, number])
        );
        map.fitBounds(bounds, { padding: [50, 50] });
      }

      setMapError(null);
    } catch (err) {
      console.error("Failed to initialize developer map:", err);
      setMapError("Failed to load map. Please try again.");
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        tileLayerRef.current = null;
        markersRef.current = [];
      }
    };
  }, [projectsWithCoords, createMarkerIcon, createPopupContent, language]);

  // Handle tile layer toggle
  useEffect(() => {
    if (!mapInstanceRef.current || !tileLayerRef.current) return;

    try {
      tileLayerRef.current.remove();
      const tiles = getMapTiles(language);
      const tileConfig = tiles[tileLayer];
      const tileOptions: L.TileLayerOptions = {
        attribution: tileConfig.attribution,
      };
      if (tileConfig.subdomains) tileOptions.subdomains = tileConfig.subdomains;
      const newTileLayer = L.tileLayer(tileConfig.url, tileOptions);
      newTileLayer.addTo(mapInstanceRef.current);
      tileLayerRef.current = newTileLayer;
    } catch (err) {
      console.error("Failed to switch tile layer:", err);
    }
  }, [tileLayer, language]);

  // Handle retry
  const handleRetry = useCallback(() => {
    setMapError(null);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
      tileLayerRef.current = null;
      markersRef.current = [];
    }
  }, []);

  // No projects with coordinates
  if (projectsWithCoords.length === 0) {
    return (
      <div data-map-shell className="rounded-xl border border-white/15 p-8 text-center">
        <p className="text-white">{t('map.noLocations')}</p>
      </div>
    );
  }

  // Error state
  if (mapError) {
    return (
      <div data-map-shell className="rounded-xl border border-white/15 p-8 h-[400px] flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-white mx-auto mb-3" />
          <h3 className="text-white font-semibold mb-2">Map could not be loaded</h3>
          <p className="text-white/80 text-sm mb-4">{mapError}</p>
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleRetry}
            className="jj-map-details-button gap-2"
            data-surface="emerald"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div data-map-page data-map-shell className="rounded-xl overflow-hidden border border-white/15">
      {/* Map Header */}
      <div className="jj-map-embedded-header px-4 py-3 flex items-center justify-between gap-3 border-b border-white/15">
        <h3 className="font-semibold inline-flex items-center gap-2">
          <Layers className="w-4 h-4" />
          <span>{developerName} {t('map.projectsMap')}</span>
          <span className="ml-1 text-sm font-normal">
            ({projectsWithCoords.length} {t('map.locations')})
          </span>
        </h3>
        
        <div className="jj-map-layer-switcher">
          {(["satellite", "street", "terrain"] as MapViewType[]).map((view) => (
            <button
              key={view}
              type="button"
              onClick={() => setTileLayer(view)}
              className="jj-map-layer-button"
              data-active={tileLayer === view ? "true" : "false"}
              data-surface={tileLayer === view ? "emerald" : "champagne"}
            >
              {t(`map.${view}`)}
            </button>
          ))}
        </div>
      </div>

      {/* Map Container */}
      <div className="relative">
        <div 
          ref={mapContainerRef} 
          className="h-[400px] w-full"
          style={{ background: '#e5e3df' }}
        />
        {/* Click to enable overlay */}
        {!mapInteractive && (
          <div
            className="absolute inset-0 z-[500] flex items-center justify-center cursor-pointer bg-[#03251F]/10"
            onClick={() => {
              setMapInteractive(true);
              if (mapInstanceRef.current) {
                mapInstanceRef.current.scrollWheelZoom.enable();
                mapInstanceRef.current.touchZoom.enable();
              }
            }}
          >
            <div className="jj-map-enable-chip px-4 py-2 rounded-full text-sm font-medium">
              {t('map.clickToEnable')}
            </div>
          </div>
        )}
        <MapNavigationControlsStandalone
          key={mapReadyTick}
          mapInstance={mapInstanceRef.current}
          latitude={projectsWithCoords[0]?.latitude || 25.2048}
          longitude={projectsWithCoords[0]?.longitude || 55.2708}
        />
      </div>
    </div>
  );
}

export default DeveloperProjectsMap;
