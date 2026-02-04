
## Goals (what will be “fixed”)
1. **Extraction completeness**: brochure + floor plans + FAQs + location distances + full bedroom configurations (3, 4, 5… not just one).
2. **Media integrity**: no broken last image; USP headline + USP image must match Provident (no “same regenerated image”).
3. **1:1 mirroring feel**: hero uses the correct Provident hero media and **does not feel zoomed/cropped wrong**.
4. **Downloads always work**: brochure/floor plan PDFs always downloadable (no blocked URLs).
5. **Performance**: map loads faster; page feels lighter.
6. **Global rules**:
   - “Contact Us directly” section standardized and present site-wide (including admin surfaces if required).
   - “Request a Callback” standardized and placed as mandated.
   - Footer: the **Licensed / Stay in the Loop card must be above the monogram**.
   - Emails **must be FULL CAPITAL LETTERS** everywhere.
   - Developer name **always clickable** everywhere.
   - Listing cards **vertical portrait**, not rectangular.

---

## What I found in the code (why this is happening)
### A) Brochure & Floor plan failures are almost certainly “pipeline mismatch”
You currently have multiple extraction/sync pathways that behave differently:

- **Best pipeline**: `supabase/functions/batch-extract-pending`
  - It uses Gatsby **page-data.json** to deterministically discover PDF URLs (`_shared/provident/pagedata.ts`)
  - Then **mirrors PDFs into our public storage** (`_shared/provident/storage.ts`) so downloads won’t be blocked
  - This is the correct, stable approach.

- **Other pipelines** (likely still being used somewhere) do **not** mirror PDFs, or they upscale images to sizes that can 403:
  - `repair-project-extraction` and `provident-sync-all` contain `/x/1200x800/` upscales (known to 403).
  - `provident-sync-master` uses `/x/800x600/` (can also be risky).
  - `full-project-extract` is deterministic but still does `/x/1200x800/` and can collect PDFs unreliably.

If a project was created/updated via one of the “old paths”, you can end up with:
- PDFs pointing to remote Provident URLs (blocked/unreliable)
- Missing floor plan PDFs entirely
- Broken images due to CDN size 403

### B) FAQ and Location Distances extraction is regex-driven and still too narrow
`_shared/provident/extract.ts` already improved:
- Location distances allow en-dash/em-dash.
- FAQs parse “Useful Information” blocks.

But Provident pages can vary:
- Headings sometimes differ (FAQ, Useful info, Q&A, Frequently Asked Questions).
- Distance formats vary (“5 min drive”, “10 mins”, without “Minutes – Place”).
So we need broader patterns and stronger section boundary control.

### C) Bedrooms “only 3 bedroom” is a data model + extraction issue
Your UI mainly shows `bedrooms_min` / `bedrooms_max`, which compresses “3, 4, 5” into a range or sometimes incorrectly into a single value if extraction finds only one match.

To meet your rule (“show all configurations”), we should store:
- **bedroom_configurations list**: e.g. `["3", "4", "5"]` (and optionally `Studio`)
while still keeping min/max for filtering.

### D) Hero “zoom” and USP image “same regenerated photo”
Right now hero image is chosen from `project.images[0]` after filtering.
That is not guaranteed to be the same image Provident uses for the hero banner.

We need to extract and persist **explicit hero_image_url** and **explicit usp_image_url**, instead of relying on “first image in gallery”.

### E) Forms “still not fixed”
Your forms are inconsistent in how they notify:
- Some call `send-inquiry-email`, but that function currently requires fields like **nationality + language** (schema validation), which many forms do not provide.
- Result: the user sees success, but notifications can silently fail.

We should standardize a “lead notification” backend function or relax validation to support multiple form types.

### F) Email casing rule is currently inconsistent
`src/constants/stats.ts` currently uses mixed case and even includes a comment contradicting your rule.
Also `send-inquiry-email` sends to `contact@jbj.ae` (lowercase).
We must lock it to FULL CAPS everywhere (UI + functions + mailto + vCard).

---

