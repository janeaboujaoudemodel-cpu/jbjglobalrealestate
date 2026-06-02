# Plan — Measurement E2E → News/Market Intel Neon → Guides Library Book Reader

Three workstreams, executed strictly in this order. Each ends with a visual E2E pass (screenshots + user-perspective click-through) before moving on.

---

## 1. Property Measurement — Full E2E (FIRST, BLOCKING)

Goal: a broker can open `/property-measurement`, run the full flow, get AI results, and download a branded PDF — no broken steps.

### Edge function
- `supabase/functions/property-measurement-analyze/index.ts`
  - Accepts `{ propertyType, propertyInfo, mediaUrls[] }`.
  - Calls Lovable AI Gateway `google/gemini-2.5-pro` (vision) with structured tool call → returns `{ rooms:[{name, lengthM, widthM, areaSqm, areaSqft, ceilingM, notes}], totals:{areaSqm, areaSqft}, summary, confidence }`.
  - CORS + 429/402 handling + zod validation.
  - Deploy and curl-test with a sample image URL before wiring UI.

### Storage
- Bucket `measurement-uploads` (private), RLS: authenticated users can upload/read their own folder.

### Frontend flow (`src/pages/PropertyMeasurement.tsx` + new `src/components/measurement/*`)
- Step 1: property type tiles (emerald→black ombré, already styled) + basic info form.
- Step 2: drag/drop multi-image + video uploader → uploads to `measurement-uploads`, shows thumbnails + remove.
- Step 3: "Analyze" CTA → invokes edge function, shows neon progress state.
- Step 4: results table (sq m / sq ft toggle, per-room rows, totals row, AI summary, confidence chip), all readable (ombré-white on dark surfaces).
- Step 5: "Download Branded Report" → calls new `src/lib/measurement/exportMeasurementReport.ts` (jsPDF + autotable, JBJ letterhead cover, table page, AI summary page, signature/footer per `mem://documents/signature-and-gold-divider-lock`).
- "Reset / New Measurement" CTA.

### E2E QA (must pass before moving on)
- Run as logged-in broker on `/property-measurement`.
- Upload 2 sample images → Analyze → verify rooms render → toggle units → download PDF → open PDF and confirm cover + table + signature block.
- Screenshot every step. Capture console + network for errors. Fix root causes, re-run.

---

## 2. News & Insights + Market Intelligence — Neon Premium Restyle

Only after step 1 is verified.

### News & Insights
- Magazine-style hero (featured story with neon glow underline), 3-column grid below, animated gradient hairlines between rows.
- Category chips with neon cyan/magenta accent on active.
- Card hover: glow drop-shadow + 1px gradient border, ombré-white body text on dark glass surface.
- Reading view: large serif-free title, ombré-white body, neon pull-quotes.

### Market Intelligence
- Dashboard of glowing KPI tiles (cyan/magenta/violet accents per metric class — price, supply, demand, yield).
- Dark glass cards (`backdrop-blur` + 1px gradient ring), ombré-white body copy.
- Charts: Recharts with neon stroke palette, no gray gridlines (use faded gold per memory).
- Fix all current contrast issues (audit each section, replace any low-opacity white-on-light or dark-on-dark).

### QA
- Walk both pages as a user, screenshot each section, confirm readability at 1178px and mobile.

---

## 3. Guides Library — Real Book Reader with Neon Themes + Audio

Only after steps 1 & 2 are verified.

### Concept
Each guide opens as a **real book**: cover → chapter list → paged spread (page 1 / page 2 visible side-by-side on desktop, single page on mobile), with page-turn animation, "Chapter X · Page Y of N" footer, and a voice button that reads the page aloud.

### Per-book theming
Each book gets its own neon palette + header treatment derived from its topic (e.g. Investment Guide = cyan/violet, Off-Plan Guide = magenta/gold-neon, Mortgage Guide = emerald/cyan, Legal Guide = navy/violet, Brokerage Guide = amber/magenta). Each **page inside a book** rotates accent color across a curated 3–4 color set for that book, so flipping feels alive but on-brand.

### Components (new under `src/components/guides/reader/`)
- `BookCover.tsx` — neon spine + title + author + "Open Book" CTA.
- `ChapterIndex.tsx` — table of contents with neon hover, jump to chapter/page.
- `BookSpread.tsx` — 2-page spread on desktop, 1-page on mobile, framer-motion page-turn (3D rotateY) with paper texture.
- `PageChrome.tsx` — per-book header band, chapter title, page number footer, neon hairline.
- `VoiceReaderBar.tsx` — Play / Pause / Stop, voice select, speed, progress; reads current page text.
- `BookThemeProvider.tsx` — supplies palette + per-page accent rotation.

### Audio (TTS)
- Edge function `guide-read-aloud` → ElevenLabs TTS (per `elevenlabs-tts` knowledge), streams MP3.
- Requires `ELEVENLABS_API_KEY` secret. **Will request via `add_secret` at start of step 3** if not already present.
- Default voice: Sarah (`EXAVITQu4vr4xnSDxMaL`); user can pick from a small curated list.
- Audio is per-page; pausing/turning page stops current audio.

### Data
- Guides already exist in DB. Plan adds (if missing) `guide_chapters` and `guide_pages` tables, or splits existing `content` HTML into pages client-side by heading + length heuristic if schema can't change. **Will inspect current schema first** and pick the lighter option; migration only if needed.

### Routes
- `/guides` — library grid, restyled with neon spines.
- `/guides/:slug` — book reader (cover → spread).

### QA
- Open each guide, flip pages, verify per-page accent rotation, click voice → audio plays, pause/stop works, mobile single-page layout works. Screenshots per book.

---

## Out of scope (for this plan)
- Compare tool / vertical sidebar / mode logic (already handled previously).
- Any backend changes beyond the 2 new edge functions + (maybe) guide pages table + measurement-uploads bucket.

## Execution rules
- Strictly sequential. Do NOT start step 2 until step 1's E2E screenshots pass. Do NOT start step 3 until step 2 passes.
- Every step ends with: real click-through as user, screenshots, console/network check, fix, re-verify.
- No "it's live" claims without a screenshot proving it.
