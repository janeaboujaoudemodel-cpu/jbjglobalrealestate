
Goal: Make “Fix All Listings” actually fix everything (pending + approved), restore canonical inventory count (1,335), and address the UI issues you listed (Mortgage CTA styling, account dropdown rectangular, inquiry form enhancements, contact links audit, “...more” visibility).

--------------------------------------------------------------------
1) “Fix All Listings” finished but didn’t fix anything (root causes found)
--------------------------------------------------------------------
What’s happening now (from code review):
- The “⚡ Fix All Listings” button runs only:
  Phase 1) `batch-extract-pending` (ONLY for pending queue rows)
  Phase 2) `repair-project-images` (ONLY images for approved projects)
- It does NOT repair approved projects’ missing description/USPs/amenities/location/docs.
- `batch-extract-pending` only targets rows where:
  - review_notes contains PENDING_SCRAPE / INCOMPLETE / ERROR
  - OR images == []
  - OR documents == []
  - OR description is null
  But `documents` / `images` can also be `null` (not just `[]`), which means many broken rows can be skipped.
- The current “Fix All” call uses fixed `limit=200, concurrency=8, throttle=500` which can cause rate limiting / blocking; when blocked, items can keep cycling as ERROR and never truly “fix”.

What “Fix All Listings” must become:
- A deterministic “repair pipeline” that:
  1) Ensures inventory count reaches 1,335 (reconcile missing URLs)
  2) Fixes pending queue extraction completeness (including docs/USP/location/payment breakdown)
  3) Fixes approved projects completeness (metadata + documents + images), not just images

--------------------------------------------------------------------
2) Restore canonical inventory count: 1,335 (you’re seeing 1,330)
--------------------------------------------------------------------
Implementation approach:
A) Add an “Inventory Reconcile” step before extraction:
- Build a backend function (repair/reconcile) that:
  - Discovers project URLs from the 89 listing pages in batches (page ranges)
  - Normalizes + filters URLs to project-detail pages
  - Compares against existing `pending_project_imports` + `projects` slugs
  - Inserts ONLY missing placeholders into `pending_project_imports` (status pending, review_notes PENDING_SCRAPE)
  - Loops until queue distinct slugs == 1,335 (or reports which pages are failing)

B) Update the Listing Admin dashboard UI to:
- Show “Inventory total (Pending + Approved + Rejected + Merged)” clearly
- Add a “Reconcile to 1,335” button that runs the reconcile step and shows progress + remaining gap
- If the source portal temporarily blocks scraping, show a clear “blocked/rate-limited” state and retry guidance (rather than silently “finishing”)

--------------------------------------------------------------------
3) Make Fix All actually “fix everything”
--------------------------------------------------------------------
We will change the “Fix All Listings” flow into 3 phases:

Phase 0 — Reconcile Inventory (new)
- Ensure the DB has exactly 1,335 canonical project URLs in the queue + approved/rejected/merged totals.
- If missing, automatically insert the missing placeholders first (so extraction can fill them).

Phase 1 — Pending Queue Full Repair (upgrade)
- Update `batch-extract-pending` to also target:
  - `documents is null` and `images is null` (not only `[]`)
  - Any row that is missing critical extracted fields (developer_name empty/unknown, etc.)
- Add adaptive throttling/backoff:
  - Detect a high rate of “SCRAPE_ALL_ENGINES_FAILED / RATE_LIMITED”
  - Reduce concurrency + add delay before continuing
  - Return structured stats: processed/success/errors/blocked + suggested_retry_after_ms
- Upgrade extraction quality:
  - Switch from the “light extraction” to the more comprehensive deterministic extractor where appropriate (the repo already contains `full-project-extract` which extracts USPs, amenities, location details, payment breakdown, floor plan types, FAQs, and docs more robustly).
  - Ensure pending rows are marked INCOMPLETE only when genuinely missing required fields.

Phase 2 — Approved Projects Full Repair (new)
- Add a backend repair function that:
  - Finds approved projects that are missing brochure/docs/USPs/amenities/location/payment breakdown/etc.
  - Uses their matching `pending_project_imports` record by slug (or source_url) to backfill
  - If pending import is also incomplete, run full extraction first, then copy into project tables
  - Repairs BOTH:
    - `projects` metadata fields (usp/location/payment breakdown/floor_plan_types/faqs/etc.)
    - `project_documents` and `project_images` tables
- Then, `repair-project-images` becomes a sub-step, not the only approved-project fix.

UI updates in Listing Admin:
- Show per-phase progress: “Reconcile”, “Pending Repair”, “Approved Repair”
- Show top errors list (first 10) returned by backend so it’s obvious why something did not fix

--------------------------------------------------------------------
4) Why project pages show missing brochures/amenities/USPs/location details (major gap found)
--------------------------------------------------------------------
Even when pending imports contain extracted fields, the approval pipeline currently copies only a subset into `projects`:
- In `approveImportInDb` (ProjectApprovalQueue), it inserts basic fields only (name, slug, developer_id, description, etc.).
- It does NOT map advanced extracted fields like:
  - usp_headline / usp_bullets / usp_image_url
  - location_headline / location_description / location_distances / location_image_url
  - floor_plan_types / faqs / payment_breakdown
  - amenities_list (if you’re using that structure)
This alone explains why the UI “has no extracted sections”.

Fix:
- Update approval mapping to copy all extracted fields from `pending_project_imports` into `projects`.
- Ensure documents extracted in pending get inserted into `project_documents`.
- Ensure images extracted in pending get inserted into `project_images` (already done, but keep consistent).

--------------------------------------------------------------------
5) Documents/brochures policy alignment (ensure projects actually have brochures)
--------------------------------------------------------------------
Currently, pending imports store document URLs, and approval inserts them into `project_documents` with `file_url` referencing external URLs.
Your policy requires copying documents into internal storage.

