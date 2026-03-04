/**
 * Browser-native Text-to-Speech engine using Web Speech API.
 * Zero cost — no API keys, no credits, fully client-side.
 * 
 * Each persona has distinct pitch/rate settings and preferred language
 * mappings to create maximally differentiated voice characteristics.
 */

export interface BrowserVoice {
  id: string;
  name: string;
  gender: "male" | "female" | "neutral";
  accent: string;
  tag: string;
  pitch: number;
  rate: number;
  /** The language this persona natively speaks — used for preview & voice matching */
  nativeLang: string;
  ageGroup: "young" | "middle" | "senior";
}

/**
 * Full voice library. Every persona has unique pitch + rate + native language
 * so the browser picks a DIFFERENT underlying SpeechSynthesisVoice for each.
 */
export const BROWSER_VOICE_LIBRARY: BrowserVoice[] = [
  // ── English — British ─────────────────────────────────────────────────────
  { id: "roger",    name: "Roger",    gender: "male",    accent: "British",           tag: "Professional",  pitch: 0.85, rate: 0.88, nativeLang: "en-GB", ageGroup: "middle" },
  { id: "george",   name: "George",   gender: "male",    accent: "British",           tag: "Authoritative", pitch: 0.72, rate: 0.82, nativeLang: "en-GB", ageGroup: "senior" },
  { id: "lily",     name: "Lily",     gender: "female",  accent: "British",           tag: "Elegant",       pitch: 1.12, rate: 0.86, nativeLang: "en-GB", ageGroup: "young" },
  { id: "william",  name: "William",  gender: "male",    accent: "British",           tag: "Formal",        pitch: 0.78, rate: 0.84, nativeLang: "en-GB", ageGroup: "senior" },
  { id: "emma",     name: "Emma",     gender: "female",  accent: "British",           tag: "Warm",          pitch: 1.05, rate: 0.90, nativeLang: "en-GB", ageGroup: "middle" },
  { id: "harold",   name: "Harold",   gender: "male",    accent: "British",           tag: "Wise",          pitch: 0.65, rate: 0.78, nativeLang: "en-GB", ageGroup: "senior" },
  { id: "margaret", name: "Margaret", gender: "female",  accent: "British",           tag: "Distinguished", pitch: 0.92, rate: 0.80, nativeLang: "en-GB", ageGroup: "senior" },

  // ── English — American ────────────────────────────────────────────────────
  { id: "sarah",    name: "Sarah",    gender: "female",  accent: "American",          tag: "Warm",          pitch: 1.08, rate: 0.92, nativeLang: "en-US", ageGroup: "middle" },
  { id: "laura",    name: "Laura",    gender: "female",  accent: "American",          tag: "Natural",       pitch: 1.00, rate: 0.90, nativeLang: "en-US", ageGroup: "middle" },
  { id: "liam",     name: "Liam",     gender: "male",    accent: "American",          tag: "Dynamic",       pitch: 0.92, rate: 1.00, nativeLang: "en-US", ageGroup: "young" },
  { id: "brian",    name: "Brian",    gender: "male",    accent: "American",          tag: "Deep",          pitch: 0.68, rate: 0.82, nativeLang: "en-US", ageGroup: "senior" },
  { id: "jessica",  name: "Jessica",  gender: "female",  accent: "American",          tag: "Clear",         pitch: 1.04, rate: 0.92, nativeLang: "en-US", ageGroup: "young" },
  { id: "james_sr", name: "James Sr", gender: "male",    accent: "American",          tag: "Gravelly",      pitch: 0.62, rate: 0.76, nativeLang: "en-US", ageGroup: "senior" },
  { id: "zoe",      name: "Zoe",      gender: "female",  accent: "American",          tag: "Fresh",         pitch: 1.18, rate: 1.02, nativeLang: "en-US", ageGroup: "young" },
  { id: "ethan",    name: "Ethan",    gender: "male",    accent: "American",          tag: "Upbeat",        pitch: 1.02, rate: 1.04, nativeLang: "en-US", ageGroup: "young" },
  { id: "river",    name: "River",    gender: "neutral", accent: "American",          tag: "Calm",          pitch: 1.00, rate: 0.80, nativeLang: "en-US", ageGroup: "middle" },
  { id: "callum",   name: "Callum",   gender: "male",    accent: "Transatlantic",     tag: "Intense",       pitch: 0.88, rate: 0.88, nativeLang: "en-US", ageGroup: "middle" },

  // ── English — Australian ──────────────────────────────────────────────────
  { id: "charlie",  name: "Charlie",  gender: "male",    accent: "Australian",        tag: "Casual",        pitch: 0.95, rate: 0.96, nativeLang: "en-AU", ageGroup: "young" },
  { id: "matilda",  name: "Matilda",  gender: "female",  accent: "Australian",        tag: "Cheerful",      pitch: 1.10, rate: 0.96, nativeLang: "en-AU", ageGroup: "young" },

  // ── Arabic — Regional accents ─────────────────────────────────────────────
  { id: "omar",     name: "Omar",     gender: "male",    accent: "Arabic (Gulf)",     tag: "Rich",          pitch: 0.82, rate: 0.86, nativeLang: "ar-AE", ageGroup: "middle" },
  { id: "ahmed",    name: "Ahmed",    gender: "male",    accent: "Arabic (Egyptian)", tag: "Deep",          pitch: 0.70, rate: 0.84, nativeLang: "ar-EG", ageGroup: "senior" },
  { id: "fatima",   name: "Fatima",   gender: "female",  accent: "Arabic (Gulf)",     tag: "Elegant",       pitch: 1.06, rate: 0.88, nativeLang: "ar-AE", ageGroup: "middle" },
  { id: "nadia",    name: "Nadia",    gender: "female",  accent: "Arabic (Lebanese)", tag: "Smooth",        pitch: 1.14, rate: 0.92, nativeLang: "ar-LB", ageGroup: "young" },
  { id: "khalid",   name: "Khalid",   gender: "male",    accent: "Arabic (Saudi)",    tag: "Commanding",    pitch: 0.74, rate: 0.80, nativeLang: "ar-SA", ageGroup: "senior" },
  { id: "layla",    name: "Layla",    gender: "female",  accent: "Arabic (Syrian)",   tag: "Gentle",        pitch: 1.10, rate: 0.90, nativeLang: "ar-SY", ageGroup: "young" },
  { id: "youssef",  name: "Youssef",  gender: "male",    accent: "Arabic (Kuwaiti)",  tag: "Warm",          pitch: 0.88, rate: 0.88, nativeLang: "ar-KW", ageGroup: "middle" },

  // ── Hindi / Indian ────────────────────────────────────────────────────────
  { id: "aria",     name: "Aria",     gender: "female",  accent: "Indian",            tag: "Warm",          pitch: 1.08, rate: 0.90, nativeLang: "hi-IN", ageGroup: "young" },
  { id: "raj",      name: "Raj",      gender: "male",    accent: "Indian",            tag: "Professional",  pitch: 0.86, rate: 0.88, nativeLang: "hi-IN", ageGroup: "middle" },
  { id: "priya",    name: "Priya",    gender: "female",  accent: "Hindi",             tag: "Melodic",       pitch: 1.14, rate: 0.92, nativeLang: "hi-IN", ageGroup: "young" },

  // ── Spanish ───────────────────────────────────────────────────────────────
  { id: "elena",    name: "Elena",    gender: "female",  accent: "Spanish",           tag: "Vibrant",       pitch: 1.06, rate: 0.94, nativeLang: "es-ES", ageGroup: "middle" },
  { id: "diego",    name: "Diego",    gender: "male",    accent: "Spanish",           tag: "Energetic",     pitch: 0.90, rate: 1.00, nativeLang: "es-ES", ageGroup: "young" },

  // ── Italian ───────────────────────────────────────────────────────────────
  { id: "sofia",    name: "Sofia",    gender: "female",  accent: "Italian",           tag: "Expressive",    pitch: 1.08, rate: 0.92, nativeLang: "it-IT", ageGroup: "middle" },
  { id: "marco",    name: "Marco",    gender: "male",    accent: "Italian",           tag: "Charismatic",   pitch: 0.86, rate: 0.94, nativeLang: "it-IT", ageGroup: "young" },

  // ── French ────────────────────────────────────────────────────────────────
  { id: "pierre",   name: "Pierre",   gender: "male",    accent: "French",            tag: "Refined",       pitch: 0.80, rate: 0.86, nativeLang: "fr-FR", ageGroup: "senior" },
  { id: "isabelle", name: "Isabelle", gender: "female",  accent: "French",            tag: "Chic",          pitch: 1.12, rate: 0.90, nativeLang: "fr-FR", ageGroup: "young" },

  // ── German ────────────────────────────────────────────────────────────────
  { id: "hans",     name: "Hans",     gender: "male",    accent: "German",            tag: "Clear",         pitch: 0.84, rate: 0.88, nativeLang: "de-DE", ageGroup: "middle" },
  { id: "anna",     name: "Anna",     gender: "female",  accent: "German",            tag: "Precise",       pitch: 1.04, rate: 0.90, nativeLang: "de-DE", ageGroup: "middle" },

  // ── Russian ───────────────────────────────────────────────────────────────
  { id: "anya",     name: "Anya",     gender: "female",  accent: "Russian",           tag: "Authoritative", pitch: 1.02, rate: 0.86, nativeLang: "ru-RU", ageGroup: "middle" },
  { id: "dmitri",   name: "Dmitri",   gender: "male",    accent: "Russian",           tag: "Strong",        pitch: 0.72, rate: 0.82, nativeLang: "ru-RU", ageGroup: "senior" },

  // ── Japanese ──────────────────────────────────────────────────────────────
  { id: "yuki",     name: "Yuki",     gender: "female",  accent: "Japanese",          tag: "Soft",          pitch: 1.16, rate: 0.88, nativeLang: "ja-JP", ageGroup: "young" },
  { id: "kenji",    name: "Kenji",    gender: "male",    accent: "Japanese",          tag: "Focused",       pitch: 0.84, rate: 0.86, nativeLang: "ja-JP", ageGroup: "middle" },

  // ── Chinese ───────────────────────────────────────────────────────────────
  { id: "wei",      name: "Wei",      gender: "male",    accent: "Chinese",           tag: "Steady",        pitch: 0.86, rate: 0.86, nativeLang: "zh-CN", ageGroup: "middle" },
  { id: "mei",      name: "Mei",      gender: "female",  accent: "Chinese",           tag: "Bright",        pitch: 1.14, rate: 0.92, nativeLang: "zh-CN", ageGroup: "young" },

  // ── Korean ────────────────────────────────────────────────────────────────
  { id: "jin",      name: "Jin",      gender: "male",    accent: "Korean",            tag: "Calm",          pitch: 0.88, rate: 0.84, nativeLang: "ko-KR", ageGroup: "middle" },
  { id: "soo",      name: "Soo-Yeon", gender: "female",  accent: "Korean",            tag: "Lively",        pitch: 1.12, rate: 0.96, nativeLang: "ko-KR", ageGroup: "young" },

  // ── Portuguese ────────────────────────────────────────────────────────────
  { id: "carlos",   name: "Carlos",   gender: "male",    accent: "Portuguese",        tag: "Dynamic",       pitch: 0.90, rate: 0.92, nativeLang: "pt-BR", ageGroup: "middle" },

  // ── Turkish ───────────────────────────────────────────────────────────────
  { id: "amira",    name: "Amira",    gender: "female",  accent: "Turkish",           tag: "Smooth",        pitch: 1.08, rate: 0.90, nativeLang: "tr-TR", ageGroup: "young" },

  // ── Urdu ──────────────────────────────────────────────────────────────────
  { id: "noor",     name: "Noor",     gender: "female",  accent: "Urdu",              tag: "Gentle",        pitch: 1.06, rate: 0.88, nativeLang: "ur-PK", ageGroup: "middle" },
];

