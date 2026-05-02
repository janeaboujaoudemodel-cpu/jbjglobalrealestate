# Media Ingestion Hub — Full Repair, Upgrade & End-to-End Test

## Bugs identified during audit

1. **Active tab name disappears / black tile beside cream tile**
   `MediaIngestionHub.tsx` uses `data-[state=active]:bg-[#1A1A1A] data-[state=active]:text-gold` on every `TabsTrigger`. The just-shipped global gold-fill debrand repaints `text-gold` on dark surfaces and ends up clashing with the cream sibling tabs — the active label visually disappears. This is the contrast horror you're seeing.
2. **Layout isn't truly centered**
   The page wrapper applies `[body.jj-vertical-nav-active_&]:md:pl-[200px]` and then `max-w-7xl mx-auto` *inside* the offset container, so on wide screens content reads as left-shifted. The drop zone itself has no max width, so it stretches end-to-end.
3. **PDF upload "did nothing"**
   Three layered causes:
   - `bucket ingestion-staging` has no `file_size_limit` and no `allowed_mime_types`, so any silent storage rejection bubbles up only as a single toast and the user sees nothing else.
   - Storage RLS only allows `admin`, `owner`, or `listing_admin`. Users without one of those roles get a 403 on upload and currently see only `Upload failed: <name>`.
   - `useMediaIngestion.uploadFiles` calls `await classify(created)` but never surfaces the result; if the classify edge function 401s/500s, the job sits in `pending` forever and the UI shows nothing actionable.
4. **No progress visibility per file**
   No per-file row appears until insert + classify both finish. With one PDF the user waits with no feedback.
5. **No "Merge vs Extract" choice**
   Today, `Approve & merge` always attaches the file to a target table (`project_documents` / `project_videos` / `project_images`) so the file becomes visible on the listing. There's no "extract-only" path that enriches the listing's metadata without exposing the source file.
6. **Edge-function input not validated with Zod**, no rate guard, no batch size cap on the client side — risky at 100 files.
7. **`IngestionCard` "Skipped" badge** uses `bg-zinc-200 text-zinc-700` — same-tone contrast issue per project rules (no raw grays).

## Scope of fix

### A. UI / contrast / layout (`src/pages/admin/MediaIngestionHub.tsx`, `BulkToolbar.tsx`, `IngestionCard.tsx`, `DropZone.tsx`)

- Replace the black-and-gold active tab with the locked **cream + 1px gold underline + ink bold** active state from the No Gold Fills standard. Inactive tabs get the standard champagne surface with ink text.
- Center the page properly: wrap the offset container in a flex layout so `max-w-5xl mx-auto` truly centers regardless of sidebar state. Drop zone gets `max-w-3xl mx-auto`.
- Replace zinc/red/amber pill colors in `IngestionCard` with the project's semantic tones (emerald/amber/red/blue) on cream backgrounds with ink text and 1px tone-matched borders.
- Replace `bg-purple-600 text-white` AI badge with the project's AI-purple system class.
- Remove the in-card black tile with gold icon — switch to `<IconTile tone="gold" />` so the global champagne-debrand applies automatically.
- Fix `BulkToolbar` "destructive" variant — currently aliased to primary; show a clear ink-on-cream danger style with red icon.

### B. Per-file progress + error visibility (`useMediaIngestion.ts`)

- Insert the job row **before** the storage upload starts (status `pending`, file_path null) so the row appears immediately in the queue with a progress indicator. Update with `file_path` after upload succeeds, mark `error` with a human-readable `last_error` field if upload fails.
- Wrap each upload in a try/catch that records the storage error code (RLS, MIME, size) into the job row's `last_error` (new column).
- Per-file toast on failure citing the actual reason (e.g., "You need owner / listing-admin access to upload").
- Cap client-side batches at 100 files; if more are dropped, queue them in 100-file chunks and run classify in parallel batches of 10.

### C. New "Merge vs Extract" choice

- Add a column `merge_mode` to `material_ingestion_jobs` (enum: `attach` (default, current behavior) | `extract`).
- New buttons on `IngestionCard` and `BulkToolbar`:
  - **Approve & Attach** — current merge behavior; file shows on the listing.
  - **Extract Only** — runs the AI extractor and writes ONLY structured fields (price hints, bedroom counts, handover dates, payment plan summary, brochure highlights) into `projects.metadata` (jsonb), without ever inserting into `project_documents` / `project_videos` / `project_images`. Source file is moved into a private `ingestion-archive` bucket (not public) and the public listing never references it.
- Update `media-ingestion-merge` edge function to branch on `merge_mode`. For `extract`, call the existing AI gateway with a structured-output schema for project metadata (price min/max, bedrooms, handover date, payment plan, key amenities, summary), then write to `projects.metadata->>'ai_enrichment'`.

