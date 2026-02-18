
# AI Video Studio — Caption & Translation Complete Rebuild

## Summary of All Issues Found

### Issue 1: Auto-play on Upload (VoiceoverRecorder)
The audio element has no `autoPlay` attribute, but the real problem is that `startRecording()` could be getting called on mount, or the recorded audio's `play()` method is being invoked somewhere unexpectedly. The real culprit found: the `audioRef` `<audio>` element in VoiceoverRecorder is rendered without `controls` and without explicit prevention — when `recordedUrl` is set after stopping, the `togglePlayback` function is wired to a play button that could be accidentally clicked. More critically: the Upload button in `IntegratedToolsPanel`'s Caption tab calls `onTranscribe()` which currently just returns mock data instantly — the real transcription is not wired to an actual audio file upload. The "Upload" button doesn't exist in the current `CaptionTranslator.tsx` at all, yet users report clicking it. This means the panel isn't connected properly.

### Issue 2: Transcription Stuck at 30%
The `handleTranscribe` calls `onTranscribe()` which in `IntegratedToolsPanel.tsx` returns a hardcoded 2-item mock array — there is no real progress tracking, no real `voice-to-text` call, and no actual file upload. The 30% stuck issue comes from a fake progress simulation that doesn't complete.

### Issue 3: RTL Label Confusion
The language button shows `{lang.name}{lang.rtl && ' ←'}` — so Arabic shows as "Arabic ←". Users don't understand what RTL means. This must be removed and replaced with a cleaner language selector.

### Issue 4: Limited Languages in Translation
The `auto-translate` backend only has 11 languages in `LANGUAGE_NAMES` but the UI has 28 — any language not in the map returns a 400 error `Unsupported language`. Many buttons silently fail.

### Issue 5: SRT Download Broken
The `exportSRT` function uses a `.replace('.', ',')` on the time string. The `formatTime()` function produces `MM:SS.mmm` format — replacing `.` with `,` gives `MM:SS,mmm` but SRT format requires `HH:MM:SS,mmm`. Hours are missing, making the file unparseable by most video players.

### Issue 6: No Real Audio-to-Caption Workflow
Users need to: upload an audio/video file → transcribe → translate → burn captions onto video. The current system has no file-upload-to-transcription pipeline. It's just mock data.

### Issue 7: No Voice Translation (Audio Dubbing)
When a user selects Arabic translation, there's no way to get the translated text spoken by ElevenLabs TTS in the same voice. This is a major missing feature.

### Issue 8: No Caption Burn-in on Video
Users want to add subtitles visually on video with style, color, speed controls. This requires a new CaptionBurnPanel component.

### Issue 9: UI Layout (CapCut-style)
The current layout shows tools only in a side panel. Users want a CapCut-like experience where ALL features are visible upfront, with the preview canvas central. The `IntegratedToolsPanel` tab bar only shows 4 tabs in a narrow side panel — it needs to be a full-featured tools bar.

### Issue 10: No Long Video Support
Users want 30-60 minute YouTube videos captioned. The current transcription calls the `voice-to-text` edge function which processes a base64 audio blob — this has a payload size limit. Long videos need chunked transcription.

---

## Architecture of the New Caption & Translation System

```text
New Standalone: <CaptionStudioPanel>
│
├── Step 1: Upload Media (audio or video, up to 2GB)
│   └── File chunking for large files
│
├── Step 2: Transcribe (calls voice-to-text edge function)
│   ├── Real progress tracking (chunked processing)
│   └── Editable transcript segments (click any word to edit)
│
├── Step 3: Translate
│   ├── ALL 28 languages (fix auto-translate backend)
│   ├── Editable translated text per segment
│   └── Voice Dub: TTS in target language using ElevenLabs
│       (same voice cloning from the segment)
│
├── Step 4: Caption Style
│   ├── Font, color, size, position, background
│   ├── Animation speed (words-per-second)
│   └── Style presets (CapCut-style)
│
└── Step 5: Export
    ├── SRT (fixed format: HH:MM:SS,mmm)
    ├── VTT
    ├── Translated SRT
    └── Burn captions on video (canvas-based overlay)
```

---

## Files to Create / Modify

### File 1: `supabase/functions/auto-translate/index.ts` — Backend Fix
Add all 28 language codes to `LANGUAGE_NAMES`. Currently only 11 are defined, causing 400 errors for Korean, Japanese, Indonesian, Tagalog, Bengali, Tamil, Telugu, Malayalam, Swahili, Polish, Thai, Vietnamese, Malay, Hebrew, Persian, Urdu, and Hindi.

```text
ADDITIONS:
  ur: "Urdu (اردو)"
  zh: already there
  hi: already there
  ko: "Korean (한국어)"
  ja: "Japanese (日本語)"
  pt: "Portuguese (Português)"
  ru: already there
  pl: "Polish (Polski)"
  th: "Thai (ภาษาไทย)"
  vi: "Vietnamese (Tiếng Việt)"
  id: "Indonesian (Bahasa Indonesia)"
  ms: "Malay (Bahasa Melayu)"
  tl: "Tagalog (Filipino)"
  bn: "Bengali (বাংলা)"
  ta: "Tamil (தமிழ்)"
  te: "Telugu (తెలుగు)"
  ml: "Malayalam (മലയാളം)"
  sw: "Swahili (Kiswahili)"
  he: "Hebrew (עברית)"
```

