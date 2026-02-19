import React, { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Music2, Play, Plus, Square, ChevronDown, ChevronUp, Wand2, Volume2 } from 'lucide-react';
import { toast } from 'sonner';

interface GeneratedSound {
  id: string;
  label: string;
  category: string;
  synthFn: () => AudioBuffer;
  duration: number;
}

interface SoundEffectsPanelProps {
  onAddToTimeline?: (soundEffect: { name: string; url: string; duration: number }) => void;
}

// ── Web Audio Synthesis Engine ───────────────────────────────────────────────
// All sounds synthesized 100% in-browser. Zero API calls. Zero credits.

let sharedCtx: AudioContext | null = null;
function getCtx(): AudioContext {
  if (!sharedCtx || sharedCtx.state === 'closed') sharedCtx = new AudioContext();
  return sharedCtx;
}

function synthChime(ctx: AudioContext, dur = 2.5): AudioBuffer {
  const sr = ctx.sampleRate;
  const buf = ctx.createBuffer(1, Math.round(sr * dur), sr);
  const d = buf.getChannelData(0);
  // Harmonic series: fundamental + 2nd + 3rd partials
  const freqs = [880, 1760, 2640, 3520];
  const amps  = [0.5,  0.3,  0.15, 0.08];
  for (let i = 0; i < d.length; i++) {
    const t = i / sr;
    const env = Math.exp(-t * 2.5);
    let s = 0;
    freqs.forEach((f, k) => { s += amps[k] * Math.sin(2 * Math.PI * f * t); });
    d[i] = s * env;
  }
  return buf;
}

function synthKeysJingle(ctx: AudioContext, dur = 1.2): AudioBuffer {
  const sr = ctx.sampleRate;
  const buf = ctx.createBuffer(1, Math.round(sr * dur), sr);
  const d = buf.getChannelData(0);
  // Rapid metallic burst: multiple short dings
  const hits = [0, 0.06, 0.13, 0.22, 0.34, 0.5, 0.68, 0.88].map(o => ({
    t: o, f: 2000 + Math.random() * 3000, decay: 0.07 + Math.random() * 0.1,
  }));
  for (let i = 0; i < d.length; i++) {
    const t = i / sr;
    let s = 0;
    hits.forEach(h => {
      const dt = t - h.t;
      if (dt >= 0) s += 0.35 * Math.exp(-dt / h.decay) * Math.sin(2 * Math.PI * h.f * dt);
    });
    d[i] = s;
  }
  return buf;
}

function synthWhoosh(ctx: AudioContext, dur = 1.5): AudioBuffer {
  const sr = ctx.sampleRate;
  const buf = ctx.createBuffer(1, Math.round(sr * dur), sr);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) {
    const t = i / sr;
    const progress = t / dur;
    // Pitch sweeping noise
    const freq = 200 + progress * 2000;
    const env = Math.sin(Math.PI * progress); // bell shape
    d[i] = env * 0.6 * (Math.random() * 2 - 1) * Math.sin(2 * Math.PI * freq * t * 0.1);
  }
  return buf;
}

function synthCashRegister(ctx: AudioContext, dur = 1.0): AudioBuffer {
  const sr = ctx.sampleRate;
  const buf = ctx.createBuffer(1, Math.round(sr * dur), sr);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) {
    const t = i / sr;
    // Sharp transient + lower ding
    const click = t < 0.02 ? 0.8 * Math.exp(-t * 200) * (Math.random() * 2 - 1) : 0;
    const ding  = 0.4 * Math.exp(-t * 4) * Math.sin(2 * Math.PI * 900 * t);
    const ding2 = 0.2 * Math.exp(-t * 3) * Math.sin(2 * Math.PI * 1800 * t);
    d[i] = click + ding + ding2;
  }
  return buf;
}

function synthApplause(ctx: AudioContext, dur = 3.0): AudioBuffer {
  const sr = ctx.sampleRate;
  const buf = ctx.createBuffer(1, Math.round(sr * dur), sr);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) {
    const t = i / sr;
    const env = t < 0.3 ? (t / 0.3) : (t > dur - 0.5 ? ((dur - t) / 0.5) : 1);
    // Pulsed noise to simulate crowd clapping
    const clap = Math.sin(2 * Math.PI * 8 * t) * 0.5 + 0.5;
    d[i] = env * clap * (Math.random() * 2 - 1) * 0.4;
  }
  return buf;
}

