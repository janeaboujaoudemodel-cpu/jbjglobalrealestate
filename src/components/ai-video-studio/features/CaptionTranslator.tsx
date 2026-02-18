import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';
import { 
  Wand2, 
  Loader2, 
  Languages, 
  Download,
  Upload,
  Trash2,
  Volume2,
  FileText,
  Palette,
  Zap,
  ChevronDown,
  ChevronUp,
  Check,
  X
} from 'lucide-react';
import { SUPPORTED_LANGUAGES, SUBTITLE_STYLES } from '../types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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

const FLAG_EMOJIS: Record<string, string> = {
  en: '🇬🇧', ar: '🇸🇦', hi: '🇮🇳', ur: '🇵🇰', zh: '🇨🇳',
  es: '🇪🇸', fr: '🇫🇷', de: '🇩🇪', ru: '🇷🇺', pt: '🇵🇹',
  ja: '🇯🇵', ko: '🇰🇷', it: '🇮🇹', nl: '🇳🇱', tr: '🇹🇷',
  fa: '🇮🇷', he: '🇮🇱', pl: '🇵🇱', th: '🇹🇭', vi: '🇻🇳',
  id: '🇮🇩', ms: '🇲🇾', tl: '🇵🇭', bn: '🇧🇩', ta: '🇱🇰',
  te: '🇮🇳', ml: '🇮🇳', sw: '🇰🇪',
};

const toSRTTime = (seconds: number): string => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')},${ms.toString().padStart(3, '0')}`;
};

const toVTTTime = (seconds: number): string => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
};

const formatDisplayTime = (seconds: number): string => {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 100);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
};

