
## What’s happening (root causes found)

### 1) Listing Admin overlap with “Connect With Our Team” / newsletter
- `MainLayout.tsx` currently treats “admin” as only routes starting with `/admin`.
- The Listing Admin lives at `/listing-admin`, so it is incorrectly treated as a public page.
- Result: `DirectContactCTA`, `NewsletterBand`, and the global `Footer` render under Listing Admin, and because Listing Admin uses its own sticky headers / internal scroll areas, these global sections can appear to “overlay” or visually collide with the admin extraction panels.

**File involved:** `src/components/MainLayout.tsx`  
**Current logic:** `const isAdminRoute = location.pathname.startsWith("/admin");` (missing `/listing-admin`)

---

### 2) Duplicate footer / duplicated “Connect With Our Team” + “Stay in the Loop”
- `MainLayout.tsx` now renders these globally for most pages:
  - `<DirectContactCTA />`
  - `<NewsletterBand />`
  - `<Footer />`
- But a very large number of pages/components still render their own `<Footer />` (and sometimes their own CTAs).
- Result: users see two footers, and the “global” pre-footer sections appear “under” the first footer, which feels like duplicated/incorrect layout.

**Files involved (examples):**
- `src/components/MainLayout.tsx` (global footer/CTA/newsletter)
- Many pages under `src/pages/**` still import & render `<Footer />` (your repo search shows 1000+ matches)

---

### 3) “All 1,804 are Incomplete” in the approval queue
This is happening for two separate reasons:

#### (a) Reelly sync provides only 1 image per project
- In `pending_project_imports`, Reelly items typically have only the cover image.
- Your database confirms: all 1,804 pending Reelly imports have `< 2` images.
  - `pending_lt2_images = 1804`

#### (b) The UI still treats “documents missing” as “incomplete”
- `PendingImportCard.tsx` currently marks an item incomplete if `documents.length === 0`.
- Reelly API imports often don’t include documents. Per your own completeness spec, documents are no longer mandatory for “Complete”.

**Files involved:**
- `src/components/listing-admin/PendingImportCard.tsx` (incorrect completeness rule)
- `src/components/listing-admin/ProjectApprovalQueue.tsx` (queue logic is closer to correct)
- `supabase/functions/reelly-api-sync/index.ts` (only cover image mapped)

---

### 4) Clicking “Repair Project” removes images
- `repair-project-extraction` currently overwrites `pending_project_imports.images` with whatever it finds.
- If the repair scrape fails to find valid images, it writes an empty array (or a very reduced set), wiping the previously-existing cover image.
- This explains: “repair → photos disappeared”.

**File involved:** `supabase/functions/repair-project-extraction/index.ts`  
**Bug:** updates `images` unconditionally, even if new image extraction is empty/invalid.

---

### 5) Project hero empty / cropped / zoomed
There are likely two different scenarios:
1) **Empty hero**: the project has no usable `project_images` rows (or they were never inserted / got wiped by repair logic cascading).
2) **Cropped / zoomed**: hero uses `object-cover`, which can heavily crop certain images. This is amplified if the stored images are small/odd aspect ratios.

**Files involved (primary):**
- `src/pages/ProjectDetail.tsx` (maps DB → UI)
- `src/components/project-detail/ProjectDetailLayout.tsx` (hero rendering / image carousel usage)

---

### 6) Hashtags shown (e.g., “#…”) where you asked to remove them
- `DataFreshnessIndicator.tsx` explicitly renders `#{externalId.slice(0, 8)}`.
- This is a literal hashtag display and should not be shown on public UI.

**File involved:** `src/components/project-detail/DataFreshnessIndicator.tsx`

---

### 7) Map requirements not met + “maps.google.com refused to connect”
- Project detail currently uses Google embed with an API key hardcoded in the frontend (`MAPS_API_KEY`).
- Hardcoded keys and embed restrictions can lead to intermittent “refused to connect” / “blocked” experiences depending on browser / iframe / referrer restrictions.
- You also require:
  - Satellite view
  - Navigation controls
  - Ability to change view (satellite/terrain)
  - Reelly-like behavior

**File involved:** `src/components/project-detail/ProjectDetailLayout.tsx`  
**Related:** `src/constants/filterConfig.ts` already contains satellite tile URLs (good foundation to use Leaflet instead of Google embeds).

---

## Goals (what I will deliver)

1) Listing Admin never shows public footer/CTA/newsletter and never overlaps content.
2) One footer only (no duplicates anywhere).
3) Reelly pending imports stop being “all incomplete”:
   - remove “documents required” from completeness
   - ensure Reelly imports have at least 2 real images (or adjust Reelly-specific rule if you confirm that’s acceptable)
