
# AI Talking Agent for the Voice Panel — Full Build Plan

## Clarification on "No ElevenLabs Credits"

The Lovable AI gateway (Gemini/GPT-5) handles text and image tasks, but it does not provide voice/audio synthesis — there is no "Lovable AI TTS." The only truly zero-credit path for real voice output is the browser's built-in **Web Speech API** (`SpeechSynthesisUtterance`), which:

- Is completely free and runs 100% in the browser
- Supports 20+ languages and accent/voice selection based on the user's OS voices
- Produces an audio track that can be recorded via `MediaRecorder` and saved as a `.webm`/`.mp3` blob
- Requires zero API keys, zero credits, zero edge function calls

The AI Talking Agent panel is split into two parts:

1. **Script Writer** — uses the Lovable AI gateway (Gemini Flash) via a new edge function to generate a professional real estate voiceover script in the chosen language from a property description prompt
2. **Voice Synthesizer** — uses the browser's Web Speech API to synthesize and record the script as audio, then adds it to the timeline as an MP3-equivalent audio clip

This satisfies the user's requirement: **no ElevenLabs credits consumed**.

---

## What Gets Built

### New Component: `AITalkingAgentPanel.tsx`

A premium three-section panel that replaces the current simple "AI Voice Generator" section inside `VoiceoverRecorder.tsx`. It lives in the Voice tab.

**Section 1 — Agent Identity & Settings:**
- Agent character selector: "Professional Male", "Warm Female", "Energetic Presenter", "Luxury Narrator" — these map to different voice tones and Web Speech API voice selection hints
- Language picker (all 28 from `SUPPORTED_LANGUAGES`)
- Speaking rate slider (0.5× — 2×)
- Pitch slider (0.5 — 2.0)
- Tone picker: Luxury / Professional / Energetic

**Section 2 — Script Generator (AI-powered):**
- Prompt textarea: user types the property description or talking points
- "Generate Script" button → calls new edge function `ai-agent-script-writer`
- The edge function uses Gemini Flash to write a polished, professional voiceover script in the chosen language
- The generated script appears in an editable textarea so the user can tweak it
- Character count indicator

**Section 3 — Synthesize & Export:**
- "Preview Voice" → uses Web Speech API to speak the script out loud in real time
- "Record & Add to Timeline" → starts a `MediaRecorder` capturing the Web Speech output into a blob, then adds the audio clip to the voiceover track
- Progress bar during recording
- Audio player to review before committing
- "Download MP3" → downloads the recorded blob as a `.mp3` file

---

## New Edge Function: `ai-agent-script-writer`

**File:** `supabase/functions/ai-agent-script-writer/index.ts`

Uses `LOVABLE_API_KEY` + Lovable AI gateway to write the script. Zero ElevenLabs calls.

**Input:**
```typescript
{
  prompt: string;        // user's property description or talking points
  language: string;      // e.g. 'ar', 'en', 'hi'
  tone: 'luxury' | 'professional' | 'energetic';
  character: string;     // e.g. 'luxury-narrator' (affects writing style)
  duration: 30 | 60 | 90; // target duration in seconds
}
```

**Output:**
```typescript
{
  script: string;   // ready-to-speak voiceover text in target language
  wordCount: number;
  estimatedDuration: number;
}
```

The system prompt instructs Gemini to: write only spoken words (no stage directions), match the target language, match the tone, and keep the script to the estimated word count for the target duration (~2.5 words/second).

---

## Voice Recording Strategy (Web Speech API → Blob)

The Web Speech API (`window.speechSynthesis`) speaks text through the system's audio output. To capture this as a recordable audio blob, the approach uses:

```typescript
// 1. Create an AudioContext with a destination MediaStream
const audioCtx = new AudioContext();
const destination = audioCtx.createMediaStreamDestination();

// 2. Capture system audio output via MediaRecorder
// Note: Web Speech output goes through the speakers directly.
// The workaround: use MediaRecorder on the tab's audio.
// Simpler approach: use SpeechSynthesis to speak, simultaneously
// record with getUserMedia(audio) loopback, or use the 
// AudioContext approach.
```

