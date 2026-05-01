
## Media Ingestion Hub — does it exist? **No.** I'll build it.

You currently have **no system** that does what you described. Today's tools are partial:
- `ProvidentPortalHub` + `universal-link-extractor` → links only, no file uploads
- `ProjectMediaManager` / `DocumentsManager` → manual, one project at a time, no AI matching
- `material_ingestion_jobs` table → empty scaffold, no UI, no edge functions, no file support
- No bulk select / approve / merge / skip / delete workflow anywhere

So this is **net-new** and I'll build it end-to-end.

---

## What you'll get

A new admin workspace at **`/admin/media-ingestion`** (linked from `ListingAdmin`, gated by `OwnerGuard` + listing-admin role) with three tabs.

### 1. Drop Zone
- Drag-and-drop **any number** of files at once (videos, PDFs, brochures, fact sheets, presentations, floor plans, images) **mixed with pasted links** (Drive, Dropbox, developer portals, YouTube, Vimeo)
- No per-file cap; files upload in parallel to a private `ingestion-staging` bucket
- Each file/link becomes one job in the queue; processing starts immediately

### 2. Staging Queue (the heart of it)
Every item shows as a card with:
- Thumbnail/preview, filename, size, duration (videos), page count (PDFs)
- **AI-detected developer** (e.g. "Omniyat") + confidence %
- **AI-matched project** (e.g. "AVA at Palm Jumeirah") + confidence %
- Detected document type: `brochure` / `fact_sheet` / `presentation` / `floor_plan` / `payment_plan` / `video_tour` / `render` / `unknown`
- Status badge: `processing` → `auto_matched` / `needs_review` / `unmatched` / `merged` / `skipped`
- Inline editors to override developer / project / type if AI got it wrong
- Checkbox for multi-select

**Bulk toolbar** (always visible when ≥1 selected):
- Select all / Invert selection
- ✅ **Approve & merge** (only valid when matched to a project)
- ⏭ Skip (keep file, hide from default view)
- 🗑 Delete (remove job + storage file)
- 📑 Duplicate (when one PDF belongs to two projects)
- 🔁 Re-run AI matching
- ✏️ Reassign developer / project / document type in one go
- ⬇️ Export selected as CSV

**Filter bar:** developer, project, status, file type, confidence range, free-text search.

### 3. Merge History
Log of every merge (what → which project, by whom, when) with **one-click rollback** that removes the docs/videos/images that merge created.

---

## How AI matching works

For each item, an edge function pipeline runs:
- **Filename heuristics** first (cheap pre-pass, e.g. `OMNIYAT_AVA_Brochure.pdf` → instant match)
- **Videos**: extract first/middle/last frames + audio transcript → feed to Lovable AI (`google/gemini-3-flash-preview`)
- **PDFs**: extract first 10 pages of text → same AI prompt
- **Links**: `universal-link-extractor` → same AI prompt
- The AI receives the **full developer list + project list** (with aliases & emirates) and returns `developer_id`, `project_id`, `doc_type`, and confidence scores
- Confidence ≥ 0.85 → `auto_matched`; 0.5–0.85 → `needs_review`; < 0.5 → `unmatched`

## What "merge to listing" does

When you approve (single or bulk):
- **PDFs / brochures / fact sheets / floor plans / payment plans** → inserted into `project_documents` for the matched project (respects existing `display_title`, `is_visible`, `allow_download`)
- **Videos** → set `projects.video_url` if empty, otherwise added to new `project_videos` table (multiple videos per project, ordered)
- **Renders / cover images** → inserted into `project_images` with proper `display_order`
- Files **moved** (not re-uploaded) from `ingestion-staging` into `project-documents` / `project-media`
- Every merge writes an audit row → rollback is one click

---

## Technical plan

**Storage**
- New private bucket `ingestion-staging` (raw uploads, pre-merge)
- On merge: `storage.move` into `project-documents` / `project-media`

**Database** (migration already approved earlier in this thread)
- Extend `material_ingestion_jobs`: `file_path`, `file_name`, `file_size`, `mime_type`, `duration_seconds`, `page_count`, `detected_doc_type`, `matched_project_id`, `match_confidence`, `developer_confidence`, `ai_summary`, `merge_target` (jsonb), `merged_at`, `merged_by`
- New `project_videos` table (project_id, url, title, source_job_id, display_order, is_visible)
- New `media_ingestion_audit` table (job_id, target_table, target_row_id, action, performed_by, performed_at) for rollback
- RLS: owner + listing admins only

**Edge functions (new)**
- `media-ingestion-classify` — runs the AI matching pipeline for a job (or batch)
- `media-ingestion-merge` — moves storage files + writes `project_documents` / `project_videos` / `project_images` rows + audit
- `media-ingestion-rollback` — undoes a merge using the audit table

**Frontend**
- `src/pages/admin/MediaIngestionHub.tsx`
- `src/components/listing-admin/media-ingestion/`: `DropZone.tsx`, `StagingQueue.tsx`, `IngestionCard.tsx`, `BulkToolbar.tsx`, `MatchEditor.tsx`, `MergeHistory.tsx`, `FilterBar.tsx`
- `src/hooks/useMediaIngestion.ts` (list, mutate, bulk actions, realtime via Supabase channel for live status updates)
- Route registered in `AdminRoutes.tsx` under `OwnerGuard` + listing-admin guard
- Entry tile added to `ListingAdmin.tsx` next to Provident Portal

**Design**
- Champagne surfaces, gold accents, IconTile for status, AI badges in vivid purple per the AI Premium Purple standard, prices untouched (`--price-orange` reserved)
- **No-removal rule respected**: existing ProjectMediaManager, DocumentsManager, ProvidentPortalHub stay fully intact

## Out of scope (this round)
- OCR for handwritten scanned PDFs (uses standard text extraction; OCR fallback can be added later)
- Auto-creating brand-new projects from unmatched files — kept as a manual "Promote to new project" button (safer, prevents duplicate listings)

---

Once you approve, I'll switch to build mode and ship the storage bucket, the three edge functions, the page, all components, the hook, the route registration, and the ListingAdmin tile in a single pass.
