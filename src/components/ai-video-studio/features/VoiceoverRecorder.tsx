import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Mic,
  Square,
  Play,
  Pause,
  Trash2,
  Bot
} from 'lucide-react';
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
      </Tabs>
    </div>
  );
}