## Implementation plan (prioritized, minimal risk, staged)
### Phase 1 — Make brochure + floor plans always present and always downloadable (highest priority)
1. **Make PDF mirroring more robust** in `_shared/provident/storage.ts`:
   - Remove/relax the early “must end in .pdf” guard (page-data sometimes returns URLs that don’t neatly end with `.pdf` or have redirects).
   - Add fetch headers (`User-Agent`, `Accept`) to reduce 403/blocked responses.
   - Improve validation fallback:
     - If PDF magic bytes mismatch but `content-type` is `application/pdf`, accept it (some CDNs can add wrappers).
     - Log and return structured reason if mirroring fails.

2. **Unify all extraction paths to use PDF mirroring**:
   - Ensure any pathway that writes `project_documents` for brochure/payment/floor plans uses `mirrorRemotePdfToPublicStorage`.
   - Specifically audit/fix:
     - `repair-project-extraction`
     - `provident-scrape-project`
     - `sync-provident-page` (if it touches docs)
     - `provident-full-sync` (if still used)

3. **Guarantee Floor Plan docs are written correctly**:
   - Confirm `document_type="floor_plan"` with a valid URL (mirrored public storage URL).
   - Ensure display order is deterministic.

4. **Admin debugging support**
   - When mirroring fails, write a short machine-readable reason into `pending_project_imports.review_notes` (e.g. `PDF_MIRROR_FAILED: <reason>`), so you can see why it failed without guesswork.

**Done condition**:
- In the listing admin “Test One Listing”, checklist shows:
  - `hasBrochure = true`
  - `hasFloorPlans = true` (either docs or types, but docs preferred)

---

### Phase 2 — Fix FAQs + Location Distances extraction to be Provident-stable
1. In `_shared/provident/extract.ts`:
   - Extend FAQ section detection to match headings:
     - `Useful Information`, `FAQ`, `FAQs`, `Frequently Asked Questions`, `Q&A`
   - Improve Q/A parsing:
     - Accept headings that are not strictly `##` (sometimes `###` or bold patterns).
     - Accept answers spanning multiple lines until next question block.
   - Extend distance parsing:
     - Support formats like:
       - `- 5 min drive to Dubai Mall`
       - `- 10 mins to DXB`
       - `5 Minutes – Dubai Mall` (without leading dash)
     - Normalize into `{ time, label }`.

2. Ensure **floor plan isolation** remains enforced (no mixing location bullets into floor plan types).

**Done condition**:
- `faqs.length >= 1` and `location_distances.length >= 1` for a known-good Provident page that contains them.

---

### Phase 3 — Bedrooms: store and display ALL configurations (not just one)
1. **Database changes** (Test → later publish to Live):
   - Add JSONB/text[] fields:
     - `pending_project_imports.bedroom_configurations` (jsonb)
     - `projects.bedroom_configurations` (jsonb)
   - Keep existing `bedrooms_min/max` for filtering.

2. Extraction:
   - Parse bedroom configurations as an ordered unique list:
     - Example output: `["3", "4", "5"]`
     - Include `Studio` as `"0"` or `"Studio"` (decide one canonical representation).
   - Derive min/max from that list.

3. Frontend:
   - Update `ProjectDetail.tsx` mapping + `ProjectDetailLayout` hero stats display:
     - Show “3 • 4 • 5 Bedrooms” (premium, explicit)
     - Fall back to range if list absent.
   - Update `ProjectCard` to display the explicit list (and keep it compact).

**Done condition**:
- A page that has 3/4/5 shows **all** (not only 3, not only 3-5).

---

### Phase 4 — Fix broken last photo + hero mismatch + USP title/image correctness
1. **Stop producing risky CDN sizes everywhere**
   - Remove `/x/1200x800/` and `/x/800x600/` rewrites from any remaining edge functions.
   - Normalize to safe `/x/464x312/` consistently (you already have `repair-image-urls` to clean existing data).

2. **Persist explicit hero image**
   - Add `projects.hero_image_url` + `pending_project_imports.hero_image_url` (jsonb/text).
   - Extract hero image from:
     - `og:image` meta
     - hero slider container in rawHtml
     - first “banner” image near the top of the page (not navbar assets)
   - UI uses this for hero instead of `images[0]`.