### File 2: `supabase/functions/voice-studio-tts/index.ts` — Add Language Support
The TTS function needs to accept a `language` param and pass it to ElevenLabs so dubbed audio is generated in the correct language using the `eleven_multilingual_v2` model.

### File 3: `src/components/ai-video-studio/features/CaptionTranslator.tsx` — Full Rebuild
This is the main work. Replace the current minimal component with a full CapCut-style caption studio:

**Section A — Media Upload**
- Large drop zone accepting audio (MP3, WAV, M4A, OGG) and video (MP4, MOV, WebM)
- File size indicator; for files > 25MB show "Large file — processing may take longer"
- No auto-play: a manual Play button appears after upload

**Section B — Transcription**
- "Start Transcription" button that:
  1. Reads the file as ArrayBuffer
  2. Converts to base64
  3. Calls `voice-to-text` edge function
  4. Shows a real animated progress bar (not fake 30%)
  5. Real progress: `uploading (20%) → transcribing (60%) → done (100%)`
- Each transcript segment shown as an editable card:
  - Timestamp (left), editable text (center), delete icon (right)
  - Click text to edit inline (textarea, not input)

**Section C — Translation**
- Language grid: all 28 languages as chips (flag emoji + name, no RTL label)
- Single active selection (not multi — simplifies the UX)
- "Translate" button calls `auto-translate`
- Translated text shown per segment, inline editable
- "Dub Audio" button per language — calls `voice-studio-tts` with translated text + selected voice

**Section D — Caption Style**
- Font size slider (16–48px)
- Color picker (text color, background color)
- Position selector (top / center / bottom)
- Style chips: Clean, Bold, Karaoke, Lower Third
- Animation speed: slow / normal / fast (words-per-minute control)

**Section E — Export**
- SRT: fixed with proper `HH:MM:SS,mmm` format
- VTT: correct WEBVTT format
- Burn on Video: canvas overlay renderer (using video element + canvas 2D)
  - Draws each cue frame-by-frame as the video plays
  - "Preview" shows the video with live captions overlaid
  - "Download with Captions" renders + downloads as WebM

### File 4: `src/components/ai-video-studio/features/IntegratedToolsPanel.tsx` — Wiring Fix
- Remove the mock `handleTranscribe` that returns fake data
- Pass actual state down to `CaptionTranslator`
- Add an `uploadedFile` state to pass the media file reference to `CaptionTranslator`

### File 5: `src/components/ai-video-studio/layout/AIVideoStudioLayout.tsx` — CapCut-style
- The Tools panel (currently a right-side panel) should be surfaced as a **bottom tools bar** with horizontal icon tabs — like CapCut's bottom toolbar
- On desktop: keep the resizable panel layout but make the tools panel span the full bottom between timeline and preview
- Tools tabs shown as a horizontal icon strip:
  `Voice | Captions | Beauty | Resize | Transitions | Text`

---

## Detailed Fix: SRT Time Format

Current broken code:
```typescript
const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);
  return `${mins.toString().padStart(2, '0')}:${secs...}`;  // Missing hours!
};
// Then: startTime.replace('.', ',')  — Wrong separator replacement
```

Fixed SRT time format:
```typescript
const toSRTTime = (seconds: number) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')},${ms.toString().padStart(3, '0')}`;
};
```

---

## Detailed Fix: Language Chips (No RTL Label)

Current broken display:
```tsx
{lang.name}{lang.rtl && ' ←'}  // Shows "Arabic ←" — confusing
```

Fixed display:
```tsx
const FLAG_EMOJIS: Record<string, string> = {
  en: '🇬🇧', ar: '🇸🇦', hi: '🇮🇳', zh: '🇨🇳', ...
};
// Show: "🇸🇦 Arabic" — clean, no RTL indicator
```

---

## Detailed Fix: Voice Dub Feature

When user clicks "Dub in Arabic" for a segment:
1. Get translated Arabic text for that segment
2. Call `voice-studio-tts` with `{ text: arabicText, language: 'ar', voiceId: selectedVoiceId }`
3. ElevenLabs `eleven_multilingual_v2` model generates Arabic speech
4. Audio player appears below the segment with Play/Download controls
5. "Export Full Dubbed Audio" merges all segment audios with correct timing gaps

---

## Summary of All Changes

| File | Change |
|---|---|
| `auto-translate/index.ts` | Add 17 missing language codes to LANGUAGE_NAMES |
| `voice-studio-tts/index.ts` | Add `language` param passthrough to ElevenLabs |
| `CaptionTranslator.tsx` | Full rebuild: real upload, real transcription, editable segments, translation, voice dub, caption style, fixed SRT/VTT export, burn-on-video |
| `IntegratedToolsPanel.tsx` | Remove mock transcription, pass file state to CaptionTranslator |
| `AIVideoStudioLayout.tsx` | Make tools bar horizontal CapCut-style bottom strip |

