
## What’s broken (confirmed from the code + backend data)
### 1) “Drafts” tab shows broken projects (e.g., “Mykonos Lagoons In … No developer / no media”)
- Those entries are coming from an older **Provident auto-import** that **auto-approved** records even when they had **0 images / 0 docs / missing developer**.
- They exist in the database as projects (often `is_published=false`) and therefore appear in the Listing Admin “Projects → Drafts” list.

### 2) “AMRA pending approval” exists but is **INCOMPLETE**
- The pending approval record exists in `pending_project_imports` for AMRA (Citi Developers) with many images but **description is empty**, so it’s flagged `INCOMPLETE`.
- Root cause: URL extraction currently runs AI only when `markdown.length > 100`, but some pages have short markdown (even if HTML is rich). Result: images get detected, but text fields (description, location, etc.) can be null.

### 3) The “card layer is cropped / background not filling after scrolling”
- Listing Admin uses a fixed-height `<main className="h-[calc(100vh-220px)]">` but the “Projects” view doesn’t consistently own the scroll container. This can produce visual “container ends early” effects depending on viewport and content height.

### 4) “Repair shows 0/3 then 25/3”
- The bulk progress UI is mixing **selected count vs. actual processed count** and/or reusing state when filters/pagination refresh. It needs a single, deterministic “itemsToProcess” list per run.

### 5) “JBJ AI Project Intelligence looks fake”
- The Project AI block is **area-based analysis** (`ai-property-analyzer`), so it can still output an “investment rating” even if the project itself is missing data.
- We should **block/disable** this section until the project has minimum verified data (location/area + developer + at least one price or meaningful description).

### 6) E-signature: “Verifying owner access…” feels slow + UI looks outdated/gray
- `/e-signature` is wrapped in `OwnerGuard`, which depends on `AuthContext` owner verification. Even if `verify-owner` is fast, the page can still show the guard loading screen on reload.
- Dashboard UI is not aligned to the “champagne/gold” admin standard.

---

## Phase plan (you chose “Both (phased)”, disable Provident, manual publish only, and e-signature: fix loading + UI)

## Phase 1 — Listing Admin reliability + data quality gates (immediate)
### A) Disable Provident ingestion (stop creating broken projects)
1. **Turn off Provident schedulers and entry points**
   - Identify and disable any cron/scheduled functions that ingest Provident (e.g., `daily-provident-auto-sync`, `provident-*-sync`, `sync-provident-page`, etc.).
   - Remove/disable UI controls that still offer “Provident Only” filtering in approvals.
2. **Remove Provident from approval queue filters**
   - In `ProjectApprovalQueue`, remove `provident` from the source dropdown (or keep only as an internal debug toggle hidden behind owner-only “advanced”).

### B) Quarantine existing broken Provident projects (so you don’t see them)
Goal: You said you do not want to see these at all.
1. Add a “quarantine rule” for projects where:
   - `source_url ilike '%provident%'` OR `import_source='provident'`
   - AND (missing developer OR missing images OR missing description)
2. Apply it in two places:
   - **Backend cleanup (data update):** mark them as hidden/archived (preferred) or keep `is_published=false` and set a `is_hidden=true` flag if the schema supports it.
   - **Frontend filter:** exclude quarantined projects from Listing Admin “Drafts” list entirely.
3. Provide an internal “Quarantined” management view (optional) for bulk delete later, but **not shown by default**.

### C) Manual publish only (enforce “nothing goes live automatically”)
1. **Remove/disable Auto-Approve**
   - In `ListingAdminChat`, remove the Auto-Approve toggle and always queue results as pending approval.
2. **Backend enforcement**
   - In `extract-listing-from-link`, ignore any incoming `auto_approve=true` and force:
     - `pending_project_imports.status = 'pending'`
     - Never call `bulk-approve-imports` automatically
3. **Approval button becomes the single publishing gateway**
   - Only “Approve” moves content into `projects` and sets `is_published=true` (or gives you a “Save Draft” vs “Publish” choice, but default to Draft).

### D) Fix extraction quality (AMRA/Citi pages + uploaded PDFs)
#### D1) URL extraction: don’t depend on markdown-only
- Change the AI trigger from:
  - `if (markdown.length > 100)`  
  to:
  - `if ((markdown + html).length > X)` and feed AI `contentForAI = (markdown + "\n\n" + html)` (truncated safely).
- Result: Citi pages should produce real descriptions and more structured details.

