import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import {
  Bot, Mic, Star, Crown, Languages, Wand2, Play, Square, Download,
  Loader2, CheckCircle2, Volume2, VolumeX, PlusCircle, RefreshCw, Copy
} from 'lucide-react';
import { SUPPORTED_LANGUAGES } from '../types';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface AITalkingAgentPanelProps {
  onAIVoiceGenerated: (audioUrl: string, duration: number) => void;
}

const AGENT_CHARACTERS = [
  { id: 'professional-male', label: 'Professional Male', icon: Bot, desc: 'Authoritative & precise' },
  { id: 'warm-female', label: 'Warm Female', icon: Mic, desc: 'Friendly & welcoming' },
  { id: 'energetic-presenter', label: 'Energetic', icon: Star, desc: 'Dynamic & exciting' },
  { id: 'luxury-narrator', label: 'Luxury Narrator', icon: Crown, desc: 'Sophisticated & elite' },
] as const;

const TONE_OPTIONS = [
  { id: 'luxury', label: 'Luxury' },
  { id: 'professional', label: 'Professional' },
  { id: 'energetic', label: 'Energetic' },
] as const;

const DURATION_OPTIONS = [
  { value: 30, label: '30s' },
  { value: 60, label: '60s' },
  { value: 90, label: '90s' },
] as const;

type Step = 1 | 2 | 3;

