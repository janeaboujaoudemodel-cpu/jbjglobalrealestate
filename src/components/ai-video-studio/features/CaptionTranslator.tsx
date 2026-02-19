import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';
import {
  Wand2, Loader2, Languages, Download, Upload, Trash2,
  Volume2, FileText, Palette, Zap, ChevronDown, ChevronUp,
  Check, X, Play, Pause, Film, SkipBack, SkipForward,
} from 'lucide-react';
import { SUPPORTED_LANGUAGES, SUBTITLE_STYLES, VOICE_OPTIONS } from '../types';
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
  fontWeight: 'normal' | 'bold';
  fontFamily: string;
  color: string;
  bgColor: string;
  bgOpacity: number;       // 0-100
  outlineWidth: number;    // 0-4
  outlineColor: string;
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

const FONT_FAMILIES = ['Arial', 'Georgia', 'Impact', 'Courier'];

const FADE_MS_MAP = { slow: 600, normal: 300, fast: 80 };

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

const fmtDuration = (s: number) => {
  const m = Math.floor(s / 60), sec = Math.floor(s % 60);
  return `${m.toString().padStart(2,'0')}:${sec.toString().padStart(2,'0')}`;
};

// ─── Caption burn helper ────────────────────────────────────────────────────

function isRTLText(text: string): boolean {
  return /[\u0600-\u06FF\u0750-\u077F\u0590-\u05FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(text);
}

function computeFadeAlpha(t: number, seg: SubtitleSegment, fadeMs: number): number {
  const elapsed = (t - seg.startTime) * 1000;
  const remaining = (seg.endTime - t) * 1000;
  const fadeIn = elapsed < fadeMs ? elapsed / fadeMs : 1;
  const fadeOut = remaining < fadeMs ? remaining / fadeMs : 1;
  return Math.max(0, Math.min(1, Math.min(fadeIn, fadeOut)));
}

function drawCaptionText(
  ctx: CanvasRenderingContext2D,
  text: string,
  style: CaptionStyle,
  w: number,
  h: number,
  alpha = 1
) {
  if (alpha <= 0) return;
  const fs = style.fontSize;
  const rtl = isRTLText(text);

  ctx.save();
  ctx.globalAlpha = alpha;

  if (rtl) (ctx as any).direction = 'rtl';
  ctx.font = `${style.fontWeight} ${fs}px ${style.fontFamily}, sans-serif`;
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
  if (style.preset !== 'clean' && style.bgOpacity > 0) {
    const bgAlphaHex = Math.round((style.bgOpacity / 100) * 255).toString(16).padStart(2, '0');
    ctx.fillStyle = style.bgColor + bgAlphaHex;
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(x - maxW / 2 - padding, y - padding, maxW + padding * 2, totalH, 6);
    } else {
      ctx.rect(x - maxW / 2 - padding, y - padding, maxW + padding * 2, totalH);
    }
    ctx.fill();
  }

  // Outline / stroke
  if (style.outlineWidth > 0) {
    ctx.strokeStyle = style.outlineColor;
    ctx.lineWidth = style.outlineWidth * 2;
    ctx.lineJoin = 'round';
    ctx.shadowColor = 'transparent';
    lines.forEach((line, i) => {
      ctx.strokeText(line, x, y + i * lineH + fs);
    });
  }

  // Text shadow
  ctx.shadowColor = 'rgba(0,0,0,0.8)';
  ctx.shadowBlur = style.outlineWidth > 0 ? 0 : 4;
  ctx.shadowOffsetX = 1;
  ctx.shadowOffsetY = 1;
  ctx.fillStyle = style.color;

  lines.forEach((line, i) => {
    ctx.fillText(line, x, y + i * lineH + fs);
  });

  ctx.restore();
}

// ─── Main component ─────────────────────────────────────────────────────────

