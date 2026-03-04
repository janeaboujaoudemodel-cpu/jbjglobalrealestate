import { useState, useRef, useEffect } from "react";
import { 
  Mic, Play, Pause, ChevronRight, Upload, Volume2, 
  Languages, RefreshCw, Wand2, StopCircle, Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { speak, stopSpeaking, ensureVoicesLoaded } from "@/lib/browser-tts";
import type { VideoProject } from "@/pages/VideoBuilder";

interface VideoVoiceStudioProps {
  project: VideoProject;
  onUpdate: (project: VideoProject) => void;
  onNext: () => void;
}

const VOICE_LANGUAGES = [
  { id: "en-GB", label: "English (British)", flag: "🇬🇧" },
  { id: "en-US", label: "English (American)", flag: "🇺🇸" },
  { id: "ar", label: "Arabic", flag: "🇦🇪" },
  { id: "hi", label: "Hindi", flag: "🇮🇳" },
  { id: "ru", label: "Russian", flag: "🇷🇺" },
  { id: "zh", label: "Chinese", flag: "🇨🇳" },
  { id: "fr", label: "French", flag: "🇫🇷" },
  { id: "de", label: "German", flag: "🇩🇪" },
  { id: "it", label: "Italian", flag: "🇮🇹" },
  { id: "es", label: "Spanish", flag: "🇪🇸" },
];

const VOICE_STYLES = [
  { id: "professional", label: "Professional", description: "Clear, authoritative" },
  { id: "warm", label: "Warm & Friendly", description: "Approachable, inviting" },
  { id: "energetic", label: "Energetic", description: "Dynamic, exciting" },
  { id: "calm", label: "Calm & Soothing", description: "Relaxed, peaceful" },
];

const VideoVoiceStudio = ({ project, onUpdate, onNext }: VideoVoiceStudioProps) => {
  const [voiceMethod, setVoiceMethod] = useState<"generate" | "record" | "upload">("generate");
  const [selectedLanguage, setSelectedLanguage] = useState("en-GB");
  const [voiceStyle, setVoiceStyle] = useState("professional");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState([80]);
  const audioRef = useRef<HTMLAudioElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    ensureVoicesLoaded();
  }, []);

  const handleGenerateVoice = async () => {
    if (!project.script) {
      toast.error("Please generate a script first");
      return;
    }

    setIsGenerating(true);
    try {
      // Map style to a browser voice persona
      const voiceId = voiceStyle === "warm" ? "sarah" : voiceStyle === "energetic" ? "charlie" : voiceStyle === "calm" ? "river" : "roger";

      // Use Web Speech API — completely free, no API calls
      speak({
        text: project.script,
        voiceId,
        lang: selectedLanguage.split("-")[0],
        onEnd: () => {},
        onError: () => {},
      });

      // Stop after brief test and mark as ready
      setTimeout(() => stopSpeaking(), 500);

      onUpdate({
        ...project,
        voiceover: {
          url: `speech-synthesis://${encodeURIComponent(project.script.substring(0, 200))}`,
          language: selectedLanguage,
          accent: voiceStyle,
        },
      });

      toast.success("Voiceover ready! Click Play to hear it.");
    } catch (error) {
      console.error("Voice generation error:", error);
      toast.error("Failed to generate voiceover. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const audioUrl = URL.createObjectURL(audioBlob);
        
        onUpdate({
          ...project,
          voiceover: {
            url: audioUrl,
            language: selectedLanguage,
            accent: "recorded",
          },
        });
        
        stream.getTracks().forEach(track => track.stop());
        toast.success("Recording saved!");
      };

      mediaRecorder.start();
      setIsRecording(true);
      toast.info("Recording started...");
    } catch (error) {
      console.error("Recording error:", error);
      toast.error("Failed to start recording. Please check microphone permissions.");
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("audio/")) {
      toast.error("Please upload an audio file");
      return;
    }

    const audioUrl = URL.createObjectURL(file);
    onUpdate({
      ...project,
      voiceover: {
        url: audioUrl,
        language: selectedLanguage,
        accent: "uploaded",
      },
    });
    toast.success("Audio file uploaded!");
  };

  const handlePlayPause = () => {
    if (!project.script) return;
    
    if (isPlaying) {
      stopSpeaking();
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
      const voiceId = voiceStyle === "warm" ? "sarah" : voiceStyle === "energetic" ? "charlie" : voiceStyle === "calm" ? "river" : "roger";
      speak({
        text: project.script,
        voiceId,
        lang: selectedLanguage.split("-")[0],
        onEnd: () => setIsPlaying(false),
        onError: () => setIsPlaying(false),
      });
    }
  };

  const handleVolumeChange = (value: number[]) => {
    setVolume(value);
    if (audioRef.current) {
      audioRef.current.volume = value[0] / 100;
    }
  };

  const handleSkip = () => {
    onNext();
  };

  return (
    <Card className="bg-card/80 backdrop-blur-sm border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mic className="h-5 w-5 text-primary" />
          Voice Studio
        </CardTitle>
        <CardDescription>
          Add professional voiceover narration using AI, your own recording, or upload audio.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Method Tabs */}
        <Tabs value={voiceMethod} onValueChange={(v) => setVoiceMethod(v as any)}>
          <TabsList className="grid grid-cols-3">
            <TabsTrigger value="generate" className="gap-2">
              <Wand2 className="h-4 w-4" />
              AI Generate
            </TabsTrigger>
            <TabsTrigger value="record" className="gap-2">
              <Mic className="h-4 w-4" />
              Record
            </TabsTrigger>
            <TabsTrigger value="upload" className="gap-2">
              <Upload className="h-4 w-4" />
              Upload
            </TabsTrigger>
          </TabsList>

          {/* AI Generate */}
          <TabsContent value="generate" className="space-y-4 mt-4">
            {/* Language Selection */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Languages className="h-4 w-4" />
                Voice Language
              </Label>
              <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                <SelectTrigger>
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  {VOICE_LANGUAGES.map((lang) => (
                    <SelectItem key={lang.id} value={lang.id}>
                      <span className="flex items-center gap-2">
                        <span>{lang.flag}</span>
                        <span>{lang.label}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Voice Style */}
            <div className="space-y-3">
              <Label>Voice Style</Label>
              <RadioGroup
                value={voiceStyle}
                onValueChange={setVoiceStyle}
                className="grid grid-cols-2 gap-3"
              >
                {VOICE_STYLES.map((style) => (
                  <Label
                    key={style.id}
                    htmlFor={`style-${style.id}`}
                    className={`flex flex-col p-3 rounded-lg border cursor-pointer transition-all ${
                      voiceStyle === style.id
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <RadioGroupItem value={style.id} id={`style-${style.id}`} className="sr-only" />
                    <span className="font-medium text-sm">{style.label}</span>
                    <span className="text-xs text-muted-foreground">{style.description}</span>
                  </Label>
                ))}
              </RadioGroup>
            </div>

            <Button
              onClick={handleGenerateVoice}
              disabled={isGenerating || !project.script}
              className="w-full"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Generating Voice...
                </>
              ) : (
                <>
                  <Wand2 className="h-4 w-4 mr-2" />
                  Generate Voiceover
                </>
              )}
            </Button>

            {!project.script && (
              <p className="text-sm text-muted-foreground text-center">
                Please generate a script first before creating voiceover
              </p>
            )}
          </TabsContent>

          {/* Record */}
          <TabsContent value="record" className="space-y-4 mt-4">
            <div className="text-center py-8 space-y-4">
              <div className={`h-24 w-24 mx-auto rounded-full flex items-center justify-center ${
                isRecording ? "bg-destructive/20 animate-pulse" : "bg-muted"
              }`}>
                <Mic className={`h-10 w-10 ${isRecording ? "text-destructive" : "text-muted-foreground"}`} />
              </div>
              
              {isRecording ? (
                <Button variant="destructive" onClick={handleStopRecording}>
                  <StopCircle className="h-4 w-4 mr-2" />
                  Stop Recording
                </Button>
              ) : (
                <Button onClick={handleStartRecording}>
                  <Mic className="h-4 w-4 mr-2" />
                  Start Recording
                </Button>
              )}

              <p className="text-sm text-muted-foreground">
                {isRecording 
                  ? "Recording in progress... Click stop when done"
                  : "Click to start recording your voiceover"
                }
              </p>
            </div>
          </TabsContent>

          {/* Upload */}
          <TabsContent value="upload" className="space-y-4 mt-4">
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*"
              onChange={handleFileUpload}
              className="hidden"
            />
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
            >
              <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground mb-2">
                Click to upload audio file
              </p>
              <p className="text-xs text-muted-foreground">
                Supports: MP3, WAV, M4A, OGG
              </p>
            </div>
          </TabsContent>
        </Tabs>

        {/* Audio Player */}
        {project.voiceover && (
          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button
                  size="icon"
                  variant="outline"
                  onClick={handlePlayPause}
                >
                  {isPlaying ? (
                    <Pause className="h-4 w-4" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                </Button>
                <div>
                  <p className="font-medium text-sm">Voiceover Ready</p>
                  <p className="text-xs text-muted-foreground">
                    {VOICE_LANGUAGES.find(l => l.id === project.voiceover?.language)?.label || "Custom"}
                  </p>
                </div>
              </div>
              <Badge variant="outline" className="bg-primary/10 text-primary">
                <Check className="h-3 w-3 mr-1" />
                Added
              </Badge>
            </div>

            <div className="flex items-center gap-3">
              <Volume2 className="h-4 w-4 text-muted-foreground" />
              <Slider
                value={volume}
                onValueChange={handleVolumeChange}
                max={100}
                step={1}
                className="flex-1"
              />
              <span className="text-xs text-muted-foreground w-8">{volume[0]}%</span>
            </div>

            <audio
              ref={audioRef}
              src={project.voiceover.url}
              onEnded={() => setIsPlaying(false)}
              className="hidden"
            />
          </div>
        )}

        {/* Continue Button */}
        <div className="flex justify-between pt-4 border-t">
          <Button variant="ghost" onClick={handleSkip}>
            Skip for now
          </Button>
          <Button onClick={onNext}>
            Continue to Music <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default VideoVoiceStudio;