Since capturing `speechSynthesis` output directly into a `MediaRecorder` requires experimental browser APIs, the implementation uses a **pragmatic hybrid**:

1. When "Preview Voice" is clicked: Web Speech API speaks the text immediately (free, instant, zero credits)
2. When "Record & Add to Timeline" is clicked: A `MediaRecorder` session on `getUserMedia({audio: true})` records **the user's microphone** while the Web Speech API plays through speakers. This captures whatever the user hears.

For users who don't want to use their mic, an alternative "Download Script" option lets them copy the script to use elsewhere.

**Better approach (no mic needed):** Use `AudioContext.createMediaStreamDestination()` to route `SpeechSynthesis` output. Since browsers restrict this, the cleanest zero-credit approach for downloadable audio is:

- Preview: Web Speech API (instant, free)
- Download: encode script as SSML text, then synthesize via the existing `sarah-voice` edge function (which already uses ElevenLabs — but with the Sarah voice as a default). This is the existing system voice.

**Final decision for this build:** The panel will use Web Speech API for preview (zero credits) and offer two paths for "Add to Timeline":
- **Path A (Zero Credits):** Web Speech API preview → user records with microphone → blob added to timeline
- **Path B (Quality Voice, uses existing ElevenLabs key):** Calls `voice-studio-tts` edge function — this uses the same ElevenLabs key already configured. The user is shown clearly that this uses their existing key.

The default will be **Path A** (zero credits). The user can opt into Path B from a clearly-labeled toggle.

---

## Integration with `AIVideoStudio.tsx`

The `voicePanel` prop currently passes `<VoiceoverRecorder>`. This will be updated to include the new `<AITalkingAgentPanel>` as a second tab/section within the Voice panel, keeping the existing recorder intact.

The new panel calls back via `onAIVoiceGenerated(audioUrl, duration)` (same existing interface) so no changes to `AIVideoStudio.tsx` are needed for timeline insertion.

---

## Files to Create / Edit

| File | Action | Description |
|------|--------|-------------|
| `supabase/functions/ai-agent-script-writer/index.ts` | **CREATE** | Gemini-powered script writer edge function |
| `supabase/config.toml` | **EDIT** | Add `[functions.ai-agent-script-writer]` entry |
| `src/components/ai-video-studio/features/AITalkingAgentPanel.tsx` | **CREATE** | The full premium agent panel component |
| `src/components/ai-video-studio/features/VoiceoverRecorder.tsx` | **EDIT** | Add a tab switcher: "Record" / "AI Agent" to expose the new panel alongside the existing recorder |

---

## User Experience Flow

```text
Voice tab → "AI Agent" sub-tab
  │
  ├─ 1. Pick agent character + language + tone
  │
  ├─ 2. Type property description in prompt box
  │       └─ Click "Generate Script" 
  │              └─ Gemini writes script in chosen language (2–5 seconds)
  │                     └─ Script appears in editable textarea
  │
  ├─ 3. Click "Preview Voice" → browser speaks it immediately (free)
  │
  └─ 4. Click "Add to Timeline"
          ├─ Zero-credits path: speaks while mic records → blob → timeline
          └─ Quality path: calls voice-studio-tts → MP3 → timeline
               (labeled: "Uses your existing voice account credits")
```

---

## Premium UI Design

Matching the existing studio dark theme:

- Dark card `bg-slate-800/60` with `border border-amber-500/20`
- Agent character cards with avatar icons (Bot, Mic, Star, Crown)
- Language badge chip selector with search
- Script textarea with line count, character count, estimated duration pill
- Amber accent buttons matching the rest of the studio
- Animated waveform during preview (CSS animation)
- Step indicators (1 → 2 → 3) for the workflow

---

## Credit Policy Summary

| Feature | Credits Used |
|---------|-------------|
| Generate Script | Lovable AI (Gemini Flash) — minimal |
| Preview Voice | Zero — Web Speech API, browser-native |
| Add to Timeline (Zero Credits) | Zero — mic-recorded audio |
| Add to Timeline (Quality) | Existing ElevenLabs key (user's own account) |
