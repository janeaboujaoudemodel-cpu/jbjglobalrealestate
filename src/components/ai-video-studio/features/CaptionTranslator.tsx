import React, { useState, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';
import {
  Wand2, Loader2, Languages, Download, Upload, Trash2,
  Volume2, FileText, Palette, Zap, ChevronDown, ChevronUp,
  Check, X, Play, Film,
} from 'lucide-react';
import { SUPPORTED_LANGUAGES, SUBTITLE_STYLES } from '../types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// ─── Types ─────────────────────────────────────────────────────────────────

interface SubtitleSegment {
  id: string;
  startTime: number;
  endTime: number;
  text: string;
  language: string;
  translations?: Record<string, string>;
  dubbedAudioUrl?: Record<string, string>;
}

interface CaptionStyle {
  fontSize: number;
  color: string;
  bgColor: string;
  position: 'top' | 'center' | 'bottom';
  preset: string;
  speed: 'slow' | 'normal' | 'fast';
}

interface CaptionTranslatorProps {
  subtitles: SubtitleSegment[];
  onSubtitlesUpdate: (subtitles: SubtitleSegment[]) => void;
  onTranscribe: () => Promise<SubtitleSegment[]>;
}

// ─── Constants ─────────────────────────────────────────────────────────────

const FLAG_EMOJIS: Record<string, string> = {
  en: '🇬🇧', ar: '🇸🇦', hi: '🇮🇳', ur: '🇵🇰', zh: '🇨🇳',
  es: '🇪🇸', fr: '🇫🇷', de: '🇩🇪', ru: '🇷🇺', pt: '🇵🇹',
  ja: '🇯🇵', ko: '🇰🇷', it: '🇮🇹', nl: '🇳🇱', tr: '🇹🇷',
  fa: '🇮🇷', he: '🇮🇱', pl: '🇵🇱', th: '🇹🇭', vi: '🇻🇳',
  id: '🇮🇩', ms: '🇲🇾', tl: '🇵🇭', bn: '🇧🇩', ta: '🇱🇰',
  te: '🇮🇳', ml: '🇮🇳', sw: '🇰🇪',
};

const QUICK_LANGS = ['ar', 'hi', 'zh', 'es', 'fr', 'de', 'ru', 'tr', 'ja', 'ko'];

// ─── Time Formatters ────────────────────────────────────────────────────────

const toSRTTime = (s: number) => {
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60),
    sec = Math.floor(s % 60), ms = Math.floor((s % 1) * 1000);
  return `${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}:${sec.toString().padStart(2,'0')},${ms.toString().padStart(3,'0')}`;
};

const toVTTTime = (s: number) => {
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60),
    sec = Math.floor(s % 60), ms = Math.floor((s % 1) * 1000);
  return `${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}:${sec.toString().padStart(2,'0')}.${ms.toString().padStart(3,'0')}`;
};

const fmtTime = (s: number) => {
  const m = Math.floor(s / 60), sec = Math.floor(s % 60),
    ms = Math.floor((s % 1) * 100);
  return `${m.toString().padStart(2,'0')}:${sec.toString().padStart(2,'0')}.${ms.toString().padStart(2,'0')}`;
};

// ─── Caption burn helper ────────────────────────────────────────────────────

function drawCaptionText(
  ctx: CanvasRenderingContext2D,
  text: string,
  style: CaptionStyle,
  w: number,
  h: number
) {
  const fs = style.fontSize;
  ctx.font = `bold ${fs}px Arial, sans-serif`;
  ctx.textAlign = 'center';

  const padding = fs * 0.4;
  const maxW = w * 0.9;

  // Word-wrap
  const words = text.split(' ');
  const lines: string[] = [];
  let cur = '';
  for (const word of words) {
    const test = cur ? cur + ' ' + word : word;
    if (ctx.measureText(test).width > maxW && cur) {
      lines.push(cur);
      cur = word;
    } else {
      cur = test;
    }
  }
  if (cur) lines.push(cur);

  const lineH = fs * 1.3;
  const totalH = lines.length * lineH + padding * 2;

  const x = w / 2;
  const y = style.position === 'top'
    ? fs + padding
    : style.position === 'center'
      ? h / 2 - totalH / 2
      : h - totalH - fs * 0.5;

  // Background box
  if (style.preset !== 'clean') {
    ctx.fillStyle = style.bgColor + 'CC';
    ctx.roundRect(x - maxW / 2 - padding, y - padding, maxW + padding * 2, totalH, 6);
    ctx.fill();
  }

  // Text with shadow
  ctx.shadowColor = 'rgba(0,0,0,0.8)';
  ctx.shadowBlur = 4;
  ctx.shadowOffsetX = 1;
  ctx.shadowOffsetY = 1;
  ctx.fillStyle = style.color;

  lines.forEach((line, i) => {
    ctx.fillText(line, x, y + i * lineH + fs);
  });

  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
}

// ─── Main component ─────────────────────────────────────────────────────────

