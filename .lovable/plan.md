## Goal

Bring all 15 books in Broker Learning → Library to premium standard:
- Unique premium cover per book, locked to its exact title.
- Rich, government-aligned UAE market knowledge inside each book (DLD, RERA, DET, ADGM/DIFC, Bayanat, statistics centres).
- Proper table of contents, readable reader UI, and audio-ready structure (ElevenLabs toggle, no voice yet).

Scope is Broker Learning Library only. No other features removed or changed.

---

## 1. Premium covers (locked to title)

For each of the 15 books generate a premium cover image and persist the URL in `broker_education_books.cover_image_url`.

- Style: dark navy/obsidian leather with champagne `#B89555` foil, gold serif title, JBJ monogram, subtle UAE skyline motif relevant to the title topic. Matches existing book hero style (`src/assets/books/broker-education-cover.jpg`).
- One generation per title using Lovable AI image model; saved to Supabase Storage bucket `broker-education-covers/{book_number}-{slug}.jpg`.
- "Locked" = cover URL is written once into the DB and the card/modal always renders that exact URL. Cards no longer fall back to placeholder when a real cover exists.
- Script `scripts/generate-broker-book-covers.ts` runs the generation per title so we can re-run on demand.

## 2. Premium content per book (government + market data)

For each book, generate authoritative content using Lovable AI grounded on a curated source list (per-book prompt):
- DLD (dubai land department), RERA regulations, Trakheesi, Ejari, Oqood, DET tourism rules, ADGM/DIFC commercial law, Dubai Statistics Center, Bayanat AE, MoEC, Central Bank UAE mortgage caps, Dubai 2040 Urban Master Plan, DLD transaction indices.
- Cross-checked with current 2025/2026 market intelligence already in `market_*` tables when available.

Each book gets:
- Refined description (institutional tone, 1–2 sentences).
- Learning objective.
- 5–8 modules. Each module has: title, 600–1200-word body in clean HTML (h2/h3/p/ul/blockquote/table), key takeaways, citations footer (DLD/RERA links), estimated_minutes.
- Auto-generated table of contents derived from modules + h2/h3 anchors.

Data is written via a one-time content-population script (`scripts/populate-broker-book-content.ts`) into existing `broker_education_books` and `broker_education_modules` tables. No destructive deletes — upsert by `(book_id, module_number)`.

## 3. Reader experience (readable + audio-ready)

Upgrade `BookDetailModal` into a full premium reader route `/broker/learning/book/:bookId`:
- Left rail: sticky TOC (auto-built from modules + headings), progress dots.
- Center: champagne paper background, ink type (Inter), generous measure, sanitized HTML via existing `contentSanitizer.ts`.
- Top bar: title, learning path chip, est. reading time, progress bar, "Mark complete" per module.
- Audio toggle in header ("Listen") — visible to all users but disabled with tooltip "Voice narration coming soon" unless `voice_enabled = true` on the book AND a `LISTEN_ENABLED` global flag is on. Wires through a stub `useBookAudio(bookId)` hook ready for ElevenLabs.
- Existing modal stays as the quick-preview; "Open Book" CTA navigates to the reader route.

## 4. Owner-only ElevenLabs toggle (no voice yet)

- Migration: add `voice_enabled boolean default false`, `voice_id text`, `voice_provider text default 'elevenlabs'` to `broker_education_books`; add settings row `listen_enabled boolean default false` in existing `app_settings` (or create if missing) gated to owner.
- New owner page `/owner/broker-learning/voice` (under existing OwnerGuard) listing 15 books with:
  - Master "Enable Listen feature" switch (writes `listen_enabled`).
  - Per-book voice toggle + voice picker (read-only list of ElevenLabs voice IDs; persists `voice_id`).
  - Helper text: "Voice generation is not yet active. Toggling prepares the book for future ElevenLabs narration."
- No edge function calling ElevenLabs is added now. The UI + schema are the forward seam.

## 5. Card/modal lock-in

- `Book3DCard` + `BookCard`: always render `cover_image_url` when present; placeholder only when DB cover is genuinely null. Add `loading="lazy"` and width/height to prevent layout shift.
- Title and description shown on cards come from DB (already true) so the regenerated content flows everywhere automatically.

---

## Technical summary

Files to add:
- `scripts/generate-broker-book-covers.ts` — calls Lovable AI image, uploads to storage, updates `cover_image_url`.
- `scripts/populate-broker-book-content.ts` — per-book prompt → modules upsert.
- `src/pages/broker/BookReader.tsx` — full reader route.
- `src/hooks/useBookAudio.ts` — stub; returns `{ available:false, reason:'coming_soon' }`.
- `src/pages/owner/BrokerLearningVoiceAdmin.tsx` — owner toggle UI.

Files to edit:
- `src/components/broker-education/BookDetailModal.tsx` — TOC preview, "Open Book" → reader route, listen-toggle stub.
- `src/components/broker-education/Book3DCard.tsx`, `BookCard.tsx` — strict cover binding.
- `src/hooks/useBrokerEducation.ts` — expose `voice_enabled`, `voice_id` fields.
- `src/routes/PublicRoutes.tsx` — register `/broker/learning/book/:bookId` (auth+broker gate) and owner admin route.

DB migration:
- Storage bucket `broker-education-covers` (public read).
- `broker_education_books`: add `voice_enabled`, `voice_id`, `voice_provider`.
- `app_settings`: add `listen_enabled` (owner-only RLS).
- No table drops, no schema renames — additive only.

Out of scope:
- Real ElevenLabs API calls / audio generation.
- Any change outside Broker Learning Library.
