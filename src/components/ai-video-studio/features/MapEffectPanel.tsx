import React, { useState, useRef, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import {
  MapPin, Play, Plus, Loader2, Navigation, Search, Building2,
  ChevronDown, ChevronUp, Clapperboard, RotateCcw, Check
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
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

const ANIMATION_PRESETS = [
  {
    id: 'vanish',
    name: '🌀 3D Vanish',
    desc: 'Zoom & tilt into the sky',
    duration: 4,
    keyframes: [
      { t: 0,    transform: 'perspective(800px) rotateX(0deg) scale(1)',    opacity: 1 },
      { t: 0.5,  transform: 'perspective(800px) rotateX(25deg) scale(1.4)', opacity: 0.9 },
      { t: 1,    transform: 'perspective(800px) rotateX(60deg) scale(3)',   opacity: 0 },
    ],
  },
  {
    id: 'orbit',
    name: '🛸 Orbit Pull-back',
    desc: 'Rotate & pull back to reveal',
    duration: 5,
    keyframes: [
      { t: 0,   transform: 'perspective(900px) rotateY(0deg) scale(1)',   opacity: 1 },
      { t: 0.4, transform: 'perspective(900px) rotateY(20deg) scale(0.8)', opacity: 0.85 },
      { t: 1,   transform: 'perspective(900px) rotateY(45deg) scale(0.3)', opacity: 0 },
    ],
  },
  {
    id: 'dive',
    name: '🎯 Cinematic Dive',
    desc: 'Zoom straight down into location',
    duration: 3,
    keyframes: [
      { t: 0,   transform: 'scale(1)',   opacity: 1 },
      { t: 0.6, transform: 'scale(2.2)', opacity: 0.7 },
      { t: 1,   transform: 'scale(6)',   opacity: 0 },
    ],
  },
  {
    id: 'spiral',
    name: '🌪️ Spiral Reveal',
    desc: 'Rotate & zoom for dramatic entry',
    duration: 4,
    keyframes: [
      { t: 0,    transform: 'perspective(700px) rotateZ(0deg) scale(1)',    opacity: 1 },
      { t: 0.5,  transform: 'perspective(700px) rotateZ(15deg) scale(1.8)', opacity: 0.7 },
      { t: 1,    transform: 'perspective(700px) rotateZ(35deg) scale(4)',   opacity: 0 },
    ],
  },
];

interface Project {
  id: string;
  name: string;
  latitude: number | null;
  longitude: number | null;
  emirate: string;
}

interface MapEffectPanelProps {
  onAddToTimeline?: (clip: { name: string; duration: number; type: string; url: string }) => void;
}

function FlyToLocation({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo([lat, lng], 15, { duration: 1.5 });
  }, [lat, lng, map]);
  return null;
}

export function MapEffectPanel({ onAddToTimeline }: MapEffectPanelProps) {
  const [address, setAddress] = useState('Downtown Dubai, UAE');
  const [coords, setCoords] = useState({ lat: 25.1972, lng: 55.2744 });
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [animStyle, setAnimStyle] = useState<React.CSSProperties>({});
  const [selectedAnimation, setSelectedAnimation] = useState(ANIMATION_PRESETS[0]);
  const [animationComplete, setAnimationComplete] = useState(false);
  const [showProjects, setShowProjects] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  const [showAnimPicker, setShowAnimPicker] = useState(false);
  const animFrameRef = useRef<number | null>(null);

  // Load real estate projects from backend
  const loadProjects = async () => {
    setIsLoadingProjects(true);
    try {
      const { data, error } = await supabase
        .from('areas')
        .select('id, name, latitude, longitude, emirate')
        .not('latitude', 'is', null)
        .order('name')
        .limit(20);
      if (!error && data) setProjects(data as Project[]);
    } catch {
      // silently fail
    } finally {
      setIsLoadingProjects(false);
    }
  };

  const handleToggleProjects = () => {
    setShowProjects(v => {
      if (!v && projects.length === 0) loadProjects();
      return !v;
    });
  };

  const handleSelectProject = (proj: Project) => {
    if (proj.latitude && proj.longitude) {
      setAddress(`${proj.name}, ${proj.emirate}`);
      setCoords({ lat: proj.latitude, lng: proj.longitude });
      setShowProjects(false);
      setAnimationComplete(false);
    } else {
      toast.error('No coordinates for this project');
    }
  };

  const handlePreset = (loc: typeof PRESET_LOCATIONS[0]) => {
    setAddress(loc.name);
    setCoords({ lat: loc.lat, lng: loc.lng });
    setAnimationComplete(false);
  };

  // Geocode address via Nominatim
  const handleGeocode = async () => {
    if (!address.trim()) return;
    setIsGeocoding(true);
    try {
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`;
      const res = await fetch(url, { headers: { 'Accept-Language': 'en' } });
      const data = await res.json();
      if (data.length > 0) {
        setCoords({ lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) });
        toast.success(`Found: ${data[0].display_name.split(',').slice(0, 2).join(', ')}`);
      } else {
        toast.error('Location not found. Try a more specific address.');
      }
    } catch {
      toast.error('Geocoding failed. Check your internet connection.');
    } finally {
      setIsGeocoding(false);
    }
  };

  // Animate map using CSS keyframe interpolation
  const handleAnimate = useCallback(() => {
    setIsAnimating(true);
    setAnimationComplete(false);

    const kf = selectedAnimation.keyframes;
    const totalMs = selectedAnimation.duration * 1000;
    const start = performance.now();

    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
    const easeInOut = (t: number) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

    const tick = (now: number) => {
      const raw = Math.min((now - start) / totalMs, 1);
      const t = easeInOut(raw);

      // Find surrounding keyframes
      let kfA = kf[0], kfB = kf[kf.length - 1];
      for (let i = 0; i < kf.length - 1; i++) {
        if (t >= kf[i].t && t <= kf[i + 1].t) {
          kfA = kf[i];
          kfB = kf[i + 1];
          break;
        }
      }
      const segT = kfA.t === kfB.t ? 1 : (t - kfA.t) / (kfB.t - kfA.t);
      const opacity = lerp(kfA.opacity, kfB.opacity, segT);

      setAnimStyle({
        transform: raw < 1 ? kfB.transform : 'none',
        opacity,
        transition: 'none',
      });

      if (raw < 1) {
        animFrameRef.current = requestAnimationFrame(tick);
      } else {
        // Hold final frame briefly then reset
        setTimeout(() => {
          setAnimStyle({});
          setIsAnimating(false);
          setAnimationComplete(true);
        }, 400);
      }
    };

    animFrameRef.current = requestAnimationFrame(tick);
  }, [selectedAnimation]);

  // Cleanup on unmount
  useEffect(() => {
    return () => { if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current); };
  }, []);

  const handleAddToTimeline = () => {
    const clipName = `Map: ${address} — ${selectedAnimation.name}`;
    onAddToTimeline?.({
      name: clipName,
      duration: selectedAnimation.duration,
      type: 'image', // represents a generated visual clip
      url: `map-effect://${coords.lat},${coords.lng}/${selectedAnimation.id}`,
    });
    toast.success(`🗺️ "${clipName}" added to timeline!`);
    setAnimationComplete(false);
  };

  return (
    <div className="h-full flex bg-slate-900 text-white overflow-hidden">

      {/* ── Left Controls ── */}
      <div className="w-64 flex-shrink-0 flex flex-col border-r border-slate-700 overflow-y-auto">
        <div className="p-3 space-y-3 flex-1">

          {/* Address Search */}
          <div>
            <p className="text-xs text-amber-400 font-bold uppercase mb-1.5 tracking-wide">📍 Location</p>
            <div className="flex gap-1">
              <input
                value={address}
                onChange={e => { setAddress(e.target.value); setAnimationComplete(false); }}
                onKeyDown={e => e.key === 'Enter' && handleGeocode()}
                className="flex-1 bg-slate-800 border border-slate-600 rounded-md px-2 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
                placeholder="Type address or place..."
              />
              <button
                onClick={handleGeocode}
                disabled={isGeocoding}
                className="bg-slate-700 hover:bg-slate-600 border border-slate-600 rounded-md px-2 flex items-center justify-center transition-colors"
                title="Search location"
              >
                {isGeocoding
                  ? <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
                  : <Search className="w-3.5 h-3.5 text-slate-300" />
                }
              </button>
            </div>
          </div>

          {/* Real Estate Projects */}
          <div>
            <button
              onClick={handleToggleProjects}
              className="w-full flex items-center justify-between text-xs text-slate-300 font-semibold py-1.5 px-2 rounded-md bg-slate-800 border border-slate-700 hover:border-amber-400/50 transition-colors"
            >
              <span className="flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-amber-400" />
                Real Estate Projects
              </span>
              {isLoadingProjects
                ? <Loader2 className="w-3 h-3 animate-spin" />
                : showProjects ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />
              }
            </button>
            {showProjects && (
              <div className="mt-1.5 space-y-0.5 max-h-36 overflow-y-auto rounded-md border border-slate-700 bg-slate-850">
                {projects.length === 0 && !isLoadingProjects && (
                  <p className="text-xs text-slate-500 p-2 text-center">No projects with coordinates</p>
                )}
                {projects.map(proj => (
                  <button
                    key={proj.id}
                    onClick={() => handleSelectProject(proj)}
                    className={`w-full text-left text-xs px-2.5 py-1.5 transition-colors hover:bg-slate-700 ${
                      address.startsWith(proj.name) ? 'text-amber-300 bg-amber-400/10' : 'text-slate-300'
                    }`}
                  >
                    <span className="font-medium">{proj.name}</span>
                    <span className="text-slate-500 ml-1">· {proj.emirate}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Quick Locations */}
          <div>
            <p className="text-xs text-slate-400 font-semibold mb-1.5 uppercase tracking-wide">Quick Locations</p>
            <div className="flex flex-col gap-1">
              {PRESET_LOCATIONS.map(loc => (
                <button
                  key={loc.name}
                  onClick={() => handlePreset(loc)}
                  className={`text-left text-xs px-2 py-1.5 rounded border transition-all ${
                    address === loc.name
                      ? 'border-amber-400 bg-amber-400/15 text-amber-300'
                      : 'border-slate-700 bg-slate-800 text-slate-300 hover:border-amber-400/40 hover:text-white'
                  }`}
                >
                  {loc.name}
                </button>
              ))}
            </div>
          </div>

          {/* Animation Style */}
          <div>
            <button
              onClick={() => setShowAnimPicker(v => !v)}
              className="w-full flex items-center justify-between text-xs text-slate-300 font-semibold py-1.5 px-2 rounded-md bg-slate-800 border border-slate-700 hover:border-amber-400/50 transition-colors"
            >
              <span className="flex items-center gap-1.5">
                <Clapperboard className="w-3.5 h-3.5 text-amber-400" />
                {selectedAnimation.name}
              </span>
              {showAnimPicker ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
            {showAnimPicker && (
              <div className="mt-1.5 space-y-1">
                {ANIMATION_PRESETS.map(anim => (
                  <button
                    key={anim.id}
                    onClick={() => { setSelectedAnimation(anim); setShowAnimPicker(false); setAnimationComplete(false); }}
                    className={`w-full text-left px-2.5 py-2 rounded-md border transition-all text-xs ${
                      selectedAnimation.id === anim.id
                        ? 'border-amber-400 bg-amber-400/10 text-amber-300'
                        : 'border-slate-700 bg-slate-800 text-slate-300 hover:border-amber-400/40'
                    }`}
                  >
                    <div className="font-medium">{anim.name}</div>
                    <div className="text-slate-500 mt-0.5">{anim.desc} · {anim.duration}s</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="p-3 border-t border-slate-700 flex flex-col gap-2">
          <button
            onClick={handleAnimate}
            disabled={isAnimating}
            className="flex items-center justify-center gap-2 w-full py-2 rounded-md text-xs font-bold bg-amber-500 text-black hover:bg-amber-400 disabled:opacity-50 transition-all"
          >
            {isAnimating
              ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Animating…</>
              : <><Play className="w-3.5 h-3.5" />Preview {selectedAnimation.name}</>
            }
          </button>
          <button
            onClick={handleAddToTimeline}
            disabled={!animationComplete}
            className={`flex items-center justify-center gap-2 w-full py-2 rounded-md text-xs font-semibold border transition-all ${
              animationComplete
                ? 'border-amber-400 text-amber-300 bg-amber-400/10 hover:bg-amber-400/20'
                : 'border-slate-600 text-slate-500 cursor-not-allowed opacity-50'
            }`}
          >
            {animationComplete
              ? <><Check className="w-3.5 h-3.5" />Add to Timeline</>
              : <><Plus className="w-3.5 h-3.5" />Preview first to add</>
            }
          </button>
        </div>
      </div>

      {/* ── Map Preview ── */}
      <div className="flex-1 relative overflow-hidden bg-black">
        {/* Animated map container */}
        <div
          className="w-full h-full"
          style={{
            ...animStyle,
            transformOrigin: 'center center',
            willChange: 'transform, opacity',
          }}
        >
          <MapContainer
            center={[coords.lat, coords.lng]}
            zoom={15}
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

        {/* Animating overlay */}
        {isAnimating && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-20 pointer-events-none">
            <div className="flex items-center gap-2 bg-black/80 px-3 py-2 rounded-full border border-amber-400/40">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-amber-400 text-xs font-bold">REC — {selectedAnimation.name}</span>
            </div>
          </div>
        )}

        {/* Animation complete badge */}
        {animationComplete && !isAnimating && (
          <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none animate-fade-in">
            <div className="flex flex-col items-center gap-2 bg-black/80 px-5 py-4 rounded-xl border border-amber-400/50">
              <Check className="w-6 h-6 text-amber-400" />
              <span className="text-amber-400 text-xs font-bold">Animation Ready!</span>
              <span className="text-slate-400 text-xs">Click "Add to Timeline"</span>
            </div>
          </div>
        )}

        {/* Location badge */}
        <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded-md border border-amber-400/30 z-10 flex items-center gap-1.5 max-w-[60%] truncate">
          <Navigation className="w-3 h-3 text-amber-400 shrink-0" />
          <span className="truncate">{address}</span>
        </div>

        {/* Animation style badge */}
        <div className="absolute top-2 right-2 bg-black/70 text-amber-300 text-xs px-2 py-1 rounded-md border border-amber-400/20 z-10">
          {selectedAnimation.name} · {selectedAnimation.duration}s
        </div>

        {/* Reset button */}
        {animationComplete && (
          <button
            onClick={() => setAnimationComplete(false)}
            className="absolute bottom-2 right-2 z-20 bg-slate-800/90 hover:bg-slate-700 border border-slate-600 rounded-md p-1.5 text-slate-400 hover:text-white transition-colors"
            title="Reset"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