function synthOcean(ctx: AudioContext, dur = 5.0): AudioBuffer {
  const sr = ctx.sampleRate;
  const buf = ctx.createBuffer(1, Math.round(sr * dur), sr);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) {
    const t = i / sr;
    const wave = Math.sin(2 * Math.PI * 0.2 * t) * 0.5 + 0.5;
    d[i] = wave * (Math.random() * 2 - 1) * 0.25;
  }
  return buf;
}

function synthImpact(ctx: AudioContext, dur = 1.5): AudioBuffer {
  const sr = ctx.sampleRate;
  const buf = ctx.createBuffer(1, Math.round(sr * dur), sr);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) {
    const t = i / sr;
    const low = 0.7 * Math.exp(-t * 5) * Math.sin(2 * Math.PI * 60 * t);
    const punch = t < 0.05 ? 0.5 * (Math.random() * 2 - 1) * Math.exp(-t * 100) : 0;
    d[i] = low + punch;
  }
  return buf;
}

function synthBell(ctx: AudioContext, dur = 2.0): AudioBuffer {
  const sr = ctx.sampleRate;
  const buf = ctx.createBuffer(1, Math.round(sr * dur), sr);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) {
    const t = i / sr;
    const env = Math.exp(-t * 1.5);
    d[i] = env * (
      0.5 * Math.sin(2 * Math.PI * 440 * t) +
      0.3 * Math.sin(2 * Math.PI * 880 * t) +
      0.2 * Math.sin(2 * Math.PI * 1320 * t)
    );
  }
  return buf;
}

function synthPianoCord(ctx: AudioContext, dur = 3.0): AudioBuffer {
  const sr = ctx.sampleRate;
  const buf = ctx.createBuffer(1, Math.round(sr * dur), sr);
  const d = buf.getChannelData(0);
  // Major chord: C4-E4-G4
  const notes = [261.63, 329.63, 392.0];
  for (let i = 0; i < d.length; i++) {
    const t = i / sr;
    const env = t < 0.01 ? t / 0.01 : Math.exp(-(t - 0.01) * 1.2);
    let s = 0;
    notes.forEach(f => { s += Math.sin(2 * Math.PI * f * t); });
    d[i] = (s / notes.length) * env * 0.5;
  }
  return buf;
}

function synthStrings(ctx: AudioContext, dur = 3.5): AudioBuffer {
  const sr = ctx.sampleRate;
  const buf = ctx.createBuffer(1, Math.round(sr * dur), sr);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) {
    const t = i / sr;
    const env = t < 0.4 ? t / 0.4 : (t > dur - 0.5 ? (dur - t) / 0.5 : 1);
    const vibrato = 1 + 0.003 * Math.sin(2 * Math.PI * 5 * t);
    d[i] = env * 0.35 * (
      Math.sin(2 * Math.PI * 440 * vibrato * t) +
      0.6 * Math.sin(2 * Math.PI * 554.37 * vibrato * t) +
      0.4 * Math.sin(2 * Math.PI * 659.25 * vibrato * t)
    );
  }
  return buf;
}

function synthPowerUp(ctx: AudioContext, dur = 1.2): AudioBuffer {
  const sr = ctx.sampleRate;
  const buf = ctx.createBuffer(1, Math.round(sr * dur), sr);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) {
    const t = i / sr;
    const progress = t / dur;
    const freq = 200 + progress * 1800;
    const env = t < 0.1 ? t / 0.1 : (t > dur - 0.2 ? (dur - t) / 0.2 : 1);
    d[i] = env * 0.4 * Math.sin(2 * Math.PI * freq * t);
  }
  return buf;
}

function synthHeartbeat(ctx: AudioContext, dur = 2.0): AudioBuffer {
  const sr = ctx.sampleRate;
  const buf = ctx.createBuffer(1, Math.round(sr * dur), sr);
  const d = buf.getChannelData(0);
  // Two thumps: "lub-dub" at 0.2s and 0.4s
  const beats = [0.1, 0.35, 1.1, 1.35];
  for (let i = 0; i < d.length; i++) {
    const t = i / sr;
    let s = 0;
    beats.forEach(b => {
      const dt = t - b;
      if (dt >= 0 && dt < 0.15) {
        s += Math.exp(-dt * 30) * Math.sin(2 * Math.PI * 80 * dt) * 0.7;
      }
    });
    d[i] = s;
  }
  return buf;
}

