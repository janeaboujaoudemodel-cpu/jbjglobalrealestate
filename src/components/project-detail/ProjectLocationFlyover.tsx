import { useState, useRef, useCallback, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, CircleMarker, useMap } from "react-leaflet";
import { Button } from "@/components/ui/button";
import { Play, RotateCcw } from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { motion, AnimatePresence } from "framer-motion";

// Premium gold/red SVG pin icon
const PREMIUM_PIN_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="40" height="52" viewBox="0 0 40 52" fill="none">
  <defs>
    <filter id="pinShadow" x="-4" y="-2" width="48" height="58" filterUnits="userSpaceOnUse">
      <feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="#000" flood-opacity="0.35"/>
    </filter>
    <linearGradient id="pinGrad" x1="20" y1="0" x2="20" y2="48" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#C8A766"/>
      <stop offset="50%" stop-color="#B8860B"/>
      <stop offset="100%" stop-color="#8B6914"/>
    </linearGradient>
  </defs>
  <path filter="url(#pinShadow)" d="M20 0C9 0 0 9 0 20c0 15 20 32 20 32s20-17 20-32C40 9 31 0 20 0z" fill="url(#pinGrad)"/>
  <circle cx="20" cy="18" r="8" fill="white" opacity="0.95"/>
  <circle cx="20" cy="18" r="4" fill="#C8A766"/>
</svg>`;

const PremiumIcon = L.divIcon({
  html: PREMIUM_PIN_SVG,
  className: "premium-location-pin",
  iconSize: [40, 52],
  iconAnchor: [20, 52],
  popupAnchor: [0, -52],
});

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
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  // Store callbacks in refs to prevent effect re-runs
  const onStepChangeRef = useRef(onStepChange);
  const onCompleteRef = useRef(onComplete);
  onStepChangeRef.current = onStepChange;
  onCompleteRef.current = onComplete;

  useEffect(() => {
    if (!playing) {
      timers.current.forEach(clearTimeout);
      timers.current = [];
      hasFlown.current = false;
      return;
    }

    if (hasFlown.current) return;
    hasFlown.current = true;

    const startFlyover = () => {
      // Ensure map container is sized properly
      map.invalidateSize();

      // Step 1: UAE overview (instant)
      map.setView(UAE_CENTER, UAE_ZOOM, { animate: false });
      onStepChangeRef.current(1);

      // Step 2: After 3s hold, fly to regional
      const t1 = setTimeout(() => {
        onStepChangeRef.current(2);
        map.flyTo(target, REGIONAL_ZOOM, {
          duration: 5,
          easeLinearity: 0.1,
        });

        let regionalDone = false;
        const onRegionalEnd = () => {
          if (regionalDone) return;
          regionalDone = true;
          map.off("moveend", onRegionalEnd);
          
          onStepChangeRef.current(3);
          map.flyTo(target, PROJECT_ZOOM, {
            duration: 6,
            easeLinearity: 0.08,
          });

          let projectDone = false;
          const onProjectEnd = () => {
            if (projectDone) return;
            projectDone = true;
            map.off("moveend", onProjectEnd);
            onStepChangeRef.current(4);
            onCompleteRef.current();
          };
          map.on("moveend", onProjectEnd);
          // Safety timeout in case moveend doesn't fire
          const t3 = setTimeout(onProjectEnd, 8000);
          timers.current.push(t3);
        };
        map.on("moveend", onRegionalEnd);
        // Safety timeout in case moveend doesn't fire
        const t2 = setTimeout(onRegionalEnd, 7000);
        timers.current.push(t2);
      }, 3000);

      timers.current = [t1];
    };

    if (map.getContainer()) {
      startFlyover();
    } else {
      map.whenReady(startFlyover);
    }

    return () => {
      timers.current.forEach(clearTimeout);
      timers.current = [];
      // Clean up any lingering moveend listeners
      map.off("moveend");
    };
  }, [playing, target, map]);

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
  const [showPin, setShowPin] = useState(false);

  const target: [number, number] = [latitude, longitude];

  const handlePlay = useCallback(() => {
    setIsPlaying(true);
    setCurrentStep(0);
    setAnimationDone(false);
    setShowPin(false);
  }, []);

  const handleStepChange = useCallback((step: number) => {
    setCurrentStep(step);
    if (step >= 3) setShowPin(true);
  }, []);

  const handleComplete = useCallback(() => {
    setTimeout(() => {
      setShowPin(false);
    }, 2000);
    setTimeout(() => {
      setIsPlaying(false);
      setAnimationDone(true);
    }, 4000);
  }, []);

  const handleReplay = useCallback(() => {
    setIsPlaying(false);
    setAnimationDone(false);
    setCurrentStep(0);
    setShowPin(false);
    setTimeout(handlePlay, 200);
  }, [handlePlay]);

  const stepLabels: Record<number, string> = {
    1: "United Arab Emirates",
    2: location ? `Approaching ${location.split(",")[0]}` : "Approaching location",
    3: `Arriving at ${projectName}`,
    4: projectName,
  };

  return (
    <div className={`relative rounded-2xl overflow-hidden ${className}`} style={{ height: 400, border: '3px solid hsl(42 45% 59%)', boxShadow: '0 8px 32px rgba(200,167,102,0.25)' }}>
      {/* Premium pin animation styles + artifact fixes */}
      <style>{`
        .premium-location-pin {
          background: none !important;
          border: none !important;
          transition: opacity 1.5s ease-out;
        }
        .premium-location-pin:hover,
        .premium-location-pin:focus {
          outline: none !important;
          box-shadow: none !important;
        }
        .premium-location-pin.pin-hidden {
          opacity: 0 !important;
        }
        .flyover-map .leaflet-container * {
          outline: none !important;
        }
        .flyover-map .leaflet-tile {
          border: none !important;
        }
        .flyover-map .leaflet-container a {
          border: none !important;
          outline: none !important;
        }
        .flyover-map .leaflet-marker-icon:focus,
        .flyover-map .leaflet-marker-shadow:focus {
          outline: none !important;
        }
        @keyframes pulseRing {
          0% { r: 30; opacity: 0.6; }
          50% { r: 60; opacity: 0.2; }
          100% { r: 90; opacity: 0; }
        }
      `}</style>

      <div className="flyover-map h-full w-full">
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

          {/* Pulsing red circle around project */}
          {isPlaying && currentStep >= 3 && (
            <>
              <CircleMarker
                center={target}
                radius={25}
                pathOptions={{
                  color: "#DC2626",
                  weight: 2,
                  opacity: 0.7,
                  fillColor: "#DC2626",
                  fillOpacity: 0.1,
                }}
              />
              <CircleMarker
                center={target}
                radius={40}
                pathOptions={{
                  color: "#DC2626",
                  weight: 1.5,
                  opacity: 0.4,
                  fillColor: "#DC2626",
                  fillOpacity: 0.05,
                }}
              />
            </>
          )}

          {/* Premium gold pin */}
          {showPin && (
            <Marker position={target} icon={PremiumIcon}>
              <Popup className="premium-popup">
                <span className="font-semibold">{projectName}</span>
              </Popup>
            </Marker>
          )}
        </MapContainer>
      </div>

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

      {/* Cinematic letterbox bars */}
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
