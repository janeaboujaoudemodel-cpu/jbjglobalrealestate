
## Goal
Fix Listing Admin data quality + navigation + approval counts confusion, and permanently stabilize Owner verification (Search no longer shows “Verifying owner access…/Access denied” for the real owner).

---

## What I found (from backend + code audit)
### Inventory reality (your current test backend)
- **Projects table:** 1,956 total  
  - **Published:** 1,752  
  - **Draft (unpublished):** 204
- **Pending import queue (`pending_project_imports`):**
  - **Pending:** 1,341 (all are **Provident**)
  - **Approved:** 2,151
- **Needs work:** 287 (subset of the 1,341 pending)

### Why so many fields are missing
1. **Provident structured page-data has the missing fields**, but our parser is looking at the wrong keys.
   - Example: Provident page-data contains `completion_year`, `min_bedrooms`, `max_bedrooms`, etc.
   - Our `pagedata-detail.ts` currently tries `bedrooms` (string) and `handover`, so it returns null for most items.
2. **Approved projects created via `bulk-approve-imports` are being labeled as Reelly** even when they are Provident.
   - `bulk-approve-imports` sets `source='reelly'` and `import_source='reelly'` unconditionally.
3. **Draft projects (204) are Provident URLs but missing core fields** (handover/bedrooms/size), so the Draft list looks “broken”.

### Why “Back” goes to Reelly sync instead of Approval Queue
- The listing admin view defaults to `data-ops` + `reelly` tab unless the URL explicitly sets `syncTab=approvals`.
- Preview pages don’t carry “where you came from” state, so back navigation loses context.

### Why Owner verification fails “every day”
- `verify-owner` edge function still depends on an env var (`OWNER_EMAIL`) and email matching.
- You explicitly approved **DB-based owner check**, and the DB already has:
  - `app_settings.owner_email = janeaboujaoudenails@gmail.com`
  - `user_roles` includes `owner/admin` for your user id

---

## Plan (implementation batches)

### Batch A — Fix Provident extraction so pending + drafts show handover/bedrooms/size/description
**A1) Update Provident page-data detail parser**
- File: `supabase/functions/_shared/provident/pagedata-detail.ts`
- Add support for real Provident keys:
  - Bedrooms: `min_bedrooms`, `max_bedrooms`, and fallbacks (`display_bedrooms`, legacy `bedrooms`)
  - Handover: `completion_year`, `completion_date`, `handover_date`, and existing `handover`
  - Size: add numeric parsing for likely keys (`min_size/max_size`, `min_area/max_area`, etc.)
  - Location: ensure `display_address`/`project_location` are mapped
- Outcome: page-data mode becomes the primary reliable source for these “core” fields.

**A2) Make batch extractor actually populate the missing fields**
- File: `supabase/functions/batch-extract-pending/index.ts`
- Ensure the DB update payload writes:
  - `handover_date`, `bedrooms_min/max`, `size_min/max`, plus any structured fields found
- Keep current strategy:
  - Phase 1: page-data (fast/free)
  - Phase 2: Firecrawl only when needed (but we’ll try to minimize it)

**A3) Add a “Core Fields Repair” mode for Provident (no Firecrawl)**
- Add an option to the extractor (or new lightweight function) to run page-data-only repairs across the queue:
  - Targets pending imports missing **handover/bedrooms/size**
  - This solves the “1,333 missing handover/bedrooms” quickly without spending credits.

---

### Batch B — Fix approvals + counts + remove the “where did 1341 come from?” confusion
**B1) Correct source labeling when promoting pending → projects**
- File: `supabase/functions/bulk-approve-imports/index.ts`
- Detect source based on `source_url`:
  - `providentestate.com` → `source='provident'`, `import_source='provident'`
  - `#reelly_123` → `source='reelly'`, `import_source='reelly'`
  - else → `manual/other`
- Keep your approved merge strategy: **Fill missing only** (no overwriting curated data unless explicitly requested).

**B2) Make the UI explain the numbers**
- Files:
  - `src/components/listing-admin/ProjectApprovalQueue.tsx`
  - `src/components/admin/AdminOverviewDashboard.tsx`
- Add explicit labels like:
  - “Pending approval (Provident queue): 1,341”
  - “Approved imports: 2,151 (historical processed queue items)”
  - “Published projects: 1,752 (live on site)”
- Add “Source breakdown” chips (Provident/Reelly/Manual) so you always know *where counts come from*.

