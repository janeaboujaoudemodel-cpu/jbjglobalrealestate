/**
 * Browser-native Text-to-Speech engine using Web Speech API.
 * Zero cost — no API keys, no credits, fully client-side.
 * 
 * Each persona has distinct pitch/rate settings and preferred language
 * mappings to create differentiated voice characteristics.
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
  /** Preferred language code for this persona's accent */
  preferredLang?: string;
  /** Age category for voice selection */
  ageGroup?: "young" | "middle" | "senior";
}

/**
 * Curated voice personas mapped to Web Speech API voices by gender/language.
 * The actual SpeechSynthesisVoice is resolved at runtime from the browser.
 * Each persona has unique pitch/rate to create distinct sound.
 */
export const BROWSER_VOICE_LIBRARY: BrowserVoice[] = [
  // English - British
  { id: "roger",   name: "Roger",   gender: "male",    accent: "British",      tag: "Professional", pitch: 0.85, rate: 0.88, preferredLang: "en-GB", ageGroup: "middle" },
  { id: "george",  name: "George",  gender: "male",    accent: "British",      tag: "Authoritative",pitch: 0.72, rate: 0.82, preferredLang: "en-GB", ageGroup: "senior" },
  { id: "lily",    name: "Lily",    gender: "female",  accent: "British",      tag: "Elegant",      pitch: 1.12, rate: 0.86, preferredLang: "en-GB", ageGroup: "young" },
  { id: "william", name: "William", gender: "male",    accent: "British",      tag: "Formal",       pitch: 0.78, rate: 0.84, preferredLang: "en-GB", ageGroup: "senior" },
  { id: "emma",    name: "Emma",    gender: "female",  accent: "British",      tag: "Warm",         pitch: 1.05, rate: 0.90, preferredLang: "en-GB", ageGroup: "middle" },
  // English - American
  { id: "sarah",   name: "Sarah",   gender: "female",  accent: "American",     tag: "Warm",         pitch: 1.08, rate: 0.92, preferredLang: "en-US", ageGroup: "middle" },
  { id: "laura",   name: "Laura",   gender: "female",  accent: "American",     tag: "Natural",      pitch: 1.00, rate: 0.90, preferredLang: "en-US", ageGroup: "middle" },
  { id: "liam",    name: "Liam",    gender: "male",    accent: "American",     tag: "Dynamic",      pitch: 0.92, rate: 1.00, preferredLang: "en-US", ageGroup: "young" },
  { id: "brian",   name: "Brian",   gender: "male",    accent: "American",     tag: "Deep",         pitch: 0.68, rate: 0.82, preferredLang: "en-US", ageGroup: "senior" },
  { id: "jessica", name: "Jessica", gender: "female",  accent: "American",     tag: "Clear",        pitch: 1.04, rate: 0.92, preferredLang: "en-US", ageGroup: "young" },
  // English - Australian
  { id: "charlie", name: "Charlie", gender: "male",    accent: "Australian",   tag: "Casual",       pitch: 0.95, rate: 0.96, preferredLang: "en-AU", ageGroup: "young" },
  { id: "matilda", name: "Matilda", gender: "female",  accent: "Australian",   tag: "Cheerful",     pitch: 1.10, rate: 0.96, preferredLang: "en-AU", ageGroup: "young" },
  // Neutral
  { id: "river",   name: "River",   gender: "neutral", accent: "American",     tag: "Calm",         pitch: 1.00, rate: 0.80, preferredLang: "en-US", ageGroup: "middle" },
  { id: "callum",  name: "Callum",  gender: "male",    accent: "Transatlantic",tag: "Intense",      pitch: 0.88, rate: 0.88, preferredLang: "en-US", ageGroup: "middle" },
];

// Track the current utterance for pause/resume
let currentUtterance: SpeechSynthesisUtterance | null = null;

/** Find the best matching browser SpeechSynthesisVoice for a persona */
function findBestVoice(persona: BrowserVoice, lang: string): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices();
  if (voices.length === 0) return null;

  // Use the persona's preferred language if the selected language matches the persona accent
  const effectiveLang = lang;

  // Try to find voices matching the target language
  const langVoices = voices.filter(v =>
    v.lang.startsWith(effectiveLang) || v.lang.startsWith(effectiveLang.split("-")[0])
  );
  const pool = langVoices.length > 0 ? langVoices : voices.filter(v => v.lang.startsWith("en"));

  if (pool.length === 0) return voices[0];

  // Gender matching keywords
  const femaleNames = ["samantha", "victoria", "karen", "moira", "tessa", "fiona", "female", "woman", "zira", "hazel", "susan", "linda"];
  const maleNames = ["daniel", "james", "alex", "fred", "tom", "male", "man", "david", "mark", "richard"];

  // Try gender match first
  if (persona.gender === "female") {
    const match = pool.find(v => femaleNames.some(n => v.name.toLowerCase().includes(n)));
    if (match) return match;
  } else if (persona.gender === "male") {
    const match = pool.find(v => maleNames.some(n => v.name.toLowerCase().includes(n)));
    if (match) return match;
  }

  // Use persona index to distribute across available voices for variety
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

/** Speak text using Web Speech API with persona-specific settings */
export function speak(opts: SpeakOptions): SpeechSynthesisUtterance {
  window.speechSynthesis.cancel();

  const persona = BROWSER_VOICE_LIBRARY.find(v => v.id === opts.voiceId) || BROWSER_VOICE_LIBRARY[0];
  const utterance = new SpeechSynthesisUtterance(opts.text);

  // Use selected language for voice matching
  const targetLang = opts.lang || persona.preferredLang || "en";
  const voice = findBestVoice(persona, targetLang);
  if (voice) utterance.voice = voice;

  // Set the language to the selected output language
  utterance.lang = targetLang;
  // Apply persona-specific pitch/rate for differentiation
  utterance.rate = opts.rate ?? persona.rate;
  utterance.pitch = opts.pitch ?? persona.pitch;

  utterance.onend = () => {
    currentUtterance = null;
    opts.onEnd?.();
  };
  utterance.onerror = (e) => {
    currentUtterance = null;
    opts.onError?.(new Error(e.error));
  };

  currentUtterance = utterance;
  window.speechSynthesis.speak(utterance);
  return utterance;
}

/** Stop any current speech completely */
export function stopSpeaking() {
  window.speechSynthesis.cancel();
  currentUtterance = null;
}

/** Pause current speech */
export function pauseSpeaking() {
  if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
    window.speechSynthesis.pause();
  }
}

/** Resume paused speech */
export function resumeSpeaking() {
  if (window.speechSynthesis.paused) {
    window.speechSynthesis.resume();
  }
}

/** Check if currently speaking */
export function isSpeakingNow(): boolean {
  return window.speechSynthesis.speaking;
}

/** Check if currently paused */
export function isPaused(): boolean {
  return window.speechSynthesis.paused;
}

/**
 * Download script as text file (Web Speech API audio cannot be captured).
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
  return Math.ceil((words / (150 * rate)) * 60);
}
