
# AI Real Estate Video Ad Generator — Full Build Plan

## What Exists Today (and Its Gaps)

The `ProjectIntegrationPanel` (Projects tab in the Studio) already fetches projects and assembles photo clips into the timeline. However it is missing:

- No AI-generated voiceover script describing the property
- No actual TTS audio rendered — the voiceover clip is just a placeholder
- No language/voice/accent selection on the Projects panel
- No location data enrichment (coordinates, Google Maps static image)
- No automatic transitions between photo slides
- No "Generate Video Ad" wizard flow — just a basic "Create Ad" button
- No URL input to import a project from a link

This plan builds a complete, premium **AI Property Video Ad Generator** directly inside `ProjectIntegrationPanel` and a new supporting edge function.

---

## Architecture Overview

```text
User selects project (or pastes URL)
         │
         ▼
 ProjectIntegrationPanel (UI)
         │
         ├─── 1. Fetch project photos from DB (already done, improving)
         ├─── 2. Call ai-property-video-ad edge function
         │         ├── Generate AI voiceover SCRIPT (Lovable AI / Gemini)
         │         ├── Call ElevenLabs TTS → return audio blob URL
         │         └── Return: script + audio_url + location_image_url
         │
         ├─── 3. Inject photo clips into Video track (with transitions between each)
         ├─── 4. Inject AI-generated voiceover into Voiceover track
         ├─── 5. Inject lower-third text clip (name, price, beds, location)
         └─── 6. Rename project → "Property Name - Video Ad"
```

---

## 1. New Edge Function: `ai-property-video-ad`

**File:** `supabase/functions/ai-property-video-ad/index.ts`

This function does two things in one call:

### Step A — Generate Voiceover Script (Lovable AI, zero credits for non-TTS)
Uses `LOVABLE_API_KEY` with `google/gemini-3-flash-preview` to write a professional property voiceover script in the target language. Prompt includes:
- Property name, developer, location, emirate
- Price range, bedroom types, amenities (if any)
- Payment plan (if available)
- Tone: luxury, professional, or urgent (user-selected)
- Language: any of the 28 supported languages
- Duration hint: 30s / 60s / 90s script length

### Step B — Generate TTS Audio (ElevenLabs, existing key `ELEVENLABS_API_KEY`)
After script is generated, calls ElevenLabs TTS with the chosen voice ID and `eleven_multilingual_v2` model. Returns audio as base64 so it can be played and added to the timeline as a blob URL.

**Key:** ElevenLabs is ALREADY connected with `ELEVENLABS_API_KEY` — the existing `voice-studio-tts` function already uses it. This is an existing credit allocation, not a new one. The TTS is the standard permitted use.

**Input body:**
```typescript
{
  projectId: string;           // to fetch full project details from DB
  language: string;            // 'en', 'ar', 'hi', etc.
  voiceId: string;             // ElevenLabs voice ID
  tone: 'luxury' | 'casual' | 'urgent';
  scriptDuration: 30 | 60 | 90;  // seconds
}
```

**Output:**
```typescript
{
  script: string;              // the generated voiceover text
  audioBase64: string;         // ElevenLabs mp3 as base64
  audioDurationEstimate: number;  // seconds (chars / 15 approximation)
  locationImageUrl?: string;   // Google Static Map URL for the location
}
```

---

## 2. Enhanced `ProjectIntegrationPanel.tsx`

### New UI: "Generate Video Ad" Wizard

When user clicks on a project card, instead of immediately generating, it opens an **inline wizard panel** (replacing the card grid) with:

**Step 1 — Project Summary** (auto-filled from DB):
- Project thumbnail, name, location, price, beds shown as a read-only card

**Step 2 — Voice & Language Settings**:
- Language selector (all 28 languages, searchable)
- Voice selector (14 ElevenLabs voices with gender label)
- Tone selector: Luxury / Professional / Urgent
- Script length: 30s / 60s / 90s

**Step 3 — Ad Style**:
- Format: Reels (9:16) / YouTube (16:9) / Square (1:1)
- Transitions: Fade / Slide / Zoom between photos
- Text style: Lower-third / Bold overlay / Clean

**Generate Button** → calls edge function → shows a 3-step progress indicator:
1. "Writing script..." (Gemini generating)
2. "Generating voiceover..." (ElevenLabs TTS)
3. "Assembling timeline..." (client-side)

**After generation:**
- Shows the generated script in a read-only textarea (user can copy it)
- Shows an inline `<audio>` player to preview the voiceover before adding
- Shows "Add to Timeline" button
- Adds to timeline: photos + transitions + text clip + voiceover audio

### URL Import Feature
At the top of the panel, a text input: **"Paste a property link or project URL"**
- If the URL matches an internal project path (e.g. `/properties/slug`), it extracts the slug and looks up the project in DB
- For external URLs, shows a message: "External URL import requires the web scraper — coming soon"
- This keeps scope manageable without requiring Firecrawl for now

---

## 3. Timeline Integration (in `AIVideoStudio.tsx`)

The `onCreateVideoAd` callback is extended to also accept a `voiceover` object:

```typescript
interface VideoAdResult {
  clips: VideoAdClip[];
  voiceover?: {
    audioBase64: string;
    duration: number;
    script: string;
  };
  projectName: string;
  transitions?: string; // 'fade' | 'slide-left' | 'zoom-in'
}
```

When voiceover is present, it is decoded from base64 into a `Blob`, converted to an object URL, and added to the **Voiceover track** (type: `voiceover`). If a voiceover track does not exist yet, one is created automatically.

Transitions are auto-inserted between each photo clip on the Video track.

---

## Files to Create / Edit

| File | Action | Description |
|------|--------|-------------|
| `supabase/functions/ai-property-video-ad/index.ts` | **CREATE** | New edge function: AI script + ElevenLabs TTS |
| `src/components/ai-video-studio/features/ProjectIntegrationPanel.tsx` | **REWRITE** | Full wizard UI: voice/language/tone/format picker + URL input |
| `src/components/ai-video-studio/AIVideoStudio.tsx` | **EDIT** | Extend `onCreateVideoAd` to handle voiceover blob + auto-add voiceover track |

---

## Credit & Key Policy

| Service | Key | When Used | Credit Impact |
|---------|-----|-----------|---------------|
| Lovable AI (Gemini Flash) | `LOVABLE_API_KEY` | Script writing | Lovable platform credits (minimal) |
| ElevenLabs TTS | `ELEVENLABS_API_KEY` | Audio generation | ElevenLabs character credits (expected, standard TTS use) |

**No new API keys are required.** All keys are already configured in the project.

---

## What Will NOT Be Built (Scope Limit)

- External Instagram link video cloning (separate feature, requires video scraping)
- Talking head / AI avatar video (separate feature, requires video model)
- Real Google Maps API static map (requires a Google Maps API key — not configured; will use a placeholder gradient map tile instead)

---

## Summary of User-Visible Result

After this build, the user can:
1. Open the **Projects** tab in the AI Video Studio
2. Click any real estate project card
3. Pick language (Arabic, English, Hindi, etc.), voice, tone, and ad format
4. Click **Generate Video Ad**
5. The studio writes a multilingual voiceover script, generates TTS audio, and assembles a complete slideshow with transitions, text overlays, and voiceover into the timeline — all automatically
6. Preview the voiceover before committing
7. Export the finished ad to Reels, YouTube, or Square format
