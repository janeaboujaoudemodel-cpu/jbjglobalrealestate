/**
 * Voice & Audio Suite — Premium Overhaul
 * 6 Tabs: Voice Studio | Voice-to-Text | Audio Enhance | Audio Effects | Voice Cloning (Owner) | AI Translation
 * Champagne-gold UI, centered preview, owner-only ElevenLabs, AI Script Writer integration
 */

import React, { lazy, Suspense, useState, useRef, useCallback, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SEOHead } from '@/components/SEOHead';
import {
  Mic, FileAudio, Sparkles, Languages, ArrowLeft, Upload, Play, Pause, Download,
  Loader2, Volume2, Radio, Music, Wand2, Square, Trash2, Copy, SlidersHorizontal,
  AudioWaveform, Crown, Headphones, Settings2, FileDown, Waves, MicVocal,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { audioEnhanceService, EnhanceProgress } from '@/lib/ffmpeg/audioEnhanceService';
import { useAuth } from '@/contexts/AuthContext';
import {
  BROWSER_VOICE_LIBRARY,
  speak,
  stopSpeaking,
  ensureVoicesLoaded,
  downloadScriptAsText,
  estimateDuration,
} from '@/lib/browser-tts';

/* ═══════════════════════════════════════════════════════════
   SHARED COMPONENTS
   ═══════════════════════════════════════════════════════════ */

const LoadingSpinner = () => (
  <div className="min-h-[40vh] flex items-center justify-center">
    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-gold" />
  </div>
);

/** Centered audio preview player used across all tabs */
function CenteredAudioPreview({ src, label, onRemove }: { src: string | null; label?: string; onRemove?: () => void }) {
  if (!src) return null;
  return (
    <div className="mx-auto max-w-xl w-full">
      <div className="rounded-2xl bg-gradient-to-br from-[#1a1708]/80 via-[#1c1a0e]/60 to-[#0d0c08]/80 border border-gold/20 p-5 shadow-[0_0_30px_rgba(212,175,55,0.08)]">
        {label && <p className="text-xs text-gold/70 font-medium mb-3 tracking-wider uppercase">{label}</p>}
        <audio controls src={src} className="w-full [&::-webkit-media-controls-panel]:bg-transparent" />
        {onRemove && (
          <Button variant="ghost" size="sm" onClick={onRemove} className="mt-2 text-red-400/70 hover:text-red-400 hover:bg-red-400/10 text-xs">
            <Trash2 className="w-3 h-3 mr-1" /> Remove
          </Button>
        )}
      </div>
    </div>
  );
}

/** AI Script Writer button — calls ai-agent-script-writer edge function */
function AIScriptWriterButton({ onScriptGenerated, language = 'en' }: { onScriptGenerated: (script: string) => void; language?: string }) {
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [tone, setTone] = useState('professional');
  const [duration, setDuration] = useState(30);
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    if (!prompt.trim()) { toast.error('Enter a prompt'); return; }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-agent-script-writer', {
        body: { prompt, language, tone, duration },
      });
      if (error) throw error;
      if (data?.script) {
        onScriptGenerated(data.script);
        toast.success(`Script generated! ~${data.wordCount} words, ~${data.estimatedDuration}s`);
        setOpen(false);
        setPrompt('');
      }
    } catch (e: any) {
      toast.error(e?.message || 'Script generation failed');
    } finally {
      setLoading(false);
    }
  };

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)} variant="outline" size="sm"
        className="border-gold/30 text-gold hover:bg-gold/10 hover:border-gold/50">
        <Wand2 className="w-3.5 h-3.5 mr-1.5" /> AI Script Writer
      </Button>
    );
  }

  return (
    <Card className="bg-[#0d0c08] border-gold/20">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-gold flex items-center gap-1.5"><Wand2 className="w-4 h-4" /> AI Script Writer</p>
          <Button variant="ghost" size="sm" onClick={() => setOpen(false)} className="text-zinc-500 h-6 w-6 p-0">×</Button>
        </div>
        <Textarea value={prompt} onChange={e => setPrompt(e.target.value)} placeholder="Describe what the script should be about..."
          className="bg-[#1a1708] border-gold/20 text-white placeholder:text-zinc-600 min-h-[60px]" rows={3} />
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-zinc-400 text-xs">Tone</Label>
            <Select value={tone} onValueChange={setTone}>
              <SelectTrigger className="bg-[#1a1708] border-gold/20 text-white h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="professional">Professional</SelectItem>
                <SelectItem value="luxury">Luxury</SelectItem>
                <SelectItem value="energetic">Energetic</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-zinc-400 text-xs">Duration (s)</Label>
            <Input type="number" value={duration} onChange={e => setDuration(Number(e.target.value))} min={10} max={300}
              className="bg-[#1a1708] border-gold/20 text-white h-8 text-xs" />
          </div>
        </div>
        <Button onClick={generate} disabled={loading} className="w-full bg-gold text-black hover:bg-gold/90 h-8 text-xs font-semibold">
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <Wand2 className="w-3.5 h-3.5 mr-1" />}
          Generate Script
        </Button>
      </CardContent>
    </Card>
  );
}

/** Premium section card wrapper */
function SuiteCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <Card className={`bg-gradient-to-br from-[#FDFBF7]/[0.03] via-[#F5F0E6]/[0.02] to-transparent border-gold/15 shadow-[0_4px_20px_rgba(0,0,0,0.3)] ${className}`}>
      {children}
    </Card>
  );
}

/* ═══════════════════════════════════════════════════════════
   TAB 1: VOICE STUDIO (TTS) — Browser for users, ElevenLabs for owner
   ═══════════════════════════════════════════════════════════ */
