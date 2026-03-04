/**
 * Browser-native Text-to-Speech engine using Web Speech API.
 * Zero cost — no API keys, no credits, fully client-side.
 */

export interface BrowserVoice {
  id: string;
  name: string;
  gender: "male" | "female" | "neutral";
  accent: string;
  tag: string;
  /** Pitch multiplier (default 1.0) */
  pitch: number;
  /** Rate multiplier (default 0.9) */
  rate: number;
}

/**
 * Curated voice personas mapped to Web Speech API voices by gender/language.
 * The actual SpeechSynthesisVoice is resolved at runtime from the browser.
 */
export const BROWSER_VOICE_LIBRARY: BrowserVoice[] = [
  { id: "roger",   name: "Roger",   gender: "male",    accent: "British",      tag: "Professional", pitch: 0.9,  rate: 0.9 },
  { id: "sarah",   name: "Sarah",   gender: "female",  accent: "American",     tag: "Warm",         pitch: 1.05, rate: 0.9 },
  { id: "george",  name: "George",  gender: "male",    accent: "British",      tag: "Authoritative",pitch: 0.8,  rate: 0.85 },
  { id: "laura",   name: "Laura",   gender: "female",  accent: "American",     tag: "Natural",      pitch: 1.0,  rate: 0.92 },
  { id: "charlie", name: "Charlie", gender: "male",    accent: "Australian",   tag: "Casual",       pitch: 0.95, rate: 0.95 },
  { id: "lily",    name: "Lily",    gender: "female",  accent: "British",      tag: "Elegant",      pitch: 1.1,  rate: 0.88 },
  { id: "liam",    name: "Liam",    gender: "male",    accent: "American",     tag: "Dynamic",      pitch: 0.92, rate: 1.0 },
  { id: "matilda", name: "Matilda", gender: "female",  accent: "Australian",   tag: "Cheerful",     pitch: 1.08, rate: 0.95 },
  { id: "brian",   name: "Brian",   gender: "male",    accent: "American",     tag: "Deep",         pitch: 0.75, rate: 0.85 },
  { id: "jessica", name: "Jessica", gender: "female",  accent: "American",     tag: "Clear",        pitch: 1.02, rate: 0.9 },
  { id: "callum",  name: "Callum",  gender: "male",    accent: "Transatlantic",tag: "Intense",      pitch: 0.88, rate: 0.88 },
  { id: "river",   name: "River",   gender: "neutral", accent: "American",     tag: "Calm",         pitch: 1.0,  rate: 0.82 },
];

/** Find the best matching browser SpeechSynthesisVoice for a persona */
function findBestVoice(persona: BrowserVoice, lang: string): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices();
  if (voices.length === 0) return null;

  // Try to find a voice matching the language
  const langVoices = voices.filter(v => v.lang.startsWith(lang) || v.lang.startsWith(lang.split("-")[0]));
  const pool = langVoices.length > 0 ? langVoices : voices.filter(v => v.lang.startsWith("en"));

  if (pool.length === 0) return voices[0];

  // Prefer voices that hint at matching gender via name heuristics
  const femaleNames = ["samantha", "victoria", "karen", "moira", "tessa", "fiona", "female", "woman"];
  const maleNames = ["daniel", "james", "alex", "fred", "tom", "male", "man"];

  if (persona.gender === "female") {
    const match = pool.find(v => femaleNames.some(n => v.name.toLowerCase().includes(n)));
    if (match) return match;
  } else if (persona.gender === "male") {
    const match = pool.find(v => maleNames.some(n => v.name.toLowerCase().includes(n)));
    if (match) return match;
  }

  // Fallback: pick a voice with some variety based on persona index
  const idx = BROWSER_VOICE_LIBRARY.findIndex(v => v.id === persona.id);
  return pool[idx % pool.length] || pool[0];
}

/** Ensure voices are loaded (some browsers load them async) */
export function ensureVoicesLoaded(): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      resolve(voices);
      return;
    }
    window.speechSynthesis.onvoiceschanged = () => {
      resolve(window.speechSynthesis.getVoices());
    };
    // Fallback timeout
    setTimeout(() => resolve(window.speechSynthesis.getVoices()), 1000);
  });
}

export interface SpeakOptions {
  text: string;
  voiceId: string;
  lang?: string;
  rate?: number;
  pitch?: number;
  onEnd?: () => void;
  onError?: (err: Error) => void;
}

/** Speak text using Web Speech API */
export function speak(opts: SpeakOptions): SpeechSynthesisUtterance {
  window.speechSynthesis.cancel();

  const persona = BROWSER_VOICE_LIBRARY.find(v => v.id === opts.voiceId) || BROWSER_VOICE_LIBRARY[0];
  const utterance = new SpeechSynthesisUtterance(opts.text);

  const voice = findBestVoice(persona, opts.lang || "en");
  if (voice) utterance.voice = voice;

  utterance.lang = opts.lang || "en";
  utterance.rate = opts.rate ?? persona.rate;
  utterance.pitch = opts.pitch ?? persona.pitch;

  utterance.onend = () => opts.onEnd?.();
  utterance.onerror = (e) => opts.onError?.(new Error(e.error));

  window.speechSynthesis.speak(utterance);
  return utterance;
}

/** Stop any current speech */
export function stopSpeaking() {
  window.speechSynthesis.cancel();
}

/** Pause current speech */
export function pauseSpeaking() {
  window.speechSynthesis.pause();
}

/** Resume paused speech */
export function resumeSpeaking() {
  window.speechSynthesis.resume();
}

/**
 * Record Web Speech API output using AudioContext + MediaRecorder.
 * NOTE: This is a best-effort approach. In most browsers, SpeechSynthesis audio
 * goes directly to speakers and cannot be captured programmatically.
 * This function synthesizes speech and returns the script as a downloadable text file instead.
 */
export function downloadScriptAsText(script: string, voiceName: string): void {
  const content = `Voice Studio Script\n${"=".repeat(40)}\nVoice: ${voiceName}\nDate: ${new Date().toLocaleDateString()}\n${"=".repeat(40)}\n\n${script}`;
  const blob = new Blob([content], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `voice_script_${Date.now()}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

/** Estimate duration in seconds from text */
export function estimateDuration(text: string, rate = 0.9): number {
  const words = text.trim().split(/\s+/).length;
  // Average speaking rate ~150 words/min, adjusted by rate multiplier
  return Math.ceil((words / (150 * rate)) * 60);
}
