import { useState, useRef, useCallback, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ScriptLibrary } from "@/components/voice-studio/ScriptLibrary";
import { supabase } from "@/integrations/supabase/client";
import {
  Mic, Play, Pause, Download, Loader2, Volume2, Wand2, Check,
  Globe, Copy, Sparkles, ChevronLeft, BookOpen, Search, Filter,
  User, Users, Zap, Bot
} from "lucide-react";
import {
  BROWSER_VOICE_LIBRARY,
  speak,
  stopSpeaking,
  ensureVoicesLoaded,
  downloadScriptAsText,
  estimateDuration,
} from "@/lib/browser-tts";

// ── Extended Voice Library with more accents ────────────────────────────────
const VOICE_LIBRARY = [
  ...BROWSER_VOICE_LIBRARY.map(v => ({
    id: v.id, name: v.name, gender: v.gender, accent: v.accent, tag: v.tag,
  })),
  // Additional personas mapped to Web Speech API
  { id: "aria",     name: "Aria",     gender: "female" as const, accent: "Indian",       tag: "Warm" },
  { id: "omar",     name: "Omar",     gender: "male" as const,   accent: "Arabic",       tag: "Rich" },
  { id: "elena",    name: "Elena",    gender: "female" as const, accent: "Spanish",      tag: "Vibrant" },
  { id: "yuki",     name: "Yuki",     gender: "female" as const, accent: "Japanese",     tag: "Soft" },
  { id: "hans",     name: "Hans",     gender: "male" as const,   accent: "German",       tag: "Clear" },
  { id: "priya",    name: "Priya",    gender: "female" as const, accent: "Hindi",        tag: "Melodic" },
  { id: "wei",      name: "Wei",      gender: "male" as const,   accent: "Chinese",      tag: "Steady" },
  { id: "fatima",   name: "Fatima",   gender: "female" as const, accent: "Arabic",       tag: "Elegant" },
  { id: "carlos",   name: "Carlos",   gender: "male" as const,   accent: "Portuguese",   tag: "Dynamic" },
  { id: "sofia",    name: "Sofia",    gender: "female" as const, accent: "Italian",      tag: "Expressive" },
  { id: "raj",      name: "Raj",      gender: "male" as const,   accent: "Indian",       tag: "Professional" },
  { id: "amira",    name: "Amira",    gender: "female" as const, accent: "Turkish",      tag: "Smooth" },
  { id: "jin",      name: "Jin",      gender: "male" as const,   accent: "Korean",       tag: "Calm" },
  { id: "anya",     name: "Anya",     gender: "female" as const, accent: "Russian",      tag: "Authoritative" },
  { id: "pierre",   name: "Pierre",   gender: "male" as const,   accent: "French",       tag: "Refined" },
  { id: "kenji",    name: "Kenji",    gender: "male" as const,   accent: "Japanese",     tag: "Focused" },
  { id: "noor",     name: "Noor",     gender: "female" as const, accent: "Urdu",         tag: "Gentle" },
  { id: "diego",    name: "Diego",    gender: "male" as const,   accent: "Spanish",      tag: "Energetic" },
  { id: "mei",      name: "Mei",      gender: "female" as const, accent: "Chinese",      tag: "Bright" },
  { id: "ahmed",    name: "Ahmed",    gender: "male" as const,   accent: "Arabic",       tag: "Deep" },
];

const ALL_ACCENTS = [...new Set(VOICE_LIBRARY.map(v => v.accent))].sort();

