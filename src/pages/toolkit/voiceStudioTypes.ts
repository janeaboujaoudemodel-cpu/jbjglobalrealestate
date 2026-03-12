import {
  BROWSER_VOICE_LIBRARY,
} from "@/lib/browser-tts";

// ─── Types ──────────────────────────────────────────────────────────────────
export type VoiceMode = "library" | "enhance" | "clone";
export type OutputFormat = "mp3" | "wav";

export interface RecordedAudio {
  blob: Blob;
  url: string;
  duration: number;
}

// ─── Constants ──────────────────────────────────────────────────────────────
export const VOICE_LIBRARY = BROWSER_VOICE_LIBRARY.slice(0, 8).map((v) => ({
  id: v.id,
  name: v.name,
  gender: v.gender,
  accent: v.accent,
  description: v.tag,
}));

export const MAX_SCRIPT_LENGTH = 5000;

export const TONE_OPTIONS = [
  { id: "professional", label: "Professional", icon: "💼" },
  { id: "corporate", label: "Corporate", icon: "🏢" },
  { id: "warm", label: "Warm & Friendly", icon: "☀️" },
  { id: "energetic", label: "Energetic", icon: "⚡" },
  { id: "calm", label: "Calm", icon: "🌊" },
  { id: "storytelling", label: "Storytelling", icon: "📖" },
] as const;
