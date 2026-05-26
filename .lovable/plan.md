
# List Your Property + Resale Properties Premium Rebuild

## Part 1 — Audit of existing listing pages

Routes today (from `src/routes/PublicRoutes.tsx`):

```text
/list-property          → ListProperty.tsx        (canonical hub – kept)
/listing-portal         → redirect to /list-property?mode=browse
/listing-portal/submit  → redirect to /list-property?mode=ai
/sell                   → redirect to /list-property?purpose=sale&mode=manual
/seller-listing         → redirect to /list-property?mode=manual
/resale-properties      → ResaleProperties.tsx    (restyled, kept)
```

Standalone pages that still exist and overlap:
- `src/pages/SellerListing.tsx` — the manual multi-step seller form (rendered inside `ListProperty.tsx` already, but also reachable on its own through legacy imports)
- `src/pages/SellWithUs.tsx` — marketing intro page for sellers
- `src/pages/ListingPortal.tsx` — older "browse listings" portal
- `src/pages/LandlordListForm.tsx` / `LandlordRentalPortal.tsx` — rental-only flows

Decision:
- **Single user-facing entry point: `/list-property`.**
- `SellWithUs`, `ListingPortal`, `LandlordListForm` routes redirect into `/list-property` with the right `?purpose=` / `?mode=` params; component files stay so deep links and any inline imports keep working but are no longer reachable directly.
- `SellerListing.tsx` and `LandlordListForm.tsx` become **internal step components** mounted by `ListProperty` based on `purpose` (sale/rent). They are not removed (No-Removal policy).

## Part 2 — `/list-property` page rebuild (premium blue accent)

Top-to-bottom restructure:

1. **Hero band** (replaces current dark header)
   - Background: blue fade `linear-gradient(135deg,#0B2E5C 0%,#102540 50%,#1A4A8A 100%)`
   - Eyebrow chip: "JBJ Seller Portal" in champagne `#EFE6D6` on 1px gold hairline
   - H1 "List Your Property" — white
   - Subtitle — gold `#B89555` (replaces every faded white-on-blue text per the contrast rule)
   - Primary CTA: **List Manually** (champagne pill, ink text) · Secondary: **List with AI** (blue outline, white text) · Tertiary link: **View my submissions** → scrolls to the new dashboard section
   - Reduce the giant top padding (current `pt-32` style gap above title) to `pt-12 md:pt-16`

2. **Purpose + Mode selector card** (single card, currently two)
   - One rounded-2xl card on champagne `#FDFBF7` with a 1px gold hairline
   - Row 1: Purpose segmented control — For Sale / For Rent (active = solid `#2563EB` + white text)
   - Row 2: Mode segmented control — Manual / AI-Assisted (same active style)
   - "Browse Listings" becomes a quiet ghost link bottom-right

3. **Active form** (renders below based on Purpose+Mode)
   - Sale + Manual → `<SellerListing />` (existing multi-step form, restyled: blue active step indicators, gold section headings, ink labels, champagne input surfaces)
   - Sale + AI → `<SellerAssistant />` (existing AI assistant, restyled)
   - Rent + Manual → `<LandlordListForm />`
   - Rent + AI → reuse AI assistant with `purpose=rent`
   - Step indicator bar gets blue active dot + gold connector hairline (kills any white-on-light text)

4. **My Submissions section** (NEW, authenticated only)
   - Title "My Listing Submissions" in gold
   - Card list pulled from `seller_listings` table via existing `useSellerListings` hook
   - Each row: thumbnail · title · purpose badge · status badge (Pending / Under Review / Approved / Declined / Live / Changes Requested) · submitted-at · "View details" expander · "Withdraw" / "Edit draft" actions
   - Empty state: gold-bordered card "No submissions yet — start your first listing above"
   - Anonymous users see a single navy CTA "Sign in to track your submissions" instead of the list

5. **Status workflow + emails** (NEW)
   - Statuses on `seller_listings.status`: `draft` · `submitted` · `under_review` · `approved` · `declined` · `changes_requested` · `live` · `withdrawn`
   - DB trigger on status change → enqueues a transactional email per status using existing `send-transactional-email` infra
   - New templates in `supabase/functions/_shared/transactional-email-templates/`:
     - `seller-listing-submitted.tsx` (receipt)
     - `seller-listing-approved.tsx`
     - `seller-listing-declined.tsx` (with admin reason field)
     - `seller-listing-changes-requested.tsx`
     - `seller-listing-live.tsx`
   - All templates branded JBJ champagne+gold, white body background, no unsubscribe link (system appends)
   - Owner/admin already gets notified via existing approval queue — verified, not duplicated

