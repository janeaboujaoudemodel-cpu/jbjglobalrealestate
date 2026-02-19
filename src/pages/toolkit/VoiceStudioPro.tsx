import { useState, useRef, useCallback, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ScriptLibrary } from "@/components/voice-studio/ScriptLibrary";
import {
  Mic, Upload, Play, Pause, Square, Download, Trash2,
  Loader2, Volume2, Wand2, AlertTriangle, FileAudio, Check,
  Globe, Copy, Sparkles, ChevronLeft, X, RefreshCw, BookOpen
} from "lucide-react";

// ── Constants ──────────────────────────────────────────────────────────────────
const VOICE_LIBRARY = [
  { id: "CwhRBWXzGAHq8TQ4Fs17", name: "Roger",   gender: "male",   accent: "British",    tag: "Professional" },
  { id: "EXAVITQu4vr4xnSDxMaL", name: "Sarah",   gender: "female", accent: "American",   tag: "Warm" },
  { id: "JBFqnCBsd6RMkjVDRZzb", name: "George",  gender: "male",   accent: "British",    tag: "Authoritative" },
  { id: "FGY2WhTYpPnrIDTdsKH5", name: "Laura",   gender: "female", accent: "American",   tag: "Natural" },
  { id: "IKne3meq5aSn9XLyUdCD", name: "Charlie", gender: "male",   accent: "Australian", tag: "Casual" },
  { id: "pFZP5JQG7iQjIQuC4Bku", name: "Lily",    gender: "female", accent: "British",    tag: "Elegant" },
  { id: "TX3LPaxmHKxFdv7VOQHJ", name: "Liam",    gender: "male",   accent: "American",   tag: "Dynamic" },
  { id: "XrExE9yKIg1WjnnlVkGX", name: "Matilda", gender: "female", accent: "Australian", tag: "Cheerful" },
  { id: "nPczCjzI2devNBz1zQrb", name: "Brian",   gender: "male",   accent: "American",   tag: "Deep" },
  { id: "cgSgspJ2msm6clMCkdW9", name: "Jessica", gender: "female", accent: "American",   tag: "Clear" },
  { id: "N2lVS1w4EtoT3dr4eOWO", name: "Callum",  gender: "male",   accent: "Transatlantic", tag: "Intense" },
  { id: "SAz9YHcvj6GT2YYXdXww", name: "River",   gender: "neutral",accent: "American",   tag: "Calm" },
];

const LANGUAGES = [
  { code: "en",    label: "English",    flag: "🇬🇧" },
  { code: "ar",    label: "Arabic",     flag: "🇦🇪" },
  { code: "zh",    label: "Chinese",    flag: "🇨🇳" },
  { code: "fr",    label: "French",     flag: "🇫🇷" },
  { code: "de",    label: "German",     flag: "🇩🇪" },
  { code: "hi",    label: "Hindi",      flag: "🇮🇳" },
  { code: "id",    label: "Indonesian", flag: "🇮🇩" },
  { code: "it",    label: "Italian",    flag: "🇮🇹" },
  { code: "ja",    label: "Japanese",   flag: "🇯🇵" },
  { code: "ko",    label: "Korean",     flag: "🇰🇷" },
  { code: "pl",    label: "Polish",     flag: "🇵🇱" },
  { code: "pt",    label: "Portuguese", flag: "🇧🇷" },
  { code: "ru",    label: "Russian",    flag: "🇷🇺" },
  { code: "es",    label: "Spanish",    flag: "🇪🇸" },
  { code: "tr",    label: "Turkish",    flag: "🇹🇷" },
  { code: "uk",    label: "Ukrainian",  flag: "🇺🇦" },
];

type VoiceTab = "library" | "clone";

interface ClonedVoice {
  id: string;
  name: string;
  createdAt: string;
}