function VoiceStudioPanel() {
  const { isOwner } = useAuth();
  const [script, setScript] = useState('');
  const [selectedVoice, setSelectedVoice] = useState(BROWSER_VOICE_LIBRARY[0]?.id || 'default');
  const [speed, setSpeed] = useState([1.0]);
  const [pitch, setPitch] = useState([1.0]);
  const [volume, setVolume] = useState([1.0]);
  const [playing, setPlaying] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
  const [outputFormat, setOutputFormat] = useState('mp3');
  const [language, setLanguage] = useState('en');

  // ElevenLabs owner settings
  const [elVoiceId, setElVoiceId] = useState('JBFqnCBsd6RMkjVDRZzb');
  const [stability, setStability] = useState([0.5]);
  const [similarity, setSimilarity] = useState([0.75]);
  const [style, setStyle] = useState([0.3]);

  const ELEVENLABS_VOICES = [
    { id: 'JBFqnCBsd6RMkjVDRZzb', name: 'George', gender: 'Male', accent: 'British' },
    { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Sarah', gender: 'Female', accent: 'American' },
    { id: 'CwhRBWXzGAHq8TQ4Fs17', name: 'Roger', gender: 'Male', accent: 'American' },
    { id: 'FGY2WhTYpPnrIDTdsKH5', name: 'Laura', gender: 'Female', accent: 'American' },
    { id: 'IKne3meq5aSn9XLyUdCD', name: 'Charlie', gender: 'Male', accent: 'Australian' },
    { id: 'TX3LPaxmHKxFdv7VOQHJ', name: 'Liam', gender: 'Male', accent: 'American' },
    { id: 'pFZP5JQG7iQjIQuC4Bku', name: 'Lily', gender: 'Female', accent: 'British' },
    { id: 'onwK4e9ZLuTAKqWW03F9', name: 'Daniel', gender: 'Male', accent: 'British' },
    { id: 'XrExE9yKIg1WjnnlVkGX', name: 'Matilda', gender: 'Female', accent: 'American' },
    { id: 'cgSgspJ2msm6clMCkdW9', name: 'Jessica', gender: 'Female', accent: 'American' },
    { id: 'nPczCjzI2devNBz1zQrb', name: 'Brian', gender: 'Male', accent: 'American' },
    { id: 'cjVigY5qzO86Huf0OWal', name: 'Eric', gender: 'Male', accent: 'American' },
    { id: 'N2lVS1w4EtoT3dr4eOWO', name: 'Callum', gender: 'Male', accent: 'Transatlantic' },
    { id: 'SAz9YHcvj6GT2YYXdXww', name: 'River', gender: 'Non-binary', accent: 'American' },
    { id: 'Xb7hH8MSUJpSbSDYk0k2', name: 'Alice', gender: 'Female', accent: 'British' },
    { id: 'bIHbv24MWmeRgasZH58o', name: 'Will', gender: 'Male', accent: 'American' },
    { id: 'iP95p4xoKVk53GoZ742B', name: 'Chris', gender: 'Male', accent: 'American' },
    { id: 'pqHfZKP75CvOlQylNhV4', name: 'Bill', gender: 'Male', accent: 'American' },
  ];

  useEffect(() => { ensureVoicesLoaded(); }, []);

  const previewVoice = useCallback(() => {
    if (!script.trim()) { toast.error('Enter a script first'); return; }
    if (playing) { stopSpeaking(); setPlaying(false); return; }
    setPlaying(true);
    speak({ text: script, voiceId: selectedVoice, rate: speed[0], pitch: pitch[0], onEnd: () => setPlaying(false) });
  }, [script, selectedVoice, speed, pitch, volume, playing]);

  const generateWithElevenLabs = useCallback(async () => {
    if (!script.trim()) { toast.error('Enter a script'); return; }
    setGenerating(true);
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      if (!token) throw new Error('Not authenticated');

      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/voice-studio-tts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({
          text: script,
          voiceId: elVoiceId,
          format: outputFormat,
          modelId: language === 'en' ? 'eleven_turbo_v2_5' : 'eleven_multilingual_v2',
          voiceSettings: { stability: stability[0], similarity_boost: similarity[0], style: style[0], speed: speed[0] },
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText);
      }

      const blob = await res.blob();
      if (generatedUrl) URL.revokeObjectURL(generatedUrl);
      setGeneratedUrl(URL.createObjectURL(blob));
      toast.success('Audio generated with ElevenLabs!');
    } catch (e: any) {
      toast.error(e?.message || 'Generation failed');
    } finally {
      setGenerating(false);
    }
  }, [script, elVoiceId, outputFormat, language, stability, similarity, style, speed, generatedUrl]);

  const downloadAudio = useCallback(() => {
    if (!generatedUrl) return;
    const a = document.createElement('a');
    a.href = generatedUrl;
    a.download = `voiceover.${outputFormat}`;
    a.click();
  }, [generatedUrl, outputFormat]);

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-6xl mx-auto">
      {/* AI Script Writer */}
      <AIScriptWriterButton onScriptGenerated={setScript} language={language} />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">
        {/* CENTER: Preview */}
        <div className="space-y-4 order-2 lg:order-1">
          <SuiteCard>
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-sm flex items-center gap-2">
                <AudioWaveform className="w-4 h-4 text-gold" /> Script & Preview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Textarea value={script} onChange={e => setScript(e.target.value.slice(0, 5000))}
                  placeholder="Type or generate your script..."
                  className="bg-[#1a1708] border-gold/20 text-white placeholder:text-zinc-600 min-h-[150px]" rows={6} />
                <span className="absolute bottom-2 right-3 text-[10px] text-zinc-600">{script.length}/5000</span>
              </div>

              {script && (
                <div className="text-xs text-zinc-500 flex gap-4">
                  <span>{script.split(/\s+/).filter(Boolean).length} words</span>
                  <span>~{estimateDuration(script)}s</span>
                </div>
              )}

              {/* Browser preview play */}
              <div className="flex gap-2">
                <Button onClick={previewVoice} variant="outline" size="sm"
                  className="border-gold/30 text-gold hover:bg-gold/10">
                  {playing ? <Pause className="w-3.5 h-3.5 mr-1" /> : <Play className="w-3.5 h-3.5 mr-1" />}
                  {playing ? 'Stop' : 'Preview'}
                </Button>
                <Button onClick={() => downloadScriptAsText(script, 'Voice Studio')} variant="ghost" size="sm" className="text-zinc-400 hover:text-white">
                  <Copy className="w-3.5 h-3.5 mr-1" /> Copy Script
                </Button>
              </div>

              {/* Generated audio preview */}
              <CenteredAudioPreview src={generatedUrl} label="Generated Audio"
                onRemove={() => { if (generatedUrl) URL.revokeObjectURL(generatedUrl); setGeneratedUrl(null); }} />

              {generatedUrl && (
                <Button onClick={downloadAudio} className="w-full bg-gold text-black hover:bg-gold/90 font-semibold">
                  <Download className="w-4 h-4 mr-2" /> Download {outputFormat.toUpperCase()}
                </Button>
              )}
            </CardContent>
          </SuiteCard>
        </div>

        {/* RIGHT: Controls */}
        <div className="space-y-4 order-1 lg:order-2">
          {/* Voice Selection */}
          <SuiteCard>
            <CardHeader className="pb-2">
              <CardTitle className="text-white text-sm flex items-center gap-2">
                <MicVocal className="w-4 h-4 text-gold" /> Voice
                {isOwner && <Badge className="bg-gold/20 text-gold border-gold/30 text-[10px] ml-auto">ElevenLabs</Badge>}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {isOwner ? (
                /* Owner: ElevenLabs voices */
                <>
                  <Select value={elVoiceId} onValueChange={setElVoiceId}>
                    <SelectTrigger className="bg-[#1a1708] border-gold/20 text-white text-xs h-9"><SelectValue /></SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                      {ELEVENLABS_VOICES.map(v => (
                        <SelectItem key={v.id} value={v.id}>
                          <span className="flex items-center gap-2">
                            <span>{v.name}</span>
                            <span className="text-zinc-500 text-[10px]">{v.gender} · {v.accent}</span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <div className="space-y-2">
                    <div className="flex justify-between"><Label className="text-zinc-400 text-xs">Stability</Label><span className="text-[10px] text-gold">{stability[0].toFixed(2)}</span></div>
                    <Slider value={stability} onValueChange={setStability} min={0} max={1} step={0.05} className="[&_[role=slider]]:bg-gold" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between"><Label className="text-zinc-400 text-xs">Similarity</Label><span className="text-[10px] text-gold">{similarity[0].toFixed(2)}</span></div>
                    <Slider value={similarity} onValueChange={setSimilarity} min={0} max={1} step={0.05} className="[&_[role=slider]]:bg-gold" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between"><Label className="text-zinc-400 text-xs">Style</Label><span className="text-[10px] text-gold">{style[0].toFixed(2)}</span></div>
                    <Slider value={style} onValueChange={setStyle} min={0} max={1} step={0.05} className="[&_[role=slider]]:bg-gold" />
                  </div>
                </>
              ) : (
                /* Regular user: Browser voices */
                <Select value={selectedVoice} onValueChange={setSelectedVoice}>
                  <SelectTrigger className="bg-[#1a1708] border-gold/20 text-white text-xs h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {BROWSER_VOICE_LIBRARY.slice(0, 12).map(v => (
                      <SelectItem key={v.id} value={v.id}>{v.name} — {v.tag}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </CardContent>
          </SuiteCard>

          {/* Controls */}
          <SuiteCard>
            <CardHeader className="pb-2">
              <CardTitle className="text-white text-sm flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-gold" /> Controls
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <div className="flex justify-between"><Label className="text-zinc-400 text-xs">Speed</Label><span className="text-[10px] text-gold">{speed[0].toFixed(1)}x</span></div>
                <Slider value={speed} onValueChange={setSpeed} min={0.5} max={2} step={0.1} className="[&_[role=slider]]:bg-gold" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between"><Label className="text-zinc-400 text-xs">Pitch</Label><span className="text-[10px] text-gold">{pitch[0].toFixed(1)}</span></div>
                <Slider value={pitch} onValueChange={setPitch} min={0.5} max={2} step={0.1} className="[&_[role=slider]]:bg-gold" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between"><Label className="text-zinc-400 text-xs">Volume</Label><span className="text-[10px] text-gold">{Math.round(volume[0] * 100)}%</span></div>
                <Slider value={volume} onValueChange={setVolume} min={0} max={1} step={0.05} className="[&_[role=slider]]:bg-gold" />
              </div>
            </CardContent>
          </SuiteCard>

          {/* Output Options */}
          <SuiteCard>
            <CardHeader className="pb-2">
              <CardTitle className="text-white text-sm flex items-center gap-2">
                <Settings2 className="w-4 h-4 text-gold" /> Output
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-zinc-400 text-xs">Language</Label>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger className="bg-[#1a1708] border-gold/20 text-white text-xs h-8"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[['en','English'],['ar','Arabic'],['hi','Hindi'],['ur','Urdu'],['zh','Chinese'],['es','Spanish'],['fr','French'],['de','German'],['ru','Russian'],['pt','Portuguese'],['ja','Japanese'],['ko','Korean'],['it','Italian'],['tr','Turkish'],['nl','Dutch'],['pl','Polish'],['th','Thai'],['vi','Vietnamese'],['id','Indonesian'],['bn','Bengali'],['ta','Tamil']].map(([code, name]) => (
                      <SelectItem key={code} value={code}>{name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-zinc-400 text-xs">Format</Label>
                <Select value={outputFormat} onValueChange={setOutputFormat}>
                  <SelectTrigger className="bg-[#1a1708] border-gold/20 text-white text-xs h-8"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mp3">MP3 (128kbps)</SelectItem>
                    <SelectItem value="wav">WAV (Lossless)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {isOwner ? (
                <Button onClick={generateWithElevenLabs} disabled={generating || !script.trim()}
                  className="w-full bg-gradient-to-r from-gold via-amber-500 to-gold text-black font-bold hover:brightness-110 shadow-[0_0_20px_rgba(212,175,55,0.2)]">
                  {generating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Crown className="w-4 h-4 mr-2" />}
                  Generate with ElevenLabs
                </Button>
              ) : (
                <Button onClick={previewVoice} disabled={!script.trim()}
                  className="w-full bg-gold text-black hover:bg-gold/90 font-semibold">
                  <Play className="w-4 h-4 mr-2" /> Generate Voice
                </Button>
              )}
            </CardContent>
          </SuiteCard>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   TAB 2: VOICE-TO-TEXT
   ═══════════════════════════════════════════════════════════ */
function VoiceToTextPanel() {
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [language, setLanguage] = useState('en');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      audioChunksRef.current = [];
      mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const file = new File([blob], 'recording.webm', { type: 'audio/webm' });
        setAudioFile(file);
        setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach(track => track.stop());
      };
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
    } catch { toast.error('Could not access microphone'); }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current) { mediaRecorderRef.current.stop(); setIsRecording(false); }
  }, []);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('audio/')) { setAudioFile(file); setAudioUrl(URL.createObjectURL(file)); }
  }, []);

  const transcribe = useCallback(async () => {
    if (!audioFile) return;
    setProcessing(true);
    try {
      const reader = new FileReader();
      const base64Audio = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(audioFile);
      });
      const { data, error } = await supabase.functions.invoke('voice-to-text', { body: { audio: base64Audio, language } });
      if (error) throw error;
      if (data.text) { setTranscription(data.text); toast.success('Transcription complete!'); }
      else if (data.error) toast.error(data.error);
    } catch { toast.error('Transcription failed'); }
    finally { setProcessing(false); }
  }, [audioFile, language]);

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
      <SuiteCard>
        <CardHeader>
          <CardTitle className="text-white text-base flex items-center gap-2">
            <FileAudio className="w-5 h-5 text-gold" /> Voice to Text
            <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px] ml-2">FREE</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3 flex-wrap">
            <Button onClick={isRecording ? stopRecording : startRecording}
              className={isRecording ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-gold text-black hover:bg-gold/90'}>
              {isRecording ? <><Square className="w-4 h-4 mr-2" />Stop Recording</> : <><Mic className="w-4 h-4 mr-2" />Record Audio</>}
            </Button>
            <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="border-gold/30 text-gold hover:bg-gold/10">
              <Upload className="w-4 h-4 mr-2" /> Upload Audio
            </Button>
            <input ref={fileInputRef} type="file" accept="audio/*" className="hidden" onChange={handleFileUpload} />
          </div>

          <CenteredAudioPreview src={audioUrl} label="Source Audio" />

          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <Label className="text-zinc-400 text-xs">Language</Label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger className="bg-[#1a1708] border-gold/20 text-white text-xs h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[['en','English'],['ar','Arabic'],['hi','Hindi'],['ur','Urdu'],['es','Spanish'],['fr','French'],['de','German'],['zh','Chinese'],['ja','Japanese'],['ko','Korean']].map(([c,n]) => (
                    <SelectItem key={c} value={c}>{n}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={transcribe} disabled={!audioFile || processing} className="bg-gold text-black hover:bg-gold/90 font-semibold">
              {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Transcribe'}
            </Button>
          </div>

          {transcription && (
            <div className="space-y-2">
              <Label className="text-zinc-400 text-xs">Transcription</Label>
              <Textarea value={transcription} readOnly rows={6} className="bg-[#1a1708] border-gold/20 text-white" />
              <Button variant="outline" className="border-gold/30 text-gold hover:bg-gold/10"
                onClick={() => { navigator.clipboard.writeText(transcription); toast.success('Copied!'); }}>
                <Copy className="w-3.5 h-3.5 mr-1.5" /> Copy Text
              </Button>
            </div>
          )}
        </CardContent>
      </SuiteCard>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   TAB 3: AUDIO ENHANCE — FFmpeg + noise removal, format conversion, quality
   ═══════════════════════════════════════════════════════════ */
function AudioEnhancePanel() {
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState<EnhanceProgress | null>(null);
  const [enhancedBlob, setEnhancedBlob] = useState<Blob | null>(null);
  const [enhancedUrl, setEnhancedUrl] = useState<string | null>(null);
  const [enhanceMode, setEnhanceMode] = useState<'quick' | 'voice' | 'music'>('quick');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { return () => { if (audioUrl) URL.revokeObjectURL(audioUrl); if (enhancedUrl) URL.revokeObjectURL(enhancedUrl); }; }, [audioUrl, enhancedUrl]);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('audio/')) {
      if (file.size > 100 * 1024 * 1024) { toast.error('Max 100MB'); return; }
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      if (enhancedUrl) URL.revokeObjectURL(enhancedUrl);
      setAudioFile(file); setAudioUrl(URL.createObjectURL(file)); setEnhancedUrl(null); setEnhancedBlob(null); setProgress(null);
    }
  }, [audioUrl, enhancedUrl]);

  const enhanceAudio = useCallback(async () => {
    if (!audioFile) return;
    setProcessing(true); setProgress({ percent: 0, stage: 'loading', message: 'Initializing...' });
    try {
      let resultBlob: Blob;
      switch (enhanceMode) {
        case 'voice': resultBlob = await audioEnhanceService.optimizeVoice(audioFile, setProgress); break;
        case 'music': resultBlob = await audioEnhanceService.masterMusic(audioFile, setProgress); break;
        default: resultBlob = await audioEnhanceService.quickCleanup(audioFile, setProgress); break;
      }
      if (enhancedUrl) URL.revokeObjectURL(enhancedUrl);
      setEnhancedBlob(resultBlob); setEnhancedUrl(URL.createObjectURL(resultBlob));
      toast.success('Audio enhanced!');
    } catch (e: any) { toast.error(e?.message || 'Enhancement failed'); }
    finally { setProcessing(false); }
  }, [audioFile, enhanceMode, enhancedUrl]);

  const downloadEnhanced = useCallback(() => {
    if (!enhancedUrl) return;
    const a = document.createElement('a');
    a.href = enhancedUrl;
    a.download = `${audioFile?.name.replace(/\.[^/.]+$/, '') || 'audio'}_enhanced.mp3`;
    a.click();
  }, [enhancedUrl, audioFile]);

  const modeOptions = [
    { value: 'quick' as const, icon: Volume2, label: 'Quick Clean', desc: 'Noise reduction + volume normalization' },
    { value: 'voice' as const, icon: Radio, label: 'Voice/Podcast', desc: 'De-essing, compression, voice EQ' },
    { value: 'music' as const, icon: Music, label: 'Music Master', desc: 'Wide range EQ + gentle limiting' },
  ];

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
      <SuiteCard>
        <CardHeader>
          <CardTitle className="text-white text-base flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-gold" /> Audio Enhancement
            <Badge className="bg-gold/20 text-gold border-gold/30 text-[10px] ml-2">FFmpeg WASM</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Mode Selection */}
          <div className="grid grid-cols-3 gap-2">
            {modeOptions.map(m => (
              <button key={m.value} onClick={() => !processing && setEnhanceMode(m.value)}
                className={`p-3 rounded-xl border text-left transition-all ${
                  enhanceMode === m.value
                    ? 'bg-gold/10 border-gold/40 shadow-[0_0_15px_rgba(212,175,55,0.1)]'
                    : 'bg-[#1a1708]/50 border-gold/10 hover:border-gold/25'
                }`}>
                <m.icon className={`w-4 h-4 mb-1 ${enhanceMode === m.value ? 'text-gold' : 'text-zinc-500'}`} />
                <p className={`text-xs font-semibold ${enhanceMode === m.value ? 'text-gold' : 'text-zinc-400'}`}>{m.label}</p>
                <p className="text-[10px] text-zinc-600 mt-0.5">{m.desc}</p>
              </button>
            ))}
          </div>

          {/* Upload */}
          <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={processing}
            className="border-gold/30 text-gold hover:bg-gold/10">
            <Upload className="w-4 h-4 mr-2" /> Upload Audio (max 100MB)
          </Button>
          <input ref={fileInputRef} type="file" accept="audio/*" className="hidden" onChange={handleFileUpload} />

          <CenteredAudioPreview src={audioUrl} label="Original Audio" />

          {processing && progress && (
            <div className="max-w-xl mx-auto p-3 bg-[#1a1708]/60 border border-gold/10 rounded-xl space-y-2">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 text-gold animate-spin" />
                <span className="text-sm text-white">{progress.message}</span>
              </div>
              <Progress value={progress.percent} className="h-1.5" />
            </div>
          )}

          <Button onClick={enhanceAudio} disabled={processing || !audioFile}
            className="w-full bg-gold text-black hover:bg-gold/90 font-semibold max-w-xl mx-auto">
            {processing ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Processing...</> : <><Sparkles className="w-4 h-4 mr-2" />Enhance Audio</>}
          </Button>

          {enhancedUrl && (
            <div className="space-y-3">
              <CenteredAudioPreview src={enhancedUrl} label="✓ Enhanced Audio" />
              <Button onClick={downloadEnhanced} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold max-w-xl mx-auto">
                <Download className="w-4 h-4 mr-2" /> Download Enhanced
              </Button>
            </div>
          )}
        </CardContent>
      </SuiteCard>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   TAB 4: AUDIO EFFECTS — reverb, echo, pitch, speed with live preview
   ═══════════════════════════════════════════════════════════ */
