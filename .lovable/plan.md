
# AI Video Studio — Comprehensive Overhaul Plan

## Summary of All Issues Found (from user feedback)

The user raised 15+ distinct issues across 6 areas. This plan addresses every one of them in priority order.

---

## 1. SFX — Remove ALL ElevenLabs Dependency (Zero Credits)

**Problem:** `supabase/functions/elevenlabs-sfx/index.ts` still calls ElevenLabs TTS using `ELEVENLABS_API_KEY`. When user clicks a preset like "Luxury Door Chime," it generates speech (a voice reading the label), not an actual sound — and it uses ElevenLabs credits.

**Fix:** Replace the entire SFX generation pipeline with a **Web Audio API synthesizer** that runs 100% in the browser — zero API calls, zero credits, instant playback.

- Each SFX category gets a unique synthesized sound using the Web Audio API:
  - **Door chime** → damped sine wave with harmonics
  - **Keys jingling** → rapid metallic noise bursts
  - **Whoosh** → filtered noise sweep
  - **Cash register** → sharp high transient + low ding
  - **Applause** → filtered white noise pulses
  - Etc.
- When user clicks a preset, the sound plays **immediately** in the browser using `AudioContext` — no loading spinner, no API call.
- The user can then click **Add** to add it to the timeline.
- The custom text "Generate" prompt box will also synthesize a generic tone.
- The edge function `elevenlabs-sfx` will be completely replaced with a local synthesis engine.

**Files:**
- Rewrite `src/components/ai-video-studio/features/SoundEffectsPanel.tsx` — add `WebAudioSFXEngine` class
- Delete/disable `supabase/functions/elevenlabs-sfx/index.ts` edge function dependency

---

## 2. Text Presets — Visibility Fix

**Problem:** User says presets (Neon Glow, Breaking News, Instagram Story, etc.) are not visible. Looking at the code, the `TextOverlayPanel` renders a `ScrollArea` with the grid inside the tools bar `h-272` container — the scroll is trapped inside the small panel.

**Fix:**
- Ensure the presets grid is immediately visible without any scrolling required when the Text panel opens.
- Move the search bar and category filters to stick at the top of the panel.
- Ensure the grid shows at minimum 2 visible rows (4 thumbnails) before any scroll is needed.
- The panel's scroll should be the full panel area, not a nested scroll inside a scroll.

**File:** `src/components/ai-video-studio/features/TextOverlayPanel.tsx`

---

## 3. Tools Panel Scroll — "Small Screen Scrolling Inside" Fix

**Problem:** The tools panel (Sound FX, Captions, etc.) is `h-72` (288px) with `overflow-y-auto` inside it. This creates an inner scrollable box — exactly what user is complaining about ("it's scrolling inside like a dropdown").

**Fix in `AIVideoStudioLayout.tsx`:**
- Change the tool panel from a fixed `h-72` trapped box to a **full-page expansion**:
  - When a tool tab is clicked, the preview area **contracts** and the tool panel takes the remaining space.
  - The scroll should be the main page scroll inside the tool panel, not a tiny box.
  - Use `flex-1` + `min-h-0` for the tool panel area so it fills the available vertical space when expanded.
  - Make the tool panel expand to at least 60% of viewport height when open.

**File:** `src/components/ai-video-studio/layout/AIVideoStudioLayout.tsx`

---

## 4. Top Bar — Premium UI Upgrade

**Problem:** The top bar has tight padding, looks cramped, and is not premium enough.

**Fix in `AIVideoStudioTopBar.tsx`:**
- Increase the bar height from `min-h-[52px]` to `min-h-[64px]`
- Add a gradient background: `bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900`
- Add gold accent line at the bottom: `border-b-2 border-amber-500/40`
- More generous padding: `px-6 py-4`
- Larger branding: logo icon size `w-7 h-7`, name text larger
- Project name in amber with clean divider
- Buttons with more breathing room

**File:** `src/components/ai-video-studio/layout/AIVideoStudioTopBar.tsx`

---

## 5. Stars / Text Overlays Showing Uninvited on Preview

**Problem:** "Stars are showing on the preview while I did not add them / did not click Add." Two likely causes:
1. In `OverlayEffectsPanel`, clicking a card calls `onPreviewEffect` which locks the effect onto the canvas. The stars (`star-shower` effect) is auto-activating.
2. Text clips from `TextOverlayPanel` may be auto-adding when clicking a preset thumbnail (code at line 445 in TextOverlayPanel calls `onAddTextClip` immediately on click).

