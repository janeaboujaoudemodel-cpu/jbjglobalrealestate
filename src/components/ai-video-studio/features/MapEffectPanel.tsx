import React, { useState, useRef, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import {
  MapPin, Play, Plus, Loader2, Navigation, Search, Building2,
  ChevronDown, ChevronUp, Clapperboard, Check
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
  { name: 'Downtown Dubai',    lat: 25.1972, lng: 55.2744 },
  { name: 'Palm Jumeirah',     lat: 25.1124, lng: 55.1390 },
  { name: 'Dubai Marina',      lat: 25.0657, lng: 55.1403 },
  { name: 'Business Bay',      lat: 25.1865, lng: 55.2632 },
  { name: 'Jumeirah Beach',    lat: 25.2197, lng: 55.2582 },
  { name: 'Abu Dhabi Corniche',lat: 24.4539, lng: 54.3773 },
];

const ANIMATION_PRESETS = [
  {
    id: 'vanish',
    name: '🌀 3D Vanish',
    desc: 'Zoom & tilt into the sky',
    duration: 4,
    keyframes: [
      { t: 0,   transform: 'perspective(800px) rotateX(0deg) scale(1)',   opacity: 1 },
      { t: 0.5, transform: 'perspective(800px) rotateX(25deg) scale(1.4)',opacity: 0.9 },
      { t: 1,   transform: 'perspective(800px) rotateX(60deg) scale(3)',  opacity: 0 },
    ],
  },
  {
    id: 'orbit',
    name: '🛸 Orbit Pull-back',
    desc: 'Rotate & pull back to reveal',
    duration: 5,
    keyframes: [
      { t: 0,   transform: 'perspective(900px) rotateY(0deg) scale(1)',   opacity: 1 },
      { t: 0.4, transform: 'perspective(900px) rotateY(20deg) scale(0.8)',opacity: 0.85 },
      { t: 1,   transform: 'perspective(900px) rotateY(45deg) scale(0.3)',opacity: 0 },
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
      { t: 0,   transform: 'perspective(700px) rotateZ(0deg) scale(1)',   opacity: 1 },
      { t: 0.5, transform: 'perspective(700px) rotateZ(15deg) scale(1.8)',opacity: 0.7 },
      { t: 1,   transform: 'perspective(700px) rotateZ(35deg) scale(4)',  opacity: 0 },
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
  useEffect(() => { map.flyTo([lat, lng], 15, { duration: 1.5 }); }, [lat, lng, map]);
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
    } catch { /* silent */ } finally {
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

  const handleGeocode = async () => {
    if (!address.trim()) return;
    setIsGeocoding(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`,
        { headers: { 'Accept-Language': 'en' } }
      );
      const data = await res.json();
      if (data.length > 0) {
        setCoords({ lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) });
        toast.success(`Found: ${data[0].display_name.split(',').slice(0, 2).join(', ')}`);
      } else {
        toast.error('Location not found. Try a more specific address.');
      }
    } catch {
      toast.error('Geocoding failed.');
    } finally {
      setIsGeocoding(false);
    }
  };

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
      let kfA = kf[0], kfB = kf[kf.length - 1];
      for (let i = 0; i < kf.length - 1; i++) {
        if (t >= kf[i].t && t <= kf[i + 1].t) { kfA = kf[i]; kfB = kf[i + 1]; break; }
      }
      const segT = kfA.t === kfB.t ? 1 : (t - kfA.t) / (kfB.t - kfA.t);
      setAnimStyle({ transform: raw < 1 ? kfB.transform : 'none', opacity: lerp(kfA.opacity, kfB.opacity, segT), transition: 'none' });
      if (raw < 1) {
        animFrameRef.current = requestAnimationFrame(tick);
      } else {
        setTimeout(() => { setAnimStyle({}); setIsAnimating(false); setAnimationComplete(true); }, 400);
      }
    };
    animFrameRef.current = requestAnimationFrame(tick);
  }, [selectedAnimation]);

  useEffect(() => {
    return () => { if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current); };
  }, []);

  const handleAddToTimeline = () => {
    const clipName = `Map: ${address} — ${selectedAnimation.name}`;
    onAddToTimeline?.({ name: clipName, duration: selectedAnimation.duration, type: 'image', url: `map-effect://${coords.lat},${coords.lng}/${selectedAnimation.id}` });
    toast.success(`🗺️ "${clipName}" inserted into timeline!`);
    setAnimationComplete(false);
  };

  return (
    <div className="h-full flex flex-col bg-slate-900 text-white overflow-hidden">
      <div className="flex-1 overflow-y-auto overscroll-contain">
        <div className="p-3 space-y-3">

          {/* Address Search */}
          <div>
            <p className="text-[10px] text-amber-400 font-bold uppercase tracking-widest mb-1.5">📍 Location</p>
            <div className="flex gap-1.5">
              <input
                value={address}
                onChange={e => { setAddress(e.target.value); setAnimationComplete(false); }}
                onKeyDown={e => e.key === 'Enter' && handleGeocode()}
                className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400 transition-colors"
                placeholder="Type address or place..."
              />
              <button
                onClick={handleGeocode}
                disabled={isGeocoding}
                className="bg-amber-500 hover:bg-amber-400 text-black rounded-lg px-2.5 flex items-center justify-center transition-colors font-bold disabled:opacity-50"
              >
                {isGeocoding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Real Estate Projects */}
          <div>
            <button
              onClick={handleToggleProjects}
              className="w-full flex items-center justify-between text-xs text-slate-300 font-semibold py-1.5 px-2.5 rounded-lg bg-slate-800 border border-slate-700 hover:border-amber-400/50 transition-colors"
            >
              <span className="flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-amber-400" />
                Real Estate Projects
              </span>
              {isLoadingProjects ? <Loader2 className="w-3 h-3 animate-spin" />
                : showProjects ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
            {showProjects && (
              <div className="mt-1.5 max-h-28 overflow-y-auto rounded-lg border border-slate-700 bg-slate-800">
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
            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-widest mb-1.5">Quick Locations</p>
            <div className="grid grid-cols-2 gap-1">
              {PRESET_LOCATIONS.map(loc => (
                <button
                  key={loc.name}
                  onClick={() => handlePreset(loc)}
                  className={`text-left text-[10px] px-2 py-1.5 rounded-md border transition-all leading-tight ${
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
            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-widest mb-1.5">Exit Animation</p>
            <button
              onClick={() => setShowAnimPicker(v => !v)}
              className="w-full flex items-center justify-between text-xs text-slate-300 font-semibold py-1.5 px-2.5 rounded-lg bg-slate-800 border border-slate-700 hover:border-amber-400/50 transition-colors"
            >
              <span className="flex items-center gap-1.5">
                <Clapperboard className="w-3.5 h-3.5 text-amber-400" />
                {selectedAnimation.name}
                <span className="text-slate-500 font-normal">· {selectedAnimation.duration}s</span>
              </span>
              {showAnimPicker ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
            {showAnimPicker && (
              <div className="mt-1.5 space-y-1">
                {ANIMATION_PRESETS.map(anim => (
                  <button
                    key={anim.id}
                    onClick={() => { setSelectedAnimation(anim); setShowAnimPicker(false); setAnimationComplete(false); }}
                    className={`w-full text-left px-2.5 py-2 rounded-lg border transition-all text-xs ${
                      selectedAnimation.id === anim.id
                        ? 'border-amber-400 bg-amber-400/10 text-amber-300'
                        : 'border-slate-700 bg-slate-800 text-slate-300 hover:border-amber-400/40'
                    }`}
                  >
                    <div className="font-semibold">{anim.name}</div>
                    <div className="text-slate-500 mt-0.5">{anim.desc} · {anim.duration}s</div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Compact Map Thumbnail */}
          <div>
            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-widest mb-1.5">Map Preview</p>
            <div
              className="relative w-full rounded-lg overflow-hidden border border-slate-700"
              style={{ height: 80, ...animStyle, transformOrigin: 'center center', willChange: 'transform, opacity' }}
            >
              <MapContainer
                center={[coords.lat, coords.lng]}
                zoom={14}
                style={{ height: '100%', width: '100%' }}
                zoomControl={false}
                attributionControl={false}
              >
                <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" />
                <Marker position={[coords.lat, coords.lng]} />
                <FlyToLocation lat={coords.lat} lng={coords.lng} />
              </MapContainer>

              <div className="absolute top-1 left-1 bg-black/75 text-white text-[9px] px-1.5 py-0.5 rounded flex items-center gap-1 z-10 max-w-[75%] truncate">
                <Navigation className="w-2 h-2 text-amber-400 shrink-0" />
                <span className="truncate">{address}</span>
              </div>

              {isAnimating && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-20 pointer-events-none">
                  <div className="flex items-center gap-1.5 bg-black/90 px-2 py-1 rounded-full border border-amber-400/40">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                    <span className="text-amber-400 text-[9px] font-bold">Previewing…</span>
                  </div>
                </div>
              )}

              {animationComplete && !isAnimating && (
                <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
                  <div className="flex items-center gap-1.5 bg-black/90 px-2 py-1 rounded-full border border-green-500/50">
                    <Check className="w-2.5 h-2.5 text-green-400" />
                    <span className="text-green-400 text-[9px] font-bold">Ready to Insert</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* CTA Buttons */}
      <div className="p-3 border-t border-slate-700 flex gap-2 flex-shrink-0">
        <button
          onClick={handleAnimate}
          disabled={isAnimating}
          className="flex items-center justify-center gap-1.5 flex-1 py-2 rounded-lg text-xs font-bold bg-amber-500 text-black hover:bg-amber-400 disabled:opacity-50 transition-all"
        >
          {isAnimating
            ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Animating…</>
            : <><Play className="w-3.5 h-3.5" />Preview</>
          }
        </button>
        <button
          onClick={handleAddToTimeline}
          disabled={!animationComplete}
          className={`flex items-center justify-center gap-1.5 flex-1 py-2 rounded-lg text-xs font-bold border transition-all ${
            animationComplete
              ? 'border-green-500 text-green-400 bg-green-500/10 hover:bg-green-500/20'
              : 'border-slate-600 text-slate-500 cursor-not-allowed opacity-40'
          }`}
        >
          <Plus className="w-3.5 h-3.5" />
          {animationComplete ? 'Insert Clip' : 'Preview first'}
        </button>
      </div>
    </div>
  );
}