function synthSuccess(ctx: AudioContext, dur = 1.5): AudioBuffer {
  const sr = ctx.sampleRate;
  const buf = ctx.createBuffer(1, Math.round(sr * dur), sr);
  const d = buf.getChannelData(0);
  // Ascending arpeggio
  const notes = [523.25, 659.25, 783.99, 1046.5];
  const noteLen = 0.25;
  for (let i = 0; i < d.length; i++) {
    const t = i / sr;
    const noteIdx = Math.min(Math.floor(t / noteLen), notes.length - 1);
    const noteT = t - noteIdx * noteLen;
    const env = noteT < 0.02 ? noteT / 0.02 : Math.exp(-(noteT - 0.02) * 8);
    d[i] = env * 0.45 * Math.sin(2 * Math.PI * notes[noteIdx] * noteT);
  }
  return buf;
}

function synthCoins(ctx: AudioContext, dur = 2.0): AudioBuffer {
  const sr = ctx.sampleRate;
  const buf = ctx.createBuffer(1, Math.round(sr * dur), sr);
  const d = buf.getChannelData(0);
  const hits = Array.from({ length: 20 }, (_, k) => ({
    t: (k / 20) * 1.5, f: 1800 + Math.random() * 2200, decay: 0.04 + Math.random() * 0.06
  }));
  for (let i = 0; i < d.length; i++) {
    const t = i / sr;
    let s = 0;
    hits.forEach(h => {
      const dt = t - h.t;
      if (dt >= 0) s += 0.25 * Math.exp(-dt / h.decay) * Math.sin(2 * Math.PI * h.f * dt);
    });
    d[i] = s;
  }
  return buf;
}

// ── Preset catalog ─────────────────────────────────────────────────────────

