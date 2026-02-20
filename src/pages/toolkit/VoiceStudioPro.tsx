import { useState, useRef, useCallback, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ScriptLibrary } from "@/components/voice-studio/ScriptLibrary";
import {
  Mic, Play, Pause, Download, Loader2, Volume2, Wand2, Check,
  Globe, Copy, Sparkles, ChevronLeft, BookOpen
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

  // Generation
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState("");
  const [result, setResult] = useState<GeneratedResult | null>(null);

  // Playback
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cleanup
  useEffect(() => {
    return () => { if (result?.url) URL.revokeObjectURL(result.url); };
  }, []);

  // ── Generate TTS ────────────────────────────────────────────────────────────
  const generate = useCallback(async () => {
    if (!script.trim()) { toast({ title: "Script required", variant: "destructive" }); return; }

    const voiceId = selectedVoice;
    const voiceName = VOICE_LIBRARY.find(v => v.id === voiceId)?.name || "Voice";
    const langLabel = LANGUAGES.find(l => l.code === language)?.label || language;

    setGenerating(true); setProgress(10); setProgressText("Connecting to Voice API…");

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated. Please log in.");

      setProgress(30); setProgressText("Generating audio…");

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sarah-voice`,
        {
          method: "POST",
          headers: {
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            text: script,
            voiceId,
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
  }, [script, selectedVoice, language, format, stability, similarity, speed, result, toast]);

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
      {/* Hidden audio element */}
      <audio ref={audioRef} onEnded={() => setIsPlaying(false)} onPause={() => setIsPlaying(false)} />

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
            <h1 className="text-xl font-bold text-white">
              Voice Studio Pro
            </h1>
            <p className="text-slate-400 text-xs">Text-to-speech · 12 voices · 16 languages</p>
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
            currentVoiceName={VOICE_LIBRARY.find(v => v.id === selectedVoice)?.name}
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
                  Voice Library
                </CardTitle>
              </CardHeader>
              <CardContent>
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
              disabled={generating || !script.trim()}
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
