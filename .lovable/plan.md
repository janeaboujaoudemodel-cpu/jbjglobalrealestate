
## What we will change (high priority bugs + requested features)

### A) Smart Listing Creator: add URL + text extraction (and stop black-screen / stuck behavior)
**Where:** `src/pages/ListingPortalSubmit.tsx` (this is the “Smart Listing Creator” page)

**Problem today**
- It converts uploads to base64 in the browser (`fileToBase64`) and calls `ai-listing-extractor` directly.
- For large PDFs/images this can freeze the UI, crash the tab, or time out the backend request → user sees loading loops / black screen.

**Plan**
1) **Add two new inputs to the Upload phase**
   - **Source URL (optional)**: “Paste a website/listing link to extract from”
   - **Paste Text (optional)**: textarea for any description/content the user wants analyzed
   - Include both in the extraction payload.

2) **Switch extraction to a background-job flow (so it cannot time out the UI)**
   - Create a new backend function (edge function) that behaves like the existing `generate-listing` job runner:
     - `action: "extract"` → returns `{ job_id }` immediately
     - `action: "poll"` → returns `{ status, progress, result }`
     - `action: "cancel"` → cancels the job
   - The heavy work runs in the background using `EdgeRuntime.waitUntil(...)`.
   - The page polls progress and never “hangs” or loses state.

3) **Upload files to storage first (no base64 in UI state)**
   - Replace in-browser base64 conversion with **upload-to-storage first**, then send only `{ bucket, path, mimeType, name, size }` to the extraction function.
   - Add **resume support**: store `job_id` + draft inputs in `sessionStorage` so if the page refreshes, it continues polling instead of resetting.

**Files**
- `src/pages/ListingPortalSubmit.tsx` (UI fields + job submit/poll/cancel + resume)
- New: `supabase/functions/portal-listing-extractor/index.ts` (job-based listing extraction)
- `supabase/config.toml` (register the new function)

---

### B) Large uploads target (up to ~100MB/file) with minimal failure risk
**Reality check:** allowing 100MB uploads reliably requires **resumable uploads**. A normal single-request upload is more likely to fail on mobile/weak connections.

**Plan**
1) Implement **resumable upload** for large files (threshold-based, e.g. > 20–30MB):
   - Use Supabase Storage’s **TUS resumable** endpoint (recommended) via a client helper.
   - Show upload progress and retry automatically on transient network failures.
2) For very large PDFs, avoid sending the entire binary to AI:
   - Generate a **signed URL** for the uploaded PDF in the backend job.
   - Use Firecrawl (if configured) to extract text/markdown from the PDF URL, then send **text** to AI instead of embedding huge base64.

**Files**
- New: `src/lib/storageResumableUpload.ts` (resumable upload helper)
- `src/pages/ListingPortalSubmit.tsx` (use resumable for large files)

---

### C) Fix the faded monogram loader (make it black, bigger, and readable)
**Problem today**
- `ListingPortalSubmit.tsx` uses `jbj-monogram-light-transparent.png` on a light background + pulse → looks faded.

**Plan**
1) Replace the loader in:
   - Extracting phase
   - Submitting phase
2) Use the existing premium loader components:
   - `BrandedLoader` / `BrandedLoaderInline` with `variant="light"`
3) Increase size (visually stronger) and remove opacity/pulse that reduces contrast.

**Files**
- `src/pages/ListingPortalSubmit.tsx`
- Possibly adjust `src/components/ui/BrandedLoader.tsx` to support a larger “xl” size option cleanly (if needed)

---

### D) Header search hover blink bug (stabilize hover behavior, keep hover as you requested)
**Where:** `src/components/GlobalHeader.tsx`

**Likely cause**
- Hover-triggered state changes + extremely fast close timer (40ms) can cause a rapid open/close loop when pointer transitions between trigger/bridge/panel.

**Plan**
1) Standardize to pointer events:
   - Change the search trigger from `onMouseEnter` → `onPointerEnter`
2) Add hover stabilization:
   - Increase close delay for utility menus (search/language/account) to ~150–250ms
   - Don’t re-run `setActiveMegaMenu(menu)` if it’s already active
   - Ensure the “bridge zone” fully covers the gap between icon and panel so pointer never “falls through”
3) Keep click-to-pin behavior intact.

**Files**
- `src/components/GlobalHeader.tsx`

---

### E) Fix the “AI Tools” navigation scroll jump (lands on “Ready to Get Started” then scrolls up)
**Root cause**
- `ScrollToTopOnMount` uses `useEffect`, which runs after paint → you see the old scroll position for a moment, then it snaps.

**Plan**
1) Change scroll-to-top on route change to run **before paint**:
   - Replace `useEffect` with `useLayoutEffect`
2) Avoid smooth scrolling on navigation resets (use `auto/instant`).

**Files**
- `src/components/ScrollToTop.tsx`

---

### F) “Discover all free tools” search not wired (stamp search should find stamp generator)
**Where**
- Broker toolkit “Discover All Free Tools” section is `src/components/broker-toolkit/BrokerToolkitTools.tsx`
- It currently lists tools but has **no search input** in that section.

**Plan**
1) Add a search bar and wire filtering across:
   - `TOOLS`
   - `SUPPORT_OPERATIONS` (optional, if you want those searchable too)
2) Match by:
   - tool.name
   - tool.description
   - (optional) category label
3) Confirm typing `stamp` shows **JBJ AI Stamp Generator** immediately.

**Files**
- `src/components/broker-toolkit/BrokerToolkitTools.tsx`

---

## Backend technical design (for the new Smart Listing Creator extractor)
### New function: `portal-listing-extractor`
- **Input (extract):**
```json
{
  "action": "extract",
  "listing_category": "secondary_offplan",
  "files": [{ "bucket":"...", "path":"...", "name":"...", "mimeType":"...", "size":123 }],
  "url": "https://...",
  "text": "..."
}
```
- **Output:**
  - immediate: `{ "success": true, "job_id": "..." }`
  - poll: `{ "success": true, "status": "pending|processing|completed|failed|cancelled", "progress": "...", "result": {...} }`

### AI approach (reliable structured output)
- Use tool-calling schema for the listing fields you already use in `ListingPortalSubmit` (`title`, `description`, `price`, `bedrooms`, etc.)
- Prefer sending:
  - extracted text (from Firecrawl for PDFs/URLs)
  - a limited number of representative images (for brochures/floor plans) after downscaling

---

## How you’ll access/verify each fix
- Smart Listing Creator: `/listing-portal/submit`
  - You’ll see **URL** + **Paste Text** inputs in Upload phase
  - Extraction will show progress + a **Cancel** button
  - Leaving/refreshing will resume from draft/job id
- Header search: homepage header search icon hover should no longer blink
- Broker Toolkit tools search: `/broker-toolkit` → “Discover All Free Tools” section → search `stamp`

---

## Implementation order (fastest user-visible wins)
1) Fix scroll jump (`ScrollToTopOnMount` → `useLayoutEffect`)
2) Stabilize header search hover
3) Add search wiring to BrokerToolkitTools
4) Smart Listing Creator: add URL/text fields + storage-first upload
5) Smart Listing Creator: background job extractor function + polling + resume
6) Loader/monogram contrast improvements

