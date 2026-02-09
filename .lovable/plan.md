
## What will be fixed (mapped to your complaints)

1) **Back button not clickable + “Go back” arrow missing on 404 + crashes when using back**
- Fix the floating navigation arrows so they are always clickable, always visible when they should be, and never crash the app.
- Ensure the **404 page** is padded below the header and has a reliable back action even if there is no “previous” route in the session stack.

2) **Header search must open on HOVER (not only click)**
- Desktop: hover opens the premium Global Search immediately.
- Touch/mobile: still click-only (hover doesn’t exist), but behavior stays stable.

3) **Listing Admin: broken projects (no photos/docs), “Repair” broken, hashtags/markdown (# / #####) still visible**
- Ensure “Repair” buttons show meaningful errors (rate limit / credits / missing source) instead of “broken”.
- Ensure projects like “Amelia/Camelia”, “Quick Vista Heights”, etc. show:
  - **All available images** (not 0, not 1 when more exist)
  - **Documents** (brochure/payment plan/floor plans when available)
  - **No hashtags** (and no “#####” markdown headers) anywhere in visitor-facing pages

4) **Mortgage Calculator: “Request Mortgage” goes to 404**
- Fix the CTA to go to a valid route (or open your external form correctly), and remove invalid nested interactive markup that can cause “not clickable” issues.

5) **Owner verification / AccessDenied loop + unreadable buttons**
- Stop the “I’m Owner but still getting /403” UX loop by making verification state handling more robust and user-visible.
- Make “Retry Verification” and “Sign Out” buttons high-contrast and premium (no gray-on-gray).

6) **Global audit for broken buttons**
- Systematically find and fix the patterns that create non-clickable buttons across the app (overlays, pointer-events, invalid nesting, missing routes).
- Add an internal Owner-only “Button Audit” diagnostic view to automatically surface common click blockers.

---

## Why these issues are happening (root causes we can see already)

### A) The runtime crash: `Cannot read properties of null (reading 'useRef')` from Radix TooltipProvider
This is a classic “invalid hook call / dispatcher null” symptom and results in a blank screen. Even if it “only happens sometimes”, it must be eliminated first because it makes everything else look broken.

### B) “Not clickable” buttons often come from:
- Invalid HTML like **`<a><button>...</button></a>`** (present in the mortgage page pattern)
- Click-blocking overlays (absolute layers without `pointer-events-none`)
- Buttons hidden by `opacity-0 pointer-events-none` logic that doesn’t match the state
- Missing routes (CTA navigates to a route that doesn’t exist → 404)
- Z-index stacking issues (a fixed header/overlay sitting above controls)

### C) Hashtags/“#####” still visible
Your project descriptions (especially imported ones) contain markdown headers like `##### Project general facts`. We currently render:
- `project.description` using `renderMarkdownToHtml()` (good)
- but **other text fields** (notably `location_description`) are rendered as plain `<p>` (so markdown/hashtags can still appear there). That’s why you still see it on some projects.

### D) Listing images/documents missing after “Repair”
The repair pipeline relies on linking approved projects back to `pending_project_imports` via `slug` and “approved/merged” status. We already have:
- `repair-approved-projects` (supports approved + merged)
- `repair-project-images` (currently only looks at approved)
So some “repaired” projects can still have no assets because the source record is “merged”, not “approved”, or because reelly-imported projects need a different asset source.

---

## Implementation plan (sequence and files)

### Phase 1 — Stop the crash first (TooltipProvider / useRef error)
Goal: app never blank-screens from TooltipProvider.

1. **Audit the TooltipProvider usage**
   - Files involved:
     - `src/components/ui/tooltip.tsx`
     - `src/App.tsx` (currently wraps the entire app with `<TooltipProvider>`)
     - Components that also wrap with TooltipProvider (CRM cards, admin pages, sidebar, etc.)
2. **Make TooltipProvider safe**
   - Remove “global” TooltipProvider wrapper in `App.tsx` (tooltips still work because many sections already wrap locally; we’ll ensure a single consistent pattern).
   - Standardize to *one* provider strategy (either global-only or local-only). Given the crash, we’ll pick the approach with least surface area:
     - Keep provider **local** where tooltips are used (safer, reduces chance of a global provider being involved in a bad render boundary).