interface GeneratedResult {
  url: string;
  blob: Blob;
  voiceName: string;
  language: string;
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function VoiceStudioPro() {
  const { toast } = useToast();

  // Page-level tab
  const [pageTab, setPageTab] = useState<"studio" | "library">("studio");

  // Voice Tab (library vs clone)
  const [voiceTab, setVoiceTab] = useState<VoiceTab>("library");


  // Script
  const [script, setScript] = useState("");

  // Library voice
  const [selectedVoice, setSelectedVoice] = useState(VOICE_LIBRARY[0].id);

  // Language + format
  const [language, setLanguage] = useState("en");
  const [format, setFormat] = useState<"mp3" | "wav">("mp3");

  // Voice settings
  const [stability, setStability] = useState(0.5);
  const [similarity, setSimilarity] = useState(0.75);
  const [speed, setSpeed] = useState(1.0);

  // Recording
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Upload
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cloning
  const [cloneConsent, setCloneConsent] = useState(false);
  const [clonedVoices, setClonedVoices] = useState<ClonedVoice[]>([]);
  const [selectedClonedVoice, setSelectedClonedVoice] = useState<string | null>(null);
  const [cloning, setCloning] = useState(false);
  const [cloneName, setCloneName] = useState("");

  // Generation
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState("");
  const [result, setResult] = useState<GeneratedResult | null>(null);

  // Playback
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const previewRef = useRef<HTMLAudioElement | null>(null);

  // Load cloned voices from session storage on mount
  useEffect(() => {
    const stored = sessionStorage.getItem("vsp_cloned_voices");
    if (stored) {
      try { setClonedVoices(JSON.parse(stored)); } catch { /* ignore */ }
    }
  }, []);

  const persistClonedVoices = (voices: ClonedVoice[]) => {
    setClonedVoices(voices);
    sessionStorage.setItem("vsp_cloned_voices", JSON.stringify(voices));
  };

  // Cleanup
  useEffect(() => {
    return () => {
      if (recordedUrl) URL.revokeObjectURL(recordedUrl);
      if (uploadedUrl) URL.revokeObjectURL(uploadedUrl);
      if (result?.url) URL.revokeObjectURL(result.url);
    };
  }, []);

  // ── Recording ───────────────────────────────────────────────────────────────
  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
      const mr = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/mp4",
      });
      audioChunksRef.current = [];
      mr.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      mr.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        if (recordedUrl) URL.revokeObjectURL(recordedUrl);
        const url = URL.createObjectURL(blob);
        setRecordedBlob(blob);
        setRecordedUrl(url);
        stream.getTracks().forEach(t => t.stop());
      };
      mediaRecorderRef.current = mr;
      mr.start(1000);
      setIsRecording(true);
      setRecordingTime(0);
      recordTimerRef.current = setInterval(() => {
        setRecordingTime(t => {
          if (t >= 120) { stopRecording(); return t; }
          return t + 1;
        });
      }, 1000);
    } catch {
      toast({ title: "Microphone access required", variant: "destructive" });
    }
  }, [recordedUrl, toast]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordTimerRef.current) { clearInterval(recordTimerRef.current); recordTimerRef.current = null; }
    }
  }, [isRecording]);

  const clearRecording = useCallback(() => {
    if (recordedUrl) URL.revokeObjectURL(recordedUrl);
    setRecordedBlob(null); setRecordedUrl(null);
    if (uploadedUrl) URL.revokeObjectURL(uploadedUrl);
    setUploadedFile(null); setUploadedUrl(null);
  }, [recordedUrl, uploadedUrl]);

  const handleUpload = useCallback((files: FileList | null) => {
    if (!files?.length) return;
    const file = files[0];
    if (!file.type.startsWith("audio/")) {
      toast({ title: "Audio file required", variant: "destructive" }); return;
    }
    if (uploadedUrl) URL.revokeObjectURL(uploadedUrl);
    setUploadedFile(file);
    setUploadedUrl(URL.createObjectURL(file));
    setRecordedBlob(null); setRecordedUrl(null);
  }, [uploadedUrl, toast]);

  const hasAudioSample = Boolean(recordedBlob || uploadedFile);

  const previewSample = useCallback(() => {
    const url = recordedUrl || uploadedUrl;
    if (!url || !previewRef.current) return;
    if (isPreviewPlaying) {
      previewRef.current.pause(); setIsPreviewPlaying(false);
    } else {
      previewRef.current.src = url;
      previewRef.current.play(); setIsPreviewPlaying(true);
    }
  }, [recordedUrl, uploadedUrl, isPreviewPlaying]);

  // ── Clone voice ─────────────────────────────────────────────────────────────
  const cloneVoice = useCallback(async () => {
    if (!hasAudioSample || !cloneConsent) {
      toast({ title: "Audio sample and consent required", variant: "destructive" }); return;
    }
    setCloning(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const fd = new FormData();
      fd.append("action", "clone_voice");
      fd.append("voice_name", cloneName || `My Voice ${Date.now()}`);
      const audioBlob = recordedBlob || uploadedFile!;
      fd.append("files", audioBlob, "voice_sample.webm");

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/voice-studio-clone`,
        {
          method: "POST",
          headers: {
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${session.access_token}`,
          },
          body: fd,
        }
      );

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Cloning failed");

      const newVoice: ClonedVoice = { id: json.voice_id, name: fd.get("voice_name") as string, createdAt: new Date().toISOString() };
      persistClonedVoices([...clonedVoices, newVoice]);
      setSelectedClonedVoice(newVoice.id);
      toast({ title: `✅ Voice "${newVoice.name}" cloned successfully!` });
    } catch (err) {
      toast({ title: "Cloning failed", description: err instanceof Error ? err.message : "Unknown error", variant: "destructive" });
    } finally {
      setCloning(false);
    }
  }, [hasAudioSample, cloneConsent, cloneName, recordedBlob, uploadedFile, clonedVoices, toast]);

  const deleteClonedVoice = useCallback(async (voiceId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/voice-studio-clone`,
        {
          method: "POST",
          headers: {
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ action: "delete_clone", voice_id: voiceId }),
        }
      );
      const updated = clonedVoices.filter(v => v.id !== voiceId);
      persistClonedVoices(updated);
      if (selectedClonedVoice === voiceId) setSelectedClonedVoice(null);
      toast({ title: "Voice deleted" });
    } catch (err) {
      toast({ title: "Delete failed", description: err instanceof Error ? err.message : "Unknown error", variant: "destructive" });
    }
  }, [clonedVoices, selectedClonedVoice, toast]);

  // ── Generate TTS ────────────────────────────────────────────────────────────
  const generate = useCallback(async () => {
    if (!script.trim()) { toast({ title: "Script required", variant: "destructive" }); return; }
    if (voiceTab === "clone" && !selectedClonedVoice) {
      toast({ title: "Select or clone a voice first", variant: "destructive" }); return;
    }

    const voiceId = voiceTab === "library" ? selectedVoice : selectedClonedVoice!;
    const voiceName = voiceTab === "library"
      ? VOICE_LIBRARY.find(v => v.id === voiceId)?.name || "Voice"
      : clonedVoices.find(v => v.id === voiceId)?.name || "Clone";
    const langLabel = LANGUAGES.find(l => l.code === language)?.label || language;

    setGenerating(true); setProgress(10); setProgressText("Connecting to ElevenLabs…");

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated. Please log in.");

      setProgress(30); setProgressText("Generating audio…");

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/voice-studio-clone`,
        {
          method: "POST",
          headers: {
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "tts_with_clone",
            voice_id: voiceId,
            text: script,
            language_code: language,
            format,
            stability,
            similarity_boost: similarity,
            speed,
          }),
        }
      );

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Generation failed: ${errText}`);
      }

      setProgress(90); setProgressText("Finalizing…");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      if (result?.url) URL.revokeObjectURL(result.url);
      setResult({ url, blob, voiceName, language: langLabel });
      setProgress(100); setProgressText("Done!");
      toast({ title: `🎙️ Audio generated with ${voiceName} in ${langLabel}!` });
    } catch (err) {
      toast({ title: "Generation failed", description: err instanceof Error ? err.message : "Unknown error", variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  }, [script, voiceTab, selectedVoice, selectedClonedVoice, language, format, stability, similarity, speed, result, clonedVoices, toast]);

  // ── Playback ────────────────────────────────────────────────────────────────
  const playResult = useCallback(() => {
    if (!result?.url || !audioRef.current) return;
    if (isPlaying) { audioRef.current.pause(); setIsPlaying(false); }
    else { audioRef.current.src = result.url; audioRef.current.play(); setIsPlaying(true); }
  }, [result, isPlaying]);

  const downloadResult = useCallback(() => {
    if (!result) return;
    const a = document.createElement("a");
    a.href = result.url;
    a.download = `voice_studio_${Date.now()}.${format}`;
    a.click();
    toast({ title: `Downloading ${format.toUpperCase()}` });
  }, [result, format, toast]);

  const ft = (s: number) => `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Hidden audio elements */}
      <audio ref={audioRef} onEnded={() => setIsPlaying(false)} onPause={() => setIsPlaying(false)} />
      <audio ref={previewRef} onEnded={() => setIsPreviewPlaying(false)} onPause={() => setIsPreviewPlaying(false)} />
      <input ref={fileInputRef} type="file" accept="audio/*" className="hidden" onChange={e => handleUpload(e.target.files)} />

      {/* ── Header ── */}
      <div className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link to="/toolkit" className="text-slate-400 hover:text-white transition-colors">
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500/20 to-fuchsia-500/10 border border-purple-500/30">
            <Mic className="h-5 w-5 text-purple-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              Voice Studio Pro
              <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30 text-[10px]">
                ELEVENLABS
              </Badge>
            </h1>
            <p className="text-slate-400 text-xs">Text-to-speech · Voice cloning · 16 languages</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">

        {/* ── Page-level tabs: Studio | Script Library ── */}
        <div className="flex items-center gap-2 mb-6 border-b border-slate-800 pb-4">
          <button
            onClick={() => setPageTab("studio")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              pageTab === "studio"
                ? "bg-purple-600/20 text-purple-300 border border-purple-500/40"
                : "text-slate-400 hover:text-white hover:bg-slate-800/50"
            }`}
          >
            <Mic className="h-4 w-4" />
            Studio
          </button>
          <button
            onClick={() => setPageTab("library")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              pageTab === "library"
                ? "bg-purple-600/20 text-purple-300 border border-purple-500/40"
                : "text-slate-400 hover:text-white hover:bg-slate-800/50"
            }`}
          >
            <BookOpen className="h-4 w-4" />
            Script Library
          </button>
        </div>

        {/* ── Script Library Panel ── */}
        {pageTab === "library" && (
          <ScriptLibrary
            onLoadScript={(s) => { setScript(s); setPageTab("studio"); }}
            currentScript={script}
            currentLanguage={language}
            currentTone="professional"
            currentVoiceName={voiceTab === "library" ? VOICE_LIBRARY.find(v => v.id === selectedVoice)?.name : clonedVoices.find(v => v.id === selectedClonedVoice)?.name}
          />
        )}

        {/* ── Studio Panel ── */}
        {pageTab === "studio" && (
        <div className="grid lg:grid-cols-[1fr_380px] gap-6">

          {/* ── Left: Script + Controls ── */}
          <div className="space-y-5">

            {/* Script */}
            <Card className="bg-slate-900/60 border-slate-700/50">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white text-base flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-purple-400" />
                    Script
                  </CardTitle>
                  <button
                    onClick={() => setPageTab("library")}
                    disabled={!script.trim()}
                    className="flex items-center gap-1.5 text-xs text-purple-400 hover:text-purple-300 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    title="Save to Script Library"
                  >
                    <BookOpen className="h-3.5 w-3.5" />
                    Save to Library
                  </button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <Textarea
                  placeholder="Enter your script here… up to 5,000 characters"
                  value={script}
                  onChange={e => setScript(e.target.value.slice(0, 5000))}
                  className="min-h-[200px] bg-slate-800/60 border-slate-700 text-white placeholder:text-slate-500 resize-none text-sm"
                />
                <div className="flex justify-between text-xs text-slate-500">
                  <span>{script.length.toLocaleString()} / 5,000 chars</span>
                  <button
                    onClick={() => navigator.clipboard.readText().then(t => setScript(t.slice(0, 5000))).catch(() => {})}
                    className="text-slate-500 hover:text-slate-300 transition-colors flex items-center gap-1"
                  >
                    <Copy className="h-3 w-3" /> Paste
                  </button>
                </div>
              </CardContent>
            </Card>

            {/* Voice Selection */}
            <Card className="bg-slate-900/60 border-slate-700/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-white text-base flex items-center gap-2">
                  <Volume2 className="h-4 w-4 text-purple-400" />
                  Voice
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs value={voiceTab} onValueChange={v => setVoiceTab(v as VoiceTab)}>
                  <TabsList className="grid grid-cols-2 bg-slate-800/60 mb-4">
                    <TabsTrigger value="library" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white text-sm">
                      Voice Library
                    </TabsTrigger>
                    <TabsTrigger value="clone" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white text-sm">
                      My Cloned Voices
                    </TabsTrigger>
                  </TabsList>

                  {/* Library */}
                  <TabsContent value="library">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {VOICE_LIBRARY.map(v => (
                        <button
                          key={v.id}
                          onClick={() => setSelectedVoice(v.id)}
                          className={`p-3 rounded-lg border text-left transition-all ${
                            selectedVoice === v.id
                              ? "border-purple-500 bg-purple-500/10"
                              : "border-slate-700 bg-slate-800/30 hover:border-slate-600"
                          }`}
                        >
                          <div className="flex items-center gap-1.5 mb-1">
                            <Volume2 className={`h-3 w-3 ${selectedVoice === v.id ? "text-purple-400" : "text-slate-500"}`} />
                            <span className="text-white text-xs font-medium">{v.name}</span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            <span className="text-[10px] text-slate-400 bg-slate-700/50 rounded px-1.5 py-0.5">{v.accent}</span>
                            <span className="text-[10px] text-purple-300 bg-purple-500/10 rounded px-1.5 py-0.5">{v.tag}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </TabsContent>

                  {/* Clone */}
                  <TabsContent value="clone" className="space-y-4">
                    {clonedVoices.length > 0 && (
                      <div className="space-y-2">
                        <Label className="text-slate-300 text-xs uppercase tracking-wide">Your Cloned Voices</Label>
                        {clonedVoices.map(cv => (
                          <div
                            key={cv.id}
                            onClick={() => setSelectedClonedVoice(cv.id)}
                            className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${
                              selectedClonedVoice === cv.id
                                ? "border-purple-500 bg-purple-500/10"
                                : "border-slate-700 bg-slate-800/30 hover:border-slate-600"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${selectedClonedVoice === cv.id ? "bg-purple-400" : "bg-slate-600"}`} />
                              <span className="text-white text-sm">{cv.name}</span>
                              <Badge className="text-[10px] bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/30">CLONE</Badge>
                            </div>
                            <button
                              onClick={e => { e.stopPropagation(); deleteClonedVoice(cv.id); }}
                              className="text-slate-500 hover:text-red-400 transition-colors p-1"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Create new clone */}
                    <div className="border border-dashed border-slate-700 rounded-lg p-4 space-y-4">
                      <h4 className="text-white text-sm font-medium flex items-center gap-2">
                        <RefreshCw className="h-4 w-4 text-purple-400" />
                        Clone a New Voice
                      </h4>

                      <Alert className="bg-amber-950/30 border-amber-600/40 py-2">
                        <AlertTriangle className="h-3.5 w-3.5 text-amber-500 mt-0.5" />
                        <AlertDescription className="text-amber-200 text-xs">
                          Only clone your own voice. Cloning another person's voice without consent is prohibited.
                        </AlertDescription>
                      </Alert>

                      {/* Record/Upload sample */}
                      <div>
                        <Label className="text-slate-400 text-xs mb-2 block">Voice Sample (30–120 seconds recommended)</Label>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={isRecording ? stopRecording : startRecording}
                            variant={isRecording ? "destructive" : "outline"}
                            className={isRecording ? "" : "border-slate-600 text-slate-300 hover:bg-slate-800"}
                          >
                            {isRecording ? (
                              <><Square className="h-3.5 w-3.5 mr-1.5" />Stop ({ft(recordingTime)})</>
                            ) : (
                              <><Mic className="h-3.5 w-3.5 mr-1.5" />Record</>
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => fileInputRef.current?.click()}
                            className="border-slate-600 text-slate-300 hover:bg-slate-800"
                          >
                            <Upload className="h-3.5 w-3.5 mr-1.5" />Upload
                          </Button>
                        </div>
                        {isRecording && (
                          <p className="text-red-400 text-xs mt-2 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse inline-block" />
                            Recording… {ft(recordingTime)}
                          </p>
                        )}
                        {hasAudioSample && (
                          <div className="mt-2 flex items-center gap-2 p-2 rounded-lg bg-slate-800/50 border border-slate-700">
                            <FileAudio className="h-4 w-4 text-purple-400 flex-shrink-0" />
                            <span className="text-white text-xs flex-1 truncate">
                              {uploadedFile?.name || `Recording (${ft(recordingTime)})`}
                            </span>
                            <button onClick={previewSample} className="text-slate-400 hover:text-white">
                              {isPreviewPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                            </button>
                            <button onClick={clearRecording} className="text-slate-400 hover:text-red-400">
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Name */}
                      <div>
                        <Label className="text-slate-400 text-xs mb-1 block">Voice Name</Label>
                        <input
                          type="text"
                          value={cloneName}
                          onChange={e => setCloneName(e.target.value)}
                          placeholder="e.g. My Professional Voice"
                          className="w-full bg-slate-800/60 border border-slate-700 rounded-md px-3 py-2 text-white text-sm placeholder:text-slate-500 outline-none focus:border-purple-500 transition-colors"
                        />
                      </div>

                      {/* Consent */}
                      <div className="flex items-start gap-2">
                        <Checkbox
                          id="consent"
                          checked={cloneConsent}
                          onCheckedChange={c => setCloneConsent(c === true)}
                          className="mt-0.5 border-slate-500 data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600"
                        />
                        <label htmlFor="consent" className="text-xs text-slate-400 cursor-pointer">
                          I confirm I own this voice and consent to cloning it for personal use only.
                        </label>
                      </div>

                      <Button
                        onClick={cloneVoice}
                        disabled={cloning || !hasAudioSample || !cloneConsent}
                        className="w-full bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-700 hover:to-fuchsia-700 text-white text-sm disabled:opacity-50"
                        size="sm"
                      >
                        {cloning ? (
                          <><Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />Cloning…</>
                        ) : (
                          <><Wand2 className="h-3.5 w-3.5 mr-2" />Clone My Voice</>
                        )}
                      </Button>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* ── Right: Settings + Generate ── */}
          <div className="space-y-5">

            {/* Language */}
            <Card className="bg-slate-900/60 border-slate-700/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-white text-base flex items-center gap-2">
                  <Globe className="h-4 w-4 text-purple-400" />
                  Language & Format
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-slate-400 text-xs mb-2 block">Output Language</Label>
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger className="bg-slate-800/60 border-slate-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-700 max-h-64 overflow-y-auto">
                      {LANGUAGES.map(l => (
                        <SelectItem key={l.code} value={l.code} className="text-white hover:bg-slate-800">
                          <span className="flex items-center gap-2">
                            <span>{l.flag}</span>
                            <span>{l.label}</span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-slate-400 text-xs mb-2 block">Audio Format</Label>
                  <div className="flex gap-2">
                    {(["mp3", "wav"] as const).map(f => (
                      <button
                        key={f}
                        onClick={() => setFormat(f)}
                        className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-all ${
                          format === f
                            ? "border-purple-500 bg-purple-500/10 text-purple-300"
                            : "border-slate-700 text-slate-400 hover:border-slate-600"
                        }`}
                      >
                        {f.toUpperCase()}
                        <span className="text-xs block text-slate-500 font-normal">
                          {f === "mp3" ? "Smaller" : "HQ"}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Voice Settings */}
            <Card className="bg-slate-900/60 border-slate-700/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-white text-base flex items-center gap-2">
                  <Wand2 className="h-4 w-4 text-purple-400" />
                  Voice Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                {[
                  { label: "Stability", min: 0, max: 1, step: 0.01, value: stability, onChange: setStability, hint: "Low = expressive, High = consistent" },
                  { label: "Similarity", min: 0, max: 1, step: 0.01, value: similarity, onChange: setSimilarity, hint: "How closely to match voice" },
                  { label: "Speed", min: 0.7, max: 1.2, step: 0.05, value: speed, onChange: setSpeed, hint: "0.7× slow — 1.2× fast" },
                ].map(s => (
                  <div key={s.label}>
                    <div className="flex justify-between mb-2">
                      <Label className="text-slate-300 text-xs">{s.label}</Label>
                      <span className="text-purple-400 text-xs font-mono">{s.value.toFixed(2)}</span>
                    </div>
                    <Slider
                      min={s.min} max={s.max} step={s.step}
                      value={[s.value]}
                      onValueChange={([v]) => s.onChange(v)}
                      className="[&_[role=slider]]:bg-purple-500"
                    />
                    <p className="text-xs text-slate-500 mt-1">{s.hint}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Generate */}
            <Button
              onClick={generate}
              disabled={generating || !script.trim() || (voiceTab === "clone" && !selectedClonedVoice)}
              className="w-full h-12 bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-700 hover:to-fuchsia-700 text-white font-semibold disabled:opacity-50"
            >
              {generating ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />{progressText}</>
              ) : (
                <><Sparkles className="h-4 w-4 mr-2" />Generate Audio</>
              )}
            </Button>

            {generating && <Progress value={progress} className="h-1.5 bg-slate-800 [&>div]:bg-purple-500" />}

            {/* Result */}
            {result && !generating && (
              <Card className="bg-gradient-to-br from-purple-950/40 to-slate-900/60 border-purple-700/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-purple-300 flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-purple-400" />
                    Ready — {result.voiceName} · {result.language}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    onClick={playResult}
                    variant="outline"
                    size="sm"
                    className="w-full border-purple-600 text-purple-300 hover:bg-purple-950/50"
                  >
                    {isPlaying ? (
                      <><Pause className="h-4 w-4 mr-2" />Pause Preview</>
                    ) : (
                      <><Play className="h-4 w-4 mr-2" />Preview</>
                    )}
                  </Button>
                  <Button
                    onClick={downloadResult}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                    size="sm"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download {format.toUpperCase()}
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Usage note */}
            <div className="p-3 rounded-lg bg-slate-800/30 border border-slate-700/40 text-xs text-slate-500 space-y-1">
              <p className="text-slate-400 font-medium mb-1">Powered by ElevenLabs</p>
              <p>• 5,000 characters per generation</p>
              <p>• 16 supported languages</p>
              <p>• Instant voice cloning from ≥30s sample</p>
              <p>• Cloned voices stored for this session</p>
            </div>
          </div>
        </div>
        )} {/* end studio panel */}
      </div>
    </div>
  );
}