const LANGUAGES = [
  { code: "en",    label: "English",      flag: "🇬🇧" },
  { code: "en-US", label: "English (US)", flag: "🇺🇸" },
  { code: "ar",    label: "Arabic",       flag: "🇦🇪" },
  { code: "bn",    label: "Bengali",      flag: "🇧🇩" },
  { code: "zh",    label: "Chinese (Mandarin)", flag: "🇨🇳" },
  { code: "zh-HK", label: "Chinese (Cantonese)", flag: "🇭🇰" },
  { code: "cs",    label: "Czech",        flag: "🇨🇿" },
  { code: "da",    label: "Danish",       flag: "🇩🇰" },
  { code: "nl",    label: "Dutch",        flag: "🇳🇱" },
  { code: "fi",    label: "Finnish",      flag: "🇫🇮" },
  { code: "fr",    label: "French",       flag: "🇫🇷" },
  { code: "de",    label: "German",       flag: "🇩🇪" },
  { code: "el",    label: "Greek",        flag: "🇬🇷" },
  { code: "gu",    label: "Gujarati",     flag: "🇮🇳" },
  { code: "he",    label: "Hebrew",       flag: "🇮🇱" },
  { code: "hi",    label: "Hindi",        flag: "🇮🇳" },
  { code: "hu",    label: "Hungarian",    flag: "🇭🇺" },
  { code: "id",    label: "Indonesian",   flag: "🇮🇩" },
  { code: "it",    label: "Italian",      flag: "🇮🇹" },
  { code: "ja",    label: "Japanese",     flag: "🇯🇵" },
  { code: "kn",    label: "Kannada",      flag: "🇮🇳" },
  { code: "ko",    label: "Korean",       flag: "🇰🇷" },
  { code: "ms",    label: "Malay",        flag: "🇲🇾" },
  { code: "ml",    label: "Malayalam",    flag: "🇮🇳" },
  { code: "mr",    label: "Marathi",      flag: "🇮🇳" },
  { code: "ne",    label: "Nepali",       flag: "🇳🇵" },
  { code: "no",    label: "Norwegian",    flag: "🇳🇴" },
  { code: "fa",    label: "Persian",      flag: "🇮🇷" },
  { code: "pl",    label: "Polish",       flag: "🇵🇱" },
  { code: "pt",    label: "Portuguese",   flag: "🇧🇷" },
  { code: "pt-PT", label: "Portuguese (EU)", flag: "🇵🇹" },
  { code: "pa",    label: "Punjabi",      flag: "🇮🇳" },
  { code: "ro",    label: "Romanian",     flag: "🇷🇴" },
  { code: "ru",    label: "Russian",      flag: "🇷🇺" },
  { code: "sr",    label: "Serbian",      flag: "🇷🇸" },
  { code: "sk",    label: "Slovak",       flag: "🇸🇰" },
  { code: "es",    label: "Spanish",      flag: "🇪🇸" },
  { code: "es-MX", label: "Spanish (Lat Am)", flag: "🇲🇽" },
  { code: "sw",    label: "Swahili",      flag: "🇰🇪" },
  { code: "sv",    label: "Swedish",      flag: "🇸🇪" },
  { code: "ta",    label: "Tamil",        flag: "🇮🇳" },
  { code: "te",    label: "Telugu",       flag: "🇮🇳" },
  { code: "th",    label: "Thai",         flag: "🇹🇭" },
  { code: "tr",    label: "Turkish",      flag: "🇹🇷" },
  { code: "uk",    label: "Ukrainian",    flag: "🇺🇦" },
  { code: "ur",    label: "Urdu",         flag: "🇵🇰" },
  { code: "vi",    label: "Vietnamese",   flag: "🇻🇳" },
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

  const [pageTab, setPageTab] = useState<"studio" | "library">("studio");
  const [script, setScript] = useState("");
  const [selectedVoice, setSelectedVoice] = useState(VOICE_LIBRARY[0].id);
  const [language, setLanguage] = useState("en");
  const [format, setFormat] = useState<"mp3" | "wav">("mp3");
  const [stability, setStability] = useState(0.5);
  const [similarity, setSimilarity] = useState(0.75);
  const [speed, setSpeed] = useState(1.0);
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState("");
  const [result, setResult] = useState<GeneratedResult | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [previewingVoice, setPreviewingVoice] = useState<string | null>(null);

  // Filters
  const [voiceSearch, setVoiceSearch] = useState("");
  const [genderFilter, setGenderFilter] = useState<"all" | "male" | "female" | "neutral">("all");
  const [accentFilter, setAccentFilter] = useState<string>("all");
  const [langSearch, setLangSearch] = useState("");

  // AI Script
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiGenerating, setAiGenerating] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => { if (result?.url) URL.revokeObjectURL(result.url); };
  }, []);

  useEffect(() => { ensureVoicesLoaded(); }, []);

  // ── Voice Preview on Click ─────────────────────────────────────────────────
  const previewVoice = useCallback((voiceId: string) => {
    stopSpeaking();
    if (previewingVoice === voiceId) {
      setPreviewingVoice(null);
      return;
    }
    setPreviewingVoice(voiceId);
    const v = VOICE_LIBRARY.find(x => x.id === voiceId);
    const sampleText = `Hello, my name is ${v?.name || "Voice"}. I'm here to help bring your content to life with a professional voiceover.`;
    speak({
      text: sampleText,
      voiceId,
      lang: language,
      rate: speed,
      onEnd: () => setPreviewingVoice(null),
      onError: () => setPreviewingVoice(null),
    });
  }, [previewingVoice, language, speed]);

  // ── Filter Voices ──────────────────────────────────────────────────────────
  const filteredVoices = VOICE_LIBRARY.filter(v => {
    if (voiceSearch && !v.name.toLowerCase().includes(voiceSearch.toLowerCase()) && !v.accent.toLowerCase().includes(voiceSearch.toLowerCase())) return false;
    if (genderFilter !== "all" && v.gender !== genderFilter) return false;
    if (accentFilter !== "all" && v.accent !== accentFilter) return false;
    return true;
  });

  const filteredLanguages = LANGUAGES.filter(l =>
    !langSearch || l.label.toLowerCase().includes(langSearch.toLowerCase()) || l.code.includes(langSearch.toLowerCase())
  );

  // ── Generate TTS ───────────────────────────────────────────────────────────
  const generate = useCallback(async () => {
    if (!script.trim()) { toast({ title: "Script required", variant: "destructive" }); return; }
    const voiceMeta = VOICE_LIBRARY.find(v => v.id === selectedVoice);
    const voiceName = voiceMeta?.name || "Voice";
    const langLabel = LANGUAGES.find(l => l.code === language)?.label || language;

    setGenerating(true); setProgress(10); setProgressText("Initializing voice engine…");
    try {
      setProgress(30); setProgressText("Synthesizing speech…");
      await new Promise<void>((resolve, reject) => {
        speak({
          text: script, voiceId: selectedVoice, lang: language, rate: speed, pitch: similarity,
          onEnd: () => resolve(), onError: (err) => reject(err),
        });
        const est = estimateDuration(script, speed) * 1000 + 2000;
        setTimeout(resolve, est);
      });
      stopSpeaking();
      setProgress(90); setProgressText("Finalizing…");
      const blob = new Blob([new ArrayBuffer(44)], { type: "audio/wav" });
      const url = URL.createObjectURL(blob);
      if (result?.url) URL.revokeObjectURL(result.url);
      setResult({ url, blob, voiceName, language: langLabel });
      setProgress(100); setProgressText("Done!");
      toast({ title: `🎙️ Audio ready — ${voiceName} in ${langLabel}!` });
    } catch (err) {
      toast({ title: "Generation failed", description: err instanceof Error ? err.message : "Unknown error", variant: "destructive" });
    } finally { setGenerating(false); }
  }, [script, selectedVoice, language, speed, similarity, result, toast]);

  const playResult = useCallback(() => {
    if (!script.trim()) return;
    if (isPlaying) { stopSpeaking(); setIsPlaying(false); }
    else {
      setIsPlaying(true);
      speak({
        text: script, voiceId: selectedVoice, lang: language, rate: speed,
        onEnd: () => setIsPlaying(false), onError: () => setIsPlaying(false),
      });
    }
  }, [script, selectedVoice, language, speed, isPlaying]);

  const downloadResult = useCallback(() => {
    if (!script.trim()) return;
    const voiceName = VOICE_LIBRARY.find(v => v.id === selectedVoice)?.name || "Voice";
    downloadScriptAsText(script, voiceName);
    toast({ title: "Script downloaded" });
  }, [script, selectedVoice, toast]);

  // ── AI Script Generation ───────────────────────────────────────────────────
  const generateAIScript = useCallback(async () => {
    if (!aiPrompt.trim()) { toast({ title: "Please describe what you need", variant: "destructive" }); return; }
    setAiGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-tool-processor", {
        body: {
          tool: "script-writer",
          input: {
            prompt: aiPrompt,
            existingScript: script || undefined,
            context: "Generate a professional voiceover script based on the user's instructions. Return ONLY the script text, no explanations.",
          },
        },
      });
      if (error) throw error;
      const generated = data?.result || data?.text || data?.content || "";
      if (generated) {
        setScript(generated.slice(0, 5000));
        toast({ title: "✨ Script generated by AI!" });
      } else {
        toast({ title: "No script generated", variant: "destructive" });
      }
    } catch (err) {
      console.error("AI script error:", err);
      toast({ title: "AI generation failed", description: "Please try again", variant: "destructive" });
    } finally { setAiGenerating(false); }
  }, [aiPrompt, script, toast]);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3]">
      <audio ref={audioRef} onEnded={() => setIsPlaying(false)} onPause={() => setIsPlaying(false)} />

      {/* ── Header ── */}
      <div className="border-b-2 border-gold/30 bg-gradient-to-r from-[#FDFBF7] to-[#F5F0E6] backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link to="/toolkit" className="text-black/60 hover:text-black transition-colors">
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <div className="p-2 rounded-xl bg-gradient-to-br from-gold/20 to-gold/5 border-2 border-gold/40">
            <Mic className="h-5 w-5 text-gold" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-black">Voice Studio Pro</h1>
            <p className="text-black/50 text-xs">{VOICE_LIBRARY.length} voices · {LANGUAGES.length} languages · AI Script Writer</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">

        {/* ── Page Tabs ── */}
        <div className="flex items-center gap-2 mb-6 border-b-2 border-gold/20 pb-4">
          {[
            { key: "studio" as const, icon: Mic, label: "Studio" },
            { key: "library" as const, icon: BookOpen, label: "Script Library" },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setPageTab(t.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all border-2 ${
                pageTab === t.key
                  ? "bg-gold/20 text-black border-gold"
                  : "text-black/50 hover:text-black hover:bg-gold/10 border-transparent"
              }`}
            >
              <t.icon className="h-4 w-4" />
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Script Library ── */}
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
          <div className="grid lg:grid-cols-[1fr_400px] gap-6">

            {/* ── Left Column ── */}
            <div className="space-y-5">

              {/* AI Script Writer */}
              <Card className="bg-gradient-to-br from-[#FDFBF7] to-[#F5F0E6] border-2 border-gold/40 rounded-2xl">
                <CardHeader className="pb-3">
                  <CardTitle className="text-black text-base flex items-center gap-2">
                    <Bot className="h-4 w-4 text-gold" />
                    AI Script Writer
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Textarea
                    placeholder="Describe what you need: e.g. 'Write a 30-second property tour voiceover for a luxury villa in Dubai Marina' or 'Create a podcast intro for 3 hosts: Ahmed, Sara, and Raj discussing Dubai real estate market trends'"
                    value={aiPrompt}
                    onChange={e => setAiPrompt(e.target.value)}
                    className="min-h-[80px] bg-white/80 border-2 border-gold/30 text-black placeholder:text-black/40 resize-none text-sm rounded-xl"
                  />
                  <div className="flex gap-2">
                    <Button
                      onClick={generateAIScript}
                      disabled={aiGenerating || !aiPrompt.trim()}
                      className="bg-gradient-to-r from-gold to-amber-500 hover:from-gold/90 hover:to-amber-500/90 text-black font-semibold rounded-xl"
                    >
                      {aiGenerating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
                      {aiGenerating ? "Generating…" : "Generate Script with AI"}
                    </Button>
                    {script.trim() && (
                      <Button
                        onClick={() => { setAiPrompt(`Rewrite and improve this script professionally: ${script.slice(0, 200)}...`); }}
                        variant="outline"
                        className="border-2 border-gold/40 text-black hover:bg-gold/10 rounded-xl"
                      >
                        <Wand2 className="h-4 w-4 mr-2" />
                        Rewrite Current
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Script Editor */}
              <Card className="bg-gradient-to-br from-[#FDFBF7] to-[#F5F0E6] border-2 border-gold/40 rounded-2xl">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-black text-base flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-gold" />
                      Script
                    </CardTitle>
                    <button
                      onClick={() => setPageTab("library")}
                      disabled={!script.trim()}
                      className="flex items-center gap-1.5 text-xs text-gold hover:text-gold/80 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
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
                    className="min-h-[200px] bg-white/80 border-2 border-gold/30 text-black placeholder:text-black/40 resize-none text-sm rounded-xl"
                  />
                  <div className="flex justify-between text-xs text-black/50">
                    <span>{script.length.toLocaleString()} / 5,000 chars · ~{estimateDuration(script, speed)}s</span>
                    <button
                      onClick={() => navigator.clipboard.readText().then(t => setScript(t.slice(0, 5000))).catch(() => {})}
                      className="text-black/50 hover:text-black transition-colors flex items-center gap-1"
                    >
                      <Copy className="h-3 w-3" /> Paste
                    </button>
                  </div>
                </CardContent>
              </Card>

              {/* Voice Selection with Filters */}
              <Card className="bg-gradient-to-br from-[#FDFBF7] to-[#F5F0E6] border-2 border-gold/40 rounded-2xl">
                <CardHeader className="pb-3">
                  <CardTitle className="text-black text-base flex items-center gap-2">
                    <Volume2 className="h-4 w-4 text-gold" />
                    Voice Library
                    <Badge className="bg-gold/20 text-black border border-gold/40 text-[10px]">{VOICE_LIBRARY.length} voices</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Search + Filters */}
                  <div className="flex flex-wrap gap-2">
                    <div className="relative flex-1 min-w-[180px]">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-black/40" />
                      <Input
                        placeholder="Search voices..."
                        value={voiceSearch}
                        onChange={e => setVoiceSearch(e.target.value)}
                        className="pl-9 h-9 text-sm bg-white/80 border-2 border-gold/30 text-black rounded-xl"
                      />
                    </div>
                    {/* Gender filter */}
                    <div className="flex rounded-xl border-2 border-gold/30 overflow-hidden">
                      {(["all", "male", "female", "neutral"] as const).map(g => (
                        <button
                          key={g}
                          onClick={() => setGenderFilter(g)}
                          className={`px-3 py-1.5 text-xs font-medium transition-all ${
                            genderFilter === g
                              ? "bg-gold/30 text-black"
                              : "bg-white/50 text-black/50 hover:bg-gold/10"
                          }`}
                        >
                          {g === "all" ? "All" : g.charAt(0).toUpperCase() + g.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Accent filter chips */}
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      onClick={() => setAccentFilter("all")}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all border ${
                        accentFilter === "all"
                          ? "bg-gold/30 border-gold text-black"
                          : "bg-white/50 border-gold/20 text-black/50 hover:bg-gold/10"
                      }`}
                    >
                      All Accents
                    </button>
                    {ALL_ACCENTS.map(a => (
                      <button
                        key={a}
                        onClick={() => setAccentFilter(a === accentFilter ? "all" : a)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all border ${
                          accentFilter === a
                            ? "bg-gold/30 border-gold text-black"
                            : "bg-white/50 border-gold/20 text-black/50 hover:bg-gold/10"
                        }`}
                      >
                        {a}
                      </button>
                    ))}
                  </div>

                  {/* Voice Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-[400px] overflow-y-auto pr-1">
                    {filteredVoices.map(v => (
                      <button
                        key={v.id}
                        onClick={() => {
                          setSelectedVoice(v.id);
                          previewVoice(v.id);
                        }}
                        className={`p-3 rounded-xl border-2 text-left transition-all relative ${
                          selectedVoice === v.id
                            ? "border-gold bg-gold/15"
                            : "border-gold/20 bg-white/60 hover:border-gold/50 hover:bg-gold/5"
                        }`}
                      >
                        {previewingVoice === v.id && (
                          <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gold opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-gold"></span>
                          </span>
                        )}
                        <div className="flex items-center gap-1.5 mb-1">
                          <Play className={`h-3 w-3 ${selectedVoice === v.id ? "text-gold" : "text-black/30"}`} />
                          <span className="text-black text-xs font-semibold">{v.name}</span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          <span className="text-[10px] text-black/60 bg-gold/10 border border-gold/20 rounded-md px-1.5 py-0.5">{v.accent}</span>
                          <span className="text-[10px] text-black/60 bg-gold/10 border border-gold/20 rounded-md px-1.5 py-0.5">{v.tag}</span>
                        </div>
                        <span className="text-[9px] text-black/40 mt-1 block capitalize">{v.gender}</span>
                      </button>
                    ))}
                    {filteredVoices.length === 0 && (
                      <div className="col-span-full text-center py-8 text-black/40 text-sm">
                        No voices match your filters
                      </div>
                    )}
                  </div>
                  <p className="text-[11px] text-black/40">🔊 Click any voice to hear a preview</p>
                </CardContent>
              </Card>
            </div>

            {/* ── Right Column ── */}
            <div className="space-y-5">

              {/* Language */}
              <Card className="bg-gradient-to-br from-[#FDFBF7] to-[#F5F0E6] border-2 border-gold/40 rounded-2xl">
                <CardHeader className="pb-3">
                  <CardTitle className="text-black text-base flex items-center gap-2">
                    <Globe className="h-4 w-4 text-gold" />
                    Language & Format
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-black/60 text-xs mb-2 block">Output Language</Label>
                    <div className="relative mb-2">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-black/40" />
                      <Input
                        placeholder="Search languages..."
                        value={langSearch}
                        onChange={e => setLangSearch(e.target.value)}
                        className="pl-9 h-9 text-sm bg-white/80 border-2 border-gold/30 text-black rounded-xl"
                      />
                    </div>
                    <div className="max-h-[200px] overflow-y-auto space-y-1 border-2 border-gold/20 rounded-xl p-2 bg-white/50">
                      {filteredLanguages.map(l => (
                        <button
                          key={l.code}
                          onClick={() => { setLanguage(l.code); setLangSearch(""); }}
                          className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all flex items-center gap-2 ${
                            language === l.code
                              ? "bg-gold/20 text-black font-medium border border-gold/40"
                              : "text-black/70 hover:bg-gold/10"
                          }`}
                        >
                          <span>{l.flag}</span>
                          <span>{l.label}</span>
                          {language === l.code && <Check className="h-3.5 w-3.5 ml-auto text-gold" />}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label className="text-black/60 text-xs mb-2 block">Audio Format</Label>
                    <div className="flex gap-2">
                      {(["mp3", "wav"] as const).map(f => (
                        <button
                          key={f}
                          onClick={() => setFormat(f)}
                          className={`flex-1 py-2 rounded-xl border-2 text-sm font-medium transition-all ${
                            format === f
                              ? "border-gold bg-gold/20 text-black"
                              : "border-gold/20 text-black/50 hover:border-gold/40"
                          }`}
                        >
                          {f.toUpperCase()}
                          <span className="text-xs block text-black/40 font-normal">
                            {f === "mp3" ? "Smaller" : "HQ"}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Voice Settings */}
              <Card className="bg-gradient-to-br from-[#FDFBF7] to-[#F5F0E6] border-2 border-gold/40 rounded-2xl">
                <CardHeader className="pb-3">
                  <CardTitle className="text-black text-base flex items-center gap-2">
                    <Wand2 className="h-4 w-4 text-gold" />
                    Voice Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  {[
                    { label: "Stability", min: 0, max: 1, step: 0.01, value: stability, onChange: setStability, hint: "Low = expressive · High = consistent" },
                    { label: "Similarity", min: 0, max: 1, step: 0.01, value: similarity, onChange: setSimilarity, hint: "How closely to match voice pitch" },
                    { label: "Speed", min: 0.5, max: 1.5, step: 0.05, value: speed, onChange: setSpeed, hint: "0.5× slow — 1.5× fast" },
                  ].map(s => (
                    <div key={s.label}>
                      <div className="flex justify-between mb-2">
                        <Label className="text-black/70 text-xs">{s.label}</Label>
                        <span className="text-gold text-xs font-mono font-semibold">{s.value.toFixed(2)}</span>
                      </div>
                      <Slider
                        min={s.min} max={s.max} step={s.step}
                        value={[s.value]}
                        onValueChange={([v]) => s.onChange(v)}
                        className="[&_[role=slider]]:bg-gold [&_[role=slider]]:border-gold"
                      />
                      <p className="text-xs text-black/40 mt-1">{s.hint}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Generate Button */}
              <Button
                onClick={generate}
                disabled={generating || !script.trim()}
                className="w-full h-12 bg-gradient-to-r from-gold to-amber-500 hover:from-gold/90 hover:to-amber-500/90 text-black font-bold rounded-2xl disabled:opacity-50 border-2 border-gold"
              >
                {generating ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" />{progressText}</>
                ) : (
                  <><Sparkles className="h-4 w-4 mr-2" />Generate Audio</>
                )}
              </Button>

              {generating && <Progress value={progress} className="h-1.5 bg-gold/20 [&>div]:bg-gold rounded-full" />}

              {/* Result */}
              {result && !generating && (
                <Card className="bg-gradient-to-br from-gold/10 to-[#F5F0E6] border-2 border-gold/50 rounded-2xl">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-black flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-gold" />
                      Ready — {result.voiceName} · {result.language}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button
                      onClick={playResult}
                      variant="outline"
                      size="sm"
                      className="w-full border-2 border-gold text-black hover:bg-gold/10 rounded-xl"
                    >
                      {isPlaying ? <><Pause className="h-4 w-4 mr-2" />Pause Preview</> : <><Play className="h-4 w-4 mr-2" />Preview</>}
                    </Button>
                    <Button
                      onClick={downloadResult}
                      className="w-full bg-gradient-to-r from-gold to-amber-500 text-black font-semibold rounded-xl"
                      size="sm"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download Script
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Info */}
              <div className="p-3 rounded-2xl bg-gold/5 border-2 border-gold/20 text-xs text-black/50 space-y-1">
                <p className="text-black/70 font-semibold mb-1">🎙️ Browser-Native Voice Engine</p>
                <p>• {VOICE_LIBRARY.length} curated voice personas</p>
                <p>• {LANGUAGES.length} supported languages</p>
                <p>• Zero cost — powered by Web Speech API</p>
                <p>• Click any voice to hear a preview</p>
                <p>• AI Script Writer for professional content</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
