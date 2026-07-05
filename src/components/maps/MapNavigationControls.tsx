import { useMap } from "react-leaflet";
import { ZoomIn, ZoomOut, Navigation, Box } from "lucide-react";

interface MapNavigationControlsProps {
  latitude: number;
  longitude: number;
}

export function MapNavigationControls({ latitude, longitude }: MapNavigationControlsProps) {
  const map = useMap();

  const handleZoomIn = () => map.zoomIn(1, { animate: false });
  const handleZoomOut = () => map.zoomOut(1, { animate: false });
  const handleRecenter = () => {
    map.setView([latitude, longitude], map.getZoom(), { animate: false });
  };
  const handleOpen3D = () => {
    const zoom = map.getZoom();
    const altitude = Math.max(500, 50000 / Math.pow(2, zoom - 10));
    const url = `https://earth.google.com/web/@${latitude},${longitude},${altitude}a,0d,35y,0h,45t,0r`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const btnClass = "jj-map-square-control";
  const iconClass = "h-5 w-5";

  return (
    <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
      <button onClick={handleZoomIn} className={btnClass} aria-label="Zoom in" data-surface="emerald">
        <ZoomIn className={iconClass} strokeWidth={2.5} />
      </button>
      <button onClick={handleZoomOut} className={btnClass} aria-label="Zoom out" data-surface="emerald">
        <ZoomOut className={iconClass} strokeWidth={2.5} />
      </button>
      <button onClick={handleRecenter} className={btnClass} aria-label="Recenter map" data-surface="emerald">
        <Navigation className={iconClass} strokeWidth={2.5} />
      </button>
      <button onClick={handleOpen3D} className={btnClass} aria-label="Open 3D view in Google Earth" data-surface="emerald">
        <Box className={iconClass} strokeWidth={2.5} />
      </button>
    </div>
  );
}

/** Standalone version for vanilla Leaflet maps (not react-leaflet) */
export function MapNavigationControlsStandalone({
  mapInstance,
  latitude,
  longitude,
}: {
  mapInstance: L.Map | null;
  latitude: number;
  longitude: number;
}) {
  if (!mapInstance) return null;

  const handleZoomIn = () => mapInstance.zoomIn(1, { animate: false });
  const handleZoomOut = () => mapInstance.zoomOut(1, { animate: false });
  const handleRecenter = () => {
    mapInstance.setView([latitude, longitude], mapInstance.getZoom(), { animate: false });
  };
  const handleOpen3D = () => {
    const zoom = mapInstance.getZoom();
    const altitude = Math.max(500, 50000 / Math.pow(2, zoom - 10));
    const url = `https://earth.google.com/web/@${latitude},${longitude},${altitude}a,0d,35y,0h,45t,0r`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const btnClass = "jj-map-square-control";
  const iconClass = "h-5 w-5";

  return (
    <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
      <button onClick={handleZoomIn} className={btnClass} aria-label="Zoom in" data-surface="emerald">
        <ZoomIn className={iconClass} strokeWidth={2.5} />
      </button>
      <button onClick={handleZoomOut} className={btnClass} aria-label="Zoom out" data-surface="emerald">
        <ZoomOut className={iconClass} strokeWidth={2.5} />
      </button>
      <button onClick={handleRecenter} className={btnClass} aria-label="Recenter map" data-surface="emerald">
        <Navigation className={iconClass} strokeWidth={2.5} />
      </button>
      <button onClick={handleOpen3D} className={btnClass} aria-label="Open 3D view in Google Earth" data-surface="emerald">
        <Box className={iconClass} strokeWidth={2.5} />
      </button>
    </div>
  );
}
