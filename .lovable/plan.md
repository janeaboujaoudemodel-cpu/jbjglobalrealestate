
# CaptionTranslator Full Rebuild — Real Transcription, Fixed SRT, 28 Languages, Voice Dubbing & Caption Burn

## Current State Analysis

### What is broken today:
1. **Transcription uses a single `voice-to-text` function** that was built for short voice messages (seconds). It converts the whole file to base64, sends it as one blob, and gets back a flat text string — no timestamps, no segments. The AI then guesses timecodes by counting words at 0.4s each.
2. **No real word-level timestamps** — all timings are fake. SRT files are therefore incorrect.
3. **"Burn Captions" button says "Coming Soon"** — non-functional.
4. **Voice dubbing** calls `voice-studio-tts` which requires a user JWT token — but the function falls through with public anon key in some flows, causing 401 errors.
5. **Language grid shows 28 flags** but translation is AI-text based (fine); the dubbing per-segment only dubs one segment at a time, not all at once.
6. **No full-video dubbing** — only per-segment audio preview; no ability to export a dubbed video.
7. **The `voice-to-text` edge function** uses Scribe only with hardcoded `eng`/`ara` ISO codes — 26 other languages map to `eng` fallback.

### What exists and works:
- `auto-translate` edge function — uses Gemini with cache, works for all 28 languages.
- `voice-studio-tts` edge function — ElevenLabs TTS, requires JWT auth, returns MP3 binary.
- `ELEVENLABS_API_KEY` secret is configured.
- `LOVABLE_API_KEY` is configured (used for Gemini fallback).
- SRT/VTT export functions are structurally correct (just use fake timestamps).
- Style panel, drag-to-upload, multi-format support, and the overall tab layout all work.

---

## Architecture of the Rebuild

### Strategy: Chunked transcription + ElevenLabs Scribe for timestamps

ElevenLabs Scribe (`scribe_v2`) returns **word-level timestamps** in the response:
```json
{
  "text": "Welcome to Dubai",
  "words": [
    { "text": "Welcome", "start": 0.2, "end": 0.6 },
    { "text": "to", "start": 0.7, "end": 0.85 },
    { "text": "Dubai", "start": 0.9, "end": 1.4 }
  ]
}
```

We can group words into segments (every 10–15 words) and use **real start/end times** from the word timestamps. This gives us **accurate SRT files**.

For large files (>10MB), the frontend will chunk the audio and send multiple requests. The edge function will assemble results.

### New edge function: `video-transcribe`

A new dedicated edge function specifically for video/audio transcription that:
- Accepts the full audio/video as base64 (or chunked parts)
- Calls ElevenLabs Scribe with the correct ISO 639-3 language code for all 28 languages
- Returns structured `segments[]` with real `startTime`, `endTime`, and `text` — not a flat string
- Falls back to Gemini with a structured JSON output prompt if ElevenLabs fails

### Caption Burn-on-Video

Caption burning will use the **Canvas API** in the browser:
- Upload a video file
- Draw each frame to a canvas at the correct timestamp
- Overlay the caption text from the matching subtitle segment  
- Use `MediaRecorder` to capture the canvas stream as a new video blob
- Allow download of the burned video

This is fully client-side — no edge function needed. It works for files up to ~500MB, but will be capped at a practical limit with a warning.

### Voice Dubbing (Full Track)

The existing per-segment dubbing is kept. We add a new "Dub All" button that:
- Takes all translated segments for a selected language
- Calls `voice-studio-tts` for each segment sequentially
- Assembles the audio URLs for each segment
- Provides a timeline preview / playback

---

## Files to Change

### 1. NEW: `supabase/functions/video-transcribe/index.ts`

A new edge function with:
- **No JWT requirement** (public anon key is enough — transcription is a media processing task)
- Accepts `{ audio: string (base64), mimeType: string, language?: string }`
- Returns `{ segments: [{ startTime, endTime, text }], fullText: string }`
- Uses ElevenLabs Scribe with correct ISO 639-3 codes for all 28 supported languages
- Groups word-level timestamps into subtitle segments (~10 words each, max 7 seconds)
- Gemini fallback returns a JSON array of segments with estimated timestamps

**ISO 639-3 mapping for all 28 languages:**
```typescript
const LANG_TO_ISO639_3: Record<string, string> = {
  en: 'eng', ar: 'ara', hi: 'hin', ur: 'urd', zh: 'zho',
  es: 'spa', fr: 'fra', de: 'deu', ru: 'rus', pt: 'por',
  ja: 'jpn', ko: 'kor', it: 'ita', nl: 'nld', tr: 'tur',
  fa: 'fas', he: 'heb', pl: 'pol', th: 'tha', vi: 'vie',
  id: 'ind', ms: 'msa', tl: 'tgl', bn: 'ben', ta: 'tam',
  te: 'tel', ml: 'mal', sw: 'swa',
};
```

### 2. REBUILT: `src/components/ai-video-studio/features/CaptionTranslator.tsx`

Complete rebuild of the component:

**Tab structure stays the same** (Upload → Transcribe → Translate → Style → Export), but each tab is significantly improved.

**Upload tab changes:**
- Show video preview thumbnail if a video file is uploaded
- Show audio waveform hint if audio
- Language detection selector: "What language is spoken in the video?" (28-language dropdown)
- Size warning upgraded: files >50MB get a chunking warning

