import React, { useCallback, useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import {
  RefreshCw, Trash2, RotateCcw, Film, Loader2,
  Globe, Mic, Clock, FolderOpen, Play, Pause,
  Sparkles, CheckCircle2, AlertCircle, Timer, Grid3X3,
  Download, ChevronDown, ChevronUp, Copy, CheckCheck,
  FileText, Settings, X, ArrowDownToLine
} from 'lucide-react';
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
      <div className="flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded-full font-semibold" style={{ background: 'rgba(52,211,153,0.15)', color: '#34D399' }}>
        <CheckCircle2 className="w-2.5 h-2.5" />
        Ready
      </div>
    );
  }
  if (status === 'processing') {
    return (
      <div className="flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded-full font-semibold" style={{ background: 'rgba(200,168,122,0.15)', color: '#C8A87A' }}>
        <Timer className="w-2.5 h-2.5 animate-pulse" />
        Processing
      </div>
    );
  }
  return (
    <div className="flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded-full font-semibold" style={{ background: 'rgba(138,138,154,0.15)', color: '#8A8A9A' }}>
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

  const content = (
    <div
      className="fixed inset-0 z-[99999] flex items-end justify-center"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-t-2xl shadow-2xl overflow-hidden"
        style={{ maxHeight: '85vh', background: '#111118', border: '1px solid rgba(255,255,255,0.08)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-2">
            <StatusBadge status={ad.project_data.status} />
            <p className="text-sm font-bold truncate max-w-[200px]" style={{ color: '#F1F0EE' }}>{ad.project_name}</p>
          </div>
          <button onClick={onClose} style={{ color: '#8A8A9A' }} className="hover:opacity-70 transition-opacity">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Thumbnail strip */}
        <div className="relative h-32 overflow-hidden" style={{ background: '#0A0A0F' }}>
          {ad.thumbnail_url ? (
            <img src={ad.thumbnail_url} alt={ad.project_name} className="w-full h-full object-cover opacity-60" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Film className="w-10 h-10" style={{ color: '#18181F' }} />
            </div>
          )}
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, #111118, transparent)' }} />
          <div className="absolute bottom-2 left-3 flex gap-1.5 flex-wrap">
            <span className="bg-black/70 text-white text-[10px] px-2 py-0.5 rounded-full font-mono">{formatDuration(dur)}</span>
            {s.format && <span className="text-[10px] px-2 py-0.5 rounded-full font-bold" style={{ background: 'rgba(200,168,122,0.8)', color: '#0A0A0F' }}>{getFormatLabel(s.format)}</span>}
            <span className="bg-black/70 text-[10px] px-2 py-0.5 rounded-full" style={{ color: '#F1F0EE' }}>{getLangName(s.language ?? 'en')}</span>
            <span className="bg-black/70 text-[10px] px-2 py-0.5 rounded-full" style={{ color: '#F1F0EE' }}>{getVoiceName(s.voiceId ?? '')}</span>
          </div>
          <button
            onClick={onPlay}
            className="absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center transition-all"
            style={{ background: 'rgba(0,0,0,0.7)', border: '1px solid rgba(255,255,255,0.15)', color: '#F1F0EE' }}
          >
            {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3 ml-0.5" />}
          </button>
        </div>

        {/* Tabs */}
        <div className="flex px-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          {(['script', 'settings', 'clips'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="flex items-center gap-1 px-3 py-2.5 text-xs font-semibold border-b-2 -mb-px transition-colors capitalize"
              style={{
                borderBottomColor: activeTab === tab ? '#C8A87A' : 'transparent',
                color: activeTab === tab ? '#C8A87A' : '#8A8A9A',
              }}
            >
              {tab === 'script' && <FileText className="w-3 h-3" />}
              {tab === 'settings' && <Settings className="w-3 h-3" />}
              {tab === 'clips' && <Film className="w-3 h-3" />}
              {tab}
            </button>
          ))}
        </div>

        {/* Tab content — natural scroll */}
        <div className="overflow-y-auto" style={{ maxHeight: 'clamp(140px, 30vh, 300px)' }}>
          <div className="p-4">
            {activeTab === 'script' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-wide" style={{ color: '#8A8A9A' }}>Generated Script</span>
                  <button onClick={copyScript} className="flex items-center gap-1 text-[10px] transition-opacity hover:opacity-70" style={{ color: '#8A8A9A' }}>
                    {copied ? <CheckCheck className="w-3 h-3" style={{ color: '#34D399' }} /> : <Copy className="w-3 h-3" />}
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                {ad.project_data.script ? (
                  <p className="text-[11px] leading-relaxed whitespace-pre-wrap rounded-lg p-3" style={{ color: '#F1F0EE', background: '#18181F', border: '1px solid rgba(255,255,255,0.06)' }}>
                    {ad.project_data.script}
                  </p>
                ) : (
                  <p className="text-[11px] italic" style={{ color: '#8A8A9A' }}>No script saved.</p>
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
                  <div key={label} className="flex items-center justify-between py-1.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <span className="text-[10px]" style={{ color: '#8A8A9A' }}>{label}</span>
                    <span className="text-[11px] font-medium" style={{ color: '#F1F0EE' }}>{value}</span>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'clips' && (
              <div className="space-y-1.5">
                <p className="text-[10px] uppercase tracking-wide mb-2" style={{ color: '#8A8A9A' }}>
                  Timeline Snapshot · {(ad.project_data.clips ?? []).length} clips
                </p>
                {(ad.project_data.clips ?? []).length === 0 ? (
                  <p className="text-[11px] italic" style={{ color: '#8A8A9A' }}>No clips saved in snapshot.</p>
                ) : (
                  (ad.project_data.clips ?? []).map((clip, i) => (
                    <div key={i} className="flex items-center gap-2 rounded-md px-2.5 py-2" style={{ background: '#18181F', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{
                        background: clip.type === 'image' ? '#818CF8' : clip.type === 'text' ? '#34D399' : '#C8A87A',
                      }} />
                      <span className="text-[10px] flex-1 truncate" style={{ color: '#F1F0EE' }}>{clip.name}</span>
                      <span className="text-[9px] shrink-0" style={{ color: '#8A8A9A' }}>{clip.type}</span>
                      <span className="text-[9px] shrink-0 font-mono" style={{ color: '#8A8A9A' }}>{clip.duration.toFixed(1)}s</span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="p-4 grid grid-cols-2 gap-2" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <button
            onClick={() => { onRestore(); onClose(); }}
            className="flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-semibold transition-opacity hover:opacity-80"
            style={{ background: '#1E1E28', border: '1px solid rgba(255,255,255,0.08)', color: '#F1F0EE' }}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Load to Timeline
          </button>
          <button
            onClick={() => { onLoadAndExport(); onClose(); }}
            className="flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-bold transition-all"
            style={{ background: '#C8A87A', color: '#0A0A0F', boxShadow: '0 0 16px rgba(200,168,122,0.2)' }}
          >
            <ArrowDownToLine className="w-3.5 h-3.5" />
            Load & Export
          </button>
          <button
            onClick={() => { onDelete(); onClose(); }}
            disabled={isDeleting}
            className="col-span-2 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs transition-all disabled:opacity-40 hover:opacity-70"
            style={{ border: '1px solid rgba(255,255,255,0.06)', color: '#8A8A9A' }}
          >
            {isDeleting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
            Delete Ad
          </button>
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(content, document.body);
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
      className="relative rounded-lg overflow-hidden transition-all duration-200 group cursor-pointer"
      style={{
        border: hovered ? '1px solid rgba(200,168,122,0.4)' : '1px solid rgba(255,255,255,0.06)',
        background: '#18181F',
        boxShadow: hovered ? '0 4px 20px rgba(200,168,122,0.08)' : undefined,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onOpenDetail}
    >
      {/* Thumbnail */}
      <div className="relative aspect-video overflow-hidden" style={{ background: '#0A0A0F' }}>
        {ad.thumbnail_url ? (
          <img
            src={ad.thumbnail_url}
            alt={ad.project_name}
            className={`w-full h-full object-cover transition-transform duration-300 ${hovered ? 'scale-105' : 'scale-100'}`}
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-1" style={{ background: 'linear-gradient(135deg, #111118, #0A0A0F)' }}>
            <Film className="w-8 h-8" style={{ color: '#252530' }} />
            <span className="text-[9px] font-medium" style={{ color: '#252530' }}>No thumbnail</span>
          </div>
        )}

        {/* Hover overlay */}
        <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-200 ${hovered ? 'opacity-100' : 'opacity-0'}`}
          style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="rounded-lg px-2.5 py-1.5 text-[10px] font-semibold flex items-center gap-1"
            style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: '#F1F0EE' }}>
            <FileText className="w-3 h-3" />
            View Details
          </div>
        </div>

        {/* Play voiceover */}
        <button
          onClick={(e) => { e.stopPropagation(); onPlay(); }}
          className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
          style={{ background: 'rgba(0,0,0,0.7)', color: '#F1F0EE', border: '1px solid rgba(255,255,255,0.1)' }}
          title="Preview voiceover"
        >
          {isPlaying ? <Pause className="w-2.5 h-2.5" /> : <Play className="w-2.5 h-2.5 ml-0.5" />}
        </button>

        {/* Duration pill */}
        <div className="absolute bottom-1 left-1 text-white text-[9px] px-1.5 py-0.5 rounded font-mono" style={{ background: 'rgba(0,0,0,0.8)' }}>
          {formatDuration(dur)}
        </div>

        {/* Format pill */}
        {ad.project_data.settings?.format && (
          <div className="absolute bottom-1 right-1 text-[9px] px-1.5 py-0.5 rounded font-bold uppercase" style={{ background: 'rgba(200,168,122,0.85)', color: '#0A0A0F' }}>
            {getFormatLabel(ad.project_data.settings.format)}
          </div>
        )}
      </div>

      {/* Card info */}
      <div className="p-2 space-y-1.5">
        <div className="flex items-start gap-1 justify-between">
          <p className="text-[11px] font-semibold leading-tight line-clamp-1 flex-1" style={{ color: '#F1F0EE' }}>
            {ad.project_name}
          </p>
          <StatusBadge status={ad.project_data.status} />
        </div>

        {/* Meta */}
        <div className="flex flex-wrap gap-1">
          <span className="flex items-center gap-0.5 text-[9px] px-1 py-0.5 rounded-full" style={{ color: '#8A8A9A', background: 'rgba(255,255,255,0.05)' }}>
            <Globe className="w-2 h-2" />
            {getLangName(ad.project_data.settings?.language ?? 'en')}
          </span>
          {ad.project_data.settings?.tone && (
            <span className="text-[9px] px-1 py-0.5 rounded-full capitalize" style={{ color: '#C8A87A', background: 'rgba(200,168,122,0.08)' }}>
              {ad.project_data.settings.tone}
            </span>
          )}
        </div>

        {/* Date + photo count */}
        <div className="flex items-center justify-between text-[9px]" style={{ color: '#8A8A9A' }}>
          <span className="flex items-center gap-0.5">
            <Clock className="w-2 h-2" />
            {formatDate(ad.created_at)}
          </span>
          <span>{photoCount} photo{photoCount !== 1 ? 's' : ''}</span>
        </div>

        {/* Action buttons */}
        <div className="flex gap-1 pt-0.5">
          <button
            onClick={(e) => { e.stopPropagation(); onRegenerate(); }}
            disabled={isRegenerating}
            className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-md text-[10px] font-bold transition-all disabled:opacity-50"
            style={{ background: '#C8A87A', color: '#0A0A0F' }}
            title="Regenerate this ad"
          >
            {isRegenerating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
            Regenerate
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            disabled={isDeleting}
            className="w-7 h-7 flex items-center justify-center rounded-md transition-all disabled:opacity-40"
            style={{ border: '1px solid rgba(255,255,255,0.06)', color: '#8A8A9A' }}
            title="Delete"
          >
            {isDeleting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
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
      <div className="flex flex-col" style={{ background: '#111118', color: '#F1F0EE' }}>
        {/* Header */}
        <div className="px-3 py-2.5 flex items-center gap-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <Grid3X3 className="w-4 h-4 shrink-0" style={{ color: '#C8A87A' }} />
          <span className="text-xs font-bold uppercase tracking-wide flex-1" style={{ color: '#C8A87A' }}>
            Saved Video Ads
          </span>
          {ads.length > 0 && (
            <span className="text-[9px] px-1.5 py-0.5 rounded-full" style={{ color: '#8A8A9A', background: '#18181F' }}>
              {ads.length}
            </span>
          )}
          <button
            onClick={fetchHistory}
            className="transition-opacity hover:opacity-70"
            style={{ color: '#8A8A9A' }}
            title="Refresh"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Body — no internal scroll trap; expands naturally */}
        <div className="p-3">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-48 gap-3">
                <Loader2 className="w-6 h-6 animate-spin" style={{ color: '#C8A87A' }} />
                <p className="text-xs" style={{ color: '#8A8A9A' }}>Loading saved ads…</p>
              </div>
            ) : ads.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 gap-3 text-center px-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: '#18181F', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <FolderOpen className="w-6 h-6" style={{ color: '#8A8A9A' }} />
                </div>
                <div>
                  <p className="text-xs font-semibold" style={{ color: '#8A8A9A' }}>No saved video ads yet</p>
                  <p className="text-[10px] mt-1 leading-relaxed" style={{ color: '#8A8A9A' }}>
                    Generate a video ad from the <span style={{ color: '#C8A87A' }}>Projects</span> panel — it will appear here with its full script, settings and timeline snapshot
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

        {/* Footer */}
        {ads.length > 0 && (
          <div className="px-3 py-2 flex items-center justify-between" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <p className="text-[10px]" style={{ color: '#8A8A9A' }}>
              {ads.length} ad{ads.length !== 1 ? 's' : ''} saved
            </p>
            <p className="text-[10px]" style={{ color: '#8A8A9A' }}>
              Click card to view · <span style={{ color: '#C8A87A' }}>Load & Export</span> in detail view
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
