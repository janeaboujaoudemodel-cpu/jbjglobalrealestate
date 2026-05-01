## Media Ingestion Hub — bulk drop, AI-match, review, merge

A new admin workspace where you dump **any number of files (videos, PDFs, brochures, fact sheets, presentations) and links**. The AI reads each one, identifies the **developer** and the **project**, and stages an enrichment proposal. You review, multi-select, then approve to merge into the existing published listing.

### Does this exist today?

**No.** Today's tools are partial and not fit for this:
- `ProvidentPortalHub`, `universal-link-extractor`, `firecrawl-scrape` — only handle **URLs/scraping**, not uploaded files.
- `ProjectMediaManager`, `DocumentsManager` — manual, **one project at a time**, no AI matching.
- `material_ingestion_jobs` table exists in the DB but has **no UI, no edge function, no file support** — we'll repurpose and extend it.
- No bulk select / bulk merge / bulk delete / duplicate / skip workflow exists for incoming media.

So this is a **net-new feature** built on top of existing primitives.

---

### What you'll get

A new page at **`/admin/media-ingestion`** (linked from `ListingAdmin`) with three tabs:

1. **Drop Zone** — drag-and-drop or paste links. Mix any combination (50 videos + 30 PDFs + 20 Drive links, etc.). Files upload to a private storage bucket; links queue immediately. A job is created per item.

2. **Staging Queue** — every uploaded item appears as a card with:
   - Thumbnail/preview, filename, size, duration (videos), page count (PDFs)
   - **AI-detected developer** (e.g. "Omniyat") with confidence %
   - **AI-matched project** (e.g. "AVA at Palm Jumeirah") with confidence %
   - Detected document type (`brochure` / `fact_sheet` / `presentation` / `floor_plan` / `payment_plan` / `video_tour` / `unknown`)
   - Status: `processing` → `needs_review` / `auto_matched` / `unmatched` / `merged` / `skipped`
   - Inline editors to override the developer/project/type if AI got it wrong
   - **Bulk toolbar** (always visible when ≥1 selected): Select all / Invert / Approve & merge / Skip / Delete / Duplicate / Re-run AI / Reassign developer / Reassign project / Change type

3. **Merge History** — log of what was merged into which project, by whom, when, with one-click rollback (removes the doc/video rows added by that merge).

---

### How AI matching works

Per item, an edge function pipeline runs:
- **Videos**: extract first/middle/last frames + run audio through `video-transcribe` → feed transcript + frames to Lovable AI (`google/gemini-2.5-flash`) for "which developer + which project is this about?"
- **PDFs**: text extraction (first 10 pages) via `document-extractor` → same AI prompt
- **Links**: `universal-link-extractor` → same AI prompt
- AI receives **the full developer list + project list** (name, aliases, emirate) so it can return a `developer_id` + `project_id` (or `null` + suggested name for new projects)
- Confidence ≥ 0.85 → `auto_matched`; 0.5–0.85 → `needs_review`; < 0.5 → `unmatched`
- Filename heuristics run first as a cheap pre-pass (e.g. `OMNIYAT_AVA_Brochure.pdf`)

### What "merge to listing" does

When you approve a card (or bulk-approve N cards):
- **PDFs/brochures/fact sheets/floor plans** → insert into `project_documents` for the matched project (uses existing `DocumentsManager` schema, including `display_title`, `is_visible`, `allow_download`)
- **Videos** → set `projects.video_url` if empty, otherwise add to a new `project_videos` table (created in the migration)
- **Cover/render images** → insert into `project_images` with the right `display_order`
- Source files keep living in `project-documents` / `project-media` storage buckets — nothing is re-uploaded
- Every merge writes an audit row so rollback is one click

### Bulk automation (your explicit ask)

The toolbar supports, on any multi-select:
- ✅ Approve & merge (only valid for items with a matched project)
- ⏭ Skip (keeps file, marks `skipped`, hidden from default view)
- 🗑 Delete (removes job + file from storage)
- 📑 Duplicate (clones the job — useful when one PDF belongs to two projects)
- 🔁 Re-run AI matching
- ✏️ Reassign developer / project / document type in one go
- ⬇️ Export selected as CSV (filename, developer, project, status)

Filter bar: by developer, by project, by status, by file type, by confidence range, free-text search.

---

### Technical plan

**Storage**
- New private bucket `ingestion-staging` for raw uploads pre-merge
- On merge, files are **moved** (not re-uploaded) into `project-documents` / `project-media` using `storage.move`

**Database migration**
- Extend `material_ingestion_jobs` with: `file_path`, `file_name`, `file_size`, `mime_type`, `duration_seconds`, `page_count`, `detected_doc_type`, `matched_project_id`, `match_confidence`, `developer_confidence`, `ai_summary`, `merge_target` (jsonb), `merged_at`, `merged_by`, `selected` (transient), proper indexes on `(status, user_id)` and `(matched_project_id)`
- New `project_videos` table (project_id, url, title, source_job_id, display_order, is_visible)
- New `media_ingestion_audit` table for rollback (job_id, target_table, target_row_id, action, performed_by, performed_at)
- RLS: owner + listing admins only

**Edge functions (new)**
- `media-ingestion-classify` — runs the AI matching pipeline for a job (or batch)
- `media-ingestion-merge` — moves storage files + writes `project_documents` / `project_videos` / `project_images` rows + audit
- `media-ingestion-rollback` — undoes a merge using the audit table

**Frontend**
- New page `src/pages/admin/MediaIngestionHub.tsx` + components in `src/components/listing-admin/media-ingestion/`:
  `DropZone.tsx`, `StagingQueue.tsx`, `IngestionCard.tsx`, `BulkToolbar.tsx`, `MatchEditor.tsx`, `MergeHistory.tsx`
- Hook `useMediaIngestion.ts` (list, mutate, bulk actions, realtime via existing Supabase realtime channel)
- Route registered in `src/routes/AdminRoutes.tsx` under `OwnerGuard` + `ListingAdminGuard`
- Entry tile added to `ListingAdmin.tsx` next to `ProvidentPortalHub`

**Design**
- Champagne surfaces, gold accents, IconTile for status, `--price-orange` reserved for prices only, AI badges in vivid purple per the AI Premium Purple standard
- Strict no-removal: existing `ProjectMediaManager`, `DocumentsManager`, `ProvidentPortalHub` stay untouched

**Out of scope (this round)**
- OCR'ing handwriting in scanned PDFs (uses standard text extraction; we can add OCR fallback later)
- Auto-creating brand-new projects from unmatched files (kept as a manual "Promote to new project" button — safer)

After approval I'll switch to build mode and ship it end-to-end.
