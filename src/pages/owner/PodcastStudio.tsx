import { useState, useCallback, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  ArrowLeft, Mic, MicOff, Play, Pause, Square, Download,
  Volume2, Settings2, Headphones, Globe, User, Radio,
  RefreshCw, Loader2, FileAudio, Clock, Waveform,
  CheckCircle2, AlertCircle, Sparkles
} from "lucide-react";

// ElevenLabs voice catalog
const ELEVENLABS_VOICES = [
  { id: "CwhRBWXzGAHq8TQ4Fs17", name: "Roger", gender: "Male", accent: "American", style: "Confident" },
  { id: "EXAVITQu4vr4xnSDxMaL", name: "Sarah", gender: "Female", accent: "American", style: "Professional" },
  { id: "FGY2WhTYpPnrIDTdsKH5", name: "Laura", gender: "Female", accent: "American", style: "Warm" },
  { id: "IKne3meq5aSn9XLyUdCD", name: "Charlie", gender: "Male", accent: "Australian", style: "Casual" },
  { id: "JBFqnCBsd6RMkjVDRZzb", name: "George", gender: "Male", accent: "British", style: "Analytical" },
  { id: "N2lVS1w4EtoT3dr4eOWO", name: "Callum", gender: "Male", accent: "Scottish", style: "Warm" },
  { id: "SAz9YHcvj6GT2YYXdXww", name: "River", gender: "Non-binary", accent: "American", style: "Confident" },
  { id: "TX3LPaxmHKxFdv7VOQHJ", name: "Liam", gender: "Male", accent: "American", style: "Articulate" },
  { id: "Xb7hH8MSUJpSbSDYk0k2", name: "Alice", gender: "Female", accent: "British", style: "Confident" },
  { id: "XrExE9yKIg1WjnnlVkGX", name: "Matilda", gender: "Female", accent: "Australian", style: "Warm" },
  { id: "bIHbv24MWmeRgasZH58o", name: "Will", gender: "Male", accent: "American", style: "Friendly" },
  { id: "cgSgspJ2msm6clMCkdW9", name: "Jessica", gender: "Female", accent: "American", style: "Expressive" },
  { id: "cjVigY5qzO86Huf0OWal", name: "Eric", gender: "Male", accent: "American", style: "Friendly" },
  { id: "iP95p4xoKVk53GoZ742B", name: "Chris", gender: "Male", accent: "American", style: "Casual" },
  { id: "nPczCjzI2devNBz1zQrb", name: "Brian", gender: "Male", accent: "American", style: "Deep" },
  { id: "onwK4e9ZLuTAKqWW03F9", name: "Daniel", gender: "Male", accent: "British", style: "Authoritative" },
  { id: "pFZP5JQG7iQjIQuC4Bku", name: "Lily", gender: "Female", accent: "British", style: "Warm" },
  { id: "pqHfZKP75CvOlQylNhV4", name: "Bill", gender: "Male", accent: "American", style: "Trustworthy" },
];

const MODELS = [
  { id: "eleven_multilingual_v2", name: "Multilingual v2", description: "Highest quality, 29 languages" },
  { id: "eleven_turbo_v2_5", name: "Turbo v2.5", description: "Low latency, ideal for real-time" },
];

interface Episode {
  id: string;
  title: string;
  script: string;
  voiceId: string;
  voiceName: string;
  status: "draft" | "generating" | "ready" | "error";
  audioUrl?: string;
  duration?: number;
  createdAt: string;
}

