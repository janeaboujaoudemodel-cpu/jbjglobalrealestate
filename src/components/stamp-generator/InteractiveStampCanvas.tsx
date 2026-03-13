/**
 * InteractiveStampCanvas — simplified overlay for on-canvas editing.
 * Delete = hide per design (undo restores). No fake empty rectangles.
 */
import React, { useState, useCallback, useEffect } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, Lock, Unlock, Trash2, Eye, EyeOff } from 'lucide-react';

export interface StampLayer {
  id: string;
  type: 'text-top' | 'text-bottom' | 'monogram' | 'logo' | 'divider' | 'reg-number' | 'city-line';
  label: string;
  offsetX: number;
  offsetY: number;
  scale: number;
  locked: boolean;
  visible: boolean;
}

interface InteractiveStampCanvasProps {
  children: React.ReactNode;
  size: number;
  layers: StampLayer[];
  onLayersChange: (layers: StampLayer[]) => void;
  onDeleteLayer?: (layerId: string) => void;
  interactive?: boolean;
}

export function InteractiveStampCanvas({
  children,
  size,
  layers,
  onLayersChange,
  onDeleteLayer,
  interactive = true,
}: InteractiveStampCanvasProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selectedLayer = layers.find(l => l.id === selectedId);

  const updateLayer = useCallback((id: string, updates: Partial<StampLayer>) => {
    onLayersChange(layers.map(l => l.id === id ? { ...l, ...updates } : l));
  }, [layers, onLayersChange]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!interactive) return;
    const handler = (e: KeyboardEvent) => {
      if (!selectedId) return;
      const layer = layers.find(l => l.id === selectedId);
      if (!layer || layer.locked) return;

      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        updateLayer(selectedId, { visible: false });
        setSelectedId(null);
      }
      if (e.key === 'Escape') setSelectedId(null);
      if (e.key === '+' || e.key === '=') { e.preventDefault(); updateLayer(selectedId, { scale: Math.min(2, layer.scale + 0.05) }); }
      if (e.key === '-' || e.key === '_') { e.preventDefault(); updateLayer(selectedId, { scale: Math.max(0.3, layer.scale - 0.05) }); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [interactive, selectedId, layers, updateLayer]);

  return (
    <div className="relative flex flex-col items-center gap-3">
      {/* Stamp preview */}
      <div
        className="relative cursor-default"
        style={{ width: size, height: size }}
        tabIndex={0}
        onClick={() => setSelectedId(null)}
      >
        <div className="absolute inset-0">{children}</div>
      </div>

      {/* Layer panel — compact list below preview */}
      {interactive && layers.length > 0 && (
        <div className="w-full max-w-[320px] bg-white rounded-xl border border-[hsl(var(--border))] shadow-sm overflow-hidden">
          <div className="px-3 py-1.5 border-b border-[hsl(var(--border))] bg-[hsl(var(--pearl-1))]">
            <span className="text-[9px] font-semibold text-[hsl(var(--foreground))] uppercase tracking-wider">Layers</span>
          </div>
          <div className="divide-y divide-[hsl(var(--border))]">
            {layers.map(layer => {
              const isSelected = selectedId === layer.id;
              return (
                <div
                  key={layer.id}
                  onClick={(e) => { e.stopPropagation(); setSelectedId(isSelected ? null : layer.id); }}
                  className={`flex items-center gap-2 px-3 py-1.5 cursor-pointer transition-colors ${
                    isSelected ? 'bg-[hsl(var(--gold)/0.08)]' : 'hover:bg-[hsl(var(--muted)/0.5)]'
                  } ${!layer.visible ? 'opacity-40' : ''}`}
                >
                  <span className="text-[10px] font-medium text-[hsl(var(--foreground))] flex-1 truncate">{layer.label}</span>
                  
                  {/* Visibility toggle */}
                  <button
                    onClick={(e) => { e.stopPropagation(); updateLayer(layer.id, { visible: !layer.visible }); }}
                    className="w-5 h-5 rounded flex items-center justify-center hover:bg-[hsl(var(--muted))] transition-colors"
                    title={layer.visible ? 'Hide' : 'Show'}
                  >
                    {layer.visible ? <Eye size={9} /> : <EyeOff size={9} />}
                  </button>

                  {/* Lock toggle */}
                  <button
                    onClick={(e) => { e.stopPropagation(); updateLayer(layer.id, { locked: !layer.locked }); }}
                    className={`w-5 h-5 rounded flex items-center justify-center transition-colors ${
                      layer.locked ? 'text-amber-500' : 'hover:bg-[hsl(var(--muted))]'
                    }`}
                    title={layer.locked ? 'Unlock' : 'Lock'}
                  >
                    {layer.locked ? <Lock size={9} /> : <Unlock size={9} />}
                  </button>

                  {/* Delete (hide) */}
                  {layer.visible && !layer.locked && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        updateLayer(layer.id, { visible: false });
                        if (isSelected) setSelectedId(null);
                      }}
                      className="w-5 h-5 rounded flex items-center justify-center text-destructive hover:bg-destructive/10 transition-colors"
                      title="Hide layer"
                    >
                      <Trash2 size={9} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/** Generate default layers from stamp form state */
export function createDefaultLayers(form: {
  languageMode: string;
  iconStyle: string;
  density: number;
  registrationNumber?: string;
  showLicenseNumber?: boolean;
  city?: string;
}): StampLayer[] {
  const layers: StampLayer[] = [];

  if (form.languageMode === 'BILINGUAL' || form.languageMode === 'AR') {
    layers.push({ id: 'text-top', type: 'text-top', label: 'Top Arc Text (Arabic)', offsetX: 0, offsetY: 0, scale: 1, locked: false, visible: true });
  } else {
    layers.push({ id: 'text-top', type: 'text-top', label: 'Company Name (Top)', offsetX: 0, offsetY: 0, scale: 1, locked: false, visible: true });
  }

  if (form.languageMode === 'BILINGUAL') {
    layers.push({ id: 'text-bottom', type: 'text-bottom', label: 'Bottom Arc Text (English)', offsetX: 0, offsetY: 0, scale: 1, locked: false, visible: true });
  } else if (form.density >= 2 && form.city) {
    layers.push({ id: 'city-line', type: 'city-line', label: 'City / Location', offsetX: 0, offsetY: 0, scale: 1, locked: false, visible: true });
  }

  if (form.iconStyle === 'MONOGRAM' || form.iconStyle === 'BOTH') {
    layers.push({ id: 'monogram', type: 'monogram', label: 'Monogram', offsetX: 0, offsetY: 0, scale: 1, locked: false, visible: true });
  }
  if (form.iconStyle === 'UPLOADED_LOGO' || form.iconStyle === 'BOTH') {
    layers.push({ id: 'logo', type: 'logo', label: 'Logo', offsetX: 0, offsetY: 0, scale: 1, locked: false, visible: true });
  }

  if (form.density >= 2) {
    layers.push({ id: 'divider-top', type: 'divider', label: 'Separators', offsetX: 0, offsetY: 0, scale: 1, locked: false, visible: true });
  }

  if (form.showLicenseNumber && form.density >= 3 && form.registrationNumber) {
    layers.push({ id: 'reg-number', type: 'reg-number', label: 'License Number', offsetX: 0, offsetY: 0, scale: 1, locked: false, visible: true });
  }

  if (form.city) {
    layers.push({ id: 'location', type: 'city-line', label: 'Location Ring', offsetX: 0, offsetY: 0, scale: 1, locked: false, visible: true });
  }

  return layers;
}