function AudioEffectsPanel() {
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [reverb, setReverb] = useState([0]);
  const [echo, setEcho] = useState([0]);
  const [pitchShift, setPitchShift] = useState([0]);
  const [speedChange, setSpeedChange] = useState([1.0]);
  const [processing, setProcessing] = useState(false);
  const [processedUrl, setProcessedUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('audio/')) {
      setAudioFile(file);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      if (processedUrl) URL.revokeObjectURL(processedUrl);
      setAudioUrl(URL.createObjectURL(file));
      setProcessedUrl(null);
    }
  }, [audioUrl, processedUrl]);

  const applyEffects = useCallback(async () => {
    if (!audioFile) return;
    setProcessing(true);
    try {
      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;
      const arrayBuffer = await audioFile.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

      // Create offline context with speed adjustment
      const newLength = Math.ceil(audioBuffer.length / speedChange[0]);
      const offlineCtx = new OfflineAudioContext(audioBuffer.numberOfChannels, newLength, audioBuffer.sampleRate);
      const source = offlineCtx.createBufferSource();
      source.buffer = audioBuffer;
      source.playbackRate.value = speedChange[0];

      // Pitch via detune (semitones * 100 cents)
      if (pitchShift[0] !== 0) source.detune.value = pitchShift[0] * 100;

      let lastNode: AudioNode = source;

      // Reverb (convolver with impulse response)
      if (reverb[0] > 0) {
        const convolver = offlineCtx.createConvolver();
        const impulseLength = Math.ceil(offlineCtx.sampleRate * (0.5 + reverb[0] * 2));
        const impulseBuffer = offlineCtx.createBuffer(2, impulseLength, offlineCtx.sampleRate);
        for (let ch = 0; ch < 2; ch++) {
          const data = impulseBuffer.getChannelData(ch);
          for (let i = 0; i < impulseLength; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (offlineCtx.sampleRate * (0.2 + reverb[0])));
          }
        }
        convolver.buffer = impulseBuffer;
        const dry = offlineCtx.createGain(); dry.gain.value = 1 - reverb[0] * 0.5;
        const wet = offlineCtx.createGain(); wet.gain.value = reverb[0] * 0.6;
        const merger = offlineCtx.createGain();
        lastNode.connect(dry); dry.connect(merger);
        lastNode.connect(convolver); convolver.connect(wet); wet.connect(merger);
        lastNode = merger;
      }

      // Echo (delay)
      if (echo[0] > 0) {
        const delay = offlineCtx.createDelay(2.0);
        delay.delayTime.value = 0.15 + echo[0] * 0.35;
        const feedback = offlineCtx.createGain();
        feedback.gain.value = echo[0] * 0.5;
        const dryGain = offlineCtx.createGain(); dryGain.gain.value = 1;
        const merger = offlineCtx.createGain();
        lastNode.connect(dryGain); dryGain.connect(merger);
        lastNode.connect(delay); delay.connect(feedback); feedback.connect(delay); delay.connect(merger);
        lastNode = merger;
      }

      lastNode.connect(offlineCtx.destination);
      source.start(0);

      const rendered = await offlineCtx.startRendering();

      // Convert to WAV
      const wavBlob = audioBufferToWav(rendered);
      if (processedUrl) URL.revokeObjectURL(processedUrl);
      setProcessedUrl(URL.createObjectURL(wavBlob));
      toast.success('Effects applied!');
    } catch (e: any) {
      toast.error(e?.message || 'Failed to apply effects');
    } finally {
      setProcessing(false);
    }
  }, [audioFile, reverb, echo, pitchShift, speedChange, processedUrl]);

  const downloadProcessed = useCallback(() => {
    if (!processedUrl) return;
    const a = document.createElement('a');
    a.href = processedUrl;
    a.download = `${audioFile?.name.replace(/\.[^/.]+$/, '') || 'audio'}_effects.wav`;
    a.click();
  }, [processedUrl, audioFile]);

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
      <SuiteCard>
        <CardHeader>
          <CardTitle className="text-white text-base flex items-center gap-2">
            <Waves className="w-5 h-5 text-gold" /> Audio Effects
            <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 text-[10px] ml-2">Web Audio</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="border-gold/30 text-gold hover:bg-gold/10">
            <Upload className="w-4 h-4 mr-2" /> Upload Audio
          </Button>
          <input ref={fileInputRef} type="file" accept="audio/*" className="hidden" onChange={handleFileUpload} />

          <CenteredAudioPreview src={audioUrl} label="Source Audio" />

          {audioFile && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-xl mx-auto">
              <div className="space-y-2">
                <div className="flex justify-between"><Label className="text-zinc-400 text-xs">Reverb</Label><span className="text-[10px] text-gold">{reverb[0].toFixed(1)}</span></div>
                <Slider value={reverb} onValueChange={setReverb} min={0} max={1} step={0.05} className="[&_[role=slider]]:bg-gold" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between"><Label className="text-zinc-400 text-xs">Echo</Label><span className="text-[10px] text-gold">{echo[0].toFixed(1)}</span></div>
                <Slider value={echo} onValueChange={setEcho} min={0} max={1} step={0.05} className="[&_[role=slider]]:bg-gold" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between"><Label className="text-zinc-400 text-xs">Pitch (semitones)</Label><span className="text-[10px] text-gold">{pitchShift[0] > 0 ? '+' : ''}{pitchShift[0]}</span></div>
                <Slider value={pitchShift} onValueChange={setPitchShift} min={-12} max={12} step={1} className="[&_[role=slider]]:bg-gold" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between"><Label className="text-zinc-400 text-xs">Speed</Label><span className="text-[10px] text-gold">{speedChange[0].toFixed(1)}x</span></div>
                <Slider value={speedChange} onValueChange={setSpeedChange} min={0.5} max={2} step={0.1} className="[&_[role=slider]]:bg-gold" />
              </div>
            </div>
          )}

          {audioFile && (
            <Button onClick={applyEffects} disabled={processing}
              className="w-full bg-gold text-black hover:bg-gold/90 font-semibold max-w-xl mx-auto">
              {processing ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Applying...</> : <><Waves className="w-4 h-4 mr-2" />Apply Effects</>}
            </Button>
          )}

          {processedUrl && (
            <div className="space-y-3">
              <CenteredAudioPreview src={processedUrl} label="✓ Processed Audio" />
              <Button onClick={downloadProcessed} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold max-w-xl mx-auto">
                <Download className="w-4 h-4 mr-2" /> Download Processed
              </Button>
            </div>
          )}
        </CardContent>
      </SuiteCard>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   TAB 5: VOICE CLONING — Owner-only, ElevenLabs
   ═══════════════════════════════════════════════════════════ */
