
## What I verified (so we fix the right things)
- The **project internal page is currently crashing** and shows the global error screen with:
  - “Something went wrong”
  - error text: **`render2 is not a function`**
- This is a React runtime failure that happens during render (not a data issue). It must be fixed first because it blocks access to every project page and also makes Listing Admin feel “broken” when you try to open items.

Separately, I also see strong signals that Listing Admin “Full Synchronize / Full Extraction” isn’t truly resumable/persistent (jobs are stuck in `paused`), and the mobile UI needs responsive cleanup.

---

## Priority order (fastest path to stop the bleeding)
1) **Fix the project page crash (`render2 is not a function`)**
2) **Fix mobile hamburger menu not opening**
3) **Fix mobile card overflow + TrustBar card height alignment**
4) **Fix “Find Your Starting Point” layout to be square tiles (3 per row on mobile)**
5) **Fix Listing Admin sync reliability (Full Synchronize + Full Extraction + clickable “1809 available” card)**
6) **Enforce “no hashtags anywhere” at the source + clean existing descriptions**
7) **Fix missing photos cases (e.g., “Amelia Residence”) via Reelly detail fetch + proper image persistence**

---

## 1) Fix: Project page crash (“render2 is not a function”)
### Why this happens (plain language)
This error comes from React trying to render a **Context Consumer** somewhere, but it receives the wrong type of child (it expects a function). That’s why the crash happens before the page can render.

### Implementation approach
A. **Isolate the exact component causing the crash**
- Temporarily wrap major blocks inside `ProjectDetailLayout` (Gallery, Units, Map, Amenities, Media, etc.) with a small “section boundary” wrapper so one section can’t crash the whole page.
- Use a binary “enable/disable sections” approach so we identify the failing section quickly.

B. **Fix the offending usage**
- Once identified, fix the exact component usage that is rendering a `Context.Consumer` incorrectly (or calling a library component in an invalid way).
- After the fix: project pages must render even if some optional section fails (map/documents/etc.).

C. **Make the error UI match your premium design system**
- Update `AppErrorBoundary` (and keep `RouteErrorBoundary` consistent) so the fallback UI uses the same premium champagne styling, spacing, and typography as the rest of the product (no “random” UI).

**Acceptance criteria**
- Visiting `/project/:slug` loads a premium project page (no global crash).
- No “render2” error in console.
- If a single section fails, it shows a contained error state inside that section, not a full page failure.

---

## 2) Fix: Mobile hamburger doesn’t open
### Likely causes
- Sheet/overlay is opening but positioned off-screen due to hardcoded `top`/height overrides.
- Another overlay layer is intercepting clicks on mobile.
- A ref/trigger issue with Radix `SheetTrigger` + styling overrides.

### Implementation approach
- Simplify the mobile `SheetContent` positioning:
  - Use **full viewport**: `top-0 h-[100dvh]` (no header-offset hacks).
  - Put the “menu header” inside the sheet content, not by shifting the whole sheet down.
- Confirm z-index + pointer-events are correct (overlay always clickable, content always visible).
- Ensure hamburger trigger is always visible/clickable on iOS Safari and Android Chrome.

**Acceptance criteria**
- On a phone viewport, tapping hamburger always opens the menu.
- Tapping outside closes it.
- Menu content is scrollable and doesn’t clip.

---

## 3) Fix: TrustBar (4 cards) mobile layout issues (uneven size + overflow)
### What’s happening
Your TrustBar cards use large padding and a horizontal flex layout in a 2-column grid. On small widths this can:
- force text wrapping inconsistently (making 2 cards taller)
- cause text to overflow “outside” the visual card if min-width/overflow rules aren’t set

### Implementation approach
- Make every TrustBar card the same height per row:
  - Use `auto-rows-fr` on the grid and `h-full` on each card wrapper.
- Reduce padding on mobile (`px-3 py-3` on base, keep larger padding on md+).
- Add `min-w-0` to text containers + safe wrapping:
  - `min-w-0`, `break-words` (or `truncate` where appropriate)
- Add `overflow-hidden` to the card container to guarantee nothing spills outside.

**Acceptance criteria**
- All 4 TrustBar cards look uniform on mobile.
- No text or icon bleeds outside a card.
- Row heights align.

---

## 4) Fix: “Find Your Starting Point” should be square tiles (3 per row on mobile)
### Current issue
The buttons/cards are visually too long and stretched on mobile.