Fix:
- Add a backend “document import” step that:
  - Downloads the brochure/payment plan/floor plan PDFs from source
  - Uploads them into internal storage
  - Writes the internal storage URL into `project_documents.file_url`
- Integrate this into:
  - Phase 1 (pending repair)
  - Phase 2 (approved repair)
  - Approval flow (on approve / merge)

--------------------------------------------------------------------
6) Mortgage Calculator fixes (UI)
--------------------------------------------------------------------
A) “Request Mortgage Partner Introduction” button
- In `src/components/MortgageCalculator.tsx` it is already `variant="primary"`.
- We’ll audit where it appears “not primary” and remove any custom button styling overrides that conflict with the global primary system.

B) Payment breakdown bar (Principal / Interest) color
- Currently uses `bg-foreground` and `bg-muted-foreground/60` (black/gray).
- Update to use the platform active champagne style:
  - Principal segment: active gradient `[background:var(--jj-gradient-active)]`
  - Interest segment: a locked champagne layer (pearl gradient) to stay premium but still readable
  - Update the legend dots to match the two segment colors.

--------------------------------------------------------------------
7) “My Account” dropdown is not rectangular / not premium enough
--------------------------------------------------------------------
Current state:
- Desktop “Account” uses `MegaMenuAccount`, but it’s a small card-style panel.

Fix:
- Rebuild `MegaMenuAccount` to use the same rectangular “mega menu shell” system as the other menus:
  - Use `MegaMenuShell` (full rectangular panel, inset spacing, safe max-height, internal scroll)
  - Premium layout: large avatar + name/email, grouped links, gold dividers, strong rectangular container feel
  - Ensure:
    - solid background (not transparent)
    - high z-index
    - not cropped on small viewports (maxHeight + overflowY auto)

--------------------------------------------------------------------
8) “Register Your Interest” form improvements (ProjectInquiryForm)
--------------------------------------------------------------------
A) Bedrooms
- Add:
  - “6 Bedrooms”
  - “7+ Bedrooms” (value “7+”)

B) Developer selection (replaces free text input)
- Use the existing developers table via the existing `useDevelopers()` hook.
- Implement a searchable premium combobox:
  - Options:
    - Any developer
    - List of all developers
    - Other…
  - If “Other…” selected: show a text field so the user can type developer name.

C) Location selection
- Add “Select Emirate” first (Dubai, Abu Dhabi, Sharjah, etc.)
- Then show “Location” options filtered by emirate (using communities table if available), plus:
  - Any location
  - Other… (type in)

D) Dropdown quality
- Ensure Select/Popover panels are not transparent and have high z-index (avoids “see-through dropdown” issue).

--------------------------------------------------------------------
9) Contact buttons audit (WhatsApp / Call / Email not opening)
--------------------------------------------------------------------
Problems found:
- There are many patterns across the codebase:
  - Some use `window.open(...)` (can be blocked, especially in iframes/mobile)
  - Some hardcode wrong emails (example: ProjectCard uses `info@jbjglobalrealestate.com`)
  - Some use correct helpers (`getWhatsAppUrl/getCallUrl/getEmailUrl`), others don’t

Fix approach:
- Create a single, consistent “Contact link” helper/component and use it everywhere:
  - WhatsApp: prefer direct navigation (`window.location.href = wa.me...`) to avoid popup blocking
  - Call: `tel:` link
  - Email: `mailto:` link
- Replace all hardcoded emails/phones with the canonical constants.
- Update ProjectCard’s Email CTA to use the official email constants and correct subject line.

Verification:
- After changes, manually test on:
  - Mobile Safari/Chrome (tap behavior)
  - Desktop Chrome (new tab vs same tab behavior)
  - Within the embedded preview (to ensure no blocked popups)

--------------------------------------------------------------------
10) “...more” not visible on listings
--------------------------------------------------------------------
Current state:
- ProjectCard has a “…more” span only if description exists AND is longer than 120 chars.
- Many listings likely have no description due to the extraction/approval mapping gap, so “…more” never appears.

Fix:
- First fix extraction + approval mapping so descriptions exist.
- Then enforce “…more” visibility by:
  - Always showing a “…more” link when a listing renders (even if description is short or missing), linking to the project page.
  - Make it a real link (not just a span) so it’s clickable and obviously visible.

--------------------------------------------------------------------
Delivery order (fastest impact first)
--------------------------------------------------------------------
1) Fix approval mapping (pending -> projects) so extracted fields actually appear on project pages.
2) Upgrade Fix All to repair approved projects metadata + docs (not just images).
3) Fix batch-extract-pending targeting (null vs []) + adaptive backoff.
4) Add Inventory Reconcile to reach 1,335.
5) UI tasks: mortgage breakdown color + account menu rectangular + inquiry form upgrades.
6) Contact audit + replace hardcoded links/emails.
7) Enforce “…more” link display.

--------------------------------------------------------------------
What I will need from you (only if required)
--------------------------------------------------------------------
- If you want the location dropdown to include a specific curated list (beyond what’s in the database), tell me the top locations you want per emirate; otherwise I’ll populate from the existing “communities” data plus an “Other” free-type option.

After you approve, I’ll implement the above changes in code and then we’ll re-test:
- Listing Admin: Fix All should materially reduce “Needs Work” and populate docs/USPs/amenities
- Inventory total: 1,335
- Project cards: “…more” visible and clickable
- Contact CTAs: WhatsApp/Call/Email open immediately
- Mortgage UI: active champagne styling for the breakdown and CTA
- Account dropdown: rectangular, premium, consistent with mega menu system
