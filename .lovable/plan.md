

# Video Suite — Connect Existing AI Infrastructure

## Current State (Audit Findings)

The following edge functions and API keys **already exist** but are **NOT wired** into the Video Studio:

| Infrastructure | Edge Function | API Key | Status in Video Studio |
|---|---|---|---|
| AI Background Removal | `ai-background-remove` (Gemini 3 Pro Image) | `LOVABLE_API_KEY` | ❌ Not connected — panel uses canvas-only |
| ElevenLabs TTS | `voice-studio-tts` | `ELEVENLABS_API_KEY` ✅ | ❌ Not connected — uses Web Speech API |
| ElevenLabs Voice Clone | `voice-studio-clone` | `ELEVENLABS_API_KEY` ✅ | ❌ Not connected |

## Plan

### 1. Upgrade BackgroundRemoverPanel — Connect to AI Edge Function

**File**: `src/components/ai-video-studio/features/BackgroundRemoverPanel.tsx`

Current: 5 client-side modes (luminance, chroma key, solid color) using canvas `getImageData()`.

**Changes**:
- Add a 6th mode: "AI Remove" — calls `ai-background-remove` with `mode: "remove"` using `supabase.functions.invoke()`
- Add a 7th mode: "AI Replace" — calls `ai-background-remove` with `mode: "generate"` + user prompt for new background scene
- Keep existing 5 canvas modes as instant fallbacks
- Show "AI-powered" badge on the AI modes
- On AI failure/rate-limit, auto-fallback to client-side canvas removal with toast notification
- Requires auth (existing edge function checks JWT)

### 2. Integrate ElevenLabs TTS into AI Talking Agent Panel

**File**: `src/components/ai-video-studio/features/AITalkingAgentPanel.tsx`

Current: Uses Web Speech API (`speechSynthesis.speak()`) for voice playback — robotic browser voices.

**Changes**:
- Add toggle: "Browser Voice" vs "Premium Voice (ElevenLabs)"
- When Premium selected, call `voice-studio-tts` edge function with selected character's matching ElevenLabs voice ID
- Map existing 8 characters to ElevenLabs voice IDs from `VOICE_OPTIONS` in `types.ts` (Roger→CwhRBWXzGAHq8TQ4Fs17, Sarah→EXAVITQu4vr4xnSDxMaL, etc.)
- Return audio blob → create `<audio>` element → play + option to add to timeline
- Download button for generated audio
- Fallback: if ElevenLabs fails (rate limit, auth), fall back to Web Speech API with toast

### 3. Add Voice Clone Panel to Video Studio

**File**: `src/components/ai-video-studio/features/VoiceClonePanel.tsx` (new)

- Upload voice sample (audio file)
- Call `voice-studio-clone` edge function with `action: "clone_voice"`
- Display cloned voice ID + name
- Generate TTS with cloned voice via `voice-studio-tts` 
- Add generated audio to timeline
- List previously cloned voices

**Layout integration**: Add `voice-clone` tab to `AIVideoStudioLayout.tsx` with `Mic2` icon.

## Files Modified/Created

| File | Action |
|---|---|
| `BackgroundRemoverPanel.tsx` | Edit — add AI Remove + AI Replace modes via `ai-background-remove` |
| `AITalkingAgentPanel.tsx` | Edit — add ElevenLabs TTS option alongside Web Speech |
| `VoiceClonePanel.tsx` | Create — voice cloning via existing `voice-studio-clone` |
| `AIVideoStudioLayout.tsx` | Edit — add `voice-clone` tab |
| `AIVideoStudio.tsx` | Edit — wire `VoiceClonePanel` |

## NOT IMPLEMENTABLE (confirmed)

1. **AI video frame generation** — No video generation model (Runway/Pika/Sora) in Lovable AI roster. NOT IMPLEMENTED.
2. **Full DaVinci-level editing** — Requires FFmpeg/WASM for real frame-by-frame rendering. NOT IMPLEMENTED.
3. **Scene-by-scene video generation** — Depends on #1. NOT IMPLEMENTED.