**B3) “Needs Work (287)” actionability**
- File: `src/components/listing-admin/PendingImportCard.tsx` + queue UI
- Show a “Why Needs Work?” breakdown (missing: handover, bedrooms, size, images, developer).
- Provide one-click action:
  - “Fix all Needs Work (page-data first)”
  - Only offer Firecrawl batch as an optional second step if page-data can’t fill remaining fields.

---

### Batch C — Fix navigation: back goes to Approval Queue (not Reelly sync)
**C1) Preserve “return context” in URL**
- File: `src/components/listing-admin/ProjectApprovalQueue.tsx`
- When navigating to preview, include query params:
  - `?from=approvals&statusFilter=...&sourceFilter=...`
- File: `src/pages/listing-admin/PendingImportPreview.tsx`
- “Back to Queue” reads those params and navigates to:
  - `/listing-admin?view=data-ops&syncTab=approvals&statusFilter=...&sourceFilter=...`

**C2) Make the Listing Admin read and apply filters from URL**
- File: `src/pages/ListingAdmin.tsx` + `ProjectApprovalQueue.tsx`
- Parse URL params and set:
  - `activeView='data-ops'`
  - `dataOpsTab='approvals'`
  - restore filters so browser back is deterministic.

---

### Batch D — Fix draft listing UX and missing details for 204 drafts
**D1) Stop “draft card takes long to load”**
- File: `src/hooks/useProjects.ts` (`useProjectsPaginated`)
- Split the heavy query:
  - List view: fetch only lightweight fields (no images/documents joins)
  - Detail/preview modal: fetch joins only when opening preview
- Outcome: Draft list becomes instant.

**D2) Enrich the 204 draft projects using Provident page-data**
- Add a runner action in Listing Admin “Data Ops”:
  - “Enrich Draft Projects (Provident) — Fill missing only”
- Implementation choices:
  - Extend `supabase/functions/provident-enrich-projects/index.ts` to also fill missing core fields for projects with Provident `source_url`.
  - Or add a dedicated function `provident-enrich-core-fields` that updates `projects` where `is_published=false` and `source_url ilike '%providentestate.com%'`.

---

### Batch E — Permanently fix Owner verification + search access
You approved: **DB-based owner check**.

**E1) Update verify-owner backend to use DB truth**
- File: `supabase/functions/verify-owner/index.ts`
- New logic:
  - Authenticate user via JWT
  - Read `app_settings.owner_email`
  - Check `user_roles` for `owner` or `admin`
  - `isOwner = hasOwnerRole || emailMatchesOwnerEmail`
- Remove dependency on `OWNER_EMAIL` env var (keep fallback only if DB value missing).

**E2) Make verification UX clear + auto-return**
- Files:
  - `src/pages/AccessDenied.tsx`
  - `src/components/OwnerGuard.tsx`
  - `src/contexts/AuthContext.tsx`
- Add:
  - Green success state / light red failure state on “Retry verification”
  - Store “intended route” before redirecting to `/403`
  - After successful verification: **auto-navigate back** to intended route and refresh relevant queries (no manual “go home then try again”).

---

### Batch F — Al Hamra developer + floor plans UI correctness
**F1) Developer enrichment**
- Use existing backend tooling (`extract-developers-provident`, `enrich-developer-data`, or add a targeted repair) to fill missing:
  - developer logo
  - developer description
- Ensure the DeveloperDetail page uses best available logo field and has a strong fallback.

**F2) Don’t show “Floor plan preview not available” when we shouldn’t**
- File: `src/components/project-detail/FloorPlanGallery.tsx`
- If there are floor plan “labels” but no usable `pdfUrl/imageUrl` and no brochure:
  - Hide the preview UI and show a clean “Request floor plans” CTA only.

---

## Execution order (fastest path to your pain points)
1) **Owner verification DB-based fix** (stops daily lockouts + fixes Search)  
2) **Provident page-data parser update** (bedrooms/handover/size show up)  
3) **Queue batch repair (page-data-only) for 1,341 pending**  
4) **Draft projects enrichment (204)**  
5) **Navigation: back to approvals always**  
6) **Counts + source explanation + Needs Work actionability**  
7) **Al Hamra developer + floor plans UI cleanup**  
8) **Performance optimization of draft list query**

---

## Proof / verification (what we’ll validate after implementation)
- In Listing Admin:
  - Opening any “Draft (204)” shows **handover, bedrooms, size, description**
  - Clicking a pending item → Preview → Back returns to **Approvals**, not Reelly
  - Pending count clearly shows **“Provident queue”** and source is visible
- Owner verification:
  - Search no longer triggers “Verifying owner access…” loops
  - Retry verification shows **green on success**, **red on failure**, and auto-returns to the original page