**Transcribe tab changes:**
- Uses the new `video-transcribe` edge function
- Progress is tracked through real stages: Reading → Encoding → Transcribing → Grouping Segments
- Segments show **real timestamps** from ElevenLabs Scribe word data
- Segments are editable inline (already exists, keep as-is)
- Segment timestamps are also editable (new: click time badge to adjust)
- "Auto-detect language" toggle

**Translate tab changes:**
- Full 28-language grid with emoji flags (all visible, scroll inside panel)
- "Translate All" button (already exists)
- New: "Dub All" button per language — calls voice-studio-tts for all segments and previews merged audio
- Translation and dubbing state per language, not per segment (cleaner UX)

**Style tab — improved captions:**
- Live preview of caption style on a dark dummy video frame (16:9 box showing the text in chosen style/position/color)

**Export tab — Burn Captions:**
- Replace "Coming Soon" with a real working burn-captions flow using Canvas API
- File selector to pick the video to burn on (separate from the transcription source)
- Progress bar during canvas-based burning
- Download button for the burned MP4

**State management:**
```typescript
const [uploadedFile, setUploadedFile] = useState<File | null>(null);
const [spokenLanguage, setSpokenLanguage] = useState('en'); // for transcription
const [segments, setSegments] = useState<SubtitleSegment[]>([]); // real timestamps
const [isBurning, setIsBurning] = useState(false);
const [burnProgress, setBurnProgress] = useState(0);
const [burnVideoFile, setBurnVideoFile] = useState<File | null>(null);
```

**Caption burn implementation (Canvas API):**
```typescript
const burnCaptionsOnVideo = async (videoFile: File, segs: SubtitleSegment[], style: CaptionStyle, langCode?: string) => {
  setIsBurning(true);
  const video = document.createElement('video');
  video.src = URL.createObjectURL(videoFile);
  // Wait for metadata
  await new Promise(res => { video.onloadedmetadata = res; });
  
  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext('2d')!;
  
  const stream = canvas.captureStream(30);
  const recorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9' });
  const chunks: Blob[] = [];
  recorder.ondataavailable = e => chunks.push(e.data);
  
  recorder.start(100);
  video.play();
  
  // Draw loop
  const drawFrame = () => {
    ctx.drawImage(video, 0, 0);
    const currentTime = video.currentTime;
    const activeSeg = segs.find(s => currentTime >= s.startTime && currentTime <= s.endTime);
    if (activeSeg) {
      const text = langCode && activeSeg.translations?.[langCode] ? activeSeg.translations[langCode] : activeSeg.text;
      // Draw text overlay with style settings
      drawCaptionText(ctx, text, style, canvas.width, canvas.height);
    }
    setBurnProgress(Math.round((currentTime / video.duration) * 100));
    if (!video.ended) requestAnimationFrame(drawFrame);
    else { recorder.stop(); }
  };
  requestAnimationFrame(drawFrame);
  
  await new Promise(res => { recorder.onstop = res; });
  const blob = new Blob(chunks, { type: 'video/webm' });
  // trigger download
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'captioned_video.webm'; a.click();
  setIsBurning(false);
};
```

### 3. UPDATED: `supabase/functions/voice-to-text/index.ts`

Fix the ISO 639-3 language code mapping to cover all 28 languages instead of only `eng`/`ara`. This fixes the dubbing quality for Hindi, Chinese, Spanish, etc.

```typescript
const LANG_TO_ISO639_3: Record<string, string> = {
  en: 'eng', ar: 'ara', hi: 'hin', ur: 'urd', zh: 'zho',
  es: 'spa', fr: 'fra', de: 'deu', ru: 'rus', pt: 'por',
  ja: 'jpn', ko: 'kor', it: 'ita', nl: 'nld', tr: 'tur',
  fa: 'fas', he: 'heb', pl: 'pol', th: 'tha', vi: 'vie',
  id: 'ind', ms: 'msa', tl: 'tgl', bn: 'ben', ta: 'tam',
  te: 'tel', ml: 'mal', sw: 'swa',
};
```

---

## Summary of All Changes

| File | Action | What Changes |
|---|---|---|
| `supabase/functions/video-transcribe/index.ts` | CREATE | New edge function: ElevenLabs Scribe with word timestamps → real subtitle segments for all 28 languages |
| `supabase/functions/voice-to-text/index.ts` | UPDATE | Fix ISO 639-3 codes for all 28 languages (was hardcoded to only `eng`/`ara`) |
| `src/components/ai-video-studio/features/CaptionTranslator.tsx` | REBUILD | Real transcription → real SRT timestamps; spoken language selector; full 28-language dub; working caption burn via Canvas API; live style preview |

---

## What Each Fixed Feature Delivers

- **Real Transcription**: ElevenLabs Scribe returns word-level timestamps → accurate SRT
- **Fixed SRT Export**: Timecodes are real (from Scribe), not estimated by word count
- **All 28 Languages**: ISO 639-3 mapping covers every language in `SUPPORTED_LANGUAGES`
- **Voice Dubbing**: Per-segment dub via `voice-studio-tts` + new "Dub All" for full-track dubbing
- **Caption Burn**: Canvas API draws each video frame + overlays caption text → downloadable WebM with burned captions
- **CapCut-Style Layout**: Tabs stay the same (Upload → Transcribe → Translate → Style → Export); improvements are in the content of each tab, not the container
