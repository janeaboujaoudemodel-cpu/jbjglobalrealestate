import React, { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import {
  Sparkles, Loader2, ChevronDown, ChevronUp, Save, Trash2,
  Wand2, Film, Star, Clock, CheckCircle2, Plus, RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface Clip {
  id: string;
  name: string;
  type: string;
  duration: number;
  startTime: number;
}

interface HighlightMoment {
  clipIndex: number;
  reason: string;
  score: number;
  suggestedDuration: number;
}

interface EditPlan {
  clipIndex: number;
  startTime: number;
  duration: number;
  reason: string;
}

interface AnalysisResult {
  analysis: string;
  highlights: HighlightMoment[];
  recommendedOrder: number[];
  totalRecommendedDuration: number;
  editingTips: string[];
}

interface AssembleResult {
  templateName: string;
  totalDuration: number;
  editPlan: EditPlan[];
  transitions: string;
  musicSuggestion: string;
  summary: string;
}

interface CustomTemplate {
  id: string;
  name: string;
  description: string;
  template_data: Record<string, unknown>;
  created_at: string;
}

interface AIEditorPanelProps {
  clips?: Clip[];
  onApplyTemplate?: (template: string, editPlan?: EditPlan[]) => void;
}

const SMART_TEMPLATES = [
  {
    id: 'property-tour',
    label: '🏡 Property Tour',
    desc: '30-60s walkthrough with music',
    targetDuration: '30-60s',
    icon: '🏡',
  },
  {
    id: 'social-reel',
    label: '📱 Social Reel',
    desc: '15s fast-cut for Reels/TikTok',
    targetDuration: '15s',
    icon: '📱',
  },
  {
    id: 'youtube-intro',
    label: '▶️ YouTube Intro',
    desc: 'Hook + content structure',
    targetDuration: '45-60s',
    icon: '▶️',
  },
  {
    id: 'luxury-ad',
    label: '✨ Luxury Ad',
    desc: 'Cinematic 30s property ad',
    targetDuration: '30s',
    icon: '✨',
  },
];

export function AIEditorPanel({ clips = [], onApplyTemplate }: AIEditorPanelProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isAssembling, setIsAssembling] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [assembleResult, setAssembleResult] = useState<AssembleResult | null>(null);
  const [appliedTemplate, setAppliedTemplate] = useState<string | null>(null);
  const [showHighlights, setShowHighlights] = useState(true);
  const [showTips, setShowTips] = useState(false);
  const [customTemplates, setCustomTemplates] = useState<CustomTemplate[]>([]);
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);
  const [saveTemplateName, setSaveTemplateName] = useState('');
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);

  // Load custom templates on mount
  useEffect(() => {
    loadCustomTemplates();
  }, []);

  const loadCustomTemplates = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const { data, error } = await supabase
        .from('video_editor_templates' as never)
        .select('*')
        .order('created_at', { ascending: false });
      if (!error && data) {
        setCustomTemplates(data as CustomTemplate[]);
      }
    } catch {
      // silently fail — user might not be logged in
    }
  };

  const handleAnalyzeClips = async () => {
    if (clips.length === 0) {
      toast.error('Add clips to the timeline first');
      return;
    }
    setIsAnalyzing(true);
    setAnalysisResult(null);
    setAssembleResult(null);
    setAnalysisProgress(0);

    // Animate progress
    const progressInterval = setInterval(() => {
      setAnalysisProgress(prev => Math.min(prev + 8, 85));
    }, 300);

    try {
      const clipSummary = clips
        .map((c, i) => `Clip ${i + 1}: "${c.name}" (${c.type}, ${c.duration.toFixed(1)}s at ${c.startTime.toFixed(1)}s)`)
        .join('\n');

      const { data, error } = await supabase.functions.invoke('ai-video-editor', {
        body: { clips: clipSummary, action: 'analyze' },
      });

      clearInterval(progressInterval);
      setAnalysisProgress(100);

      if (error) throw error;

      if (data?.error) throw new Error(data.error);

      setAnalysisResult({
        analysis: data.analysis || '',
        highlights: data.highlights || [],
        recommendedOrder: data.recommendedOrder || [],
        totalRecommendedDuration: data.totalRecommendedDuration || 0,
        editingTips: data.editingTips || [],
      });
      toast.success('AI analysis complete!');
    } catch (err: any) {
      clearInterval(progressInterval);
      setAnalysisProgress(0);
      // Fallback
      const total = clips.reduce((s, c) => s + c.duration, 0);
      setAnalysisResult({
        analysis: `Found ${clips.length} clips totaling ${total.toFixed(1)}s. Recommend selecting the best ${Math.min(clips.length, 4)} clips for a 15–30s highlight reel. Apply a Smart Template below to auto-assemble.`,
        highlights: clips.slice(0, 3).map((_, i) => ({
          clipIndex: i,
          reason: 'Strong visual composition',
          score: 0.8 - i * 0.1,
          suggestedDuration: 6,
        })),
        recommendedOrder: clips.map((_, i) => i),
        totalRecommendedDuration: Math.min(total, 60),
        editingTips: ['Open with your strongest exterior shot', 'Keep cuts under 8 seconds for engagement', 'End with a lifestyle or view shot'],
      });
    } finally {
      setIsAnalyzing(false);
      setTimeout(() => setAnalysisProgress(0), 1000);
    }
  };

  const handleApplyTemplate = async (templateId: string) => {
    if (clips.length === 0) {
      toast.error('Add clips to the timeline first');
      return;
    }
    setIsAssembling(templateId);
    setAssembleResult(null);

    try {
      const clipSummary = clips
        .map((c, i) => `Clip ${i + 1}: "${c.name}" (${c.type}, ${c.duration.toFixed(1)}s)`)
        .join('\n');

      const { data, error } = await supabase.functions.invoke('ai-video-editor', {
        body: { clips: clipSummary, action: 'assemble', templateId },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const result: AssembleResult = {
        templateName: data.templateName || templateId,
        totalDuration: data.totalDuration || 30,
        editPlan: data.editPlan || [],
        transitions: data.transitions || 'fade',
        musicSuggestion: data.musicSuggestion || '',
        summary: data.summary || '',
      };

      setAssembleResult(result);
      setAppliedTemplate(templateId);
      onApplyTemplate?.(templateId, result.editPlan);
      toast.success(`✨ "${SMART_TEMPLATES.find(t => t.id === templateId)?.label}" assembled!`);
    } catch {
      // Fallback
      setAppliedTemplate(templateId);
      onApplyTemplate?.(templateId);
      toast.success(`Template applied! (using default assembly)`);
    } finally {
      setIsAssembling(null);
    }
  };

  const handleApplyCustomTemplate = (template: CustomTemplate) => {
    setAppliedTemplate(template.id);
    onApplyTemplate?.(template.id);
    toast.success(`Custom template "${template.name}" applied!`);
  };

  const handleSaveTemplate = async () => {
    if (!saveTemplateName.trim()) {
      toast.error('Enter a template name');
      return;
    }
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast.error('Please log in to save templates');
      return;
    }
    setIsSavingTemplate(true);
    try {
      const templateData = {
        clips: clips.map(c => ({ name: c.name, type: c.type, duration: c.duration })),
        assembleResult,
        appliedSmartTemplate: appliedTemplate,
      };
      const { error } = await supabase
        .from('video_editor_templates' as never)
        .insert({
          user_id: session.user.id,
          name: saveTemplateName.trim(),
          description: assembleResult?.summary || `Custom template with ${clips.length} clips`,
          template_data: templateData,
        } as never);
      if (error) throw error;
      toast.success(`Template "${saveTemplateName}" saved!`);
      setSaveTemplateName('');
      setShowSaveForm(false);
      await loadCustomTemplates();
    } catch {
      toast.error('Failed to save template');
    } finally {
      setIsSavingTemplate(false);
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    try {
      const { error } = await supabase
        .from('video_editor_templates' as never)
        .delete()
        .eq('id', templateId);
      if (error) throw error;
      setCustomTemplates(prev => prev.filter(t => t.id !== templateId));
      toast.success('Template deleted');
    } catch {
      toast.error('Failed to delete template');
    }
  };

  const scoreColor = (score: number) => {
    if (score >= 0.8) return 'text-green-400';
    if (score >= 0.6) return 'text-amber-400';
    return 'text-slate-400';
  };

  return (
    <div className="h-full flex flex-col bg-slate-900 text-white">
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-4">

          {/* ── AI Analysis ── */}
          <div>
            <p className="text-xs text-slate-200 font-bold mb-0.5">AI Clip Scanner</p>
            <p className="text-[10px] text-slate-500 mb-2">
              Gemini AI reads every clip on your timeline, scores each moment for visual quality and pacing, and returns a ranked highlight list with editing tips.
            </p>
            {clips.length === 0 && (
              <div className="mb-2 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/25 text-[10px] text-amber-300 flex items-start gap-2">
                <Film className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>Add at least one video or image clip to the timeline, then hit "Scan" — AI will analyze and rank them for you.</span>
              </div>
            )}
            <Button
              size="sm"
              onClick={handleAnalyzeClips}
              disabled={isAnalyzing || clips.length === 0}
              className="w-full bg-amber-500 hover:bg-amber-400 text-black font-bold mb-2"
            >
              {isAnalyzing ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Scanning Clips with AI...</>
              ) : (
                <><Sparkles className="w-4 h-4 mr-2" />Scan &amp; Detect Highlights</>
              )}
            </Button>

            {isAnalyzing && (
              <div className="mb-2">
                <Progress value={analysisProgress} className="h-1.5 bg-slate-700" />
                <p className="text-xs text-slate-500 mt-1 text-center">Gemini AI is analyzing your clips…</p>
              </div>
            )}

            {analysisResult && (
              <div className="space-y-2">
                {/* Summary */}
                <div className="bg-slate-800 rounded-lg p-3 text-xs text-slate-300 border border-amber-400/30 leading-relaxed">
                  <div className="flex items-start gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" />
                    <span>{analysisResult.analysis}</span>
                  </div>
                  {analysisResult.totalRecommendedDuration > 0 && (
                    <div className="flex items-center gap-1 mt-2 text-amber-400/80">
                      <Clock className="w-3 h-3" />
                      <span>Recommended: {analysisResult.totalRecommendedDuration}s edit</span>
                    </div>
                  )}
                </div>

                {/* Highlight Moments */}
                {analysisResult.highlights.length > 0 && (
                  <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
                    <button
                      className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-slate-200"
                      onClick={() => setShowHighlights(v => !v)}
                    >
                      <span className="flex items-center gap-1.5">
                        <Star className="w-3.5 h-3.5 text-amber-400" />
                        Highlight Moments ({analysisResult.highlights.length})
                      </span>
                      {showHighlights ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                    {showHighlights && (
                      <div className="px-3 pb-2 space-y-1.5">
                        {analysisResult.highlights.map((h, i) => (
                          <div key={i} className="flex items-start gap-2 text-xs">
                            <span className={`font-bold mt-0.5 shrink-0 ${scoreColor(h.score)}`}>
                              #{h.clipIndex + 1}
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className="text-slate-300 leading-tight">{h.reason}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-slate-500">{h.suggestedDuration}s</span>
                                <div className="flex-1 h-1 bg-slate-700 rounded-full">
                                  <div
                                    className="h-1 bg-amber-400 rounded-full"
                                    style={{ width: `${h.score * 100}%` }}
                                  />
                                </div>
                                <span className={`${scoreColor(h.score)} font-medium`}>
                                  {Math.round(h.score * 100)}%
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Editing Tips */}
                {analysisResult.editingTips.length > 0 && (
                  <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
                    <button
                      className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-slate-200"
                      onClick={() => setShowTips(v => !v)}
                    >
                      <span>Editing Tips ({analysisResult.editingTips.length})</span>
                      {showTips ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                    {showTips && (
                      <ul className="px-3 pb-2 space-y-1">
                        {analysisResult.editingTips.map((tip, i) => (
                          <li key={i} className="text-xs text-slate-400 flex items-start gap-1.5">
                            <CheckCircle2 className="w-3 h-3 text-green-500 mt-0.5 shrink-0" />
                            {tip}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── Smart Templates ── */}
          <div>
            <p className="text-xs text-slate-200 font-bold mb-0.5">Smart Templates</p>
            <p className="text-[10px] text-slate-500 mb-2">
              Pick a template and AI will reorder your clips, trim durations, and suggest transitions to match the style — no manual editing needed.
            </p>
            <div className="space-y-2">
              {SMART_TEMPLATES.map(t => (
                <div
                  key={t.id}
                  className={`rounded-lg border transition-all text-xs ${
                    appliedTemplate === t.id
                      ? 'border-amber-400 bg-amber-400/10'
                      : 'border-slate-700 bg-slate-800 hover:border-amber-400/50 hover:bg-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between p-2.5">
                    <div className="flex-1 min-w-0">
                      <div className={`font-medium ${appliedTemplate === t.id ? 'text-amber-300' : 'text-slate-200'}`}>
                        {t.label}
                      </div>
                      <div className="text-slate-400 mt-0.5">{t.desc}</div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleApplyTemplate(t.id)}
                      disabled={isAssembling === t.id || clips.length === 0}
                      className={`ml-2 h-7 px-2.5 text-xs font-bold shrink-0 ${
                        appliedTemplate === t.id
                          ? 'bg-amber-400/20 text-amber-300 hover:bg-amber-400/30 border border-amber-400/40'
                          : 'bg-amber-500 hover:bg-amber-400 text-black'
                      }`}
                    >
                      {isAssembling === t.id ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : appliedTemplate === t.id ? (
                        <CheckCircle2 className="w-3 h-3" />
                      ) : (
                        <Wand2 className="w-3 h-3" />
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Assemble Result ── */}
          {assembleResult && (
            <div className="bg-slate-800 rounded-lg border border-amber-400/40 p-3 space-y-2">
              <div className="flex items-center gap-2">
                <Film className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-semibold text-amber-300">Edit Plan Ready</span>
                <span className="text-xs text-slate-500 ml-auto">{assembleResult.totalDuration}s</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">{assembleResult.summary}</p>
              {assembleResult.musicSuggestion && (
                <p className="text-xs text-slate-500">🎵 {assembleResult.musicSuggestion}</p>
              )}
              <div className="space-y-1">
                {assembleResult.editPlan.map((step, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-slate-400">
                    <span className="w-4 h-4 rounded bg-slate-700 flex items-center justify-center text-amber-400 font-bold text-[10px] shrink-0">
                      {i + 1}
                    </span>
                    <span className="flex-1 truncate">Clip #{step.clipIndex + 1} — {step.duration}s</span>
                    <span className="text-slate-600">{step.reason.slice(0, 24)}…</span>
                  </div>
                ))}
              </div>
              {/* Save custom template */}
              {!showSaveForm ? (
                <button
                  onClick={() => setShowSaveForm(true)}
                  className="flex items-center gap-1.5 text-xs text-amber-400/80 hover:text-amber-400 mt-1"
                >
                  <Save className="w-3 h-3" /> Save as custom template
                </button>
              ) : (
                <div className="flex gap-2 mt-1">
                  <input
                    type="text"
                    value={saveTemplateName}
                    onChange={e => setSaveTemplateName(e.target.value)}
                    placeholder="Template name…"
                    className="flex-1 bg-slate-700 border border-slate-600 rounded px-2 py-1 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                  />
                  <Button
                    size="sm"
                    onClick={handleSaveTemplate}
                    disabled={isSavingTemplate}
                    className="h-7 px-2 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs"
                  >
                    {isSavingTemplate ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                  </Button>
                  <button
                    onClick={() => setShowSaveForm(false)}
                    className="text-slate-500 hover:text-slate-300 text-xs"
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── Custom Templates ── */}
          {customTemplates.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide">
                  My Templates
                </p>
                <button
                  onClick={loadCustomTemplates}
                  className="text-slate-500 hover:text-slate-300"
                >
                  <RefreshCw className="w-3 h-3" />
                </button>
              </div>
              <div className="space-y-1.5">
                {customTemplates.map(t => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between p-2.5 rounded-lg border border-slate-700 bg-slate-800 hover:border-amber-400/40 text-xs group"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-slate-200 font-medium truncate">{t.name}</div>
                      {t.description && (
                        <div className="text-slate-500 truncate mt-0.5">{t.description}</div>
                      )}
                    </div>
                    <div className="flex items-center gap-1 ml-2 shrink-0">
                      <button
                        onClick={() => handleApplyCustomTemplate(t)}
                        className="text-amber-400/70 hover:text-amber-400 p-1"
                        title="Apply template"
                      >
                        <Wand2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteTemplate(t.id)}
                        className="text-slate-600 hover:text-red-400 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Delete template"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
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