#### D2) File uploads: actually extract from PDFs/images (currently it doesn’t)
Right now uploaded files become “Generated from N uploaded files” with no real extraction.
Implement a cascading extraction strategy for file jobs:
1. For each uploaded PDF:
   - Attempt programmatic text extraction first (lightweight PDF text extraction).
   - If text is minimal, fall back to AI vision processing of the PDF content.
2. For images:
   - Use AI vision extraction for key fields (project name, developer, amenities, payment plan).
3. Merge results across files into one pending import:
   - Prefer “most complete” values; keep provenance.
4. Attach all uploaded assets to the pending import (images + docs) so they appear immediately in the preview.

### E) Fix wrong location / emirate
1. Strengthen validation:
   - If location cannot be matched to canonical `areas`, set `location=null` and mark as `INCOMPLETE` instead of writing a wrong emirate.
2. Add a “Location needs confirmation” UI in the approval preview:
   - Dropdown search against `areas` so you can correct it in 10 seconds.

### F) Listing Admin layout fixes (cropped card layer + scrolling)
1. Make one consistent scroll container:
   - Ensure the “Projects” and “Data Ops” views scroll within `<main>` (e.g., `main: overflow-y-auto` and remove nested conflicting scroll areas).
2. Ensure background shells stretch with content:
   - Move the gradient “shell” wrapper to surround the scroll container, not just the header region.

### G) Repair workflow correctness (progress counters)
1. Compute `itemsToRepair` once per bulk run (snapshot array of IDs).
2. Set:
   - `bulkTotal = itemsToRepair.length`
   - increment `bulkDone` strictly per processed ID
3. Disable filter changes while bulk processing (or cancel the run if filters change).

### H) JBJ AI Project Intelligence: prevent “rating with no data”
1. Add minimum-data gate before showing analyzer:
   - require at least: `(location || area_name)` AND `(developer name)` AND `(price_from OR meaningful description length)`
2. If insufficient:
   - show “Not enough verified listing data to analyze yet. Complete extraction first.”

---

## Phase 2 — E-signature: faster access + UI aligned (your phase-1 scope)
### A) Remove “Verifying owner access…” delay feel
1. Add **session-based owner caching** in `AuthContext`:
   - On successful verify-owner, store a token-tied flag in `sessionStorage`.
   - On reload, if cached=true for the same session token, set `isOwner=true` immediately and run verification in background (fail-closed if it later fails).
2. Keep the existing 8s timeout UI, but it should appear far less often.

### B) Update E-signature UI to match the champagne/gold admin standard
1. Replace gray/minimal styling in:
   - `src/pages/e-signature/ESignatureDashboard.tsx`
   - with the same premium shell patterns used in Owner/Admin pages (champagne gradient background, gold borders, consistent cards).
2. Rename primary CTA from “New Envelope” to your preferred wording:
   - “Upload & Sign” (while still creating a draft envelope behind the scenes).

---

## Files / components likely to change (implementation map)
### Listing Admin
- `supabase/functions/extract-listing-from-link/index.ts` (major: URL+file extraction improvements, enforce manual publish)
- `src/components/listing-admin/ListingAdminChat.tsx` (remove auto-approve UI; ensure uploads feed real extraction)
- `src/components/listing-admin/ProjectApprovalQueue.tsx` (remove Provident filter; fix bulk progress)
- `src/pages/ListingAdmin.tsx` (scroll + background shell fixes; drafts list filtering)
- Potentially: add/adjust a “quarantine” mechanism (may require small schema addition if no suitable flag exists)

### E-signature
- `src/contexts/AuthContext.tsx` (owner caching)
- `src/pages/e-signature/ESignatureDashboard.tsx` (UI refresh)

---

## Backend/data operations (needed to make the UI truthful)
1. Bulk quarantine/hide broken Provident projects already in `projects`
2. Remove Provident queue items (optional), or leave but not shown
3. Re-run extraction/repair for Citi projects (AMRA and related) after extraction fix so pending imports become complete

---

## Acceptance checklist (what you’ll verify after implementation)
### Listing Admin
- “Projects → Drafts” no longer shows broken Provident entries
- “Data Ops → Project Approvals” shows AMRA with description + media + correct developer
- Repair progress counts are correct (no 25/3)
- Scrolling does not crop the background container

### E-signature
- Entering `/e-signature` no longer hangs on owner verification on reload
- Dashboard visually matches the approved premium UI style
