
## Goal
Make Listing Admin behave like a true “publish pipeline”:
- **Published count** reflects only projects that are actually marked `is_published = true` (and matches the website).
- **Projects tab** shows only published projects; **Pending for Approval** shows everything not approved/published yet.
- **Sarah extraction** becomes location-accurate (e.g., UAQ vs Al Marjan Island), merges new links/files into the same pending draft, and produces a “map flyover” animation section.
- **Admin UI** fixes: readability, pagination controls visibility, sticky filters layout, chat auto-scroll behavior, and message bubble corner styling.

---

## What’s happening now (root causes)
1. **Projects tab is not filtered**: `useProjectsPaginated()` pulls from `projects` without `.eq("is_published", true)`, so your “Projects” view can include draft/unpublished/broken items.
2. **Website directories may include unpublished**: `useProjectsListing()` currently counts/selects from `projects` with no `is_published` filter, so front-end “Browse X projects” and some lists can drift from “published only”.
3. **Auto-approve created bad live records**:
   - `bulk-approve-imports` sets `is_published: true` unconditionally.
   - Some discoveries/imports were auto-approved even when missing media/price/details, creating “published but broken” projects.
4. **Sarah location errors**: current extraction trusts scraped text too much and doesn’t validate emirate/area against a canonical UAE area list or coordinates.
5. **Chat UX**:
   - It always scrolls to bottom on any message update (so when you try to read, it snaps).
   - “Processing 5 links” is slow because URL processing is sequential and not reported incrementally.
6. **UI contrast/layout issues**: some panels mix black backgrounds with white cards + low-contrast text; pagination buttons sit on a background that reduces readability; sidebar filters aren’t full-height/sticky enough; chat bubble bottom corners use asymmetric rounding (looks “broken”).

---

## Implementation plan

### 1) Fix counts + make “published” consistent everywhere
**Backend logic (no schema change):**
- Define a single rule: **Published = `projects.is_published = true`** (you confirmed this).

**Code changes:**
- Update `useProjectsListing()` to:
  - Count only `is_published = true`
  - Fetch only `is_published = true`
- Update any remaining directory queries (Properties/PropertiesReelly) to use the published-only listing hook so the website and admin “published” number match.

**Acceptance**
- Admin published badge shows the same number as the live website directory.

---

### 2) Split admin Projects into “Published” vs “Drafts/Unpublished”
**UI behavior**
- In `/listing-admin` Projects view:
  - Add tabs: **Published** (default), **Drafts**
  - Published tab uses `is_published=true`
  - Drafts tab uses `is_published=false` (and optionally a third “All” tab for internal auditing)

**Code changes**
- Extend `useProjectsPaginated(page, size, { publishedFilter })` to support:
  - `publishedFilter: true | false | "all"`
- In `ListingAdmin.tsx`:
  - Projects counter next to the button stays **published-only**
  - Pagination total pages uses the correct count for the selected tab

**Acceptance**
- Broken/unapproved imports never appear in the Published Projects tab.
- Drafts appear only under Drafts.

---

### 3) Stop accidental publishing during approval/import
**Key fix**
- Change `bulk-approve-imports` to stop forcing `is_published: true`.
  - Add request flag like `publish: boolean` (default **false**).
  - Only set `is_published=true` when the caller explicitly requests it (e.g., Sarah “Auto-Approve LIVE” mode).

**Callers**
- `extract-listing-from-link`:
  - When `auto_approve` is enabled, call bulk approval with `publish: true`
  - Otherwise it queues pending only
- Daily/automated sync jobs:
  - Ensure they do **not** publish by default; they should create pending imports for review.

**Data correction**
- Add an admin “Unpublish broken live projects” utility (non-destructive):
  - Finds projects where `is_published=true` AND (cover image invalid OR no images OR description null)
  - Sets `is_published=false`
  - Logs affected slugs for review

**Acceptance**
- Nothing goes live unless you explicitly approve/publish it.

---

### 4) Make Pending Approval cards always show real content (price, description, location, docs, photos)
You already have a strong preview renderer at `/listing-admin/preview/:id` (`PendingImportPreview.tsx`) and high-quality cards (`PendingImportCard.tsx`). The missing content usually comes from the extractor inserting incomplete records.

**Improvements**
- In `extract-listing-from-link`:
  - Decode `_next/image?url=...` and filter out `/flags/`, `/icon/`, `/sprite/`, etc before selecting hero/cover images.
  - Require a minimum “usable data” threshold:
    - If images list is empty after filtering, set `review_notes = "INCOMPLETE"` and do not allow publish.
  - Extract PDFs/documents more aggressively and store them in `documents[]` for the pending import.

**Pending Updates (listing_pending_updates)**
- For “new_project” suggestions that are currently placeholders:
  - Add an **Enrich Now** button that runs a targeted extraction job (using the stored source URL or source payload) to generate a proper `pending_project_imports` item for review (with full preview).
  - Keep the “Approve/Reject” but prefer “Enrich → Review → Approve”.

**Acceptance**
- Pending approval cards always show: hero image (or branded placeholder), price (or POA), location/emirate, short description, media counts.

---

### 5) Fix Sarah’s location accuracy (UAQ vs RAK issues)
**Design**
Add a deterministic “location validation” layer after AI extraction:

