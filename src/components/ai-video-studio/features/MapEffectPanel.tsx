import React, { useState, useRef, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import { MapPin, Play, Plus, Loader2, Navigation } from 'lucide-react';
import { toast } from 'sonner';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix leaflet default icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const PRESET_LOCATIONS = [
  { name: 'Downtown Dubai', lat: 25.1972, lng: 55.2744 },
  { name: 'Palm Jumeirah', lat: 25.1124, lng: 55.1390 },
  { name: 'Dubai Marina', lat: 25.0657, lng: 55.1403 },
  { name: 'Business Bay', lat: 25.1865, lng: 55.2632 },
  { name: 'Jumeirah Beach', lat: 25.2197, lng: 55.2582 },
  { name: 'Abu Dhabi Corniche', lat: 24.4539, lng: 54.3773 },
];

function FlyToLocation({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo([lat, lng], 15, { duration: 1.5 });
  }, [lat, lng, map]);
  return null;
}

export function MapEffectPanel() {
  const [address, setAddress] = useState('Downtown Dubai, UAE');
  const [coords, setCoords] = useState({ lat: 25.1972, lng: 55.2744 });
  const [isAnimating, setIsAnimating] = useState(false);
  const [animStyle, setAnimStyle] = useState<React.CSSProperties>({});
  const mapWrapperRef = useRef<HTMLDivElement>(null);

  const handlePreset = (loc: typeof PRESET_LOCATIONS[0]) => {
    setAddress(loc.name);
    setCoords({ lat: loc.lat, lng: loc.lng });
  };

  const handleAnimate = () => {
    setIsAnimating(true);
    // CSS 3D vanish: zoom in + tilt perspective
    setAnimStyle({
      transition: 'all 1.5s cubic-bezier(0.4, 0, 0.2, 1)',
      transform: 'perspective(600px) rotateX(45deg) scale(2.5)',
      opacity: 0,
    });
    setTimeout(() => {
      setAnimStyle({});
      setIsAnimating(false);
      toast.success('Map fly-in animation complete! Add to timeline to use it.');
    }, 1600);
  };

  const handleAddToTimeline = () => {
    toast.success(`Map clip "${address}" added to timeline`);
  };

  return (
    <div className="h-full flex bg-slate-900 text-white overflow-hidden">
      {/* Left: Controls */}
      <div className="w-64 flex-shrink-0 p-3 border-r border-slate-700 flex flex-col gap-3 overflow-y-auto">
        <div>
          <p className="text-xs text-amber-400 font-bold uppercase mb-1.5">Location</p>
          <input
            value={address}
            onChange={e => setAddress(e.target.value)}
            className="w-full bg-slate-800 border border-slate-600 rounded-md px-2 py-1.5 text-xs text-white placeholder:text-slate-400"
            placeholder="Enter address..."
          />
        </div>

        <div>
          <p className="text-xs text-slate-300 font-semibold mb-1.5">📍 Quick Locations</p>
          <div className="flex flex-col gap-1">
            {PRESET_LOCATIONS.map(loc => (
              <button
                key={loc.name}
                onClick={() => handlePreset(loc)}
                className={`text-left text-xs px-2 py-1.5 rounded border transition-all ${
                  address === loc.name
                    ? 'border-amber-400 bg-amber-400/15 text-amber-300'
                    : 'border-slate-600 bg-slate-800 text-slate-200 hover:border-amber-400/50 hover:text-white'
                }`}
              >
                {loc.name}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-auto flex flex-col gap-2">
          <button
            onClick={handleAnimate}
            disabled={isAnimating}
            className="flex items-center justify-center gap-2 w-full py-2 rounded-md text-xs font-bold bg-amber-500 text-black hover:bg-amber-400 disabled:opacity-50 transition-all"
          >
            {isAnimating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
            {isAnimating ? 'Animating...' : 'Preview 3D Fly-in'}
          </button>
          <button
            onClick={handleAddToTimeline}
            className="flex items-center justify-center gap-2 w-full py-2 rounded-md text-xs font-semibold border border-amber-400/60 text-amber-300 hover:bg-amber-400/10 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            Add to Timeline
          </button>
        </div>
      </div>

      {/* Right: Map Preview */}
      <div className="flex-1 relative overflow-hidden" ref={mapWrapperRef}>
        <div
          className="w-full h-full"
          style={{ ...animStyle, transformOrigin: 'center center' }}
        >
          <MapContainer
            center={[coords.lat, coords.lng]}
            zoom={14}
            style={{ height: '100%', width: '100%' }}
            zoomControl={false}
            attributionControl={false}
          >
            <TileLayer
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            />
            <Marker position={[coords.lat, coords.lng]} />
            <FlyToLocation lat={coords.lat} lng={coords.lng} />
          </MapContainer>
        </div>
        {isAnimating && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-10">
            <div className="text-amber-400 text-sm font-bold animate-pulse">🎬 Recording fly-in...</div>
          </div>
        )}
        <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded border border-amber-400/30 z-10">
          <Navigation className="w-3 h-3 inline mr-1 text-amber-400" />
          {address}
        </div>
      </div>
    </div>
  );
}