const SFX_CATEGORIES = [
  {
    label: '🏠 Real Estate',
    presets: [
      { id: 're-chime',    label: 'Luxury Door Chime',  synth: synthChime,        dur: 2.5 },
      { id: 're-keys',     label: 'Keys Jingling',      synth: synthKeysJingle,   dur: 1.2 },
      { id: 're-bell',     label: 'Elevator Ding',      synth: synthBell,         dur: 2.0 },
      { id: 're-pop',      label: 'Champagne Pop',      synth: (c: AudioContext) => synthCashRegister(c, 0.8), dur: 0.8 },
      { id: 're-applause', label: 'Applause',           synth: synthApplause,     dur: 3.0 },
      { id: 're-piano',    label: 'Pen Signing',        synth: (c: AudioContext) => synthBell(c, 1.0), dur: 1.0 },
    ],
  },
  {
    label: '💰 Money',
    presets: [
      { id: 'mo-register', label: 'Cash Register',    synth: synthCashRegister, dur: 1.0 },
      { id: 'mo-coins',    label: 'Coins Pouring',    synth: synthCoins,        dur: 2.0 },
      { id: 'mo-bills',    label: 'Money Counting',   synth: (c: AudioContext) => synthKeysJingle(c, 1.5), dur: 1.5 },
      { id: 'mo-stamp',    label: 'Deal Stamp',       synth: (c: AudioContext) => synthImpact(c, 0.6), dur: 0.6 },
      { id: 'mo-atm',      label: 'ATM Beeps',        synth: (c: AudioContext) => synthPowerUp(c, 0.8), dur: 0.8 },
      { id: 'mo-safe',     label: 'Safe Opening',     synth: (c: AudioContext) => synthChime(c, 3.0), dur: 3.0 },
    ],
  },
  {
    label: '🌊 Ambient',
    presets: [
      { id: 'am-ocean',    label: 'Ocean Waves',       synth: synthOcean,        dur: 5.0 },
      { id: 'am-pool',     label: 'Pool Ambience',     synth: (c: AudioContext) => synthOcean(c, 4.0), dur: 4.0 },
      { id: 'am-city',     label: 'City Traffic',      synth: (c: AudioContext) => synthApplause(c, 4.0), dur: 4.0 },
      { id: 'am-wind',     label: 'Wind in Trees',     synth: (c: AudioContext) => synthWhoosh(c, 3.0), dur: 3.0 },
      { id: 'am-rain',     label: 'Rain on Window',    synth: (c: AudioContext) => synthOcean(c, 6.0), dur: 6.0 },
      { id: 'am-desert',   label: 'Desert Wind',       synth: (c: AudioContext) => synthWhoosh(c, 4.0), dur: 4.0 },
    ],
  },
  {
    label: '✨ Transitions',
    presets: [
      { id: 'tr-whoosh',   label: 'Whoosh Sweep',      synth: synthWhoosh,       dur: 1.5 },
      { id: 'tr-shutter',  label: 'Camera Shutter',    synth: (c: AudioContext) => synthCashRegister(c, 0.3), dur: 0.3 },
      { id: 'tr-glitch',   label: 'Digital Glitch',    synth: (c: AudioContext) => synthKeysJingle(c, 0.8), dur: 0.8 },
      { id: 'tr-power',    label: 'Power Up',          synth: synthPowerUp,      dur: 1.2 },
      { id: 'tr-page',     label: 'Page Turn',         synth: (c: AudioContext) => synthWhoosh(c, 0.8), dur: 0.8 },
      { id: 'tr-bell',     label: 'Bell Chime',        synth: synthBell,         dur: 2.0 },
    ],
  },
  {
    label: '🎭 Cinematic',
    presets: [
      { id: 'ci-impact',   label: 'Dramatic Impact',   synth: synthImpact,       dur: 1.5 },
      { id: 'ci-tension',  label: 'Tension Rise',      synth: synthStrings,      dur: 3.5 },
      { id: 'ci-success',  label: 'Success Fanfare',   synth: synthSuccess,      dur: 1.5 },
      { id: 'ci-lounge',   label: 'Luxury Ambience',   synth: synthPianoCord,    dur: 3.0 },
      { id: 'ci-heart',    label: 'Heartbeat',         synth: synthHeartbeat,    dur: 2.0 },
      { id: 'ci-cheer',    label: 'Crowd Cheer',       synth: (c: AudioContext) => synthApplause(c, 4.0), dur: 4.0 },
    ],
  },
  {
    label: '🎹 Music Stings',
    presets: [
      { id: 'mu-logo',     label: 'Luxury Logo Sting', synth: synthStrings,      dur: 3.5 },
      { id: 'mu-jazz',     label: 'Jazz Lick',         synth: synthPianoCord,    dur: 3.0 },
      { id: 'mu-arabic',   label: 'Arabic Oud Note',   synth: (c: AudioContext) => synthStrings(c, 2.5), dur: 2.5 },
      { id: 'mu-piano',    label: 'Piano Reveal',      synth: synthPianoCord,    dur: 3.0 },
      { id: 'mu-strings',  label: 'Strings Swell',     synth: synthStrings,      dur: 3.5 },
      { id: 'mu-corp',     label: 'Corporate Sting',   synth: synthSuccess,      dur: 1.5 },
    ],
  },
];

// ── Synth & play a buffer via Web Audio ─────────────────────────────────────

async function synthAndPlay(
  synthFn: (ctx: AudioContext) => AudioBuffer,
  onStart: () => void,
  onEnd: () => void,
  volumeRef: React.MutableRefObject<number>
): Promise<() => void> {
  const ctx = getCtx();
  if (ctx.state === 'suspended') await ctx.resume();

  const buffer = synthFn(ctx);
  const source = ctx.createBufferSource();
  const gainNode = ctx.createGain();
  gainNode.gain.value = volumeRef.current;
  source.buffer = buffer;
  source.connect(gainNode);
  gainNode.connect(ctx.destination);
  source.onended = onEnd;
  source.start();
  onStart();
  return () => { try { source.stop(); } catch {} };
}

// ── SoundEffectsPanel component ──────────────────────────────────────────────

