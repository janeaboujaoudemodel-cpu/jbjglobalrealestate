/**
 * InteractiveStampCanvas — overlay for on-canvas editing of stamp elements.
 * Supports: click-to-select, drag-to-move, resize handles, delete, lock per layer.
 * Keyboard: Arrow keys move, Delete removes, +/- resize.
 */
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Move, Trash2, Lock, Unlock, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

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
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ mx: 0, my: 0, ox: 0, oy: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedLayer = layers.find(l => l.id === selectedId);

  const updateLayer = useCallback((id: string, updates: Partial<StampLayer>) => {
    onLayersChange(layers.map(l => l.id === id ? { ...l, ...updates } : l));
  }, [layers, onLayersChange]);

  const handlePointerDown = useCallback((e: React.PointerEvent, layerId: string) => {
    if (!interactive) return;
    const layer = layers.find(l => l.id === layerId);
    if (layer?.locked) return;
    
    e.preventDefault();
    e.stopPropagation();
    setSelectedId(layerId);
    setDragging(true);
    setDragStart({
      mx: e.clientX,
      my: e.clientY,
      ox: layer?.offsetX || 0,
      oy: layer?.offsetY || 0,
    });
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [interactive, layers]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging || !selectedId) return;
    const dx = e.clientX - dragStart.mx;
    const dy = e.clientY - dragStart.my;
    updateLayer(selectedId, {
      offsetX: dragStart.ox + dx,
      offsetY: dragStart.oy + dy,
    });
  }, [dragging, selectedId, dragStart, updateLayer]);

  const handlePointerUp = useCallback(() => {
    setDragging(false);
  }, []);

  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('[data-layer-id]')) return;
    setSelectedId(null);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    if (!interactive) return;
    const handler = (e: KeyboardEvent) => {
      if (!selectedId) return;
      const layer = layers.find(l => l.id === selectedId);
      if (!layer || layer.locked) return;

      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        onDeleteLayer?.(selectedId);
        setSelectedId(null);
      }
      if (e.key === 'Escape') {
        setSelectedId(null);
      }
      const step = e.shiftKey ? 5 : 1;
      if (e.key === 'ArrowLeft') { e.preventDefault(); updateLayer(selectedId, { offsetX: layer.offsetX - step }); }
      if (e.key === 'ArrowRight') { e.preventDefault(); updateLayer(selectedId, { offsetX: layer.offsetX + step }); }
      if (e.key === 'ArrowUp') { e.preventDefault(); updateLayer(selectedId, { offsetY: layer.offsetY - step }); }
      if (e.key === 'ArrowDown') { e.preventDefault(); updateLayer(selectedId, { offsetY: layer.offsetY + step }); }
      // +/- for scale
      if (e.key === '+' || e.key === '=') { e.preventDefault(); updateLayer(selectedId, { scale: Math.min(2, layer.scale + 0.05) }); }
      if (e.key === '-' || e.key === '_') { e.preventDefault(); updateLayer(selectedId, { scale: Math.max(0.3, layer.scale - 0.05) }); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [interactive, selectedId, layers, updateLayer, onDeleteLayer]);

  const layerPositions: Record<string, { top: string; left: string; width: string; height: string }> = {
    'text-top':    { top: '5%', left: '8%', width: '84%', height: '20%' },
    'text-bottom': { top: '75%', left: '8%', width: '84%', height: '20%' },
    'monogram':    { top: '32%', left: '28%', width: '44%', height: '36%' },
    'logo':        { top: '28%', left: '22%', width: '56%', height: '44%' },
    'divider':     { top: '30%', left: '18%', width: '64%', height: '4%' },
    'reg-number':  { top: '60%', left: '22%', width: '56%', height: '12%' },
    'city-line':   { top: '75%', left: '12%', width: '76%', height: '16%' },
  };

  return (
    <div className="relative flex flex-col items-center gap-2">
      <div
        ref={containerRef}
        className="relative"
        style={{ width: size, height: size }}
        onClick={handleCanvasClick}
        tabIndex={0}
      >
        {/* Rendered stamp */}
        <div className="absolute inset-0">
          {children}
        </div>

        {/* Interactive layer overlays */}
        {interactive && layers.filter(l => l.visible).map(layer => {
          const pos = layerPositions[layer.type] || layerPositions['monogram'];
          const isSelected = selectedId === layer.id;
          
          return (
            <div
              key={layer.id}
              data-layer-id={layer.id}
              className={`absolute transition-all ${
                isSelected
                  ? 'ring-2 ring-[hsl(var(--gold))] ring-offset-1 bg-[hsl(var(--gold)/0.06)] rounded-lg z-10'
                  : 'hover:bg-[hsl(var(--gold)/0.03)] hover:ring-1 hover:ring-[hsl(var(--gold)/0.2)] rounded-lg z-[1]'
              } ${layer.locked ? 'cursor-not-allowed opacity-50' : 'cursor-move'}`}
              style={{
                top: pos.top,
                left: pos.left,
                width: pos.width,
                height: pos.height,
                transform: `translate(${layer.offsetX}px, ${layer.offsetY}px) scale(${layer.scale})`,
              }}
              onPointerDown={(e) => handlePointerDown(e, layer.id)}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onClick={(e) => {
                e.stopPropagation();
                if (!layer.locked) setSelectedId(layer.id);
              }}
            >
              {isSelected && (
                <div className="absolute -top-5 left-1/2 -translate-x-1/2 whitespace-nowrap bg-[hsl(var(--foreground))] text-white text-[8px] font-medium px-1.5 py-0.5 rounded-md shadow-md pointer-events-none">
                  {layer.label}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Layer controls toolbar */}
      {interactive && selectedLayer && (
        <div className="flex items-center gap-1 bg-white rounded-xl border border-[hsl(var(--border))] shadow-lg px-2.5 py-1.5">
          <span className="text-[9px] font-semibold text-[hsl(var(--foreground))] mr-1">{selectedLayer.label}</span>
          
          <button
            onClick={() => updateLayer(selectedLayer.id, { scale: Math.max(0.3, selectedLayer.scale - 0.1) })}
            className="w-6 h-6 rounded-lg border border-[hsl(var(--border))] flex items-center justify-center hover:bg-[hsl(var(--gold)/0.06)] transition-colors"
            title="Decrease size (or press -)">
            <ZoomOut size={10}/>
          </button>
          <span className="text-[8px] text-[hsl(var(--muted-foreground))] min-w-[28px] text-center">
            {Math.round(selectedLayer.scale * 100)}%
          </span>
          <button
            onClick={() => updateLayer(selectedLayer.id, { scale: Math.min(2, selectedLayer.scale + 0.1) })}
            className="w-6 h-6 rounded-lg border border-[hsl(var(--border))] flex items-center justify-center hover:bg-[hsl(var(--gold)/0.06)] transition-colors"
            title="Increase size (or press +)">
            <ZoomIn size={10}/>
          </button>

          <div className="w-px h-3.5 bg-[hsl(var(--border))] mx-0.5"/>

          <div className="flex items-center gap-0.5 text-[8px] text-[hsl(var(--muted-foreground))]">
            <Move size={8}/> drag
          </div>

          <div className="w-px h-3.5 bg-[hsl(var(--border))] mx-0.5"/>

          <button
            onClick={() => updateLayer(selectedLayer.id, { offsetX: 0, offsetY: 0, scale: 1 })}
            className="w-6 h-6 rounded-lg border border-[hsl(var(--border))] flex items-center justify-center hover:bg-[hsl(var(--gold)/0.06)] transition-colors"
            title="Reset position">
            <RotateCcw size={9}/>
          </button>

          <button
            onClick={() => updateLayer(selectedLayer.id, { locked: !selectedLayer.locked })}
            className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-colors ${
              selectedLayer.locked
                ? 'border-amber-300 bg-amber-50 text-amber-600'
                : 'border-[hsl(var(--border))] hover:bg-[hsl(var(--gold)/0.06)]'
            }`}
            title={selectedLayer.locked ? 'Unlock' : 'Lock'}>
            {selectedLayer.locked ? <Lock size={9}/> : <Unlock size={9}/>}
          </button>

          <button
            onClick={() => {
              onDeleteLayer?.(selectedLayer.id);
              setSelectedId(null);
            }}
            className="w-6 h-6 rounded-lg border border-destructive/30 text-destructive flex items-center justify-center hover:bg-destructive/10 transition-colors"
            title="Delete layer">
            <Trash2 size={9}/>
          </button>
        </div>
      )}

      {interactive && !selectedId && (
        <p className="text-[8px] text-[hsl(var(--muted-foreground))] text-center">
          Click elements to select · Drag to move · +/- to resize · Arrow keys for fine adjustment
        </p>
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
    layers.push({ id: 'text-top', type: 'text-top', label: 'Top Arc Text', offsetX: 0, offsetY: 0, scale: 1, locked: false, visible: true });
  } else {
    layers.push({ id: 'text-top', type: 'text-top', label: 'Company Name (Top)', offsetX: 0, offsetY: 0, scale: 1, locked: false, visible: true });
  }

  if (form.languageMode === 'BILINGUAL') {
    layers.push({ id: 'text-bottom', type: 'text-bottom', label: 'Bottom Arc Text', offsetX: 0, offsetY: 0, scale: 1, locked: false, visible: true });
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
    layers.push({ id: 'divider-top', type: 'divider', label: 'Top Divider', offsetX: 0, offsetY: 0, scale: 1, locked: false, visible: true });
  }

  if (form.showLicenseNumber && form.density >= 3 && form.registrationNumber) {
    layers.push({ id: 'reg-number', type: 'reg-number', label: 'License Number', offsetX: 0, offsetY: 0, scale: 1, locked: false, visible: true });
  }

  return layers;
}