export function CaptionTranslator({ subtitles, onSubtitlesUpdate, onTranscribe }: CaptionTranslatorProps) {
  // Core state
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [spokenLanguage, setSpokenLanguage] = useState('en');
  const [activeTab, setActiveTab] = useState<'upload' | 'transcribe' | 'translate' | 'style' | 'export'>('upload');

  // Transcription state
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcribeProgress, setTranscribeProgress] = useState(0);
  const [transcribeStage, setTranscribeStage] = useState('');
  const [transcribeProvider, setTranscribeProvider] = useState<string>('');

  // Translation state
  const [selectedLang, setSelectedLang] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [showLangGrid, setShowLangGrid] = useState(false);

  // Dubbing state
  const [isDubbing, setIsDubbing] = useState<string | null>(null);
  const [isDubbingAll, setIsDubbingAll] = useState<string | null>(null);

  // Editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [editingTranslationId, setEditingTranslationId] = useState<string | null>(null);
  const [editingTranslationText, setEditingTranslationText] = useState('');

  // Style state
  const [captionStyle, setCaptionStyle] = useState<CaptionStyle>({
    fontSize: 24, color: '#FFFFFF', bgColor: '#000000',
    position: 'bottom', preset: 'clean', speed: 'normal',
  });

  // Burn captions state
  const [burnVideoFile, setBurnVideoFile] = useState<File | null>(null);
  const [isBurning, setIsBurning] = useState(false);
  const [burnProgress, setBurnProgress] = useState(0);
  const [burnLang, setBurnLang] = useState('');

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const burnFileInputRef = useRef<HTMLInputElement>(null);

  // ─── File handling ──────────────────────────────────────────────────────

  const handleFileSelect = useCallback((file: File) => {
    setUploadedFile(file);
    toast.success(`Loaded: ${file.name} (${(file.size / 1024 / 1024).toFixed(1)} MB)`);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  }, [handleFileSelect]);

  // ─── Transcription (calls new video-transcribe edge function) ──────────

  const handleTranscribe = useCallback(async () => {
    if (!uploadedFile) { toast.error('Upload a media file first'); return; }

    setIsTranscribing(true);
    setTranscribeProgress(5);
    setTranscribeStage('Reading file…');

    try {
      setTranscribeProgress(15);
      const arrayBuffer = await uploadedFile.arrayBuffer();

      setTranscribeStage('Encoding audio…');
      setTranscribeProgress(30);

      // Efficient base64 encoding
      const uint8Array = new Uint8Array(arrayBuffer);
      let binary = '';
      const chunkSize = 8192;
      for (let i = 0; i < uint8Array.length; i += chunkSize) {
        binary += String.fromCharCode(...uint8Array.subarray(i, i + chunkSize));
      }
      const base64Audio = btoa(binary);

      setTranscribeStage('Transcribing with ElevenLabs Scribe…');
      setTranscribeProgress(50);

      const mimeType = uploadedFile.type || 'audio/webm';

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/video-transcribe`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ audio: base64Audio, mimeType, language: spokenLanguage }),
        }
      );

      setTranscribeProgress(80);
      setTranscribeStage('Grouping segments…');

      if (!response.ok) throw new Error(`Transcription failed: ${response.statusText}`);

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      const rawSegments: { startTime: number; endTime: number; text: string }[] = data.segments || [];

      if (rawSegments.length === 0) {
        toast.error('No speech detected. Try a different file or language.');
        return;
      }

      const segments: SubtitleSegment[] = rawSegments.map(s => ({
        id: crypto.randomUUID(),
        startTime: s.startTime,
        endTime: s.endTime,
        text: s.text,
        language: spokenLanguage,
      }));

      setTranscribeProvider(data.provider || '');
      setTranscribeProgress(100);
      setTranscribeStage('Done!');
      onSubtitlesUpdate(segments);
      setActiveTab('translate');
      toast.success(`✓ ${segments.length} segments transcribed${data.provider === 'elevenlabs' ? ' with real timestamps' : ' (estimated timecodes)'}`);
    } catch (error) {
      console.error('Transcription error:', error);
      toast.error(error instanceof Error ? error.message : 'Transcription failed');
    } finally {
      setTimeout(() => {
        setIsTranscribing(false);
        setTranscribeProgress(0);
        setTranscribeStage('');
      }, 800);
    }
  }, [uploadedFile, spokenLanguage, onSubtitlesUpdate]);

  // ─── Translation ────────────────────────────────────────────────────────

  const handleTranslate = useCallback(async () => {
    if (!selectedLang) { toast.error('Select a language'); return; }
    if (subtitles.length === 0) { toast.error('Transcribe first'); return; }

    setIsTranslating(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/auto-translate`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ texts: subtitles.map(s => s.text), targetLang: selectedLang }),
        }
      );

      if (!response.ok) throw new Error('Translation failed');
      const data = await response.json();
      const translations: string[] = data.translations || [];

      onSubtitlesUpdate(subtitles.map((sub, idx) => ({
        ...sub,
        translations: { ...sub.translations, [selectedLang]: translations[idx] || sub.text },
      })));

      toast.success(`✓ Translated to ${SUPPORTED_LANGUAGES.find(l => l.code === selectedLang)?.name}`);
    } catch {
      toast.error('Translation failed');
    } finally {
      setIsTranslating(false);
    }
  }, [selectedLang, subtitles, onSubtitlesUpdate]);

  // ─── Dub single segment ─────────────────────────────────────────────────

  const handleDubSegment = useCallback(async (segmentId: string, langCode: string) => {
    const segment = subtitles.find(s => s.id === segmentId);
    if (!segment) return;

    const textToDub = segment.translations?.[langCode] || segment.text;
    setIsDubbing(segmentId + langCode);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      if (!token) { toast.error('Sign in to use voice dubbing'); return; }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/voice-studio-tts`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ text: textToDub, voiceId: 'JBFqnCBsd6RMkjVDRZzb', format: 'mp3' }),
        }
      );

      if (!response.ok) throw new Error('Dubbing failed');
      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);

      onSubtitlesUpdate(subtitles.map(s =>
        s.id === segmentId
          ? { ...s, dubbedAudioUrl: { ...s.dubbedAudioUrl, [langCode]: audioUrl } }
          : s
      ));
      toast.success('Dubbed audio ready!');
    } catch {
      toast.error('Voice dubbing failed');
    } finally {
      setIsDubbing(null);
    }
  }, [subtitles, onSubtitlesUpdate]);

  // ─── Dub ALL segments for a language ────────────────────────────────────

  const handleDubAll = useCallback(async (langCode: string) => {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;
    if (!token) { toast.error('Sign in to use voice dubbing'); return; }

    const segsWithTranslation = subtitles.filter(s => s.translations?.[langCode]);
    if (segsWithTranslation.length === 0) {
      toast.error(`Translate to ${SUPPORTED_LANGUAGES.find(l => l.code === langCode)?.name} first`);
      return;
    }

    setIsDubbingAll(langCode);
    toast.info(`Dubbing ${segsWithTranslation.length} segments…`);

    let updatedSubtitles = [...subtitles];
    let done = 0;

    for (const seg of segsWithTranslation) {
      try {
        const textToDub = seg.translations![langCode];
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/voice-studio-tts`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ text: textToDub, voiceId: 'JBFqnCBsd6RMkjVDRZzb', format: 'mp3' }),
          }
        );

        if (response.ok) {
          const audioBlob = await response.blob();
          const audioUrl = URL.createObjectURL(audioBlob);
          updatedSubtitles = updatedSubtitles.map(s =>
            s.id === seg.id
              ? { ...s, dubbedAudioUrl: { ...s.dubbedAudioUrl, [langCode]: audioUrl } }
              : s
          );
        }
        done++;
        toast.info(`Dubbing… ${done}/${segsWithTranslation.length}`);
      } catch {
        // skip failed segments
      }
    }

    onSubtitlesUpdate(updatedSubtitles);
    toast.success(`✓ Dubbed ${done} segments in ${SUPPORTED_LANGUAGES.find(l => l.code === langCode)?.name}!`);
    setIsDubbingAll(null);
  }, [subtitles, onSubtitlesUpdate]);

  // ─── Segment editing ─────────────────────────────────────────────────────

  const startEditSegment = (sub: SubtitleSegment) => { setEditingId(sub.id); setEditingText(sub.text); };
  const saveEditSegment = () => {
    if (!editingId) return;
    onSubtitlesUpdate(subtitles.map(s => s.id === editingId ? { ...s, text: editingText } : s));
    setEditingId(null);
  };

  const startEditTranslation = (subId: string, langCode: string, text: string) => {
    setEditingTranslationId(subId + langCode);
    setEditingTranslationText(text);
  };
  const saveEditTranslation = (subId: string, langCode: string) => {
    onSubtitlesUpdate(subtitles.map(s =>
      s.id === subId ? { ...s, translations: { ...s.translations, [langCode]: editingTranslationText } } : s
    ));
    setEditingTranslationId(null);
  };

  const deleteSegment = (id: string) => onSubtitlesUpdate(subtitles.filter(s => s.id !== id));

  // ─── SRT / VTT Export ────────────────────────────────────────────────────

  const exportSRT = useCallback((langCode?: string) => {
    if (!subtitles.length) { toast.error('No subtitles'); return; }
    const srt = subtitles.map((sub, i) => {
      const text = langCode && sub.translations?.[langCode] ? sub.translations[langCode] : sub.text;
      return `${i + 1}\n${toSRTTime(sub.startTime)} --> ${toSRTTime(sub.endTime)}\n${text}\n`;
    }).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([srt], { type: 'text/plain' }));
    a.download = langCode ? `subtitles_${langCode}.srt` : 'subtitles.srt';
    a.click();
    toast.success('SRT exported!');
  }, [subtitles]);

  const exportVTT = useCallback((langCode?: string) => {
    if (!subtitles.length) { toast.error('No subtitles'); return; }
    const vtt = 'WEBVTT\n\n' + subtitles.map((sub, i) => {
      const text = langCode && sub.translations?.[langCode] ? sub.translations[langCode] : sub.text;
      return `${i + 1}\n${toVTTTime(sub.startTime)} --> ${toVTTTime(sub.endTime)}\n${text}\n`;
    }).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([vtt], { type: 'text/vtt' }));
    a.download = langCode ? `subtitles_${langCode}.vtt` : 'subtitles.vtt';
    a.click();
    toast.success('VTT exported!');
  }, [subtitles]);

  // ─── Caption Burn (Canvas API) ────────────────────────────────────────────

  const burnCaptionsOnVideo = useCallback(async () => {
    if (!burnVideoFile) { toast.error('Select a video file to burn captions on'); return; }
    if (subtitles.length === 0) { toast.error('No subtitles to burn'); return; }

    setIsBurning(true);
    setBurnProgress(0);

    try {
      const video = document.createElement('video');
      video.src = URL.createObjectURL(burnVideoFile);
      video.muted = true;
      video.crossOrigin = 'anonymous';

      await new Promise<void>((resolve, reject) => {
        video.onloadedmetadata = () => resolve();
        video.onerror = () => reject(new Error('Failed to load video'));
        setTimeout(() => reject(new Error('Video load timeout')), 15000);
      });

      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 1280;
      canvas.height = video.videoHeight || 720;
      const ctx = canvas.getContext('2d')!;

      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
        ? 'video/webm;codecs=vp9'
        : 'video/webm';

      const stream = canvas.captureStream(30);
      const recorder = new MediaRecorder(stream, { mimeType });
      const chunks: Blob[] = [];
      recorder.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };

      const recordingDone = new Promise<void>(resolve => { recorder.onstop = () => resolve(); });

      recorder.start(100);
      await video.play();

      const drawFrame = () => {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        const t = video.currentTime;
        const activeSeg = subtitles.find(s => t >= s.startTime && t <= s.endTime);
        if (activeSeg) {
          const text = burnLang && activeSeg.translations?.[burnLang]
            ? activeSeg.translations[burnLang]
            : activeSeg.text;
          drawCaptionText(ctx, text, captionStyle, canvas.width, canvas.height);
        }

        setBurnProgress(Math.round((t / video.duration) * 100));
        if (!video.ended && !video.paused) requestAnimationFrame(drawFrame);
        else recorder.stop();
      };

      video.onended = () => recorder.stop();
      requestAnimationFrame(drawFrame);

      await recordingDone;

      const blob = new Blob(chunks, { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `captioned_video_${burnLang || 'original'}.webm`;
      a.click();
      URL.revokeObjectURL(video.src);

      toast.success('✓ Captioned video downloaded!');
    } catch (error) {
      console.error('Burn error:', error);
      toast.error(error instanceof Error ? error.message : 'Burn failed');
    } finally {
      setIsBurning(false);
      setBurnProgress(0);
    }
  }, [burnVideoFile, subtitles, captionStyle, burnLang]);

  // ─── Derived values ───────────────────────────────────────────────────────

  const selectedLangInfo = SUPPORTED_LANGUAGES.find(l => l.code === selectedLang);
  const translatedLangs = [...new Set(subtitles.flatMap(s => Object.keys(s.translations || {})))];
  const isVideoFile = uploadedFile?.type?.startsWith('video/');

  const TABS = [
    { id: 'upload', label: 'Upload', icon: Upload },
    { id: 'transcribe', label: 'Transcribe', icon: Wand2 },
    { id: 'translate', label: 'Translate', icon: Languages },
    { id: 'style', label: 'Style', icon: Palette },
    { id: 'export', label: 'Export', icon: Download },
  ] as const;

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full bg-slate-900/30">
      {/* Step tabs */}
      <div className="flex border-b border-slate-700/50 bg-slate-900/60 px-1 pt-1 gap-0.5 flex-shrink-0">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`flex-1 flex flex-col items-center gap-0.5 py-1.5 px-1 rounded-t text-[10px] font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-slate-800 text-amber-400 border-b-2 border-amber-400'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <tab.icon className="w-3 h-3" />
            {tab.label}
          </button>
        ))}
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3 space-y-3">

          {/* ═══ UPLOAD TAB ═══ */}
          {activeTab === 'upload' && (
            <div className="space-y-3">
              <div
                onDrop={handleDrop}
                onDragOver={e => e.preventDefault()}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-600 hover:border-amber-400/50 rounded-xl p-6 text-center cursor-pointer transition-colors bg-slate-800/30"
              >
                <Upload className="w-8 h-8 mx-auto mb-2 text-slate-500" />
                <p className="text-sm text-slate-300 font-medium">Drop audio or video here</p>
                <p className="text-xs text-slate-500 mt-1">MP3, WAV, M4A, MP4, MOV, WebM — up to 2GB</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*,video/*"
                className="hidden"
                onChange={e => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
              />

              {uploadedFile && (
                <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700 space-y-2">
                  {isVideoFile && (
                    <video
                      src={URL.createObjectURL(uploadedFile)}
                      className="w-full rounded-lg aspect-video object-cover bg-black"
                      controls
                      muted
                    />
                  )}
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-amber-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">{uploadedFile.name}</p>
                      <p className="text-xs text-slate-400">{(uploadedFile.size / 1024 / 1024).toFixed(1)} MB</p>
                    </div>
                    <button
                      onClick={() => { setUploadedFile(null); }}
                      className="text-slate-500 hover:text-red-400 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  {uploadedFile.size > 50 * 1024 * 1024 && (
                    <p className="text-xs text-amber-400">⚠ Large file — transcription may take 30–60s</p>
                  )}
                </div>
              )}

              {/* Spoken language selector */}
              <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
                <p className="text-xs text-slate-400 font-medium mb-2">What language is spoken in the video?</p>
                <div className="grid grid-cols-2 gap-1 max-h-40 overflow-y-auto">
                  {SUPPORTED_LANGUAGES.map(lang => (
                    <button
                      key={lang.code}
                      onClick={() => setSpokenLanguage(lang.code)}
                      className={`flex items-center gap-1.5 px-2 py-1.5 rounded text-xs text-left transition-colors ${
                        spokenLanguage === lang.code
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                          : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700 border border-transparent'
                      }`}
                    >
                      <span>{FLAG_EMOJIS[lang.code] || '🌐'}</span>
                      <span className="truncate">{lang.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <Button
                onClick={() => setActiveTab('transcribe')}
                disabled={!uploadedFile}
                className="w-full bg-amber-500 hover:bg-amber-400 text-black font-semibold"
              >
                Continue to Transcribe →
              </Button>
            </div>
          )}

          {/* ═══ TRANSCRIBE TAB ═══ */}
          {activeTab === 'transcribe' && (
            <div className="space-y-3">
              {!uploadedFile ? (
                <div className="text-center py-6">
                  <p className="text-slate-400 text-sm mb-2">No file uploaded yet</p>
                  <Button size="sm" onClick={() => setActiveTab('upload')} className="bg-slate-700 hover:bg-slate-600 text-white">
                    Upload File
                  </Button>
                </div>
              ) : (
                <>
                  <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700 flex items-center gap-2">
                    <FileText className="w-3 h-3 text-amber-400 flex-shrink-0" />
                    <p className="text-xs text-slate-300 truncate flex-1">{uploadedFile.name}</p>
                    <span className="text-[10px] text-slate-500">{FLAG_EMOJIS[spokenLanguage]} {SUPPORTED_LANGUAGES.find(l => l.code === spokenLanguage)?.name}</span>
                  </div>

                  {isTranscribing && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs text-slate-400">
                        <span>{transcribeStage}</span>
                        <span>{transcribeProgress}%</span>
                      </div>
                      <Progress value={transcribeProgress} className="h-2" />
                    </div>
                  )}

                  {transcribeProvider && !isTranscribing && (
                    <div className="text-[10px] text-slate-500 text-center">
                      {transcribeProvider === 'elevenlabs' ? '✓ Real word timestamps (ElevenLabs Scribe)' : '⚠ Estimated timecodes (AI fallback)'}
                    </div>
                  )}

                  <Button
                    onClick={handleTranscribe}
                    disabled={isTranscribing}
                    className="w-full bg-amber-500 hover:bg-amber-400 text-black font-semibold"
                  >
                    {isTranscribing ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{transcribeStage}</>
                    ) : (
                      <><Wand2 className="w-4 h-4 mr-2" />{subtitles.length > 0 ? 'Re-Transcribe' : 'Start Transcription'}</>
                    )}
                  </Button>
                </>
              )}

              {/* Editable segments */}
              {subtitles.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs text-slate-400 font-medium">{subtitles.length} segments — click text to edit</p>
                  {subtitles.map(sub => (
                    <div key={sub.id} className="bg-slate-800/60 rounded-lg p-2 border border-slate-700/50">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] text-slate-500 font-mono">
                          {fmtTime(sub.startTime)} → {fmtTime(sub.endTime)}
                        </span>
                        <button
                          onClick={() => deleteSegment(sub.id)}
                          className="text-slate-600 hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                      {editingId === sub.id ? (
                        <div className="space-y-1">
                          <textarea
                            value={editingText}
                            onChange={e => setEditingText(e.target.value)}
                            className="w-full bg-slate-700 text-white text-xs rounded p-2 resize-none border border-amber-400/50 focus:outline-none"
                            rows={2}
                            autoFocus
                          />
                          <div className="flex gap-1">
                            <Button size="sm" onClick={saveEditSegment} className="h-6 text-xs bg-amber-500 text-black hover:bg-amber-400 px-2">
                              <Check className="w-3 h-3 mr-1" />Save
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => setEditingId(null)} className="h-6 text-xs text-slate-400 px-2">
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <p
                          className="text-xs text-white cursor-pointer hover:text-amber-400 transition-colors"
                          onClick={() => startEditSegment(sub)}
                        >
                          {sub.text}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ═══ TRANSLATE TAB ═══ */}
          {activeTab === 'translate' && (
            <div className="space-y-3">
              {subtitles.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-slate-400 text-sm mb-2">Transcribe your media first</p>
                  <Button size="sm" onClick={() => setActiveTab('transcribe')} className="bg-slate-700 hover:bg-slate-600 text-white">
                    Go to Transcribe
                  </Button>
                </div>
              ) : (
                <>
                  {/* Language selector */}
                  <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs text-slate-400 font-medium">Target language</p>
                      <button
                        onClick={() => setShowLangGrid(!showLangGrid)}
                        className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1"
                      >
                        {showLangGrid ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        {showLangGrid ? 'Collapse' : 'All 28 languages'}
                      </button>
                    </div>

                    {selectedLang && (
                      <div className="flex items-center gap-2 mb-2 bg-amber-500/10 rounded-lg px-3 py-1.5 border border-amber-500/30">
                        <span className="text-lg">{FLAG_EMOJIS[selectedLang] || '🌐'}</span>
                        <span className="text-sm font-medium text-amber-400">{selectedLangInfo?.name}</span>
                        <button onClick={() => setSelectedLang('')} className="ml-auto text-slate-500 hover:text-red-400">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    )}

                    {showLangGrid ? (
                      <div className="grid grid-cols-2 gap-1 max-h-52 overflow-y-auto">
                        {SUPPORTED_LANGUAGES.filter(l => l.code !== spokenLanguage).map(lang => (
                          <button
                            key={lang.code}
                            onClick={() => { setSelectedLang(lang.code); setShowLangGrid(false); }}
                            className={`flex items-center gap-1.5 px-2 py-1.5 rounded text-xs text-left transition-colors ${
                              selectedLang === lang.code
                                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                                : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700 border border-transparent'
                            }`}
                          >
                            <span>{FLAG_EMOJIS[lang.code] || '🌐'}</span>
                            <span className="truncate">{lang.name}</span>
                          </button>
                        ))}
                      </div>
                    ) : (
                      !selectedLang && (
                        <div className="flex flex-wrap gap-1">
                          {QUICK_LANGS.map(code => {
                            const lang = SUPPORTED_LANGUAGES.find(l => l.code === code);
                            if (!lang) return null;
                            return (
                              <button
                                key={code}
                                onClick={() => setSelectedLang(code)}
                                className="flex items-center gap-1 px-2 py-1 rounded-full bg-slate-700/50 hover:bg-slate-700 text-slate-300 hover:text-white text-xs transition-colors border border-slate-600 hover:border-amber-400/30"
                              >
                                <span>{FLAG_EMOJIS[code]}</span>
                                <span>{lang.name}</span>
                              </button>
                            );
                          })}
                        </div>
                      )
                    )}
                  </div>

                  {/* Translate + Dub All buttons */}
                  <div className="flex gap-2">
                    <Button
                      onClick={handleTranslate}
                      disabled={isTranslating || !selectedLang}
                      className="flex-1 bg-amber-500 hover:bg-amber-400 text-black font-semibold"
                    >
                      {isTranslating ? (
                        <><Loader2 className="w-4 h-4 mr-1.5 animate-spin" />Translating…</>
                      ) : (
                        <><Languages className="w-4 h-4 mr-1.5" />Translate{selectedLang ? ` → ${selectedLangInfo?.name}` : ''}</>
                      )}
                    </Button>

                    {selectedLang && subtitles.some(s => s.translations?.[selectedLang]) && (
                      <Button
                        onClick={() => handleDubAll(selectedLang)}
                        disabled={isDubbingAll === selectedLang}
                        className="flex-1 bg-purple-600 hover:bg-purple-500 text-white font-semibold"
                      >
                        {isDubbingAll === selectedLang ? (
                          <><Loader2 className="w-4 h-4 mr-1.5 animate-spin" />Dubbing…</>
                        ) : (
                          <><Volume2 className="w-4 h-4 mr-1.5" />Dub All</>
                        )}
                      </Button>
                    )}
                  </div>

                  {/* Translated segments */}
                  {subtitles.some(s => s.translations && Object.keys(s.translations).length > 0) && (
                    <div className="space-y-2">
                      <p className="text-xs text-slate-400 font-medium">Translations — click to edit</p>
                      {subtitles.map(sub => {
                        const tlLangs = Object.keys(sub.translations || {});
                        if (!tlLangs.length) return null;
                        return (
                          <div key={sub.id} className="bg-slate-800/60 rounded-lg p-2 border border-slate-700/50">
                            <p className="text-[10px] text-slate-500 font-mono mb-1">
                              {fmtTime(sub.startTime)} → {fmtTime(sub.endTime)}
                            </p>
                            <p className="text-xs text-slate-400 mb-2">{sub.text}</p>
                            {tlLangs.map(lc => {
                              const li = SUPPORTED_LANGUAGES.find(l => l.code === lc);
                              const tText = sub.translations![lc];
                              const editKey = sub.id + lc;
                              const isRTL = li?.rtl ?? false;
                              return (
                                <div key={lc} className="mt-1 bg-slate-700/30 rounded p-2 space-y-1">
                                  <div className="flex items-center justify-between">
                                    <span className="text-[10px] text-slate-500">{FLAG_EMOJIS[lc] || '🌐'} {li?.name}</span>
                                    <button
                                      onClick={() => handleDubSegment(sub.id, lc)}
                                      disabled={isDubbing === sub.id + lc}
                                      className="text-[10px] text-purple-400 hover:text-purple-300 flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-purple-500/10 hover:bg-purple-500/20 transition-colors"
                                    >
                                      {isDubbing === sub.id + lc
                                        ? <Loader2 className="w-2.5 h-2.5 animate-spin" />
                                        : <Volume2 className="w-2.5 h-2.5" />
                                      }
                                      Dub
                                    </button>
                                  </div>

                                  {editingTranslationId === editKey ? (
                                    <div className="space-y-1">
                                      <textarea
                                        value={editingTranslationText}
                                        onChange={e => setEditingTranslationText(e.target.value)}
                                        dir={isRTL ? 'rtl' : 'ltr'}
                                        className={`w-full bg-slate-600 text-white text-xs rounded p-1.5 resize-none border border-amber-400/50 focus:outline-none ${isRTL ? 'text-right' : ''}`}
                                        rows={2}
                                        autoFocus
                                      />
                                      <div className="flex gap-1">
                                        <Button size="sm" onClick={() => saveEditTranslation(sub.id, lc)} className="h-5 text-[10px] bg-amber-500 text-black px-2">Save</Button>
                                        <Button size="sm" variant="ghost" onClick={() => setEditingTranslationId(null)} className="h-5 text-[10px] text-slate-400 px-2">Cancel</Button>
                                      </div>
                                    </div>
                                  ) : (
                                    <p
                                      dir={isRTL ? 'rtl' : 'ltr'}
                                      className={`text-xs text-white cursor-pointer hover:text-amber-400 ${isRTL ? 'text-right' : ''}`}
                                      onClick={() => startEditTranslation(sub.id, lc, tText)}
                                    >
                                      {tText}
                                    </p>
                                  )}

                                  {sub.dubbedAudioUrl?.[lc] && (
                                    <audio controls src={sub.dubbedAudioUrl[lc]} className="w-full mt-1" style={{ height: '28px' }} />
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* ═══ STYLE TAB ═══ */}
          {activeTab === 'style' && (
            <div className="space-y-3">
              {/* Live preview */}
              <div
                className="relative w-full rounded-xl overflow-hidden bg-black"
                style={{ aspectRatio: '16/9' }}
              >
                <div className="absolute inset-0 bg-gradient-to-b from-slate-800 to-slate-900 flex items-center justify-center">
                  <Play className="w-8 h-8 text-slate-600" />
                </div>
                {/* Preview caption */}
                <div
                  className="absolute left-0 right-0 px-4"
                  style={{
                    top: captionStyle.position === 'top' ? '8%' : captionStyle.position === 'center' ? '45%' : 'auto',
                    bottom: captionStyle.position === 'bottom' ? '8%' : 'auto',
                    textAlign: 'center',
                  }}
                >
                  <span
                    style={{
                      fontSize: `${Math.max(10, captionStyle.fontSize * 0.5)}px`,
                      color: captionStyle.color,
                      backgroundColor: captionStyle.preset !== 'clean' ? captionStyle.bgColor + 'CC' : 'transparent',
                      padding: captionStyle.preset !== 'clean' ? '2px 8px' : '0',
                      borderRadius: '4px',
                      textShadow: '1px 1px 3px rgba(0,0,0,0.8)',
                      fontWeight: 'bold',
                      display: 'inline-block',
                    }}
                  >
                    {subtitles[0]?.text || 'Sample caption text preview'}
                  </span>
                </div>
              </div>

              {/* Style presets */}
              <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
                <p className="text-xs text-slate-400 font-medium mb-2">Preset</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {SUBTITLE_STYLES.map(s => (
                    <button
                      key={s.id}
                      onClick={() => setCaptionStyle(p => ({ ...p, preset: s.id }))}
                      className={`px-2 py-2 rounded text-xs text-left transition-colors ${
                        captionStyle.preset === s.id
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                          : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700 border border-transparent'
                      }`}
                    >
                      <p className="font-medium">{s.name}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">{s.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Font size */}
              <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
                <div className="flex justify-between mb-2">
                  <p className="text-xs text-slate-400">Font Size</p>
                  <p className="text-xs text-amber-400 font-mono">{captionStyle.fontSize}px</p>
                </div>
                <Slider
                  min={16} max={48} step={2}
                  value={[captionStyle.fontSize]}
                  onValueChange={([v]) => setCaptionStyle(p => ({ ...p, fontSize: v }))}
                  className="py-1"
                />
              </div>

              {/* Position */}
              <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
                <p className="text-xs text-slate-400 font-medium mb-2">Position</p>
                <div className="flex gap-1.5">
                  {(['top', 'center', 'bottom'] as const).map(pos => (
                    <button
                      key={pos}
                      onClick={() => setCaptionStyle(p => ({ ...p, position: pos }))}
                      className={`flex-1 py-1.5 rounded text-xs capitalize transition-colors ${
                        captionStyle.position === pos
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                          : 'bg-slate-700 text-slate-400 hover:text-slate-200 border border-transparent'
                      }`}
                    >
                      {pos}
                    </button>
                  ))}
                </div>
              </div>

              {/* Colors */}
              <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
                <p className="text-xs text-slate-400 font-medium mb-2">Colors</p>
                <div className="flex gap-3">
                  <label className="flex-1">
                    <p className="text-[10px] text-slate-500 mb-1">Text</p>
                    <input
                      type="color"
                      value={captionStyle.color}
                      onChange={e => setCaptionStyle(p => ({ ...p, color: e.target.value }))}
                      className="w-full h-8 rounded cursor-pointer border border-slate-600"
                    />
                  </label>
                  <label className="flex-1">
                    <p className="text-[10px] text-slate-500 mb-1">Background</p>
                    <input
                      type="color"
                      value={captionStyle.bgColor}
                      onChange={e => setCaptionStyle(p => ({ ...p, bgColor: e.target.value }))}
                      className="w-full h-8 rounded cursor-pointer border border-slate-600"
                    />
                  </label>
                </div>
              </div>

              {/* Speed */}
              <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
                <p className="text-xs text-slate-400 font-medium mb-2">Caption Speed</p>
                <div className="flex gap-1.5">
                  {(['slow', 'normal', 'fast'] as const).map(speed => (
                    <button
                      key={speed}
                      onClick={() => setCaptionStyle(p => ({ ...p, speed }))}
                      className={`flex-1 py-1.5 rounded text-xs capitalize transition-colors ${
                        captionStyle.speed === speed
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                          : 'bg-slate-700 text-slate-400 hover:text-slate-200 border border-transparent'
                      }`}
                    >
                      {speed}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ═══ EXPORT TAB ═══ */}
          {activeTab === 'export' && (
            <div className="space-y-3">
              {subtitles.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-slate-400 text-sm">No subtitles yet — transcribe first</p>
                </div>
              ) : (
                <>
                  {/* SRT / VTT download */}
                  <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
                    <p className="text-xs text-slate-400 font-medium mb-2">Original ({subtitles.length} segments)</p>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => exportSRT()} className="flex-1 bg-slate-700 hover:bg-slate-600 text-white h-8 text-xs">
                        <Download className="w-3 h-3 mr-1" />SRT
                      </Button>
                      <Button size="sm" onClick={() => exportVTT()} className="flex-1 bg-slate-700 hover:bg-slate-600 text-white h-8 text-xs">
                        <Download className="w-3 h-3 mr-1" />VTT
                      </Button>
                    </div>
                  </div>

                  {/* Translated exports */}
                  {translatedLangs.length > 0 && (
                    <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
                      <p className="text-xs text-slate-400 font-medium mb-2">Translated exports</p>
                      <div className="space-y-1.5">
                        {translatedLangs.map(lc => {
                          const li = SUPPORTED_LANGUAGES.find(l => l.code === lc);
                          return (
                            <div key={lc} className="flex items-center gap-2">
                              <span className="text-sm">{FLAG_EMOJIS[lc] || '🌐'}</span>
                              <span className="text-xs text-slate-300 flex-1">{li?.name}</span>
                              <Button size="sm" onClick={() => exportSRT(lc)} className="h-6 text-xs bg-slate-700 hover:bg-slate-600 text-white px-2">SRT</Button>
                              <Button size="sm" onClick={() => exportVTT(lc)} className="h-6 text-xs bg-slate-700 hover:bg-slate-600 text-white px-2">VTT</Button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* ── Burn Captions ── */}
                  <div className="bg-slate-800/50 rounded-lg p-3 border border-amber-500/20 space-y-3">
                    <div className="flex items-center gap-2">
                      <Zap className="w-3 h-3 text-amber-400" />
                      <p className="text-xs text-amber-400 font-medium">Burn Captions on Video</p>
                    </div>
                    <p className="text-xs text-slate-500">
                      Select the video file to overlay captions on. Uses your Style tab settings.
                    </p>

                    {/* Video file selector */}
                    <div
                      onClick={() => burnFileInputRef.current?.click()}
                      className="border border-dashed border-slate-600 hover:border-amber-400/50 rounded-lg p-3 text-center cursor-pointer transition-colors"
                    >
                      {burnVideoFile ? (
                        <div className="flex items-center gap-2">
                          <Film className="w-4 h-4 text-amber-400" />
                          <span className="text-xs text-white truncate">{burnVideoFile.name}</span>
                          <button
                            onClick={e => { e.stopPropagation(); setBurnVideoFile(null); }}
                            className="ml-auto text-slate-500 hover:text-red-400"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <Film className="w-5 h-5 mx-auto mb-1 text-slate-500" />
                          <p className="text-xs text-slate-400">Click to select video</p>
                        </>
                      )}
                    </div>
                    <input
                      ref={burnFileInputRef}
                      type="file"
                      accept="video/*"
                      className="hidden"
                      onChange={e => e.target.files?.[0] && setBurnVideoFile(e.target.files[0])}
                    />

                    {/* Language for burn */}
                    {translatedLangs.length > 0 && (
                      <div>
                        <p className="text-[10px] text-slate-400 mb-1">Burn which language?</p>
                        <div className="flex flex-wrap gap-1">
                          <button
                            onClick={() => setBurnLang('')}
                            className={`px-2 py-0.5 rounded text-[10px] transition-colors ${!burnLang ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' : 'bg-slate-700 text-slate-400'}`}
                          >
                            Original
                          </button>
                          {translatedLangs.map(lc => (
                            <button
                              key={lc}
                              onClick={() => setBurnLang(lc)}
                              className={`px-2 py-0.5 rounded text-[10px] transition-colors ${burnLang === lc ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' : 'bg-slate-700 text-slate-400'}`}
                            >
                              {FLAG_EMOJIS[lc]} {SUPPORTED_LANGUAGES.find(l => l.code === lc)?.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {isBurning && (
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs text-slate-400">
                          <span>Burning captions…</span>
                          <span>{burnProgress}%</span>
                        </div>
                        <Progress value={burnProgress} className="h-2" />
                      </div>
                    )}

                    <Button
                      onClick={burnCaptionsOnVideo}
                      disabled={isBurning || !burnVideoFile}
                      className="w-full bg-amber-500 hover:bg-amber-400 text-black font-semibold h-9 text-xs"
                    >
                      {isBurning ? (
                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Burning… {burnProgress}%</>
                      ) : (
                        <><Zap className="w-4 h-4 mr-2" />Burn Captions → Download WebM</>
                      )}
                    </Button>
                    <p className="text-[10px] text-slate-600 text-center">Client-side rendering — no upload needed</p>
                  </div>
                </>
              )}
            </div>
          )}

        </div>
      </ScrollArea>
    </div>
  );
}