// ── Voice-ID lookup map for O(1) access ─────────────────────────────────────
const VOICE_MAP = new Map(BROWSER_VOICE_LIBRARY.map(v => [v.id, v]));

/** Get a persona by ID — works for ALL voices in the library */
export function getPersona(voiceId: string): BrowserVoice {
  return VOICE_MAP.get(voiceId) || BROWSER_VOICE_LIBRARY[0];
}

// Track the current utterance for pause/resume
let currentUtterance: SpeechSynthesisUtterance | null = null;

/**
 * Find the best matching browser SpeechSynthesisVoice for a persona.
 * Strategy:
 *   1. Match by exact language tag (e.g. "it-IT")
 *   2. Match by base language (e.g. "it")
 *   3. Fallback to any English voice
 *   4. Within the pool, prefer gender-matching voices
 *   5. Distribute remaining voices by persona index for maximum variety
 */
function findBestVoice(persona: BrowserVoice, lang: string): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices();
  if (voices.length === 0) return null;

  const baseLang = lang.split("-")[0];

  // 1. Exact match
  let pool = voices.filter(v => v.lang.toLowerCase() === lang.toLowerCase());
  // 2. Base language match
  if (pool.length === 0) {
    pool = voices.filter(v => v.lang.toLowerCase().startsWith(baseLang.toLowerCase()));
  }
  // 3. Fallback to English
  if (pool.length === 0) {
    pool = voices.filter(v => v.lang.startsWith("en"));
  }
  if (pool.length === 0) return voices[0];

  // 4. Gender preference keywords
  const femaleHints = ["female", "woman", "samantha", "victoria", "karen", "moira", "tessa", "fiona", "zira", "hazel", "susan", "linda", "alice", "ava", "allison"];
  const maleHints   = ["male", "man", "daniel", "james", "alex", "fred", "tom", "david", "mark", "richard", "lee", "oliver", "aaron"];

  const genderPool = pool.filter(v => {
    const n = v.name.toLowerCase();
    if (persona.gender === "female") return femaleHints.some(h => n.includes(h));
    if (persona.gender === "male")   return maleHints.some(h => n.includes(h));
    return true; // neutral → any
  });

  const finalPool = genderPool.length > 0 ? genderPool : pool;

  // 5. Distribute across available voices by persona index
  const idx = BROWSER_VOICE_LIBRARY.findIndex(v => v.id === persona.id);
  return finalPool[Math.abs(idx) % finalPool.length] || finalPool[0];
}

