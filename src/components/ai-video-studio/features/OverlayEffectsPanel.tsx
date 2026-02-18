import React, { useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';

interface OverlayEffect {
  id: string;
  label: string;
  emoji: string;
  description: string;
  particles: string[];
  colors: string[];
}

const OVERLAY_EFFECTS: OverlayEffect[] = [
  {
    id: 'money-rain',
    label: 'Money Rain',
    emoji: '💵',
    description: 'Golden bills raining down',
    particles: ['💵', '💴', '💶', '🪙', '💰'],
    colors: ['#F59E0B', '#FBBF24', '#FCD34D'],
  },
  {
    id: 'confetti',
    label: 'Confetti Burst',
    emoji: '🎉',
    description: 'Celebration confetti explosion',
    particles: ['🎊', '🎉', '✨', '⭐'],
    colors: ['#EF4444', '#3B82F6', '#10B981', '#F59E0B'],
  },
  {
    id: 'gold-glow',
    label: 'Gold Glow',
    emoji: '✨',
    description: 'Luxury shimmer overlay',
    particles: ['✨', '⭐', '💫'],
    colors: ['#F59E0B', '#FBBF24'],
  },
  {
    id: 'stars',
    label: 'Star Shower',
    emoji: '⭐',
    description: 'Stars falling from sky',
    particles: ['⭐', '💫', '✨', '🌟'],
    colors: ['#FBBF24', '#FCD34D', '#FDE68A'],
  },
  {
    id: 'luxury-sparkle',
    label: 'Luxury Sparkle',
    emoji: '💎',
    description: 'Diamond sparkle effect',
    particles: ['💎', '✨', '💫'],
    colors: ['#60A5FA', '#A78BFA', '#F0ABFC'],
  },
  {
    id: 'fire',
    label: 'Fire Energy',
    emoji: '🔥',
    description: 'High energy fire effect',
    particles: ['🔥', '💥', '⚡'],
    colors: ['#EF4444', '#F97316', '#FBBF24'],
  },
];

interface Particle {
  id: number;
  emoji: string;
  x: number;
  delay: number;
  duration: number;
  size: number;
}

export function OverlayEffectsPanel() {
  const [activeEffect, setActiveEffect] = useState<string | null>(null);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [isPreviewActive, setIsPreviewActive] = useState(false);

  const handlePreview = (effect: OverlayEffect) => {
    if (activeEffect === effect.id && isPreviewActive) {
      setIsPreviewActive(false);
      setParticles([]);
      setActiveEffect(null);
      return;
    }
    setActiveEffect(effect.id);
    setIsPreviewActive(true);

    const newParticles: Particle[] = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      emoji: effect.particles[Math.floor(Math.random() * effect.particles.length)],
      x: Math.random() * 100,
      delay: Math.random() * 2,
      duration: 1.5 + Math.random() * 2,
      size: 16 + Math.random() * 16,
    }));
    setParticles(newParticles);

    setTimeout(() => {
      setIsPreviewActive(false);
      setParticles([]);
      setActiveEffect(null);
    }, 3500);
  };

  return (
    <div className="h-full flex flex-col bg-slate-900 text-white relative overflow-hidden">
      {/* Particle preview overlay */}
      {isPreviewActive && (
        <div className="absolute inset-0 pointer-events-none z-10">
          {particles.map(p => (
            <div
              key={p.id}
              className="absolute animate-bounce"
              style={{
                left: `${p.x}%`,
                top: '-10%',
                fontSize: `${p.size}px`,
                animationDelay: `${p.delay}s`,
                animationDuration: `${p.duration}s`,
                animation: `fall ${p.duration}s ${p.delay}s ease-in forwards`,
              }}
            >
              {p.emoji}
            </div>
          ))}
          <style>{`
            @keyframes fall {
              0% { transform: translateY(0) rotate(0deg); opacity: 1; }
              100% { transform: translateY(350px) rotate(360deg); opacity: 0; }
            }
          `}</style>
        </div>
      )}

      <ScrollArea className="flex-1">
        <div className="p-3">
          <p className="text-xs text-slate-400 font-medium mb-3 uppercase tracking-wide">Visual Overlay Effects</p>
          <div className="grid grid-cols-2 gap-2">
            {OVERLAY_EFFECTS.map(effect => (
              <div
                key={effect.id}
                className={`rounded-lg border p-3 text-left transition-all cursor-pointer ${
                  activeEffect === effect.id
                    ? 'border-amber-400 bg-amber-400/10'
                    : 'border-slate-700 bg-slate-800 hover:border-amber-400/50 hover:bg-slate-700'
                }`}
              >
                <div className="text-2xl mb-1">{effect.emoji}</div>
                <div className="text-xs font-medium text-slate-200">{effect.label}</div>
                <div className="text-xs text-slate-400 mb-2">{effect.description}</div>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    onClick={() => handlePreview(effect)}
                    className="h-6 text-xs px-2 bg-amber-500 hover:bg-amber-400 text-black font-medium flex-1"
                  >
                    {activeEffect === effect.id && isPreviewActive ? 'Stop' : 'Preview'}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-6 text-xs px-2 border-slate-600 text-slate-300 hover:bg-slate-600"
                    onClick={() => {
                      import('sonner').then(({ toast }) => toast.success(`${effect.label} added to timeline!`));
                    }}
                  >
                    + Add
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 p-3 rounded-lg bg-slate-800 border border-slate-700">
            <p className="text-xs text-slate-400 font-medium mb-2">💡 Tip</p>
            <p className="text-xs text-slate-300">
              Preview effects here, then click "+ Add" to insert them as an effects clip at the current playhead position on your timeline.
            </p>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
