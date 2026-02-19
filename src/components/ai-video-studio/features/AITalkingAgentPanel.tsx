import React, { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { VoiceInputButton } from "@/components/ui/VoiceInputButton";
import {
  Loader2,
  Play,
  Pause,
  Download,
  Plus,
  Wand2,
  User,
  Globe,
  Mic2,
  CheckCircle2,
} from "lucide-react";

// ─── Character definitions ──────────────────────────────────────────────────

interface Character {
  id: string;
  name: string;
  title: string;
  avatar: string;
  gender: "male" | "female" | "neutral";
  style: string;
  color: string;
}

const CHARACTERS: Character[] = [
  { id: "sarah",   name: "Sarah",   title: "Luxury Specialist",  avatar: "👩‍💼", gender: "female",  style: "Professional & friendly",   color: "from-rose-500 to-pink-600"     },
  { id: "george",  name: "George",  title: "Senior Advisor",     avatar: "👨‍💼", gender: "male",    style: "Warm & experienced",         color: "from-blue-500 to-indigo-600"   },
  { id: "laura",   name: "Laura",   title: "Premium Agent",      avatar: "👩‍🦰", gender: "female",  style: "Luxury & sophisticated",     color: "from-purple-500 to-violet-600" },
  { id: "alex",    name: "Alex",    title: "Investment Expert",  avatar: "🧑‍💻", gender: "male",    style: "Confident & authoritative",  color: "from-emerald-500 to-teal-600"  },
  { id: "alice",   name: "Alice",   title: "Modern Broker",      avatar: "👩‍🦱", gender: "female",  style: "Energetic & modern",         color: "from-amber-500 to-orange-600"  },
  { id: "river",   name: "River",   title: "Prestige Narrator",  avatar: "🧑‍🎤", gender: "neutral", style: "Elegant & premium",          color: "from-slate-400 to-gray-600"    },
  { id: "brian",   name: "Brian",   title: "Market Analyst",     avatar: "👨‍🦳", gender: "male",    style: "Deep & trustworthy",         color: "from-cyan-500 to-sky-600"      },
  { id: "matilda", name: "Matilda", title: "Community Expert",   avatar: "👩‍🦳", gender: "female",  style: "Warm & inviting",            color: "from-lime-500 to-green-600"    },
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
  audioBase64: string;
  audioMimeType: string;
  duration: number;
  wordCount: number;
  character: string;
  voiceId: string;
  blobUrl: string;
}

interface AITalkingAgentPanelProps {
  onAddToTimeline?: (audioUrl: string, duration: number, script: string, characterName: string) => void;
  /** Legacy compat — called when voice is generated (same as onAddToTimeline without script) */
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

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // ── Generate narration ──────────────────────────────────────────────────
  const handleGenerate = useCallback(async () => {
    if (!prompt.trim()) {
      toast.error("Please describe the property first");
      return;
    }
    setIsGenerating(true);
    setNarration(null);
    setIsPlaying(false);
    if (audioRef.current) audioRef.current.pause();

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

      // Decode base64 audio → blob URL
      const byteString = atob(data.audioBase64);
      const bytes = new Uint8Array(byteString.length);
      for (let i = 0; i < byteString.length; i++) bytes[i] = byteString.charCodeAt(i);
      const blob = new Blob([bytes], { type: data.audioMimeType || "audio/mpeg" });
      const blobUrl = URL.createObjectURL(blob);

      setNarration({ ...data, blobUrl });
      toast.success(`🎙️ ${selectedCharacter.name}'s narration is ready!`);
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

  // ── Playback ────────────────────────────────────────────────────────────
  const handlePlayPause = useCallback(() => {
    if (!narration?.blobUrl) return;
    if (!audioRef.current || audioRef.current.src !== narration.blobUrl) {
      if (audioRef.current) audioRef.current.pause();
      audioRef.current = new Audio(narration.blobUrl);
      audioRef.current.onended = () => setIsPlaying(false);
    }
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  }, [narration, isPlaying]);

  // ── Download ────────────────────────────────────────────────────────────
  const handleDownload = useCallback(() => {
    if (!narration?.blobUrl) return;
    const a = document.createElement("a");
    a.href = narration.blobUrl;
    a.download = `${selectedCharacter.name.toLowerCase()}-narration.mp3`;
    a.click();
  }, [narration, selectedCharacter]);

  // ── Add to timeline ─────────────────────────────────────────────────────
  const handleAddToTimeline = useCallback(() => {
    if (!narration?.blobUrl) return;
    onAddToTimeline?.(narration.blobUrl, narration.duration, narration.script, narration.character);
    onAIVoiceGenerated?.(narration.blobUrl, narration.duration);
    toast.success(`🎬 ${narration.character}'s narration added to timeline!`);
  }, [narration, onAddToTimeline, onAIVoiceGenerated]);

  // ── Voice transcript → prompt ───────────────────────────────────────────
  const handleVoiceTranscript = useCallback((text: string) => {
    setPrompt(prev => (prev ? prev + " " + text : text));
  }, []);

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-5">

        {/* Header */}
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-amber-500/20">
            <Mic2 className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">AI Talking Agent</h3>
            <p className="text-xs text-slate-400">Pick a character, describe the property, generate narration</p>
          </div>
        </div>

        {/* ── CHARACTER SELECTION ─────────────────────────────────────────── */}
        <section>
          <p className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <User className="w-3 h-3" /> Character
          </p>
          <div className="grid grid-cols-4 gap-2">
            {CHARACTERS.map((char) => (
              <button
                key={char.id}
                onClick={() => setSelectedCharacter(char)}
                className={`relative flex flex-col items-center gap-1 p-2 rounded-xl border transition-all text-center ${
                  selectedCharacter.id === char.id
                    ? "border-amber-400 bg-amber-500/10"
                    : "border-slate-700 bg-slate-800/60 hover:border-slate-500"
                }`}
              >
                {selectedCharacter.id === char.id && (
                  <CheckCircle2 className="absolute top-1 right-1 w-3 h-3 text-amber-400" />
                )}
                <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${char.color} flex items-center justify-center text-xl shadow-lg`}>
                  {char.avatar}
                </div>
                <p className="text-[10px] font-bold text-white leading-tight">{char.name}</p>
                <p className="text-[9px] text-slate-400 leading-tight">{char.title}</p>
              </button>
            ))}
          </div>

          {/* Selected character detail */}
          <div className={`mt-2 p-2.5 rounded-lg border border-slate-700 bg-slate-800/60`}>
            <p className="text-xs text-white font-medium">{selectedCharacter.name} · {selectedCharacter.title}</p>
            <p className="text-[10px] text-slate-400">{selectedCharacter.style}</p>
          </div>
        </section>

        {/* ── LANGUAGE + TONE ROW ─────────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-3">
          <section>
            <p className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <Globe className="w-3 h-3" /> Language
            </p>
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="w-full bg-slate-800 border border-slate-600 text-white text-xs rounded-lg px-2 py-2 focus:border-amber-400 focus:outline-none"
            >
              {LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>{l.flag} {l.label}</option>
              ))}
            </select>
          </section>

          <section>
            <p className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Tone</p>
            <select
              value={selectedTone}
              onChange={(e) => setSelectedTone(e.target.value)}
              className="w-full bg-slate-800 border border-slate-600 text-white text-xs rounded-lg px-2 py-2 focus:border-amber-400 focus:outline-none"
            >
              {TONES.map((t) => (
                <option key={t.id} value={t.id}>{t.icon} {t.label}</option>
              ))}
            </select>
          </section>
        </div>

        {/* ── DURATION ───────────────────────────────────────────────────── */}
        <section>
          <p className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Duration</p>
          <div className="flex gap-2">
            {DURATIONS.map((d) => (
              <button
                key={d.value}
                onClick={() => setSelectedDuration(d.value)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                  selectedDuration === d.value
                    ? "bg-amber-500 text-black border-amber-500"
                    : "bg-slate-800 text-slate-300 border-slate-600 hover:border-slate-400"
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
            <p className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Property Description
            </p>
            <VoiceInputButton
              onTranscript={handleVoiceTranscript}
              language={selectedLanguage}
              size="sm"
              variant="ghost"
              className="text-slate-400 hover:text-white h-6 w-6 p-0"
            />
          </div>
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g. Stunning 3-bedroom villa in Dubai Hills Estate, private pool, panoramic skyline views, modern interiors, AED 4.5M..."
            rows={4}
            className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-500 text-xs resize-none focus:border-amber-400"
          />
          <p className="text-[10px] text-slate-500 mt-1">
            Tip: Include bedrooms, location, price, key features, and selling points.
          </p>
        </section>

        {/* ── GENERATE BUTTON ─────────────────────────────────────────────── */}
        <Button
          onClick={handleGenerate}
          disabled={isGenerating || !prompt.trim()}
          className="w-full bg-amber-500 hover:bg-amber-400 text-black font-bold gap-2"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Generating {selectedCharacter.name}'s narration…
            </>
          ) : (
            <>
              <Wand2 className="w-4 h-4" />
              Generate AI Narration with {selectedCharacter.name}
            </>
          )}
        </Button>

        {/* ── GENERATING SKELETON ─────────────────────────────────────────── */}
        {isGenerating && (
          <div className="rounded-xl border border-slate-700 bg-slate-800/60 p-4 flex flex-col items-center gap-3">
            <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${selectedCharacter.color} flex items-center justify-center text-2xl animate-pulse`}>
              {selectedCharacter.avatar}
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-white">{selectedCharacter.name} is preparing…</p>
              <p className="text-xs text-slate-400 mt-0.5">Writing script & generating voice</p>
            </div>
            <div className="flex items-center gap-1 h-5">
              {Array.from({ length: 12 }).map((_, i) => (
                <div
                  key={i}
                  className="w-1 bg-amber-400/70 rounded-full animate-bounce"
                  style={{ height: `${8 + Math.sin(i) * 8}px`, animationDelay: `${i * 0.1}s` }}
                />
              ))}
            </div>
          </div>
        )}

        {/* ── RESULT ──────────────────────────────────────────────────────── */}
        {narration && !isGenerating && (
          <div className="rounded-xl border border-amber-500/30 bg-slate-800/80 overflow-hidden">
            {/* Character result header */}
            <div className={`p-3 bg-gradient-to-r ${selectedCharacter.color} opacity-90 flex items-center gap-3`}>
              <div className={`w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-2xl shadow-lg flex-shrink-0`}>
                {selectedCharacter.avatar}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white">{narration.character}</p>
                <p className="text-xs text-white/80">
                  ~{narration.duration}s · {narration.wordCount} words
                </p>
              </div>
              {/* Playback controls */}
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <button
                  onClick={handlePlayPause}
                  className="w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-all"
                >
                  {isPlaying
                    ? <Pause className="w-4 h-4 text-white" />
                    : <Play className="w-4 h-4 text-white ml-0.5" />
                  }
                </button>
                <button
                  onClick={handleDownload}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all"
                >
                  <Download className="w-3.5 h-3.5 text-white" />
                </button>
              </div>
            </div>

            {/* Script + timeline button */}
            <div className="p-3 border-t border-slate-700/50 space-y-2">
              <button
                onClick={() => setShowScript((s) => !s)}
                className="text-xs text-amber-400 hover:text-amber-300 font-medium flex items-center gap-1"
              >
                {showScript ? "Hide script ▲" : "Show script ▼"}
              </button>

              {showScript && (
                <div className="bg-slate-900/60 rounded-lg p-3 text-xs text-slate-300 leading-relaxed max-h-40 overflow-y-auto">
                  {narration.script}
                </div>
              )}

              {/* Waveform animation while playing */}
              {isPlaying && (
                <div className="flex items-center gap-0.5 h-6">
                  {Array.from({ length: 24 }).map((_, i) => (
                    <div
                      key={i}
                      className="flex-1 bg-amber-400 rounded-full animate-pulse"
                      style={{
                        height: `${14 + Math.sin(i * 0.7) * 10}px`,
                        animationDelay: `${i * 0.05}s`,
                        animationDuration: `${0.5 + (i % 3) * 0.2}s`,
                      }}
                    />
                  ))}
                </div>
              )}

              {(onAddToTimeline || onAIVoiceGenerated) && (
                <Button
                  onClick={handleAddToTimeline}
                  size="sm"
                  className="w-full bg-slate-700 hover:bg-slate-600 text-white gap-1.5 text-xs"
                >
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
