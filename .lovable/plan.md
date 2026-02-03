
## What is actually going wrong (root-cause, based on code + live DB data)

### 1) Your extraction may be working, but the **Test One Listing preview is broken and misleading**
In `src/components/listing-admin/TestOneListingPanel.tsx`, the preview and checklist assume the extracted fields are stored in shapes that are no longer true:

- **Images type mismatch (causes broken photos in the test panel):**
  - DB stores `pending_project_imports.images` as an array of objects like `{ url, alt_text, display_order }`.
  - The test panel types it as `string[]` and then does:
    - `testResult.project.images.slice(...).map((url) => <SafeImage src={url} ... />)`
  - If `url` is actually an object, the browser tries to load `"[object Object]"` which looks like “broken photos”.

- **Amenities field mismatch (causes “0 amenities” even when extraction wrote them):**
  - Extraction writes amenities to `amenities_list`.
  - The test panel reads `updatedProject.amenities` instead.

- **Documents “mirrored_url” mismatch (causes coreComplete=false even if brochure is present):**
  - Extraction writes documents as `{ url, type, name }`.
  - The test panel checks `documents.some(d => d.mirrored_url)`, but that field does not exist, so it always fails.

Net effect: the test panel can show “Core Incomplete / broken images / no USPs” even when the queue + preview page could be correct.

### 2) Some pending items truly are not extracted yet (still `PENDING_SCRAPE`)
From the DB, many queue items still have `review_notes = PENDING_SCRAPE` and **images/documents empty**, meaning they haven’t been processed by extraction yet. That’s separate from the test panel UI bugs.

### 3) There is a known image CDN size issue in at least one repair function
`supabase/functions/repair-project-extraction/index.ts` upscales Provident CDN images to `/x/1200x800/`, while your stability policy notes this size can 403. This can cause “photos broken” after repair runs.

---

## What you asked for (requirements to implement exactly)

1) Admin must see **two views**:
   - A **small Provident-style listing card** (one main photo, brief description, ...more).
   - Clicking opens a **full detail page** that mirrors Provident (with your header/footer branding).

2) **Approve button must exist in both places**:
   - On the small card (outside).
   - On the full page (inside).

3) Extraction must populate the real Provident sections:
   - USP bullets + headline
   - amenities
   - location distances
   - FAQs
   - payment breakdown
   - images + brochure docs (internally mirrored)

4) Stop “old UI/old preview” behavior; the admin flow must match the approved Provident mirroring standard.

---

## Implementation plan (what I will change, in the correct order)

### A) Fix the Admin “Test One Listing” panel so it reflects reality (immediate)
**Goal:** When you run “Test One Listing”, you must see:
- a real small card preview (Provident style),
- a “View Full Page” link,
- a checklist that matches the actual database fields,
- and images that actually render.

**Changes**
1. **Update TestOneListingPanel types + parsing**
   - Parse `images` as objects and render with `img.url`.
   - Parse `documents` as objects `{ url, type, name }`.
   - Read `amenities_list` (JSON array) not `amenities`.
   - Read `usp_bullets` (JSON array) correctly.
   - Update the checklist to use:
     - `images.length >= 2`
     - `documents.some(d => d.type === 'brochure' && d.url)`
     - `usp_bullets.length >= 2` (or your chosen threshold)
     - `amenities_list.length >= 3` (or your chosen threshold)
     - and include additional checks you requested (FAQs, distances, payment breakdown).

2. **Add the two-view preview you demanded**
   - Inside TestOneListingPanel, render:
     - “Small Card Preview” using the same component style as the admin queue card (or reuse the queue card component directly).
     - “Open Full Page Preview” button that routes to `/listing-admin/preview/:id`.

3. **Add Approve/Reject entry points (outside + inside)**
   - The inside approve already exists on `PendingImportPreview` (adminBar).
   - I will add “Approve / Reject” controls to the outside card preview in TestOneListingPanel, so you can approve without opening the full page.

**Files**
- `src/components/listing-admin/TestOneListingPanel.tsx` (main fix)
- Potential small helper extracted inside the file or reuse existing:
  - `src/components/listing-admin/PendingImportCard.tsx` (reuse or extend for approve buttons)