function VoiceCloningPanel() {
  const [recordings, setRecordings] = useState<Blob[]>([]);
  const [recordingUrls, setRecordingUrls] = useState<string[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [voiceName, setVoiceName] = useState('');
  const [cloning, setCloning] = useState(false);
  const [clonedVoiceId, setClonedVoiceId] = useState<string | null>(null);
  const [ttsText, setTtsText] = useState('');
  const [ttsGenerating, setTtsGenerating] = useState(false);
  const [ttsUrl, setTtsUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setRecordings(prev => [...prev, blob]);
        setRecordingUrls(prev => [...prev, URL.createObjectURL(blob)]);
        stream.getTracks().forEach(t => t.stop());
      };
      mediaRecorderRef.current = mr;
      mr.start();
      setIsRecording(true);
    } catch { toast.error('Microphone access denied'); }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current) { mediaRecorderRef.current.stop(); setIsRecording(false); }
  }, []);

  const cloneVoice = useCallback(async () => {
    if (recordings.length === 0) { toast.error('Record at least one sample'); return; }
    if (!voiceName.trim()) { toast.error('Enter a voice name'); return; }
    setCloning(true);
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      if (!token) throw new Error('Not authenticated');

      const formData = new FormData();
      formData.append('action', 'clone_voice');
      formData.append('voice_name', voiceName);
      formData.append('description', 'Cloned via Voice Suite');
      recordings.forEach(blob => formData.append('files', blob, 'voice_sample.webm'));

      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/voice-studio-clone`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY },
        body: formData,
      });

      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setClonedVoiceId(data.voice_id);
      toast.success(`Voice "${voiceName}" cloned successfully!`);
    } catch (e: any) { toast.error(e?.message || 'Cloning failed'); }
    finally { setCloning(false); }
  }, [recordings, voiceName]);

  const generateTTS = useCallback(async () => {
    if (!clonedVoiceId || !ttsText.trim()) return;
    setTtsGenerating(true);
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      if (!token) throw new Error('Not authenticated');

      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/voice-studio-clone`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`, 'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY },
        body: JSON.stringify({ action: 'tts_with_clone', voice_id: clonedVoiceId, text: ttsText }),
      });

      if (!res.ok) throw new Error(await res.text());
      const blob = await res.blob();
      if (ttsUrl) URL.revokeObjectURL(ttsUrl);
      setTtsUrl(URL.createObjectURL(blob));
      toast.success('Generated with cloned voice!');
    } catch (e: any) { toast.error(e?.message || 'Generation failed'); }
    finally { setTtsGenerating(false); }
  }, [clonedVoiceId, ttsText, ttsUrl]);

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
      <SuiteCard>
        <CardHeader>
          <CardTitle className="text-white text-base flex items-center gap-2">
            <Crown className="w-5 h-5 text-gold" /> Voice Cloning
            <Badge className="bg-gold/20 text-gold border-gold/30 text-[10px] ml-2">ElevenLabs · Owner</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Step 1: Record samples */}
          <div className="space-y-3">
            <Label className="text-zinc-400 text-xs font-semibold tracking-wider uppercase">Step 1: Record Voice Samples</Label>
            <div className="flex gap-2 flex-wrap">
              <Button onClick={isRecording ? stopRecording : startRecording}
                className={isRecording ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-gold text-black hover:bg-gold/90'}>
                {isRecording ? <><Square className="w-4 h-4 mr-2" />Stop</> : <><Mic className="w-4 h-4 mr-2" />Record Sample</>}
              </Button>
              <span className="text-xs text-zinc-500 self-center">{recordings.length} sample{recordings.length !== 1 ? 's' : ''} recorded</span>
            </div>
            {recordingUrls.map((url, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-xs text-zinc-500">#{i + 1}</span>
                <audio controls src={url} className="h-8 flex-1" />
              </div>
            ))}
          </div>

          {/* Step 2: Name & Clone */}
          <div className="space-y-3">
            <Label className="text-zinc-400 text-xs font-semibold tracking-wider uppercase">Step 2: Clone Voice</Label>
            <Input value={voiceName} onChange={e => setVoiceName(e.target.value)} placeholder="Voice name..."
              className="bg-[#1a1708] border-gold/20 text-white placeholder:text-zinc-600" />
            <Button onClick={cloneVoice} disabled={cloning || recordings.length === 0}
              className="w-full bg-gradient-to-r from-gold via-amber-500 to-gold text-black font-bold hover:brightness-110">
              {cloning ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Cloning...</> : <><MicVocal className="w-4 h-4 mr-2" />Clone Voice</>}
            </Button>
          </div>

          {/* Step 3: Use cloned voice */}
          {clonedVoiceId && (
            <div className="space-y-3 border-t border-gold/10 pt-4">
              <Label className="text-zinc-400 text-xs font-semibold tracking-wider uppercase">Step 3: Generate with Cloned Voice</Label>
              <p className="text-[10px] text-emerald-400">✓ Voice ID: {clonedVoiceId}</p>
              <Textarea value={ttsText} onChange={e => setTtsText(e.target.value)} placeholder="Enter text to speak..."
                className="bg-[#1a1708] border-gold/20 text-white placeholder:text-zinc-600" rows={3} />
              <Button onClick={generateTTS} disabled={ttsGenerating || !ttsText.trim()}
                className="w-full bg-gold text-black hover:bg-gold/90 font-semibold">
                {ttsGenerating ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Generating...</> : <><Play className="w-4 h-4 mr-2" />Generate</>}
              </Button>
              <CenteredAudioPreview src={ttsUrl} label="Cloned Voice Output" />
            </div>
          )}
        </CardContent>
      </SuiteCard>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   TAB 6: AI TRANSLATION
   ═══════════════════════════════════════════════════════════ */
function AudioTranslationPanel() {
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [sourceLang, setSourceLang] = useState('en');
  const [targetLang, setTargetLang] = useState('ar');
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [translatedText, setTranslatedText] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('audio/')) { setAudioFile(file); setAudioUrl(URL.createObjectURL(file)); }
  }, []);

  const LANGUAGES = [['en','English'],['ar','Arabic'],['hi','Hindi'],['ur','Urdu'],['zh','Chinese'],['es','Spanish'],['fr','French'],['de','German'],['ru','Russian'],['pt','Portuguese'],['ja','Japanese'],['ko','Korean'],['it','Italian'],['tr','Turkish'],['nl','Dutch'],['pl','Polish'],['th','Thai'],['vi','Vietnamese'],['id','Indonesian'],['bn','Bengali'],['ta','Tamil'],['fa','Persian'],['he','Hebrew']];

  const translateAudio = useCallback(async () => {
    if (!audioFile) return;
    setProcessing(true); setProgress(10);
    try {
      const reader = new FileReader();
      const base64Audio = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(audioFile);
      });
      setProgress(30);
      const transcribeRes = await supabase.functions.invoke('voice-to-text', { body: { audio: base64Audio, language: sourceLang } });
      if (transcribeRes.error || !transcribeRes.data.text) throw new Error('Transcription failed');
      setProgress(60);
      const translateRes = await supabase.functions.invoke('auto-translate', {
        body: { text: transcribeRes.data.text, targetLang, sourceLang },
      });
      setProgress(90);
      if (translateRes.data?.translatedText) {
        setTranslatedText(translateRes.data.translatedText);
        toast.success('Translation complete!');
      } else {
        setTranslatedText(`[Original]: ${transcribeRes.data.text}\n\n[Translation service unavailable]`);
        toast.info('Transcription complete. Translation may be needed externally.');
      }
      setProgress(100);
    } catch { toast.error('Translation failed'); }
    finally { setProcessing(false); setProgress(0); }
  }, [audioFile, sourceLang, targetLang]);

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
      <SuiteCard>
        <CardHeader>
          <CardTitle className="text-white text-base flex items-center gap-2">
            <Languages className="w-5 h-5 text-gold" /> Audio Translation
            <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px] ml-2">FREE</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="border-gold/30 text-gold hover:bg-gold/10">
            <Upload className="w-4 h-4 mr-2" /> Upload Audio
          </Button>
          <input ref={fileInputRef} type="file" accept="audio/*" className="hidden" onChange={handleFileUpload} />

          <CenteredAudioPreview src={audioUrl} label="Source Audio" />

          <div className="grid grid-cols-2 gap-4 max-w-xl mx-auto">
            <div>
              <Label className="text-zinc-400 text-xs">From</Label>
              <Select value={sourceLang} onValueChange={setSourceLang}>
                <SelectTrigger className="bg-[#1a1708] border-gold/20 text-white text-xs h-9"><SelectValue /></SelectTrigger>
                <SelectContent>{LANGUAGES.map(([c,n]) => <SelectItem key={c} value={c}>{n}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-zinc-400 text-xs">To</Label>
              <Select value={targetLang} onValueChange={setTargetLang}>
                <SelectTrigger className="bg-[#1a1708] border-gold/20 text-white text-xs h-9"><SelectValue /></SelectTrigger>
                <SelectContent>{LANGUAGES.map(([c,n]) => <SelectItem key={c} value={c}>{n}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>

          <Button onClick={translateAudio} disabled={!audioFile || processing}
            className="w-full bg-gold text-black hover:bg-gold/90 font-semibold max-w-xl mx-auto">
            {processing ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Translating...</> : 'Translate Audio'}
          </Button>

          {processing && <Progress value={progress} className="h-1.5 max-w-xl mx-auto" />}

          {translatedText && (
            <div className="space-y-2 max-w-xl mx-auto">
              <Label className="text-zinc-400 text-xs">Translated Text</Label>
              <Textarea value={translatedText} readOnly rows={6} className="bg-[#1a1708] border-gold/20 text-white" />
              <Button variant="outline" className="border-gold/30 text-gold hover:bg-gold/10"
                onClick={() => { navigator.clipboard.writeText(translatedText); toast.success('Copied!'); }}>
                <Copy className="w-3.5 h-3.5 mr-1.5" /> Copy
              </Button>
            </div>
          )}
        </CardContent>
      </SuiteCard>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   WAV ENCODER UTILITY
   ═══════════════════════════════════════════════════════════ */
function audioBufferToWav(buffer: AudioBuffer): Blob {
  const numCh = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;
  const blockAlign = numCh * bitDepth / 8;
  const byteRate = sampleRate * blockAlign;
  const dataSize = buffer.length * blockAlign;
  const headerSize = 44;
  const totalSize = headerSize + dataSize;
  const ab = new ArrayBuffer(totalSize);
  const view = new DataView(ab);

  const writeString = (offset: number, str: string) => { for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i)); };
  writeString(0, 'RIFF');
  view.setUint32(4, totalSize - 8, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, format, true);
  view.setUint16(22, numCh, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);
  writeString(36, 'data');
  view.setUint32(40, dataSize, true);

  const channels = [];
  for (let ch = 0; ch < numCh; ch++) channels.push(buffer.getChannelData(ch));

  let offset = 44;
  for (let i = 0; i < buffer.length; i++) {
    for (let ch = 0; ch < numCh; ch++) {
      const sample = Math.max(-1, Math.min(1, channels[ch][i]));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
      offset += 2;
    }
  }

  return new Blob([ab], { type: 'audio/wav' });
}

/* ═══════════════════════════════════════════════════════════
   MAIN EXPORT — 6 TABS
   ═══════════════════════════════════════════════════════════ */
export default function VoiceSuite() {
  const { isOwner } = useAuth();

  const TAB_CLASS = "relative px-3 md:px-5 py-3.5 rounded-none border-b-2 border-transparent data-[state=active]:border-gold data-[state=active]:text-gold text-zinc-500 hover:text-zinc-300 transition-colors flex items-center gap-1.5 whitespace-nowrap text-xs font-medium";

  return (
    <>
      <SEOHead
        title="Voice & Audio Suite | JBJ Royal Tools"
        description="AI voice generation, text-to-speech, voice-to-text, audio enhancement, effects, voice cloning, and translation."
      />

      <div className="min-h-screen bg-gradient-to-br from-[#0a0908] via-[#0d0c08] to-[#080704]">
        {/* Header */}
        <div className="border-b border-gold/15 bg-gradient-to-r from-[#0d0c08] via-[#141008]/80 to-[#0d0c08]">
          <div className="max-w-7xl mx-auto px-4 py-5">
            <div className="flex items-center gap-3 mb-3">
              <Link to="/toolkit">
                <Button variant="ghost" size="sm" className="text-zinc-500 hover:text-gold hover:bg-gold/5 border border-gold/10 hover:border-gold/30 text-xs h-7">
                  <ArrowLeft className="w-3.5 h-3.5 mr-1.5" /> Royal Tools Hub
                </Button>
              </Link>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gold/20 to-amber-700/10 border border-gold/30 flex items-center justify-center shadow-[0_0_20px_rgba(212,175,55,0.1)]">
                <Headphones className="w-6 h-6 text-gold" />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">
                  Voice & Audio <span className="text-gold">Suite</span>
                </h1>
                <p className="text-zinc-500 text-xs">Premium TTS, transcription, enhancement, effects & translation</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="tts" className="flex flex-col">
          <div className="border-b border-gold/10 bg-[#0d0c08]/80 backdrop-blur-sm sticky top-0 z-10">
            <div className="max-w-7xl mx-auto px-4">
              <TabsList className="w-full justify-start rounded-none bg-transparent p-0 h-auto gap-0 overflow-x-auto">
                <TabsTrigger value="tts" className={TAB_CLASS}>
                  <Mic className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Voice Studio</span>
                </TabsTrigger>
                <TabsTrigger value="stt" className={TAB_CLASS}>
                  <FileAudio className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Voice-to-Text</span>
                </TabsTrigger>
                <TabsTrigger value="enhance" className={TAB_CLASS}>
                  <Sparkles className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Enhance</span>
                </TabsTrigger>
                <TabsTrigger value="effects" className={TAB_CLASS}>
                  <Waves className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Effects</span>
                </TabsTrigger>
                {isOwner && (
                  <TabsTrigger value="clone" className={TAB_CLASS}>
                    <Crown className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Voice Cloning</span>
                  </TabsTrigger>
                )}
                <TabsTrigger value="translate" className={TAB_CLASS}>
                  <Languages className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Translate</span>
                </TabsTrigger>
              </TabsList>
            </div>
          </div>

          <div className="flex-1 overflow-auto">
            <TabsContent value="tts" className="mt-0"><VoiceStudioPanel /></TabsContent>
            <TabsContent value="stt" className="mt-0"><VoiceToTextPanel /></TabsContent>
            <TabsContent value="enhance" className="mt-0"><AudioEnhancePanel /></TabsContent>
            <TabsContent value="effects" className="mt-0"><AudioEffectsPanel /></TabsContent>
            {isOwner && <TabsContent value="clone" className="mt-0"><VoiceCloningPanel /></TabsContent>}
            <TabsContent value="translate" className="mt-0"><AudioTranslationPanel /></TabsContent>
          </div>
        </Tabs>
      </div>
    </>
  );
}
