import React, { useCallback, useEffect, useState } from 'react';
import {
  History, Loader2, Play, Trash2, RefreshCw, Film,
  Mic, Globe, Clock, ArrowRight, FolderOpen, Sparkles,
  Download, RotateCcw
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { VOICE_OPTIONS, SUPPORTED_LANGUAGES } from '../types';

// ─── Types ────────────────────────────────────────────────────────────────────

interface VideoAdClip {
  name: string;
  url: string;
  type: 'image' | 'video' | 'text';
  duration: number;
  textOverlay?: { content: string; style: 'lower-third' | 'bold' | 'clean' };
}

interface VideoAdVoiceover {
  audioBase64: string;
  duration: number;
  script: string;
}

interface SavedVideoAd {
  id: string;
  project_name: string;
  created_at: string;
  updated_at: string;
  thumbnail_url: string | null;
  project_data: {
    script: string;
    settings: {
      language: string;
      voiceId: string;
      tone: string;
      scriptDuration: number;
      format: string;
      transition: string;
      textStyle: string;
    };
    clips: VideoAdClip[];
    voiceover: VideoAdVoiceover;
    transitions: string;
    propertyName: string;
  };
}

interface VideoAdHistoryPanelProps {
  onRestoreToTimeline: (ad: {
    clips: VideoAdClip[];
    voiceover: VideoAdVoiceover;
    projectName: string;
    transitions: string;
  }) => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatRelativeTime = (iso: string): string => {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  const hrs  = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1)  return 'just now';
  if (mins < 60) return `${mins}m ago`;
  if (hrs  < 24) return `${hrs}h ago`;
  if (days < 7)  return `${days}d ago`;
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

const formatDuration = (sec: number): string =>
  `${Math.floor(sec / 60)}:${String(Math.floor(sec % 60)).padStart(2, '0')}`;

const getLangName = (code: string): string =>
  SUPPORTED_LANGUAGES.find(l => l.code === code)?.name ?? code;

const getVoiceName = (id: string): string =>
  VOICE_OPTIONS.find(v => v.id === id)?.name ?? 'Voice';

// ─── Component ────────────────────────────────────────────────────────────────

export function VideoAdHistoryPanel({ onRestoreToTimeline }: VideoAdHistoryPanelProps) {
  const [ads, setAds] = useState<SavedVideoAd[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [previewAudio, setPreviewAudio] = useState<HTMLAudioElement | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('ai_tool_projects')
        .select('id, project_name, created_at, updated_at, thumbnail_url, project_data')
        .eq('tool_type', 'video-ad')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setAds((data ?? []) as unknown as SavedVideoAd[]);
    } catch (err) {
      toast.error('Could not load video ad history');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => { previewAudio?.pause(); };
  }, [previewAudio]);

  // ── Delete ────────────────────────────────────────────────────────────────
  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const { error } = await supabase
        .from('ai_tool_projects')
        .delete()
        .eq('id', id)
        .eq('tool_type', 'video-ad');
      if (error) throw error;
      setAds(prev => prev.filter(a => a.id !== id));
      toast.success('Video ad deleted');
    } catch {
      toast.error('Failed to delete');
    } finally {
      setDeletingId(null);
    }
  };

  // ── Preview audio ─────────────────────────────────────────────────────────
  const togglePreviewAudio = (ad: SavedVideoAd) => {
    if (playingId === ad.id) {
      previewAudio?.pause();
      setPlayingId(null);
      return;
    }
    previewAudio?.pause();
    try {
      const byteStr = atob(ad.project_data.voiceover.audioBase64);
      const bytes = new Uint8Array(byteStr.length);
      for (let i = 0; i < byteStr.length; i++) bytes[i] = byteStr.charCodeAt(i);
      const blob = new Blob([bytes], { type: 'audio/mpeg' });
      const url  = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audio.onended = () => setPlayingId(null);
      audio.play();
      setPreviewAudio(audio);
      setPlayingId(ad.id);
    } catch {
      toast.error('Could not play preview');
    }
  };

  // ── Restore to Timeline ───────────────────────────────────────────────────
  const handleRestore = (ad: SavedVideoAd) => {
    onRestoreToTimeline({
      clips:       ad.project_data.clips,
      voiceover:   ad.project_data.voiceover,
      projectName: ad.project_data.propertyName ?? ad.project_name,
      transitions: ad.project_data.transitions,
    });
    toast.success(`🎬 "${ad.project_name}" restored to timeline!`);
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="h-full flex flex-col bg-slate-900 text-white overflow-hidden">
      {/* Header */}
      <div className="px-3 py-2.5 border-b border-slate-700 flex items-center gap-2">
        <History className="w-4 h-4 text-amber-400 shrink-0" />
        <span className="text-xs font-bold text-amber-400 uppercase tracking-wide flex-1">
          Video Ad History
        </span>
        <button
          onClick={fetchHistory}
          className="text-slate-500 hover:text-slate-300 transition-colors"
          title="Refresh"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Body */}
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-2.5">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-40 gap-2">
              <Loader2 className="w-5 h-5 animate-spin text-amber-400" />
              <p className="text-xs text-slate-500">Loading history…</p>
            </div>
          ) : ads.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 gap-3 text-center">
              <FolderOpen className="w-9 h-9 text-slate-600" />
              <div>
                <p className="text-xs font-semibold text-slate-400">No saved video ads yet</p>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  Generate a video ad from the Projects panel — it will be saved here automatically
                </p>
              </div>
            </div>
          ) : (
            ads.map(ad => (
              <div
                key={ad.id}
                className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden hover:border-amber-400/30 transition-all group"
              >
                {/* Thumbnail + overlay */}
                <div className="relative aspect-video bg-slate-700 overflow-hidden">
                  {ad.thumbnail_url ? (
                    <img
                      src={ad.thumbnail_url}
                      alt={ad.project_name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-1">
                      <Film className="w-7 h-7 text-slate-600" />
                      <span className="text-[10px] text-slate-500">No thumbnail</span>
                    </div>
                  )}

                  {/* Play voiceover button */}
                  <button
                    onClick={() => togglePreviewAudio(ad)}
                    className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-black/70 flex items-center justify-center text-white hover:bg-amber-500 hover:text-black transition-all"
                    title="Preview voiceover"
                  >
                    {playingId === ad.id
                      ? <span className="w-3 h-3 border-2 border-current rounded-sm" />
                      : <Play className="w-3 h-3 ml-0.5" />
                    }
                  </button>

                  {/* Duration badge */}
                  <div className="absolute bottom-1.5 left-1.5 bg-black/70 text-white text-[9px] px-1.5 py-0.5 rounded font-mono">
                    {formatDuration(ad.project_data.voiceover?.duration ?? ad.project_data.settings?.scriptDuration ?? 60)}
                  </div>
                </div>

                {/* Info */}
                <div className="px-2.5 py-2 space-y-1.5">
                  <div className="flex items-start justify-between gap-1">
                    <p className="text-xs font-semibold text-white leading-tight line-clamp-1">{ad.project_name}</p>
                    <span className="text-[9px] text-slate-500 flex items-center gap-0.5 shrink-0">
                      <Clock className="w-2.5 h-2.5" />
                      {formatRelativeTime(ad.created_at)}
                    </span>
                  </div>

                  {/* Badges */}
                  <div className="flex flex-wrap gap-1">
                    <span className="flex items-center gap-0.5 text-[9px] text-slate-400 bg-slate-700 px-1.5 py-0.5 rounded-full">
                      <Globe className="w-2.5 h-2.5" />
                      {getLangName(ad.project_data.settings?.language ?? 'en')}
                    </span>
                    <span className="flex items-center gap-0.5 text-[9px] text-slate-400 bg-slate-700 px-1.5 py-0.5 rounded-full">
                      <Mic className="w-2.5 h-2.5" />
                      {getVoiceName(ad.project_data.settings?.voiceId ?? '')}
                    </span>
                    {ad.project_data.settings?.tone && (
                      <span className="text-[9px] text-amber-400/80 bg-amber-400/10 px-1.5 py-0.5 rounded-full capitalize">
                        {ad.project_data.settings.tone}
                      </span>
                    )}
                    {ad.project_data.settings?.format && (
                      <span className="text-[9px] text-slate-400 bg-slate-700 px-1.5 py-0.5 rounded-full uppercase">
                        {ad.project_data.settings.format === 'reels' ? '9:16'
                          : ad.project_data.settings.format === 'youtube' ? '16:9' : '1:1'}
                      </span>
                    )}
                    <span className="text-[9px] text-slate-400 bg-slate-700 px-1.5 py-0.5 rounded-full">
                      {(ad.project_data.clips ?? []).filter(c => c.type === 'image').length} photos
                    </span>
                  </div>

                  {/* Script preview */}
                  {ad.project_data.script && (
                    <p className="text-[10px] text-slate-400 line-clamp-2 leading-relaxed italic border-l-2 border-amber-400/30 pl-2">
                      "{ad.project_data.script.slice(0, 100)}{ad.project_data.script.length > 100 ? '…' : ''}"
                    </p>
                  )}

                  {/* Actions */}
                  <div className="flex gap-1.5 pt-0.5">
                    <button
                      onClick={() => handleRestore(ad)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md bg-amber-500 text-black text-xs font-bold hover:bg-amber-400 transition-all"
                    >
                      <RotateCcw className="w-3 h-3" />
                      Restore to Timeline
                    </button>
                    <button
                      onClick={() => handleDelete(ad.id)}
                      disabled={deletingId === ad.id}
                      className="w-8 h-8 flex items-center justify-center rounded-md border border-slate-600 text-slate-400 hover:text-red-400 hover:border-red-400/50 transition-all disabled:opacity-40"
                      title="Delete"
                    >
                      {deletingId === ad.id
                        ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        : <Trash2 className="w-3.5 h-3.5" />
                      }
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      {/* Footer */}
      {ads.length > 0 && (
        <div className="px-3 py-1.5 border-t border-slate-700">
          <p className="text-[10px] text-slate-500">
            {ads.length} saved ad{ads.length !== 1 ? 's' : ''} — click <span className="text-amber-400">Restore</span> to load into timeline
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Save helper (exported for use in ProjectIntegrationPanel) ────────────────

export async function saveVideoAdToHistory(opts: {
  projectName: string;
  thumbnailUrl: string | null;
  script: string;
  settings: {
    language: string;
    voiceId: string;
    tone: string;
    scriptDuration: number;
    format: string;
    transition: string;
    textStyle: string;
  };
  clips: VideoAdClip[];
  voiceover: VideoAdVoiceover;
  transitions: string;
  propertyName: string;
}): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return; // silently skip if not authenticated

    await supabase.from('ai_tool_projects').insert([{
      user_id: user.id,
      project_name: opts.projectName,
      tool_type: 'video-ad',
      thumbnail_url: opts.thumbnailUrl,
      project_data: JSON.parse(JSON.stringify({
        script:       opts.script,
        settings:     opts.settings,
        clips:        opts.clips,
        voiceover:    opts.voiceover,
        transitions:  opts.transitions,
        propertyName: opts.propertyName,
      })),
      is_shared: false,
    }]);
  } catch (err) {
    console.warn('[VideoAdHistory] Failed to save:', err);
  }
}
