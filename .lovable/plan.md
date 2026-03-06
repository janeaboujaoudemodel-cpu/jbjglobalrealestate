
## What’s broken (confirmed)
1. **Projects count shows 1000** in Listing Admin because `useProjects()` does a `select(*)` without pagination. PostgREST returns max **1000 rows** by default, so `projects.length` becomes 1000 even though the database has **2540** projects.
2. **Data quality is inconsistent**:
   - **544 projects** have `price_from` missing.
   - **696 projects** have **no rows** in `project_images`.
   - Some projects have a **wrong cover image** (example: `AMRA` has a language flag image as `cover_image_url`).
3. **Black page / very slow load on detail**: `ProjectDetailLayout` always passes `latitude={null}` / `longitude={null}`, so the map **always geocodes** via Nominatim on every project open, adding delays and occasional failures.
4. **“Watch Project Video” appears when no real video exists**: some projects likely have `video_url` filled with a non-video/invalid URL; UI treats it as truthy.

## Clarifications (captured from you)
- **Projects click flow**: **Two-step modal flow** (public listing card preview first → then full detail page).
- **Repair scope**: **All projects**.

---

## Plan (implementation)

### A) Fix “1000 projects” and show the real total everywhere
1. **Add a lightweight “exact count” query** for projects (head-only count).
2. Update `src/pages/ListingAdmin.tsx` so:
   - The Projects button and stats badge use `totalProjectsCount` (exact) instead of `projects?.length`.
   - The Projects grid becomes **paginated** (“Load more”) instead of trying to load everything.

**Files involved**
- `src/hooks/useProjects.ts` (add `useProjectsCount()` + add paginated admin listing hook)
- `src/pages/ListingAdmin.tsx` (swap UI from `projects.length` to real count + pagination controls)

---

### B) Projects tab UX: “public card preview first”, then full detail, then edit
1. Create a **Project Preview Modal** for the Projects tab:
   - Shows the **same public-facing listing card style** (image, badges, price, beds, handover).
   - Primary CTA: **Open Full Listing** (goes to `/project/:slug`).
   - Secondary CTAs: **Edit**, **Send to Sarah**, **Approve/Unpublish controls** (admin actions).
2. Only when the user clicks **Edit** do we switch to the existing editor form inside Listing Admin.

**Files involved**
- `src/pages/ListingAdmin.tsx` (wire click → modal instead of direct editor)
- New component: `src/components/listing-admin/ProjectPreviewModal.tsx` (modal UI)
- Potentially reuse existing public card components/styles for visual parity.

---

### C) Chat + “next to the chat” preview/approve panel (Sarah workflow)
1. Convert the Listing Admin **Chat view** into a 2-column layout:
   - **Left:** `ListingAdminChat`
   - **Right:** “Latest Extracted Listings” panel showing the **same premium cards** (already built in `ListingAdminChat.tsx`) outside the message stream.
2. When extraction finishes (URLs/files):
   - Push extracted cards to the right panel immediately.
   - Each card has:
     - **Review** → `/listing-admin/preview/:id`
     - **Approve** (one-click) → approves into Projects and refreshes the Projects count + list

**Files involved**
- `src/pages/ListingAdmin.tsx` (layout + right panel state)
- `src/components/listing-admin/ListingAdminChat.tsx` (expose extracted listings via callback prop)

---

### D) Fix the black page + speed up project detail (map is the main offender)
1. **Pass real latitude/longitude** into the map:
   - In `ProjectDetail.tsx`, include `latitude` and `longitude` in `mappedFromDb`.
   - In `PendingImportPreview.tsx`, include `latitude` and `longitude` in the mapped preview if available.
2. Make `ProjectLocationMap` fast + safe:
   - If lat/lng missing: **render immediately** at Dubai default coordinates (no blocking spinner).
   - Add a “Refine location” button that triggers geocoding **on demand** (not automatically).
   - Add a short **timeout** (AbortController) for geocoding to prevent hanging.
3. Wrap the map section with a lightweight error guard so a map failure cannot blank the entire page.

