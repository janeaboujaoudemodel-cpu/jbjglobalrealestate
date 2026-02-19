import React, { useState, useRef, useCallback } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Lock, Eye } from 'lucide-react';
import { MiniParticlePreview } from '../preview/MiniParticlePreview';

interface OverlayEffect {
  id: string;
  label: string;
  description: string;
  category: string;
}

const OVERLAY_EFFECTS: OverlayEffect[] = [
  { id: 'money-rain',     label: 'Money Rain',       description: 'Golden bills cascade down', category: 'Celebration' },
  { id: 'confetti',       label: 'Confetti Burst',   description: 'Multi-color celebration',   category: 'Celebration' },
  { id: 'gold-glow',      label: 'Gold Shimmer',     description: 'Luxury shimmer overlay',    category: 'Luxury' },
  { id: 'luxury-rain',    label: 'Luxury Rain',      description: 'Gold droplets falling',     category: 'Luxury' },
  { id: 'stars',          label: 'Star Shower',      description: 'Stars drifting from sky',   category: 'Ambient' },
  { id: 'luxury-sparkle', label: 'Diamond Sparkle',  description: 'Diamond crystal float',     category: 'Luxury' },
  { id: 'fire',           label: 'Fire Energy',      description: 'High-energy fire burst',    category: 'Energy' },
  { id: 'aurora',         label: 'Aurora Shimmer',   description: 'Northern lights sweep',     category: 'Ambient' },
  { id: 'snow',           label: 'Snow Fall',        description: 'Soft snowflakes drifting',  category: 'Ambient' },
  { id: 'lightning',      label: 'Lightning Strike', description: 'Electric storm energy',     category: 'Energy' },
];

interface OverlayEffectsPanelProps {
  onPreviewEffect?: (effectId: string | null) => void;
  onHoverEffect?: (effectId: string | null) => void;
  onAddEffect?: (effectId: string) => void;
  activeEffect?: string | null;
}

export function OverlayEffectsPanel({
  onPreviewEffect,
  onHoverEffect,
  onAddEffect,
  activeEffect,
}: OverlayEffectsPanelProps) {
  const categories = [...new Set(OVERLAY_EFFECTS.map(e => e.category))];
  const [lockedEffect, setLockedEffect] = useState<string | null>(null);
  const burstTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleMouseEnter = useCallback((effectId: string) => {
    if (lockedEffect === effectId) return;
    if (burstTimerRef.current) clearTimeout(burstTimerRef.current);
    onHoverEffect?.(effectId);
    burstTimerRef.current = setTimeout(() => onHoverEffect?.(null), 2000);
  }, [lockedEffect, onHoverEffect]);

  const handleMouseLeave = useCallback((effectId: string) => {
    if (lockedEffect === effectId) return;
    if (burstTimerRef.current) clearTimeout(burstTimerRef.current);
    onHoverEffect?.(null);
  }, [lockedEffect, onHoverEffect]);

  const handleCardClick = useCallback((effect: OverlayEffect) => {
    if (burstTimerRef.current) clearTimeout(burstTimerRef.current);
    onHoverEffect?.(null);
    if (lockedEffect === effect.id) {
      setLockedEffect(null);
      onPreviewEffect?.(null);
    } else {
      setLockedEffect(effect.id);
      onPreviewEffect?.(effect.id);
    }
  }, [lockedEffect, onPreviewEffect, onHoverEffect]);

  return (
    <div className="h-full flex flex-col bg-slate-900 text-white">
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-4">
          {/* Header hint */}
          <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <Eye className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <p className="text-xs text-amber-300">
              <span className="font-semibold">Hover</span> for a live burst preview ·{' '}
              <span className="font-semibold">Click</span> to lock on canvas ·{' '}
              <span className="font-semibold">Add</span> to bake into timeline
            </p>
          </div>

          {categories.map(cat => (
            <div key={cat}>
              <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-widest mb-2">{cat}</p>
              <div className="grid grid-cols-2 gap-2">
                {OVERLAY_EFFECTS.filter(e => e.category === cat).map(effect => {
                  const isLocked = lockedEffect === effect.id;
                  return (
                    <div
                      key={effect.id}
                      onClick={() => handleCardClick(effect)}
                      onMouseEnter={() => handleMouseEnter(effect.id)}
                      onMouseLeave={() => handleMouseLeave(effect.id)}
                      className={`rounded-lg border cursor-pointer transition-all select-none overflow-hidden ${
                        isLocked
                          ? 'border-amber-400 shadow-[0_0_14px_rgba(251,191,36,0.3)]'
                          : 'border-slate-700 hover:border-amber-500/60 hover:shadow-[0_0_8px_rgba(251,191,36,0.15)]'
                      }`}
                    >
                      {/* Live particle thumbnail — 80 × 52px */}
                      <div className="relative">
                        <MiniParticlePreview
                          effectId={effect.id}
                          className="w-full"
                          style={{ height: 52 }}
                        />

                        {/* Lock badge */}
                        {isLocked && (
                          <div className="absolute top-1 right-1 flex items-center gap-0.5 text-[8px] font-bold text-amber-400 bg-black/70 px-1.5 py-0.5 rounded-full animate-pulse">
                            <Lock className="w-2 h-2" />
                            LOCKED
                          </div>
                        )}
                      </div>

                      {/* Label row */}
                      <div className={`px-2 py-1.5 ${isLocked ? 'bg-amber-400/10' : 'bg-slate-800'}`}>
                        <div className="text-xs font-semibold text-slate-100 leading-tight truncate">
                          {effect.label}
                        </div>
                        <div className="text-[10px] text-slate-500 leading-tight truncate mt-0.5">
                          {effect.description}
                        </div>

                        {/* Add button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onAddEffect?.(effect.id);
                            import('sonner').then(({ toast }) =>
                              toast.success(`${effect.label} added to timeline!`)
                            );
                          }}
                          className="mt-1.5 flex items-center gap-1 w-full justify-center py-1 rounded text-[10px] font-bold bg-slate-700 hover:bg-amber-500 hover:text-black text-slate-300 border border-slate-600 hover:border-amber-500 transition-all"
                        >
                          <Plus className="w-3 h-3" />
                          Add
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