### D. Edge function hardening (`media-ingestion-classify`, `media-ingestion-merge`)

- Validate inputs with Zod (`{ job_ids: z.array(z.string().uuid()).min(1).max(100) }`).
- Verify caller has `owner` | `admin` | `listing_admin` role server-side; return 403 otherwise.
- Use a real PDF text extractor (`https://esm.sh/unpdf`) instead of the regex hack. Cap at 15 MB / 40k chars.
- For poor-quality extraction (<500 chars and <100 letters), mark `needs_ocr: true` on the job; OCR can be added later but the job won't silently fail.
- Run AI matching in parallel with `Promise.allSettled` (concurrency 5) so 100 jobs finish in seconds, not minutes.
- Return per-job `{ jobId, status, error?, used_ocr? }` in the response body so the client can surface failures inline.

### E. Storage hardening (SQL migration)

- Set `ingestion-staging` bucket to:
  - `file_size_limit = 524288000` (500 MB — covers brochures + short videos)
  - `allowed_mime_types` = pdf, video/*, image/*, ppt(x), doc(x)
- Create new private bucket `ingestion-archive` for "extract-only" sources (admin/owner/listing_admin SELECT/INSERT only).
- Add `last_error text` and `merge_mode text default 'attach'` columns on `material_ingestion_jobs`.

### F. End-to-end tests **before reporting done**

After implementation, in default mode I will:
1. Run `bunx vitest run` for any existing ingestion tests + add one happy-path Vitest covering the hook's optimistic insert.
2. Deploy edge functions and `supabase--curl_edge_functions` against `media-ingestion-classify` with synthetic UUIDs to confirm 401/403/400 paths, then 200 with a fixture job.
3. Use the browser tool to:
   - Open `/admin/media-ingestion`, verify centering, verify all 3 tabs read cleanly with the new active style, screenshot.
   - Drop a real test PDF (the user's logged-in session is reused). Wait for classify, verify the row appears with a status badge.
   - Click **Extract Only** on a job, confirm `projects.metadata.ai_enrichment` is written and that `project_documents` is NOT touched (via `supabase--read_query`).
   - Click **Approve & Attach** on a different job, confirm a row appears in `project_documents` and the file is in `project-documents` bucket.
4. Stress test: programmatically insert 100 fixture rows pointing at the same staging file, invoke classify in one batch, and confirm all 100 transition out of `pending` within 60s and distribute across the right developers/projects.

## Files to change

**Frontend**
- `src/pages/admin/MediaIngestionHub.tsx` — tabs, layout, centering
- `src/components/listing-admin/media-ingestion/DropZone.tsx` — IconTile, max-width
- `src/components/listing-admin/media-ingestion/IngestionCard.tsx` — semantic badges, IconTile, Merge/Extract buttons, error surfacing
- `src/components/listing-admin/media-ingestion/BulkToolbar.tsx` — Merge/Extract split, real destructive style
- `src/hooks/useMediaIngestion.ts` — optimistic insert, batched classify, error capture, `extractOnly()` action

**Backend**
- `supabase/functions/media-ingestion-classify/index.ts` — Zod, role check, unpdf, parallel, per-job result
- `supabase/functions/media-ingestion-merge/index.ts` — Zod, role check, `merge_mode` branch, extract-only path writing to `projects.metadata`
- New SQL migration:
  - `alter table material_ingestion_jobs add column last_error text, add column merge_mode text default 'attach' check (merge_mode in ('attach','extract'))`
  - `update storage.buckets set file_size_limit=524288000, allowed_mime_types=array['application/pdf','video/mp4','video/quicktime','video/webm','image/jpeg','image/png','image/webp','application/vnd.openxmlformats-officedocument.presentationml.presentation','application/vnd.openxmlformats-officedocument.wordprocessingml.document'] where id='ingestion-staging'`
  - Create `ingestion-archive` bucket + RLS

**Tests**
- `src/hooks/__tests__/useMediaIngestion.test.ts` — optimistic-insert + error-capture
- (Functional QA done via curl + browser tool, not as code)

## What stays unchanged

- `media-ingestion-rollback` (still works for `attach` merges).
- The realtime channel subscription.
- All other admin pages and routes.
- The CRM / listing pages — the new `metadata.ai_enrichment` surface is additive.

## Memory updates after merge

- Add memory `mem://features/listing-admin/media-ingestion-hub-standard` documenting: optimistic insert, attach vs extract modes, role gating, bucket config, 100-file batch behavior.
- Index entry alongside the existing Provident Portal standard.