---

### B) Make the queue card (outside view) match your “Provident small listing card” requirement
Right now, the queue uses `PendingImportCard` and clicking it routes to `/listing-admin/preview/:id` (good), but it doesn’t have outside approve/reject by default.

**Changes**
1. Add **Approve** and **Reject** buttons to the card “action bar” (outside), consistent with your approved button styles.
2. Ensure clicking the card still opens the full page, but the approve/reject buttons don’t accidentally navigate.

**Files**
- `src/components/listing-admin/PendingImportCard.tsx`
- `src/components/listing-admin/ProjectApprovalQueue.tsx` (wire approve/reject handlers into cards if needed)

---

### C) Fix extraction so it reliably fills Provident sections (USPs, amenities, etc.)
You are correct: if the DB fields are empty, the full Provident-mirror page cannot display them.

**Key change: Prefer Provident’s Gatsby page-data JSON as a primary source when possible**
- The page-data endpoint contains structured fields (and is far more reliable than parsing Firecrawl markdown for some pages).
- We will use it when available and fall back to Firecrawl only when needed.

**Changes**
1. Add a shared extractor that:
   - fetches `https://providentestate.com/page-data/new-projects/{slug}/page-data.json`
   - pulls the structured content for:
     - `about` / description
     - images arrays (media_images)
     - amenities arrays
     - FAQ items
     - payment plan milestones/breakdown
     - location distances (if present)
   - normalizes images (no `data:` URIs; no broken sizes)
2. Update `batch-extract-pending` to:
   - try Gatsby page-data first,
   - then Firecrawl scrape fallback (current path),
   - then write the same DB fields as now:
     - `usp_headline`, `usp_bullets`, `amenities_list`, `location_distances`, `faqs`, `payment_breakdown`,
     - `images`, `documents` (brochure mirrored to internal storage).
3. Ensure completeness rules match the Provident mirror requirements (and match what the UI checks).

**Files**
- `supabase/functions/_shared/provident/` (new shared parser module)
- `supabase/functions/batch-extract-pending/index.ts` (use Gatsby data, not only Firecrawl markdown)
- (Optional) `supabase/functions/repair-project-extraction/index.ts` (see next section)

---

### D) Fix broken photos caused by unsafe image resizing in repair logic
**Changes**
1. In `repair-project-extraction`, stop rewriting to `/x/1200x800/` and instead:
   - keep original size, or
   - normalize to a safe size known to load (matching your stability policy).
2. Explicitly drop `data:image/...` URLs and other non-fetchable placeholders.

**Files**
- `supabase/functions/repair-project-extraction/index.ts`

---

### E) Verify the full “card -> full page” workflow exactly as you described
After the fixes, verification will be done in this exact user journey:

1. Go to `/listing-admin`
2. See the queue cards:
   - One main photo
   - Description with `...more`
   - **Approve** visible on the card (outside)
3. Click the card:
   - Opens `/listing-admin/preview/:id`
   - Full Provident-mirror page loads with header/footer
   - **Approve** also available on the page (inside)
4. USPs/Amenities/Distances/FAQs/Payment show and tabs appear (not hidden)
5. Images load without needing scroll tricks or repair cycles

---

## Why it looked like I “didn’t do it”
Based on what I can see in the repository and the DB:
- Parts of the Provident mirror UI were created (full page preview exists and uses `ProjectDetailLayout`).
- But the **Test One Listing panel is out-of-sync with the actual DB field shapes**, so it shows broken images + missing fields even when the extraction wrote them, and it cannot preview the two-view “small card + full page” flow the way you asked.
- Also, many items are still `PENDING_SCRAPE`, meaning they genuinely have no extracted data yet.

This plan fixes the UI truthfulness first (so you can trust what you see), then makes extraction deterministic and complete.

---

## One critical question (needed to implement your “Approve outside card” rule correctly)
Where do you want the outside Approve button to live?

1) On every card inside the main approval queue grid (recommended), and also inside the Test panel card preview  
2) Only inside the Test panel card preview, and the queue grid remains “Review first, approve on page”

I can implement either, but I need your choice to match your exact workflow expectation.