export function CaptionTranslator({ subtitles, onSubtitlesUpdate, onTranscribe }: CaptionTranslatorProps) {
  // Core state
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [spokenLanguage, setSpokenLanguage] = useState('en');
  const [activeTab, setActiveTab] = useState<'upload' | 'transcribe' | 'translate' | 'style' | 'preview' | 'export'>('upload');

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
  const [dubVoiceId, setDubVoiceId] = useState('JBFqnCBsd6RMkjVDRZzb');
  const [dubbedTrackUrl, setDubbedTrackUrl] = useState<Record<string, string>>({});
  const [isAssembling, setIsAssembling] = useState<string | null>(null);

  // Editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [editingTranslationId, setEditingTranslationId] = useState<string | null>(null);
  const [editingTranslationText, setEditingTranslationText] = useState('');

  // Style state
  const [captionStyle, setCaptionStyle] = useState<CaptionStyle>({
    fontSize: 24,
    fontWeight: 'bold',
    fontFamily: 'Arial',
    color: '#FFFFFF',
    bgColor: '#000000',
    bgOpacity: 70,
    outlineWidth: 0,
    outlineColor: '#000000',
    position: 'bottom',
    preset: 'clean',
    speed: 'normal',
  });

  // Burn captions state
  const [burnVideoFile, setBurnVideoFile] = useState<File | null>(null);
  const [isBurning, setIsBurning] = useState(false);
  const [burnProgress, setBurnProgress] = useState(0);
  const [burnLang, setBurnLang] = useState('');

  // Preview state
  const [previewPlaying, setPreviewPlaying] = useState(false);
  const [previewTime, setPreviewTime] = useState(0);
  const [previewDuration, setPreviewDuration] = useState(0);

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const burnFileInputRef = useRef<HTMLInputElement>(null);
  const previewVideoRef = useRef<HTMLVideoElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const previewRafRef = useRef<number>(0);
  const dubbedAudioRef = useRef<HTMLAudioElement>(null);

  // ─── Preview RAF loop ─────────────────────────────────────────────────────

  useEffect(() => {
    if (activeTab !== 'preview') {
      cancelAnimationFrame(previewRafRef.current);
      return;
    }

    const video = previewVideoRef.current;
    const canvas = previewCanvasRef.current;
    if (!video || !canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const syncCanvasSize = () => {
      if (video.videoWidth && video.videoHeight) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
      }
    };

    video.addEventListener('loadedmetadata', syncCanvasSize);
    syncCanvasSize();

    const fadeMs = FADE_MS_MAP[captionStyle.speed];

    const loop = () => {
      const t = video.currentTime;
      setPreviewTime(t);

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const activeSeg = subtitles.find(s => t >= s.startTime && t <= s.endTime);
      if (activeSeg && canvas.width > 0) {
        const text = burnLang && activeSeg.translations?.[burnLang]
          ? activeSeg.translations[burnLang]
          : activeSeg.text;
        const alpha = computeFadeAlpha(t, activeSeg, fadeMs);
        drawCaptionText(ctx, text, captionStyle, canvas.width, canvas.height, alpha);
      }

      previewRafRef.current = requestAnimationFrame(loop);
    };

    previewRafRef.current = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(previewRafRef.current);
      video.removeEventListener('loadedmetadata', syncCanvasSize);
    };
  }, [activeTab, subtitles, captionStyle, burnLang]);

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

  // ─── Transcription (chunked to bypass 6MB body limit) ────────────────

  const CHUNK_BYTES = 3 * 1024 * 1024;

  const MIME_TO_EXT: Record<string, string> = {
    'audio/mpeg': 'mp3', 'audio/mp3': 'mp3',
    'audio/wav': 'wav', 'audio/x-wav': 'wav',
    'audio/ogg': 'ogg', 'audio/webm': 'webm',
    'audio/mp4': 'mp4', 'audio/m4a': 'm4a',
    'video/mp4': 'mp4', 'video/webm': 'webm',
    'video/quicktime': 'mov',
  };

  const toBase64 = (bytes: Uint8Array): string => {
    let binary = '';
    const chunkSize = 8192;
    for (let i = 0; i < bytes.length; i += chunkSize) {
      binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
    }
    return btoa(binary);
  };

  const handleTranscribe = useCallback(async () => {
    if (!uploadedFile) { toast.error('Upload a media file first'); return; }

    setIsTranscribing(true);
    setTranscribeProgress(5);
    setTranscribeStage('Reading file…');

    try {
      const arrayBuffer = await uploadedFile.arrayBuffer();
      const mimeType = uploadedFile.type || 'audio/webm';
      const totalChunks = Math.ceil(arrayBuffer.byteLength / CHUNK_BYTES);

      setTranscribeProgress(15);

      const allRawSegments: { startTime: number; endTime: number; text: string }[] = [];
      let timeOffset = 0;
      let lastProvider = '';

      for (let c = 0; c < totalChunks; c++) {
        const chunkLabel = totalChunks > 1 ? ` (chunk ${c + 1} of ${totalChunks})` : '';
        setTranscribeStage(`Transcribing with ElevenLabs Scribe…${chunkLabel}`);
        setTranscribeProgress(20 + Math.round((c / totalChunks) * 65));

        const slice = arrayBuffer.slice(c * CHUNK_BYTES, (c + 1) * CHUNK_BYTES);
        const base64Audio = toBase64(new Uint8Array(slice));

        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/video-transcribe`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            },
            body: JSON.stringify({ audio: base64Audio, mimeType, language: spokenLanguage, timeOffset }),
          }
        );

        if (!response.ok) throw new Error(`Transcription failed (chunk ${c + 1}): ${response.statusText}`);
        const data = await response.json();
        if (data.error) throw new Error(data.error);

        const chunkSegs: { startTime: number; endTime: number; text: string }[] = data.segments || [];
        if (chunkSegs.length > 0) {
          allRawSegments.push(...chunkSegs);
          timeOffset = chunkSegs[chunkSegs.length - 1].endTime;
        }
        lastProvider = data.provider || lastProvider;
      }

      setTranscribeStage('Grouping segments…');
      setTranscribeProgress(90);

      if (allRawSegments.length === 0) {
        toast.error('No speech detected. Try a different file or language.');
        return;
      }

      const segments: SubtitleSegment[] = allRawSegments.map(s => ({
        id: crypto.randomUUID(),
        startTime: s.startTime,
        endTime: s.endTime,
        text: s.text,
        language: spokenLanguage,
      }));

      setTranscribeProvider(lastProvider);
      setTranscribeProgress(100);
      setTranscribeStage('Done!');
      onSubtitlesUpdate(segments);
      setActiveTab('translate');
      toast.success(`✓ ${segments.length} segments transcribed${lastProvider === 'elevenlabs' ? ' with real timestamps' : ' (estimated timecodes)'}`);
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
          body: JSON.stringify({ text: textToDub, voiceId: dubVoiceId, format: 'mp3' }),
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
  }, [subtitles, onSubtitlesUpdate, dubVoiceId]);

  // ─── Assemble all dubbed segments into one gapped AudioBuffer ────────────

  const assembleDubbedTrack = useCallback(async (langCode: string, segs: SubtitleSegment[]) => {
    const dubbed = segs.filter(s => s.dubbedAudioUrl?.[langCode]);
    if (dubbed.length === 0) return;

    setIsAssembling(langCode);
    toast.info('Assembling dubbed audio track…');

    try {
      const audioCtx = new AudioContext();
      const sampleRate = audioCtx.sampleRate;

      // Decode all segment blobs in parallel
      const decoded = await Promise.all(
        dubbed.map(async seg => {
          const resp = await fetch(seg.dubbedAudioUrl![langCode]);
          const arrayBuf = await resp.arrayBuffer();
          const audioBuf = await audioCtx.decodeAudioData(arrayBuf);
          return { seg, audioBuf };
        })
      );

      // Master buffer length = last segment end time
      const lastEndTime = Math.max(...dubbed.map(s => s.endTime));
      const totalSamples = Math.ceil(lastEndTime * sampleRate);
      const numChannels = Math.max(...decoded.map(d => d.audioBuf.numberOfChannels), 1);
      const master = audioCtx.createBuffer(numChannels, totalSamples, sampleRate);

      for (const { seg, audioBuf } of decoded) {
        const offsetSamples = Math.floor(seg.startTime * sampleRate);
        const maxSamples = totalSamples - offsetSamples;
        for (let ch = 0; ch < Math.min(audioBuf.numberOfChannels, numChannels); ch++) {
          const src = audioBuf.getChannelData(ch);
          const dst = master.getChannelData(ch);
          const count = Math.min(src.length, maxSamples);
          for (let i = 0; i < count; i++) {
            dst[offsetSamples + i] += src[i];
          }
        }
      }

      // Record master buffer → Blob
      const streamDest = audioCtx.createMediaStreamDestination();
      const sourceNode = audioCtx.createBufferSource();
      sourceNode.buffer = master;
      sourceNode.connect(streamDest);

      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm';
      const recorder = new MediaRecorder(streamDest.stream, { mimeType });
      const chunks: Blob[] = [];
      recorder.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };

      await new Promise<void>(resolve => {
        recorder.onstop = () => resolve();
        recorder.start(100);
        sourceNode.start();
        sourceNode.onended = () => recorder.stop();
      });

      await audioCtx.close();

      const blob = new Blob(chunks, { type: mimeType });
      const url = URL.createObjectURL(blob);
      setDubbedTrackUrl(prev => ({ ...prev, [langCode]: url }));
      toast.success(`✓ Dubbed track assembled — ${dubbed.length} segments, ${fmtDuration(lastEndTime)}`);
    } catch (error) {
      console.error('Assembly error:', error);
      toast.error('Failed to assemble dubbed track');
    } finally {
      setIsAssembling(null);
    }
  }, []);

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
            body: JSON.stringify({ text: textToDub, voiceId: dubVoiceId, format: 'mp3' }),
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
    setIsDubbingAll(null);
    toast.success(`✓ Dubbed ${done} segments in ${SUPPORTED_LANGUAGES.find(l => l.code === langCode)?.name}!`);

    // Auto-assemble after all segments are dubbed
    await assembleDubbedTrack(langCode, updatedSubtitles);
  }, [subtitles, onSubtitlesUpdate, dubVoiceId, assembleDubbedTrack]);

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

  // ─── Caption Burn (Canvas API + Audio) ───────────────────────────────────

  const burnCaptionsOnVideo = useCallback(async () => {
    if (!burnVideoFile) { toast.error('Select a video file to burn captions on'); return; }
    if (subtitles.length === 0) { toast.error('No subtitles to burn'); return; }

    setIsBurning(true);
    setBurnProgress(0);

    try {
      const video = document.createElement('video');
      video.src = URL.createObjectURL(burnVideoFile);
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

      // ── Audio capture — use dubbed track if available, else original video audio ──
      let combinedStream: MediaStream;
      const hasDubbedTrack = burnLang && dubbedTrackUrl[burnLang];

      try {
        const audioCtx = new AudioContext();
        let audioSource: MediaElementAudioSourceNode;

        if (hasDubbedTrack) {
          // Use dubbed audio element — mute original video
          video.muted = true;
          const dubbedAudio = document.createElement('audio');
          dubbedAudio.src = dubbedTrackUrl[burnLang!];
          dubbedAudio.crossOrigin = 'anonymous';
          await new Promise<void>(r => { dubbedAudio.oncanplay = () => r(); dubbedAudio.load(); setTimeout(r, 3000); });
          audioSource = audioCtx.createMediaElementSource(dubbedAudio);
          // Sync play with video
          video.onplay = () => dubbedAudio.play();
          video.onpause = () => dubbedAudio.pause();
          video.onseeked = () => { dubbedAudio.currentTime = video.currentTime; };
        } else {
          audioSource = audioCtx.createMediaElementSource(video);
        }

        const dest = audioCtx.createMediaStreamDestination();
        audioSource.connect(dest);
        audioSource.connect(audioCtx.destination);
        const videoStream = canvas.captureStream(30);
        combinedStream = new MediaStream([
          ...videoStream.getVideoTracks(),
          ...dest.stream.getAudioTracks(),
        ]);
      } catch {
        // Fallback: video-only if AudioContext fails
        combinedStream = canvas.captureStream(30);
      }

      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
        ? 'video/webm;codecs=vp9,opus'
        : MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
          ? 'video/webm;codecs=vp9'
          : 'video/webm';

      const recorder = new MediaRecorder(combinedStream, { mimeType });
      const chunks: Blob[] = [];
      recorder.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };

      const recordingDone = new Promise<void>(resolve => { recorder.onstop = () => resolve(); });

      const fadeMs = FADE_MS_MAP[captionStyle.speed];

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
          const alpha = computeFadeAlpha(t, activeSeg, fadeMs);
          drawCaptionText(ctx, text, captionStyle, canvas.width, canvas.height, alpha);
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
      a.download = `captioned_video_${burnLang || 'original'}${hasDubbedTrack ? '_dubbed' : ''}.webm`;
      a.click();
      URL.revokeObjectURL(video.src);

      toast.success(`✓ ${hasDubbedTrack ? 'Dubbed + captioned' : 'Captioned'} video downloaded!`);
    } catch (error) {
      console.error('Burn error:', error);
      toast.error(error instanceof Error ? error.message : 'Burn failed');
    } finally {
      setIsBurning(false);
      setBurnProgress(0);
    }
  }, [burnVideoFile, subtitles, captionStyle, burnLang, dubbedTrackUrl]);

  // ─── Preview controls ─────────────────────────────────────────────────────

  const togglePreviewPlay = () => {
    const v = previewVideoRef.current;
    const a = dubbedAudioRef.current;
    if (!v) return;
    if (v.paused) {
      v.play();
      if (a) { a.currentTime = v.currentTime; a.play(); }
      setPreviewPlaying(true);
    } else {
      v.pause();
      a?.pause();
      setPreviewPlaying(false);
    }
  };

  const seekPreview = (delta: number) => {
    const v = previewVideoRef.current;
    const a = dubbedAudioRef.current;
    if (!v) return;
    const t = Math.max(0, Math.min(v.duration || 0, v.currentTime + delta));
    v.currentTime = t;
    if (a) a.currentTime = t;
  };

  // ─── Derived values ───────────────────────────────────────────────────────

  const selectedLangInfo = SUPPORTED_LANGUAGES.find(l => l.code === selectedLang);
  const translatedLangs = [...new Set(subtitles.flatMap(s => Object.keys(s.translations || {})))];
  const isVideoFile = uploadedFile?.type?.startsWith('video/');
  const previewSource = burnVideoFile || (isVideoFile ? uploadedFile : null);

  const TABS = [
    { id: 'upload', label: 'Upload', icon: Upload },
    { id: 'transcribe', label: 'Transcribe', icon: Wand2 },
    { id: 'translate', label: 'Translate', icon: Languages },
    { id: 'style', label: 'Style', icon: Palette },
    { id: 'preview', label: 'Preview', icon: Play },
    { id: 'export', label: 'Export', icon: Download },
  ] as const;

  // ─── Render ───────────────────────────────────────────────────────────────

  // Step indicator
  const steps = [
    { id: 'upload',     label: 'Upload',     icon: Upload,    done: !!uploadedFile },
    { id: 'transcribe', label: 'Transcribe', icon: Wand2,     done: subtitles.length > 0 },
    { id: 'translate',  label: 'Translate',  icon: Languages, done: translatedLangs.length > 0 },
    { id: 'style',      label: 'Style',      icon: Palette,   done: false },
    { id: 'export',     label: 'Export',     icon: Download,  done: false },
  ];

  return (
    <div className="flex flex-col h-full bg-slate-900/30">
      {/* Linear step indicator */}
      <div className="flex-shrink-0 px-3 py-2 border-b border-slate-700/50 bg-slate-900/60 flex items-center gap-1 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
        {steps.map((step, idx) => {
          const Icon = step.icon;
          const isActive = activeTab === step.id;
          const isPast = step.done;
          return (
            <React.Fragment key={step.id}>
              <button
                onClick={() => setActiveTab(step.id as typeof activeTab)}
                className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-semibold whitespace-nowrap transition-all flex-shrink-0 ${
                  isActive
                    ? 'bg-amber-500 text-black'
                    : isPast
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                {isPast && !isActive ? <Check className="w-3 h-3" /> : <Icon className="w-3 h-3" />}
                {step.label}
              </button>
              {idx < steps.length - 1 && (
                <div className={`flex-shrink-0 w-3 h-px ${isPast ? 'bg-emerald-500/60' : 'bg-slate-700'}`} />
              )}
            </React.Fragment>
          );
        })}
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
                        {SUPPORTED_LANGUAGES.map(lang => (
                          <button
                            key={lang.code}
                            onClick={() => { setSelectedLang(lang.code); setShowLangGrid(false); }}
                            className={`flex items-center gap-1.5 px-2 py-1.5 rounded text-xs transition-colors ${
                              selectedLang === lang.code
                                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                                : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
                            }`}
                          >
                            <span>{FLAG_EMOJIS[lang.code] || '🌐'}</span>
                            <span className="truncate">{lang.name}</span>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {QUICK_LANGS.map(lc => {
                          const li = SUPPORTED_LANGUAGES.find(l => l.code === lc);
                          return (
                            <button
                              key={lc}
                              onClick={() => setSelectedLang(lc)}
                              className={`px-2 py-1 rounded text-xs transition-colors ${
                                selectedLang === lc
                                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                                  : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
                              }`}
                            >
                              {FLAG_EMOJIS[lc]} {li?.name}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <Button
                    onClick={handleTranslate}
                    disabled={isTranslating || !selectedLang}
                    className="w-full bg-amber-500 hover:bg-amber-400 text-black font-semibold"
                  >
                    {isTranslating ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Translating…</>
                    ) : (
                      <><Languages className="w-4 h-4 mr-2" />Translate All Segments</>
                    )}
                  </Button>

                  {/* Voice picker + Dub all button */}
                  {selectedLang && subtitles.some(s => s.translations?.[selectedLang]) && (
                    <div className="space-y-2">
                      {/* Voice selector */}
                      <div className="bg-slate-800/50 rounded-lg p-2.5 border border-slate-700">
                        <p className="text-[10px] text-slate-400 mb-1.5 font-medium">Dubbing Voice</p>
                        <select
                          value={dubVoiceId}
                          onChange={e => setDubVoiceId(e.target.value)}
                          className="w-full bg-slate-700 text-white text-xs rounded px-2 py-1.5 border border-slate-600 focus:outline-none focus:border-purple-400"
                        >
                          {VOICE_OPTIONS.map(v => (
                            <option key={v.id} value={v.id}>
                              {v.name} ({v.gender})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Dub All */}
                      <Button
                        onClick={() => handleDubAll(selectedLang)}
                        disabled={!!isDubbingAll || !!isAssembling}
                        variant="outline"
                        className="w-full border-purple-500/40 text-purple-400 hover:bg-purple-500/10 text-xs h-8"
                      >
                        {isDubbingAll === selectedLang ? (
                          <><Loader2 className="w-3 h-3 mr-1.5 animate-spin" />Dubbing all segments…</>
                        ) : isAssembling === selectedLang ? (
                          <><Loader2 className="w-3 h-3 mr-1.5 animate-spin" />Assembling track…</>
                        ) : (
                          <><Volume2 className="w-3 h-3 mr-1.5" />Dub All in {SUPPORTED_LANGUAGES.find(l => l.code === selectedLang)?.name}</>
                        )}
                      </Button>
                    </div>
                  )}

                  {/* Dubbed track status cards */}
                  {Object.entries(dubbedTrackUrl).map(([lc, trackUrl]) => {
                    const li = SUPPORTED_LANGUAGES.find(l => l.code === lc);
                    const segsForLang = subtitles.filter(s => s.dubbedAudioUrl?.[lc]);
                    const duration = segsForLang.length > 0 ? Math.max(...segsForLang.map(s => s.endTime)) : 0;
                    return (
                      <div key={lc} className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-3 space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-base">{FLAG_EMOJIS[lc] || '🌐'}</span>
                          <div className="flex-1">
                            <p className="text-xs text-purple-300 font-medium">{li?.name} Dubbed Track</p>
                            <p className="text-[10px] text-slate-400">✓ Assembled — {segsForLang.length} segments, {fmtDuration(duration)}</p>
                          </div>
                        </div>
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => { const a = new Audio(trackUrl); a.play(); }}
                            className="flex-1 flex items-center justify-center gap-1 py-1 rounded text-[10px] bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 transition-colors"
                          >
                            <Play className="w-2.5 h-2.5" />Play
                          </button>
                          <a
                            href={trackUrl}
                            download={`dubbed_${lc}.webm`}
                            className="flex-1 flex items-center justify-center gap-1 py-1 rounded text-[10px] bg-slate-700 text-slate-300 hover:bg-slate-600 transition-colors"
                          >
                            <Download className="w-2.5 h-2.5" />Download
                          </a>
                          <button
                            onClick={() => { setBurnLang(lc); setActiveTab('preview'); }}
                            className="flex-1 flex items-center justify-center gap-1 py-1 rounded text-[10px] bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 transition-colors"
                          >
                            <Film className="w-2.5 h-2.5" />Preview
                          </button>
                        </div>
                      </div>
                    );
                  })}

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
              {/* Static preview */}
              <div className="relative w-full rounded-xl overflow-hidden bg-black" style={{ aspectRatio: '16/9' }}>
                <div className="absolute inset-0 bg-gradient-to-b from-slate-800 to-slate-900 flex items-center justify-center">
                  <Film className="w-8 h-8 text-slate-700" />
                </div>
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
                      fontSize: `${Math.max(10, captionStyle.fontSize * 0.45)}px`,
                      color: captionStyle.color,
                      backgroundColor: captionStyle.preset !== 'clean' && captionStyle.bgOpacity > 0
                        ? captionStyle.bgColor + Math.round(captionStyle.bgOpacity / 100 * 255).toString(16).padStart(2, '0')
                        : 'transparent',
                      padding: captionStyle.preset !== 'clean' ? '2px 8px' : '0',
                      borderRadius: '4px',
                      textShadow: captionStyle.outlineWidth > 0 ? 'none' : '1px 1px 3px rgba(0,0,0,0.8)',
                      WebkitTextStroke: captionStyle.outlineWidth > 0 ? `${captionStyle.outlineWidth}px ${captionStyle.outlineColor}` : 'none',
                      fontWeight: captionStyle.fontWeight,
                      fontFamily: captionStyle.fontFamily,
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

              {/* Font family */}
              <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
                <p className="text-xs text-slate-400 font-medium mb-2">Font Family</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {FONT_FAMILIES.map(ff => (
                    <button
                      key={ff}
                      onClick={() => setCaptionStyle(p => ({ ...p, fontFamily: ff }))}
                      className={`py-2 px-2 rounded text-xs transition-colors ${
                        captionStyle.fontFamily === ff
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                          : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700 border border-transparent'
                      }`}
                      style={{ fontFamily: ff }}
                    >
                      {ff}
                    </button>
                  ))}
                </div>
              </div>

              {/* Font size + weight */}
              <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700 space-y-3">
                <div>
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
                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-400">Bold Text</p>
                  <button
                    onClick={() => setCaptionStyle(p => ({ ...p, fontWeight: p.fontWeight === 'bold' ? 'normal' : 'bold' }))}
                    className={`px-3 py-1 rounded text-xs font-bold transition-colors ${
                      captionStyle.fontWeight === 'bold'
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                        : 'bg-slate-700 text-slate-400 border border-transparent'
                    }`}
                  >
                    B
                  </button>
                </div>
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
                  <label className="flex-1">
                    <p className="text-[10px] text-slate-500 mb-1">Outline</p>
                    <input
                      type="color"
                      value={captionStyle.outlineColor}
                      onChange={e => setCaptionStyle(p => ({ ...p, outlineColor: e.target.value }))}
                      className="w-full h-8 rounded cursor-pointer border border-slate-600"
                    />
                  </label>
                </div>
              </div>

              {/* BG Opacity */}
              <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
                <div className="flex justify-between mb-2">
                  <p className="text-xs text-slate-400">Background Opacity</p>
                  <p className="text-xs text-amber-400 font-mono">{captionStyle.bgOpacity}%</p>
                </div>
                <Slider
                  min={0} max={100} step={5}
                  value={[captionStyle.bgOpacity]}
                  onValueChange={([v]) => setCaptionStyle(p => ({ ...p, bgOpacity: v }))}
                  className="py-1"
                />
              </div>

              {/* Outline width */}
              <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
                <div className="flex justify-between mb-2">
                  <p className="text-xs text-slate-400">Text Outline Width</p>
                  <p className="text-xs text-amber-400 font-mono">{captionStyle.outlineWidth}px</p>
                </div>
                <Slider
                  min={0} max={4} step={0.5}
                  value={[captionStyle.outlineWidth]}
                  onValueChange={([v]) => setCaptionStyle(p => ({ ...p, outlineWidth: v }))}
                  className="py-1"
                />
              </div>

              {/* Speed */}
              <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
                <p className="text-xs text-slate-400 font-medium mb-2">Fade-In/Out Animation</p>
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
                      <span className="block text-[9px] opacity-60">
                        {speed === 'slow' ? '600ms' : speed === 'normal' ? '300ms' : '80ms'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <Button
                onClick={() => setActiveTab('preview')}
                className="w-full bg-amber-500 hover:bg-amber-400 text-black font-semibold"
              >
                <Play className="w-4 h-4 mr-2" />Preview with Live Video →
              </Button>
            </div>
          )}

          {/* ═══ PREVIEW TAB ═══ */}
          {activeTab === 'preview' && (
            <div className="space-y-3">
              {/* Video source picker if no video file */}
              {!previewSource && (
                <div
                  onClick={() => burnFileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-600 hover:border-amber-400/50 rounded-xl p-5 text-center cursor-pointer transition-colors bg-slate-800/30"
                >
                  <Film className="w-6 h-6 mx-auto mb-2 text-slate-500" />
                  <p className="text-sm text-slate-300 font-medium">Select video to preview captions on</p>
                  <p className="text-xs text-slate-500 mt-1">MP4, MOV, WebM</p>
                </div>
              )}

              {/* Language selector for preview */}
              {translatedLangs.length > 0 && (
                <div className="bg-slate-800/50 rounded-lg p-2 border border-slate-700">
                  <p className="text-[10px] text-slate-400 mb-1.5">Preview language</p>
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

              {/* Video + canvas overlay */}
              {previewSource && (
                <div className="space-y-2">
                  <div className="relative w-full rounded-xl overflow-hidden bg-black" style={{ aspectRatio: '16/9' }}>
                    <video
                      ref={previewVideoRef}
                      src={URL.createObjectURL(previewSource)}
                      className="w-full h-full object-contain"
                      onLoadedMetadata={e => {
                        const v = e.currentTarget;
                        setPreviewDuration(v.duration);
                        const canvas = previewCanvasRef.current;
                        if (canvas) {
                          canvas.width = v.videoWidth || 1280;
                          canvas.height = v.videoHeight || 720;
                        }
                      }}
                      onTimeUpdate={e => setPreviewTime(e.currentTarget.currentTime)}
                      onPlay={() => setPreviewPlaying(true)}
                      onPause={() => setPreviewPlaying(false)}
                      onEnded={() => setPreviewPlaying(false)}
                     />
                    {/* Hidden dubbed audio element — synced to video */}
                    {burnLang && dubbedTrackUrl[burnLang] && (
                      <audio
                        ref={dubbedAudioRef}
                        src={dubbedTrackUrl[burnLang]}
                        style={{ display: 'none' }}
                      />
                    )}
                    <canvas
                      ref={previewCanvasRef}
                      className="absolute inset-0 w-full h-full pointer-events-none"
                      style={{ objectFit: 'contain' }}
                    />
                  </div>

                  {/* Playback controls */}
                  <div className="bg-slate-800/60 rounded-lg p-2 border border-slate-700 space-y-2">
                    {/* Seek bar */}
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-400 font-mono w-10 text-right">{fmtDuration(previewTime)}</span>
                      <input
                        type="range"
                        min={0}
                        max={previewDuration || 100}
                        step={0.1}
                        value={previewTime}
                        onChange={e => {
                          const v = previewVideoRef.current;
                          const a = dubbedAudioRef.current;
                          const t = Number(e.target.value);
                          if (v) v.currentTime = t;
                          if (a) a.currentTime = t;
                        }}
                        className="flex-1 h-1 accent-amber-400 cursor-pointer"
                      />
                      <span className="text-[10px] text-slate-400 font-mono w-10">{fmtDuration(previewDuration)}</span>
                    </div>

                    {/* Buttons */}
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => seekPreview(-5)}
                        className="p-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors"
                        title="-5s"
                      >
                        <SkipBack className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={togglePreviewPlay}
                        className="p-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black transition-colors"
                      >
                        {previewPlaying
                          ? <Pause className="w-4 h-4" />
                          : <Play className="w-4 h-4" />
                        }
                      </button>
                      <button
                        onClick={() => seekPreview(5)}
                        className="p-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors"
                        title="+5s"
                      >
                        <SkipForward className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Active caption indicator */}
                  {(() => {
                    const activeSeg = subtitles.find(s => previewTime >= s.startTime && previewTime <= s.endTime);
                    const activeText = activeSeg
                      ? (burnLang && activeSeg.translations?.[burnLang]) || activeSeg.text
                      : null;
                    return activeText ? (
                      <div className="bg-slate-800/60 rounded-lg px-3 py-2 border border-amber-500/20 text-center">
                        <p className="text-[10px] text-amber-400/60 mb-0.5">Now showing</p>
                        <p className="text-xs text-white" dir={isRTLText(activeText) ? 'rtl' : 'ltr'}>{activeText}</p>
                      </div>
                    ) : null;
                  })()}

                  <p className="text-[10px] text-slate-600 text-center">
                    Canvas overlay shows exactly how burned video will look
                  </p>
                </div>
              )}

              {subtitles.length === 0 && (
                <div className="text-center py-4">
                  <p className="text-slate-400 text-sm mb-2">No subtitles yet</p>
                  <Button size="sm" onClick={() => setActiveTab('transcribe')} className="bg-slate-700 hover:bg-slate-600 text-white">
                    Go to Transcribe
                  </Button>
                </div>
              )}

              <Button
                onClick={() => setActiveTab('export')}
                className="w-full bg-amber-500 hover:bg-amber-400 text-black font-semibold"
              >
                <Download className="w-4 h-4 mr-2" />Looks good → Export →
              </Button>
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
                      Bakes captions permanently into the video with your Style settings + audio preserved.
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
                    <p className="text-[10px] text-slate-600 text-center">Client-side rendering — audio included — no upload needed</p>
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
