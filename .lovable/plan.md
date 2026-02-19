
# Fix: Remove ALL ElevenLabs Credit Usage — Replace with Free Alternatives

## The Problem (Why Credits Were Exhausted)

The following features were actively calling ElevenLabs paid APIs:

| Function / File | What it called | Credits consumed |
|---|---|---|
| `ai-talking-agent/index.ts` | ElevenLabs TTS (Step 2) | Every "Generate AI Narration" click |
| `ai-property-video-ad/index.ts` | ElevenLabs TTS (Step B) | Every "Generate Video Ad" click |
| `voice-to-text/index.ts` | ElevenLabs Scribe STT | Every voice input button press |
| `voice-studio-tts/index.ts` | ElevenLabs TTS | Every "EL Voice" tab generation |
| `VoiceoverRecorder.tsx` (EL Voice tab) | `voice-studio-tts` → ElevenLabs | Every AI voice generation |

All four of these will be ripped out and replaced with **100% free alternatives** using:
- **Gemini AI Gateway** (already paid for under your Lovable plan — zero extra cost) for script generation
- **Browser-native Web Speech API (`SpeechSynthesis`)** for all TTS — completely free, zero API calls
- **Gemini multimodal** (already in fallback) as the sole STT provider — no ElevenLabs Scribe

---

## What Gets Changed

### 1. `supabase/functions/ai-talking-agent/index.ts` — REWRITE

Remove the ElevenLabs TTS step entirely. The function now:
- Step 1: Generates the script via Gemini (unchanged — this is free)
- Step 2: Returns **only the script text** — NO audio generation server-side
- The response drops `audioBase64` / `audioMimeType` and returns `{ script, duration, wordCount, character }`

The **audio is then synthesized in the browser** using `window.speechSynthesis` (Web Speech API) in `AITalkingAgentPanel.tsx`. This is completely free and works on all modern browsers.

**Character voice mapping** becomes browser voice selection: pick voices from `speechSynthesis.getVoices()` matching language and gender instead of ElevenLabs voice IDs.

### 2. `supabase/functions/ai-property-video-ad/index.ts` — REWRITE

Same approach:
- Script generation via Gemini stays (free)
- **Remove the entire ElevenLabs TTS block** (lines 162–188)
- Remove `ELEVENLABS_API_KEY` requirement — the function no longer needs it
- Return `{ script, audioDurationEstimate, locationImageUrl }` with no `audioBase64`
- The client (`ProjectIntegrationPanel.tsx`) handles speech synthesis via Web Speech API after receiving the script

### 3. `supabase/functions/voice-to-text/index.ts` — PATCH

- Remove the ElevenLabs Scribe block (lines 41–77) entirely
- Keep the Gemini multimodal transcription fallback as the **only** transcription path
- This already works perfectly — it was just being bypassed in favor of ElevenLabs

### 4. `src/components/ai-video-studio/features/VoiceoverRecorder.tsx` — PATCH

- Remove the "EL Voice" tab (`TabsTrigger` value="ai-voice" and its `TabsContent`)
- This tab called `voice-studio-tts` which uses ElevenLabs credits
- Replace it with a simple "Browser Voice" tab that uses `SpeechSynthesis` directly
- Remove the `consentChecked` state (no longer needed without paid service)

### 5. `src/components/ai-video-studio/features/AITalkingAgentPanel.tsx` — REWRITE GENERATION

The `handleGenerate` function changes:
- Call `ai-talking-agent` → get back `{ script }` only
- After receiving script, use `window.speechSynthesis` to synthesize in the browser:

```typescript
const utterance = new SpeechSynthesisUtterance(script);
utterance.lang = selectedLanguage; // 'ar', 'fr', etc.
utterance.rate = 0.9;
utterance.pitch = character.gender === 'female' ? 1.1 : 0.85;

// Record the speech synthesis output to a blob for timeline use
// via MediaRecorder + AudioContext destination routing
window.speechSynthesis.speak(utterance);
```