**Files involved**
- `src/pages/ProjectDetail.tsx`
- `src/pages/listing-admin/PendingImportPreview.tsx`
- `src/components/project-detail/ProjectLocationMap.tsx`
- (Optional) small defensive changes in `src/components/project-detail/ProjectDetailLayout.tsx`

---

### E) Fix broken/wrong photos (flags, icons, Next.js proxy URLs)
1. Improve image validation:
   - Detect Next.js image proxy URLs like `/_next/image?url=...` and **extract/decode** the real underlying image URL for validation.
   - Add filters for common non-property assets: `flag`, `/flags/`, `lang`, `sprite`, `favicon`, etc.
2. Improve extraction filtering in `extract-listing-from-link`:
   - Exclude “flag/language/UI” images during regex collection.
   - Prefer `og:image` / primary hero image signals when present (higher-quality first image).
3. UI resilience:
   - Ensure admin cards and public cards always use `SafeImage` / fallbacks.
   - Avoid showing broken `<img>` as the hero (fallback to a branded placeholder).

**Files involved**
- `src/lib/imageUtils.ts`
- `supabase/functions/extract-listing-from-link/index.ts`
- `src/pages/ListingAdmin.tsx` (Projects grid image rendering)
- Potentially other card components that use raw `<img>`.

---

### F) “Fix all projects” data-quality repair pipeline (photos, price, docs, video validity)
Because you want **all projects** corrected (not only pending queue), we’ll add a batched backend job:

1. Create a backend function `repair-live-projects-batch` that:
   - Finds projects that need repair (examples):
     - missing `price_from`
     - no `project_images`
     - `cover_image_url` fails validation (flag/icon/placeholder)
     - invalid `video_url` (not YouTube/Vimeo/mp4/webm)
   - Repairs by source:
     - **Reelly** projects: fetch Reelly detail (reuse logic patterns already in `repair-project-extraction`) and update:
       - pricing, beds, sizes, handover, media, docs, floor plans, amenities
     - **Provident** projects: use existing Provident page-data + pdf mirroring approach (patterns from `batch-extract-pending`) and update:
       - docs (brochure/payment/floorplans), amenities, USP, location blocks, and images
     - **Other sources/manual**: create a pending import “repair suggestion” for Sarah/admin review (safe mode) if we cannot deterministically repair.
   - Writes progress into `sync_jobs` (reuse existing table) so you can see stats/errors.

2. Add UI controls in Listing Admin (Data Ops + Projects tab):
   - “Fix Missing Media & Prices (Batch)” button (runs in batches of e.g. 10–25 per call)
   - Progress indicator and last error summary

**Files involved**
- New backend function: `supabase/functions/repair-live-projects-batch/index.ts`
- `src/components/listing-admin/SyncDashboard.tsx` or `ExtractionJobsPanel.tsx` (add “repair” controls + progress)
- `src/pages/ListingAdmin.tsx` (surface the button in the right place)

---

### G) Daily Provident “prep queue” (so it behaves like your requested workflow)
Right now the daily provident auto job shows repeated failures in logs (504 in `provident-areas-sync`) and it also auto-approves, which is opposite of “prepare then approve”.

We’ll adjust the daily workflow so it:
1. **Discovers/updates** Provident projects into the **pending approvals queue** (no auto-approve).
2. Runs enrichment (batch extraction) to fill amenities/docs/USP so the queue cards are “complete”.
3. Leaves items for you to approve from the queue (same UX as Sarah).

**Files involved**
- `supabase/functions/daily-provident-auto-sync/index.ts` (change sequence + remove auto-approve)
- Possibly harden `supabase/functions/provident-areas-sync` (reduce payload/timeouts, batch internally)

---

## Acceptance checklist (what you should see after)
- Projects tab shows **real total** (not 1000) and loads smoothly with pagination.
- Clicking a project shows **public-style card preview modal first**, then you can open full detail and/or edit.
- Chat view shows a **right-side “Latest extracted” panel** with cards + approve buttons.
- No more “black page”: detail page loads fast; map doesn’t block the page.
- Broken/incorrect hero images (flags/icons) are filtered out and replaced with real photos or a clean placeholder.
- A “Fix all projects” tool exists and can repair missing photos/prices/docs in controlled batches.
