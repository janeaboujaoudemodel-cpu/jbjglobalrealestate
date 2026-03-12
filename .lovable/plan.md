

## Plan: Full Suite Upgrade — Voice/Audio, Brochure, PDF, Photo, Video + Book Creator

This is a very large scope covering 6 major areas. I will break it into **4 implementation phases** to be executed sequentially.

---

### Phase 1: Voice & Audio Suite — Premium Overhaul + ElevenLabs Owner Integration

**Current state**: `VoiceSuite.tsx` has 4 tabs (TTS, Voice-to-Text, Enhance, Translate). Uses browser Web Speech API for users. ElevenLabs edge functions exist (`voice-studio-tts`, `voice-studio-clone`, `voice-to-text`, `elevenlabs-sfx`).

**Changes**:

1. **Deploy & upgrade edge functions**: Ensure `voice-studio-tts`, `voice-studio-clone`, `voice-to-text`, `elevenlabs-sfx` are all in `config.toml` with `verify_jwt = false` and use latest CORS headers.

2. **Redesign `VoiceSuite.tsx`**: Premium champagne-gold/dark UI matching suite standards. Add more tabs:
   - Voice Studio (TTS) — existing
   - Voice-to-Text — existing
   - Audio Enhance — upgrade with: noise removal, background removal, voice isolation, volume boost, format conversion (MP3/WAV/OGG/FLAC), quality selector (128/192/320kbps)
   - Audio Effects — new: reverb, echo, pitch shift, speed change with live preview
   - Voice Cloning — owner-only tab (hidden for regular users), uses ElevenLabs
   - AI Translation — existing, upgraded with more languages

3. **Premium UI overhaul**: Centered waveform/audio preview, matching gold theme. Remove old basic icons, use premium gradient cards. All controls (tone, style, speed, pitch) reflect live in the centered preview player. Play button on every generated audio.

4. **Owner-only ElevenLabs tabs**: Use `useAuth()` `isOwner` check. Voice Cloning tab + premium TTS with ElevenLabs voices only visible to owner. Regular users see Web Speech API version.

5. **AI Prompt integration**: Add "AI Script Writer" button on each tab that invokes `ai-agent-script-writer` to generate scripts before TTS.

| File | Change |
|------|--------|
| `src/pages/toolkit/VoiceSuite.tsx` | Major redesign, add tabs, premium UI, owner-only sections |
| `supabase/config.toml` | Ensure all voice functions registered |
| Edge functions | Verify/upgrade CORS and models |

---

### Phase 2: Brochure Generator — Full Project Integration + Presentation Builder

**Current state**: `BrochureGeneratorPage.tsx` (788 lines) has project DB selector but shows projects as text only. Basic 4-theme system.

**Changes**:

1. **Project selector upgrade**: When clicking "Select Property", show a rich dropdown with project photos (from `project_images` table), developer name, area, price range — not just names. Load project images alongside metadata.

2. **Presentation mode**: Add option to generate a multi-slide presentation (not just PDF brochure). Integrate with existing `/presentations` system for premium deck output.

3. **Business card / e-signature integration**: Add sections to include/exclude:
   - Business card embed (load from saved designs)
   - E-signature / stamp
   - Email signature footer
   - QR code linking to live project page

4. **Developer auto-fetch**: When a project is selected, auto-fetch developer info (logo, description, founded date) from `developers` table and populate brochure header.

5. **Color customization**: More themes (8+), custom color picker for accent/header colors.

6. **AI full-prompt generation**: Text field where user types a full prompt like "Create premium presentation for Amra by City Developers" → AI generates all content sections, pulls project data, developer data, and structures the brochure.

7. **Download variants**: "Download with business card" / "Download without business card" / "Download with developer branding" / "Download clean version".

| File | Change |
|------|--------|
| `src/pages/toolkit/BrochureGeneratorPage.tsx` | Rich project selector, developer integration, business card/stamp, AI prompt, download variants |
| `supabase/functions/brochure-ai/index.ts` | Upgrade prompt for full presentation generation |

---

### Phase 3: PDF & Documents Suite + Book Creator

**Current state**: `PDFSuite.tsx` has 4 tabs (Editor, Photo→PDF, Scan & Sign, Brochure).

**Changes**:

1. **Add "Book Creator" tab**: New tab for creating multi-page books/brochures:
   - Page count selector (1-200 pages)
   - Front cover designer (title, subtitle, image, gradient bg)
   - Back cover designer
   - Table of contents auto-generation
   - Page templates (title page, content page, image page, chapter divider)
   - Per-page or bulk apply: signature, stamp, business card, watermark
   - Page management: add, delete, duplicate, reorder, merge
   - AI integration: "Auto-generate with AI" button fills content based on prompt
   - Size options (A4, Letter, A5, custom)
   - Export as PDF with page numbers

2. **Upgrade existing PDF editor**: Better preview, wire all tools to backend.

3. **Deploy edge functions**: Ensure `document-extractor`, `document-ocr`, `cover-letter-generator` are deployed.

| File | Change |
|------|--------|
| `src/pages/toolkit/PDFSuite.tsx` | Add Book Creator tab |
| New: `src/components/toolkit/BookCreator.tsx` | Full book creation component |
| Edge functions | Deploy/verify |

---

### Phase 4: Photo Suite + Video Suite + Real Estate Suite Upgrades

**Photo Suite** (`PhotoSuite.tsx` — 5 tabs):
- Premium UI alignment with gold theme
- Wire all tools to backend, ensure edge functions deployed
- Add AI prompt for each tool (e.g., "Generate interior design for this room")

**Video Suite** (`VideoSuite.tsx` — 3 tabs):
- Add "Audio Extract" tab — extract audio from uploaded video
- Add "Voice Over" tab — add voiceover to video (owner: ElevenLabs, users: Web Speech)
- Premium UI matching

**Property Suite** (`PropertySuite.tsx` — 5 tabs):
- Ensure all evaluator/comparison tools are wired and working
- Fix preview colors and text readability

**Corporate Suite** (`CorporateSuite.tsx`):
- Update card descriptions to reflect Document Designer upgrade
- Ensure all tools listed navigate correctly

| File | Change |
|------|--------|
| `src/pages/toolkit/PhotoSuite.tsx` | Premium UI, AI prompts |
| `src/pages/toolkit/VideoSuite.tsx` | Add Audio Extract + Voice Over tabs |
| `src/pages/toolkit/PropertySuite.tsx` | Fix UI, wire backend |
| `src/pages/toolkit/CorporateSuite.tsx` | Update descriptions |

---

### Implementation Order

Phase 1 (Voice Suite) will be implemented first as it was the primary focus of the request. Phases 2-4 follow in subsequent messages.

### Edge Functions to Deploy/Verify

All these must be in `supabase/config.toml`:
- `voice-studio-tts`, `voice-studio-clone`, `voice-to-text`
- `elevenlabs-sfx`, `elevenlabs-podcast-tts`
- `brochure-ai`, `cover-letter-generator`
- `document-extractor`, `document-ocr`
- `ai-agent-script-writer`, `ai-signature-generator`

