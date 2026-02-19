import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  RefreshCw, Trash2, RotateCcw, Film, Loader2,
  Globe, Mic, Clock, FolderOpen, Play, Pause,
  Sparkles, CheckCircle2, AlertCircle, Timer, Grid3X3,
  Download, ChevronDown, ChevronUp, Copy, CheckCheck,
  FileText, Settings, X, ArrowDownToLine
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
    status?: 'completed' | 'draft' | 'processing';
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

export interface VideoAdHistoryPanelProps {
  onRestoreToTimeline: (ad: {
    clips: VideoAdClip[];
    voiceover: VideoAdVoiceover;
    projectName: string;
    transitions: string;
  }) => void;
  onRegenerateAd?: (ad: SavedVideoAd) => void;
  onLoadAndExport?: (ad: {
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

const formatDate = (iso: string): string =>
  new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

const formatDuration = (sec: number): string =>
  `${Math.floor(sec / 60)}:${String(Math.floor(sec % 60)).padStart(2, '0')}`;

const getLangName = (code: string): string =>
  SUPPORTED_LANGUAGES.find(l => l.code === code)?.name ?? code;

const getVoiceName = (id: string): string =>
  VOICE_OPTIONS.find(v => v.id === id)?.name ?? 'Voice';

const getFormatLabel = (format: string): string => {
  if (format === 'reels') return '9:16';
  if (format === 'youtube') return '16:9';
  if (format === 'square') return '1:1';
  return format?.toUpperCase() ?? '—';
};

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status?: string }) {
  if (!status || status === 'completed') {
    return (
      <div className="flex items-center gap-0.5 bg-emerald-500/20 text-emerald-400 text-[9px] px-1.5 py-0.5 rounded-full font-semibold">
        <CheckCircle2 className="w-2.5 h-2.5" />
        Ready
      </div>
    );
  }
  if (status === 'processing') {
    return (
      <div className="flex items-center gap-0.5 bg-amber-500/20 text-amber-400 text-[9px] px-1.5 py-0.5 rounded-full font-semibold">
        <Timer className="w-2.5 h-2.5 animate-pulse" />
        Processing
      </div>
    );
  }
  return (
    <div className="flex items-center gap-0.5 bg-slate-600/50 text-slate-400 text-[9px] px-1.5 py-0.5 rounded-full font-semibold">
      <AlertCircle className="w-2.5 h-2.5" />
      Draft
    </div>
  );
}

// ─── Detail Drawer ────────────────────────────────────────────────────────────

interface DetailDrawerProps {
  ad: SavedVideoAd;
  isPlaying: boolean;
  onPlay: () => void;
  onClose: () => void;
  onRestore: () => void;
  onLoadAndExport: () => void;
  onDelete: () => void;
  isDeleting: boolean;
}

function DetailDrawer({ ad, isPlaying, onPlay, onClose, onRestore, onLoadAndExport, onDelete, isDeleting }: DetailDrawerProps) {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'script' | 'settings' | 'clips'>('script');

  const copyScript = () => {
    navigator.clipboard.writeText(ad.project_data.script ?? '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const s: Partial<SavedVideoAd['project_data']['settings']> = ad.project_data.settings ?? {};
  const photoClips = (ad.project_data.clips ?? []).filter(c => c.type === 'image');
  const dur = ad.project_data.voiceover?.duration ?? s.scriptDuration ?? 60;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-t-2xl shadow-2xl overflow-hidden"
        style={{ maxHeight: '85vh' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Drawer handle + header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
          <div className="flex items-center gap-2">
            <StatusBadge status={ad.project_data.status} />
            <p className="text-sm font-bold text-white truncate max-w-[200px]">{ad.project_name}</p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Thumbnail strip */}
        <div className="relative h-32 bg-slate-950 overflow-hidden">
          {ad.thumbnail_url ? (
            <img src={ad.thumbnail_url} alt={ad.project_name} className="w-full h-full object-cover opacity-60" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Film className="w-10 h-10 text-slate-700" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />
          {/* Meta pills over image */}
          <div className="absolute bottom-2 left-3 flex gap-1.5 flex-wrap">
            <span className="bg-black/70 text-white text-[10px] px-2 py-0.5 rounded-full font-mono">{formatDuration(dur)}</span>
            {s.format && <span className="bg-amber-500/80 text-black text-[10px] px-2 py-0.5 rounded-full font-bold">{getFormatLabel(s.format)}</span>}
            <span className="bg-black/70 text-slate-300 text-[10px] px-2 py-0.5 rounded-full">{getLangName(s.language ?? 'en')}</span>
            <span className="bg-black/70 text-slate-300 text-[10px] px-2 py-0.5 rounded-full">{getVoiceName(s.voiceId ?? '')}</span>
          </div>
          {/* Voiceover play */}
          <button
            onClick={onPlay}
            className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/70 border border-white/20 flex items-center justify-center text-white hover:bg-amber-500/80 transition-all"
          >
            {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3 ml-0.5" />}
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-700 px-4">
          {(['script', 'settings', 'clips'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex items-center gap-1 px-3 py-2.5 text-xs font-semibold border-b-2 -mb-px transition-colors capitalize ${
                activeTab === tab
                  ? 'border-amber-400 text-amber-300'
                  : 'border-transparent text-slate-500 hover:text-slate-300'
              }`}
            >
              {tab === 'script' && <FileText className="w-3 h-3" />}
              {tab === 'settings' && <Settings className="w-3 h-3" />}
              {tab === 'clips' && <Film className="w-3 h-3" />}
              {tab}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <ScrollArea style={{ height: 'clamp(140px, 30vh, 280px)' }}>
          <div className="p-4">
            {activeTab === 'script' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wide">Generated Script</span>
                  <button onClick={copyScript} className="flex items-center gap-1 text-[10px] text-slate-500 hover:text-amber-300 transition-colors">
                    {copied ? <CheckCheck className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                {ad.project_data.script ? (
                  <p className="text-[11px] text-slate-300 leading-relaxed whitespace-pre-wrap bg-slate-800 rounded-lg p-3 border border-slate-700">
                    {ad.project_data.script}
                  </p>
                ) : (
                  <p className="text-[11px] text-slate-500 italic">No script saved.</p>
                )}
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="space-y-2">
                {[
                  { label: 'Property', value: ad.project_data.propertyName ?? '—' },
                  { label: 'Language', value: getLangName(s.language ?? 'en') },
                  { label: 'Voice', value: getVoiceName(s.voiceId ?? '') },
                  { label: 'Tone', value: s.tone ? (s.tone.charAt(0).toUpperCase() + s.tone.slice(1)) : '—' },
                  { label: 'Duration', value: `${s.scriptDuration ?? dur}s` },
                  { label: 'Format', value: getFormatLabel(s.format ?? '') },
                  { label: 'Transition', value: s.transition ?? '—' },
                  { label: 'Text Style', value: s.textStyle ?? '—' },
                  { label: 'Generated', value: formatDate(ad.created_at) },
                  { label: 'Last Updated', value: formatRelativeTime(ad.updated_at) },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between py-1.5 border-b border-slate-800">
                    <span className="text-[10px] text-slate-500">{label}</span>
                    <span className="text-[11px] text-white font-medium">{value}</span>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'clips' && (
              <div className="space-y-1.5">
                <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-2">
                  Timeline Snapshot · {(ad.project_data.clips ?? []).length} clips
                </p>
                {(ad.project_data.clips ?? []).length === 0 ? (
                  <p className="text-[11px] text-slate-500 italic">No clips saved in snapshot.</p>
                ) : (
                  (ad.project_data.clips ?? []).map((clip, i) => (
                    <div key={i} className="flex items-center gap-2 bg-slate-800 rounded-md px-2.5 py-2 border border-slate-700">
                      <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                        clip.type === 'image' ? 'bg-blue-400' : clip.type === 'text' ? 'bg-emerald-400' : 'bg-amber-400'
                      }`} />
                      <span className="text-[10px] text-slate-300 flex-1 truncate">{clip.name}</span>
                      <span className="text-[9px] text-slate-500 shrink-0">{clip.type}</span>
                      <span className="text-[9px] text-slate-500 shrink-0 font-mono">{clip.duration.toFixed(1)}s</span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Action buttons */}
        <div className="p-4 border-t border-slate-700 grid grid-cols-2 gap-2">
          <button
            onClick={() => { onRestore(); onClose(); }}
            className="flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-slate-700 border border-slate-600 text-white text-xs font-semibold hover:bg-slate-600 transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Load to Timeline
          </button>
          <button
            onClick={() => { onLoadAndExport(); onClose(); }}
            className="flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-400 text-black text-xs font-bold hover:from-amber-400 hover:to-amber-300 transition-all shadow-lg shadow-amber-500/20"
          >
            <ArrowDownToLine className="w-3.5 h-3.5" />
            Load & Export
          </button>
          <button
            onClick={() => { onDelete(); onClose(); }}
            disabled={isDeleting}
            className="col-span-2 flex items-center justify-center gap-1.5 py-1.5 rounded-lg border border-slate-700 text-slate-500 text-xs hover:text-red-400 hover:border-red-400/40 transition-all disabled:opacity-40"
          >
            {isDeleting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
            Delete Ad
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Grid Card ────────────────────────────────────────────────────────────────

interface GridCardProps {
  ad: SavedVideoAd;
  isPlaying: boolean;
  isDeleting: boolean;
  isRegenerating: boolean;
  onPlay: () => void;
  onOpenDetail: () => void;
  onRegenerate: () => void;
  onDelete: () => void;
}

function GridCard({
  ad, isPlaying, isDeleting, isRegenerating,
  onPlay, onOpenDetail, onRegenerate, onDelete,
}: GridCardProps) {
  const [hovered, setHovered] = useState(false);
  const photoCount = (ad.project_data.clips ?? []).filter(c => c.type === 'image').length;
  const dur = ad.project_data.voiceover?.duration ?? ad.project_data.settings?.scriptDuration ?? 60;

  return (
    <div
      className={`relative rounded-lg border overflow-hidden transition-all duration-200 group cursor-pointer
        ${hovered ? 'border-amber-400/50 shadow-lg shadow-amber-400/10' : 'border-slate-700'}
        bg-slate-800`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onOpenDetail}
    >
      {/* Thumbnail */}
      <div className="relative aspect-video bg-slate-900 overflow-hidden">
        {ad.thumbnail_url ? (
          <img
            src={ad.thumbnail_url}
            alt={ad.project_name}
            className={`w-full h-full object-cover transition-transform duration-300 ${hovered ? 'scale-105' : 'scale-100'}`}
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-1 bg-gradient-to-br from-slate-800 to-slate-900">
            <Film className="w-8 h-8 text-slate-600" />
            <span className="text-[9px] text-slate-600 font-medium">No thumbnail</span>
          </div>
        )}

        {/* Hover overlay: click to open detail */}
        <div className={`absolute inset-0 bg-black/50 flex items-center justify-center transition-opacity duration-200 ${hovered ? 'opacity-100' : 'opacity-0'}`}>
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg px-2.5 py-1.5 text-white text-[10px] font-semibold flex items-center gap-1">
            <FileText className="w-3 h-3" />
            View Details
          </div>
        </div>

        {/* Play voiceover (stop propagation) */}
        <button
          onClick={(e) => { e.stopPropagation(); onPlay(); }}
          className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/70 flex items-center justify-center text-white hover:bg-amber-500 hover:text-black transition-all opacity-0 group-hover:opacity-100"
          title="Preview voiceover"
        >
          {isPlaying ? <Pause className="w-2.5 h-2.5" /> : <Play className="w-2.5 h-2.5 ml-0.5" />}
        </button>

        {/* Duration pill */}
        <div className="absolute bottom-1 left-1 bg-black/80 text-white text-[9px] px-1.5 py-0.5 rounded font-mono">
          {formatDuration(dur)}
        </div>

        {/* Format pill */}
        {ad.project_data.settings?.format && (
          <div className="absolute bottom-1 right-1 bg-black/80 text-amber-300 text-[9px] px-1.5 py-0.5 rounded font-bold uppercase">
            {getFormatLabel(ad.project_data.settings.format)}
          </div>
        )}
      </div>

      {/* Card info */}
      <div className="p-2 space-y-1.5">
        {/* Title + status */}
        <div className="flex items-start gap-1 justify-between">
          <p className="text-[11px] font-semibold text-white leading-tight line-clamp-1 flex-1">
            {ad.project_name}
          </p>
          <StatusBadge status={ad.project_data.status} />
        </div>

        {/* Meta */}
        <div className="flex flex-wrap gap-1">
          <span className="flex items-center gap-0.5 text-[9px] text-slate-400 bg-slate-700/70 px-1 py-0.5 rounded-full">
            <Globe className="w-2 h-2" />
            {getLangName(ad.project_data.settings?.language ?? 'en')}
          </span>
          {ad.project_data.settings?.tone && (
            <span className="text-[9px] text-amber-400/80 bg-amber-400/10 px-1 py-0.5 rounded-full capitalize">
              {ad.project_data.settings.tone}
            </span>
          )}
        </div>

        {/* Date + photo count */}
        <div className="flex items-center justify-between text-[9px] text-slate-500">
          <span className="flex items-center gap-0.5">
            <Clock className="w-2 h-2" />
            {formatDate(ad.created_at)}
          </span>
          <span>{photoCount} photo{photoCount !== 1 ? 's' : ''}</span>
        </div>

        {/* Action buttons */}
        <div className="flex gap-1 pt-0.5">
          {/* Regenerate */}
          <button
            onClick={(e) => { e.stopPropagation(); onRegenerate(); }}
            disabled={isRegenerating}
            className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-md bg-amber-500/90 text-black text-[10px] font-bold hover:bg-amber-400 transition-all disabled:opacity-50"
            title="Regenerate this ad"
          >
            {isRegenerating
              ? <Loader2 className="w-3 h-3 animate-spin" />
              : <Sparkles className="w-3 h-3" />
            }
            Regenerate
          </button>
          {/* Delete */}
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            disabled={isDeleting}
            className="w-7 h-7 flex items-center justify-center rounded-md border border-slate-600 text-slate-500 hover:text-red-400 hover:border-red-400/50 transition-all disabled:opacity-40"
            title="Delete"
          >
            {isDeleting
              ? <Loader2 className="w-3 h-3 animate-spin" />
              : <Trash2 className="w-3 h-3" />
            }
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Panel ───────────────────────────────────────────────────────────────

export function VideoAdHistoryPanel({ onRestoreToTimeline, onRegenerateAd, onLoadAndExport }: VideoAdHistoryPanelProps) {
  const [ads, setAds] = useState<SavedVideoAd[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);
  const [detailAd, setDetailAd] = useState<SavedVideoAd | null>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);

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
    } catch {
      toast.error('Could not load video ad history');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);
  useEffect(() => () => { previewAudioRef.current?.pause(); }, []);

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
      previewAudioRef.current?.pause();
      setPlayingId(null);
      return;
    }
    previewAudioRef.current?.pause();
    setPlayingId(null);

    // If no base64 audio, preview via browser speech synthesis
    if (!ad.project_data.voiceover?.audioBase64) {
      if (ad.project_data.script) {
        window.speechSynthesis?.cancel();
        const utt = new SpeechSynthesisUtterance(ad.project_data.script.slice(0, 200));
        utt.rate = 0.9;
        utt.onend = () => setPlayingId(null);
        window.speechSynthesis?.speak(utt);
        setPlayingId(ad.id);
      }
      return;
    }

    try {
      const byteStr = atob(ad.project_data.voiceover.audioBase64);
      const bytes = new Uint8Array(byteStr.length);
      for (let i = 0; i < byteStr.length; i++) bytes[i] = byteStr.charCodeAt(i);
      const blob = new Blob([bytes], { type: 'audio/mpeg' });
      const audio = new Audio(URL.createObjectURL(blob));
      audio.onended = () => setPlayingId(null);
      audio.play();
      previewAudioRef.current = audio;
      setPlayingId(ad.id);
    } catch {
      toast.error('Could not play preview');
    }
  };

  // ── Restore ───────────────────────────────────────────────────────────────
  const handleRestore = (ad: SavedVideoAd) => {
    onRestoreToTimeline({
      clips:       ad.project_data.clips,
      voiceover:   ad.project_data.voiceover,
      projectName: ad.project_data.propertyName ?? ad.project_name,
      transitions: ad.project_data.transitions,
    });
    toast.success(`🎬 "${ad.project_name}" loaded to timeline!`);
  };

  // ── Load & Export ─────────────────────────────────────────────────────────
  const handleLoadAndExport = (ad: SavedVideoAd) => {
    const payload = {
      clips:       ad.project_data.clips,
      voiceover:   ad.project_data.voiceover,
      projectName: ad.project_data.propertyName ?? ad.project_name,
      transitions: ad.project_data.transitions,
    };
    if (onLoadAndExport) {
      onLoadAndExport(payload);
      toast.success(`⬇️ "${ad.project_name}" loaded — export starting…`);
    } else {
      // Fallback: just restore
      onRestoreToTimeline(payload);
      toast.info('Loaded to timeline. Use the Export bar to export.');
    }
  };

  // ── Regenerate ────────────────────────────────────────────────────────────
  const handleRegenerate = (ad: SavedVideoAd) => {
    setRegeneratingId(ad.id);
    if (onRegenerateAd) {
      onRegenerateAd(ad);
      toast.info(`♻️ Regenerating "${ad.project_name}"…`);
    } else {
      handleRestore(ad);
      toast.info('Loaded to timeline — open Projects panel to regenerate');
    }
    setTimeout(() => setRegeneratingId(null), 1500);
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      <div className="h-full flex flex-col bg-slate-900 text-white overflow-hidden">
        {/* Header */}
        <div className="px-3 py-2.5 border-b border-slate-700 flex items-center gap-2">
          <Grid3X3 className="w-4 h-4 text-amber-400 shrink-0" />
          <span className="text-xs font-bold text-amber-400 uppercase tracking-wide flex-1">
            Saved Video Ads
          </span>
          {ads.length > 0 && (
            <span className="text-[9px] text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded-full">
              {ads.length}
            </span>
          )}
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
          <div className="p-3">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-48 gap-3">
                <Loader2 className="w-6 h-6 animate-spin text-amber-400" />
                <p className="text-xs text-slate-500">Loading saved ads…</p>
              </div>
            ) : ads.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 gap-3 text-center px-4">
                <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center">
                  <FolderOpen className="w-6 h-6 text-slate-600" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-400">No saved video ads yet</p>
                  <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">
                    Generate a video ad from the <span className="text-amber-400">Projects</span> panel — it will appear here with its full script, settings and timeline snapshot
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2.5">
                {ads.map(ad => (
                  <GridCard
                    key={ad.id}
                    ad={ad}
                    isPlaying={playingId === ad.id}
                    isDeleting={deletingId === ad.id}
                    isRegenerating={regeneratingId === ad.id}
                    onPlay={() => togglePreviewAudio(ad)}
                    onOpenDetail={() => setDetailAd(ad)}
                    onRegenerate={() => handleRegenerate(ad)}
                    onDelete={() => handleDelete(ad.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Footer */}
        {ads.length > 0 && (
          <div className="px-3 py-2 border-t border-slate-700 flex items-center justify-between">
            <p className="text-[10px] text-slate-500">
              {ads.length} ad{ads.length !== 1 ? 's' : ''} saved
            </p>
            <p className="text-[10px] text-slate-600">
              Click card to view · <span className="text-amber-400/70">Load & Export</span> in detail view
            </p>
          </div>
        )}
      </div>

      {/* Detail Drawer */}
      {detailAd && (
        <DetailDrawer
          ad={detailAd}
          isPlaying={playingId === detailAd.id}
          isDeleting={deletingId === detailAd.id}
          onPlay={() => togglePreviewAudio(detailAd)}
          onClose={() => setDetailAd(null)}
          onRestore={() => { handleRestore(detailAd); setDetailAd(null); }}
          onLoadAndExport={() => { handleLoadAndExport(detailAd); setDetailAd(null); }}
          onDelete={() => { handleDelete(detailAd.id); setDetailAd(null); }}
        />
      )}
    </>
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
    if (!user) return;

    await supabase.from('ai_tool_projects').insert([{
      user_id: user.id,
      project_name: opts.projectName,
      tool_type: 'video-ad',
      thumbnail_url: opts.thumbnailUrl,
      project_data: JSON.parse(JSON.stringify({
        script:       opts.script,
        status:       'completed',
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
