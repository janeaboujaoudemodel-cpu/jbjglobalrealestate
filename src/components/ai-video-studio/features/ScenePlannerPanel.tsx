/**
 * ScenePlannerPanel — AI-powered storyboard generation + timeline builder
 * Uses Lovable AI (google/gemini-2.5-flash) via edge function to generate scene breakdowns
 */
import React, { useCallback, useState } from 'react';
import { Film, Sparkles, Plus, Loader2, Trash2, GripVertical } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const C = {
  bgCard: '#18181F',
  bgButton: '#1E1E28',
  borderSubtle: 'rgba(255,255,255,0.06)',
  borderAccent: 'rgba(200,168,122,0.35)',
  textPrimary: '#F1F0EE',
  textSecondary: '#8A8A9A',
  accent: '#C8A87A',
  accentGlow: 'rgba(200,168,122,0.15)',
} as const;

interface Scene {
  id: string;
  number: number;
  description: string;
  duration: number;
  transition: string;
  textOverlay: string;
}

const TRANSITION_OPTIONS = ['Fade', 'Dissolve', 'Wipe Left', 'Wipe Right', 'Zoom', 'Cut'];

const PRESET_CONCEPTS = [
  'Luxury villa tour highlighting pool, garden, and master bedroom',
  'Dubai Marina lifestyle montage with dining, views, and nightlife',
  'Off-plan investment pitch with renders, location map, and ROI data',
  'Agent introduction video with bio, achievements, and call-to-action',
];

interface ScenePlannerPanelProps {
  onBuildTimeline?: (scenes: Scene[]) => void;
}