4) Repair actions never delete/blank-out existing images.
5) Project detail hero always has a valid image and is not “over-zoomed”.
6) Remove all hashtag displays from public UI.
7) Replace the project map implementation so:
   - it uses satellite tiles by default
   - supports view toggling + navigation controls
   - “Open in Maps/WhatsApp/Email/Call” never opens blocked iframes; always opens correctly as external actions
8) Bring Reelly detail completeness closer to Reelly portal: floor plans, amenities, payment breakdown, etc., using API first and fallback extraction only where needed.

---

## Implementation plan (sequenced, minimal-risk)

### Phase 1 — Immediate layout stability (fix admin overlap + remove duplicate footer)
#### 1.1 Fix Listing Admin being treated like a public route
- Update `MainLayout.tsx` to use a single “back-office route” boolean:
  - true for `/admin/*` AND `/listing-admin/*` AND any internal dashboards you consider back-office.
- When in back-office:
  - do not render global `DirectContactCTA`, `NewsletterBand`, or global `Footer`.

**Change:** `src/components/MainLayout.tsx`

#### 1.2 Remove duplicate footers (single source of truth)
- Decide and enforce: footer is rendered centrally (in `MainLayout`) for public pages only.
- Remove `<Footer />` from:
  - pages that still include it
  - components that include it (critical: `ProjectDetailLayout.tsx` currently imports `Footer`)
- Same for any duplicated `DirectContactCTA` / `NewsletterBand` calls on pages where global rendering already exists.

**Changes (high priority first):**
- `src/components/project-detail/ProjectDetailLayout.tsx` (remove internal footer rendering; rely on layout)
- `src/pages/PropertiesReelly.tsx` (remove internal footer rendering; rely on layout)
- Then run a repo-wide sweep for pages that still import/render `Footer`

**Acceptance criteria:**
- On any public page, scrolling to bottom shows exactly one footer.
- On Listing Admin, there is no “Connect With Our Team” and no public footer at all.

**Screenshot proof to provide after implementation:**
- Listing Admin page with extraction section visible (no overlap)
- A public page bottom showing single footer

---

### Phase 2 — Fix “Incomplete everywhere” + stop “Repair” from wiping media
#### 2.1 Fix completeness logic in the card UI (documents not mandatory)
- Update `PendingImportCard.tsx` to align with the approved completeness criteria:
  - “Complete” requires description + valid developer + at least 2 unique images
  - documents are not required (especially for Reelly)
- Also ensure badges/counts don’t contradict the queue filters.

**Change:** `src/components/listing-admin/PendingImportCard.tsx`

#### 2.2 Ensure Reelly sync brings 2+ images per project into pending imports
- Enhance `reelly-api-sync` mapping:
  - Use `cover_image.url` as image 1
  - Add additional images if available in API payload (e.g., video thumbnails if present)
  - If API does not provide more images, trigger a controlled “fill missing assets” step for items with <2 images:
    - use existing `reelly-fill-missing-assets` as the fallback to scrape *only for assets* (gallery, floor plans, docs), not as the primary source

**Change:** `supabase/functions/reelly-api-sync/index.ts`  
**Potential enhancement:** extend `reelly-fill-missing-assets` to also add gallery images (not just floorplans/docs)

#### 2.3 Make “Repair project” safe (never deletes existing images/documents)
- Update `repair-project-extraction`:
  - If it extracts **0 valid images**, do not overwrite `pending_project_imports.images`
  - Same for documents
  - Add source-aware handling:
    - If `source_url` indicates Reelly, do Reelly-safe repair strategy (API + fill-missing-assets fallback), not a generic scrape that can return empty

**Change:** `supabase/functions/repair-project-extraction/index.ts`

**Acceptance criteria:**
- Clicking Repair never reduces images from 1 → 0.
- Reelly queue starts showing “Complete” items once images >=2 (and the UI no longer requires documents).

**Screenshot proof:**
- Pending import card before repair (with image)
- After repair (still has image, ideally improved with more images)
- Approval queue filter counts showing some “Complete”

---

### Phase 3 — Project detail fixes (hero images, hashtags removal, developer readability)
#### 3.1 Fix empty hero + reduce aggressive cropping
- Ensure the hero uses the best available image and never renders “empty” if images exist.
- Implement “smart-fit”:
  - default to `object-cover`
  - if an image is too portrait / too small or causes extreme crop, switch to `object-contain` within the hero frame (no zoomed-in feeling)

**Likely changes:**
- `src/components/ImageCarousel.tsx` and/or the hero section inside `src/components/project-detail/ProjectDetailLayout.tsx`

#### 3.2 Remove hashtags from public UI
- Remove the `#` external id display from `DataFreshnessIndicator` (or hide it behind an admin-only toggle).