export function AITalkingAgentPanel({ onAIVoiceGenerated }: AITalkingAgentPanelProps) {
  // Step 1 — Settings
  const [character, setCharacter] = useState<string>('professional-male');
  const [language, setLanguage] = useState('en');
  const [tone, setTone] = useState<'luxury' | 'professional' | 'energetic'>('professional');
  const [duration, setDuration] = useState<30 | 60 | 90>(60);
  const [rate, setRate] = useState(1.0);
  const [pitch, setPitch] = useState(1.0);

  // Step 2 — Script
  const [prompt, setPrompt] = useState('');
  const [script, setScript] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [estimatedDuration, setEstimatedDuration] = useState(0);

  // Step 3 — Synthesize
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordProgress, setRecordProgress] = useState(0);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);

  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressIntervalRef = useRef<number>();

  const selectedLang = SUPPORTED_LANGUAGES.find(l => l.code === language);
  const isRTL = selectedLang?.rtl ?? false;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      if (recordedUrl) URL.revokeObjectURL(recordedUrl);
    };
  }, [recordedUrl]);

  const generateScript = useCallback(async () => {
    if (!prompt.trim()) {
      toast.error('Please enter a property description first');
      return;
    }
    setIsGenerating(true);
    setScript('');
    try {
      const { data, error } = await supabase.functions.invoke('ai-agent-script-writer', {
        body: { prompt, language, tone, character, duration },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setScript(data.script);
      setWordCount(data.wordCount);
      setEstimatedDuration(data.estimatedDuration);
      toast.success('Script generated!');
    } catch (err: any) {
      console.error('Script generation error:', err);
      if (err?.message?.includes('Rate limit') || err?.status === 429) {
        toast.error('Rate limit reached. Please wait a moment and try again.');
      } else if (err?.status === 402) {
        toast.error('AI credits exhausted. Please add credits to your workspace.');
      } else {
        toast.error('Failed to generate script. Please try again.');
      }
    } finally {
      setIsGenerating(false);
    }
  }, [prompt, language, tone, character, duration]);

  const getVoiceForLanguage = useCallback((langCode: string): SpeechSynthesisVoice | null => {
    const voices = window.speechSynthesis.getVoices();
    // Try exact match first
    const exact = voices.find(v => v.lang.startsWith(langCode) || v.lang.toLowerCase().startsWith(langCode));
    if (exact) return exact;
    // Fallback: first available
    return voices[0] || null;
  }, []);

  const stopPreview = useCallback(() => {
    window.speechSynthesis.cancel();
    setIsPreviewing(false);
  }, []);

  const previewVoice = useCallback(() => {
    if (!script.trim()) {
      toast.error('Generate a script first');
      return;
    }
    if (isPreviewing) {
      stopPreview();
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(script);
    utterance.rate = rate;
    utterance.pitch = pitch;
    utterance.lang = language;
    const voice = getVoiceForLanguage(language);
    if (voice) utterance.voice = voice;
    utterance.onstart = () => setIsPreviewing(true);
    utterance.onend = () => setIsPreviewing(false);
    utterance.onerror = () => setIsPreviewing(false);
    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, [script, rate, pitch, language, isPreviewing, stopPreview, getVoiceForLanguage]);

  const recordAndAddToTimeline = useCallback(async () => {
    if (!script.trim()) {
      toast.error('Generate a script first');
      return;
    }
    setRecordedBlob(null);
    setRecordedUrl(null);
    setRecordProgress(0);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setRecordedBlob(blob);
        setRecordedUrl(url);
        setIsRecording(false);
        setRecordProgress(100);
        if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
        toast.success('Recording complete! Preview and add to timeline below.');
      };

      mediaRecorder.start(100);
      setIsRecording(true);

      // Speak the script
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(script);
      utterance.rate = rate;
      utterance.pitch = pitch;
      utterance.lang = language;
      const voice = getVoiceForLanguage(language);
      if (voice) utterance.voice = voice;

      const estimatedMs = estimatedDuration > 0 ? estimatedDuration * 1000 : duration * 1000;
      let elapsed = 0;
      progressIntervalRef.current = window.setInterval(() => {
        elapsed += 200;
        setRecordProgress(Math.min((elapsed / estimatedMs) * 90, 90));
      }, 200);

      utterance.onend = () => {
        // Small buffer after speech ends
        setTimeout(() => {
          if (mediaRecorderRef.current?.state === 'recording') {
            mediaRecorderRef.current.stop();
          }
        }, 500);
      };
      utterance.onerror = () => {
        if (mediaRecorderRef.current?.state === 'recording') {
          mediaRecorderRef.current.stop();
        }
      };

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.error('Recording error:', err);
      toast.error('Microphone access required. Please allow microphone permissions.');
      setIsRecording(false);
    }
  }, [script, rate, pitch, language, duration, estimatedDuration, getVoiceForLanguage]);

  const addToTimeline = useCallback(async () => {
    if (!recordedUrl || !recordedBlob) return;
    const audio = new Audio(recordedUrl);
    await new Promise<void>((res) => {
      audio.onloadedmetadata = () => res();
      audio.onerror = () => res();
    });
    const dur = audio.duration || estimatedDuration || duration;
    onAIVoiceGenerated(recordedUrl, dur);
    toast.success('Voiceover added to timeline!');
  }, [recordedUrl, recordedBlob, estimatedDuration, duration, onAIVoiceGenerated]);

  const downloadAudio = useCallback(() => {
    if (!recordedBlob) return;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(recordedBlob);
    a.download = `voiceover-${language}-${Date.now()}.webm`;
    a.click();
    toast.success('Downloading voiceover...');
  }, [recordedBlob, language]);

  const copyScript = useCallback(() => {
    navigator.clipboard.writeText(script);
    toast.success('Script copied to clipboard');
  }, [script]);

  const stepDone = (step: Step) => {
    if (step === 1) return true;
    if (step === 2) return script.length > 0;
    if (step === 3) return recordedBlob !== null;
    return false;
  };

  return (
    <div className="space-y-4 text-sm">

      {/* ─── Step 1: Agent Identity ─── */}
      <div className="rounded-lg border border-amber-500/20 bg-slate-800/60 p-3 space-y-3">
        <div className="flex items-center gap-2">
          <span className="flex items-center justify-center w-5 h-5 rounded-full bg-amber-500 text-black font-bold text-xs shrink-0">1</span>
          <h4 className="font-semibold text-amber-400">Agent Character & Settings</h4>
        </div>

        {/* Character selector */}
        <div className="grid grid-cols-2 gap-2">
          {AGENT_CHARACTERS.map(({ id, label, icon: Icon, desc }) => (
            <button
              key={id}
              onClick={() => setCharacter(id)}
              className={`flex flex-col items-center gap-1 p-2 rounded-lg border text-center transition-all ${
                character === id
                  ? 'border-amber-500 bg-amber-500/15 text-amber-300'
                  : 'border-slate-600 bg-slate-800/40 text-slate-400 hover:border-slate-500'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs font-medium leading-tight">{label}</span>
              <span className="text-[10px] opacity-70 leading-tight">{desc}</span>
            </button>
          ))}
        </div>

        {/* Language & Tone */}
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label className="text-xs text-slate-400 flex items-center gap-1">
              <Languages className="w-3 h-3" /> Language
            </Label>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger className="h-8 bg-slate-800 border-slate-600 text-white text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-48">
                {SUPPORTED_LANGUAGES.map(lang => (
                  <SelectItem key={lang.code} value={lang.code} className="text-xs">
                    {lang.name} {lang.rtl ? '(RTL)' : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-slate-400">Tone</Label>
            <div className="flex gap-1">
              {TONE_OPTIONS.map(t => (
                <button
                  key={t.id}
                  onClick={() => setTone(t.id as any)}
                  className={`flex-1 text-[10px] py-1 px-1 rounded border transition-all ${
                    tone === t.id
                      ? 'border-amber-500 bg-amber-500/15 text-amber-300'
                      : 'border-slate-600 bg-slate-800 text-slate-400 hover:border-slate-500'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Duration */}
        <div className="space-y-1">
          <Label className="text-xs text-slate-400">Script Duration</Label>
          <div className="flex gap-2">
            {DURATION_OPTIONS.map(d => (
              <button
                key={d.value}
                onClick={() => setDuration(d.value as any)}
                className={`flex-1 text-xs py-1 rounded border transition-all ${
                  duration === d.value
                    ? 'border-amber-500 bg-amber-500/15 text-amber-300'
                    : 'border-slate-600 bg-slate-800 text-slate-400 hover:border-slate-500'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        {/* Rate & Pitch sliders */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs text-slate-400">Speed: {rate.toFixed(1)}×</Label>
            <Slider
              min={0.5} max={2} step={0.1}
              value={[rate]}
              onValueChange={([v]) => setRate(v)}
              className="h-4"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-slate-400">Pitch: {pitch.toFixed(1)}</Label>
            <Slider
              min={0.5} max={2} step={0.1}
              value={[pitch]}
              onValueChange={([v]) => setPitch(v)}
              className="h-4"
            />
          </div>
        </div>
      </div>

      {/* ─── Step 2: Script Generator ─── */}
      <div className="rounded-lg border border-amber-500/20 bg-slate-800/60 p-3 space-y-3">
        <div className="flex items-center gap-2">
          <span className="flex items-center justify-center w-5 h-5 rounded-full bg-amber-500 text-black font-bold text-xs shrink-0">2</span>
          <h4 className="font-semibold text-amber-400">AI Script Generator</h4>
          {stepDone(2) && <CheckCircle2 className="w-4 h-4 text-green-400 ml-auto" />}
        </div>

        <div className="space-y-1">
          <Label className="text-xs text-slate-400">Property Description / Talking Points</Label>
          <Textarea
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            placeholder="e.g. 3-bedroom luxury apartment in Dubai Marina, stunning sea views, private pool, 1.2M AED, 40/60 payment plan, handover Q4 2026..."
            className="min-h-[80px] bg-slate-900 border-slate-600 text-white text-xs resize-none placeholder:text-slate-500"
            dir="ltr"
          />
        </div>

        <Button
          onClick={generateScript}
          disabled={isGenerating || !prompt.trim()}
          className="w-full bg-amber-500 hover:bg-amber-400 text-black font-semibold disabled:opacity-50 h-8 text-xs"
        >
          {isGenerating ? (
            <><Loader2 className="w-3 h-3 mr-1 animate-spin" /> Writing Script...</>
          ) : (
            <><Wand2 className="w-3 h-3 mr-1" /> Generate Script with AI</>
          )}
        </Button>

        {script && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-slate-400">Generated Script</Label>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-500">{wordCount} words · ~{estimatedDuration}s</span>
                <button onClick={copyScript} className="text-slate-500 hover:text-amber-400 transition-colors">
                  <Copy className="w-3 h-3" />
                </button>
                <button onClick={generateScript} disabled={isGenerating} className="text-slate-500 hover:text-amber-400 transition-colors">
                  <RefreshCw className={`w-3 h-3 ${isGenerating ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>
            <Textarea
              value={script}
              onChange={e => setScript(e.target.value)}
              className="min-h-[100px] bg-slate-900 border-slate-600 text-white text-xs resize-none"
              dir={isRTL ? 'rtl' : 'ltr'}
            />
          </div>
        )}
      </div>

      {/* ─── Step 3: Synthesize & Export ─── */}
      <div className="rounded-lg border border-amber-500/20 bg-slate-800/60 p-3 space-y-3">
        <div className="flex items-center gap-2">
          <span className="flex items-center justify-center w-5 h-5 rounded-full bg-amber-500 text-black font-bold text-xs shrink-0">3</span>
          <h4 className="font-semibold text-amber-400">Synthesize & Export</h4>
          {stepDone(3) && <CheckCircle2 className="w-4 h-4 text-green-400 ml-auto" />}
        </div>

        {/* Waveform animation when previewing */}
        {isPreviewing && (
          <div className="flex items-center justify-center gap-1 py-2">
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                className="w-1 rounded-full bg-amber-400"
                style={{
                  height: `${8 + Math.random() * 20}px`,
                  animation: `pulse 0.${4 + (i % 4)}s ease-in-out infinite alternate`,
                  animationDelay: `${i * 0.05}s`,
                }}
              />
            ))}
          </div>
        )}

        {/* Preview button */}
        <Button
          onClick={previewVoice}
          disabled={!script.trim() || isRecording}
          variant="outline"
          className={`w-full h-8 text-xs border-slate-600 ${isPreviewing ? 'border-amber-500 text-amber-400' : 'text-slate-300 hover:text-white'}`}
        >
          {isPreviewing ? (
            <><VolumeX className="w-3 h-3 mr-1" /> Stop Preview</>
          ) : (
            <><Volume2 className="w-3 h-3 mr-1" /> Preview Voice (Browser TTS — Zero Credits)</>
          )}
        </Button>

        {/* Record button */}
        {!recordedBlob && (
          <div className="space-y-2">
            <Button
              onClick={isRecording ? undefined : recordAndAddToTimeline}
              disabled={!script.trim() || isPreviewing}
              className={`w-full h-8 text-xs ${
                isRecording
                  ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse'
                  : 'bg-amber-500 hover:bg-amber-400 text-black font-semibold'
              } disabled:opacity-50`}
            >
              {isRecording ? (
                <><Square className="w-3 h-3 mr-1" /> Recording...</>
              ) : (
                <><Mic className="w-3 h-3 mr-1" /> Record & Capture Audio</>
              )}
            </Button>
            {isRecording && (
              <Progress value={recordProgress} className="h-1" />
            )}
            <p className="text-[10px] text-slate-500 text-center">
              Mic required to capture the browser's voice output
            </p>
          </div>
        )}

        {/* Recorded audio controls */}
        {recordedUrl && recordedBlob && (
          <div className="space-y-2">
            <audio
              ref={audioRef}
              src={recordedUrl}
              onEnded={() => setIsAudioPlaying(false)}
              className="w-full h-8 rounded"
              controls
            />
            <div className="flex gap-2">
              <Button
                onClick={addToTimeline}
                className="flex-1 h-8 text-xs bg-green-600 hover:bg-green-500 text-white font-semibold"
              >
                <PlusCircle className="w-3 h-3 mr-1" /> Add to Timeline
              </Button>
              <Button
                onClick={downloadAudio}
                variant="outline"
                className="h-8 text-xs border-slate-600 text-slate-300 hover:text-white"
              >
                <Download className="w-3 h-3 mr-1" /> Download
              </Button>
              <Button
                onClick={() => { setRecordedBlob(null); setRecordedUrl(null); setRecordProgress(0); }}
                variant="ghost"
                className="h-8 text-xs text-slate-500 hover:text-red-400"
              >
                Redo
              </Button>
            </div>
          </div>
        )}

        {/* Credit note */}
        <div className="flex items-start gap-2 p-2 bg-green-500/10 rounded border border-green-500/20">
          <CheckCircle2 className="w-3 h-3 text-green-400 shrink-0 mt-0.5" />
          <p className="text-[10px] text-green-300/80">
            Zero ElevenLabs credits — Script uses Lovable AI, voice uses browser's built-in TTS engine.
          </p>
        </div>
      </div>
    </div>
  );
}