export function ScenePlannerPanel({ onBuildTimeline }: ScenePlannerPanelProps) {
  const [concept, setConcept] = useState('');
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const generateScenes = useCallback(async () => {
    const prompt = concept.trim();
    if (!prompt) { toast.error('Enter a video concept'); return; }
    setIsGenerating(true);

    try {
      const { data, error } = await supabase.functions.invoke('ai-video-scene-planner', {
        body: { concept: prompt },
      });

      if (error) throw error;

      if (data?.scenes && Array.isArray(data.scenes)) {
        const parsed: Scene[] = data.scenes.map((s: any, i: number) => ({
          id: crypto.randomUUID(),
          number: i + 1,
          description: s.description || `Scene ${i + 1}`,
          duration: Math.max(2, Math.min(15, s.duration || 5)),
          transition: s.transition || 'Fade',
          textOverlay: s.textOverlay || '',
        }));
        setScenes(parsed);
        toast.success(`Generated ${parsed.length} scenes`);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err: any) {
      console.error('Scene planner error:', err);
      if (err?.message?.includes('429')) {
        toast.error('Rate limit exceeded. Try again in a moment.');
      } else if (err?.message?.includes('402')) {
        toast.error('AI credits exhausted. Please add credits to continue.');
      } else {
        toast.error('Failed to generate storyboard');
      }
    } finally {
      setIsGenerating(false);
    }
  }, [concept]);

  const updateScene = useCallback((id: string, updates: Partial<Scene>) => {
    setScenes(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  }, []);

  const deleteScene = useCallback((id: string) => {
    setScenes(prev => prev.filter(s => s.id !== id).map((s, i) => ({ ...s, number: i + 1 })));
  }, []);

  const addEmptyScene = useCallback(() => {
    setScenes(prev => [...prev, {
      id: crypto.randomUUID(),
      number: prev.length + 1,
      description: '',
      duration: 5,
      transition: 'Fade',
      textOverlay: '',
    }]);
  }, []);

  const totalDuration = scenes.reduce((sum, s) => sum + s.duration, 0);

  return (
    <div className="p-4 space-y-4" style={{ color: C.textPrimary }}>
      <div className="flex items-center gap-2 mb-2">
        <Film className="w-4 h-4" style={{ color: C.accent }} />
        <h3 className="text-sm font-semibold">Scene Planner</h3>
        <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: C.accentGlow, color: C.accent, border: `1px solid ${C.borderAccent}` }}>
          AI Powered
        </span>
      </div>
      <p className="text-[11px]" style={{ color: C.textSecondary }}>
        Describe your video concept and AI will generate a scene-by-scene storyboard. Edit scenes then build to timeline.
      </p>

      {/* Concept input */}
      <div className="space-y-2">
        <textarea
          value={concept}
          onChange={e => setConcept(e.target.value)}
          placeholder="Describe your video concept... e.g. 'Luxury penthouse tour with sunset views, modern interior, and lifestyle shots'"
          rows={3}
          className="w-full px-3 py-2 rounded-lg text-xs resize-none"
          style={{ background: C.bgButton, border: `1px solid ${C.borderSubtle}`, color: C.textPrimary }}
        />
        {/* Presets */}
        <div className="flex flex-wrap gap-1">
          {PRESET_CONCEPTS.map((preset, i) => (
            <button
              key={i}
              onClick={() => setConcept(preset)}
              className="px-2 py-1 rounded text-[9px] transition-all hover:opacity-80"
              style={{ background: C.bgButton, border: `1px solid ${C.borderSubtle}`, color: C.textSecondary }}
            >
              {preset.slice(0, 35)}…
            </button>
          ))}
        </div>
      </div>

      {/* Generate button */}
      <button
        onClick={generateScenes}
        disabled={isGenerating || !concept.trim()}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-50"
        style={{ background: C.accentGlow, border: `1px solid ${C.borderAccent}`, color: C.accent }}
      >
        {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
        {isGenerating ? 'Generating Storyboard...' : 'Generate Storyboard'}
      </button>

      {/* Scene cards */}
      {scenes.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider" style={{ color: C.textSecondary }}>
              {scenes.length} Scenes · {totalDuration}s total
            </span>
            <button onClick={addEmptyScene} className="flex items-center gap-1 text-[10px]" style={{ color: C.accent }}>
              <Plus className="w-3 h-3" /> Add Scene
            </button>
          </div>

          <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin' }}>
            {scenes.map(scene => (
              <div
                key={scene.id}
                className="rounded-lg p-3 space-y-2"
                style={{ background: C.bgCard, border: `1px solid ${C.borderSubtle}` }}
              >
                <div className="flex items-center gap-2">
                  <GripVertical className="w-3 h-3 flex-shrink-0" style={{ color: C.textSecondary }} />
                  <span className="text-[10px] font-bold" style={{ color: C.accent }}>Scene {scene.number}</span>
                  <span className="ml-auto text-[10px] font-mono" style={{ color: C.textSecondary }}>{scene.duration}s</span>
                  <button onClick={() => deleteScene(scene.id)} className="p-0.5 hover:opacity-80" style={{ color: C.textSecondary }}>
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>

                {/* Description */}
                <textarea
                  value={scene.description}
                  onChange={e => updateScene(scene.id, { description: e.target.value })}
                  placeholder="Scene description..."
                  rows={2}
                  className="w-full px-2 py-1.5 rounded text-[11px] resize-none"
                  style={{ background: C.bgButton, border: `1px solid ${C.borderSubtle}`, color: C.textPrimary }}
                />

                <div className="flex gap-2">
                  {/* Duration */}
                  <div className="flex-1">
                    <label className="text-[9px]" style={{ color: C.textSecondary }}>Duration</label>
                    <input
                      type="range" min={2} max={15} value={scene.duration}
                      onChange={e => updateScene(scene.id, { duration: Number(e.target.value) })}
                      className="w-full h-1 rounded-full appearance-none cursor-pointer"
                      style={{ background: `linear-gradient(to right, ${C.accent} ${((scene.duration - 2) / 13) * 100}%, ${C.bgButton} ${((scene.duration - 2) / 13) * 100}%)` }}
                    />
                  </div>
                  {/* Transition */}
                  <div className="w-24">
                    <label className="text-[9px]" style={{ color: C.textSecondary }}>Transition</label>
                    <select
                      value={scene.transition}
                      onChange={e => updateScene(scene.id, { transition: e.target.value })}
                      className="w-full px-1.5 py-1 rounded text-[10px]"
                      style={{ background: C.bgButton, border: `1px solid ${C.borderSubtle}`, color: C.textPrimary }}
                    >
                      {TRANSITION_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>

                {/* Text overlay */}
                <input
                  value={scene.textOverlay}
                  onChange={e => updateScene(scene.id, { textOverlay: e.target.value })}
                  placeholder="Text overlay (optional)"
                  className="w-full px-2 py-1 rounded text-[10px]"
                  style={{ background: C.bgButton, border: `1px solid ${C.borderSubtle}`, color: C.textPrimary }}
                />
              </div>
            ))}
          </div>

          {/* Build Timeline */}
          {onBuildTimeline && (
            <button
              onClick={() => onBuildTimeline(scenes)}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-semibold transition-all"
              style={{ background: `linear-gradient(135deg, ${C.accent}, #A07940)`, color: '#0A0A0F' }}
            >
              <Film className="w-4 h-4" /> Build Timeline ({scenes.length} scenes · {totalDuration}s)
            </button>
          )}
        </div>
      )}
    </div>
  );
}