1) **Canonical match** against your `areas` table:
- Try matching extracted `location/area_name` to `public.areas` (fuzzy match by slug/name synonyms).
- If match found:
  - Set `area_name`, `emirate`, `latitude`, `longitude` from that canonical area.

2) **Geocode fallback** (only if no canonical match):
- Use a lightweight geocode call (OpenStreetMap Nominatim) with:
  - `${project_name}, ${location}, ${emirate}, UAE`
- Reverse-check the returned address:
  - If emirate mismatches, downgrade confidence and require manual review.

3) Store a `location_confidence` and `location_notes` in the pending import (either new columns or embed into `review_notes` JSON) so you can see why it decided something.

**Acceptance**
- “Umrah” in Umm Al Quwain will not be labeled as Al Marjan Island unless the coordinates match it.

---

### 6) Add “Map Flyover” (template animation) + static interactive map
You selected **Template animation** (no per-project video file generation).

**What we’ll build**
- A new section in `ProjectDetailLayout` above the existing map:
  - “Location Flyover”
  - A play button triggers a scripted Leaflet animation:
    - Start zoomed out (UAE-level)
    - Fly to project coordinates (zoom in)
    - Drop/pulse pin + show project name overlay then fade it out
- Keep your existing interactive map section below it (user can still pan/zoom).

**Implementation**
- Create `ProjectLocationFlyover.tsx` that uses Leaflet’s `flyTo` sequence + overlay text animations.
- Use your existing “Approved Map Card” interaction standards (no scroll-wheel trap).

**Acceptance**
- Users see a “video-style” flyover and still can interact with the real map afterwards.

---

### 7) Auto-merge new links/files into the same pending listing (Auto-merge pending)
**Behavior**
When you already have a pending draft waiting for approval, and you send another link/files for the same project:
- Sarah should **merge** new media + new fields into that same pending import instead of creating a separate “fake” listing.

**Implementation**
- Track `last_active_import_id` per `listing_admin_chat_sessions`.
- In `extract-listing-from-link`, when `queue=true`:
  - Try to match the new extraction to:
    1) exact slug match, else
    2) strong name similarity match against the session’s last pending import, else
    3) fallback: create new pending import
- Merge rules (safe defaults):
  - Append new images/documents (dedupe by URL)
  - Fill missing fields only (do not overwrite non-null unless confidence is high)

**Acceptance**
- You can “feed” Sarah multiple sources and she consolidates into one review card.

---

### 8) Chat UX + layout fixes
**Chat scroll**
- Change auto-scroll logic:
  - On initial load: scroll to bottom.
  - After that: only auto-scroll if the user is already near the bottom (e.g., within 120px).
  - If user scrolls up, don’t force them down; show a “Jump to latest” button.

**Two-panel experience**
- Update `/listing-admin` Chat view to be 2-column:
  - Left: chat
  - Right: “Latest extracted / queued” listing cards (instant approve/review)
  - This matches your requirement: “queueing should happen in the second screen”.

**Chat bubble corners**
- Remove asymmetric `rounded-tr-sm / rounded-tl-sm` and use consistent rounding so bottom corners don’t look broken.

**Speed perception**
- In UI: show per-link progress (e.g., “1/5 done…”) and render results into the right panel as they arrive (requires extractor to process URLs in parallel and return structured results quickly).

---

### 9) Admin UI readability + pagination controls
**Pagination controls**
- Wrap the pagination bar with a dedicated background layer:
  - `bg-gradient-to-r from-[#FDFBF7] to-[#EDE4D3] border-2 border-gold/30 rounded-xl px-4 py-3`
- Ensure “Next” button disabled state is still readable (not faded into background).

**Filters sidebar**
- Make the left filter Card full-height sticky:
  - `h-[calc(100vh-260px)] sticky top-44`
  - Put `ListingSearchFilters` inside a `ScrollArea` so Developer/Project/Emirate/Area filters are always visible.

**Data Ops panels**
- Normalize panel backgrounds to the champagne gradient system to avoid “white on black” strain.
- Remove any remaining log lines containing emoji glyphs in admin-only logs (optional, but improves consistency).

---

## Files we will touch
- `src/hooks/useProjects.ts` (published-only listing hook + paginated filters)
- `src/pages/ListingAdmin.tsx` (Projects tabs, counts, pagination container, chat two-panel layout)
- `src/components/listing-admin/ListingAdminChat.tsx` (scroll logic, bubble rounding, emit extracted cards to right panel)
- `src/components/listing-admin/ListingSearchFilters.tsx` (layout container changes only)
- `supabase/functions/extract-listing-from-link/index.ts` (proxy URL decoding + image filtering + merge-into-pending logic + parallel URL processing)
- `supabase/functions/bulk-approve-imports/index.ts` (don’t force publish; honor `publish` flag)
- New: `src/components/project-detail/ProjectLocationFlyover.tsx`
- `src/components/project-detail/ProjectDetailLayout.tsx` (add the flyover section)

---

## Testing checklist (end-to-end)
1. Paste 5 links in Sarah chat:
   - UI remains on newest messages
   - Right panel fills with queued cards as soon as each finishes
2. Upload brochure + then send a link for the same project:
   - One pending import gets enriched (not duplicated)
3. Approve a pending listing:
   - It appears in **Published Projects** and on the website directory
4. Confirm “Projects (Published)” count matches website directory count
5. Open Umrah project:
   - Emirate/location correct
   - Flyover animation zooms out → zooms in to correct coordinates
