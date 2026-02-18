import React, { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sparkles, Loader2, Plus, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface Clip {
  id: string;
  name: string;
  type: string;
  duration: number;
  startTime: number;
}

interface AIEditorPanelProps {
  clips?: Clip[];
  onApplyTemplate?: (template: string) => void;
}

const TEMPLATES = [
  { id: 'property-tour', label: '🏡 Property Tour', desc: '30-60s walkthrough with music' },
  { id: 'social-reel', label: '📱 Social Reel', desc: '15s fast-cut for Reels/TikTok' },
  { id: 'youtube-intro', label: '▶️ YouTube Intro', desc: 'Hook + content structure' },
  { id: 'luxury-ad', label: '✨ Luxury Ad', desc: 'Cinematic 30s property ad' },
];

export function AIEditorPanel({ clips = [], onApplyTemplate }: AIEditorPanelProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  const handleAnalyzeClips = async () => {
    if (clips.length === 0) {
      toast.error('Add clips to the timeline first');
      return;
    }
    setIsAnalyzing(true);
    setAnalysis(null);
    try {
      const clipSummary = clips.map(c => `${c.name} (${c.type}, ${c.duration.toFixed(1)}s)`).join(', ');
      const { data, error } = await supabase.functions.invoke('ai-video-editor', {
        body: { clips: clipSummary, action: 'analyze' },
      });
      if (error) throw error;
      setAnalysis(data?.analysis || 'Analysis complete. Ready to generate highlight reel.');
      toast.success('Clips analyzed by AI!');
    } catch {
      // Fallback analysis
      setAnalysis(
        `Found ${clips.length} clips totaling ${clips.reduce((s, c) => s + c.duration, 0).toFixed(1)}s. ` +
        `Recommend selecting best ${Math.min(clips.length, 3)} clips for a 15–30s highlight reel. ` +
        `Apply a template below to auto-assemble your video.`
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleApplyTemplate = (templateId: string) => {
    setSelectedTemplate(templateId);
    onApplyTemplate?.(templateId);
    toast.success(`Template "${TEMPLATES.find(t => t.id === templateId)?.label}" applied!`);
  };

  return (
    <div className="h-full flex flex-col bg-slate-900 text-white">
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-4">
          {/* AI Analysis */}
          <div>
            <p className="text-xs text-slate-400 font-medium mb-2 uppercase tracking-wide">AI Auto-Editor</p>
            <Button
              size="sm"
              onClick={handleAnalyzeClips}
              disabled={isAnalyzing}
              className="w-full bg-amber-500 hover:bg-amber-400 text-black font-bold mb-2"
            >
              {isAnalyzing ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Analyzing Clips...</>
              ) : (
                <><Sparkles className="w-4 h-4 mr-2" />Analyze & Suggest Edits</>
              )}
            </Button>
            {analysis && (
              <div className="bg-slate-800 rounded-lg p-3 text-xs text-slate-300 border border-amber-400/30 leading-relaxed">
                {analysis}
              </div>
            )}
          </div>

          {/* Smart Templates */}
          <div>
            <p className="text-xs text-slate-400 font-medium mb-2 uppercase tracking-wide">Smart Templates</p>
            <div className="space-y-2">
              {TEMPLATES.map(t => (
                <button
                  key={t.id}
                  onClick={() => handleApplyTemplate(t.id)}
                  className={`w-full text-left p-2.5 rounded-lg border transition-all text-xs ${
                    selectedTemplate === t.id
                      ? 'border-amber-400 bg-amber-400/10 text-amber-300'
                      : 'border-slate-700 bg-slate-800 text-slate-200 hover:border-amber-400/50 hover:bg-slate-700'
                  }`}
                >
                  <div className="font-medium">{t.label}</div>
                  <div className="text-slate-400 mt-0.5">{t.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div>
            <p className="text-xs text-slate-400 font-medium mb-2 uppercase tracking-wide">Quick Actions</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: '✂️ Auto Cut', desc: 'Remove silence' },
                { label: '🎵 Add Music', desc: 'AI background' },
                { label: '📝 Add Captions', desc: 'Auto subtitle' },
                { label: '🎨 Color Grade', desc: 'Cinematic look' },
              ].map(a => (
                <button
                  key={a.label}
                  className="text-left p-2 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 hover:border-amber-400/50 text-xs transition-all"
                  onClick={() => toast.info(`${a.label} — switch to the relevant tool tab`)}
                >
                  <div className="font-medium text-slate-200">{a.label}</div>
                  <div className="text-slate-500">{a.desc}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
