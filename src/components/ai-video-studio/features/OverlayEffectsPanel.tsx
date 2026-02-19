import React, { useState, useRef, useCallback } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Eye, Lock } from 'lucide-react';

interface OverlayEffect {
  id: string;
  label: string;
  emoji: string;
  description: string;
  category: string;
}

const OVERLAY_EFFECTS: OverlayEffect[] = [
  { id: 'money-rain',     label: 'Money Rain',       emoji: '💰', description: 'Golden bills cascade down', category: 'Celebration' },
  { id: 'confetti',       label: 'Confetti Burst',   emoji: '🎊', description: 'Multi-color celebration', category: 'Celebration' },
  { id: 'gold-glow',      label: 'Gold Glow',        emoji: '✨', description: 'Luxury shimmer overlay', category: 'Luxury' },
  { id: 'luxury-rain',    label: 'Luxury Rain',      emoji: '🌟', description: 'Gold droplets falling', category: 'Luxury' },
  { id: 'stars',          label: 'Star Shower',      emoji: '⭐', description: 'Stars drifting from sky', category: 'Ambient' },
  { id: 'luxury-sparkle', label: 'Diamond Sparkle',  emoji: '💎', description: 'Diamond crystal float', category: 'Luxury' },
  { id: 'fire',           label: 'Fire Energy',      emoji: '🔥', description: 'High-energy fire burst', category: 'Energy' },
  { id: 'aurora',         label: 'Aurora Shimmer',   emoji: '🌌', description: 'Northern lights sweep', category: 'Ambient' },
  { id: 'snow',           label: 'Snow Fall',        emoji: '❄️', description: 'Soft snowflakes drifting', category: 'Ambient' },
  { id: 'lightning',      label: 'Lightning Strike', emoji: '⚡', description: 'Electric storm energy', category: 'Energy' },
];

interface OverlayEffectsPanelProps {
  onPreviewEffect?: (effectId: string | null) => void;
  onHoverEffect?: (effectId: string | null) => void;
  onAddEffect?: (effectId: string) => void;
  activeEffect?: string | null;
}

export function OverlayEffectsPanel({ onPreviewEffect, onHoverEffect, onAddEffect, activeEffect }: OverlayEffectsPanelProps) {
  const categories = [...new Set(OVERLAY_EFFECTS.map(e => e.category))];
  // Track which card is locked (clicked) vs just hovered
  const [lockedEffect, setLockedEffect] = useState<string | null>(null);
  const burstTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleMouseEnter = useCallback((effectId: string) => {
    // Don't burst-preview if this card is already locked
    if (lockedEffect === effectId) return;
    // Clear any pending burst-end timer
    if (burstTimerRef.current) clearTimeout(burstTimerRef.current);
    onHoverEffect?.(effectId);
    // Auto-clear the hover burst after 2 s
    burstTimerRef.current = setTimeout(() => {
      onHoverEffect?.(null);
    }, 2000);
  }, [lockedEffect, onHoverEffect]);

  const handleMouseLeave = useCallback((effectId: string) => {
    if (lockedEffect === effectId) return; // locked — keep showing
    if (burstTimerRef.current) clearTimeout(burstTimerRef.current);
    onHoverEffect?.(null);
  }, [lockedEffect, onHoverEffect]);

  const handleCardClick = useCallback((effect: OverlayEffect) => {
    // Cancel any hover burst timer
    if (burstTimerRef.current) clearTimeout(burstTimerRef.current);
    onHoverEffect?.(null);

    if (lockedEffect === effect.id) {
      // Unlock — stop the locked preview
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
              <span className="font-semibold">Hover</span> for a 2s burst preview · <span className="font-semibold">Click</span> to lock · <span className="font-semibold">Add</span> to timeline
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
                      className={`rounded-lg border p-2.5 cursor-pointer transition-all select-none ${
                        isLocked
                          ? 'border-amber-400 bg-amber-400/15 shadow-[0_0_12px_rgba(251,191,36,0.25)]'
                          : 'border-slate-700 bg-slate-800 hover:border-amber-500/50 hover:bg-slate-700/80'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-1.5">
                        <span className="text-xl leading-none">{effect.emoji}</span>
                        {isLocked && (
                          <span className="flex items-center gap-1 text-[9px] font-bold text-amber-400 bg-amber-400/20 px-1.5 py-0.5 rounded-full animate-pulse">
                            <Lock className="w-2 h-2" /> LOCKED
                          </span>
                        )}
                      </div>
                      <div className="text-xs font-semibold text-slate-200 leading-tight">{effect.label}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5 leading-tight">{effect.description}</div>

                      {/* Add button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onAddEffect?.(effect.id);
                          import('sonner').then(({ toast }) =>
                            toast.success(`${effect.label} added to timeline!`)
                          );
                        }}
                        className="mt-2 flex items-center gap-1 w-full justify-center py-1 rounded-md text-[10px] font-bold bg-slate-700 hover:bg-amber-500 hover:text-black text-slate-300 border border-slate-600 hover:border-amber-500 transition-all"
                      >
                        <Plus className="w-3 h-3" />
                        Add to Timeline
                      </button>
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