/** Ensure voices are loaded (some browsers load them async) */
export function ensureVoicesLoaded(): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) { resolve(voices); return; }
    window.speechSynthesis.onvoiceschanged = () => resolve(window.speechSynthesis.getVoices());
    setTimeout(() => resolve(window.speechSynthesis.getVoices()), 1000);
  });
}

export interface SpeakOptions {
  text: string;
  voiceId: string;
  /** Output language override. If omitted, uses the persona's native language. */
  lang?: string;
  rate?: number;
  pitch?: number;
  onEnd?: () => void;
  onError?: (err: Error) => void;
}

/**
 * Speak text using Web Speech API with persona-specific settings.
 * The voice is resolved from the FULL library (not just the base 14).
 */
export function speak(opts: SpeakOptions): SpeechSynthesisUtterance {
  window.speechSynthesis.cancel();

  const persona = getPersona(opts.voiceId);
  const utterance = new SpeechSynthesisUtterance(opts.text);

  // Determine target language: explicit override > persona native lang > "en"
  const targetLang = opts.lang || persona.nativeLang || "en";
  const voice = findBestVoice(persona, targetLang);
  if (voice) utterance.voice = voice;

  utterance.lang = targetLang;
  utterance.rate  = opts.rate  ?? persona.rate;
  utterance.pitch = opts.pitch ?? persona.pitch;

  utterance.onend = () => { currentUtterance = null; opts.onEnd?.(); };
  utterance.onerror = (e) => { currentUtterance = null; opts.onError?.(new Error(e.error)); };

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

/** Download script as text file */
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