### Implementation approach
- Change the mobile grid to **3 columns** (and increase to 4 on slightly bigger phones if needed):
  - Example: `grid-cols-3 sm:grid-cols-4 md:grid-cols-6 ...`
- Force square tiles on mobile:
  - `aspect-square` on the clickable tile container (mobile only; remove on desktop if needed).
- Reduce label size and tighten spacing so 3-per-row stays readable.

**Acceptance criteria**
- On mobile: the section shows square tiles, ~3 per row, with spacing between them.
- On desktop: preserve your dense “11 cards” layout.

---

## 5) Fix: Listing Admin sync is “stuck” + Full Extraction controls inconsistent
### What I found
- The UI loops calls to the sync function, but **it does not reliably persist progress** to the database job record in a way that survives refresh.
- In the backend job table, there are multiple **`paused`** jobs with **missing cursor data**, which makes “resume” impossible and causes the UI to feel permanently stuck.

### Implementation approach
A. Make sync truly resumable and refresh-proof
- When “Full Synchronize” starts:
  - Create a sync job record immediately (reelly job type)
  - Always pass `job_id` into the backend sync call
  - After each batch, persist:
    - current page / totals
    - next cursor
    - stats (created/updated/skipped/errors)
- After refresh, Listing Admin reads the active job and can:
  - show progress
  - resume from cursor
  - allow cancel/clear

B. Fix Full Extraction “off / not opening”
- Don’t rely on async React state (`apiConnected`) right after testing.
- Make `handleTestApiConnection()` return a boolean/result directly to Full Extraction.
- Ensure Full Extraction button is never mistakenly disabled by stale state.

C. Make the “1809 projects available” card actionable
- Clicking it should open the Reelly queue list / approvals / recent imports, not do nothing.

D. Add an emergency “Clear stuck job” action
- If a job is `paused` but has no cursor, mark it as failed/cancelled so it doesn’t keep hijacking resume detection.

**Acceptance criteria**
- Full Synchronize progresses and finishes, or can always resume after refresh.
- Full Extraction runs steps consistently and does not silently stop.
- Clicking the “projects available” card opens a list view.

---

## 6) Fix: Remove hashtags everywhere (source-level + existing data)
### Goal
No “#DubaiRealEstate …” anywhere, including project detail “general facts” and description blocks.

### Implementation approach
- **On ingestion (Reelly sync functions):**
  - Strip hashtags from `overview/description/short_description` before saving.
- **On display (frontend):**
  - Ensure every component that renders project description uses the same cleaning pipeline (not raw text).
- **Backfill existing records:**
  - Run a one-time database update to remove hashtags in:
    - `projects.description`
    - `pending_project_imports.description`
    - any other description-like columns currently displayed

**Acceptance criteria**
- Zero hashtags visible on project pages, admin preview, cards, and detail sections.

---

## 7) Fix: “Amelia Residence incomplete / without photos”
### Likely cause
Reelly list endpoint often does not contain full gallery; gallery/docs come from detail fetch/backfill. If the detail fetch isn’t completing, the project remains with only a cover or nothing.

### Implementation approach
- Ensure “Fetch Missing Details” actually:
  - calls the Reelly detail endpoint
  - writes gallery images into the correct place used by the UI (queue + approved records)
- Ensure approvals copy images correctly into `project_images` for published projects
- Add a “Repair media for this project” action in Listing Admin for one-off fixes.

**Acceptance criteria**
- Amelia shows photos (gallery), not “incomplete”.
- Missing media count decreases batch by batch.

---

## Verification checklist (you can validate quickly after I implement)
### Mobile
- Hamburger opens and closes reliably on iPhone/Android
- TrustBar: 2x2 grid looks aligned, no overflow
- Starting Point: square tiles, 3 per row

### Listing Admin
- Full Synchronize completes or can resume after refresh
- Full Extraction button works and steps update
- Clicking “1809 available” opens a list

### Projects
- `/project/:slug` loads (no error screen)
- No hashtags anywhere
- Known missing-media examples (Amelia) show images

---

## Notes / constraints
- Some “Sold Out” projects may legitimately have prices removed by the upstream API; we will show “Sold Out” prominently and avoid misleading “TBA” where possible.
- The immediate blocker is the **project page crash**; everything else becomes easier once the site can render project pages safely.
