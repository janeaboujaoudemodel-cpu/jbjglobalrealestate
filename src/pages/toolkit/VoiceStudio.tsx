import { Link } from "react-router-dom";
import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { 
  Mic, 
  Upload, 
  Play, 
  Pause,
  Square,
  Download, 
  Trash2, 
  Loader2,
  Volume2,
  Wand2,
  AlertTriangle,
  FileAudio,
  Video,
  Check
} from "lucide-react";

// Voice library presets using ElevenLabs voice IDs
const VOICE_LIBRARY = [
  { id: "CwhRBWXzGAHq8TQ4Fs17", name: "Roger", gender: "male", accent: "British", description: "Professional & Clear" },
  { id: "EXAVITQu4vr4xnSDxMaL", name: "Sarah", gender: "female", accent: "American", description: "Warm & Friendly" },
  { id: "JBFqnCBsd6RMkjVDRZzb", name: "George", gender: "male", accent: "British", description: "Authoritative" },
  { id: "FGY2WhTYpPnrIDTdsKH5", name: "Laura", gender: "female", accent: "American", description: "Natural & Engaging" },
  { id: "IKne3meq5aSn9XLyUdCD", name: "Charlie", gender: "male", accent: "Australian", description: "Casual & Upbeat" },
  { id: "pFZP5JQG7iQjIQuC4Bku", name: "Lily", gender: "female", accent: "British", description: "Elegant & Refined" },
  { id: "TX3LPaxmHKxFdv7VOQHJ", name: "Liam", gender: "male", accent: "American", description: "Young & Dynamic" },
  { id: "XrExE9yKIg1WjnnlVkGX", name: "Matilda", gender: "female", accent: "Australian", description: "Bright & Cheerful" },
];

type VoiceMode = "library" | "enhance" | "clone";
type OutputFormat = "mp3" | "wav";

interface RecordedAudio {
  blob: Blob;
  url: string;
  duration: number;
}