**Change:** `src/components/project-detail/DataFreshnessIndicator.tsx`

#### 3.3 Developer section styling fixes (no black-on-active-layer “double black”)
- Adjust `DeveloperInfoCard` so inner stat cards and description blocks use the approved champagne card system (no extra black slabs under active layer).
- Ensure developer fields display properly:
  - founded year
  - headquarters
  - description
  - portfolio stats when available

**Change:** `src/components/project-detail/DeveloperInfoCard.tsx`

**Screenshot proof:**
- A project detail hero before/after (showing correct fit)
- Developer section before/after (readable, champagne cards, no extra black layer)
- A view showing no hashtags anywhere

---

### Phase 4 — Map overhaul (satellite + navigation + view toggle + no blocked embeds)
#### 4.1 Replace Google iframe embed on project detail with Leaflet tiles
- Use the existing tile definitions in `src/constants/filterConfig.ts` (already includes a satellite tile provider).
- Provide:
  - Satellite by default
  - Toggle to “Terrain/Street”
  - Zoom controls + pan (navigation)
- Keep “Open in Maps” as an external link (new tab), but do not embed `maps.google.com`.

**Change:** `src/components/project-detail/ProjectDetailLayout.tsx` (location section)  
**Potential new component:** `ProjectLocationMap.tsx` (Leaflet-based, reused in other pages)

#### 4.2 Standardize external action opening (WhatsApp / Email / Call / Maps)
- Add a shared helper so external actions always open correctly and never attempt to load inside an iframe.
- Ensure all these actions use `target="_blank" rel="noopener noreferrer"` where applicable.

**Acceptance criteria:**
- No more “refused to connect” for maps in the site UI.
- Map view is switchable and matches your Reelly-style requirement.

**Screenshot proof:**
- Map section showing satellite view + toggle
- “Open in Maps” click result (opens externally, not embedded)

---

### Phase 5 — Reelly “missing details” extraction parity (floor plans, amenities, payment breakdown, etc.)
#### 5.1 Parse Reelly API `overview` into structured fields
- Implement a parser that extracts:
  - FAQs
  - location distances
  - payment breakdown
  - USP bullets
  - amenities list
  - construction progress/expected completion (when present)
- Store these in `pending_project_imports`, and ensure approval copies them into `projects`.

**Changes:**
- `supabase/functions/reelly-api-sync/index.ts` (populate more fields during import)
- Approval pipeline code (where pending import is copied to projects) to ensure all extended fields are mapped

#### 5.2 Use `reelly-fill-missing-assets` as fallback only
- For records still missing floor plans/docs/gallery after API parsing:
  - run fill-missing-assets in batches on the missing subset
- Strictly keep “floor plan isolation” (no mixing images/sections).

**Screenshot proof:**
- A project detail page showing floor plans + amenities + payment plan populated (not placeholders)

---

### Phase 6 — Mortgage + AI reliability + logging (requested, but will be done after stability fixes)
Because this touches both UI and backend data storage, I’ll implement it after the layout/data fixes above so we don’t compound failures:

#### 6.1 Mortgage section ordering
- Move “Request mortgage partner introduction” to the bottom of the mortgage section, and ensure it sits before the AI assistant exactly as you specified.

#### 6.2 Faster AI Mortgage Assistant responses
- Switch to a faster supported model (and tune prompt for brevity + structured outputs).
- Add “government sources only” behavior via retrieval:
  - restricted search/scrape from official domains
  - include citations in responses

#### 6.3 Persist AI interactions (Mortgage Assistant + Market Analyzer)
- Add a backend table to store:
  - user_id
  - question
  - answer
  - tool name (mortgage / analyzer)
  - project context
  - timestamps
  - (optional) sources/citations

**Screenshot proof:**
- UI showing a saved interaction
- Admin/back-office view showing saved logs

---

## Critical clarifications I need from you (to avoid doing the wrong thing)
1) For Reelly “Complete” status: do you still require **2 images minimum**, or should Reelly be considered complete with **1 cover image** (since the API may not provide full galleries)?
2) When you click a listing from `/properties`, should it show:
   - the full project detail immediately (even if not manually approved), or
   - only after it’s approved in Listing Admin?

(Your message suggests you want full API-driven detail visible on the website without waiting for manual approval, which affects the architecture.)

---

## QA + screenshot proof pack (what I will deliver after implementation)
- Listing Admin: no overlap, no public pre-footer sections
- Public page: exactly one footer
- Approval queue: incomplete logic corrected + visible “Complete” counts once images fixed
- Repair action: before/after showing images preserved
- Project detail: hero not empty and not over-cropped
- Project detail: no hashtag IDs shown
- Map: satellite + view toggle + open externally

