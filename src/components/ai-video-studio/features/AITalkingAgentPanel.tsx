import React, { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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
  Mic,
  Square,
  Upload,
  Trash2,
  Sparkles,
  ShieldCheck,
  AlertCircle,
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

const MY_VOICE_CHARACTER: Character = {
  id: "my_voice",
  name: "My Voice",
  title: "Your Cloned Voice",
  avatar: "🎤",
  gender: "neutral",
  style: "Your authentic voice",
  color: "from-gold to-amber-600",
};

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

// ─── Storage key ──────────────────────────────────────────────────────────────
const CLONED_VOICE_STORAGE_KEY = "jbj_cloned_voice_id";
const CLONED_VOICE_NAME_KEY    = "jbj_cloned_voice_name";

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
  // ── Narration state ────────────────────────────────────────────────────────
  const [selectedCharacter, setSelectedCharacter] = useState<Character>(CHARACTERS[0]);
  const [selectedLanguage, setSelectedLanguage]   = useState("en");
  const [selectedTone, setSelectedTone]           = useState("professional");
  const [selectedDuration, setSelectedDuration]   = useState(45);
  const [prompt, setPrompt]                       = useState("");
  const [isGenerating, setIsGenerating]           = useState(false);
  const [narration, setNarration]                 = useState<GeneratedNarration | null>(null);
  const [isPlaying, setIsPlaying]                 = useState(false);
  const [showScript, setShowScript]               = useState(false);

  // ── Cloned voice state ─────────────────────────────────────────────────────
  const [clonedVoiceId, setClonedVoiceId]         = useState<string | null>(() => localStorage.getItem(CLONED_VOICE_STORAGE_KEY));
  const [clonedVoiceName, setClonedVoiceName]     = useState<string>(() => localStorage.getItem(CLONED_VOICE_NAME_KEY) || "My Voice");
  const [useMyVoice, setUseMyVoice]               = useState(false);

  // ── Clone recording/upload state ───────────────────────────────────────────
  const [isRecordingClone, setIsRecordingClone]   = useState(false);
  const [cloneSampleBlob, setCloneSampleBlob]     = useState<Blob | null>(null);
  const [cloneSampleUrl, setCloneSampleUrl]       = useState<string | null>(null);
  const [cloneRecDuration, setCloneRecDuration]   = useState(0);
  const [isCloningVoice, setIsCloningVoice]       = useState(false);
  const [cloneVoiceName, setCloneVoiceName]       = useState("My Voice");

  // ── Refs ───────────────────────────────────────────────────────────────────
  const utteranceRef        = useRef<SpeechSynthesisUtterance | null>(null);
  const cloneMediaRecRef    = useRef<MediaRecorder | null>(null);
  const cloneChunksRef      = useRef<Blob[]>([]);
  const cloneTimerRef       = useRef<number>();
  const cloneStartRef       = useRef<number>(0);
  const fileInputRef        = useRef<HTMLInputElement>(null);
  const ttsAudioRef         = useRef<HTMLAudioElement | null>(null);

  // ── Sync "My Voice" character selection ───────────────────────────────────
  useEffect(() => {
    if (useMyVoice && clonedVoiceId) {
      setSelectedCharacter(MY_VOICE_CHARACTER);
    }
  }, [useMyVoice, clonedVoiceId]);

  // ── Generate narration script ─────────────────────────────────────────────
  const handleGenerate = useCallback(async () => {
    if (!prompt.trim()) {
      toast.error("Please describe the property first");
      return;
    }
    setIsGenerating(true);
    setNarration(null);
    setIsPlaying(false);
    window.speechSynthesis.cancel();

    try {
      const { data, error } = await supabase.functions.invoke("ai-talking-agent", {
        body: {
          prompt,
          character: useMyVoice && clonedVoiceId ? "sarah" : selectedCharacter.id,
          language: selectedLanguage,
          tone: selectedTone,
          duration: selectedDuration,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const characterLabel = useMyVoice && clonedVoiceId ? clonedVoiceName : data.character;
      setNarration({ script: data.script, duration: data.duration, wordCount: data.wordCount, character: characterLabel });
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
  }, [prompt, selectedCharacter, selectedLanguage, selectedTone, selectedDuration, useMyVoice, clonedVoiceId, clonedVoiceName]);

  // ── Playback — ElevenLabs TTS if cloned voice, else Web Speech ────────────
  const handlePlayPause = useCallback(async () => {
    if (!narration?.script) return;

    // Stop existing playback
    if (isPlaying) {
      if (ttsAudioRef.current) {
        ttsAudioRef.current.pause();
        ttsAudioRef.current = null;
      }
      window.speechSynthesis.pause();
      setIsPlaying(false);
      return;
    }

    setIsPlaying(true);

    if (useMyVoice && clonedVoiceId) {
      // ── ElevenLabs TTS with cloned voice ──────────────────────────────────
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;

        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/voice-studio-clone`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
              apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            },
            body: JSON.stringify({
              action: "tts_with_clone",
              voice_id: clonedVoiceId,
              text: narration.script,
              language_code: selectedLanguage,
              format: "mp3",
            }),
          }
        );

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(`TTS failed: ${response.status} - ${errText}`);
        }

        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        ttsAudioRef.current = audio;
        audio.onended = () => { setIsPlaying(false); URL.revokeObjectURL(audioUrl); };
        audio.onerror = () => { setIsPlaying(false); toast.error("Playback error"); };
        await audio.play();
      } catch (err: any) {
        console.error("ElevenLabs TTS error:", err);
        toast.error("Voice playback failed: " + err.message);
        setIsPlaying(false);
      }
    } else {
      // ── Web Speech API ────────────────────────────────────────────────────
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
    }
  }, [narration, isPlaying, selectedLanguage, selectedCharacter, useMyVoice, clonedVoiceId]);

  // ── Download ───────────────────────────────────────────────────────────────
  const handleDownload = useCallback(() => {
    if (!narration?.script) return;
    const utterance = new SpeechSynthesisUtterance(narration.script);
    utterance.lang = selectedLanguage;
    utterance.rate = 0.9;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
    toast.info("Playing narration — use your system audio recorder to capture it.");
  }, [narration, selectedLanguage]);

  // ── Add to timeline ────────────────────────────────────────────────────────
  const handleAddToTimeline = useCallback(async () => {
    if (!narration) return;

    if (useMyVoice && clonedVoiceId) {
      // Generate real audio blob via ElevenLabs and pass object URL
      toast.loading("Rendering your voice…", { id: "tts-render" });
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;

        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/voice-studio-clone`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
              apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            },
            body: JSON.stringify({
              action: "tts_with_clone",
              voice_id: clonedVoiceId,
              text: narration.script,
              language_code: selectedLanguage,
              format: "mp3",
            }),
          }
        );

        if (!response.ok) throw new Error(`TTS failed: ${response.status}`);

        const audioBlob = await response.blob();
        const audioUrl  = URL.createObjectURL(audioBlob);
        toast.dismiss("tts-render");
        onAddToTimeline?.(audioUrl, narration.duration, narration.script, narration.character);
        onAIVoiceGenerated?.(audioUrl, narration.duration);
        toast.success(`🎬 Your cloned voice narration added to timeline!`);
      } catch (err: any) {
        toast.dismiss("tts-render");
        toast.error("Failed to render voice: " + err.message);
      }
    } else {
      const syntheticUrl = `speech-synthesis://${encodeURIComponent(narration.script)}`;
      onAddToTimeline?.(syntheticUrl, narration.duration, narration.script, narration.character);
      onAIVoiceGenerated?.(syntheticUrl, narration.duration);
      toast.success(`🎬 ${narration.character}'s narration added to timeline!`);
    }
  }, [narration, onAddToTimeline, onAIVoiceGenerated, useMyVoice, clonedVoiceId, selectedLanguage]);

  // ── Voice transcript → prompt ──────────────────────────────────────────────
  const handleVoiceTranscript = useCallback((text: string) => {
    setPrompt(prev => (prev ? prev + " " + text : text));
  }, []);

  // ── Clone: start recording ─────────────────────────────────────────────────
  const startCloneRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/mp4";
      const mr = new MediaRecorder(stream, { mimeType });
      cloneMediaRecRef.current = mr;
      cloneChunksRef.current = [];

      mr.ondataavailable = (e) => { if (e.data.size > 0) cloneChunksRef.current.push(e.data); };
      mr.onstop = () => {
        const blob = new Blob(cloneChunksRef.current, { type: mimeType });
        setCloneSampleBlob(blob);
        setCloneSampleUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach(t => t.stop());
      };

      mr.start(100);
      setIsRecordingClone(true);
      cloneStartRef.current = Date.now();
      cloneTimerRef.current = window.setInterval(() => {
        setCloneRecDuration((Date.now() - cloneStartRef.current) / 1000);
      }, 100);
    } catch {
      toast.error("Microphone access denied. Please check browser permissions.");
    }
  }, []);

  // ── Clone: stop recording ──────────────────────────────────────────────────
  const stopCloneRecording = useCallback(() => {
    cloneMediaRecRef.current?.stop();
    setIsRecordingClone(false);
    if (cloneTimerRef.current) clearInterval(cloneTimerRef.current);
  }, []);

  // ── Clone: upload file ─────────────────────────────────────────────────────
  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) {
      toast.error("File too large. Max 20MB.");
      return;
    }
    setCloneSampleBlob(file);
    setCloneSampleUrl(URL.createObjectURL(file));
    setCloneRecDuration(0);
    toast.success("Audio file loaded. Ready to clone.");
  }, []);

  // ── Clone: discard sample ──────────────────────────────────────────────────
  const discardSample = useCallback(() => {
    if (cloneSampleUrl) URL.revokeObjectURL(cloneSampleUrl);
    setCloneSampleBlob(null);
    setCloneSampleUrl(null);
    setCloneRecDuration(0);
  }, [cloneSampleUrl]);

  // ── Clone: send to ElevenLabs ──────────────────────────────────────────────
  const handleCloneVoice = useCallback(async () => {
    if (!cloneSampleBlob) {
      toast.error("Please record or upload a voice sample first.");
      return;
    }

    const durationSeconds = cloneRecDuration || 45;
    if (cloneRecDuration > 0 && cloneRecDuration < 20) {
      toast.error("Sample too short. Please record at least 20 seconds.");
      return;
    }

    setIsCloningVoice(true);
    toast.loading("Cloning your voice…", { id: "clone-toast" });

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const formData = new FormData();
      formData.append("action", "clone_voice");
      formData.append("voice_name", cloneVoiceName || "My Voice");
      formData.append("description", "Personal cloned voice for property narration");
      formData.append("files", cloneSampleBlob, "voice_sample.webm");

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/voice-studio-clone`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: formData,
        }
      );

      const result = await response.json();
      if (!response.ok || !result.voice_id) {
        throw new Error(result.error || "Cloning failed — no voice ID returned");
      }

      // Persist
      localStorage.setItem(CLONED_VOICE_STORAGE_KEY, result.voice_id);
      localStorage.setItem(CLONED_VOICE_NAME_KEY, cloneVoiceName || "My Voice");
      setClonedVoiceId(result.voice_id);
      setClonedVoiceName(cloneVoiceName || "My Voice");
      setUseMyVoice(true);
      setSelectedCharacter(MY_VOICE_CHARACTER);

      toast.dismiss("clone-toast");
      toast.success("✅ Voice cloned! Your voice is now set as narrator.");
      discardSample();
    } catch (err: any) {
      console.error("Voice clone error:", err);
      toast.dismiss("clone-toast");
      toast.error("Cloning failed: " + err.message);
    } finally {
      setIsCloningVoice(false);
    }
  }, [cloneSampleBlob, cloneRecDuration, cloneVoiceName, discardSample]);

  // ── Delete cloned voice ────────────────────────────────────────────────────
  const handleDeleteClone = useCallback(async () => {
    if (!clonedVoiceId) return;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      await supabase.functions.invoke("voice-studio-clone", {
        body: { action: "delete_clone", voice_id: clonedVoiceId },
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
    } catch { /* soft fail */ }
    localStorage.removeItem(CLONED_VOICE_STORAGE_KEY);
    localStorage.removeItem(CLONED_VOICE_NAME_KEY);
    setClonedVoiceId(null);
    setClonedVoiceName("My Voice");
    setUseMyVoice(false);
    setSelectedCharacter(CHARACTERS[0]);
    toast.success("Cloned voice removed.");
  }, [clonedVoiceId]);

  // ── Format time helper ─────────────────────────────────────────────────────
  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────
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
            <p className="text-xs text-slate-400">Pick a character or clone your own voice</p>
          </div>
        </div>

        {/* ═══════════════════ TABS: Characters / My Voice ═══════════════════ */}
        <Tabs value={useMyVoice && clonedVoiceId ? "my-voice" : "characters"} onValueChange={(v) => {
          if (v === "my-voice") { setUseMyVoice(true); if (clonedVoiceId) setSelectedCharacter(MY_VOICE_CHARACTER); }
          else { setUseMyVoice(false); setSelectedCharacter(CHARACTERS[0]); }
        }}>
          <TabsList className="w-full bg-slate-800 border border-slate-700 h-8 p-0.5">
            <TabsTrigger value="characters" className="flex-1 h-7 text-xs data-[state=active]:bg-slate-700 data-[state=active]:text-white text-slate-400">
              <User className="w-3 h-3 mr-1" /> Characters
            </TabsTrigger>
            <TabsTrigger value="my-voice" className="flex-1 h-7 text-xs data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-300 text-slate-400">
              <Mic className="w-3 h-3 mr-1" /> My Voice {clonedVoiceId && <ShieldCheck className="w-3 h-3 ml-1 text-green-400" />}
            </TabsTrigger>
          </TabsList>

          {/* ── Characters tab ─────────────────────────────────────────────── */}
          <TabsContent value="characters" className="mt-3">
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
            <div className="mt-2 p-2.5 rounded-lg border border-slate-700 bg-slate-800/60">
              <p className="text-xs text-white font-medium">{selectedCharacter.name} · {selectedCharacter.title}</p>
              <p className="text-[10px] text-slate-400">{selectedCharacter.style}</p>
            </div>
          </TabsContent>

          {/* ── My Voice tab ─────────────────────────────────────────────────── */}
          <TabsContent value="my-voice" className="mt-3 space-y-4">

            {/* Active clone badge */}
            {clonedVoiceId && (
              <div className="flex items-center gap-3 p-3 rounded-xl border border-green-500/30 bg-green-500/10">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center text-xl flex-shrink-0">
                  🎤
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-green-300 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> Voice Cloned
                  </p>
                  <p className="text-sm font-semibold text-white truncate">{clonedVoiceName}</p>
                  <p className="text-[10px] text-slate-400">Ready for ElevenLabs TTS narration</p>
                </div>
                <button
                  onClick={handleDeleteClone}
                  className="text-red-400 hover:text-red-300 p-1 rounded transition-colors flex-shrink-0"
                  title="Remove cloned voice"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Clone a new voice */}
            <div className="space-y-3">
              <p className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                {clonedVoiceId ? "Replace Voice Clone" : "Clone Your Voice"}
              </p>

              {/* Voice name */}
              <div>
                <label className="text-[10px] text-slate-400 mb-1 block">Voice name</label>
                <input
                  value={cloneVoiceName}
                  onChange={(e) => setCloneVoiceName(e.target.value)}
                  placeholder="e.g. Jane's Voice"
                  className="w-full bg-slate-800 border border-slate-600 text-white text-xs rounded-lg px-3 py-2 focus:border-amber-400 focus:outline-none"
                />
              </div>

              {/* Tips */}
              <div className="p-2.5 rounded-lg bg-slate-800/80 border border-slate-700 text-[10px] text-slate-400 space-y-1">
                <p className="font-semibold text-slate-300 text-xs">📋 Recording tips for best quality:</p>
                <p>• Record for <strong className="text-white">30–60 seconds</strong> in a quiet room</p>
                <p>• Speak naturally at your normal pace</p>
                <p>• Read a property description aloud — same context as your final output</p>
                <p>• Use a high-quality mic or a modern smartphone</p>
              </div>

              {/* Record sample */}
              {!cloneSampleBlob && (
                <div className="space-y-2">
                  {!isRecordingClone ? (
                    <Button
                      onClick={startCloneRecording}
                      className="w-full bg-red-500 hover:bg-red-600 text-white gap-2 font-bold"
                    >
                      <Mic className="w-4 h-4" /> Start Recording Sample
                    </Button>
                  ) : (
                    <div className="flex flex-col items-center gap-3 p-4 rounded-xl border border-red-500/40 bg-red-500/10">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                        <span className="text-red-400 font-mono font-bold">{fmt(cloneRecDuration)}</span>
                        <span className="text-xs text-slate-400">recording…</span>
                      </div>
                      {/* Waveform */}
                      <div className="flex items-center gap-0.5 h-6">
                        {Array.from({ length: 20 }).map((_, i) => (
                          <div key={i} className="flex-1 bg-red-400 rounded-full animate-bounce"
                            style={{ height: `${6 + Math.sin(i * 0.8) * 10}px`, animationDelay: `${i * 0.07}s` }} />
                        ))}
                      </div>
                      <Button
                        onClick={stopCloneRecording}
                        size="sm"
                        className="bg-slate-700 hover:bg-slate-600 text-white gap-1.5"
                      >
                        <Square className="w-3.5 h-3.5" /> Stop Recording
                      </Button>
                      {cloneRecDuration < 20 && cloneRecDuration > 0 && (
                        <p className="text-[10px] text-amber-400 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> Need {Math.ceil(20 - cloneRecDuration)}s more for best quality
                        </p>
                      )}
                    </div>
                  )}

                  {/* Divider */}
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-px bg-slate-700" />
                    <span className="text-[10px] text-slate-500 uppercase">or upload</span>
                    <div className="flex-1 h-px bg-slate-700" />
                  </div>

                  {/* Upload */}
                  <input ref={fileInputRef} type="file" accept="audio/*" className="hidden" onChange={handleFileUpload} />
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full border-slate-600 text-slate-300 hover:text-white hover:border-slate-400 gap-2 text-xs"
                  >
                    <Upload className="w-4 h-4" /> Upload Audio File (.mp3, .wav, .m4a…)
                  </Button>
                </div>
              )}

              {/* Sample preview + clone button */}
              {cloneSampleBlob && (
                <div className="space-y-3">
                  <div className="p-3 rounded-xl border border-amber-500/30 bg-slate-800/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-amber-300 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {cloneRecDuration > 0 ? `Sample recorded (${fmt(cloneRecDuration)})` : "File uploaded"}
                      </p>
                      <button onClick={discardSample} className="text-red-400 hover:text-red-300 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    {cloneSampleUrl && (
                      <audio src={cloneSampleUrl} controls className="w-full h-8" style={{ filter: "invert(0.8) sepia(0.5) hue-rotate(180deg)" }} />
                    )}
                  </div>

                  <Button
                    onClick={handleCloneVoice}
                    disabled={isCloningVoice}
                    className="w-full bg-amber-500 hover:bg-amber-400 text-black font-bold gap-2"
                  >
                    {isCloningVoice ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Cloning voice…</>
                    ) : (
                      <><Sparkles className="w-4 h-4" /> Clone My Voice</>
                    )}
                  </Button>

                  <p className="text-[10px] text-slate-500 text-center">
                    Powered by ElevenLabs Instant Voice Clone · Credits may apply
                  </p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

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

        {/* ── DURATION ────────────────────────────────────────────────────── */}
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

        {/* ── NARRATOR BADGE ──────────────────────────────────────────────── */}
        {useMyVoice && clonedVoiceId && (
          <div className="flex items-center gap-2 p-2 rounded-lg border border-amber-500/30 bg-amber-500/10">
            <span className="text-lg">🎤</span>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-amber-300">Narrator: {clonedVoiceName}</p>
              <p className="text-[10px] text-slate-400">ElevenLabs cloned voice · Real audio output</p>
            </div>
          </div>
        )}

        {/* ── GENERATE BUTTON ─────────────────────────────────────────────── */}
        <Button
          onClick={handleGenerate}
          disabled={isGenerating || !prompt.trim()}
          className="w-full bg-amber-500 hover:bg-amber-400 text-black font-bold gap-2"
        >
          {isGenerating ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Generating narration…</>
          ) : (
            <><Wand2 className="w-4 h-4" />
              {useMyVoice && clonedVoiceId
                ? `Generate with ${clonedVoiceName}`
                : `Generate with ${selectedCharacter.name}`}
            </>
          )}
        </Button>

        {/* ── GENERATING SKELETON ─────────────────────────────────────────── */}
        {isGenerating && (
          <div className="rounded-xl border border-slate-700 bg-slate-800/60 p-4 flex flex-col items-center gap-3">
            <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${useMyVoice && clonedVoiceId ? "from-amber-500 to-yellow-600" : selectedCharacter.color} flex items-center justify-center text-2xl animate-pulse`}>
              {useMyVoice && clonedVoiceId ? "🎤" : selectedCharacter.avatar}
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-white">
                {useMyVoice && clonedVoiceId ? clonedVoiceName : selectedCharacter.name} is preparing…
              </p>
              <p className="text-xs text-slate-400 mt-0.5">Writing script & generating voice</p>
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
          <div className="rounded-xl border border-amber-500/30 bg-slate-800/80 overflow-hidden">
            {/* Header */}
            <div className={`p-3 bg-gradient-to-r ${useMyVoice && clonedVoiceId ? "from-amber-600 to-yellow-700" : selectedCharacter.color} opacity-90 flex items-center gap-3`}>
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-2xl shadow-lg flex-shrink-0">
                {useMyVoice && clonedVoiceId ? "🎤" : selectedCharacter.avatar}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white">{narration.character}</p>
                <p className="text-xs text-white/80">~{narration.duration}s · {narration.wordCount} words
                  {useMyVoice && clonedVoiceId && <span className="ml-1.5 text-green-300">· ElevenLabs TTS</span>}
                </p>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <button onClick={handlePlayPause}
                  className="w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-all">
                  {isPlaying
                    ? <Pause className="w-4 h-4 text-white" />
                    : <Play className="w-4 h-4 text-white ml-0.5" />}
                </button>
                <button onClick={handleDownload}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all">
                  <Download className="w-3.5 h-3.5 text-white" />
                </button>
              </div>
            </div>

            {/* Script + timeline */}
            <div className="p-3 border-t border-slate-700/50 space-y-2">
              <button onClick={() => setShowScript((s) => !s)}
                className="text-xs text-amber-400 hover:text-amber-300 font-medium flex items-center gap-1">
                {showScript ? "Hide script ▲" : "Show script ▼"}
              </button>

              {showScript && (
                <div className="bg-slate-900/60 rounded-lg p-3 text-xs text-slate-300 leading-relaxed max-h-40 overflow-y-auto">
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
                  className="w-full bg-slate-700 hover:bg-slate-600 text-white gap-1.5 text-xs">
                  <Plus className="w-3.5 h-3.5" />
                  {useMyVoice && clonedVoiceId ? "Render & Add My Voice to Timeline" : "Add Narration to Timeline"}
                </Button>
              )}
            </div>
          </div>
        )}

      </div>
    </ScrollArea>
  );
}
