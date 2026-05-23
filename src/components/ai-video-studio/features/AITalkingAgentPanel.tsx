import React, { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { VoiceInputButton } from "@/components/ui/VoiceInputButton";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "@/config/backend";
import {
  Loader2,
  Play,
  Pause,
  Download,
  Plus,
  Wand2,
  Globe,
  Mic2,
  CheckCircle2,
  Sparkles,
} from "lucide-react";

// ─── Character definitions with ElevenLabs voice IDs ────────────────────────

interface Character {
  id: string;
  name: string;
  title: string;
  avatar: string;
  gender: "male" | "female" | "neutral";
  style: string;
  color: string;
  elevenLabsVoiceId: string; // mapped from VOICE_OPTIONS in types.ts
}

const CHARACTERS: Character[] = [
  { id: "sarah",   name: "Sarah",   title: "Luxury Specialist",  avatar: "S", gender: "female",  style: "Professional & friendly",   color: "from-rose-500 to-pink-600",    elevenLabsVoiceId: "EXAVITQu4vr4xnSDxMaL" },
  { id: "george",  name: "George",  title: "Senior Advisor",     avatar: "G", gender: "male",    style: "Warm & experienced",         color: "from-blue-500 to-indigo-600",  elevenLabsVoiceId: "JBFqnCBsd6RMkjVDRZzb" },
  { id: "laura",   name: "Laura",   title: "Premium Agent",      avatar: "L", gender: "female",  style: "Luxury & sophisticated",     color: "from-purple-500 to-violet-600",elevenLabsVoiceId: "FGY2WhTYpPnrIDTdsKH5" },
  { id: "alex",    name: "Alex",    title: "Investment Expert",  avatar: "A", gender: "male",    style: "Confident & authoritative",  color: "from-emerald-500 to-teal-600", elevenLabsVoiceId: "TX3LPaxmHKxFdv7VOQHJ" },
  { id: "alice",   name: "Alice",   title: "Modern Broker",      avatar: "A", gender: "female",  style: "Energetic & modern",         color: "from-amber-500 to-orange-600", elevenLabsVoiceId: "Xb7hH8MSUJpSbSDYk0k2" },
  { id: "river",   name: "River",   title: "Prestige Narrator",  avatar: "R", gender: "neutral", style: "Elegant & premium",          color: "from-slate-400 to-gray-600",   elevenLabsVoiceId: "SAz9YHcvj6GT2YYXdXww" },
  { id: "brian",   name: "Brian",   title: "Market Analyst",     avatar: "B", gender: "male",    style: "Deep & trustworthy",         color: "from-cyan-500 to-sky-600",     elevenLabsVoiceId: "onwK4e9ZLuTAKqWW03F9" },
  { id: "matilda", name: "Matilda", title: "Community Expert",   avatar: "M", gender: "female",  style: "Warm & inviting",            color: "from-lime-500 to-green-600",   elevenLabsVoiceId: "XrExE9yKIg1WjnnlVkGX" },
];

const LANGUAGES = [
  { code: "en", label: "English",  flag: "🇺🇸" },
  { code: "ar", label: "Arabic",   flag: "🇦🇪" },
  { code: "fr", label: "French",   flag: "🇫🇷" },
  { code: "de", label: "German",   flag: "🇩🇪" },
  { code: "es", label: "Spanish",  flag: "🇪🇸" },
  { code: "ru", label: "Russian",  flag: "🇷🇺" },
  { code: "zh", label: "Chinese",  flag: "🇨🇳" },
  { code: "hi", label: "Hindi",    flag: "🇮🇳" },
  { code: "ur", label: "Urdu",     flag: "🇵🇰" },
  { code: "tr", label: "Turkish",  flag: "🇹🇷" },
];

const TONES = [
  { id: "professional", label: "Professional", icon: "🎯" },
  { id: "luxury",       label: "Luxury",       icon: "💎" },
  { id: "energetic",    label: "Energetic",    icon: "⚡" },
  { id: "friendly",     label: "Friendly",     icon: "😊" },
];

const DURATIONS = [
  { value: 30,  label: "30s"   },
  { value: 45,  label: "45s"   },
  { value: 60,  label: "1 min" },
  { value: 90,  label: "90s"   },
];

// ─── Component ───────────────────────────────────────────────────────────────

interface GeneratedNarration {
  script: string;
  duration: number;
  wordCount: number;
  character: string;
}

interface AITalkingAgentPanelProps {
  onAddToTimeline?: (audioUrl: string, duration: number, script: string, characterName: string) => void;
  onAIVoiceGenerated?: (audioUrl: string, duration: number) => void;
}

export function AITalkingAgentPanel({ onAddToTimeline, onAIVoiceGenerated }: AITalkingAgentPanelProps) {
  const [selectedCharacter, setSelectedCharacter] = useState<Character>(CHARACTERS[0]);
  const [selectedLanguage, setSelectedLanguage]   = useState("en");
  const [selectedTone, setSelectedTone]           = useState("professional");
  const [selectedDuration, setSelectedDuration]   = useState(45);
  const [prompt, setPrompt]                       = useState("");
  const [isGenerating, setIsGenerating]           = useState(false);
  const [narration, setNarration]                 = useState<GeneratedNarration | null>(null);
  const [isPlaying, setIsPlaying]                 = useState(false);
  const [showScript, setShowScript]               = useState(false);
  // Voice engine toggle
  const [voiceEngine, setVoiceEngine]             = useState<"browser" | "premium">("browser");
  const [isPremiumGenerating, setIsPremiumGenerating] = useState(false);
  const [premiumAudioUrl, setPremiumAudioUrl]     = useState<string | null>(null);

  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // ── Generate narration script ─────────────────────────────────────────────
  const handleGenerate = useCallback(async () => {
    if (!prompt.trim()) {
      toast.error("Please describe the property first");
      return;
    }
    setIsGenerating(true);
    setNarration(null);
    setIsPlaying(false);
    setPremiumAudioUrl(null);
    window.speechSynthesis.cancel();
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }

    try {
      const { data, error } = await supabase.functions.invoke("ai-talking-agent", {
        body: {
          prompt,
          character: selectedCharacter.id,
          language: selectedLanguage,
          tone: selectedTone,
          duration: selectedDuration,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setNarration({ script: data.script, duration: data.duration, wordCount: data.wordCount, character: data.character });
      toast.success(`🎙️ Narration script is ready!`);
    } catch (err: any) {
      console.error("AI Talking Agent error:", err);
      if (err.message?.includes("Rate limit") || err.message?.includes("429")) {
        toast.error("Rate limit reached. Try again in a moment.");
      } else if (err.message?.includes("credits") || err.message?.includes("402")) {
        toast.error("AI credits exhausted. Please add credits.");
      } else {
        toast.error("Failed to generate narration: " + (err.message || "Unknown error"));
      }
    } finally {
      setIsGenerating(false);
    }
  }, [prompt, selectedCharacter, selectedLanguage, selectedTone, selectedDuration]);

  // ── Generate Premium Voice via ElevenLabs ──────────────────────────────────
  const handleGeneratePremiumVoice = useCallback(async () => {
    if (!narration?.script) return;
    setIsPremiumGenerating(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Please log in to use Premium Voice");
        return;
      }

      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/voice-studio-tts`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            text: narration.script,
            voiceId: selectedCharacter.elevenLabsVoiceId,
            format: "mp3",
            voiceSettings: {
              stability: 0.5,
              similarity_boost: 0.75,
              speed: 1.0,
            },
          }),
        }
      );

      if (!response.ok) {
        if (response.status === 429) {
          toast.error("Voice API rate limited — using browser voice as fallback");
          setVoiceEngine("browser");
          return;
        }
        if (response.status === 402) {
          toast.error("Voice credits exhausted — using browser voice");
          setVoiceEngine("browser");
          return;
        }
        throw new Error(`Voice generation failed: ${response.status}`);
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      setPremiumAudioUrl(audioUrl);
      toast.success("🎧 Premium voice generated!");
    } catch (err: any) {
      console.error("Premium voice error:", err);
      toast.error("Premium voice failed — falling back to browser voice");
      setVoiceEngine("browser");
    } finally {
      setIsPremiumGenerating(false);
    }
  }, [narration, selectedCharacter]);

  // ── Playback — Web Speech API ──────────────────────────────────────────────
  const handlePlayPauseBrowser = useCallback(() => {
    if (!narration?.script) return;

    if (isPlaying) {
      window.speechSynthesis.pause();
      setIsPlaying(false);
      return;
    }

    setIsPlaying(true);

    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(narration.script);
    utterance.lang = selectedLanguage;
    utterance.rate = 0.9;
    utterance.pitch = selectedCharacter.gender === "female" ? 1.1 : selectedCharacter.gender === "neutral" ? 1.0 : 0.85;
    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);
    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, [narration, isPlaying, selectedLanguage, selectedCharacter]);

  // ── Playback — Premium Audio ───────────────────────────────────────────────
  const handlePlayPausePremium = useCallback(() => {
    if (!premiumAudioUrl) return;

    if (audioRef.current && isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      return;
    }

    if (audioRef.current) {
      audioRef.current.play();
      setIsPlaying(true);
      return;
    }

    const audio = new Audio(premiumAudioUrl);
    audio.onended = () => setIsPlaying(false);
    audio.onerror = () => { setIsPlaying(false); toast.error("Audio playback failed"); };
    audioRef.current = audio;
    audio.play();
    setIsPlaying(true);
  }, [premiumAudioUrl, isPlaying]);

  const handlePlayPause = useCallback(() => {
    if (voiceEngine === "premium" && premiumAudioUrl) {
      handlePlayPausePremium();
    } else {
      handlePlayPauseBrowser();
    }
  }, [voiceEngine, premiumAudioUrl, handlePlayPausePremium, handlePlayPauseBrowser]);

  // ── Download ───────────────────────────────────────────────────────────────
  const handleDownload = useCallback(() => {
    if (voiceEngine === "premium" && premiumAudioUrl) {
      const a = document.createElement("a");
      a.href = premiumAudioUrl;
      a.download = `${selectedCharacter.name}-narration.mp3`;
      a.click();
      toast.success("Premium audio downloaded");
      return;
    }
    if (!narration?.script) return;
    const utterance = new SpeechSynthesisUtterance(narration.script);
    utterance.lang = selectedLanguage;
    utterance.rate = 0.9;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
    toast.info("Playing narration — use your system audio recorder to capture it.");
  }, [narration, selectedLanguage, voiceEngine, premiumAudioUrl, selectedCharacter]);

  // ── Add to timeline ────────────────────────────────────────────────────────
  const handleAddToTimeline = useCallback(() => {
    if (!narration) return;
    const audioUrl = voiceEngine === "premium" && premiumAudioUrl
      ? premiumAudioUrl
      : `speech-synthesis://${encodeURIComponent(narration.script)}`;
    onAddToTimeline?.(audioUrl, narration.duration, narration.script, narration.character);
    onAIVoiceGenerated?.(audioUrl, narration.duration);
    toast.success(`${narration.character}'s narration added to timeline`);
  }, [narration, onAddToTimeline, onAIVoiceGenerated, voiceEngine, premiumAudioUrl]);

  // ── Voice transcript → prompt ──────────────────────────────────────────────
  const handleVoiceTranscript = useCallback((text: string) => {
    setPrompt(prev => (prev ? prev + " " + text : text));
  }, []);

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-5">

        {/* Header */}
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-amber-500/20">
            <Mic2 className="w-4 h-4 text-[#1A1A1A]" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">AI Talking Agent</h3>
            <p className="text-xs text-[#1A1A1A]/70">Pick a character narrator for your property video</p>
          </div>
        </div>

        {/* ═══ VOICE ENGINE TOGGLE ═══ */}
        <section>
          <p className="text-xs font-semibold text-[#1A1A1A]/70 uppercase tracking-wider mb-2">Voice Engine</p>
          <div className="flex gap-2">
            <button
              onClick={() => setVoiceEngine("browser")}
              className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-all ${
                voiceEngine === "browser"
                  ? "bg-[#1A1A1A] text-white border-[#B89555]/30"
                  : "bg-[#1A1A1A]/60 text-[#1A1A1A]/70 border-[#1A1A1A] hover:border-[#B89555]/30"
              }`}
            >
              🔊 Browser Voice
            </button>
            <button
              onClick={() => setVoiceEngine("premium")}
              className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                voiceEngine === "premium"
                  ? "bg-purple-500/20 text-purple-300 border-purple-500/50"
                  : "bg-[#1A1A1A]/60 text-[#1A1A1A]/70 border-[#1A1A1A] hover:border-purple-500/30"
              }`}
            >
              <Sparkles className="w-3 h-3" /> Premium Voice
            </button>
          </div>
          {voiceEngine === "premium" && (
            <p className="text-[10px] text-purple-300/70 mt-1.5">
              Powered by ElevenLabs — natural, human-quality voices. Requires login.
            </p>
          )}
        </section>

        {/* ═══ CHARACTER GRID ═══ */}
        <section>
          <p className="text-xs font-semibold text-[#1A1A1A]/70 uppercase tracking-wider mb-2">Character</p>
          <div className="grid grid-cols-4 gap-2">
            {CHARACTERS.map((char) => (
              <button
                key={char.id}
                onClick={() => setSelectedCharacter(char)}
                className={`relative flex flex-col items-center gap-1 p-2 rounded-xl border transition-all text-center ${
                  selectedCharacter.id === char.id
                    ? "border-amber-400 bg-amber-500/10"
                    : "border-[#1A1A1A] bg-[#1A1A1A]/60 hover:border-[#B89555]/30"
                }`}
              >
                {selectedCharacter.id === char.id && (
                  <CheckCircle2 className="absolute top-1 right-1 w-3 h-3 text-[#1A1A1A]" />
                )}
                <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${char.color} flex items-center justify-center text-xl shadow-lg`}>
                  {char.avatar}
                </div>
                <p className="text-[10px] font-bold text-white leading-tight">{char.name}</p>
                <p className="text-[9px] text-[#1A1A1A]/70 leading-tight">{char.title}</p>
              </button>
            ))}
          </div>
          <div className="mt-2 p-2.5 rounded-lg border border-[#1A1A1A] bg-[#1A1A1A]/60">
            <p className="text-xs text-white font-medium">{selectedCharacter.name} · {selectedCharacter.title}</p>
            <p className="text-[10px] text-[#1A1A1A]/70">{selectedCharacter.style}</p>
          </div>
        </section>

        {/* ── LANGUAGE + TONE ROW ─────────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-3">
          <section>
            <p className="text-xs font-semibold text-[#1A1A1A]/70 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <Globe className="w-3 h-3" /> Language
            </p>
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="w-full bg-[#1A1A1A] border border-[#B89555]/30 text-white text-xs rounded-lg px-2 py-2 focus:border-amber-400 focus:outline-none"
            >
              {LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>{l.flag} {l.label}</option>
              ))}
            </select>
          </section>

          <section>
            <p className="text-xs font-semibold text-[#1A1A1A]/70 uppercase tracking-wider mb-1.5">Tone</p>
            <select
              value={selectedTone}
              onChange={(e) => setSelectedTone(e.target.value)}
              className="w-full bg-[#1A1A1A] border border-[#B89555]/30 text-white text-xs rounded-lg px-2 py-2 focus:border-amber-400 focus:outline-none"
            >
              {TONES.map((t) => (
                <option key={t.id} value={t.id}>{t.icon} {t.label}</option>
              ))}
            </select>
          </section>
        </div>

        {/* ── DURATION ────────────────────────────────────────────────────── */}
        <section>
          <p className="text-xs font-semibold text-[#1A1A1A]/70 uppercase tracking-wider mb-1.5">Duration</p>
          <div className="flex gap-2">
            {DURATIONS.map((d) => (
              <button
                key={d.value}
                onClick={() => setSelectedDuration(d.value)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                  selectedDuration === d.value
                    ? "bg-amber-500 text-[#1A1A1A] border-amber-500"
                    : "bg-[#1A1A1A] text-[#1A1A1A]/70 border-[#B89555]/30 hover:border-[#B89555]/30"
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </section>

        {/* ── PROPERTY PROMPT ─────────────────────────────────────────────── */}
        <section>
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-xs font-semibold text-[#1A1A1A]/70 uppercase tracking-wider">
              Property Description
            </p>
            <VoiceInputButton
              onTranscript={handleVoiceTranscript}
              language={selectedLanguage}
              size="sm"
              variant="ghost"
              className="text-[#1A1A1A]/70 hover:text-white h-6 w-6 p-0"
            />
          </div>
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g. Stunning 3-bedroom villa in Dubai Hills Estate, private pool, panoramic skyline views, modern interiors, AED 4.5M..."
            rows={4}
            className="bg-[#1A1A1A] border-[#B89555]/30 text-white placeholder:text-[#1A1A1A]/70 text-xs resize-none focus:border-amber-400"
          />
          <p className="text-[10px] text-[#1A1A1A]/70 mt-1">
            Tip: Include bedrooms, location, price, key features, and selling points.
          </p>
        </section>

        {/* ── GENERATE BUTTON ─────────────────────────────────────────────── */}
        <Button
          onClick={handleGenerate}
          disabled={isGenerating || !prompt.trim()}
          className="w-full bg-amber-500 hover:bg-amber-400 text-[#1A1A1A] font-bold gap-2"
        >
          {isGenerating ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Generating narration…</>
          ) : (
            <><Wand2 className="w-4 h-4" /> Generate with {selectedCharacter.name}</>
          )}
        </Button>

        {/* ── GENERATING SKELETON ─────────────────────────────────────────── */}
        {isGenerating && (
          <div className="rounded-xl border border-[#1A1A1A] bg-[#1A1A1A]/60 p-4 flex flex-col items-center gap-3">
            <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${selectedCharacter.color} flex items-center justify-center text-2xl animate-pulse`}>
              {selectedCharacter.avatar}
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-white">
                {selectedCharacter.name} is preparing…
              </p>
              <p className="text-xs text-[#1A1A1A]/70 mt-0.5">Writing script</p>
            </div>
            <div className="flex items-center gap-1 h-5">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="w-1 bg-amber-400/70 rounded-full animate-bounce"
                  style={{ height: `${8 + Math.sin(i) * 8}px`, animationDelay: `${i * 0.1}s` }} />
              ))}
            </div>
          </div>
        )}

        {/* ── RESULT CARD ─────────────────────────────────────────────────── */}
        {narration && !isGenerating && (
          <div className="rounded-xl border border-amber-500/30 bg-[#1A1A1A]/80 overflow-hidden">
            {/* Header */}
            <div className={`p-3 bg-gradient-to-r ${selectedCharacter.color} opacity-90 flex items-center gap-3`}>
              <div className="w-12 h-12 rounded-full bg-[#FDFBF7]/20 flex items-center justify-center text-2xl shadow-lg flex-shrink-0">
                {selectedCharacter.avatar}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white">{narration.character}</p>
                <p className="text-xs text-white/80">~{narration.duration}s · {narration.wordCount} words</p>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <button onClick={handlePlayPause}
                  disabled={voiceEngine === "premium" && !premiumAudioUrl}
                  className="w-9 h-9 rounded-full bg-[#FDFBF7]/20 hover:bg-[#FDFBF7]/30 flex items-center justify-center transition-all disabled:opacity-40">
                  {isPlaying
                    ? <Pause className="w-4 h-4 text-white" />
                    : <Play className="w-4 h-4 text-white ml-0.5" />}
                </button>
                <button onClick={handleDownload}
                  className="w-8 h-8 rounded-full bg-[#FDFBF7]/10 hover:bg-[#FDFBF7]/20 flex items-center justify-center transition-all">
                  <Download className="w-3.5 h-3.5 text-white" />
                </button>
              </div>
            </div>

            {/* Premium voice generation button */}
            {voiceEngine === "premium" && !premiumAudioUrl && (
              <div className="p-3 border-b border-[#1A1A1A]/50">
                <Button
                  onClick={handleGeneratePremiumVoice}
                  disabled={isPremiumGenerating}
                  size="sm"
                  className="w-full bg-purple-600 hover:bg-purple-500 text-white gap-1.5 text-xs"
                >
                  {isPremiumGenerating ? (
                    <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Generating premium voice…</>
                  ) : (
                    <><Sparkles className="w-3.5 h-3.5" /> Generate {selectedCharacter.name}'s Premium Voice</>
                  )}
                </Button>
              </div>
            )}

            {premiumAudioUrl && voiceEngine === "premium" && (
              <div className="px-3 pt-2">
                <div className="flex items-center gap-1.5 text-[10px] text-purple-300 font-medium">
                  <Sparkles className="w-3 h-3" /> Premium ElevenLabs voice ready
                </div>
              </div>
            )}

            {/* Script + timeline */}
            <div className="p-3 border-t border-[#1A1A1A]/50 space-y-2">
              <button onClick={() => setShowScript((s) => !s)}
                className="text-xs text-[#1A1A1A] hover:text-amber-300 font-medium flex items-center gap-1">
                {showScript ? "Hide script ▲" : "Show script ▼"}
              </button>

              {showScript && (
                <div className="bg-[#1A1A1A]/60 rounded-lg p-3 text-xs text-[#1A1A1A]/70 leading-relaxed max-h-40 overflow-y-auto">
                  {narration.script}
                </div>
              )}

              {isPlaying && (
                <div className="flex items-center gap-0.5 h-6">
                  {Array.from({ length: 24 }).map((_, i) => (
                    <div key={i} className="flex-1 bg-amber-400 rounded-full animate-pulse"
                      style={{ height: `${14 + Math.sin(i * 0.7) * 10}px`, animationDelay: `${i * 0.05}s`, animationDuration: `${0.5 + (i % 3) * 0.2}s` }} />
                  ))}
                </div>
              )}

              {(onAddToTimeline || onAIVoiceGenerated) && (
                <Button onClick={handleAddToTimeline} size="sm"
                  className="w-full bg-[#EFE6D6] hover:bg-[#F7F2EA] text-[#1A1A1A] gap-1.5 text-xs">
                  <Plus className="w-3.5 h-3.5" />
                  Add Narration to Timeline
                </Button>
              )}
            </div>
          </div>
        )}

      </div>
    </ScrollArea>
  );
}