const PodcastStudio = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Voice settings
  const [selectedVoice, setSelectedVoice] = useState(ELEVENLABS_VOICES[0].id);
  const [selectedModel, setSelectedModel] = useState("eleven_multilingual_v2");
  const [stability, setStability] = useState([0.5]);
  const [similarity, setSimilarity] = useState([0.75]);
  const [style, setStyle] = useState([0.3]);
  const [speed, setSpeed] = useState([1.0]);

  // Episode state
  const [episodeTitle, setEpisodeTitle] = useState("");
  const [script, setScript] = useState("");
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [generating, setGenerating] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [currentAudioUrl, setCurrentAudioUrl] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("record");

  // API Status
  const [apiStatus, setApiStatus] = useState<"unknown" | "connected" | "error">("unknown");

  // Check ElevenLabs connection
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const { data, error } = await supabase.functions.invoke("elevenlabs-podcast-tts", {
          body: { segments: [{ speaker: "jane", text: "test" }], testMode: true },
        });
        if (error) {
          setApiStatus("error");
        } else {
          setApiStatus("connected");
        }
      } catch {
        setApiStatus("error");
      }
    };
    checkConnection();
  }, []);

  const selectedVoiceInfo = ELEVENLABS_VOICES.find(v => v.id === selectedVoice);

  const generateAudio = useCallback(async () => {
    if (!script.trim()) {
      toast.error("Please enter a script before generating");
      return;
    }
    if (!user) {
      toast.error("Please sign in to generate audio");
      return;
    }

    setGenerating(true);
    const newEpisode: Episode = {
      id: Date.now().toString(),
      title: episodeTitle || "Untitled Episode",
      script: script,
      voiceId: selectedVoice,
      voiceName: selectedVoiceInfo?.name || "Unknown",
      status: "generating",
      createdAt: new Date().toISOString(),
    };
    setEpisodes(prev => [newEpisode, ...prev]);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/voice-studio-tts`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            text: script.slice(0, 5000),
            voiceId: selectedVoice,
            format: "mp3",
          }),
        }
      );

      if (!response.ok) {
        const errData = await response.json().catch(() => null);
        throw new Error(errData?.error || `Generation failed (${response.status})`);
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);

      setEpisodes(prev => prev.map(ep =>
        ep.id === newEpisode.id
          ? { ...ep, status: "ready", audioUrl, duration: 0 }
          : ep
      ));
      setCurrentAudioUrl(audioUrl);
      toast.success("Episode audio generated successfully");
    } catch (err) {
      console.error("TTS error:", err);
      setEpisodes(prev => prev.map(ep =>
        ep.id === newEpisode.id ? { ...ep, status: "error" } : ep
      ));
      toast.error(err instanceof Error ? err.message : "Failed to generate audio");
    } finally {
      setGenerating(false);
    }
  }, [script, selectedVoice, episodeTitle, selectedVoiceInfo, user]);

  const playAudio = (url: string) => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    const audio = new Audio(url);
    audioRef.current = audio;
    audio.play();
    setPlaying(true);
    audio.onended = () => setPlaying(false);
  };

  const stopAudio = () => {
    audioRef.current?.pause();
    setPlaying(false);
  };

  const downloadAudio = (url: string, title: string) => {
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title.replace(/\s+/g, '_')}.mp3`;
    a.click();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3]">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b-2 border-[#C9A84C]/30 bg-gradient-to-r from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] shadow-[0_4px_20px_rgba(200,167,102,0.1)]">
        <div className="flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/owner/founder-settings")} className="text-black hover:bg-[#C9A84C]/10">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#C9A84C] to-amber-600 flex items-center justify-center shadow-lg shadow-[#C9A84C]/20">
                <Headphones className="h-5 w-5 text-black" />
              </div>
              <div>
                <h1 className="font-bold text-black text-xl">Podcast Recording Studio</h1>
                <p className="text-xs text-black/60">ElevenLabs Voice Integration</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge className={apiStatus === "connected" 
              ? "bg-green-50 text-green-700 border border-green-200" 
              : apiStatus === "error" 
                ? "bg-red-50 text-red-700 border border-red-200"
                : "bg-zinc-100 text-zinc-600 border border-zinc-200"}>
              {apiStatus === "connected" ? (
                <><CheckCircle2 className="w-3 h-3 mr-1" /> ElevenLabs Connected</>
              ) : apiStatus === "error" ? (
                <><AlertCircle className="w-3 h-3 mr-1" /> Connection Issue</>
              ) : (
                <><Loader2 className="w-3 h-3 mr-1 animate-spin" /> Checking...</>
              )}
            </Badge>
          </div>
        </div>
      </header>

      <div className="p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-white/80 border-2 border-[#C9A84C]/30 mb-6">
            <TabsTrigger value="record" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#F5EBD7] data-[state=active]:to-[#D4C4A8] data-[state=active]:text-black text-black">
              <Mic className="w-3.5 h-3.5 mr-1.5" /> Record Episode
            </TabsTrigger>
            <TabsTrigger value="voices" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#F5EBD7] data-[state=active]:to-[#D4C4A8] data-[state=active]:text-black text-black">
              <Volume2 className="w-3.5 h-3.5 mr-1.5" /> Voice Library
            </TabsTrigger>
            <TabsTrigger value="episodes" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#F5EBD7] data-[state=active]:to-[#D4C4A8] data-[state=active]:text-black text-black">
              <FileAudio className="w-3.5 h-3.5 mr-1.5" /> Episodes ({episodes.length})
            </TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#F5EBD7] data-[state=active]:to-[#D4C4A8] data-[state=active]:text-black text-black">
              <Settings2 className="w-3.5 h-3.5 mr-1.5" /> Settings
            </TabsTrigger>
          </TabsList>

          {/* Record Episode Tab */}
          <TabsContent value="record" className="m-0">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Editor */}
              <div className="lg:col-span-2 space-y-4">
                <Card className="border-2 border-[#C9A84C]/20 bg-white/80">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base font-bold text-black">Episode Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Input
                      value={episodeTitle}
                      onChange={(e) => setEpisodeTitle(e.target.value)}
                      placeholder="Episode title..."
                      className="border-[#C9A84C]/30 text-black text-lg font-semibold"
                    />
                    <Textarea
                      value={script}
                      onChange={(e) => setScript(e.target.value)}
                      placeholder="Write or paste your podcast script here. This text will be converted to speech using the selected voice..."
                      className="border-[#C9A84C]/30 min-h-[300px] text-black"
                    />
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-black/50">{script.length}/5000 characters</p>
                      <div className="flex gap-2">
                        <Button
                          onClick={generateAudio}
                          disabled={generating || !script.trim()}
                          className="bg-gradient-to-r from-[#C9A84C] to-amber-600 hover:from-[#C9A84C]/90 hover:to-amber-600/90 text-black font-semibold shadow-lg shadow-[#C9A84C]/20"
                        >
                          {generating ? (
                            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating...</>
                          ) : (
                            <><Mic className="w-4 h-4 mr-2" /> Generate Audio</>
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Audio Player */}
                {currentAudioUrl && (
                  <Card className="border-2 border-[#C9A84C]/20 bg-white/80">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <Button
                          size="icon"
                          onClick={() => playing ? stopAudio() : playAudio(currentAudioUrl)}
                          className="bg-gradient-to-r from-[#C9A84C] to-amber-600 text-black h-12 w-12 rounded-full"
                        >
                          {playing ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                        </Button>
                        <div className="flex-1">
                          <div className="h-2 bg-[#C9A84C]/20 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-[#C9A84C] to-amber-600 rounded-full w-0 transition-all" />
                          </div>
                          <p className="text-xs text-black/50 mt-1">Latest generation</p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => downloadAudio(currentAudioUrl, episodeTitle || "podcast")}
                          className="border-[#C9A84C]/30 text-black hover:bg-[#C9A84C]/10"
                        >
                          <Download className="w-4 h-4 mr-1" /> Download
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Voice Selector Sidebar */}
              <div className="space-y-4">
                <Card className="border-2 border-[#C9A84C]/20 bg-white/80">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-bold text-black flex items-center gap-2">
                      <Volume2 className="w-4 h-4 text-[#C9A84C]" /> Selected Voice
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Select value={selectedVoice} onValueChange={setSelectedVoice}>
                      <SelectTrigger className="border-[#C9A84C]/30">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ELEVENLABS_VOICES.map(voice => (
                          <SelectItem key={voice.id} value={voice.id}>
                            {voice.name} — {voice.accent} {voice.gender}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {selectedVoiceInfo && (
                      <div className="p-3 rounded-lg bg-[#C9A84C]/5 border border-[#C9A84C]/15 space-y-2">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-[#C9A84C]" />
                          <span className="font-semibold text-black text-sm">{selectedVoiceInfo.name}</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          <Badge className="bg-[#C9A84C]/10 text-[#8B7D3A] border border-[#C9A84C]/20 text-[10px]">{selectedVoiceInfo.gender}</Badge>
                          <Badge className="bg-[#C9A84C]/10 text-[#8B7D3A] border border-[#C9A84C]/20 text-[10px]">{selectedVoiceInfo.accent}</Badge>
                          <Badge className="bg-[#C9A84C]/10 text-[#8B7D3A] border border-[#C9A84C]/20 text-[10px]">{selectedVoiceInfo.style}</Badge>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="border-2 border-[#C9A84C]/20 bg-white/80">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-bold text-black flex items-center gap-2">
                      <Settings2 className="w-4 h-4 text-[#C9A84C]" /> Voice Settings
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-xs font-medium text-black/60 mb-2">Model</p>
                      <Select value={selectedModel} onValueChange={setSelectedModel}>
                        <SelectTrigger className="border-[#C9A84C]/30 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {MODELS.map(m => (
                            <SelectItem key={m.id} value={m.id}>
                              <div>
                                <p className="font-medium">{m.name}</p>
                                <p className="text-[10px] text-black/50">{m.description}</p>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs text-black/60 mb-1">
                        <span>Stability</span><span>{stability[0].toFixed(2)}</span>
                      </div>
                      <Slider value={stability} onValueChange={setStability} min={0} max={1} step={0.05} />
                    </div>
                    <div>
                      <div className="flex justify-between text-xs text-black/60 mb-1">
                        <span>Similarity</span><span>{similarity[0].toFixed(2)}</span>
                      </div>
                      <Slider value={similarity} onValueChange={setSimilarity} min={0} max={1} step={0.05} />
                    </div>
                    <div>
                      <div className="flex justify-between text-xs text-black/60 mb-1">
                        <span>Style</span><span>{style[0].toFixed(2)}</span>
                      </div>
                      <Slider value={style} onValueChange={setStyle} min={0} max={1} step={0.05} />
                    </div>
                    <div>
                      <div className="flex justify-between text-xs text-black/60 mb-1">
                        <span>Speed</span><span>{speed[0].toFixed(1)}x</span>
                      </div>
                      <Slider value={speed} onValueChange={setSpeed} min={0.7} max={1.2} step={0.05} />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Voice Library Tab */}
          <TabsContent value="voices" className="m-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {ELEVENLABS_VOICES.map(voice => (
                <Card 
                  key={voice.id} 
                  className={`border-2 cursor-pointer transition-all hover:shadow-lg ${
                    selectedVoice === voice.id 
                      ? "border-[#C9A84C] bg-[#C9A84C]/5" 
                      : "border-[#C9A84C]/20 bg-white/80 hover:border-[#C9A84C]/40"
                  }`}
                  onClick={() => {
                    setSelectedVoice(voice.id);
                    toast.success(`Voice set to ${voice.name}`);
                  }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#C9A84C]/20 to-[#C9A84C]/5 border border-[#C9A84C]/30 flex items-center justify-center">
                        <User className="w-5 h-5 text-[#C9A84C]" />
                      </div>
                      <div>
                        <p className="font-semibold text-black text-sm">{voice.name}</p>
                        <p className="text-[10px] text-black/50">{voice.style}</p>
                      </div>
                      {selectedVoice === voice.id && (
                        <CheckCircle2 className="w-5 h-5 text-[#C9A84C] ml-auto" />
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      <Badge className="bg-[#C9A84C]/10 text-[#8B7D3A] border border-[#C9A84C]/20 text-[10px]">{voice.gender}</Badge>
                      <Badge className="bg-[#C9A84C]/10 text-[#8B7D3A] border border-[#C9A84C]/20 text-[10px]">
                        <Globe className="w-2.5 h-2.5 mr-0.5" /> {voice.accent}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Episodes Tab */}
          <TabsContent value="episodes" className="m-0">
            {episodes.length === 0 ? (
              <Card className="border-2 border-[#C9A84C]/20 bg-white/80">
                <CardContent className="p-12 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[#C9A84C]/20 flex items-center justify-center">
                    <FileAudio className="w-8 h-8 text-[#C9A84C]" />
                  </div>
                  <h3 className="font-semibold text-black mb-2">No episodes yet</h3>
                  <p className="text-sm text-black/60 mb-4">Record your first podcast episode using the Record tab.</p>
                  <Button
                    onClick={() => setActiveTab("record")}
                    className="bg-gradient-to-r from-[#C9A84C] to-amber-600 text-black font-semibold"
                  >
                    <Mic className="w-4 h-4 mr-2" /> Start Recording
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {episodes.map(ep => (
                  <Card key={ep.id} className="border-2 border-[#C9A84C]/20 bg-white/80">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#C9A84C]/20 to-[#C9A84C]/5 border border-[#C9A84C]/30 flex items-center justify-center">
                            {ep.status === "generating" ? (
                              <Loader2 className="w-5 h-5 text-[#C9A84C] animate-spin" />
                            ) : ep.status === "ready" ? (
                              <CheckCircle2 className="w-5 h-5 text-green-600" />
                            ) : ep.status === "error" ? (
                              <AlertCircle className="w-5 h-5 text-red-500" />
                            ) : (
                              <FileAudio className="w-5 h-5 text-[#C9A84C]" />
                            )}
                          </div>
                          <div>
                            <p className="font-semibold text-black">{ep.title}</p>
                            <p className="text-xs text-black/50">
                              Voice: {ep.voiceName} | {new Date(ep.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {ep.status === "ready" && ep.audioUrl && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => playAudio(ep.audioUrl!)}
                                className="border-[#C9A84C]/30 text-black hover:bg-[#C9A84C]/10"
                              >
                                <Play className="w-3.5 h-3.5 mr-1" /> Play
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => downloadAudio(ep.audioUrl!, ep.title)}
                                className="border-[#C9A84C]/30 text-black hover:bg-[#C9A84C]/10"
                              >
                                <Download className="w-3.5 h-3.5 mr-1" /> Download
                              </Button>
                            </>
                          )}
                          <Badge className={
                            ep.status === "ready" ? "bg-green-50 text-green-700 border border-green-200" :
                            ep.status === "generating" ? "bg-amber-50 text-amber-700 border border-amber-200" :
                            ep.status === "error" ? "bg-red-50 text-red-700 border border-red-200" :
                            "bg-zinc-100 text-zinc-600 border border-zinc-200"
                          }>
                            {ep.status === "ready" ? "Ready" : ep.status === "generating" ? "Generating" : ep.status === "error" ? "Error" : "Draft"}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="m-0">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-2 border-[#C9A84C]/20 bg-white/80">
                <CardHeader>
                  <CardTitle className="text-base font-bold text-black">ElevenLabs Configuration</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 rounded-lg bg-[#C9A84C]/5 border border-[#C9A84C]/15">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle2 className="w-4 h-4 text-[#C9A84C]" />
                      <span className="font-semibold text-black text-sm">API Status</span>
                    </div>
                    <p className="text-xs text-black/60">
                      {apiStatus === "connected" 
                        ? "ElevenLabs API is connected and operational. You can generate audio using any available voice."
                        : apiStatus === "error"
                          ? "There is an issue connecting to ElevenLabs. Please check your API key configuration."
                          : "Checking connection status..."
                      }
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-black">Available Features</p>
                    <div className="space-y-1.5">
                      {[
                        "Text-to-Speech with 18+ premium voices",
                        "Multilingual support (29 languages)",
                        "Voice stability and similarity controls",
                        "Speed adjustment (0.7x to 1.2x)",
                        "High-quality MP3 output",
                        "Podcast episode management",
                      ].map((feature, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs text-black/70">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#C9A84C]" />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 border-[#C9A84C]/20 bg-white/80">
                <CardHeader>
                  <CardTitle className="text-base font-bold text-black">Use Cases</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    { icon: Mic, title: "Podcast Episodes", desc: "Record full podcast episodes with professional voices" },
                    { icon: Headphones, title: "Client Meetings", desc: "Use voice synthesis to attend meetings on your behalf" },
                    { icon: Radio, title: "Phone Calls", desc: "Answer calls or make calls using selected voice profiles" },
                    { icon: Volume2, title: "Voiceovers", desc: "Generate voiceovers for presentations and tours" },
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-[#C9A84C]/5 border border-[#C9A84C]/15">
                      <div className="w-8 h-8 rounded-lg bg-[#C9A84C]/15 flex items-center justify-center shrink-0">
                        <item.icon className="w-4 h-4 text-[#C9A84C]" />
                      </div>
                      <div>
                        <p className="font-semibold text-black text-sm">{item.title}</p>
                        <p className="text-xs text-black/50">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                  <p className="text-[10px] text-black/40 mt-4">
                    Note: API key connectivity can be configured in Settings &gt; Integrations. Contact support for custom voice cloning.
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default PodcastStudio;
