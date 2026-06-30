import React, { useCallback, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, Trash2, GripVertical, Play, Film, ChevronUp, ChevronDown, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { TRANSITION_TYPES } from '../types';

// ─── Ken Burns animation presets ─────────────────────────────────────────────
const KEN_BURNS_PRESETS = [
  { id: 'zoom-in-center',   name: 'Zoom In (Center)',   desc: 'Slow zoom toward center' },
  { id: 'zoom-out-center',  name: 'Zoom Out (Center)',  desc: 'Start zoomed, pull back' },
  { id: 'pan-left',         name: 'Pan Left',           desc: 'Slow pan from right to left' },
  { id: 'pan-right',        name: 'Pan Right',          desc: 'Slow pan from left to right' },
  { id: 'pan-up',           name: 'Pan Up',             desc: 'Slow pan from bottom to top' },
  { id: 'pan-down',         name: 'Pan Down',           desc: 'Slow pan from top to bottom' },
  { id: 'zoom-pan-tl',      name: 'Zoom + Pan TL',     desc: 'Zoom in toward top-left' },
  { id: 'zoom-pan-br',      name: 'Zoom + Pan BR',     desc: 'Zoom in toward bottom-right' },
  { id: 'random',           name: 'Random',             desc: 'Randomize per photo' },
] as const;

type KenBurnsId = typeof KEN_BURNS_PRESETS[number]['id'];

interface PhotoItem {
  id: string;
  file: File;
  url: string;
  name: string;
  duration: number;
  kenBurns: KenBurnsId;
}

interface BatchPhotoVideoPanelProps {
  onBuildTimeline: (photos: {
    name: string;
    url: string;
    duration: number;
    kenBurns: KenBurnsId;
    transition: string;
  }[]) => void;
}

const C = {
  bgCard: '#18181F',
  bgButton: '#1E1E28',
  bgButtonHov: '#252530',
  borderSubtle: 'rgba(255,255,255,0.06)',
  borderAccent: 'rgba(200,168,122,0.35)',
  textPrimary: '#F1F0EE',
  textSecondary: '#8A8A9A',
  accent: '#C8A87A',
  accentGlow: 'rgba(200,168,122,0.15)',
};

export function BatchPhotoVideoPanel({ onBuildTimeline }: BatchPhotoVideoPanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [globalDuration, setGlobalDuration] = useState(4);
  const [globalKenBurns, setGlobalKenBurns] = useState<KenBurnsId>('random');
  const [globalTransition, setGlobalTransition] = useState('fade');
  const [transitionDuration, setTransitionDuration] = useState(0.8);
  const [previewIdx, setPreviewIdx] = useState<number | null>(null);

  const handleFiles = useCallback((files: FileList | null) => {
    if (!files) return;
    const imageFiles = Array.from(files).filter(f => f.type.startsWith('image/'));
    if (imageFiles.length === 0) { toast.error('No image files selected'); return; }

    const randomKB = (): KenBurnsId => {
      const opts = KEN_BURNS_PRESETS.filter(p => p.id !== 'random');
      return opts[Math.floor(Math.random() * opts.length)].id;
    };

    const newPhotos: PhotoItem[] = imageFiles.map(file => ({
      id: crypto.randomUUID(),
      file,
      url: URL.createObjectURL(file),
      name: file.name,
      duration: globalDuration,
      kenBurns: globalKenBurns === 'random' ? randomKB() : globalKenBurns,
    }));

    setPhotos(prev => [...prev, ...newPhotos]);
    toast.success(`Added ${newPhotos.length} photo${newPhotos.length > 1 ? 's' : ''}`);
  }, [globalDuration, globalKenBurns]);

  const removePhoto = (id: string) => {
    setPhotos(prev => {
      const photo = prev.find(p => p.id === id);
      if (photo) URL.revokeObjectURL(photo.url);
      return prev.filter(p => p.id !== id);
    });
  };

  const movePhoto = (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= photos.length) return;
    setPhotos(prev => {
      const arr = [...prev];
      [arr[idx], arr[target]] = [arr[target], arr[idx]];
      return arr;
    });
  };

  const updatePhotoDuration = (id: string, duration: number) => {
    setPhotos(prev => prev.map(p => p.id === id ? { ...p, duration } : p));
  };

  const updatePhotoKenBurns = (id: string, kenBurns: KenBurnsId) => {
    setPhotos(prev => prev.map(p => p.id === id ? { ...p, kenBurns } : p));
  };

  const applyGlobalSettings = () => {
    const randomKB = (): KenBurnsId => {
      const opts = KEN_BURNS_PRESETS.filter(p => p.id !== 'random');
      return opts[Math.floor(Math.random() * opts.length)].id;
    };
    setPhotos(prev => prev.map(p => ({
      ...p,
      duration: globalDuration,
      kenBurns: globalKenBurns === 'random' ? randomKB() : globalKenBurns,
    })));
    toast.success('Applied to all photos');
  };

  const totalDuration = photos.reduce((sum, p) => sum + p.duration, 0);

  const handleBuild = () => {
    if (photos.length === 0) { toast.error('Add at least one photo'); return; }
    onBuildTimeline(photos.map(p => ({
      name: p.name,
      url: p.url,
      duration: p.duration,
      kenBurns: p.kenBurns,
      transition: globalTransition,
    })));
    toast.success(`🎬 Built slideshow: ${photos.length} photos, ${totalDuration.toFixed(1)}s`);
  };

  return (
    <div className="flex flex-col gap-3 p-3 h-full overflow-y-auto" style={{ color: C.textPrimary }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Film size={16} style={{ color: C.accent }} />
          <span className="text-sm font-semibold">Batch Photo → Video</span>
        </div>
        <Badge variant="outline" className="text-xs" style={{ borderColor: C.borderAccent, color: C.accent }}>
          {photos.length} photos · {totalDuration.toFixed(1)}s
        </Badge>
      </div>

      {/* Upload Zone */}
      <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden"
        onChange={e => { handleFiles(e.target.files); e.target.value = ''; }} />
      <button
        onClick={() => fileInputRef.current?.click()}
        className="flex flex-col items-center gap-2 py-6 rounded-lg border-2 border-dashed transition-colors cursor-pointer"
        style={{ borderColor: C.borderAccent, background: C.accentGlow }}
        onDragOver={e => e.preventDefault()}
        onDrop={e => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
      >
        <Upload size={24} style={{ color: C.accent }} />
        <span className="text-xs" style={{ color: C.textSecondary }}>
          Drop images or click to upload (batch)
        </span>
      </button>

      {/* Global Settings */}
      <div className="rounded-lg p-3 space-y-3" style={{ background: C.bgCard, border: `1px solid ${C.borderSubtle}` }}>
        <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: C.textSecondary }}>
          Global Settings
        </span>

        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span>Duration per photo</span>
            <span style={{ color: C.accent }}>{globalDuration}s</span>
          </div>
          <Slider min={1} max={15} step={0.5} value={[globalDuration]}
            onValueChange={([v]) => setGlobalDuration(v)} />
        </div>

        <div className="space-y-1">
          <span className="text-xs">Ken Burns Animation</span>
          <Select value={globalKenBurns} onValueChange={(v) => setGlobalKenBurns(v as KenBurnsId)}>
            <SelectTrigger className="h-8 text-xs" style={{ background: C.bgButton, borderColor: C.borderSubtle }}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {KEN_BURNS_PRESETS.map(p => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <span className="text-xs">Transition</span>
          <Select value={globalTransition} onValueChange={setGlobalTransition}>
            <SelectTrigger className="h-8 text-xs" style={{ background: C.bgButton, borderColor: C.borderSubtle }}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TRANSITION_TYPES.map(t => (
                <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span>Transition duration</span>
            <span style={{ color: C.accent }}>{transitionDuration}s</span>
          </div>
          <Slider min={0.3} max={2} step={0.1} value={[transitionDuration]}
            onValueChange={([v]) => setTransitionDuration(v)} />
        </div>

        {photos.length > 0 && (
          <Button size="sm" variant="outline" className="w-full text-xs" onClick={applyGlobalSettings}
            style={{ borderColor: C.borderAccent, color: C.accent }}>
            Apply to All Photos
          </Button>
        )}
      </div>

      {/* Photo List */}
      {photos.length > 0 && (
        <div className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: C.textSecondary }}>
            Photo Sequence
          </span>
          {photos.map((photo, idx) => (
            <div key={photo.id} className="rounded-lg p-2 space-y-2"
              style={{ background: C.bgCard, border: `1px solid ${previewIdx === idx ? C.borderAccent : C.borderSubtle}` }}>
              <div className="flex items-center gap-2">
                {/* Thumbnail */}
                <div className="w-12 h-12 rounded overflow-hidden flex-shrink-0 cursor-pointer"
                  onClick={() => setPreviewIdx(previewIdx === idx ? null : idx)}
                  style={{ border: `1px solid ${C.borderSubtle}` }}>
                  <img src={photo.url} alt={photo.name} className="w-full h-full object-cover"  loading="lazy" decoding="async" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="text-xs truncate">{photo.name}</div>
                  <div className="text-xs" style={{ color: C.textSecondary }}>
                    {photo.duration}s · {KEN_BURNS_PRESETS.find(p => p.id === photo.kenBurns)?.name}
                  </div>
                </div>

                {/* Reorder + Delete */}
                <div className="flex flex-col gap-0.5">
                  <button onClick={() => movePhoto(idx, -1)} disabled={idx === 0}
                    className="p-0.5 rounded disabled:opacity-20" style={{ color: C.textSecondary }}>
                    <ChevronUp size={12} />
                  </button>
                  <button onClick={() => movePhoto(idx, 1)} disabled={idx === photos.length - 1}
                    className="p-0.5 rounded disabled:opacity-20" style={{ color: C.textSecondary }}>
                    <ChevronDown size={12} />
                  </button>
                </div>
                <button onClick={() => removePhoto(photo.id)} className="p-1 rounded hover:bg-red-900/30"
                  style={{ color: '#E05252' }}>
                  <Trash2 size={14} />
                </button>
              </div>

              {/* Expanded per-photo settings */}
              {previewIdx === idx && (
                <div className="space-y-2 pt-1 border-t" style={{ borderColor: C.borderSubtle }}>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>Duration</span>
                      <span style={{ color: C.accent }}>{photo.duration}s</span>
                    </div>
                    <Slider min={1} max={15} step={0.5} value={[photo.duration]}
                      onValueChange={([v]) => updatePhotoDuration(photo.id, v)} />
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs">Ken Burns</span>
                    <Select value={photo.kenBurns} onValueChange={(v) => updatePhotoKenBurns(photo.id, v as KenBurnsId)}>
                      <SelectTrigger className="h-7 text-xs" style={{ background: C.bgButton, borderColor: C.borderSubtle }}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {KEN_BURNS_PRESETS.filter(p => p.id !== 'random').map(p => (
                          <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Ken Burns Preview */}
                  <div className="relative w-full h-32 rounded overflow-hidden" style={{ background: '#000' }}>
                    <img
                      src={photo.url}
                      alt="preview"
                      className="absolute inset-0 w-full h-full object-cover"
                      style={{
                        animation: `kb-${photo.kenBurns} ${photo.duration}s ease-in-out infinite alternate`,
                      }}
                     loading="lazy" decoding="async" />
                    <div className="absolute bottom-1 right-1">
                      <Badge variant="outline" className="text-[10px]" style={{ background: 'rgba(0,0,0,0.7)', borderColor: C.borderAccent, color: C.accent }}>
                        Ken Burns Preview
                      </Badge>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Build Button */}
      {photos.length >= 2 && (
        <Button onClick={handleBuild} className="w-full gap-2"
          style={{ background: C.accent, color: '#0A0A0F', fontWeight: 600 }}>
          <Play size={16} />
          Build Slideshow ({photos.length} photos · {totalDuration.toFixed(1)}s)
        </Button>
      )}
      {photos.length === 1 && (
        <p className="text-xs text-center" style={{ color: C.textSecondary }}>
          Add at least 2 photos to build a slideshow
        </p>
      )}

      {/* Ken Burns CSS Keyframes */}
      <style>{`
        @keyframes kb-zoom-in-center {
          from { transform: scale(1); }
          to   { transform: scale(1.25); }
        }
        @keyframes kb-zoom-out-center {
          from { transform: scale(1.25); }
          to   { transform: scale(1); }
        }
        @keyframes kb-pan-left {
          from { transform: scale(1.15) translateX(5%); }
          to   { transform: scale(1.15) translateX(-5%); }
        }
        @keyframes kb-pan-right {
          from { transform: scale(1.15) translateX(-5%); }
          to   { transform: scale(1.15) translateX(5%); }
        }
        @keyframes kb-pan-up {
          from { transform: scale(1.15) translateY(5%); }
          to   { transform: scale(1.15) translateY(-5%); }
        }
        @keyframes kb-pan-down {
          from { transform: scale(1.15) translateY(-5%); }
          to   { transform: scale(1.15) translateY(5%); }
        }
        @keyframes kb-zoom-pan-tl {
          from { transform: scale(1) translate(0, 0); }
          to   { transform: scale(1.3) translate(-5%, -5%); }
        }
        @keyframes kb-zoom-pan-br {
          from { transform: scale(1) translate(0, 0); }
          to   { transform: scale(1.3) translate(5%, 5%); }
        }
      `}</style>
    </div>
  );
}
