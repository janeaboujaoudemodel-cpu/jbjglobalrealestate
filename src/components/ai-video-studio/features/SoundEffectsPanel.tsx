import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Music2, Play, Download, Plus, Loader2, Wand2, Volume2 } from 'lucide-react';
import { toast } from 'sonner';

interface SoundEffect {
  id: string;
  prompt: string;
  url: string;
  duration: number;
}

const SFX_CATEGORIES = [
  { label: '🏠 Real Estate', prompts: ['Luxury door opening', 'Keys jingling', 'Elevator chime'] },
  { label: '💰 Money', prompts: ['Cash register ching', 'Coins pouring', 'Money counting'] },
  { label: '🌆 Ambient', prompts: ['City traffic ambience', 'Ocean waves', 'Wind through trees'] },
  { label: '✨ Transitions', prompts: ['Whoosh sweep', 'Camera shutter', 'Digital glitch'] },
  { label: '🎉 Celebration', prompts: ['Crowd applause', 'Champagne pop', 'Success fanfare'] },
  { label: '🎭 Drama', prompts: ['Dramatic impact hit', 'Tension rise', 'Cinematic boom'] },
];

export function SoundEffectsPanel() {
  const [prompt, setPrompt] = useState('');
  const [duration, setDuration] = useState(5);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedSounds, setGeneratedSounds] = useState<SoundEffect[]>([]);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRefs = useRef<Record<string, HTMLAudioElement>>({});

  const handleGenerate = async (customPrompt?: string) => {
    const sfxPrompt = customPrompt || prompt;
    if (!sfxPrompt.trim()) {
      toast.error('Enter a sound description');
      return;
    }
    setIsGenerating(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-sfx`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ prompt: sfxPrompt, duration }),
        }
      );
      if (!response.ok) throw new Error('SFX generation failed');
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setGeneratedSounds(prev => [
        { id: crypto.randomUUID(), prompt: sfxPrompt, url, duration },
        ...prev,
      ]);
      toast.success('Sound effect generated!');
    } catch (err) {
      toast.error('Failed to generate sound effect. Check ElevenLabs API key.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePlay = (sound: SoundEffect) => {
    if (playingId === sound.id) {
      audioRefs.current[sound.id]?.pause();
      setPlayingId(null);
      return;
    }
    // Stop any playing audio
    Object.values(audioRefs.current).forEach(a => a.pause());
    const audio = audioRefs.current[sound.id] || new Audio(sound.url);
    audioRefs.current[sound.id] = audio;
    audio.onended = () => setPlayingId(null);
    audio.play();
    setPlayingId(sound.id);
  };

  const handleDownload = (sound: SoundEffect) => {
    const a = document.createElement('a');
    a.href = sound.url;
    a.download = `sfx-${sound.prompt.slice(0, 20).replace(/\s+/g, '-')}.mp3`;
    a.click();
  };

  return (
    <div className="h-full flex flex-col bg-slate-900 text-white">
      <div className="p-3 border-b border-slate-700 flex gap-2">
        <Input
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          placeholder="Describe a sound effect..."
          className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-400 flex-1"
          onKeyDown={e => e.key === 'Enter' && handleGenerate()}
        />
        <select
          value={duration}
          onChange={e => setDuration(Number(e.target.value))}
          className="bg-slate-800 border border-slate-600 rounded-md px-2 text-white text-sm"
        >
          {[2, 3, 5, 8, 10].map(d => (
            <option key={d} value={d}>{d}s</option>
          ))}
        </select>
        <Button
          size="sm"
          onClick={() => handleGenerate()}
          disabled={isGenerating}
          className="bg-amber-500 hover:bg-amber-400 text-black font-bold"
        >
          {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
        </Button>
      </div>

      <ScrollArea className="flex-1">
        {/* Category presets */}
        <div className="p-3 space-y-3">
          {SFX_CATEGORIES.map(cat => (
            <div key={cat.label}>
              <p className="text-xs text-slate-400 font-medium mb-1.5">{cat.label}</p>
              <div className="flex flex-wrap gap-1.5">
                {cat.prompts.map(p => (
                  <button
                    key={p}
                    onClick={() => handleGenerate(p)}
                    disabled={isGenerating}
                    className="text-xs px-2 py-1 rounded bg-slate-700 hover:bg-slate-600 text-slate-200 border border-slate-600 hover:border-amber-400/50 transition-colors disabled:opacity-50"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          ))}

          {/* Generated sounds */}
          {generatedSounds.length > 0 && (
            <div>
              <p className="text-xs text-slate-400 font-medium mb-2 mt-4">Generated Sounds</p>
              <div className="space-y-2">
                {generatedSounds.map(sound => (
                  <div key={sound.id} className="flex items-center gap-2 bg-slate-800 rounded-lg p-2 border border-slate-700">
                    <Music2 className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                    <span className="text-xs text-slate-300 flex-1 truncate">{sound.prompt}</span>
                    <span className="text-xs text-slate-500">{sound.duration}s</span>
                    <Button size="sm" variant="ghost" onClick={() => handlePlay(sound)} className="h-6 w-6 p-0 text-white hover:text-amber-400 hover:bg-slate-700">
                      {playingId === sound.id ? <Volume2 className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDownload(sound)} className="h-6 w-6 p-0 text-white hover:text-amber-400 hover:bg-slate-700">
                      <Download className="w-3 h-3" />
                    </Button>
                    <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-white hover:text-amber-400 hover:bg-slate-700">
                      <Plus className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
