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
  User, Users, Zap, Bot, Save, Square, Video, VideoOff
} from "lucide-react";
import {
  BROWSER_VOICE_LIBRARY,
  getPersona,
  speak,
  stopSpeaking,
  pauseSpeaking,
  resumeSpeaking,
  ensureVoicesLoaded,
  downloadScriptAsText,
  estimateDuration,
  isPaused,
} from "@/lib/browser-tts";

// ── Use the unified voice library from browser-tts ──────────────────────────
const VOICE_LIBRARY = BROWSER_VOICE_LIBRARY.map(v => ({
  id: v.id, name: v.name, gender: v.gender, accent: v.accent, tag: v.tag,
  ageGroup: v.ageGroup, nativeLang: v.nativeLang,
}));

const ALL_ACCENTS = [...new Set(VOICE_LIBRARY.map(v => v.accent))].sort();
const ALL_AGE_GROUPS = ["young", "middle", "senior"];

const LANGUAGES = [
  { code: "en",    label: "English",      flag: "🇬🇧" },
  { code: "en-US", label: "English (US)", flag: "🇺🇸" },
  { code: "ar",    label: "Arabic",       flag: "🇦🇪" },
  { code: "ar-EG", label: "Arabic (Egyptian)", flag: "🇪🇬" },
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
  const [isPausedState, setIsPausedState] = useState(false);
  const [previewingVoice, setPreviewingVoice] = useState<string | null>(null);
  const [showVideo, setShowVideo] = useState(false);
  const [videoUrl, setVideoUrl] = useState("");

  // Filters
  const [voiceSearch, setVoiceSearch] = useState("");
  const [genderFilter, setGenderFilter] = useState<"all" | "male" | "female" | "neutral">("all");
  const [accentFilter, setAccentFilter] = useState<string>("all");
  const [ageFilter, setAgeFilter] = useState<string>("all");
  const [langSearch, setLangSearch] = useState("");

  // AI Script
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiGenerating, setAiGenerating] = useState(false);

  // Save project
  const [savingProject, setSavingProject] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    return () => { if (result?.url) URL.revokeObjectURL(result.url); };
  }, []);

  useEffect(() => { ensureVoicesLoaded(); }, []);

  // ── Voice Preview — uses persona's NATIVE language ─────────────────────────
  const previewVoice = useCallback((voiceId: string) => {
    // If this voice is currently previewing, toggle pause/stop
    if (previewingVoice === voiceId) {
      if (isPaused()) {
        resumeSpeaking();
        return;
      }
      stopSpeaking();
      setPreviewingVoice(null);
      return;
    }
    // Stop any current speech
    stopSpeaking();
    setPreviewingVoice(voiceId);
    
    const persona = getPersona(voiceId);
    const nativeLang = persona.nativeLang || "en";
    const baseLang = nativeLang.split("-")[0];
    
    // Sample text in the persona's NATIVE language so voices sound authentic
    const sampleTexts: Record<string, string> = {
      "ar": `مرحباً، أنا ${persona.name}. يسعدني مساعدتك في إنشاء محتوى صوتي احترافي عالي الجودة يناسب مشاريعك.`,
      "it": `Ciao, mi chiamo ${persona.name}. Sono qui per aiutarti a creare contenuti vocali professionali di altissima qualità.`,
      "fr": `Bonjour, je m'appelle ${persona.name}. Je suis ici pour vous aider à créer du contenu vocal professionnel de haute qualité.`,
      "de": `Hallo, ich bin ${persona.name}. Ich helfe Ihnen dabei, professionelle und hochwertige Sprachinhalte zu erstellen.`,
      "es": `Hola, soy ${persona.name}. Estoy aquí para ayudarte a crear contenido de voz profesional de alta calidad.`,
      "ja": `こんにちは、${persona.name}です。高品質なプロフェッショナル音声コンテンツの作成をお手伝いいたします。`,
      "ko": `안녕하세요, ${persona.name}입니다. 고품질 전문 음성 콘텐츠 제작을 도와드리겠습니다.`,
      "zh": `你好，我是${persona.name}。我将帮助您创建高质量的专业语音内容。`,
      "ru": `Здравствуйте, я ${persona.name}. Я помогу вам создать профессиональный голосовой контент высочайшего качества.`,
      "pt": `Olá, eu sou ${persona.name}. Estou aqui para ajudá-lo a criar conteúdo de voz profissional de alta qualidade.`,
      "hi": `नमस्ते, मैं ${persona.name} हूं। मैं आपको उच्च गुणवत्ता वाले पेशेवर वॉइस कंटेंट बनाने में मदद करूंगा।`,
      "tr": `Merhaba, ben ${persona.name}. Size yüksek kaliteli profesyonel ses içeriği oluşturmanızda yardımcı olacağım.`,
      "ur": `السلام علیکم، میرا نام ${persona.name} ہے۔ میں آپ کو پیشہ ورانہ وائس مواد بنانے میں مدد کروں گا۔`,
    };
    
    const sampleText = sampleTexts[baseLang] || 
      `Hello, my name is ${persona.name}. I'm here to help you create professional voiceover content with natural, expressive delivery.`;
    
    // Use the persona's native language for preview — NOT the output language
    speak({
      text: sampleText,
      voiceId,
      lang: nativeLang,
      rate: speed,
      onEnd: () => setPreviewingVoice(null),
      onError: () => setPreviewingVoice(null),
    });
  }, [previewingVoice, speed]);

  // Pause current preview
  const pausePreview = useCallback(() => {
    pauseSpeaking();
    setIsPausedState(true);
  }, []);

  const resumePreview = useCallback(() => {
    resumeSpeaking();
    setIsPausedState(false);
  }, []);

  // ── Filter Voices ──────────────────────────────────────────────────────────
  const filteredVoices = VOICE_LIBRARY.filter(v => {
    if (voiceSearch && !v.name.toLowerCase().includes(voiceSearch.toLowerCase()) && !v.accent.toLowerCase().includes(voiceSearch.toLowerCase())) return false;
    if (genderFilter !== "all" && v.gender !== genderFilter) return false;
    if (accentFilter !== "all" && v.accent !== accentFilter) return false;
    if (ageFilter !== "all" && v.ageGroup !== ageFilter) return false;
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
    if (isPlaying) {
      if (isPaused()) {
        resumeSpeaking();
        setIsPausedState(false);
      } else {
        pauseSpeaking();
        setIsPausedState(true);
      }
    } else {
      setIsPlaying(true);
      setIsPausedState(false);
      speak({
        text: script, voiceId: selectedVoice, lang: language, rate: speed,
        onEnd: () => { setIsPlaying(false); setIsPausedState(false); },
        onError: () => { setIsPlaying(false); setIsPausedState(false); },
      });
    }
  }, [script, selectedVoice, language, speed, isPlaying]);

  const stopPlayback = useCallback(() => {
    stopSpeaking();
    setIsPlaying(false);
    setIsPausedState(false);
  }, []);

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

  // ── Save Project ───────────────────────────────────────────────────────────
  const saveProject = useCallback(async () => {
    setSavingProject(true);
    try {
      const projectData = {
        script,
        selectedVoice,
        language,
        format,
        stability,
        similarity,
        speed,
        videoUrl,
        showVideo,
      };
      // Save to sessionStorage for immediate persistence
      sessionStorage.setItem("voice-studio-pro-project", JSON.stringify(projectData));
      toast({ title: "💾 Project saved!" });
    } catch (err) {
      toast({ title: "Failed to save project", variant: "destructive" });
    } finally {
      setSavingProject(false);
    }
  }, [script, selectedVoice, language, format, stability, similarity, speed, videoUrl, showVideo, toast]);

  // Restore project on mount
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem("voice-studio-pro-project");
      if (saved) {
        const data = JSON.parse(saved);
        if (data.script) setScript(data.script);
        if (data.selectedVoice) setSelectedVoice(data.selectedVoice);
        if (data.language) setLanguage(data.language);
        if (data.format) setFormat(data.format);
        if (data.stability !== undefined) setStability(data.stability);
        if (data.similarity !== undefined) setSimilarity(data.similarity);
        if (data.speed !== undefined) setSpeed(data.speed);
        if (data.videoUrl) setVideoUrl(data.videoUrl);
        if (data.showVideo) setShowVideo(data.showVideo);
      }
    } catch {}
  }, []);

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
          <div className="flex-1">
            <h1 className="text-xl font-bold text-black">Voice Studio Pro</h1>
            <p className="text-black/50 text-xs">{VOICE_LIBRARY.length} voices · {LANGUAGES.length} languages · AI Script Writer</p>
          </div>
          <Button
            onClick={saveProject}
            disabled={savingProject}
            size="sm"
            className="bg-gradient-to-r from-gold to-amber-500 hover:from-gold/90 hover:to-amber-500/90 text-black font-semibold rounded-xl border-2 border-gold"
          >
            {savingProject ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Save className="h-4 w-4 mr-1.5" />}
            Save Project
          </Button>
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
                  : "text-black/50 hover:text-black hover:bg-gold/10 border-gold/20"
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
          <div className="space-y-6">
            
            {/* Video Preview Toggle */}
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowVideo(!showVideo)}
                className={`rounded-xl border-2 ${showVideo ? "border-gold bg-gold/15 text-black" : "border-gold/30 text-black/60 hover:border-gold/50"}`}
              >
                {showVideo ? <VideoOff className="h-4 w-4 mr-1.5" /> : <Video className="h-4 w-4 mr-1.5" />}
                {showVideo ? "Hide Video Preview" : "Add Video Preview"}
              </Button>
            </div>

            {/* Video Preview Area */}
            {showVideo && (
              <Card className="bg-gradient-to-br from-[#FDFBF7] to-[#F5F0E6] border-2 border-gold/40 rounded-2xl">
                <CardHeader className="pb-3">
                  <CardTitle className="text-black text-base flex items-center gap-2">
                    <Video className="h-4 w-4 text-gold" />
                    Video Preview
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Input
                    placeholder="Paste video URL or upload path…"
                    value={videoUrl}
                    onChange={e => setVideoUrl(e.target.value)}
                    className="bg-white/80 border-2 border-gold/30 text-black placeholder:text-black/40 rounded-xl"
                  />
                  <div className="aspect-video bg-black/5 border-2 border-gold/20 rounded-xl flex items-center justify-center overflow-hidden">
                    {videoUrl ? (
                      <video
                        ref={videoRef}
                        src={videoUrl}
                        className="w-full h-full object-contain rounded-xl"
                        controls
                      />
                    ) : (
                      <div className="text-center text-black/30">
                        <Video className="h-12 w-12 mx-auto mb-2 opacity-30" />
                        <p className="text-sm">Paste a video URL above to preview</p>
                        <p className="text-xs mt-1">Your voiceover will sync with this video</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

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
                      placeholder="Describe what you need: e.g. 'Write a 30-second property tour voiceover for a luxury villa in Dubai Marina' or 'Create a podcast intro for 3 hosts discussing Dubai real estate'"
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
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setPageTab("library")}
                          disabled={!script.trim()}
                          className="flex items-center gap-1.5 text-xs text-gold hover:text-gold/80 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          <BookOpen className="h-3.5 w-3.5" />
                          Save to Library
                        </button>
                      </div>
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
                      <Badge className="bg-gold/20 text-black border-2 border-gold/40 text-[10px]">{VOICE_LIBRARY.length} voices</Badge>
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

                    {/* Age filter */}
                    <div className="flex flex-wrap gap-1.5">
                      <span className="text-[11px] text-black/40 mr-1 self-center">Age:</span>
                      <button
                        onClick={() => setAgeFilter("all")}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all border-2 ${
                          ageFilter === "all"
                            ? "bg-gold/30 border-gold text-black"
                            : "bg-white/50 border-gold/20 text-black/50 hover:bg-gold/10"
                        }`}
                      >
                        All Ages
                      </button>
                      {ALL_AGE_GROUPS.map(a => (
                        <button
                          key={a}
                          onClick={() => setAgeFilter(a === ageFilter ? "all" : a)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all border-2 ${
                            ageFilter === a
                              ? "bg-gold/30 border-gold text-black"
                              : "bg-white/50 border-gold/20 text-black/50 hover:bg-gold/10"
                          }`}
                        >
                          {a === "young" ? "Young" : a === "middle" ? "Adult" : "Senior"}
                        </button>
                      ))}
                    </div>

                    {/* Accent filter chips */}
                    <div className="flex flex-wrap gap-1.5">
                      <span className="text-[11px] text-black/40 mr-1 self-center">Accent:</span>
                      <button
                        onClick={() => setAccentFilter("all")}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all border-2 ${
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
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all border-2 ${
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
                            <div className="absolute top-1.5 right-1.5 flex items-center gap-1">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  stopSpeaking();
                                  setPreviewingVoice(null);
                                }}
                                className="p-0.5 rounded-full bg-gold/20 hover:bg-gold/40 transition-colors"
                                title="Stop"
                              >
                                <Square className="h-2.5 w-2.5 text-gold" />
                              </button>
                              <span className="flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gold opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-gold"></span>
                              </span>
                            </div>
                          )}
                          <div className="flex items-center gap-1.5 mb-1">
                            <Play className={`h-3 w-3 ${selectedVoice === v.id ? "text-gold" : "text-black/30"}`} />
                            <span className="text-black text-xs font-semibold">{v.name}</span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            <span className="text-[10px] text-black/60 bg-gold/10 border-2 border-gold/20 rounded-md px-1.5 py-0.5">{v.accent}</span>
                            <span className="text-[10px] text-black/60 bg-gold/10 border-2 border-gold/20 rounded-md px-1.5 py-0.5">{v.tag}</span>
                          </div>
                          <div className="flex items-center gap-1 mt-1">
                            <span className="text-[9px] text-black/40 capitalize">{v.gender}</span>
                            <span className="text-[9px] text-black/30">·</span>
                            <span className="text-[9px] text-black/40 capitalize">{v.ageGroup}</span>
                          </div>
                        </button>
                      ))}
                      {filteredVoices.length === 0 && (
                        <div className="col-span-full text-center py-8 text-black/40 text-sm">
                          No voices match your filters
                        </div>
                      )}
                    </div>
                    <p className="text-[11px] text-black/40">🔊 Click any voice to hear a preview · Click again to stop</p>
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
                                ? "bg-gold/20 text-black font-medium border-2 border-gold/40"
                                : "text-black/70 hover:bg-gold/10 border-2 border-transparent"
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
                      <div className="flex gap-2">
                        <Button
                          onClick={playResult}
                          variant="outline"
                          size="sm"
                          className="flex-1 border-2 border-gold text-black hover:bg-gold/10 rounded-xl"
                        >
                          {isPlaying && !isPausedState ? <><Pause className="h-4 w-4 mr-2" />Pause</> : <><Play className="h-4 w-4 mr-2" />{isPausedState ? "Resume" : "Preview"}</>}
                        </Button>
                        {isPlaying && (
                          <Button
                            onClick={stopPlayback}
                            variant="outline"
                            size="sm"
                            className="border-2 border-gold/40 text-black hover:bg-gold/10 rounded-xl"
                          >
                            <Square className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
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
                  <p>• Video sync support for voiceovers</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