3. **Add a minimal fallback so tooltips cannot crash rendering**
   - Create a small wrapper component around Radix TooltipProvider that fails “closed” (tooltips may not appear, but app must not crash).
   - Add logging so if something still triggers, we can pinpoint which route triggers the invalid hook call.

Acceptance criteria:
- Back button and 404 navigation no longer triggers blank screens.
- No TooltipProvider-related runtime error.

---

### Phase 2 — Fix the floating Back/Up/Down navigation (clickability + always show on 404)
Files:
- `src/components/PageNavigation.tsx`
- `src/pages/NotFound.tsx`
- `src/components/MainLayoutWrapper.tsx` (where PageNavigation is injected)

Work:
1. **Make Back button always render**
   - Current logic only shows Back if `stack.length >= 2`.
   - Change to always show a Back control, using:
     - If we have a previous route in stack → `navigate(previous)`
     - Else → `navigate(-1)` and if that fails (edge case) route to `/`
2. **Ensure clickability**
   - Add explicit `pointer-events-auto`, `select-none`, and `touch-action: manipulation` to the container and buttons.
   - Raise z-index above everything (`z-[11000]` or above the mega-menu and dialogs).
3. **404 page spacing + bigger monogram**
   - Add top padding (`pt-28` or similar) so it never touches the header.
   - Increase monogram size and keep layout premium.
   - Add a visible “Back” action inside the 404 page that never depends on history state.

Acceptance criteria:
- Back arrow is always clickable.
- 404 page shows the navigation arrows (and page does not sit under the header).
- No crash after using back.

---

### Phase 3 — Header search: open on hover (desktop) + keep click
Files:
- `src/components/GlobalHeader.tsx`
- `src/components/GlobalSearchModal.tsx` (no major changes expected)

Work:
1. On desktop only:
   - Add `onMouseEnter` to the search icon trigger to open the modal
   - Add a small delay (e.g., 75–150ms) to prevent accidental opens while passing cursor
2. Keep click behavior unchanged.
3. Avoid hover-open on touch layouts by gating with `useIsTouchLayout()`.

Acceptance criteria:
- Hover opens search modal.
- Click still works.
- No flicker / no accidental closing from mega-menu hover logic.

---

### Phase 4 — Mortgage “Request Mortgage” goes to 404 + fix non-clickable markup patterns
Files:
- `src/pages/MortgageCalculator.tsx`
- `src/components/MortgageCalculator.tsx`
- `src/constants/stats.ts`
- `src/App.tsx` (route aliases)

Work:
1. **Fix invalid nesting**
   - Replace `<a><Button/></a>` with `Button asChild` + `<a ...>` inside, or use a Button `onClick={() => window.open(url, "_blank")}`.
2. **Guarantee destination exists**
   - If the intention is external form: ensure it opens the external URL reliably with `target="_blank"` and correct `rel`.
   - If the intention is internal: add a route alias like `/property-inquiry-form` → redirect to `/contact?intent=mortgage` (so it never 404s).
3. **Run a codebase audit for similar patterns**
   - Search and fix any other occurrences of nested anchors/buttons causing “not clickable”.

Acceptance criteria:
- Request Mortgage never goes to your site’s 404.
- CTA is clickable on iPhone Safari and desktop.

---

### Phase 5 — Listing Admin “Repair” + projects missing images/docs + remove hashtags everywhere
Files (frontend):
- `src/pages/ListingAdmin.tsx`
- `src/components/listing-admin/PendingImportCard.tsx`
- `src/components/listing-admin/SyncDashboard.tsx`

Files (backend functions):
- `supabase/functions/repair-approved-projects/index.ts`
- `supabase/functions/repair-project-images/index.ts`
- `supabase/functions/repair-project-extraction/index.ts`
- (Potentially add) a **single-project repair** function for immediate “fix this one now” action

Work:
1. **Make Repair errors readable**
   - In `PendingImportCard.tsx`, parse edge-function error payloads (429 rate limit, 402 credits, missing source URL) and show actionable toast messages.
2. **Fix “approved vs merged” source mismatch**
   - Update `repair-project-images` to look for `pending_project_imports` records in `["approved","merged"]`.
3. **Stop “0 images” due to over-filtering**
   - Update `src/lib/imageUtils.ts` so “trusted domains” (your storage + reelly image domains) are allowed even if the URL contains words like “thumbnail” or “banner”.
