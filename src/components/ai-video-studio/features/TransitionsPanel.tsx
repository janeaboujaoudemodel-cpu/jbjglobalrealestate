import React, { useState } from 'react';
import { Clapperboard } from 'lucide-react';
import { TransitionDefinition } from '../types';

const TRANSITION_DEFINITIONS: TransitionDefinition[] = [
  // Fade
  { id: 'fade-black',  name: 'Fade Black',    category: 'fade',     duration: 1.0,  description: 'Fade through black' },
  { id: 'fade-white',  name: 'Fade White',    category: 'fade',     duration: 0.75, description: 'Flash to white' },
  { id: 'fade-blur',   name: 'Blur Fade',     category: 'fade',     duration: 1.0,  description: 'Blur dissolve' },
  // Dissolve
  { id: 'dissolve',       name: 'Dissolve',      category: 'dissolve', duration: 1.0,  description: 'Cross dissolve' },
  { id: 'dissolve-slow',  name: 'Slow Dissolve', category: 'dissolve', duration: 1.5,  description: 'Long cross fade' },
  { id: 'dissolve-fast',  name: 'Fast Dissolve', category: 'dissolve', duration: 0.5,  description: 'Quick cross fade' },
  // Slide
  { id: 'slide-left',  name: 'Slide Left',    category: 'slide',    duration: 0.8,  description: 'Push frame left' },
  { id: 'slide-right', name: 'Slide Right',   category: 'slide',    duration: 0.8,  description: 'Push frame right' },
  { id: 'slide-up',    name: 'Slide Up',      category: 'slide',    duration: 0.8,  description: 'Push frame up' },
  // Zoom
  { id: 'zoom-in',    name: 'Zoom In',        category: 'zoom',     duration: 0.75, description: 'Zoom into next' },
  { id: 'zoom-out',   name: 'Zoom Out',       category: 'zoom',     duration: 0.75, description: 'Zoom out reveal' },
  { id: 'zoom-punch', name: 'Zoom Punch',     category: 'zoom',     duration: 0.5,  description: 'Quick punch zoom' },
];

const CATEGORY_LABELS: Record<string, string> = {
  fade:     '✦ Fade',
  dissolve: '◎ Dissolve',
  slide:    '⟶ Slide',
  zoom:     '⊕ Zoom',
};

const CATEGORY_ORDER = ['fade', 'dissolve', 'slide', 'zoom'];

// CSS mini-preview per transition
function TransitionPreview({ id }: { id: string }) {
  const base = 'w-full h-12 rounded overflow-hidden relative flex';

  if (id.startsWith('fade-black')) return (
    <div className={base}>
      <div className="flex-1 bg-slate-400" />
      <div className="flex-1 bg-black" />
    </div>
  );
  if (id.startsWith('fade-white')) return (
    <div className={base}>
      <div className="flex-1 bg-slate-400" />
      <div className="flex-1 bg-white" />
    </div>
  );
  if (id.startsWith('fade-blur')) return (
    <div className={base} style={{ filter: 'blur(2px)' }}>
      <div className="flex-1 bg-slate-500" />
      <div className="flex-1 bg-slate-300" />
    </div>
  );
  if (id.startsWith('dissolve')) return (
    <div className={base}>
      <div className="absolute inset-0 bg-slate-600 opacity-60" />
      <div className="absolute inset-0 bg-purple-500 opacity-40" />
    </div>
  );
  if (id === 'slide-left') return (
    <div className={base} style={{ overflow: 'hidden' }}>
      <div className="flex-1 bg-slate-500" />
      <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-purple-600 opacity-80" />
    </div>
  );
  if (id === 'slide-right') return (
    <div className={base}>
      <div className="flex-1 bg-purple-600 opacity-80" />
      <div className="flex-1 bg-slate-500" />
    </div>
  );
  if (id === 'slide-up') return (
    <div className={`${base} flex-col`}>
      <div className="flex-1 bg-slate-500" />
      <div className="h-3 bg-purple-600 opacity-80" />
    </div>
  );
  if (id === 'zoom-in') return (
    <div className={base} style={{ alignItems: 'center', justifyContent: 'center' }}>
      <div className="w-full h-full bg-slate-500 flex items-center justify-center">
        <div className="w-6 h-6 rounded-full bg-purple-500 opacity-80" />
      </div>
    </div>
  );
  if (id === 'zoom-out') return (
    <div className={base} style={{ alignItems: 'center', justifyContent: 'center' }}>
      <div className="w-full h-full bg-slate-500 flex items-center justify-center">
        <div className="w-10 h-10 rounded-full bg-purple-400 opacity-60" />
      </div>
    </div>
  );
  // zoom-punch
  return (
    <div className={base} style={{ alignItems: 'center', justifyContent: 'center' }}>
      <div className="w-full h-full bg-slate-500 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-purple-500 opacity-80" />
      </div>
    </div>
  );
}

interface TransitionCardProps {
  def: TransitionDefinition;
}

function TransitionCard({ def }: TransitionCardProps) {
  const [duration, setDuration] = useState(def.duration);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('transition', JSON.stringify({ id: def.id, name: def.name, duration }));
    e.dataTransfer.effectAllowed = 'copy';
    setIsDragging(true);
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={() => setIsDragging(false)}
      className={`rounded-lg border cursor-grab active:cursor-grabbing p-2 flex flex-col gap-1.5 transition-all select-none ${
        isDragging
          ? 'border-purple-400 bg-purple-950/60 scale-95 opacity-70'
          : 'border-slate-600 bg-slate-800 hover:border-purple-500 hover:bg-slate-700'
      }`}
      title={`Drag "${def.name}" to timeline`}
    >
      <TransitionPreview id={def.id} />

      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-200 truncate">{def.name}</span>
        <span className="text-[10px] text-purple-400 font-mono ml-1">{duration.toFixed(2)}s</span>
      </div>

      {/* Duration slider */}
      <input
        type="range"
        min={0.25}
        max={3}
        step={0.25}
        value={duration}
        onChange={e => setDuration(parseFloat(e.target.value))}
        onClick={e => e.stopPropagation()}
        onMouseDown={e => e.stopPropagation()}
        className="w-full h-1 accent-purple-500 cursor-pointer"
        title="Adjust duration before dragging"
      />
    </div>
  );
}

export function TransitionsPanel() {
  return (
    <div className="h-full flex flex-col bg-slate-900">
      {/* Header */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-slate-700 flex items-center gap-2">
        <Clapperboard className="w-4 h-4 text-purple-400" />
        <span className="text-sm font-semibold text-slate-100">Transitions</span>
        <span className="ml-auto text-xs text-slate-500">Drag onto timeline between clips</span>
      </div>

      {/* Scrollable grid */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {CATEGORY_ORDER.map(cat => {
          const defs = TRANSITION_DEFINITIONS.filter(d => d.category === cat);
          return (
            <div key={cat}>
              <div className="text-[10px] font-bold uppercase tracking-widest text-purple-400 mb-2 px-1">
                {CATEGORY_LABELS[cat]}
              </div>
              <div className="grid grid-cols-3 gap-2">
                {defs.map(def => (
                  <TransitionCard key={def.id} def={def} />
                ))}
              </div>
            </div>
          );
        })}

        <div className="text-center py-3 text-[11px] text-slate-600">
          12 transitions · Drag between two clips on the timeline
        </div>
      </div>
    </div>
  );
}
