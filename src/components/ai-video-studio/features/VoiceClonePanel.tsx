/**
 * VoiceClonePanel — Clone your voice via voice-studio-clone edge function
 * 
 * Features:
 * - Upload audio sample → clone voice via ElevenLabs
 * - Generate TTS with cloned voice
 * - Add generated audio to timeline
 * - List previously cloned voices
 * 
 * Edge functions used:
 * - voice-studio-clone (action: clone_voice, tts_with_clone, list_voices, delete_clone)
 */
import React, { useCallback, useRef, useState, useEffect } from 'react';
import { Mic2, Upload, Play, Pause, Plus, Download, Trash2, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "@/config/backend";

interface ClonedVoice {
  voice_id: string;
  name: string;
}

interface VoiceClonePanelProps {
  onAddToTimeline?: (audioUrl: string, duration: number, name: string) => void;
}

export function VoiceClonePanel({ onAddToTimeline }: VoiceClonePanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [voiceName, setVoiceName] = useState('');
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [isCloning, setIsCloning] = useState(false);
  const [clonedVoices, setClonedVoices] = useState<ClonedVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<ClonedVoice | null>(null);
  const [ttsText, setTtsText] = useState('');
  const [isGeneratingTTS, setIsGeneratingTTS] = useState(false);
  const [generatedAudioUrl, setGeneratedAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoadingVoices, setIsLoadingVoices] = useState(false);

  // Load cloned voices on mount
  useEffect(() => {
    loadClonedVoices();
  }, []);

  const loadClonedVoices = useCallback(async () => {
    setIsLoadingVoices(true);
    try {
      const { data, error } = await supabase.functions.invoke('voice-studio-clone', {
        body: { action: 'list_voices' },
      });
      if (error) throw error;
      if (data?.voices) {
        setClonedVoices(data.voices.map((v: any) => ({ voice_id: v.voice_id, name: v.name })));
      }
    } catch (err) {
      console.error('Failed to load cloned voices:', err);
    } finally {
      setIsLoadingVoices(false);
    }
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('audio/')) {
      toast.error('Please select an audio file (MP3, WAV, WebM)');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Audio file must be under 10MB');
      return;
    }
    setAudioFile(file);
  }, []);

  const handleCloneVoice = useCallback(async () => {
    if (!audioFile) { toast.error('Please upload a voice sample first'); return; }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { toast.error('Please log in to clone your voice'); return; }

    setIsCloning(true);
    try {
      const formData = new FormData();
      formData.append('action', 'clone_voice');
      formData.append('voice_name', voiceName || 'My Cloned Voice');
      formData.append('description', 'Voice cloned from Video Studio');
      formData.append('files', audioFile);

      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/voice-studio-clone`,
        {
          method: 'POST',
          headers: {
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${session.access_token}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || `Clone failed: ${response.status}`);
      }

      const data = await response.json();
      const newVoice: ClonedVoice = { voice_id: data.voice_id, name: data.name || voiceName || 'My Cloned Voice' };
      setClonedVoices(prev => [newVoice, ...prev]);
      setSelectedVoice(newVoice);
      setAudioFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      toast.success(`🎤 Voice "${newVoice.name}" cloned successfully!`);
    } catch (err: any) {
      console.error('Voice clone error:', err);
      toast.error(err.message || 'Failed to clone voice');
    } finally {
      setIsCloning(false);
    }
  }, [audioFile, voiceName]);

  const handleGenerateTTS = useCallback(async () => {
    if (!selectedVoice) { toast.error('Select a cloned voice first'); return; }
    if (!ttsText.trim()) { toast.error('Enter text to speak'); return; }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { toast.error('Please log in'); return; }

    setIsGeneratingTTS(true);
    setGeneratedAudioUrl(null);
    try {
      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/voice-studio-clone`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            action: 'tts_with_clone',
            voice_id: selectedVoice.voice_id,
            text: ttsText,
            format: 'mp3',
          }),
        }
      );

      if (!response.ok) {
        if (response.status === 429) { toast.error('Rate limited — try again in a moment'); return; }
        if (response.status === 402) { toast.error('Voice credits exhausted'); return; }
        throw new Error(`TTS failed: ${response.status}`);
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setGeneratedAudioUrl(url);
      toast.success('🔊 Voice generated!');
    } catch (err: any) {
      console.error('TTS with clone error:', err);
      toast.error(err.message || 'Failed to generate speech');
    } finally {
      setIsGeneratingTTS(false);
    }
  }, [selectedVoice, ttsText]);

  const handlePlayPause = useCallback(() => {
    if (!generatedAudioUrl) return;
    if (audioRef.current && isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      return;
    }
    if (audioRef.current) {
      audioRef.current.play();
      setIsPlaying(true);
      return;
    }
    const audio = new Audio(generatedAudioUrl);
    audio.onended = () => setIsPlaying(false);
    audioRef.current = audio;
    audio.play();
    setIsPlaying(true);
  }, [generatedAudioUrl, isPlaying]);

  const handleDownload = useCallback(() => {
    if (!generatedAudioUrl) return;
    const a = document.createElement('a');
    a.href = generatedAudioUrl;
    a.download = `${selectedVoice?.name || 'cloned'}-speech.mp3`;
    a.click();
    toast.success('Audio downloaded');
  }, [generatedAudioUrl, selectedVoice]);

  const handleAddToTimeline = useCallback(() => {
    if (!generatedAudioUrl || !onAddToTimeline) return;
    // Estimate duration from text (rough: 150 words/min)
    const wordCount = ttsText.trim().split(/\s+/).length;
    const estimatedDuration = Math.max(3, Math.round((wordCount / 150) * 60));
    onAddToTimeline(generatedAudioUrl, estimatedDuration, `🎤 ${selectedVoice?.name || 'Clone'} — Narration`);
    toast.success('Added to timeline');
  }, [generatedAudioUrl, onAddToTimeline, ttsText, selectedVoice]);

  const handleDeleteVoice = useCallback(async (voice: ClonedVoice) => {
    try {
      const { error } = await supabase.functions.invoke('voice-studio-clone', {
        body: { action: 'delete_clone', voice_id: voice.voice_id },
      });
      if (error) throw error;
      setClonedVoices(prev => prev.filter(v => v.voice_id !== voice.voice_id));
      if (selectedVoice?.voice_id === voice.voice_id) setSelectedVoice(null);
      toast.success(`Voice "${voice.name}" deleted`);
    } catch (err: any) {
      toast.error('Failed to delete voice');
    }
  }, [selectedVoice]);

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-5">

        {/* Header */}
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-purple-500/20">
            <Mic2 className="w-4 h-4 text-purple-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Voice Clone</h3>
            <p className="text-xs text-[#1A1A1A]/70">Clone your voice and generate narration</p>
          </div>
        </div>

        {/* ═══ CLONE SECTION ═══ */}
        <section className="space-y-3">
          <p className="text-xs font-semibold text-[#1A1A1A]/70 uppercase tracking-wider">Clone a New Voice</p>

          <input
            type="text"
            value={voiceName}
            onChange={e => setVoiceName(e.target.value)}
            placeholder="Voice name (e.g. My Voice)"
            className="w-full px-3 py-2 rounded-lg text-xs bg-[#1A1A1A] border border-slate-600 text-white placeholder:text-[#1A1A1A]/70 focus:border-purple-400 focus:outline-none"
          />

          <input ref={fileInputRef} type="file" accept="audio/*" onChange={handleFileSelect} className="hidden" />

          {!audioFile ? (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex flex-col items-center justify-center gap-2 py-6 rounded-lg border-2 border-dashed border-purple-500/30 text-[#1A1A1A]/70 hover:border-purple-500/50 transition-all"
            >
              <Upload className="w-5 h-5 text-purple-400" />
              <span className="text-xs font-medium">Upload Voice Sample</span>
              <span className="text-[10px]">MP3, WAV, WebM · Min 30 seconds recommended</span>
            </button>
          ) : (
            <div className="flex items-center gap-2 p-2.5 rounded-lg border border-purple-500/30 bg-purple-500/10">
              <Mic2 className="w-4 h-4 text-purple-400 flex-shrink-0" />
              <span className="text-xs text-white truncate flex-1">{audioFile.name}</span>
              <button onClick={() => { setAudioFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }} className="text-[#1A1A1A]/70 hover:text-white">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <Button
            onClick={handleCloneVoice}
            disabled={isCloning || !audioFile}
            className="w-full bg-purple-600 hover:bg-purple-500 text-white gap-2"
          >
            {isCloning ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Cloning voice…</>
            ) : (
              <><Sparkles className="w-4 h-4" /> Clone Voice</>
            )}
          </Button>
        </section>

        {/* ═══ CLONED VOICES LIST ═══ */}
        <section className="space-y-2">
          <p className="text-xs font-semibold text-[#1A1A1A]/70 uppercase tracking-wider">
            Your Cloned Voices {isLoadingVoices && <Loader2 className="w-3 h-3 inline animate-spin ml-1" />}
          </p>

          {clonedVoices.length === 0 && !isLoadingVoices && (
            <p className="text-[11px] text-[#1A1A1A]/70">No cloned voices yet. Upload a sample above.</p>
          )}

          <div className="space-y-1.5">
            {clonedVoices.map(voice => (
              <div
                key={voice.voice_id}
                className={`flex items-center gap-2 p-2.5 rounded-lg border transition-all cursor-pointer ${
                  selectedVoice?.voice_id === voice.voice_id
                    ? 'border-purple-400 bg-purple-500/10'
                    : 'border-[#1A1A1A] bg-[#1A1A1A]/60 hover:border-slate-500'
                }`}
                onClick={() => setSelectedVoice(voice)}
              >
                <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                  <Mic2 className="w-3.5 h-3.5 text-purple-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-white font-medium truncate">{voice.name}</p>
                  <p className="text-[10px] text-[#1A1A1A]/70 truncate">{voice.voice_id.slice(0, 12)}…</p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDeleteVoice(voice); }}
                  className="p-1 text-[#1A1A1A]/70 hover:text-red-400 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* ═══ GENERATE TTS WITH CLONE ═══ */}
        {selectedVoice && (
          <section className="space-y-3 p-3 rounded-xl border border-purple-500/20 bg-[#1A1A1A]/60">
            <p className="text-xs font-semibold text-purple-300 uppercase tracking-wider">
              Speak as "{selectedVoice.name}"
            </p>

            <Textarea
              value={ttsText}
              onChange={e => setTtsText(e.target.value)}
              placeholder="Type or paste the text you want this voice to speak..."
              rows={4}
              className="bg-[#1A1A1A]/60 border-slate-600 text-white placeholder:text-[#1A1A1A]/70 text-xs resize-none focus:border-purple-400"
            />

            <Button
              onClick={handleGenerateTTS}
              disabled={isGeneratingTTS || !ttsText.trim()}
              className="w-full bg-purple-600 hover:bg-purple-500 text-white gap-2"
              size="sm"
            >
              {isGeneratingTTS ? (
                <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Generating…</>
              ) : (
                <><Play className="w-3.5 h-3.5" /> Generate Speech</>
              )}
            </Button>

            {/* Generated audio actions */}
            {generatedAudioUrl && (
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-[10px] text-purple-300 font-medium">
                  <Sparkles className="w-3 h-3" /> Audio ready
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handlePlayPause}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[11px] font-medium bg-[#1A1A1A] border border-slate-600 text-white hover:bg-slate-600 transition-all"
                  >
                    {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                    {isPlaying ? 'Pause' : 'Play'}
                  </button>
                  <button
                    onClick={handleDownload}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-medium bg-[#1A1A1A] border border-slate-600 text-white hover:bg-slate-600 transition-all"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                </div>
                {onAddToTimeline && (
                  <Button
                    onClick={handleAddToTimeline}
                    size="sm"
                    className="w-full bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 gap-1.5 text-xs"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add to Timeline
                  </Button>
                )}
              </div>
            )}
          </section>
        )}

      </div>
    </ScrollArea>
  );
}