3. **USP title + USP image**
   - Improve USP extraction:
     - Headline: ensure it’s the **actual USP section title**, not a leftover heading.
     - Image: choose the first valid USP section image that is not floor plan/diagram and not identical to hero.
   - UI fallback order:
     1) usp_image_url
     2) location_image_url (if Provident uses a similar panel image style)
     3) first gallery image (last resort)

4. **Frontend resilience to broken images**
   - In carousels/hero: on image error, automatically advance to next valid image rather than showing a broken frame.

**Done condition**:
- No broken “last image” in gallery.
- USP panel shows a different, correct image (not repeating hero or a regenerated placeholder).

---

### Phase 5 — Performance: faster map load + lighter page feel
1. **Lazy-mount the map iframe**
   - Do not render the iframe until:
     - user scrolls near the location section, or
     - user clicks “Load Map”
   - Add `loading="lazy"` and keep it out of initial render.

2. **Replace initial iframe with a fast preview**
   - Show a static preview card + “Open in Maps” button immediately.
   - Load iframe only if requested.

3. General performance audit (quick wins)
   - Ensure only the first hero media is `fetchPriority="high"`.
   - Everything else lazy loads.

**Done condition**:
- Page becomes interactive faster; map no longer blocks initial load.

---

### Phase 6 — Global UI rules you listed (contact section, footer order, email caps, developer link, vertical cards)
1. **Email FULL CAPS everywhere**
   - Update `CONTACT_INFO` to:
     - `CONTACT@JBJ.AE`, `SUPPORT@JBJ.AE`, etc.
   - Update all mailto links and vCard generator.
   - Update backend email recipients (e.g. `send-inquiry-email`) to use FULL CAPS.

2. **Global “Contact Us directly” section**
   - Centralize insertion to avoid “some pages forgot”:
     - Prefer: render `DirectContactCTA` in `MainLayout` for all routes except `/card` (and optionally `/auth` if you want).
   - Remove duplicates from pages that already add it (to prevent double sections).

3. **Request a Callback section globally**
   - Decide the single approved component:
     - likely `CallToActionSection` (already matches Provident style)
   - Render it globally just above:
     - DirectContactCTA
     - then “Stay in the Loop”
     - then Footer

4. **Footer ordering fix**
   - Reorder `Footer.tsx` so:
     - 3D card (Licensed + Stay in the Loop) appears **above** the monogram block (as you mandated).

5. **Developer name clickable global lock**
   - Create a small reusable `DeveloperLink` component and replace all “by Developer” occurrences across:
     - cards
     - detail pages
     - admin preview cards
   - Always link to `/developer/:slug` when slug exists.

6. **Listing card vertical portrait**
   - Update `ProjectCard`:
     - Replace `aspect-square` with a portrait ratio (matching your approved vertical card spec).
   - Ensure image remains `object-cover` with the same Provident feel.

---

## Testing / Validation (end-to-end, non-negotiable)
1. In Listing Admin:
   - Run **Test One Listing** on a known failing Provident URL.
   - Confirm checklist passes: images (2+), brochure mirrored, floor plans present, FAQs, distances, USP.
2. Open the approved project detail page:
   - Brochure downloads via proxy (no blocks).
   - Floor plan tab shows PDFs with Download buttons.
   - Hero looks identical to Provident (correct image and framing).
3. Verify global rules:
   - Emails are FULL CAPS everywhere.
   - Developer names are clickable everywhere.
   - Footer order matches your instruction.
4. Performance:
   - First paint is faster; map loads on demand.

---

## Critical inputs needed (to execute quickly and verify fixes)
To avoid guessing, implementation will begin by targeting one real failing project:
- Provide **one Provident project URL** that is currently failing in your admin preview (or the pending import id/slug shown in the admin queue).
- Confirm how you want Studio represented in “configurations”:
  - Option A: `Studio, 1, 2, 3`
  - Option B: `0, 1, 2, 3` (less premium)

Once we have that single example, we’ll iterate until that listing is perfect, then run the bulk repair pipeline safely.