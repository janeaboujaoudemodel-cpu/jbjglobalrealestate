import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Mic,
  Square,
  Play,
  Pause,
  Trash2,
  Wand2,
  Loader2,
  AlertTriangle,
  Bot
} from 'lucide-react';
import { VOICE_OPTIONS, SUPPORTED_LANGUAGES } from '../types';
import { toast } from 'sonner';
import { AITalkingAgentPanel } from './AITalkingAgentPanel';

interface VoiceoverRecorderProps {
  onRecordingComplete: (audioBlob: Blob, duration: number) => void;
  onAIVoiceGenerated: (audioUrl: string, duration: number) => void;
}

export function VoiceoverRecorder({ onRecordingComplete, onAIVoiceGenerated }: VoiceoverRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);

  // AI Voice (ElevenLabs) state
  const [aiText, setAiText] = useState('');
  const [selectedVoice, setSelectedVoice] = useState<string>(VOICE_OPTIONS[0].id);
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [isGenerating, setIsGenerating] = useState(false);
  const [consentChecked, setConsentChecked] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number>();
  const startTimeRef = useRef<number>(0);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });

      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setRecordedBlob(blob);
        setRecordedUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start(100);
      setIsRecording(true);
      startTimeRef.current = Date.now();

      timerRef.current = window.setInterval(() => {
        setRecordingDuration((Date.now() - startTimeRef.current) / 1000);
      }, 100);
    } catch (error) {
      console.error('Failed to start recording:', error);
      toast.error('Failed to access microphone. Please check permissions.');
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  }, [isRecording]);

  const togglePlayback = useCallback(() => {
    if (!audioRef.current || !recordedUrl) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying, recordedUrl]);

  const deleteRecording = useCallback(() => {
    setRecordedBlob(null);
    setRecordedUrl(null);
    setRecordingDuration(0);
    setIsPlaying(false);
  }, []);

  const addToTimeline = useCallback(() => {
    if (recordedBlob) {
      onRecordingComplete(recordedBlob, recordingDuration);
      toast.success('Voiceover added to timeline');
      deleteRecording();
    }
  }, [recordedBlob, recordingDuration, onRecordingComplete, deleteRecording]);

  const generateAIVoice = useCallback(async () => {
    if (!aiText.trim()) {
      toast.error('Please enter text for the AI voice');
      return;
    }
    if (!consentChecked) {
      toast.error('Please confirm AI voice consent');
      return;
    }
    setIsGenerating(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/voice-studio-tts`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ text: aiText, voiceId: selectedVoice, format: 'mp3' }),
        }
      );
      if (!response.ok) throw new Error('Failed to generate voice');
      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      await new Promise<void>((resolve) => {
        audio.onloadedmetadata = () => resolve();
        audio.onerror = () => resolve();
      });
      onAIVoiceGenerated(audioUrl, audio.duration || aiText.length / 15);
      toast.success('AI voiceover generated and added to timeline');
      setAiText('');
    } catch (error) {
      console.error('AI voice generation failed:', error);
      toast.error('Failed to generate AI voice. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  }, [aiText, selectedVoice, consentChecked, onAIVoiceGenerated]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (recordedUrl) URL.revokeObjectURL(recordedUrl);
    };
  }, [recordedUrl]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 10);
    return `${mins}:${secs.toString().padStart(2, '0')}.${ms}`;
  };

  return (
    <div className="space-y-2">
      <Tabs defaultValue="record" className="w-full">
        <TabsList className="w-full bg-slate-800 border border-slate-700 h-8 p-0.5">
          <TabsTrigger
            value="record"
            className="flex-1 h-7 text-xs data-[state=active]:bg-slate-700 data-[state=active]:text-white text-slate-400"
          >
            <Mic className="w-3 h-3 mr-1" /> Record
          </TabsTrigger>
          <TabsTrigger
            value="ai-agent"
            className="flex-1 h-7 text-xs data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-300 text-slate-400"
          >
            <Bot className="w-3 h-3 mr-1" /> AI Agent
          </TabsTrigger>
          <TabsTrigger
            value="ai-voice"
            className="flex-1 h-7 text-xs data-[state=active]:bg-slate-700 data-[state=active]:text-white text-slate-400"
          >
            <Wand2 className="w-3 h-3 mr-1" /> EL Voice
          </TabsTrigger>
        </TabsList>

        {/* ── Record Tab ── */}
        <TabsContent value="record" className="mt-2">
          <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700">
            <div className="flex items-center justify-center gap-4 mb-3">
              {!isRecording && !recordedBlob && (
                <Button
                  onClick={startRecording}
                  className="bg-red-500 hover:bg-red-600 text-white rounded-full w-16 h-16"
                >
                  <Mic className="w-8 h-8" />
                </Button>
              )}
              {isRecording && (
                <div className="flex flex-col items-center gap-2">
                  <Button
                    onClick={stopRecording}
                    className="bg-red-500 hover:bg-red-600 text-white rounded-full w-16 h-16 animate-pulse"
                  >
                    <Square className="w-6 h-6" />
                  </Button>
                  <span className="text-red-400 font-mono text-lg">
                    {formatTime(recordingDuration)}
                  </span>
                </div>
              )}
              {recordedBlob && !isRecording && (
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="ghost" onClick={togglePlayback} className="text-slate-400 hover:text-white">
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </Button>
                  <span className="text-slate-400 font-mono text-sm">{formatTime(recordingDuration)}</span>
                  <Button size="sm" variant="ghost" onClick={deleteRecording} className="text-red-400 hover:text-red-300">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                  <Button size="sm" onClick={addToTimeline} className="bg-gold text-black hover:bg-gold/90">
                    Add to Timeline
                  </Button>
                </div>
              )}
            </div>
            {recordedUrl && (
              <audio ref={audioRef} src={recordedUrl} onEnded={() => setIsPlaying(false)} className="hidden" />
            )}
          </div>
        </TabsContent>

        {/* ── AI Agent Tab ── */}
        <TabsContent value="ai-agent" className="mt-2">
          <AITalkingAgentPanel onAIVoiceGenerated={onAIVoiceGenerated} />
        </TabsContent>

        {/* ── ElevenLabs Voice Tab ── */}
        <TabsContent value="ai-voice" className="mt-2">
          <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700 space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs text-slate-400">Voice</Label>
                <Select value={selectedVoice} onValueChange={setSelectedVoice}>
                  <SelectTrigger className="h-8 bg-slate-800 border-slate-700 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {VOICE_OPTIONS.map((voice) => (
                      <SelectItem key={voice.id} value={voice.id}>
                        {voice.name} ({voice.gender})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-slate-400">Language</Label>
                <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                  <SelectTrigger className="h-8 bg-slate-800 border-slate-700 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SUPPORTED_LANGUAGES.map((lang) => (
                      <SelectItem key={lang.code} value={lang.code}>
                        {lang.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Textarea
              value={aiText}
              onChange={(e) => setAiText(e.target.value)}
              placeholder="Enter text for AI to speak..."
              className="min-h-[80px] bg-slate-800 border-slate-700 text-white text-sm resize-none"
            />
            <div className="flex items-start gap-2 p-2 bg-amber-500/10 rounded border border-amber-500/30">
              <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-amber-200">
                <p className="font-medium">Uses ElevenLabs credits</p>
                <p className="text-amber-200/70 mt-1">By using AI voices, you confirm you have the right to use generated audio.</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="el-consent"
                checked={consentChecked}
                onCheckedChange={(checked) => setConsentChecked(checked === true)}
              />
              <Label htmlFor="el-consent" className="text-xs text-slate-400">
                I confirm I have the right to use AI-generated voice content
              </Label>
            </div>
            <Button
              onClick={generateAIVoice}
              disabled={isGenerating || !aiText.trim() || !consentChecked}
              className="w-full bg-gold text-black hover:bg-gold/90 disabled:opacity-50"
            >
              {isGenerating ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating...</>
              ) : (
                <><Wand2 className="w-4 h-4 mr-2" /> Generate ElevenLabs Voice</>
              )}
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
