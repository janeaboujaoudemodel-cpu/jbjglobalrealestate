import React, { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Music2, Play, Download, Plus, Loader2, Wand2, Square, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';
import { useAudioAnalyser } from '../hooks/useAudioAnalyser';
import { SoundWaveform } from './SoundWaveform';

interface SoundEffect {
  id: string;
  prompt: string;
  url: string;
  duration: number;
}

interface SoundEffectsPanelProps {
  onAddToTimeline?: (soundEffect: { name: string; url: string; duration: number }) => void;
}

const SFX_CATEGORIES = [
  {
    label: '🏠 Real Estate',
    prompts: [
      { label: 'Luxury door chime',    text: 'Elegant luxury door chime bell, warm resonant tone' },
      { label: 'Keys jingling',        text: 'House keys jingling on keyring, metallic clink' },
      { label: 'Elevator ding',        text: 'Hotel elevator arrival ding, clear bell tone' },
      { label: 'Champagne pop',        text: 'Champagne bottle cork popping, celebration fizz' },
      { label: 'Applause',            text: 'Polite indoor applause, small crowd clapping' },
      { label: 'Pen signing',         text: 'Pen signing contract on paper, crisp scratch' },
    ],
  },
  {
    label: '💰 Money',
    prompts: [
      { label: 'Cash register',        text: 'Cash register ching, drawer opening sound' },
      { label: 'Coins pouring',        text: 'Gold coins pouring into a pile, metallic rattle' },
      { label: 'Money counting',       text: 'Paper money being counted, crisp bills rustling' },
      { label: 'Deal stamp',           text: 'Rubber stamp stamping APPROVED on document' },
      { label: 'ATM beeps',           text: 'ATM machine processing beeps, card accepted' },
      { label: 'Safe opening',        text: 'Heavy vault safe door opening, mechanical click' },
    ],
  },
  {
    label: '🌊 Ambient',
    prompts: [
      { label: 'Ocean ambience',       text: 'Relaxing ocean waves lapping on a beach, birds distant' },
      { label: 'Pool ambience',        text: 'Luxury pool water gentle ripple, outdoor relaxation' },
      { label: 'City traffic',         text: 'City street ambience, distant traffic hum, urban' },
      { label: 'Wind through trees',   text: 'Gentle wind rustling through palm trees, tropical' },
      { label: 'Rain on window',       text: 'Light rain falling on a glass window, calm interior' },
      { label: 'Desert wind',         text: 'Hot desert wind sweep, ambient arid atmosphere' },
    ],
  },
  {
    label: '✨ Transitions',
    prompts: [
      { label: 'Whoosh sweep',         text: 'Cinematic camera whoosh sweep transition sound' },
      { label: 'Camera shutter',       text: 'Camera shutter click, professional DSLR snapshot' },
      { label: 'Digital glitch',       text: 'Digital glitch transition, electronic distortion' },
      { label: 'Power up',             text: 'Futuristic tech power up activation sound' },
      { label: 'Page turn',           text: 'Elegant paper page turn, soft whoosh' },
      { label: 'Bell chime',          text: 'Single soft bell chime, notification tone' },
    ],
  },
  {
    label: '🎭 Cinematic',
    prompts: [
      { label: 'Dramatic impact',      text: 'Cinematic bass impact boom, dramatic reveal hit' },
      { label: 'Tension rise',         text: 'Orchestral tension build, strings rising suspense' },
      { label: 'Success fanfare',      text: 'Short triumphant fanfare, achievement success jingle' },
      { label: 'Luxury ambience',      text: 'Sophisticated lounge ambience, piano jazz background' },
      { label: 'Heartbeat',           text: 'Slow dramatic heartbeat, cinematic pulse' },
      { label: 'Crowd cheer',         text: 'Stadium crowd cheering, celebration roar' },
    ],
  },
  {
    label: '🎹 Music Stings',
    prompts: [
      { label: 'Luxury logo sting',   text: 'Premium brand logo reveal musical sting, elegant' },
      { label: 'Jazz lick',           text: 'Short smooth jazz musical phrase, sophisticated' },
      { label: 'Arabic oud note',     text: 'Arabic oud instrument short melodic phrase' },
      { label: 'Piano reveal',        text: 'Single elegant piano chord reveal, luxury feel' },
      { label: 'Strings swell',       text: 'Short orchestral strings swell, emotional build' },
      { label: 'Corporate sting',     text: 'Modern corporate upbeat musical sting, professional' },
    ],
  },
];

const DURATIONS = [2, 3, 5, 8, 10, 15, 22];

export function SoundEffectsPanel({ onAddToTimeline }: SoundEffectsPanelProps) {
  const [prompt, setPrompt] = useState('');
  const [duration, setDuration] = useState(5);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingPreset, setGeneratingPreset] = useState<string | null>(null);
  const [generatedSounds, setGeneratedSounds] = useState<SoundEffect[]>([]);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [playProgress, setPlayProgress] = useState<Record<string, number>>({});
  const [expandedCats, setExpandedCats] = useState<Record<string, boolean>>({ '🏠 Real Estate': true });
  const audioRefs = useRef<Record<string, HTMLAudioElement>>({});
  const analyserRefs = useRef<Record<string, AnalyserNode>>({});
  const { connectAnalyser, resumeCtx } = useAudioAnalyser();

  const stopAll = useCallback(() => {
    Object.values(audioRefs.current).forEach(a => { a.pause(); a.currentTime = 0; });
    setPlayingId(null);
    setPlayProgress({});
  }, []);

  const callSFX = useCallback(async (sfxPrompt: string, sfxDuration: number): Promise<SoundEffect | null> => {
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-sfx`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ prompt: sfxPrompt, duration: sfxDuration }),
      }
    );
    if (!response.ok) {
      const err = await response.text().catch(() => 'Unknown error');
      throw new Error(err);
    }
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    return { id: crypto.randomUUID(), prompt: sfxPrompt, url, duration: sfxDuration };
  }, []);

  const handleGenerate = useCallback(async (customPrompt?: string) => {
    const sfxPrompt = (customPrompt || prompt).trim();
    if (!sfxPrompt) { toast.error('Enter a sound description first'); return; }

    setIsGenerating(true);
    if (customPrompt) setGeneratingPreset(customPrompt);

    try {
      const sound = await callSFX(sfxPrompt, duration);
      if (sound) {
        setGeneratedSounds(prev => [sound, ...prev]);
        toast.success(`"${sfxPrompt}" generated!`);
      }
    } catch {
      toast.error('SFX generation failed. Check your ElevenLabs API key.');
    } finally {
      setIsGenerating(false);
      setGeneratingPreset(null);
    }
  }, [prompt, duration, callSFX]);

  const handlePlay = useCallback(async (sound: SoundEffect) => {
    if (playingId === sound.id) {
      stopAll();
      return;
    }
    stopAll();

    const audio = audioRefs.current[sound.id] || new Audio(sound.url);
    audioRefs.current[sound.id] = audio;

    // Resume AudioContext (required by Safari + Chrome autoplay policy)
    await resumeCtx();

    // Connect through Web Audio API analyser (WeakMap prevents duplicate wrapping)
    if (!analyserRefs.current[sound.id]) {
      analyserRefs.current[sound.id] = connectAnalyser(audio);
    }

    audio.onended = () => { setPlayingId(null); setPlayProgress(p => ({ ...p, [sound.id]: 0 })); };
    audio.ontimeupdate = () => {
      if (audio.duration) {
        setPlayProgress(p => ({ ...p, [sound.id]: (audio.currentTime / audio.duration) * 100 }));
      }
    };
    audio.play().catch(() => toast.error('Playback failed'));
    setPlayingId(sound.id);
  }, [playingId, stopAll, resumeCtx, connectAnalyser]);

  const handleDownload = useCallback((sound: SoundEffect) => {
    const a = document.createElement('a');
    a.href = sound.url;
    a.download = `sfx-${sound.prompt.slice(0, 24).replace(/\s+/g, '-').toLowerCase()}.mp3`;
    a.click();
  }, []);

  const handleAddToTimeline = useCallback((sound: SoundEffect) => {
    if (onAddToTimeline) {
      onAddToTimeline({ name: sound.prompt, url: sound.url, duration: sound.duration });
      toast.success(`"${sound.prompt}" added to timeline`);
    } else {
      toast.info('Connect the SFX panel to your timeline to add sounds');
    }
  }, [onAddToTimeline]);

  const toggleCat = useCallback((label: string) => {
    setExpandedCats(prev => ({ ...prev, [label]: !prev[label] }));
  }, []);

  return (
    <div className="h-full flex flex-col bg-slate-900 text-white">
      {/* Prompt bar */}
      <div className="flex-shrink-0 p-3 border-b border-slate-700 flex gap-2">
        <Input
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          placeholder="Describe a sound effect..."
          className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-400 flex-1 text-sm h-8"
          onKeyDown={e => e.key === 'Enter' && handleGenerate()}
        />
        <select
          value={duration}
          onChange={e => setDuration(Number(e.target.value))}
          className="bg-slate-800 border border-slate-600 rounded-md px-2 text-white text-xs h-8 cursor-pointer"
        >
          {DURATIONS.map(d => (
            <option key={d} value={d}>{d}s</option>
          ))}
        </select>
        <Button
          size="sm"
          onClick={() => handleGenerate()}
          disabled={isGenerating}
          className="bg-amber-500 hover:bg-amber-400 text-black font-bold h-8 px-3 gap-1.5"
        >
          {isGenerating && !generatingPreset
            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
            : <Wand2 className="w-3.5 h-3.5" />
          }
          <span className="text-xs">Generate</span>
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3 space-y-2">

          {/* Generated sounds */}
          {generatedSounds.length > 0 && (
            <div className="mb-3">
              <p className="text-xs font-semibold text-amber-400 mb-2 flex items-center gap-1.5">
                <Music2 className="w-3.5 h-3.5" />
                Generated Sounds ({generatedSounds.length})
              </p>
              <div className="space-y-2">
                {generatedSounds.map(sound => {
                  const isPlaying = playingId === sound.id;
                  const progress = playProgress[sound.id] ?? 0;
                  return (
                    <div
                      key={sound.id}
                      className={`bg-slate-800 rounded-lg px-3 py-2.5 border transition-colors ${isPlaying ? 'border-amber-500/60' : 'border-slate-700 hover:border-amber-500/40'}`}
                    >
                      <div className="flex items-center gap-2 mb-1.5">
                        {/* Real-time waveform via Web Audio API AnalyserNode */}
                        <div className="flex-shrink-0">
                          <SoundWaveform
                            analyser={analyserRefs.current[sound.id] ?? null}
                            isPlaying={isPlaying}
                            width={112}
                            height={28}
                          />
                        </div>
                        <span className="text-xs text-slate-200 flex-1 truncate" title={sound.prompt}>
                          {sound.prompt}
                        </span>
                        <span className="text-xs text-slate-500 flex-shrink-0">{sound.duration}s</span>
                        <div className="flex items-center gap-0.5">
                          <Button
                            size="sm" variant="ghost"
                            onClick={() => handlePlay(sound)}
                            className={`h-6 w-6 p-0 hover:bg-slate-700 ${isPlaying ? 'text-amber-400' : 'text-slate-300 hover:text-amber-400'}`}
                            title={isPlaying ? 'Stop' : 'Play'}
                          >
                            {isPlaying
                              ? <Square className="w-3 h-3 fill-current" />
                              : <Play className="w-3 h-3 fill-current" />
                            }
                          </Button>
                          <Button
                            size="sm" variant="ghost"
                            onClick={() => handleDownload(sound)}
                            className="h-6 w-6 p-0 text-slate-300 hover:text-amber-400 hover:bg-slate-700"
                            title="Download"
                          >
                            <Download className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm" variant="ghost"
                            onClick={() => handleAddToTimeline(sound)}
                            className="h-6 w-6 p-0 text-slate-300 hover:text-green-400 hover:bg-slate-700"
                            title="Add to Timeline"
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                      {/* Progress bar */}
                      <div className="w-full h-1 bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-amber-400 rounded-full transition-all duration-200"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="border-t border-slate-700 my-3" />
            </div>
          )}

          {/* Preset categories */}
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
                  <div className="px-3 py-2 bg-slate-900 grid grid-cols-2 gap-1.5">
                    {cat.prompts.map(p => {
                      const isThisGenerating = isGenerating && generatingPreset === p.text;
                      return (
                        <button
                          key={p.label}
                          onClick={() => handleGenerate(p.text)}
                          disabled={isGenerating}
                          className="flex items-center gap-1.5 text-xs px-2.5 py-2 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 hover:border-amber-400/50 transition-all disabled:opacity-50 text-left group"
                        >
                          {isThisGenerating
                            ? <Loader2 className="w-3 h-3 animate-spin text-amber-400 flex-shrink-0" />
                            : <Wand2 className="w-3 h-3 text-slate-500 group-hover:text-amber-400 flex-shrink-0 transition-colors" />
                          }
                          <span className="truncate">{p.label}</span>
                        </button>
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
