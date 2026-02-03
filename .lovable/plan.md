
## What’s actually happening (root causes)

### 1) “Rebuild Queue” only finds 16 items (not 1,336)
Your current “credit-safe” rebuild path calls `discover-all-projects` with:
- `skipMap: true`
- `listingUseFirecrawl: false`

In that mode, the backend tries to discover project links by doing a simple HTTP fetch of `/new-projects/page/N/` and regexing `href=` values.

Problem: Provident’s listing pages are **Gatsby/JS-driven**. A plain server fetch often returns a mostly-empty shell (or a limited set of repeated links), so the backend only sees a tiny repeated subset (≈16) instead of the full inventory.

That’s why you get “Queue rebuilt … 16 pending”.

### 2) “Queue cleared” messaging is confusing (and sometimes destructive flows are too close)
Even though “Rebuild Queue (Add Missing)” is intended to be non-destructive, other nearby actions (like queue reset / wipe flows) and the wording (“cleared successfully”) make it feel like the rebuild deleted your work.

We need to make rebuild truly non-destructive, and make destructive actions unmistakably different (and harder to trigger accidentally).

### 3) “All photos are broken”
Your extraction pipeline currently “upscales” CloudFront URLs to `/x/1200x800/` (e.g. in `_shared/provident/extract.ts` and `provident-batch-sync`). For Provident’s CDN, many of these sizes **do not exist / are denied**, causing images to 403 (AccessDenied). That makes galleries look broken even when the listing exists.

This is fixable immediately by stopping the forced resize and repairing existing stored URLs.

### 4) Credits exhaustion (402) is expected — but we must stop spending credits on discovery
Firecrawl 402 means you have no credits. The permanent fix is:
- **Discovery must not require Firecrawl at all**
- **When credits are exhausted, extraction must either (a) use a non-Firecrawl source or (b) be disabled clearly**
Right now discovery/extraction still has paths that can hit Firecrawl, which is unacceptable.

---

## Goal (the “one last time, permanently” fix)
1) “Rebuild Queue (Add Missing)” must reliably discover **~1,336 project detail URLs** without Firecrawl.
2) The queue UI must show the full inventory (paginated), not just 16.
3) Images must stop breaking (no invalid CloudFront resizing), and we must bulk-repair already-stored broken URLs.
4) The system must never burn credits silently again:
   - discovery = 0 Firecrawl
   - extraction = only Firecrawl when explicitly enabled and credits are available

---

## Implementation plan (code changes)

### A) Replace “credit-safe HTML regex discovery” with a deterministic Gatsby Page-Data discovery (no Firecrawl)
**Edit:** `supabase/functions/discover-all-projects/index.ts`

**What we’ll change**
- Introduce a new discovery method that fetches Provident’s Gatsby JSON endpoints:
  - Page 1: `https://providentestate.com/page-data/new-projects/page-data.json`
  - Page N: `https://providentestate.com/page-data/new-projects/page/{N}/page-data.json`
- Parse:
  - `result.serverData.data.hits[]` for `slug`, `title`, `bitrix.developer_name`, `project_location`, `price`, and image variants.
- Generate canonical URLs: `https://providentestate.com/new-projects/${slug}`
- Use this method whenever:
  - `skipMap: true` (the rebuild-queue path), regardless of Firecrawl credits.

**Why this fixes the 16-item problem**
Page-data endpoints return listing data as JSON and do not require JS rendering or Firecrawl. That makes discovery stable and complete.

**Also included**
- Make `FIRECRAWL_API_KEY` optional when we’re running in page-data mode (otherwise discovery fails unnecessarily even though we’re not calling Firecrawl).
- Return richer response fields so the UI can show:
  - pages processed
  - URLs discovered in that chunk
  - “new inserts” vs “already existed”

### B) Ensure discovery never overwrites existing queue items (no accidental “break my listings”)
**Edit:** `supabase/functions/discover-all-projects/index.ts`

**What we’ll change**
- Stop using `upsert()` for placeholder creation in discovery.
- Use `insert(..., { onConflict: "slug", ignoreDuplicates: true })` (or equivalent safe insert) so existing rows are never overwritten with empty `images/documents`.

**Why**
Even if `upsert(ignoreDuplicates)` behaves unexpectedly, we will not risk wiping existing extracted content again.

### C) Populate queue rows with metadata at discovery time (so the queue looks real immediately)
**Edit:** `supabase/functions/discover-all-projects/index.ts`

Instead of inserting “name-from-slug”, we’ll store from page-data hits:
- `name`
- `developer_name`
- `location`
- `price_from`
- `bedrooms_min/max` (if present in hit data or parsable)
- `images` as a list using a *known-working* CDN size (see image section below)