4. **Ensure markdown/hashtags are removed for ALL text fields**
   - In `ProjectDetailLayout.tsx`, render `location_description` using the same markdown cleaner (`renderMarkdownToHtml`) instead of plain `<p>`.
   - Do the same for any other “raw string” fields that can contain markdown headers.
5. **Add Owner-only “Repair this project now” inside Listing Admin editor**
   - One button per project:
     - Repairs metadata
     - Repairs images
     - Repairs documents/floor plan docs when available
     - Then refreshes the project query immediately

Acceptance criteria:
- Clicking Repair does not look “broken”; it either repairs or explains why it cannot.
- Amelia/Camelia/Quick Vista type projects show images and documents when available.
- No hashtags / markdown headers visible anywhere in visitor-facing pages.

---

### Phase 6 — Sobha: bigger section, logo icon, richer developer info, floor plans extraction
Files:
- `src/components/project-detail/DeveloperInfoCard.tsx`
- `src/pages/DeveloperDetail.tsx` (if needed)
- Repair pipeline functions for assets

Work:
1. **Logo fallback mapping**
   - If developer `logo_url` is missing, use a curated mapping for top developers (e.g., Sobha → `/developers/logos/sobha-logo.webp`).
2. **Richer Sobha info**
   - Display founded year / HQ / projects counts when the database has them.
   - If the DB lacks data, do not invent facts; we’ll show “—” rather than incorrect content.
3. **Floor plans**
   - Ensure floor plan PDFs end up in `project_documents` with `document_type="floor_plan"` and are surfaced in `FloorPlanGallery`.

Acceptance criteria:
- Sobha shows Sobha logo (not a generic building icon).
- Floor plans appear where available.

---

### Phase 7 — Owner verification / AccessDenied loop + button contrast
Files:
- `src/contexts/AuthContext.tsx`
- `src/components/OwnerGuard.tsx`
- `src/pages/AccessDenied.tsx`
- `src/components/ui/button.tsx` (only if new variant needed)

Work:
1. **Prevent confusing /403 loops**
   - If `verify-owner` returns true, never redirect to /403.
   - If verification fails temporarily, show the retry UI (already in OwnerGuard), but make it consistent and high-contrast.
2. **Fix button readability**
   - Replace gray outline buttons on black with `variant="dark-outline"` or `variant="primary"` so text is always readable.

Acceptance criteria:
- As Owner, you do not land on /403.
- Retry/SignOut buttons are clearly readable.

---

### Phase 8 — Global “Button Audit” (Owner-only) + codebase fixes
Goal: you shouldn’t have to report “this button isn’t clickable” repeatedly.

Work:
1. Create an Owner-only internal page:
   - Scans DOM for:
     - nested interactive elements (a>button, button>a)
     - elements with `pointer-events: none`
     - buttons covered by overlays (basic heuristic)
     - links to undefined routes (compare against route manifest)
2. Add a small “report” panel listing offenders + file hints.
3. Fix the biggest offenders found (starting with navigation, CTAs, header utilities).

Acceptance criteria:
- We can quickly detect and fix future click regressions.

---

## What I need from you (to avoid guessing)
1) The exact URL where the **back button** is visible but not clickable (copy/paste).
2) The exact project slug/name you mean by “Amelia residence” (it might be “Camelia Villas”).
3) When “Repair” says broken: do you see a toast error message? If yes, paste it.

---

## Test checklist you will run after implementation (fast but complete)
1) Open any page → use floating Back arrow 10 times across routes → no crashes.
2) Go to a non-existent route → 404 page:
   - Content not under header
   - Back works
   - Floating arrows visible
3) Header search:
   - Hover opens modal (desktop)
   - Click opens modal (desktop + mobile)
4) Listing Admin:
   - Pick the broken project → click “Repair this project now” → refresh → images/docs appear
   - Project detail page shows no hashtags or markdown headers anywhere
5) Mortgage calculator:
   - Request Mortgage CTA → does not go to 404, opens correct form reliably

---

## Delivery order (time-critical)
1) Crash fix (TooltipProvider invalid hook) + navigation reliability
2) Mortgage request 404
3) Listing Admin repair + missing assets + hashtag removal
4) Hover search behavior
5) Owner verification UX polish + button readability
6) Button audit page + systematic cleanup
