/**
 * StampCanvasControls — Floating toolbar for zoom, grid toggle, and background mode.
 */
import React from 'react';
import { ZoomIn, ZoomOut, Grid3x3, Minus, Plus } from 'lucide-react';

interface StampCanvasControlsProps {
  zoom: number;
  showGrid: boolean;
  bgMode: 'white' | 'checker';
  onZoomChange: (zoom: number) => void;
  onToggleGrid: () => void;
  onToggleBg: () => void;
}

export function StampCanvasControls({
  zoom,
  showGrid,
  bgMode,
  onZoomChange,
  onToggleGrid,
  onToggleBg,
}: StampCanvasControlsProps) {
  const zoomSteps = [50, 75, 100, 125, 150, 200];

  const zoomIn = () => {
    const next = zoomSteps.find(z => z > zoom);
    if (next) onZoomChange(next);
  };
  const zoomOut = () => {
    const prev = [...zoomSteps].reverse().find(z => z < zoom);
    if (prev) onZoomChange(prev);
  };

  return (
    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1 px-2 py-1 rounded-full bg-white/90 backdrop-blur-sm border border-[hsl(var(--border))] shadow-lg">
      <button
        onClick={zoomOut}
        disabled={zoom <= 50}
        className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-[hsl(var(--muted))] disabled:opacity-30 transition-colors"
        title="Zoom out"
      >
        <Minus size={11} />
      </button>

      <button
        onClick={() => onZoomChange(100)}
        className="px-2 py-0.5 rounded text-[10px] font-semibold text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] transition-colors min-w-[40px] text-center"
        title="Reset zoom"
      >
        {zoom}%
      </button>

      <button
        onClick={zoomIn}
        disabled={zoom >= 200}
        className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-[hsl(var(--muted))] disabled:opacity-30 transition-colors"
        title="Zoom in"
      >
        <Plus size={11} />
      </button>

      <div className="w-px h-4 bg-[hsl(var(--border))]" />

      <button
        onClick={onToggleGrid}
        className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${showGrid ? 'bg-[hsl(var(--gold)/0.15)] text-[hsl(var(--gold-dark))]' : 'hover:bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]'}`}
        title="Toggle grid"
      >
        <Grid3x3 size={11} />
      </button>

      <button
        onClick={onToggleBg}
        className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${bgMode === 'checker' ? 'bg-[hsl(var(--gold)/0.15)] text-[hsl(var(--gold-dark))]' : 'hover:bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]'}`}
        title="Toggle background"
      >
        <div className="w-3 h-3 rounded-sm border border-current" style={bgMode === 'checker' ? {
          background: 'repeating-conic-gradient(hsl(var(--muted)) 0% 25%, transparent 0% 50%) 0 0 / 6px 6px'
        } : { background: 'white' }} />
      </button>
    </div>
  );
}

/** Grid overlay SVG for the canvas */
export function CanvasGridOverlay({ size }: { size: number }) {
  return (
    <svg className="absolute inset-0 pointer-events-none opacity-10" width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* Center crosshair */}
      <line x1={size / 2} y1={0} x2={size / 2} y2={size} stroke="hsl(var(--gold))" strokeWidth="0.5" strokeDasharray="4 4" />
      <line x1={0} y1={size / 2} x2={size} y2={size / 2} stroke="hsl(var(--gold))" strokeWidth="0.5" strokeDasharray="4 4" />
      {/* Circular guides */}
      <circle cx={size / 2} cy={size / 2} r={size * 0.35} fill="none" stroke="hsl(var(--gold))" strokeWidth="0.5" strokeDasharray="4 4" />
      <circle cx={size / 2} cy={size / 2} r={size * 0.45} fill="none" stroke="hsl(var(--gold))" strokeWidth="0.5" strokeDasharray="4 4" />
    </svg>
  );
}
