import { useState, useRef, useCallback, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { Button } from "@/components/ui/button";
import { Play, RotateCcw } from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { motion, AnimatePresence } from "framer-motion";

import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});
L.Marker.prototype.options.icon = DefaultIcon;

// UAE overview center
const UAE_CENTER: [number, number] = [24.4, 54.5];
const UAE_ZOOM = 7;
const PROJECT_ZOOM = 16;

interface FlyoverControllerProps {
  target: [number, number];
  playing: boolean;
  onComplete: () => void;
}

function FlyoverController({ target, playing, onComplete }: FlyoverControllerProps) {
  const map = useMap();
  const hasFlown = useRef(false);

  useEffect(() => {
    if (!playing || hasFlown.current) return;
    hasFlown.current = true;

    // Start zoomed out
    map.setView(UAE_CENTER, UAE_ZOOM, { animate: false });

    // Fly to project after short delay
    const timer = setTimeout(() => {
      map.flyTo(target, PROJECT_ZOOM, {
        duration: 3.5,
        easeLinearity: 0.25,
      });
      // Complete after animation
      setTimeout(onComplete, 4000);
    }, 800);

    return () => clearTimeout(timer);
  }, [playing, target, map, onComplete]);

  // Reset when not playing
  useEffect(() => {
    if (!playing) {
      hasFlown.current = false;
    }
  }, [playing]);

  return null;
}

interface ProjectLocationFlyoverProps {
  projectName: string;
  latitude: number;
  longitude: number;
  location?: string | null;
  className?: string;
}

export default function ProjectLocationFlyover({
  projectName,
  latitude,
  longitude,
  location,
  className = "",
}: ProjectLocationFlyoverProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);
  const [animationDone, setAnimationDone] = useState(false);

  const target: [number, number] = [latitude, longitude];

  const handlePlay = useCallback(() => {
    setIsPlaying(true);
    setShowOverlay(true);
    setAnimationDone(false);
  }, []);

  const handleComplete = useCallback(() => {
    // Show name overlay, then fade out
    setTimeout(() => {
      setShowOverlay(false);
      setAnimationDone(true);
    }, 2000);
  }, []);

  const handleReplay = useCallback(() => {
    setIsPlaying(false);
    setAnimationDone(false);
    setTimeout(handlePlay, 100);
  }, [handlePlay]);

  return (
    <div className={`relative rounded-2xl overflow-hidden ${className}`} style={{ height: 350, border: '3px solid hsl(42 45% 59%)', boxShadow: '0 8px 32px rgba(200,167,102,0.25)' }}>
      <MapContainer
        center={UAE_CENTER}
        zoom={UAE_ZOOM}
        scrollWheelZoom={false}
        dragging={false}
        zoomControl={false}
        attributionControl={false}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          attribution="Tiles &copy; Esri"
          maxZoom={19}
        />
        <FlyoverController target={target} playing={isPlaying} onComplete={handleComplete} />
        {isPlaying && (
          <Marker position={target}>
            <Popup>{projectName}</Popup>
          </Marker>
        )}
      </MapContainer>

      {/* Project name overlay during flyover */}
      <AnimatePresence>
        {showOverlay && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            transition={{ duration: 0.6 }}
            className="absolute inset-0 flex items-center justify-center z-[1000] pointer-events-none"
          >
            <div className="bg-black/60 backdrop-blur-sm px-8 py-4 rounded-2xl text-center">
              <h3 className="text-white text-2xl font-bold tracking-wide">{projectName}</h3>
              {location && <p className="text-white/80 text-sm mt-1">{location}</p>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Play / Replay button */}
      {!isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center z-[999]">
          <Button
            onClick={animationDone ? handleReplay : handlePlay}
            className="bg-black/60 backdrop-blur-sm text-white hover:bg-black/80 rounded-full h-16 w-16 p-0"
          >
            {animationDone ? <RotateCcw className="w-7 h-7" /> : <Play className="w-7 h-7 ml-1" />}
          </Button>
          {!animationDone && (
            <p className="absolute bottom-6 text-white/90 text-sm font-medium bg-black/40 backdrop-blur-sm px-4 py-1.5 rounded-full">
              Play Location Flyover
            </p>
          )}
        </div>
      )}
    </div>
  );
}
