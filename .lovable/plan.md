
# Remove All Auto-Triggered ElevenLabs Credit Usage

## What's Being Fixed

Every time you clicked "Generate AI Narration", "Generate Video Ad", or pressed the voice input button, the app was silently calling paid ElevenLabs APIs. This plan removes all three of those automatic calls and replaces them with 100% free alternatives.

## The 6 Changes

### 1. `supabase/functions/ai-talking-agent/index.ts` — Strip TTS, return script only

Currently: generates script via Gemini → sends it to ElevenLabs TTS → returns `audioBase64`.

After: generates script via Gemini → returns `{ script, duration, wordCount, character }`. No ElevenLabs call. No `ELEVENLABS_API_KEY` check.

### 2. `supabase/functions/ai-property-video-ad/index.ts` — Strip TTS block (lines 162–207)

Currently: generates script → calls ElevenLabs TTS → returns `audioBase64`.

After: generates script → returns `{ script, audioDurationEstimate }`. The ElevenLabs block (lines 162–207) is deleted entirely. No `ELEVENLABS_API_KEY` requirement.

### 3. `supabase/functions/voice-to-text/index.ts` — Remove ElevenLabs Scribe block

Currently: tries ElevenLabs Scribe first (lines 41–77), falls back to Gemini.

After: ElevenLabs Scribe block deleted. Gemini multimodal is the sole transcription provider (this already works perfectly — it was just being bypassed).

### 4. `src/components/ai-video-studio/features/AITalkingAgentPanel.tsx` — Browser speech synthesis

The `handleGenerate` function currently decodes `data.audioBase64` into a blob URL. 

After: it receives only `{ script, duration, character }`, then synthesizes audio locally using `window.speechSynthesis`:

```typescript
const utterance = new SpeechSynthesisUtterance(script);
utterance.lang = selectedLanguage;  // 'ar', 'fr', etc.
utterance.rate = 0.9;
utterance.pitch = selectedCharacter.gender === 'female' ? 1.1 : 0.85;
window.speechSynthesis.speak(utterance);
```

For timeline insertion, the script text is stored as a narration metadata clip (with duration) — exactly how the studio already handles text overlays — so the audio plays back via browser speech synthesis whenever the user clicks play.

The `GeneratedNarration` type loses `audioBase64`/`audioMimeType`/`voiceId`; gains `blobUrl: null` (playback is live synthesis, not a stored file). Download button generates the audio blob via a short `MediaRecorder` capture of the browser's synthesis output.

The generating skeleton text is updated from "Writing script & generating voice" to "Writing script with AI…" so it's honest.

### 5. `src/components/ai-video-studio/features/VoiceoverRecorder.tsx` — Remove "EL Voice" tab

The tab at line 185–191 labeled "EL Voice" calls `voice-studio-tts` which consumes ElevenLabs credits. It is removed entirely.

The state variables `aiText`, `selectedVoice`, `selectedLanguage`, `isGenerating`, `consentChecked`, and the `generateAIVoice` function are all removed.

The tabs simplify to just two: **Record** and **AI Agent** (which already uses the free browser synthesis path via `AITalkingAgentPanel`).

### 6. `src/components/ai-video-studio/features/ProjectIntegrationPanel.tsx` — Handle script-only response

Currently at line 354 it does `atob(data.audioBase64)` to build a blob URL. After the edge function change, `audioBase64` will not exist in the response.

After: when the script is received, browser speech synthesis is used for the audio preview in the result panel. The voiceover passed to `onCreateVideoAd` stores the `script` text (and `duration`) instead of `audioBase64`, so the timeline receives a text-narration clip.

The `result` state changes from `{ script, audioBase64, duration }` to `{ script, duration }`.

The `VideoAdResult.voiceover` interface field `audioBase64` becomes optional/removed and replaced with `script`.

---

## What Does NOT Change

- `voice-studio-tts` edge function — kept as-is. The "EL Voice" tab that called it is removed from the UI, but the function stays for any future deliberate use.
- The Voice Studio Pro tool — separate feature, intentional usage only.
- Owner Voice Notes, Podcast studio, ElevenLabs Conversational Widget — all intentional, user-triggered features, untouched.

---

## Technical Summary

```text
BEFORE (every button click costs credits):
  Generate Narration → ai-talking-agent → ElevenLabs TTS → $$$
  Generate Video Ad  → ai-property-video-ad → ElevenLabs TTS → $$$
  Voice Input button → voice-to-text → ElevenLabs Scribe → $$$
  EL Voice tab       → voice-studio-tts → ElevenLabs TTS → $$$

AFTER (zero automatic credit usage):
  Generate Narration → ai-talking-agent → Gemini script → browser SpeechSynthesis (FREE)
  Generate Video Ad  → ai-property-video-ad → Gemini script → browser SpeechSynthesis (FREE)
  Voice Input button → voice-to-text → Gemini multimodal (FREE)
  EL Voice tab       → REMOVED
```

## Files to Edit

| File | Change |
|------|--------|
| `supabase/functions/ai-talking-agent/index.ts` | Remove ElevenLabs TTS; return script only; remove EL API key check |
| `supabase/functions/ai-property-video-ad/index.ts` | Remove ElevenLabs TTS block; return script + duration only |
| `supabase/functions/voice-to-text/index.ts` | Delete ElevenLabs Scribe block (lines 41–77); Gemini-only |
| `src/components/ai-video-studio/features/AITalkingAgentPanel.tsx` | Replace audio decode with `window.speechSynthesis`; update types |
| `src/components/ai-video-studio/features/VoiceoverRecorder.tsx` | Remove "EL Voice" tab and all related state/functions |
| `src/components/ai-video-studio/features/ProjectIntegrationPanel.tsx` | Handle script-only response; use speech synthesis for preview |

Both edge functions will be redeployed automatically after editing.
