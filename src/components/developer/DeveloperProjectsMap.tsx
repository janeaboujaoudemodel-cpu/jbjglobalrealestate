import { useMemo, useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { DivIcon, LatLngBounds } from "leaflet";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { SafeImage } from "@/components/SafeImage";
import { ChevronRight, Layers } from "lucide-react";
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

// Custom gold marker icon
const createCustomIcon = (price: number | null) => {
  const priceText = price ? `${(price / 1000000).toFixed(1)}M` : "TBA";

  return new DivIcon({
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
};

// Format price for popup
const formatPrice = (price: number | null) => {
  if (!price) return "Price TBA";
  if (price >= 1000000) return `AED ${(price / 1000000).toFixed(1)}M`;
  return `AED ${(price / 1000).toFixed(0)}K`;
};

// Component to fit map bounds to all projects
const MapBoundsFitter = ({ projects }: { projects: DeveloperProject[] }) => {
  const map = useMap();

  useEffect(() => {
    const validProjects = projects.filter(p => p.latitude && p.longitude);
    if (validProjects.length === 0) return;

    if (validProjects.length === 1) {
      map.setView([validProjects[0].latitude!, validProjects[0].longitude!], 13);
      return;
    }

    const bounds = new LatLngBounds(
      validProjects.map(p => [p.latitude!, p.longitude!] as [number, number])
    );
    map.fitBounds(bounds, { padding: [50, 50] });
  }, [projects, map]);

  return null;
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
  const [tileLayer, setTileLayer] = useState<'street' | 'satellite'>('street');

  // Filter to projects with coordinates
  const projectsWithCoords = useMemo(() => 
    projects.filter(p => p.latitude && p.longitude),
    [projects]
  );

  if (projectsWithCoords.length === 0) {
    return (
      <div className="rounded-xl border-2 border-gold/30 bg-champagne/20 p-8 text-center">
        <p className="text-foreground/70">No projects with location data available</p>
      </div>
    );
  }

  // Calculate center from first project or use Dubai default
  const center: [number, number] = projectsWithCoords[0]
    ? [projectsWithCoords[0].latitude!, projectsWithCoords[0].longitude!]
    : [25.2048, 55.2708];

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
      <div className="h-[400px]">
        <MapContainer
          center={center}
          zoom={11}
          style={{ height: "100%", width: "100%" }}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution={TILE_LAYERS[tileLayer].attribution}
            url={TILE_LAYERS[tileLayer].url}
          />

          <MapBoundsFitter projects={projectsWithCoords} />

          {projectsWithCoords.map((project) => (
            <Marker
              key={project.id}
              position={[project.latitude!, project.longitude!]}
              icon={createCustomIcon(project.price_from)}
            >
              <Popup>
                <div className="w-56 p-0">
                  {project.cover_image_url && (
                    <div className="relative h-28 -mx-3 -mt-3 mb-2">
                      <SafeImage
                        src={project.cover_image_url}
                        alt={project.name}
                        className="w-full h-full object-cover rounded-t-lg"
                      />
                    </div>
                  )}
                  <h4 className="font-semibold text-sm mb-1 line-clamp-2">{project.name}</h4>
                  {project.location && (
                    <p className="text-xs text-muted-foreground mb-2 line-clamp-1">
                      {project.location}
                    </p>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-primary text-sm">
                      {formatPrice(project.price_from)}
                    </span>
                    <Link to={`/project/${project.slug}`}>
                      <Button size="sm" variant="outline" className="h-7 text-xs gap-1">
                        View <ChevronRight className="h-3 w-3" />
                      </Button>
                    </Link>
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