export function SoundEffectsPanel({ onAddToTimeline }: SoundEffectsPanelProps) {
  const [playingId, setPlayingId]   = useState<string | null>(null);
  const [expandedCats, setExpandedCats] = useState<Record<string, boolean>>({ '🏠 Real Estate': true });
  const [volume, setVolume] = useState(0.8);
  const volumeRef = useRef(volume);
  volumeRef.current = volume;
  const stopFnRef = useRef<(() => void) | null>(null);

  const stopCurrent = useCallback(() => {
    stopFnRef.current?.();
    stopFnRef.current = null;
    setPlayingId(null);
  }, []);

  const handlePlay = useCallback(async (preset: { id: string; synth: (c: AudioContext) => AudioBuffer; dur: number; label: string }) => {
    if (playingId === preset.id) {
      stopCurrent();
      return;
    }
    stopCurrent();

    try {
      const stop = await synthAndPlay(
        preset.synth,
        () => setPlayingId(preset.id),
        () => setPlayingId(prev => prev === preset.id ? null : prev),
        volumeRef
      );
      stopFnRef.current = stop;
    } catch (e) {
      toast.error('Playback failed. Click anywhere first to unlock audio.');
    }
  }, [playingId, stopCurrent]);

  const handleAdd = useCallback((preset: { id: string; label: string; synth: (c: AudioContext) => AudioBuffer; dur: number }) => {
    // Encode the synth as an inline data URL (silent stub) — real audio will be synthesized on playback
    // For timeline, we pass a dummy URL and the label; timeline playback will re-synth
    if (onAddToTimeline) {
      onAddToTimeline({ name: preset.label, url: `sfx:${preset.id}`, duration: preset.dur });
      toast.success(`"${preset.label}" added to timeline`);
    } else {
      toast.info('Connect the SFX panel to your timeline to add sounds');
    }
  }, [onAddToTimeline]);

  const toggleCat = useCallback((label: string) => {
    setExpandedCats(prev => ({ ...prev, [label]: !prev[label] }));
  }, []);

  return (
    <div className="h-full flex flex-col bg-slate-900 text-white">
      {/* Volume & info bar */}
      <div className="flex-shrink-0 px-3 py-2 border-b border-slate-700 flex items-center gap-3">
        <div className="flex items-center gap-1.5 text-amber-400">
          <Volume2 className="w-3.5 h-3.5" />
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Volume</span>
        </div>
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={volume}
          onChange={e => setVolume(Number(e.target.value))}
          className="flex-1 h-1.5 accent-amber-500 cursor-pointer"
        />
        <span className="text-xs text-slate-400 w-8 text-right">{Math.round(volume * 100)}%</span>
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/30">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest">Zero Credits</span>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3 space-y-2">
          <p className="text-[10px] text-slate-500 leading-relaxed px-1">
            <strong className="text-slate-400">Click</strong> any sound to preview instantly — synthesized in your browser. <strong className="text-slate-400">Add</strong> to place it on the timeline.
          </p>

          {SFX_CATEGORIES.map(cat => {
            const isExpanded = expandedCats[cat.label] ?? false;
            return (
              <div key={cat.label} className="rounded-lg border border-slate-700 overflow-hidden">
                <button
                  onClick={() => toggleCat(cat.label)}
                  className="w-full flex items-center justify-between px-3 py-2 bg-slate-800 hover:bg-slate-750 text-left transition-colors"
                >
                  <span className="text-xs font-semibold text-slate-200">{cat.label}</span>
                  {isExpanded
                    ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
                    : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  }
                </button>
                {isExpanded && (
                  <div className="px-2 py-2 bg-slate-900 grid grid-cols-2 gap-1.5">
                    {cat.presets.map(preset => {
                      const isPlaying = playingId === preset.id;
                      return (
                        <div
                          key={preset.id}
                          className={`rounded-lg border transition-all overflow-hidden ${
                            isPlaying ? 'border-amber-500/70 bg-amber-500/5' : 'border-slate-700 bg-slate-800 hover:border-amber-500/40'
                          }`}
                        >
                          {/* Play row */}
                          <button
                            onClick={() => handlePlay(preset)}
                            className="w-full flex items-center gap-2 px-2.5 py-2 text-left group"
                          >
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                              isPlaying ? 'bg-amber-500 text-black' : 'bg-slate-700 text-slate-300 group-hover:bg-amber-500/20 group-hover:text-amber-400'
                            }`}>
                              {isPlaying
                                ? <Square className="w-2.5 h-2.5 fill-current" />
                                : <Play className="w-2.5 h-2.5 fill-current ml-0.5" />
                              }
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[11px] font-semibold text-slate-200 truncate leading-tight">{preset.label}</p>
                              <p className="text-[9px] text-slate-500 leading-tight">{preset.dur}s · Browser Synth</p>
                            </div>
                          </button>
                          {/* Add button */}
                          <button
                            onClick={() => handleAdd(preset)}
                            className="w-full flex items-center justify-center gap-1 py-1 bg-slate-700/60 hover:bg-amber-500 hover:text-black text-slate-400 text-[9px] font-bold transition-all border-t border-slate-700/60"
                          >
                            <Plus className="w-2.5 h-2.5" />
                            Add to Timeline
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
