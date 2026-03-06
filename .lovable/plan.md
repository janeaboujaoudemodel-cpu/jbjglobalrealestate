
## What I found (root causes)
1) **“Extraction failed” + duplicates**
- `pending_project_imports` has **unique indexes** on both `slug` and `source_url`.
- `extract-listing-from-link` only checks for existing rows by **slug** in some paths, but repeated URL runs can still hit **`pending_project_imports_source_url_unique`** and fail instead of updating/merging.
- For **file uploads**, the function currently **overwrites** an existing pending import (same slug) with `source_url = first uploaded file URL`, which can wipe out previously scraped photos/docs (this matches what you’re seeing on Amra: only 1 photo remains).

2) **Broken photos / missing gallery**
- CitiDeveloper images in DB are mostly `/_next/image?url=...` proxy URLs and “broker-kit” assets.
- `SafeImage` forces `referrerPolicy="no-referrer"` which can break some external CDNs / Next.js image proxies (images silently fail).
- The current “broker kit” filtering is too broad in some places (it can remove **renders** you actually want to keep).

3) **“Generated from X uploaded files” is coming from backend**
- File-upload branch in `extract-listing-from-link` sets:
  - `description = "Generated from X uploaded file(s)."` (explicitly not allowed by you)

4) **AI “Project Intelligence” producing wrong emirate/area commentary**
- `ai-property-analyzer` hardcodes “**Dubai**” in system + user prompts, so it can produce Dubai text even for non‑Dubai emirates.

## Your approved global policies (will be enforced)
- **Missing facts policy**: *Strict empty + review flag* (no guessing)
- **URL duplicate behavior**: *Update existing pending* (never fail)
- **Manual priority ranking**: *Pin manual first everywhere*

---

## Implementation Plan (code + backend)

### Phase A — Make extraction never “fail” on duplicates; merge instead of overwrite
**Goal:** Re-submitting the same link or adding files to an existing project should *update/merge* the pending record, not throw errors or wipe data.

1) **Change async job processing to write incremental progress**
- In `supabase/functions/extract-listing-from-link/index.ts`, when `job_id` is present:
  - After each URL (or file batch) finishes, update `listing_extraction_queue.results` with **partial results** and a `processing_count` status message (e.g., `2/5 completed`).
  - This removes the “stuck on processing” feeling.

2) **Duplicate-safe upsert by `source_url` + merge media**
- In URL extraction branch:
  - Find existing pending import by **`source_url` first** (because it is unique).
  - If exists: **merge** `images[]`, `documents[]`, `video_urls`, `amenities`, etc. (dedupe by URL), and only overwrite scalar fields if the new value is non-null and higher confidence.
  - If not exists: create new pending import.
- This implements your rule: **Update existing pending**.

3) **Stop file uploads from overwriting URL-extracted projects**
- In file upload branch:
  - Use a stable `source_url` like `manual://<userId>/<projectSlug>` (not the first PDF URL).
  - If a pending import for that slug exists, **append** new images/docs instead of replacing existing arrays.
  - Remove the forced description string (“Generated from …”).

**Files:**
- `supabase/functions/extract-listing-from-link/index.ts`
- `src/components/listing-admin/ListingAdminChat.tsx` (surface progress text from queue results)

---

### Phase B — Robust file understanding (PDF/image text extraction) without hallucination
**Goal:** When you upload 9 files, Sarah should actually read them and fill the listing (or leave fields empty + flag review).

1) **Client-side PDF text extraction (fast + scalable)**
- In `ListingAdminChat.tsx` file upload flow:
  - For PDFs: extract text in-browser (using `pdfjs-dist`) and send `documents: [{type:"text", content, name}]` to backend.
  - For scanned/low-text PDFs: if extracted text < threshold, render first 1–3 pages to images (canvas) and send as `image` base64 (bounded to avoid huge payloads).
- This follows the “cascading extraction” pattern and avoids heavy edge-runtime PDF rendering.

2) **Backend AI extraction uses tool-calling + strict “no guessing”**
- Add a new code path in `extract-listing-from-link` (or a dedicated helper) to call Lovable AI with:
  - Tool schema output (structured fields)
  - Strong rules:
    - “If not explicitly present: return null”
    - “If emirate not explicitly present: null”
    - “Never mention Dubai unless the document says Dubai”
- Store:
  - `review_notes` as a JSON string with `missing_fields: [...]` and `evidence_files: [...]`.

**Files:**
- `src/components/listing-admin/ListingAdminChat.tsx`
- `supabase/functions/extract-listing-from-link/index.ts`

---

### Phase C — Global brochure-first rule + strict media classification (photos-only gallery)
**Goal:** Gallery shows only real photos/renders; documents go to documents; brochure is always prioritized.

1) **Global document classification**
- Implement a classifier that assigns doc types:
  - `brochure`, `fact_sheet`, `payment_plan`, `floor_plan`, `inventory`, `price_list`, `eoi`, `other`
- **Brochure priority rule:**
  - If `brochure` exists → use it
  - Else if `fact_sheet` exists → use that in the brochure slot
  - Else → brochure locked / request flow

2) **Fix broker-kit filtering to keep renders**
- Update `src/lib/imageUtils.ts`:
  - Remove/relax the blanket `/broker[-_]?kit/` exclusion.
  - Keep only keyword-based exclusions: `fact sheet`, `brand guideline`, `material board`, `film`, `about`, flags/icons, etc.
  - Ensure **renders/gallery/exterior/interior** stay allowed even if folder name contains “kit”.

3) **Normalize `/_next/image` URLs for filtering + display**
- For CitiDeveloper `/_next/image?url=...`:
  - Convert to an absolute original URL: `https://citideveloper.com<decoded-path>`
  - Store the normalized URL in pending imports so images load reliably and filtering is deterministic.