6. **Contrast pass on the whole page**
   - Every `text-white` / `text-[#FFFFFF]` sitting on champagne or light blue is repainted gold `#B89555` or ink `#1A1A1A` per project standard
   - Add `data-marketing-page` on the root so the band system applies
   - All step indicators, "Previous" / "Next Step" buttons → blue active (`#2563EB`) with white text, navy hairline border

## Part 3 — `/resale-properties` premium rebuild

Building on the prior pass:

1. **Hero**
   - Same blue-fade band as `/list-property` for visual continuity
   - H1 white, subtitle gold, eyebrow chip champagne
   - Remove the divider below the hero (already done in previous turn — verify still gone)

2. **Filter bar**
   - Reuse the **same shortcut-bar style** used on `/properties` (project filter): swap the current inline `<Select>` row for `<FilterShortcutBar variant="light" />` driven by URL params
   - Sticky under the hero, champagne background, 1px gold hairline, no border-bottom rule (kills the divider)
   - Sort dropdown via `<SortBySelect />`

3. **Results header**
   - "{n} properties found" in gold `#B89555`
   - Right-aligned: View toggle (Grid / Map) + Sort dropdown

4. **Listing grid**
   - 1/2/3 columns responsive, 6 visible per row group, gold-hairline cards
   - PricePill + DeveloperLink primitives per the price/dev standard
   - Static cover image (no card arrows)
   - "Register Interest" button blue `#2563EB` with white text

5. **Empty state** ("Recently Sold Out") — already restyled with blue wrap last turn; verify padding doesn't crush the inner Stay-in-the-Loop card on small screens, add `px-4 sm:px-8 md:px-12`

6. **List Your Resale CTA band** (NEW)
   - Below the grid: full-bleed champagne band → blue-bordered card "Have a property to sell? List it on JBJ" → button routes to `/list-property?purpose=sale`
   - Keeps both pages clearly linked

## Part 4 — Backend wiring & data model

Schema work (one migration):

```text
ALTER TABLE seller_listings
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS decline_reason text,
  ADD COLUMN IF NOT EXISTS changes_requested_note text,
  ADD COLUMN IF NOT EXISTS reviewed_by uuid,
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz;

-- status transition trigger -> calls pg_notify -> edge fn that invokes
-- send-transactional-email with the right template + idempotency key
```

- RLS: owner of the row (`auth.uid() = user_id`) can SELECT/UPDATE draft; admin/owner role can update status. Public cannot read.
- `useSellerListings` already exists — extend to filter by `user_id = auth.user.id` and expose status.
- Documents in the seller form (passport, title deed, brochure, photos) upload to existing `seller-documents` storage bucket per user folder; verified policies allow user read/write of own folder only.

## Part 5 — Mobile / device compatibility

- All grids: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`
- Hero text: `text-3xl sm:text-4xl md:text-5xl`
- Filter bar collapses into "Filters" button + drawer below `md`
- Step indicator on seller form becomes horizontal scroll on mobile
- Form cards: `p-4 sm:p-6 md:p-8` to avoid edge bleed
- Buttons stack `flex-col sm:flex-row` in CTA rows

## Part 6 — Bugs & wiring sweep (during the rebuild)

While in these files, verify and fix:
- `useSellerListings` actually scopes by `user_id` (current code may return all rows)
- Draft "Save Draft" button persists every step's form state (not just step 1)
- "Reset" clears uploaded file refs in storage, not just local state
- AI seller assistant submit path writes to same `seller_listings` table so submissions appear in My Submissions regardless of mode
- Resale filter URL params survive page refresh (already standard, verify on this page)
- Mobile sticky filter bar doesn't overlap the GlobalHeader (top-[48px] offset)

## Technical notes (for engineer reference)

- Blue accent: `#2563EB` solid, `#102540` for dark backgrounds, `#0B2E5C → #1A4A8A` for hero gradient. Mark all new blue CTAs with `data-allow-dark-cta` + `data-no-contrast-guard` so the global navy-CTA guard doesn't repaint them.
- Gold heading helper: `style={{ color: "#B89555" }} data-no-contrast-guard`
- All new transactional email templates follow the registry pattern (`_shared/transactional-email-templates/registry.ts`) and are deployed via `deploy_edge_functions`.
- No new edge function for sending — all status emails go through existing `send-transactional-email` with template names listed in Part 2.

## Out of scope (explicit)

- Building a brand-new admin approval UI — the existing owner Listings Approval queue is kept; this plan only adds new status values + email triggers wired to it.
- Replacing the AI Seller Assistant logic — only restyle.
- Removing any legacy route — they all redirect into `/list-property` per No-Removal policy.

Reply **approve** to proceed, or tell me which parts to drop / adjust (e.g. skip the email templates, or skip the resale rebuild) and I'll start with the rest.