**Fix:**
- In `TextOverlayPanel`: clicking a preset thumbnail should only **preview/select** it (populate the editor fields), NOT auto-add to the timeline. Only the explicit "Add" button should add to timeline.
- In `OverlayEffectsPanel`: ensure stars/effects don't appear unless the user explicitly locks them.

**Files:**
- `src/components/ai-video-studio/features/TextOverlayPanel.tsx`
- `src/components/ai-video-studio/features/OverlayEffectsPanel.tsx`

---

## 6. Video Preview Size — Expand the Canvas

**Problem:** The preview is too small. The ratio change doesn't work. The "Export As" section below the video has a trapped scroll.

**Fix:**
- Make the video preview canvas taller — increase `min-h-[240px]` to `min-h-[360px]`
- Make aspect ratio selection actually apply: when user selects 9:16, the preview canvas changes its CSS `aspect-ratio` property
- The export bar area should expand rather than scroll internally

**Files:**
- `src/components/ai-video-studio/layout/AIVideoStudioLayout.tsx`
- `src/components/ai-video-studio/preview/VideoPreviewCanvas.tsx`
- `src/components/ai-video-studio/layout/AIVideoStudioExportBar.tsx`

---

## 7. Captions / Translate Flow Fix

**Problem:** "When I click Translate, it shows go to Transcribe. I click Transcribe, it shows Upload File." The caption panel requires upload → transcribe → translate, but the tabs are confusing. The flow is circular.

**Fix in `CaptionTranslator.tsx`:**
- When user lands on the Captions tab, show the main workflow in a **linear vertical flow** (not tabs):
  1. Upload/Record section (always visible at top)
  2. Once file uploaded, Transcribe button appears
  3. Once transcribed, Translate section appears
  4. Style and Export are always available but clearly disabled until transcription done
- Remove the confusing tab navigation; replace with a step-by-step flow with visual progress indicators (Step 1 → 2 → 3)
- Show all languages in the translation section (expand from `QUICK_LANGS` to show all `SUPPORTED_LANGUAGES`)

**File:** `src/components/ai-video-studio/features/CaptionTranslator.tsx`

---

## 8. Inspector — "No Clip Selected" State

**Problem:** Inspector shows "no clip selected" which confuses users.

**Fix in `InspectorPanel.tsx`:**
- When no clip is selected, show a helpful prompt: "Click any clip in the timeline to inspect and edit its properties"
- Add a visual placeholder with inspector icon and a list of what the inspector does

**File:** `src/components/panels/InspectorPanel.tsx`

---

## Technical Implementation Order

```text
Phase 1 (Critical UX — affects all users immediately):
  1. SFX → Web Audio synthesis (no credits, instant play)
  2. Tool panel scroll fix (the "small box" problem)
  3. Text preset auto-add bug fix (stars/text showing uninvited)

Phase 2 (Premium UI):
  4. Top bar premium redesign
  5. Preview canvas expansion + ratio fix
  6. Text presets visibility

Phase 3 (Flow Fixes):
  7. Caption tab flow linearization
  8. Inspector empty state improvement
```

---

## Files to Edit

| File | Change |
|------|--------|
| `src/components/ai-video-studio/features/SoundEffectsPanel.tsx` | Replace API calls with Web Audio synthesis engine |
| `src/components/ai-video-studio/layout/AIVideoStudioLayout.tsx` | Fix tool panel to not be a tiny inner-scroll box |
| `src/components/ai-video-studio/layout/AIVideoStudioTopBar.tsx` | Premium redesign, taller, gradient, gold accent |
| `src/components/ai-video-studio/features/TextOverlayPanel.tsx` | Fix auto-add bug; presets should only populate editor |
| `src/components/ai-video-studio/features/CaptionTranslator.tsx` | Linear step flow, all languages visible |
| `src/components/ai-video-studio/preview/VideoPreviewCanvas.tsx` | Larger canvas, working ratio change |
| `src/components/ai-video-studio/panels/InspectorPanel.tsx` | Better empty state |
| `supabase/functions/elevenlabs-sfx/index.ts` | Keep as stub/no-op (synthesis moves to browser) |

---

## What Will NOT Be in This Change (Scope Management)

The following are **large, separate feature builds** that the user mentioned but should be tackled individually in follow-up messages to avoid breaking existing functionality:

- AI real estate video ad generator (from property photos + location data)
- AI agent video (talking head, TTS voice selection, language/accent)
- Instagram video link extraction / mimic feature
- Full CapCut timeline rewrite with split-on-click, per-clip effects

These require edge functions, AI model integration, and significant new UI — they will be separate planning sessions.
