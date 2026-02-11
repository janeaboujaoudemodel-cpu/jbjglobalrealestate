import { useEffect, useRef, useState, useCallback } from "react";
import L from "leaflet";
import { Button } from "@/components/ui/button";
import { Layers, AlertTriangle, RefreshCw } from "lucide-react";
import { MapNavigationControlsStandalone } from "@/components/maps/MapNavigationControls";
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

// Format price for popup
const formatPrice = (price: number | null) => {
  if (!price) return "Price on request";
  if (price >= 1000000) return `AED ${(price / 1000000).toFixed(1)}M`;
  return `AED ${(price / 1000).toFixed(0)}K`;
};

// Tile layer options
const TILE_LAYERS = {
  street: {
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  },
  satellite: {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: '&copy; Esri',
  },
};

export function DeveloperProjectsMap({ developerId, developerName, projects }: DeveloperProjectsMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  
  const [tileLayer, setTileLayer] = useState<'street' | 'satellite'>('satellite');
  const [mapError, setMapError] = useState<string | null>(null);

  // Filter to projects with coordinates
  const projectsWithCoords = projects.filter(p => p.latitude && p.longitude);

  // Create marker icon
  const createMarkerIcon = useCallback((price: number | null) => {
    const priceText = price ? `${(price / 1000000).toFixed(1)}M` : "Ask";
    
    return L.divIcon({
      className: "custom-marker",
      html: `
        <div style="
          background: linear-gradient(135deg, #d4af37 0%, #b8962e 100%);
          color: #1a1a2e;
          padding: 6px 12px;
          border-radius: 20px;
          font-weight: bold;
          font-size: 12px;
          white-space: nowrap;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          border: 2px solid #fff;
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
      ? `<div style="height: 112px; margin: -12px -12px 8px -12px; overflow: hidden; border-radius: 8px 8px 0 0;">
           <img src="${project.cover_image_url}" alt="${project.name}" style="width: 100%; height: 100%; object-fit: cover;" />
         </div>`
      : '';
    
    const locationHtml = project.location 
      ? `<p style="font-size: 12px; color: #666; margin-bottom: 8px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${project.location}</p>`
      : '';

    return `
      <div style="width: 224px; padding: 0;">
        ${imageHtml}
        <h4 style="font-weight: 600; font-size: 14px; margin-bottom: 4px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">${project.name}</h4>
        ${locationHtml}
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <span style="font-weight: 700; color: #d4af37; font-size: 14px;">${formatPrice(project.price_from)}</span>
          <a href="/project/${project.slug}" style="display: inline-flex; align-items: center; gap: 4px; padding: 4px 12px; border: 1px solid #ccc; border-radius: 6px; font-size: 12px; text-decoration: none; color: #333;">
            View →
          </a>
        </div>
      </div>
    `;
  }, []);

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || projectsWithCoords.length === 0) return;
    
    // Don't reinitialize if map already exists
    if (mapInstanceRef.current) return;

    try {
      // Calculate center from first project or use Dubai default
      const center: [number, number] = projectsWithCoords[0]
        ? [projectsWithCoords[0].latitude!, projectsWithCoords[0].longitude!]
        : [25.2048, 55.2708];

      // Create map instance
      const map = L.map(mapContainerRef.current, {
        center,
        zoom: 11,
        scrollWheelZoom: true,
        touchZoom: true,
        dragging: true,
        zoomControl: false,
      });

      mapInstanceRef.current = map;

      // Add initial tile layer - default satellite for premium view
      const initialTileLayer = L.tileLayer(TILE_LAYERS.satellite.url, {
        attribution: '',
      });
      initialTileLayer.addTo(map);
      
      // Hide Leaflet attribution
      map.attributionControl.remove();
      tileLayerRef.current = initialTileLayer;

      // Add markers
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

      // Fit bounds
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

    // Cleanup
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        tileLayerRef.current = null;
        markersRef.current = [];
      }
    };
  }, [projectsWithCoords, createMarkerIcon, createPopupContent]);

  // Handle tile layer toggle
  useEffect(() => {
    if (!mapInstanceRef.current || !tileLayerRef.current) return;

    try {
      // Remove old tile layer
      tileLayerRef.current.remove();

      // Add new tile layer
      const newTileLayer = L.tileLayer(TILE_LAYERS[tileLayer].url, {
        attribution: TILE_LAYERS[tileLayer].attribution,
      });
      newTileLayer.addTo(mapInstanceRef.current);
      tileLayerRef.current = newTileLayer;
    } catch (err) {
      console.error("Failed to switch tile layer:", err);
    }
  }, [tileLayer]);

  // Handle retry
  const handleRetry = useCallback(() => {
    setMapError(null);
    // Force re-mount by clearing refs
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
      <div className="rounded-xl border-2 border-gold/30 bg-champagne/20 p-8 text-center">
        <p className="text-foreground/70">No projects with location data available</p>
      </div>
    );
  }

  // Error state
  if (mapError) {
    return (
      <div className="rounded-xl border-2 border-amber-500/40 bg-amber-50/50 dark:bg-amber-950/20 p-8 h-[400px] flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
          <h3 className="text-foreground font-semibold mb-2">Map could not be loaded</h3>
          <p className="text-muted-foreground text-sm mb-4">{mapError}</p>
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleRetry}
            className="gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl overflow-hidden border-2 border-gold/40" style={{
      boxShadow: '0 0 20px rgba(200,167,102,0.2)',
    }}>
      {/* Map Header */}
      <div className="bg-gradient-to-r from-champagne/80 to-champagne/40 px-4 py-3 flex items-center justify-between border-b border-gold/30">
        <h3 className="text-foreground font-semibold">
          {developerName} Projects Map
          <span className="ml-2 text-sm font-normal text-foreground/70">
            ({projectsWithCoords.length} locations)
          </span>
        </h3>
        
        {/* Layer Toggle */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setTileLayer(tileLayer === 'street' ? 'satellite' : 'street')}
          className="gap-2 border-gold/50 hover:bg-gold/10"
        >
          <Layers className="w-4 h-4" />
          {tileLayer === 'street' ? 'Satellite' : 'Street'}
        </Button>
      </div>

      {/* Map Container */}
      <div className="relative">
        <div 
          ref={mapContainerRef} 
          className="h-[400px] w-full"
          style={{ background: '#e5e3df' }}
        />
        <MapNavigationControlsStandalone
          mapInstance={mapInstanceRef.current}
          latitude={projectsWithCoords[0]?.latitude || 25.2048}
          longitude={projectsWithCoords[0]?.longitude || 55.2708}
        />
      </div>
    </div>
  );
}

export default DeveloperProjectsMap;