export default function VoiceStudio() {
  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordedAudio, setRecordedAudio] = useState<RecordedAudio | null>(null);
  const [uploadedAudio, setUploadedAudio] = useState<File | null>(null);
  const [uploadedAudioUrl, setUploadedAudioUrl] = useState<string | null>(null);
  
  // Script state
  const [script, setScript] = useState("");
  const maxScriptLength = 5000;
  
  // Voice options
  const [voiceMode, setVoiceMode] = useState<VoiceMode>("library");
  const [selectedVoice, setSelectedVoice] = useState(VOICE_LIBRARY[0].id);
  const [cloneConsent, setCloneConsent] = useState(false);
  
  // Output options
  const [outputFormat, setOutputFormat] = useState<OutputFormat>("mp3");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [includeOverlay, setIncludeOverlay] = useState(false);
  
  // Processing state
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState("");
  const [generatedAudio, setGeneratedAudio] = useState<{ url: string; blob: Blob } | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);
  
  // Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  
  const { toast } = useToast();

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recordedAudio?.url) URL.revokeObjectURL(recordedAudio.url);
      if (uploadedAudioUrl) URL.revokeObjectURL(uploadedAudioUrl);
      if (generatedAudio?.url) URL.revokeObjectURL(generatedAudio.url);
    };
  }, []);

  // Recording functions
  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4'
      });
      
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setRecordedAudio({
          blob,
          url,
          duration: recordingTime
        });
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(1000);
      setIsRecording(true);
      setRecordingTime(0);
      
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => {
          if (prev >= 60) {
            stopRecording();
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
      
    } catch (error) {
      console.error('Failed to start recording:', error);
      toast({
        title: "Microphone Access Required",
        description: "Please enable microphone access to record audio.",
        variant: "destructive"
      });
    }
  }, [recordingTime, toast]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }
    }
  }, [isRecording]);

  const handleAudioUpload = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    
    if (!file.type.startsWith('audio/')) {
      toast({
        title: "Invalid File",
        description: "Please upload an audio file (MP3, WAV, M4A, WebM).",
        variant: "destructive"
      });
      return;
    }
    
    if (uploadedAudioUrl) URL.revokeObjectURL(uploadedAudioUrl);
    
    setUploadedAudio(file);
    setUploadedAudioUrl(URL.createObjectURL(file));
    setRecordedAudio(null);
  }, [uploadedAudioUrl, toast]);

  const handleVideoUpload = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    
    if (!file.type.startsWith('video/')) {
      toast({
        title: "Invalid File",
        description: "Please upload a video file (MP4, MOV, WebM).",
        variant: "destructive"
      });
      return;
    }
    
    setVideoFile(file);
    setIncludeOverlay(true);
  }, [toast]);

  const clearAudio = useCallback(() => {
    if (recordedAudio?.url) URL.revokeObjectURL(recordedAudio.url);
    if (uploadedAudioUrl) URL.revokeObjectURL(uploadedAudioUrl);
    setRecordedAudio(null);
    setUploadedAudio(null);
    setUploadedAudioUrl(null);
  }, [recordedAudio, uploadedAudioUrl]);

  const playPreview = useCallback(() => {
    const audioUrl = recordedAudio?.url || uploadedAudioUrl;
    if (!audioUrl) return;
    
    if (previewAudioRef.current) {
      if (isPreviewPlaying) {
        previewAudioRef.current.pause();
        setIsPreviewPlaying(false);
      } else {
        previewAudioRef.current.src = audioUrl;
        previewAudioRef.current.play();
        setIsPreviewPlaying(true);
      }
    }
  }, [recordedAudio, uploadedAudioUrl, isPreviewPlaying]);

  // Generate narration
  const generateNarration = useCallback(async () => {
    if (!script.trim()) {
      toast({
        title: "Script Required",
        description: "Please enter a script for the narration.",
        variant: "destructive"
      });
      return;
    }

    if (voiceMode === "clone" && !cloneConsent) {
      toast({
        title: "Consent Required",
        description: "Please confirm you own the rights to clone this voice.",
        variant: "destructive"
      });
      return;
    }

    if (voiceMode === "clone" && !recordedAudio && !uploadedAudio) {
      toast({
        title: "Voice Sample Required",
        description: "Please record or upload a voice sample for cloning.",
        variant: "destructive"
      });
      return;
    }

    setProcessing(true);
    setProgress(0);
    setProgressText("Preparing...");

    try {
      let voiceId = selectedVoice;

      // For voice cloning, we would call a clone endpoint first
      if (voiceMode === "clone") {
        setProgressText("Note: Voice cloning is processed server-side...");
        setProgress(10);
        // In a full implementation, we'd upload the audio and create a temporary voice
        // For now, use a default voice with a notice
        toast({
          title: "Voice Cloning",
          description: "Using Sarah voice as demo. Full cloning requires additional setup.",
        });
        voiceId = "EXAVITQu4vr4xnSDxMaL"; // Sarah as fallback
      }

      setProgressText("Generating narration...");
      setProgress(30);

      // Call TTS edge function
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/voice-studio-tts`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            text: script,
            voiceId,
            format: outputFormat,
            enhance: voiceMode === "enhance"
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Generation failed: ${errorText}`);
      }

      setProgress(80);
      setProgressText("Processing audio...");

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);

      if (generatedAudio?.url) {
        URL.revokeObjectURL(generatedAudio.url);
      }

      setGeneratedAudio({ url: audioUrl, blob: audioBlob });
      setProgress(100);
      setProgressText("Complete!");

      toast({
        title: "Narration Generated!",
        description: "Your audio is ready to download.",
      });

    } catch (error) {
      console.error('Generation error:', error);
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive"
      });
    } finally {
      setProcessing(false);
    }
  }, [script, voiceMode, selectedVoice, cloneConsent, recordedAudio, uploadedAudio, outputFormat, generatedAudio, toast]);

  const playGenerated = useCallback(() => {
    if (!generatedAudio?.url || !audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.src = generatedAudio.url;
      audioRef.current.play();
      setIsPlaying(true);
    }
  }, [generatedAudio, isPlaying]);

  const downloadAudio = useCallback((format: "mp3" | "wav") => {
    if (!generatedAudio?.blob) return;
    
    const link = document.createElement('a');
    link.href = generatedAudio.url;
    link.download = `narration_${Date.now()}.${format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Download Started",
      description: `Your ${format.toUpperCase()} file is downloading.`,
    });
  }, [generatedAudio, toast]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const hasAudioSample = Boolean(recordedAudio || uploadedAudio);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Hidden audio elements */}
      <audio 
        ref={audioRef} 
        onEnded={() => setIsPlaying(false)}
        onPause={() => setIsPlaying(false)}
      />
      <audio 
        ref={previewAudioRef} 
        onEnded={() => setIsPreviewPlaying(false)}
        onPause={() => setIsPreviewPlaying(false)}
      />
      
      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*"
        className="hidden"
        onChange={(e) => handleAudioUpload(e.target.files)}
      />
      <input
        ref={videoInputRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={(e) => handleVideoUpload(e.target.files)}
      />

      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm">
        <div className="container max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-[#D4AF37]/20 to-[#B8860B]/20 border border-[#D4AF37]/30">
                <Mic className="h-6 w-6 text-[#D4AF37]" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                  Voice Studio
                  <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs">
                    FREE
                  </Badge>
                </h1>
                <p className="text-slate-400 text-sm">Record → Multi-Voice Narration</p>
              </div>
            </div>
            <Link
              to="/toolkit/voice-studio-pro"
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600/20 to-fuchsia-600/10 border border-purple-500/40 text-purple-300 hover:border-purple-400 hover:text-purple-200 transition-all text-sm font-medium"
            >
              <Wand2 className="h-4 w-4" />
              Try Voice Studio Pro
              <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30 text-[10px] ml-1">
                CLONE · 16 LANGS
              </Badge>
            </Link>
          </div>
        </div>
      </div>

      <div className="container max-w-6xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left Column - Input */}
          <div className="space-y-6">
            {/* Step 1: Audio Input */}
            <Card className="bg-slate-900/50 border-slate-700/50">
              <CardHeader className="pb-4">
                <CardTitle className="text-white flex items-center gap-2 text-lg">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#D4AF37]/20 text-[#D4AF37] text-sm font-bold">1</span>
                  Audio Input
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-3">
                  <Button
                    onClick={isRecording ? stopRecording : startRecording}
                    variant={isRecording ? "destructive" : "default"}
                    className={isRecording ? "" : "bg-[#D4AF37] hover:bg-[#B8860B] text-black"}
                  >
                    {isRecording ? (
                      <>
                        <Square className="h-4 w-4 mr-2" />
                        Stop ({formatTime(recordingTime)})
                      </>
                    ) : (
                      <>
                        <Mic className="h-4 w-4 mr-2" />
                        Record Voice
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="border-slate-600 text-slate-300 hover:bg-slate-800"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Audio
                  </Button>
                </div>

                {isRecording && (
                  <div className="flex items-center gap-2 text-red-400">
                    <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-sm">Recording... (max 60 seconds)</span>
                  </div>
                )}

                {hasAudioSample && !isRecording && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/50 border border-slate-700">
                    <FileAudio className="h-5 w-5 text-[#D4AF37]" />
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm truncate">
                        {uploadedAudio?.name || `Recording (${formatTime(recordedAudio?.duration || 0)})`}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={playPreview}
                      className="text-slate-400 hover:text-white"
                    >
                      {isPreviewPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearAudio}
                      className="text-slate-400 hover:text-red-400"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}

                <p className="text-xs text-slate-500">
                  Record or upload a voice sample for cloning, or skip for library voices.
                </p>
              </CardContent>
            </Card>

            {/* Step 2: Script */}
            <Card className="bg-slate-900/50 border-slate-700/50">
              <CardHeader className="pb-4">
                <CardTitle className="text-white flex items-center gap-2 text-lg">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#D4AF37]/20 text-[#D4AF37] text-sm font-bold">2</span>
                  Script
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Textarea
                  placeholder="Enter your narration script here..."
                  value={script}
                  onChange={(e) => setScript(e.target.value.slice(0, maxScriptLength))}
                  className="min-h-[150px] bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 resize-none"
                />
                <div className="flex justify-between text-xs text-slate-500">
                  <span>
                    {script.length.toLocaleString()} / {maxScriptLength.toLocaleString()} characters
                  </span>
                  <span className={script.length > maxScriptLength * 0.9 ? "text-amber-400" : ""}>
                    {script.length >= maxScriptLength ? "Limit reached" : ""}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Step 3: Voice Selection */}
            <Card className="bg-slate-900/50 border-slate-700/50">
              <CardHeader className="pb-4">
                <CardTitle className="text-white flex items-center gap-2 text-lg">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#D4AF37]/20 text-[#D4AF37] text-sm font-bold">3</span>
                  Voice Selection
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs value={voiceMode} onValueChange={(v) => setVoiceMode(v as VoiceMode)}>
                  <TabsList className="grid w-full grid-cols-3 bg-slate-800/50">
                    <TabsTrigger value="library" className="data-[state=active]:bg-[#D4AF37] data-[state=active]:text-black">
                      Voice Library
                    </TabsTrigger>
                    <TabsTrigger value="enhance" className="data-[state=active]:bg-[#D4AF37] data-[state=active]:text-black">
                      Enhance
                    </TabsTrigger>
                    <TabsTrigger value="clone" className="data-[state=active]:bg-[#D4AF37] data-[state=active]:text-black">
                      My Voice
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="library" className="mt-4">
                    <div className="grid grid-cols-2 gap-2">
                      {VOICE_LIBRARY.map((voice) => (
                        <button
                          key={voice.id}
                          onClick={() => setSelectedVoice(voice.id)}
                          className={`p-3 rounded-lg border text-left transition-all ${
                            selectedVoice === voice.id
                              ? "border-[#D4AF37] bg-[#D4AF37]/10"
                              : "border-slate-700 bg-slate-800/30 hover:border-slate-600"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <Volume2 className={`h-4 w-4 ${selectedVoice === voice.id ? "text-[#D4AF37]" : "text-slate-500"}`} />
                            <span className="text-white font-medium text-sm">{voice.name}</span>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-[10px] border-slate-600 text-slate-400">
                              {voice.gender}
                            </Badge>
                            <Badge variant="outline" className="text-[10px] border-slate-600 text-slate-400">
                              {voice.accent}
                            </Badge>
                          </div>
                          <p className="text-xs text-slate-500 mt-1">{voice.description}</p>
                        </button>
                      ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="enhance" className="mt-4 space-y-4">
                    <div className="flex items-start gap-3 p-4 rounded-lg bg-slate-800/50 border border-slate-700">
                      <Wand2 className="h-5 w-5 text-[#D4AF37] mt-0.5" />
                      <div>
                        <h4 className="text-white font-medium">Voice Enhancement</h4>
                        <p className="text-sm text-slate-400 mt-1">
                          Clean up your recorded audio by removing background noise and enhancing clarity. 
                          The enhanced audio will be used with a library voice for narration.
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {VOICE_LIBRARY.slice(0, 4).map((voice) => (
                        <button
                          key={voice.id}
                          onClick={() => setSelectedVoice(voice.id)}
                          className={`p-3 rounded-lg border text-left transition-all ${
                            selectedVoice === voice.id
                              ? "border-[#D4AF37] bg-[#D4AF37]/10"
                              : "border-slate-700 bg-slate-800/30 hover:border-slate-600"
                          }`}
                        >
                          <span className="text-white text-sm">{voice.name}</span>
                          <span className="text-slate-500 text-xs ml-2">({voice.accent})</span>
                        </button>
                      ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="clone" className="mt-4 space-y-4">
                    {/* Safety Banner */}
                    <Alert className="bg-amber-950/30 border-amber-600/50">
                      <AlertTriangle className="h-4 w-4 text-amber-500" />
                      <AlertDescription className="text-amber-200 text-sm">
                        <strong>Voice Cloning Policy:</strong> You may only clone your own voice. 
                        Cloning someone else's voice without consent is prohibited and may result in 
                        account suspension.
                      </AlertDescription>
                    </Alert>

                    {!hasAudioSample ? (
                      <div className="p-6 rounded-lg border-2 border-dashed border-slate-700 text-center">
                        <Mic className="h-8 w-8 text-slate-500 mx-auto mb-3" />
                        <p className="text-slate-400 text-sm">
                          Record or upload a voice sample above to enable voice cloning.
                        </p>
                        <p className="text-slate-500 text-xs mt-2">
                          Recommended: 30+ seconds of clear speech
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-950/30 border border-emerald-700/50">
                          <Check className="h-4 w-4 text-emerald-400" />
                          <span className="text-emerald-300 text-sm">Voice sample ready for cloning</span>
                        </div>

                        <div className="flex items-start space-x-3 p-4 rounded-lg bg-slate-800/50 border border-slate-700">
                          <Checkbox
                            id="consent"
                            checked={cloneConsent}
                            onCheckedChange={(checked) => setCloneConsent(checked === true)}
                            className="mt-1 border-slate-500 data-[state=checked]:bg-[#D4AF37] data-[state=checked]:border-[#D4AF37]"
                          />
                          <div className="space-y-1">
                            <Label htmlFor="consent" className="text-white text-sm font-medium cursor-pointer">
                              I confirm I am the legal owner of this voice
                            </Label>
                            <p className="text-xs text-slate-400">
                              By checking this box, you certify that you have the legal right to clone 
                              this voice and that you will not use it to impersonate others.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Output */}
          <div className="space-y-6">
            {/* Step 4: Output Options */}
            <Card className="bg-slate-900/50 border-slate-700/50">
              <CardHeader className="pb-4">
                <CardTitle className="text-white flex items-center gap-2 text-lg">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#D4AF37]/20 text-[#D4AF37] text-sm font-bold">4</span>
                  Output Options
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-slate-300 text-sm mb-3 block">Audio Format</Label>
                  <RadioGroup
                    value={outputFormat}
                    onValueChange={(v) => setOutputFormat(v as OutputFormat)}
                    className="flex gap-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="mp3" id="mp3" className="border-slate-500 text-[#D4AF37]" />
                      <Label htmlFor="mp3" className="text-slate-300 cursor-pointer">MP3 (Smaller)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="wav" id="wav" className="border-slate-500 text-[#D4AF37]" />
                      <Label htmlFor="wav" className="text-slate-300 cursor-pointer">WAV (Higher Quality)</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="pt-2 border-t border-slate-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="overlay"
                        checked={includeOverlay}
                        onCheckedChange={(checked) => setIncludeOverlay(checked === true)}
                        className="border-slate-500 data-[state=checked]:bg-[#D4AF37] data-[state=checked]:border-[#D4AF37]"
                      />
                      <Label htmlFor="overlay" className="text-slate-300 text-sm cursor-pointer">
                        Overlay onto video
                      </Label>
                    </div>
                    {includeOverlay && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => videoInputRef.current?.click()}
                        className="border-slate-600 text-slate-300 hover:bg-slate-800"
                      >
                        <Video className="h-4 w-4 mr-2" />
                        {videoFile ? "Change Video" : "Upload Video"}
                      </Button>
                    )}
                  </div>
                  {videoFile && includeOverlay && (
                    <div className="mt-2 flex items-center gap-2 text-sm text-slate-400">
                      <Video className="h-4 w-4" />
                      <span className="truncate">{videoFile.name}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setVideoFile(null)}
                        className="text-slate-500 hover:text-red-400 p-1 h-auto"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                  {includeOverlay && (
                    <p className="text-xs text-slate-500 mt-2">
                      Note: Video overlay creates separate audio + video files for manual merging.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Generate Button */}
            <Button
              onClick={generateNarration}
              disabled={processing || !script.trim() || (voiceMode === "clone" && !cloneConsent)}
              className="w-full h-14 bg-gradient-to-r from-[#D4AF37] to-[#B8860B] hover:from-[#B8860B] hover:to-[#8B6914] text-black font-semibold text-lg disabled:opacity-50"
            >
              {processing ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  {progressText}
                </>
              ) : (
                <>
                  <Wand2 className="h-5 w-5 mr-2" />
                  Generate Narration
                </>
              )}
            </Button>

            {processing && (
              <Progress value={progress} className="h-2 bg-slate-800" />
            )}

            {/* Generated Audio */}
            {generatedAudio && !processing && (
              <Card className="bg-gradient-to-br from-emerald-950/40 to-slate-900/50 border-emerald-700/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-emerald-400 flex items-center gap-2 text-lg">
                    <Check className="h-5 w-5" />
                    Narration Ready!
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Button
                      onClick={playGenerated}
                      variant="outline"
                      className="border-emerald-600 text-emerald-400 hover:bg-emerald-950/50"
                    >
                      {isPlaying ? (
                        <>
                          <Pause className="h-4 w-4 mr-2" />
                          Pause
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4 mr-2" />
                          Preview
                        </>
                      )}
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      onClick={() => downloadAudio("mp3")}
                      className="bg-[#D4AF37] hover:bg-[#B8860B] text-black"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download MP3
                    </Button>
                    <Button
                      onClick={() => downloadAudio("wav")}
                      variant="outline"
                      className="border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37]/10"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download WAV
                    </Button>
                  </div>

                  {videoFile && includeOverlay && (
                    <div className="pt-3 border-t border-slate-700">
                      <p className="text-slate-400 text-sm mb-2">Video Overlay Instructions:</p>
                      <ol className="text-xs text-slate-500 space-y-1 list-decimal list-inside">
                        <li>Download your narration audio above</li>
                        <li>Use a free tool like Kapwing, CapCut, or iMovie</li>
                        <li>Import your video and the narration audio</li>
                        <li>Align the audio track and export</li>
                      </ol>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Fair Usage Notice */}
            <div className="p-4 rounded-lg bg-slate-800/30 border border-slate-700/50">
              <h4 className="text-slate-300 text-sm font-medium mb-2">Fair Usage Policy</h4>
              <ul className="text-xs text-slate-500 space-y-1">
                <li>• Maximum 5,000 characters per generation</li>
                <li>• Recording limit: 60 seconds per sample</li>
                <li>• Voice cloning for personal use only</li>
                <li>• No impersonation or deceptive use</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