This reduces “broken/empty” cards and makes the queue usable even before deep extraction runs.

### D) Fix broken images permanently: remove forced `/x/1200x800/` resizing
**Edits:**
- `supabase/functions/_shared/provident/extract.ts`
- `supabase/functions/provident-batch-sync/index.ts`
- (Any other place forcing `/x/1200x800/`)

**What we’ll change**
- Remove or replace `normalizeCloudfrontImage()` so we do **not** rewrite image URLs to sizes that return AccessDenied.
- Prefer URLs that are already known to work (e.g. `/x/464x312/` or the original variant provided by Provident).
- Keep deduping and placeholder filtering, but do not “invent” larger sizes.

### E) Bulk repair already-broken stored image URLs (queue + projects)
**Add or extend a backend function** (implementation will be in a backend function file):
- Scan:
  - `pending_project_imports.images` (JSON array)
  - `project_images.image_url`
- Replace patterns like:
  - `/x/1200x800/` → `/x/464x312/`
  - (optionally) other blocked sizes → `/x/464x312/`
- Update rows in safe batches, with a dry-run option and a summary report.

This immediately restores visibility across existing listings without requiring Firecrawl.

### F) Make the Rebuild Queue UI truthful and non-destructive (no more “cleared” confusion)
**Edit:** `src/components/listing-admin/SyncDashboard.tsx`

**What we’ll change**
- Rebuild loop will no longer infer progress only from `pending` count.
  - It will display per-chunk:
    - `discovered_urls` (from the function response)
    - `inserted_count` (new items added)
    - `existing_urls`
- Change the final toast to something unambiguous like:
  - “Rebuild complete: discovered 1,336 URLs; added 1,320 new; already had 16.”
- Never show “cleared” wording for rebuild.
- Ensure destructive actions (“Delete queue”, “Full wipe”) require a stronger confirmation step (e.g. typed confirmation) and are visually separated.

### G) Prevent all credit burn by default when credits are exhausted
**Edits:**
- `src/components/listing-admin/SyncDashboard.tsx`
- `src/components/listing-admin/TestOneListingPanel.tsx`
- Backend functions that call Firecrawl (extraction-related)

**What we’ll change**
- Keep the current UI lockout, but make it consistent:
  - When credits exhausted is detected once, the UI stays locked and clearly shows: “Discovery still works; extraction requires credits OR fallback mode.”
- Ensure “Rebuild Queue (Add Missing)” never calls Firecrawl (it won’t after A).
- Optional but recommended “permanent” lock:
  - Persist a server-side flag (database table or existing settings row) so credits exhaustion is shared across sessions/devices and backend functions can hard-stop Firecrawl calls immediately.

### H) Fix “I don’t see listings” (pagination/filters UX)
**Edit:** `src/components/listing-admin/ProjectApprovalQueue.tsx`

If the queue grows to 1,336, users may only see the first page and assume it’s missing.
We’ll make it obvious by:
- Showing “Showing 60 of 1,336” at the top
- Making “Load more” more prominent
- Ensuring default filter is not accidentally stuck on “Complete” (which would show very few)

---

## Validation / acceptance tests (what you’ll verify after release)

### 1) Rebuild Queue correctness
- Go to `/listing-admin`
- Click **Rebuild Queue (Add Missing)**
- Expected:
  - It reports discovery near 1,336 (or the current live count)
  - Queue “Pending” count rises toward the full inventory
  - No “queue cleared” messaging

### 2) Queue visibility
- Open the Queue tab
- Expected:
  - You can see the first 60 listings
  - “Load more” reveals more (eventually reaching full count)

### 3) Images are no longer broken
- In queue cards, images load (no broken thumbnails)
- On any project detail/gallery that was previously broken, images load again after the bulk repair

### 4) No credit burn in discovery
- Rebuild Queue works even when Firecrawl credits are exhausted
- No 402 errors occur during rebuild

---

## Files expected to change
Backend:
- `supabase/functions/discover-all-projects/index.ts` (major fix)
- `supabase/functions/_shared/provident/extract.ts` (image URL fix)
- `supabase/functions/provident-batch-sync/index.ts` (image URL fix)
- New/updated backend function for bulk image repair (name TBD)

Frontend:
- `src/components/listing-admin/SyncDashboard.tsx` (progress + safety + wording)
- `src/components/listing-admin/ProjectApprovalQueue.tsx` (clarify pagination/counts)

---

## Rollout strategy (safe and fast)
1) Deploy discovery fix first (A+B+C). This should immediately remove the “16 only” issue.
2) Deploy image normalization fix (D) and run image repair (E).
3) Ship UI clarity improvements (F+H).
4) Only after that, revisit deep extraction quality (if needed) with a strict “no credit burn without explicit approval” rule.

