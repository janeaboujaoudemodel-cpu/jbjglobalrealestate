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
const REGIONAL_ZOOM = 11;
const PROJECT_ZOOM = 16;

interface FlyoverControllerProps {
  target: [number, number];
  playing: boolean;
  onStepChange: (step: number) => void;
  onComplete: () => void;
}

function FlyoverController({ target, playing, onStepChange, onComplete }: FlyoverControllerProps) {
  const map = useMap();
  const hasFlown = useRef(false);

  useEffect(() => {
    if (!playing || hasFlown.current) return;
    hasFlown.current = true;

    // Start zoomed out on UAE
    map.setView(UAE_CENTER, UAE_ZOOM, { animate: false });
    onStepChange(1); // UAE overview

    // Step 1: Hold on UAE overview for 2s
    const t1 = setTimeout(() => {
      onStepChange(2); // Regional approach
      // Step 2: Slow fly to regional zoom (4s)
      map.flyTo(target, REGIONAL_ZOOM, {
        duration: 5,
        easeLinearity: 0.1,
      });
    }, 2000);

    // Step 3: After regional fly completes (~5s + 2s hold), fly to project pin
    const t2 = setTimeout(() => {
      onStepChange(3); // Neighborhood zoom
      map.flyTo(target, PROJECT_ZOOM, {
        duration: 6,
        easeLinearity: 0.08,
      });
    }, 8000);

    // Step 4: Animation complete, show final overlay
    const t3 = setTimeout(() => {
      onStepChange(4);
      onComplete();
    }, 15000);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [playing, target, map, onStepChange, onComplete]);

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
  const [currentStep, setCurrentStep] = useState(0);
  const [animationDone, setAnimationDone] = useState(false);

  const target: [number, number] = [latitude, longitude];

  const handlePlay = useCallback(() => {
    setIsPlaying(true);
    setCurrentStep(0);
    setAnimationDone(false);
  }, []);

  const handleStepChange = useCallback((step: number) => {
    setCurrentStep(step);
  }, []);

  const handleComplete = useCallback(() => {
    // Show final overlay for 3s then fade
    setTimeout(() => {
      setIsPlaying(false);
      setAnimationDone(true);
    }, 3000);
  }, []);

  const handleReplay = useCallback(() => {
    setIsPlaying(false);
    setAnimationDone(false);
    setCurrentStep(0);
    setTimeout(handlePlay, 150);
  }, [handlePlay]);

  const stepLabels: Record<number, string> = {
    1: "United Arab Emirates",
    2: location ? `Approaching ${location.split(",")[0]}` : "Approaching location",
    3: `Arriving at ${projectName}`,
    4: projectName,
  };

  return (
    <div className={`relative rounded-2xl overflow-hidden ${className}`} style={{ height: 400, border: '3px solid hsl(42 45% 59%)', boxShadow: '0 8px 32px rgba(200,167,102,0.25)' }}>
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
        <FlyoverController
          target={target}
          playing={isPlaying}
          onStepChange={handleStepChange}
          onComplete={handleComplete}
        />
        {isPlaying && currentStep >= 3 && (
          <Marker position={target}>
            <Popup>{projectName}</Popup>
          </Marker>
        )}
      </MapContainer>

      {/* Cinematic overlay with step labels */}
      <AnimatePresence>
        {isPlaying && currentStep > 0 && (
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.8 }}
            className="absolute inset-x-0 bottom-0 z-[1000] pointer-events-none"
          >
            <div className="bg-gradient-to-t from-black/70 via-black/40 to-transparent px-8 py-6">
              <p className="text-white/60 text-xs uppercase tracking-[0.2em] mb-1">
                {currentStep === 1 ? "Overview" : currentStep === 2 ? "Region" : currentStep === 3 ? "Neighborhood" : "Destination"}
              </p>
              <h3 className="text-white text-xl font-bold tracking-wide">
                {stepLabels[currentStep]}
              </h3>
              {currentStep === 4 && location && (
                <p className="text-white/80 text-sm mt-1">{location}</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cinematic letterbox bars for immersion */}
      {isPlaying && (
        <>
          <div className="absolute top-0 inset-x-0 h-8 bg-gradient-to-b from-black/50 to-transparent z-[999] pointer-events-none" />
          <div className="absolute bottom-0 inset-x-0 h-8 bg-gradient-to-t from-black/50 to-transparent z-[999] pointer-events-none" />
        </>
      )}

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
