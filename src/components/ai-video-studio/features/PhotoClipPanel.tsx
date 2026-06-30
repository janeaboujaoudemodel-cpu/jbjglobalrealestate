/**
 * PhotoClipPanel — Add photos as video clips with animation presets
 */
import React, { useState, useRef, useCallback } from 'react';
import { ImagePlus, Upload, Plus, Trash2, Clock, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

const C = {
  bgPrimary: '#0A0A0F',
  bgCard: '#18181F',
  bgButton: '#1E1E28',
  borderSubtle: 'rgba(255,255,255,0.06)',
  borderAccent: 'rgba(200,168,122,0.35)',
  textPrimary: '#F1F0EE',
  textSecondary: '#8A8A9A',
  accent: '#C8A87A',
  accentGlow: 'rgba(200,168,122,0.15)',
} as const;

const ANIMATION_PRESETS = [
  { id: 'static', label: 'Static', desc: 'No animation' },
  { id: 'zoom-in', label: 'Zoom In', desc: 'Slowly zoom in' },
  { id: 'zoom-out', label: 'Zoom Out', desc: 'Slowly zoom out' },
  { id: 'pan-left', label: 'Pan Left', desc: 'Horizontal pan left' },
  { id: 'pan-right', label: 'Pan Right', desc: 'Horizontal pan right' },
  { id: 'ken-burns', label: 'Ken Burns', desc: 'Slow pan + zoom' },
] as const;

interface PhotoItem {
  id: string;
  file: File;
  url: string;
  duration: number;
  animation: string;
}

interface PhotoClipPanelProps {
  onAddToTimeline?: (photos: Array<{ url: string; duration: number; name: string; animation: string }>) => void;
}

export function PhotoClipPanel({ onAddToTimeline }: PhotoClipPanelProps) {
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [selectedAnimation, setSelectedAnimation] = useState('ken-burns');
  const [defaultDuration, setDefaultDuration] = useState(5);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFilesSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const newPhotos: PhotoItem[] = [];
    Array.from(files).forEach(file => {
      if (!file.type.startsWith('image/')) return;
      newPhotos.push({
        id: crypto.randomUUID(),
        file,
        url: URL.createObjectURL(file),
        duration: defaultDuration,
        animation: selectedAnimation,
      });
    });
    setPhotos(prev => [...prev, ...newPhotos]);
    if (newPhotos.length > 0) toast.success(`${newPhotos.length} photo(s) added`);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [defaultDuration, selectedAnimation]);

  const removePhoto = useCallback((id: string) => {
    setPhotos(prev => {
      const item = prev.find(p => p.id === id);
      if (item) URL.revokeObjectURL(item.url);
      return prev.filter(p => p.id !== id);
    });
  }, []);

  const updatePhotoDuration = useCallback((id: string, duration: number) => {
    setPhotos(prev => prev.map(p => p.id === id ? { ...p, duration } : p));
  }, []);

  const updatePhotoAnimation = useCallback((id: string, animation: string) => {
    setPhotos(prev => prev.map(p => p.id === id ? { ...p, animation } : p));
  }, []);

  const handleAddAll = useCallback(() => {
    if (photos.length === 0) { toast.error('No photos to add'); return; }
    onAddToTimeline?.(photos.map(p => ({
      url: p.url,
      duration: p.duration,
      name: p.file.name,
      animation: p.animation,
    })));
    toast.success(`${photos.length} photo clip(s) added to timeline`);
  }, [photos, onAddToTimeline]);

  return (
    <div className="p-4 space-y-4" style={{ color: C.textPrimary }}>
      <div className="flex items-center gap-2 mb-2">
        <ImagePlus className="w-4 h-4" style={{ color: C.accent }} />
        <h3 className="text-sm font-semibold">Photo Clips</h3>
      </div>
      <p className="text-xs" style={{ color: C.textSecondary }}>
        Add photos as video clips with custom duration and animation presets.
      </p>

      {/* Default settings */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[10px] uppercase tracking-wider mb-1 block" style={{ color: C.textSecondary }}>
            <Clock className="w-3 h-3 inline mr-1" />Duration (s)
          </label>
          <input
            type="range" min={2} max={15} step={0.5} value={defaultDuration}
            onChange={e => setDefaultDuration(Number(e.target.value))}
            className="w-full accent-[#C8A87A]"
          />
          <span className="text-[10px]" style={{ color: C.textSecondary }}>{defaultDuration}s</span>
        </div>
        <div>
          <label className="text-[10px] uppercase tracking-wider mb-1 block" style={{ color: C.textSecondary }}>
            <Sparkles className="w-3 h-3 inline mr-1" />Animation
          </label>
          <select
            value={selectedAnimation}
            onChange={e => setSelectedAnimation(e.target.value)}
            className="w-full text-xs rounded px-2 py-1.5"
            style={{ background: C.bgButton, border: `1px solid ${C.borderSubtle}`, color: C.textPrimary }}
          >
            {ANIMATION_PRESETS.map(p => (
              <option key={p.id} value={p.id}>{p.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Upload */}
      <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleFilesSelect} className="hidden" />
      <button
        onClick={() => fileInputRef.current?.click()}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-lg text-xs font-medium transition-all"
        style={{ background: C.bgButton, border: `1px dashed ${C.borderAccent}`, color: C.accent }}
      >
        <Upload className="w-4 h-4" />
        Import Photos
      </button>

      {/* Photo list */}
      {photos.length > 0 && (
        <div className="space-y-2 max-h-[240px] overflow-y-auto">
          {photos.map((photo, idx) => (
            <div key={photo.id} className="flex items-center gap-2 rounded-md p-2"
              style={{ background: C.bgCard, border: `1px solid ${C.borderSubtle}` }}>
              <img src={photo.url} alt="" className="w-10 h-10 rounded object-cover flex-shrink-0"  loading="lazy" decoding="async" />
              <div className="flex-1 min-w-0">
                <p className="text-[10px] truncate" style={{ color: C.textPrimary }}>{photo.file.name}</p>
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="number" min={2} max={15} step={0.5} value={photo.duration}
                    onChange={e => updatePhotoDuration(photo.id, Number(e.target.value))}
                    className="w-12 text-[10px] rounded px-1 py-0.5"
                    style={{ background: C.bgButton, border: `1px solid ${C.borderSubtle}`, color: C.textPrimary }}
                  />
                  <span className="text-[10px]" style={{ color: C.textSecondary }}>s</span>
                  <select
                    value={photo.animation}
                    onChange={e => updatePhotoAnimation(photo.id, e.target.value)}
                    className="text-[10px] rounded px-1 py-0.5"
                    style={{ background: C.bgButton, border: `1px solid ${C.borderSubtle}`, color: C.textPrimary }}
                  >
                    {ANIMATION_PRESETS.map(p => (
                      <option key={p.id} value={p.id}>{p.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <button onClick={() => removePhoto(photo.id)} className="p-1 rounded hover:opacity-80"
                style={{ color: '#E05252' }}>
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add all to timeline */}
      {photos.length > 0 && onAddToTimeline && (
        <button
          onClick={handleAddAll}
          className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-md text-xs font-semibold transition-all"
          style={{ background: C.accentGlow, border: `1px solid ${C.borderAccent}`, color: C.accent }}
        >
          <Plus className="w-3.5 h-3.5" />
          Add {photos.length} Clip{photos.length > 1 ? 's' : ''} to Timeline
        </button>
      )}
    </div>
  );
}
