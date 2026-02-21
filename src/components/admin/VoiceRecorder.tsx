import { useState, useRef, useCallback } from "react";
import { Mic, Square, Play, Pause, Upload, Trash2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";

const VOICE_SAMPLES = [
  {
    id: 1,
    title: "Sample 1 — Natural Conversation",
    instruction: "Speak naturally for 1-2 minutes. Introduce yourself, share your thoughts on any topic, or describe your day. Use your own words."
  },
  {
    id: 2,
    title: "Sample 2 — Professional Tone",
    instruction: "Speak in a professional, confident tone. Read from your own script or speak freely about business, real estate, or investment topics."
  },
  {
    id: 3,
    title: "Sample 3 — Expressive Range",
    instruction: "Show vocal variety — enthusiasm, calmness, emphasis. This helps capture your full voice range for better cloning quality."
  }
];

interface Recording {
  id: string;
  blob: Blob;
  url: string;
  duration: number;
  sampleIndex: number;
}

const VoiceRecorder = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [currentSample, setCurrentSample] = useState(0);
  const [recordingTime, setRecordingTime] = useState(0);
  const [playingId, setPlayingId] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const startTimeRef = useRef<number>(0);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        } 
      });
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm;codecs=opus') 
          ? 'audio/webm;codecs=opus' 
          : 'audio/webm'
      });
      
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        const duration = (Date.now() - startTimeRef.current) / 1000;
        
        const newRecording: Recording = {
          id: `rec-${Date.now()}`,
          blob,
          url,
          duration,
          sampleIndex: currentSample
        };
        
        setRecordings(prev => [...prev, newRecording]);
        stream.getTracks().forEach(track => track.stop());
        toast.success(`Recording saved (${Math.round(duration)}s)`);
      };
      
      startTimeRef.current = Date.now();
      mediaRecorder.start(1000);
      setIsRecording(true);
      setRecordingTime(0);
      
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
    } catch (error) {
      console.error("Failed to start recording:", error);
      toast.error("Could not access microphone. Please allow microphone access.");
    }
  }, [currentSample]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  }, [isRecording]);

  const playRecording = (recording: Recording) => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    
    if (playingId === recording.id) {
      setPlayingId(null);
      return;
    }
    
    const audio = new Audio(recording.url);
    audioRef.current = audio;
    audio.play();
    setPlayingId(recording.id);
    
    audio.onended = () => {
      setPlayingId(null);
    };
  };

  const deleteRecording = (id: string) => {
    setRecordings(prev => prev.filter(r => r.id !== id));
    toast.success("Recording deleted");
  };

  const getTotalDuration = () => {
    return recordings.reduce((acc, r) => acc + r.duration, 0);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const downloadAllRecordings = async () => {
    if (recordings.length === 0) {
      toast.error("No recordings to download");
      return;
    }

    for (const recording of recordings) {
      const a = document.createElement('a');
      a.href = recording.url;
      a.download = `jane-voice-sample-${recording.sampleIndex + 1}-${recording.id}.webm`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
    
    toast.success("All recordings downloaded!");
  };

  const totalDuration = getTotalDuration();
  const progressPercent = Math.min((totalDuration / 180) * 100, 100);

  return (
    <Card className="bg-white border-2 border-gold/30">
      <CardHeader>
        <CardTitle className="text-gold flex items-center gap-2">
          <Mic className="w-5 h-5" />
          Voice Cloning Recorder
        </CardTitle>
        <CardDescription className="text-black/60">
          Record your voice for ElevenLabs voice cloning. Use your own script or speak freely.
          Target: 3+ minutes of clear speech.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progress toward 3 minutes */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-black/60">Recording Progress</span>
            <span className={totalDuration >= 180 ? "text-green-600" : "text-gold"}>
              {formatTime(totalDuration)} / 3:00 min
            </span>
          </div>
          <Progress value={progressPercent} className="h-2" />
          {totalDuration >= 180 && (
            <p className="text-green-600 text-sm flex items-center gap-1">
              <CheckCircle className="w-4 h-4" />
              You have enough audio! You can record more for better quality.
            </p>
          )}
        </div>

        {/* Sample selector */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-sm text-black/60">Voice Sample Type:</span>
            <select
              value={currentSample}
              onChange={(e) => setCurrentSample(Number(e.target.value))}
              className="bg-white border-2 border-gold/30 rounded px-2 py-1 text-sm text-black"
            >
              {VOICE_SAMPLES.map((sample, i) => (
                <option key={i} value={i}>{sample.title}</option>
              ))}
            </select>
          </div>
          
          <div className="bg-gold/5 border border-gold/20 rounded-lg p-4 space-y-3">
            <h4 className="text-gold font-medium text-sm">
              {VOICE_SAMPLES[currentSample].title}
            </h4>
            <p className="text-black text-lg leading-relaxed">
              {VOICE_SAMPLES[currentSample].instruction}
            </p>
            <p className="text-black/50 text-sm italic">
              This recording will be used exclusively for voice cloning. Speak in your natural voice.
            </p>
          </div>
        </div>

        {/* Recording controls */}
        <div className="flex items-center justify-center gap-4">
          {!isRecording ? (
            <Button
              onClick={startRecording}
              className="bg-red-600 hover:bg-red-500 text-white px-8 py-6 rounded-full"
            >
              <Mic className="w-6 h-6 mr-2" />
              Start Recording
            </Button>
          ) : (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-red-500">
                <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                <span className="text-lg font-mono">{formatTime(recordingTime)}</span>
              </div>
              <Button
                onClick={stopRecording}
                variant="outline"
                className="border-red-500 text-red-500 hover:bg-red-500/10 px-6 py-5"
              >
                <Square className="w-5 h-5 mr-2" />
                Stop
              </Button>
            </div>
          )}
        </div>

        {/* Recordings list */}
        {recordings.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-black font-medium">Your Recordings ({recordings.length})</h4>
            <div className="space-y-2">
              {recordings.map((recording) => (
                <div
                  key={recording.id}
                  className="flex items-center justify-between bg-gold/5 border border-gold/20 rounded-lg p-3"
                >
                  <div className="flex items-center gap-3">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => playRecording(recording)}
                      className="text-gold hover:text-gold-light"
                    >
                      {playingId === recording.id ? (
                        <Pause className="w-4 h-4" />
                      ) : (
                        <Play className="w-4 h-4" />
                      )}
                    </Button>
                    <div>
                      <p className="text-black text-sm">
                        {VOICE_SAMPLES[recording.sampleIndex]?.title || `Sample ${recording.sampleIndex + 1}`}
                      </p>
                      <p className="text-black/40 text-xs">
                        {formatTime(recording.duration)}
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => deleteRecording(recording.id)}
                    className="text-black/40 hover:text-red-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Download button */}
        {recordings.length > 0 && totalDuration >= 60 && (
          <Button
            onClick={downloadAllRecordings}
            className="w-full bg-gold hover:bg-gold-light text-gold-foreground"
          >
            <Upload className="w-4 h-4 mr-2" />
            Download All Recordings for Voice Cloning
          </Button>
        )}

        {/* Instructions */}
        <div className="bg-gold/5 border border-gold/20 rounded-lg p-4 text-sm text-black/60 space-y-2">
          <p className="font-medium text-black">Recording Tips:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Record in a quiet room with minimal echo</li>
            <li>Speak naturally at your normal pace</li>
            <li>Keep consistent distance from microphone</li>
            <li>Use your own script — this is for voice cloning only</li>
            <li>Aim for 3+ minutes total for best voice cloning results</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default VoiceRecorder;