export function CaptionTranslator({ 
  subtitles, 
  onSubtitlesUpdate,
  onTranscribe 
}: CaptionTranslatorProps) {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcribeProgress, setTranscribeProgress] = useState(0);
  const [transcribeStage, setTranscribeStage] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [selectedLang, setSelectedLang] = useState<string>('');
  const [isDubbing, setIsDubbing] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [editingTranslationId, setEditingTranslationId] = useState<string | null>(null);
  const [editingTranslationText, setEditingTranslationText] = useState('');
  const [showStylePanel, setShowStylePanel] = useState(false);
  const [showLangGrid, setShowLangGrid] = useState(false);
  const [activeTab, setActiveTab] = useState<'upload' | 'transcribe' | 'translate' | 'style' | 'export'>('upload');
  const [captionStyle, setCaptionStyle] = useState<CaptionStyle>({
    fontSize: 24,
    color: '#FFFFFF',
    bgColor: '#000000',
    position: 'bottom',
    preset: 'clean',
    speed: 'normal',
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const handleFileSelect = useCallback((file: File) => {
    setUploadedFile(file);
    setActiveTab('transcribe');
    toast.success(`Loaded: ${file.name} (${(file.size / 1024 / 1024).toFixed(1)}MB)`);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  }, [handleFileSelect]);

  const handleTranscribe = useCallback(async () => {
    if (!uploadedFile) {
      toast.error('Please upload a media file first');
      return;
    }

    setIsTranscribing(true);
    setTranscribeProgress(0);
    setTranscribeStage('Reading file...');

    try {
      // Stage 1: Read file
      setTranscribeProgress(15);
      const arrayBuffer = await uploadedFile.arrayBuffer();
      
      setTranscribeStage('Encoding...');
      setTranscribeProgress(30);

      // Convert to base64
      const uint8Array = new Uint8Array(arrayBuffer);
      let binary = '';
      const chunkSize = 8192;
      for (let i = 0; i < uint8Array.length; i += chunkSize) {
        const chunk = uint8Array.subarray(i, i + chunkSize);
        binary += String.fromCharCode(...chunk);
      }
      const base64Audio = btoa(binary);

      setTranscribeStage('Transcribing with AI...');
      setTranscribeProgress(50);

      // Call the voice-to-text edge function
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/voice-to-text`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            'Authorization': `Bearer ${token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ audio: base64Audio, language: 'en' }),
        }
      );

      setTranscribeProgress(80);
      setTranscribeStage('Processing results...');

      if (!response.ok) {
        throw new Error(`Transcription failed: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      const transcribedText: string = data.text || '';

      if (!transcribedText) {
        toast.error('No speech detected in the file');
        return;
      }

      // Split into segments (approx 5 seconds each based on word count)
      const words = transcribedText.split(' ').filter(w => w.trim());
      const wordsPerSegment = 12;
      const secondsPerWord = 0.4;
      const segments: SubtitleSegment[] = [];

      for (let i = 0; i < words.length; i += wordsPerSegment) {
        const segWords = words.slice(i, i + wordsPerSegment);
        const startTime = i * secondsPerWord;
        const endTime = startTime + segWords.length * secondsPerWord;
        segments.push({
          id: crypto.randomUUID(),
          startTime,
          endTime,
          text: segWords.join(' '),
          language: 'en',
        });
      }

      setTranscribeProgress(100);
      setTranscribeStage('Done!');
      onSubtitlesUpdate(segments);
      setActiveTab('translate');
      toast.success(`Transcribed ${segments.length} segments`);
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
  }, [uploadedFile, onSubtitlesUpdate]);

  const handleTranslate = useCallback(async () => {
    if (!selectedLang) {
      toast.error('Please select a language');
      return;
    }
    if (subtitles.length === 0) {
      toast.error('No subtitles to translate');
      return;
    }

    setIsTranslating(true);
    try {
      const textsToTranslate = subtitles.map(s => s.text);

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/auto-translate`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ texts: textsToTranslate, targetLang: selectedLang }),
        }
      );

      if (!response.ok) throw new Error('Translation failed');

      const data = await response.json();
      const translations: string[] = data.translations || [];

      const updated = subtitles.map((sub, idx) => ({
        ...sub,
        translations: {
          ...sub.translations,
          [selectedLang]: translations[idx] || sub.text,
        },
      }));

      onSubtitlesUpdate(updated);
      toast.success(`Translated to ${SUPPORTED_LANGUAGES.find(l => l.code === selectedLang)?.name}`);
    } catch (error) {
      toast.error('Translation failed');
    } finally {
      setIsTranslating(false);
    }
  }, [selectedLang, subtitles, onSubtitlesUpdate]);

  const handleDubSegment = useCallback(async (segmentId: string, langCode: string) => {
    const segment = subtitles.find(s => s.id === segmentId);
    if (!segment) return;

    const textToDub = segment.translations?.[langCode] || segment.text;
    setIsDubbing(segmentId + langCode);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;

      if (!token) {
        toast.error('Please sign in to use voice dubbing');
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/voice-studio-tts`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            text: textToDub,
            voiceId: 'JBFqnCBsd6RMkjVDRZzb', // George voice
            format: 'mp3',
          }),
        }
      );

      if (!response.ok) throw new Error('Dubbing failed');

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);

      const updated = subtitles.map(s =>
        s.id === segmentId
          ? { ...s, dubbedAudioUrl: { ...s.dubbedAudioUrl, [langCode]: audioUrl } }
          : s
      );
      onSubtitlesUpdate(updated);
      toast.success('Dubbed audio ready!');
    } catch (error) {
      toast.error('Voice dubbing failed');
    } finally {
      setIsDubbing(null);
    }
  }, [subtitles, onSubtitlesUpdate]);

  const startEditSegment = (sub: SubtitleSegment) => {
    setEditingId(sub.id);
    setEditingText(sub.text);
  };

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
      s.id === subId
        ? { ...s, translations: { ...s.translations, [langCode]: editingTranslationText } }
        : s
    ));
    setEditingTranslationId(null);
  };

  const deleteSegment = (id: string) => {
    onSubtitlesUpdate(subtitles.filter(s => s.id !== id));
  };

  const exportSRT = useCallback((langCode?: string) => {
    if (subtitles.length === 0) { toast.error('No subtitles to export'); return; }
    let srt = '';
    subtitles.forEach((sub, idx) => {
      const text = langCode && sub.translations?.[langCode] ? sub.translations[langCode] : sub.text;
      srt += `${idx + 1}\n${toSRTTime(sub.startTime)} --> ${toSRTTime(sub.endTime)}\n${text}\n\n`;
    });
    const blob = new Blob([srt], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = langCode ? `subtitles_${langCode}.srt` : 'subtitles.srt';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('SRT exported!');
  }, [subtitles]);

  const exportVTT = useCallback((langCode?: string) => {
    if (subtitles.length === 0) { toast.error('No subtitles to export'); return; }
    let vtt = 'WEBVTT\n\n';
    subtitles.forEach((sub, idx) => {
      const text = langCode && sub.translations?.[langCode] ? sub.translations[langCode] : sub.text;
      vtt += `${idx + 1}\n${toVTTTime(sub.startTime)} --> ${toVTTTime(sub.endTime)}\n${text}\n\n`;
    });
    const blob = new Blob([vtt], { type: 'text/vtt' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = langCode ? `subtitles_${langCode}.vtt` : 'subtitles.vtt';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('VTT exported!');
  }, [subtitles]);

  const TABS = [
    { id: 'upload', label: 'Upload', icon: Upload },
    { id: 'transcribe', label: 'Transcribe', icon: Wand2 },
    { id: 'translate', label: 'Translate', icon: Languages },
    { id: 'style', label: 'Style', icon: Palette },
    { id: 'export', label: 'Export', icon: Download },
  ] as const;

  const selectedLangInfo = SUPPORTED_LANGUAGES.find(l => l.code === selectedLang);

  return (
    <div className="flex flex-col h-full bg-slate-900/30">
      {/* Step tabs */}
      <div className="flex border-b border-slate-700/50 bg-slate-900/60 px-1 pt-1 gap-0.5 flex-shrink-0">
        {TABS.map((tab) => (
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

          {/* ─── UPLOAD TAB ─── */}
          {activeTab === 'upload' && (
            <div className="space-y-3">
              <div
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-600 hover:border-amber-400/50 rounded-xl p-6 text-center cursor-pointer transition-colors bg-slate-800/30"
              >
                <Upload className="w-8 h-8 mx-auto mb-2 text-slate-500" />
                <p className="text-sm text-slate-300 font-medium">Drop audio or video file here</p>
                <p className="text-xs text-slate-500 mt-1">MP3, WAV, M4A, MP4, MOV, WebM</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*,video/*"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
              />

              {uploadedFile && (
                <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-amber-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">{uploadedFile.name}</p>
                      <p className="text-xs text-slate-400">{(uploadedFile.size / 1024 / 1024).toFixed(1)} MB</p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => { setUploadedFile(null); setActiveTab('upload'); }}
                      variant="ghost"
                      className="text-slate-500 hover:text-red-400 h-7 w-7 p-0 flex-shrink-0"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                  {uploadedFile.size > 25 * 1024 * 1024 && (
                    <p className="text-xs text-amber-400 mt-2">⚠ Large file — processing may take longer</p>
                  )}
                </div>
              )}

              <Button
                onClick={() => setActiveTab('transcribe')}
                disabled={!uploadedFile}
                className="w-full bg-amber-500 hover:bg-amber-400 text-black font-semibold"
              >
                Continue to Transcribe →
              </Button>
            </div>
          )}

          {/* ─── TRANSCRIBE TAB ─── */}
          {activeTab === 'transcribe' && (
            <div className="space-y-3">
              {!uploadedFile && (
                <div className="text-center py-4">
                  <p className="text-slate-400 text-sm mb-2">No file uploaded yet</p>
                  <Button size="sm" onClick={() => setActiveTab('upload')} className="bg-slate-700 hover:bg-slate-600 text-white">
                    Upload File
                  </Button>
                </div>
              )}

              {uploadedFile && (
                <>
                  <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
                    <p className="text-xs text-slate-400 truncate">{uploadedFile.name}</p>
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

                  <Button
                    onClick={handleTranscribe}
                    disabled={isTranscribing}
                    className="w-full bg-amber-500 hover:bg-amber-400 text-black font-semibold"
                  >
                    {isTranscribing ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Transcribing...</>
                    ) : (
                      <><Wand2 className="w-4 h-4 mr-2" />Start Transcription</>
                    )}
                  </Button>
                </>
              )}

              {/* Editable segments */}
              {subtitles.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs text-slate-400 font-medium">{subtitles.length} segments — click text to edit</p>
                  {subtitles.map((sub) => (
                    <div key={sub.id} className="bg-slate-800/60 rounded-lg p-2 border border-slate-700/50">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] text-slate-500 font-mono">
                          {formatDisplayTime(sub.startTime)} → {formatDisplayTime(sub.endTime)}
                        </span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteSegment(sub.id)}
                          className="h-5 w-5 p-0 text-slate-600 hover:text-red-400"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                      {editingId === sub.id ? (
                        <div className="space-y-1">
                          <textarea
                            value={editingText}
                            onChange={(e) => setEditingText(e.target.value)}
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

          {/* ─── TRANSLATE TAB ─── */}
          {activeTab === 'translate' && (
            <div className="space-y-3">
              {subtitles.length === 0 && (
                <div className="text-center py-4">
                  <p className="text-slate-400 text-sm mb-2">Transcribe your media first</p>
                  <Button size="sm" onClick={() => setActiveTab('transcribe')} className="bg-slate-700 hover:bg-slate-600 text-white">
                    Go to Transcribe
                  </Button>
                </div>
              )}

              {subtitles.length > 0 && (
                <>
                  {/* Language selector */}
                  <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs text-slate-400 font-medium">Select target language</p>
                      <button
                        onClick={() => setShowLangGrid(!showLangGrid)}
                        className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1"
                      >
                        {showLangGrid ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        {showLangGrid ? 'Hide' : 'Show all'}
                      </button>
                    </div>

                    {selectedLang && (
                      <div className="flex items-center gap-2 mb-2 bg-amber-500/10 rounded-lg px-3 py-1.5 border border-amber-500/30">
                        <span className="text-lg">{FLAG_EMOJIS[selectedLang] || '🌐'}</span>
                        <span className="text-sm font-medium text-amber-400">
                          {SUPPORTED_LANGUAGES.find(l => l.code === selectedLang)?.name}
                        </span>
                        <button onClick={() => setSelectedLang('')} className="ml-auto text-slate-500 hover:text-red-400">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    )}

                    {showLangGrid && (
                      <div className="grid grid-cols-2 gap-1 max-h-48 overflow-y-auto">
                        {SUPPORTED_LANGUAGES.filter(l => l.code !== 'en').map((lang) => (
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
                    )}

                    {!showLangGrid && !selectedLang && (
                      <div className="flex flex-wrap gap-1">
                        {['ar', 'hi', 'zh', 'es', 'fr', 'de', 'ru', 'tr', 'ja', 'ko'].map(code => {
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
                    )}
                  </div>

                  <Button
                    onClick={handleTranslate}
                    disabled={isTranslating || !selectedLang}
                    className="w-full bg-amber-500 hover:bg-amber-400 text-black font-semibold"
                  >
                    {isTranslating ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Translating...</>
                    ) : (
                      <><Languages className="w-4 h-4 mr-2" />Translate{selectedLang ? ` to ${selectedLangInfo?.name}` : ''}</>
                    )}
                  </Button>

                  {/* Translated segments */}
                  {subtitles.some(s => s.translations && Object.keys(s.translations).length > 0) && (
                    <div className="space-y-2">
                      <p className="text-xs text-slate-400 font-medium">Translations — click to edit</p>
                      {subtitles.map((sub) => {
                        const translatedLangs = Object.keys(sub.translations || {});
                        if (translatedLangs.length === 0) return null;
                        return (
                          <div key={sub.id} className="bg-slate-800/60 rounded-lg p-2 border border-slate-700/50">
                            <p className="text-[10px] text-slate-500 font-mono mb-1">
                              {formatDisplayTime(sub.startTime)} → {formatDisplayTime(sub.endTime)}
                            </p>
                            <p className="text-xs text-slate-400 mb-2">{sub.text}</p>
                            {translatedLangs.map(langCode => {
                              const langInfo = SUPPORTED_LANGUAGES.find(l => l.code === langCode);
                              const translationText = sub.translations![langCode];
                              const editKey = sub.id + langCode;
                              const isRTL = langInfo?.rtl ?? false;
                              return (
                                <div key={langCode} className="mt-1 bg-slate-700/30 rounded p-2 space-y-1">
                                  <div className="flex items-center justify-between">
                                    <span className="text-[10px] text-slate-500">
                                      {FLAG_EMOJIS[langCode] || '🌐'} {langInfo?.name}
                                    </span>
                                    <div className="flex gap-1">
                                      {/* Dub audio button */}
                                      <button
                                        onClick={() => handleDubSegment(sub.id, langCode)}
                                        disabled={isDubbing === sub.id + langCode}
                                        className="text-[10px] text-purple-400 hover:text-purple-300 flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-purple-500/10 hover:bg-purple-500/20 transition-colors"
                                      >
                                        {isDubbing === sub.id + langCode ? (
                                          <Loader2 className="w-2.5 h-2.5 animate-spin" />
                                        ) : (
                                          <Volume2 className="w-2.5 h-2.5" />
                                        )}
                                        Dub
                                      </button>
                                    </div>
                                  </div>
                                  {editingTranslationId === editKey ? (
                                    <div className="space-y-1">
                                      <textarea
                                        value={editingTranslationText}
                                        onChange={(e) => setEditingTranslationText(e.target.value)}
                                        dir={isRTL ? 'rtl' : 'ltr'}
                                        className={`w-full bg-slate-600 text-white text-xs rounded p-1.5 resize-none border border-amber-400/50 focus:outline-none ${isRTL ? 'text-right' : ''}`}
                                        rows={2}
                                        autoFocus
                                      />
                                      <div className="flex gap-1">
                                        <Button size="sm" onClick={() => saveEditTranslation(sub.id, langCode)} className="h-5 text-[10px] bg-amber-500 text-black px-2">
                                          Save
                                        </Button>
                                        <Button size="sm" variant="ghost" onClick={() => setEditingTranslationId(null)} className="h-5 text-[10px] text-slate-400 px-2">
                                          Cancel
                                        </Button>
                                      </div>
                                    </div>
                                  ) : (
                                    <p
                                      dir={isRTL ? 'rtl' : 'ltr'}
                                      className={`text-xs text-white cursor-pointer hover:text-amber-400 ${isRTL ? 'text-right' : ''}`}
                                      onClick={() => startEditTranslation(sub.id, langCode, translationText)}
                                    >
                                      {translationText}
                                    </p>
                                  )}
                                  {/* Dubbed audio player */}
                                  {sub.dubbedAudioUrl?.[langCode] && (
                                    <audio controls src={sub.dubbedAudioUrl[langCode]} className="w-full h-6 mt-1" style={{ height: '24px' }} />
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

          {/* ─── STYLE TAB ─── */}
          {activeTab === 'style' && (
            <div className="space-y-3">
              {/* Style presets */}
              <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
                <p className="text-xs text-slate-400 font-medium mb-2">Preset</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {SUBTITLE_STYLES.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setCaptionStyle(prev => ({ ...prev, preset: s.id }))}
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
                      onChange={(e) => setCaptionStyle(p => ({ ...p, color: e.target.value }))}
                      className="w-full h-8 rounded cursor-pointer border border-slate-600"
                    />
                  </label>
                  <label className="flex-1">
                    <p className="text-[10px] text-slate-500 mb-1">Background</p>
                    <input
                      type="color"
                      value={captionStyle.bgColor}
                      onChange={(e) => setCaptionStyle(p => ({ ...p, bgColor: e.target.value }))}
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

          {/* ─── EXPORT TAB ─── */}
          {activeTab === 'export' && (
            <div className="space-y-3">
              {subtitles.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-slate-400 text-sm">No subtitles yet — transcribe first</p>
                </div>
              ) : (
                <>
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
                  {(() => {
                    const translatedLangs = [...new Set(subtitles.flatMap(s => Object.keys(s.translations || {})))];
                    if (translatedLangs.length === 0) return null;
                    return (
                      <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
                        <p className="text-xs text-slate-400 font-medium mb-2">Translated exports</p>
                        <div className="space-y-1.5">
                          {translatedLangs.map(langCode => {
                            const langInfo = SUPPORTED_LANGUAGES.find(l => l.code === langCode);
                            return (
                              <div key={langCode} className="flex items-center gap-2">
                                <span className="text-sm">{FLAG_EMOJIS[langCode] || '🌐'}</span>
                                <span className="text-xs text-slate-300 flex-1">{langInfo?.name}</span>
                                <Button size="sm" onClick={() => exportSRT(langCode)} className="h-6 text-xs bg-slate-700 hover:bg-slate-600 text-white px-2">
                                  SRT
                                </Button>
                                <Button size="sm" onClick={() => exportVTT(langCode)} className="h-6 text-xs bg-slate-700 hover:bg-slate-600 text-white px-2">
                                  VTT
                                </Button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}

                  <div className="bg-slate-800/50 rounded-lg p-3 border border-amber-500/20">
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="w-3 h-3 text-amber-400" />
                      <p className="text-xs text-amber-400 font-medium">Burn Captions on Video</p>
                    </div>
                    <p className="text-xs text-slate-500 mb-2">
                      Upload a video to overlay captions. Uses your style settings from the Style tab.
                    </p>
                    <Button
                      size="sm"
                      onClick={() => toast.info('Coming soon: Upload video to burn captions')}
                      className="w-full h-8 text-xs bg-amber-500/10 text-amber-400 border border-amber-500/30 hover:bg-amber-500/20"
                    >
                      Burn Captions on Video (Coming Soon)
                    </Button>
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
