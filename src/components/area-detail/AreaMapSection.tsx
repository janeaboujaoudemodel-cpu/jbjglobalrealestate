import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { Link } from "react-router-dom";
import { Map as MapIcon } from "lucide-react";
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

interface AreaMapSectionProps {
  areaName: string;
  areaLat?: number | null;
  areaLng?: number | null;
}

export const AreaMapSection = ({ areaName, areaLat, areaLng }: AreaMapSectionProps) => {
  const { data: projects } = useQuery({
    queryKey: ["area-map-projects", areaName],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("id, name, slug, latitude, longitude, developer_name, cover_image_url")
        .ilike("area_name", `%${areaName}%`)
        .not("latitude", "is", null)
        .not("longitude", "is", null)
        .limit(50);
      if (error) throw error;
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  // Determine center: use project centroids or area coords or default Dubai
  const projectsWithCoords = projects?.filter(p => p.latitude && p.longitude) || [];
  
  let center: [number, number] = [25.2048, 55.2708]; // Dubai default
  if (projectsWithCoords.length > 0) {
    const avgLat = projectsWithCoords.reduce((s, p) => s + Number(p.latitude), 0) / projectsWithCoords.length;
    const avgLng = projectsWithCoords.reduce((s, p) => s + Number(p.longitude), 0) / projectsWithCoords.length;
    center = [avgLat, avgLng];
  } else if (areaLat && areaLng) {
    center = [areaLat, areaLng];
  }

  if (projectsWithCoords.length === 0 && !areaLat) return null;

  return (
    <section className="py-16 bg-black">
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-3 mb-8">
          <MapIcon className="w-6 h-6 text-gold" />
          <h2 className="text-2xl md:text-3xl font-bold text-white" style={{ fontFamily: "Poppins, sans-serif" }}>
            Map of {areaName}
          </h2>
        </div>

        <div className="rounded-2xl overflow-hidden border-2 border-gold/30 shadow-2xl" style={{ touchAction: "none" }}>
          <MapContainer
            center={center}
            zoom={13}
            scrollWheelZoom={true}
            dragging={true}
            touchZoom={true}
            style={{ height: "500px", width: "100%" }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {projectsWithCoords.map((project) => (
              <Marker
                key={project.id}
                position={[Number(project.latitude), Number(project.longitude)]}
                icon={defaultIcon}
              >
                <Popup>
                  <div className="text-center min-w-[180px]">
                    {project.cover_image_url && (
                      <img src={project.cover_image_url} alt={project.name} className="w-full h-24 object-cover rounded mb-2" />
                    )}
                    <Link to={`/project/${project.slug}`} className="font-bold text-sm text-blue-600 hover:underline block">
                      {project.name}
                    </Link>
                    {project.developer_name && (
                      <p className="text-xs text-zinc-500 mt-1">by {project.developer_name}</p>
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