**Files:**
- `src/lib/imageUtils.ts`
- `supabase/functions/extract-listing-from-link/index.ts`

---

### Phase D — Fix “broken images” (referrer policy) + speed up image loading
1) **Make `SafeImage` referrer policy compatible**
- Change `SafeImage.tsx` default from `no-referrer` to `strict-origin-when-cross-origin` (or only apply `no-referrer` for known internal URLs).
- This fixes external Next.js proxies that reject “no referrer”.

2) **Optimize storage images everywhere**
- Use `optimizeStorageImageUrl()` for cards/hero wherever the URL is from storage, so recommended/search pages load fast.

**Files:**
- `src/components/SafeImage.tsx`
- `src/components/project-detail/RecommendedProjects.tsx` (and any other listing card components using storage images)

---

### Phase E — Remove forbidden UI strings and clean document titles
1) **Remove “Generated from X uploaded files” everywhere**
- Backend: do not set that description.
- Frontend: add a defensive filter that never renders that phrase if it somehow exists in legacy rows.

2) **Clean document titles (no “(1).pdf”, no raw filenames)**
- Implement `humanizeDocTitle(name)`:
  - strip extension, underscores/dashes, trailing “(1)”, collapse spaces
  - title-case
- Apply it:
  - when saving pending import document JSON (`extract-listing-from-link`)
  - when displaying docs in preview + project page

**Files:**
- `supabase/functions/extract-listing-from-link/index.ts`
- `src/pages/listing-admin/PendingImportPreview.tsx`
- `src/components/project-detail/ProjectDetailLayout.tsx`

---

### Phase F — Per-document visibility + per-document download control (backend-managed)
**Goal:** By default everything is visible+downloadable; you can turn off either per document per project.

1) **Schema upgrade (migration)**
Add columns to `project_documents`:
- `is_visible boolean not null default true`
- `allow_download boolean not null default true`
- `display_title text null`
- `cover_image_url text null`
- `storage_path text null` (for private downloads)

2) **Secure downloads via backend**
- Make the documents bucket private (or introduce a private bucket for project docs).
- Add a backend function (edge function) like `download-project-document`:
  - Input: `project_document_id`
  - Check DB flags (`is_visible`, `allow_download`)
  - Return a signed URL or stream file
- Update `maybeProxyStorageUrl` / download flows to use this function.

3) **Admin UI panel**
- In `/listing-admin/preview/:id` add a “Documents Manager” section:
  - toggle Visible
  - toggle Downloadable
  - edit Display Title
  - auto-generate cover for book-style (uses project hero image)

**Files:**
- DB migration (new columns + RLS policy adjustments)
- New backend download function
- `src/pages/listing-admin/PendingImportPreview.tsx`
- `src/components/project-detail/ProjectDetailLayout.tsx`

---

### Phase G — Fix JBJ AI Project Intelligence to avoid “Dubai” hallucinations
**Goal:** If emirate ≠ Dubai or unknown, it must not output Dubai-centric market text.

1) Update `supabase/functions/ai-property-analyzer/index.ts`:
- Change system prompt from “analysis for Dubai” to “analysis for UAE”
- Remove `Analyze ${area}, Dubai...` hardcode
- Add strict rule: if emirate/area is not explicitly Dubai or not recognized → return “Data not available” per section, not made-up stats.

2) Pass `emirate` into the analyzer context from `ProjectDetailLayout.tsx`.

**Files:**
- `supabase/functions/ai-property-analyzer/index.ts`
- `src/components/project-detail/ProjectAIAnalyzer.tsx`
- `src/components/project-detail/ProjectDetailLayout.tsx`

---

### Phase H — Manual projects pinned first (recommended + search)
**Goal:** Your manually uploaded/enriched projects are always first.

1) Set `projects.import_source = 'manual'` on publish when the approved pending import came from file-upload / Sarah manual workflow.
2) Update listing queries/hooks:
- Split results: manual first, then rest (while keeping relevance sorting inside each group).

**Files:**
- Approval pipeline code (`PendingImportCard.tsx` approve path + `ProjectApprovalQueue.tsx` approve path)
- `src/hooks/useProjects.ts` and any search/list pages (e.g., `/properties` implementation)

---

## Data safety / “fake info” audit workflow (with your approval)
1) Create an internal admin audit view:
- “Suspicious fields”:
  - emirate/location mismatch (not in `areas` canonical set)
  - Dubai-only AI analysis shown for non‑Dubai emirate
  - projects with empty developer_id but developer_name present
2) Show a checklist and proposed corrections **without applying** them until you approve.

---

## Screenshots / proof (after implementation)
After changes, I will capture screenshots for:
1) Listing Admin Chat: link submission shows progress (not stuck)
2) File upload: succeeds, produces listing, no “generated from” text
3) Pending preview: both maps (map always, flyover conditional), gallery photos-only
4) Documents Manager: visibility/download toggles working
5) Project detail page: brochure-first fallback + book-style docs strip

---

## Files touched (summary)
- `supabase/functions/extract-listing-from-link/index.ts`
- `src/components/listing-admin/ListingAdminChat.tsx`
- `src/lib/imageUtils.ts`
- `src/components/SafeImage.tsx`
- `src/pages/listing-admin/PendingImportPreview.tsx`
- `src/components/project-detail/ProjectDetailLayout.tsx`
- `supabase/functions/ai-property-analyzer/index.ts`
- Approval codepaths: `src/components/listing-admin/PendingImportCard.tsx`, `src/components/listing-admin/ProjectApprovalQueue.tsx`
- DB migration: `project_documents` columns + RLS policy refinement
- New backend download function for controlled downloads