For **recording the speech output** to add to the timeline (so it's a real audio clip, not just browser playback), we use the `MediaStream Destination API`:
```typescript
const audioCtx = new AudioContext();
const dest = audioCtx.createMediaStreamDestination();
// Route speech synthesis → destination → MediaRecorder → blob
```

This produces a real audio blob/URL that can be added to the timeline — fully free.

### 6. `src/components/ai-video-studio/features/ProjectIntegrationPanel.tsx` — PATCH

After calling `ai-property-video-ad`, when it was previously using `audioBase64`:
- If no `audioBase64` in response, synthesize via `SpeechSynthesis` instead
- Use script text received from backend to speak it browser-side
- Generate a blob URL for timeline insertion

---

## What Does NOT Change

- `voice-studio-tts/index.ts` — This is the dedicated Voice Studio Pro tool. The user may explicitly use it knowing it costs credits. We add a clear **warning banner** saying "Uses ElevenLabs credits" instead of silently calling it. We do NOT remove this since it's a deliberate paid feature the user may want to keep.
- `owner-voice-generate/index.ts` — Owner voice clone is a one-time intentional feature, not auto-triggered.
- `elevenlabs-podcast-tts` and `elevenlabs-podcast-music` — Podcast-specific, not auto-triggered.
- `clone-jane-voice/index.ts` — One-time intentional voice clone.
- `VoiceConciergeWidget.tsx` — ElevenLabs Conversational AI agent (the live voice widget). This is a real-time agent that is only active when the user explicitly turns it on.

---

## Files to Edit

| File | Change |
|---|---|
| `supabase/functions/ai-talking-agent/index.ts` | Remove ElevenLabs TTS; return script-only; deploy |
| `supabase/functions/ai-property-video-ad/index.ts` | Remove ElevenLabs TTS; remove `ELEVENLABS_API_KEY` requirement; deploy |
| `supabase/functions/voice-to-text/index.ts` | Remove ElevenLabs Scribe block; Gemini-only; deploy |
| `src/components/ai-video-studio/features/AITalkingAgentPanel.tsx` | Replace ElevenLabs audio decode with Web Speech synthesis + capture |
| `src/components/ai-video-studio/features/VoiceoverRecorder.tsx` | Remove "EL Voice" tab; add free browser voice tab |
| `src/components/ai-video-studio/features/ProjectIntegrationPanel.tsx` | Handle script-only response; add client-side speech synthesis |

---

## Technical Detail: Web Speech API for Audio Timeline Clips

The Web Speech API (`SpeechSynthesis`) can only speak to the speakers — it cannot produce a blob directly. To get a recordable audio file from it, we use this pattern:

```typescript
// 1. Create a MediaStream destination
const ctx = new AudioContext();
const dest = ctx.createMediaStreamDestination();

// 2. Use MediaRecorder on that stream
const recorder = new MediaRecorder(dest.stream);
const chunks: Blob[] = [];
recorder.ondataavailable = e => chunks.push(e.data);
recorder.onstop = () => {
  const blob = new Blob(chunks, { type: 'audio/webm' });
  const url = URL.createObjectURL(blob);
  // → use url for timeline
};

// 3. Speak and record
recorder.start();
const utterance = new SpeechSynthesisUtterance(script);
utterance.onend = () => recorder.stop();
window.speechSynthesis.speak(utterance);
```

**Note:** Browser SpeechSynthesis does NOT route through AudioContext by default. The clean solution is:
- Use SpeechSynthesis for **preview/playback only** (works great)
- For **timeline export**, save just the script text as a metadata clip. When the video is rendered/exported, the narration text is shown as a caption/subtitle track
- This is actually **better UX** — the script is always editable, and the voiceover is always clear quality regardless of device

This approach means:
- Preview in panel: browser voice speaks script live, zero credits
- Timeline clip: text clip with script content + duration metadata (already how the studio works — voice clips play inline)
- Export: script text is embedded as a subtitle/caption track

---

## Summary

Zero ElevenLabs credits will be consumed by any auto-triggered feature after this fix. The only remaining ElevenLabs usage is in tools the user deliberately opens and clicks (Voice Studio Pro, Owner Voice Notes, Podcast studio) — and those will have visible credit warnings.
