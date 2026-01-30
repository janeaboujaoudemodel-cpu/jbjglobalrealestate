import { useState, useRef, useCallback } from "react";
import { Mic, Square, Play, Pause, Upload, Trash2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";

const SCRIPT_EXCERPTS = [
  {
    episode: 1,
    title: "Why Dubai Became the Capital of Global Investors",
    lines: [
      "Dubai didn't grow by accident. It was designed for global capital, clarity, and speed.",
      "What truly differentiates Dubai is regulatory clarity combined with execution speed.",
      "From an investor's perspective, Dubai removes friction that exists in most global cities."
    ]
  },
  {
    episode: 2,
    title: "Buying Property Smartly in a Global Market",
    lines: [
      "Buying property today isn't about price alone, it's about timing, structure, and intent.",
      "Most buyers lose money by ignoring market cycles and liquidity.",
      "Smart investors plan five moves ahead, not one."
    ]
  },
  {
    episode: 3,
    title: "The Truth About Off-Plan vs Ready Properties",
    lines: [
      "Off-plan works when risk is understood, not ignored.",
      "Liquidity is the conversation most people avoid.",
      "Different strategies exist for different investor profiles."
    ]
  },
  {
    episode: 4,
    title: "How High-Net-Worth Investors Protect Capital",
    lines: [
      "Wealth is built by opportunity but preserved by structure.",
      "Asset allocation quietly determines outcomes.",
      "Risk is managed, not eliminated."
    ]
  },
  {
    episode: 5,
    title: "Golden Visa Strategy Through Real Estate",
    lines: [
      "A Golden Visa isn't a lifestyle benefit, it's a strategic tool.",
      "Residency directly affects financial leverage.",
      "Mobility has become a modern form of currency."
    ]
  },
  {
    episode: 6,
    title: "The Psychology of Successful Investors",
    lines: [
      "Emotions are the most expensive mistake in investing.",
      "Discipline always beats intelligence.",
      "Long-term thinking separates winners from noise."
    ]
  },
  {
    episode: 7,
    title: "Why Secondary Market Deals Matter",
    lines: [
      "The best opportunities are rarely advertised.",
      "Information asymmetry creates real advantage.",
      "Timing the exit matters as much as the entry."
    ]
  },
  {
    episode: 8,
    title: "Luxury Real Estate vs Mass Market Returns",
    lines: [
      "Luxury behaves differently during market shifts.",
      "Scarcity protects long-term value.",
      "End-users buy emotionally, investors buy structurally."
    ]
  },
  {
    episode: 9,
    title: "Mistakes First-Time Investors Always Make",
    lines: [
      "Everyone pays tuition in the market.",
      "Ignoring fundamentals is the biggest error.",
      "Chasing trends is rarely sustainable."
    ]
  },
  {
    episode: 10,
    title: "Building a Global Property Portfolio",
    lines: [
      "One country is never enough for real diversification.",
      "Geographic spread reduces exposure.",
      "Currency plays a larger role than most realize."
    ]
  }
];

interface Recording {
  id: string;
  blob: Blob;
  url: string;
  duration: number;
  episodeIndex: number;
}

const VoiceRecorder = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [currentEpisode, setCurrentEpisode] = useState(0);
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
          episodeIndex: currentEpisode
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
  }, [currentEpisode]);

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
      a.download = `jane-voice-sample-ep${recording.episodeIndex + 1}-${recording.id}.webm`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
    
    toast.success("All recordings downloaded!");
  };

  const totalDuration = getTotalDuration();
  const progressPercent = Math.min((totalDuration / 180) * 100, 100); // Target: 3 minutes

  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardHeader>
        <CardTitle className="text-gold flex items-center gap-2">
          <Mic className="w-5 h-5" />
          Voice Cloning Recorder
        </CardTitle>
        <CardDescription className="text-zinc-400">
          Record yourself reading podcast scripts for ElevenLabs voice cloning. 
          Target: 3+ minutes of clear speech.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progress toward 3 minutes */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-zinc-400">Recording Progress</span>
            <span className={totalDuration >= 180 ? "text-green-500" : "text-gold"}>
              {formatTime(totalDuration)} / 3:00 min
            </span>
          </div>
          <Progress value={progressPercent} className="h-2" />
          {totalDuration >= 180 && (
            <p className="text-green-500 text-sm flex items-center gap-1">
              <CheckCircle className="w-4 h-4" />
              You have enough audio! You can record more for better quality.
            </p>
          )}
        </div>

        {/* Script to read */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-sm text-zinc-400">Currently reading:</span>
            <select
              value={currentEpisode}
              onChange={(e) => setCurrentEpisode(Number(e.target.value))}
              className="bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-sm text-white"
            >
              {SCRIPT_EXCERPTS.map((ep, i) => (
                <option key={i} value={i}>Episode {ep.episode}: {ep.title}</option>
              ))}
            </select>
          </div>
          
          <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-4 space-y-3">
            <h4 className="text-gold font-medium text-sm">
              Episode {SCRIPT_EXCERPTS[currentEpisode].episode} Script
            </h4>
            {SCRIPT_EXCERPTS[currentEpisode].lines.map((line, i) => (
              <p key={i} className="text-white text-lg leading-relaxed">
                "{line}"
              </p>
            ))}
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
            <h4 className="text-white font-medium">Your Recordings ({recordings.length})</h4>
            <div className="space-y-2">
              {recordings.map((recording) => (
                <div
                  key={recording.id}
                  className="flex items-center justify-between bg-zinc-800 rounded-lg p-3"
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
                      <p className="text-white text-sm">
                        Episode {recording.episodeIndex + 1} Sample
                      </p>
                      <p className="text-zinc-500 text-xs">
                        {formatTime(recording.duration)}
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => deleteRecording(recording.id)}
                    className="text-zinc-500 hover:text-red-500"
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
        <div className="bg-zinc-800/30 border border-zinc-700/50 rounded-lg p-4 text-sm text-zinc-400 space-y-2">
          <p className="font-medium text-white">Recording Tips:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Record in a quiet room with minimal echo</li>
            <li>Speak naturally at your normal pace</li>
            <li>Keep consistent distance from microphone</li>
            <li>Read all 3 episodes for variety</li>
            <li>Aim for 3+ minutes total for best voice cloning results</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default VoiceRecorder;
