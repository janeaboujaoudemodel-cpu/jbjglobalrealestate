## Goal
One unified "List Your Property" page (manual + AI), a clean approval pipeline visible to the user in their dashboard, and cleaned-up Guides/FAQ sections. Remove duplicates, fix routing, fix SEO.

## Current state (audit)

**Sell / List pages — 5 overlapping routes today**
| Route | File | Role |
|---|---|---|
| `/sell` | `SellWithUs.tsx` | Marketing: "who we support", "selling process" + quick valuation + quick lead form |
| `/listing-portal` | `ListingPortal.tsx` | Browse approved listings + picker (Manual vs AI) → forks to one of the two below |
| `/seller-listing` | `SellerListing.tsx` | Manual 7-step wizard |
| `/listing-portal/submit` | `ListingPortalSubmit.tsx` | AI upload + extract + edit + submit |
| `/listing-portal/my-listings` | `ListingPortalMyListings.tsx` | User's submitted listings + approval status |
| `/property-management/list` | `LandlordListForm.tsx` | Yet another landlord-only list form |
| `/list-property` | (linked from `PropertiesVerticalNav` but no route exists — dead link) |

**Tools that wrongly live in sell area** (should already be in the vertical tools sidebar):
`/property-evaluator`, `/rental-index`, `/property-valuation` (via `/sell/valuation`), `/property-measurement`.

**Guides duplication**
- `Seller's Guide` AND `Seller Listing Guide` — second is a misclassified form.
- `Landlord Guide` AND `Landlord Portal` — portal duplicates the dashboard for owners.

**FAQ duplication**
Today: FAQ Hub + Investor FAQ + Buyer FAQ + Seller FAQ + Landlord FAQ + Tenant FAQ + Broker FAQ — all 7 listed individually in nav and footer.

## Target structure

### 1. Single listing page — `/list-property` (canonical)
Merges SellWithUs + ListingPortal + SellerListing + ListingPortalSubmit + LandlordListForm into ONE page with three tabs:

```text
┌──────────────────────────────────────────────────────────────┐
│  List Your Property                                           │
│  One line of trust: "Priority listing with JBJ — 0 fees,      │
│  premium reach, AI assistance."                               │
├──────────────────────────────────────────────────────────────┤
│  Purpose toggle:   [ For Sale ]  [ For Rent ]                 │
├──────────────────────────────────────────────────────────────┤
│  Tabs:  ① List Manually   ② List with AI   ③ Browse Listings  │
├──────────────────────────────────────────────────────────────┤
│  Tab content (renders the existing wizard / AI flow / grid)   │
└──────────────────────────────────────────────────────────────┘
```

- Tab 1 ("List Manually") embeds the `SellerListing` 7-step wizard as a component.
- Tab 2 ("List with AI") embeds the `ListingPortalSubmit` AI extract flow as a component.
- Tab 3 ("Browse Listings") embeds the existing approved-listings grid from `ListingPortal`.
- `purpose=sale|rent` is held in URL params (`?purpose=sale&mode=manual|ai|browse`) so existing deep links keep working.
- The "Who we support / Selling process built for clarity" sections from `SellWithUs` are removed (single trust line instead, as requested).

### 2. Upgrade the seller workflow (manual + AI)
Add the fields/steps the workflow currently lacks so a property is genuinely submittable end-to-end:

- **Seller details:** full name, phone, email, role (owner / broker / investor / POA), preferred contact, Emirates ID number (optional, for owner verification), POA upload if representative.
- **Property core:** type, purpose, community/building, unit number, bedrooms, bathrooms, BUA + plot size, view, floor, parking, age, furnishing, availability date, status (vacant/tenanted), current rent if tenanted.
- **Pricing:** asking price, minimum acceptable price (private), purchase price (private), service charge, mortgaged flag + bank, urgency.
- **Documents:** title deed (required), passport copy, Emirates ID, mortgage NOC if applicable, floor plan, brochure, OQOOD/Oqood for off-plan.
- **Media:** drag-and-drop gallery (min 6 photos validated), cover photo selector, optional video / 360 link.
- **Marketing:** description, key features, amenities checklist, listing fee mode (commission-only vs direct contact AED 199).
- **Compliance:** RERA permit number (optional), DLD form-A consent checkbox, T&C consent.
- **AI mode:** upload PDFs/links/screenshots → extract → user reviews/edits the same fields above → submits.

Approval pipeline (already partly in DB via `portal_listings.approval_status`): explicit states `draft → submitted → in_review → needs_info → approved → published → rejected` with admin notes surfaced to the user.

### 3. My Listings → user dashboard (not in main nav)
- Move `/listing-portal/my-listings` into the user dashboard as a section: `/dashboard/my-listings` (and keep the old route as a 301 redirect).
- Card per listing showing: thumbnail, title, current `approval_status` chip, last update, admin notes, `Edit / Withdraw / View public` actions.
- Visible status timeline: Submitted → In Review → Approved → Published, plus messages from admin.
- Remove "My Listings" from `GlobalVerticalNav` (it does NOT belong in global nav).
- Remove "Landlord Portal" route — landlord features available inside the same dashboard for any user who has a rental listing.

### 4. Tools — move into the tools vertical sidebar only
Remove from sell area; keep only inside `AI Tools` / toolkit vertical sidebar:
- Property Evaluator
- Rental Index
- Property Valuation (currently `/sell/valuation` → keep route but link only from tools)
- Property Measurement

### 5. Guides — dedupe
- Remove "Seller Listing Guide" (it was a form, not a guide — redirect `/seller-listing` to `/list-property?mode=manual`).
- Remove "Landlord Portal" link from Guides nav.
- Keep: Buyer's Guide, Seller's Guide, Tenant's Guide, Landlord Guide, Rental Guide, Golden Visa Guide.

### 6. FAQs — collapse to a single hub entry
- Nav (both global + footer) shows ONLY: **FAQ Hub** (`/faq`).
- `/faq` hub page lists categories: Buyer FAQ, Seller FAQ, Landlord FAQ, Tenant FAQ, Broker FAQ (kept). Clicking each opens its existing page.
- **Remove Investor FAQ entirely** (delete route + page + nav/footer links).
- Update `Footer.tsx` and `GlobalVerticalNav.tsx` accordingly.

### 7. Routing + redirects + SEO
Old → New 301 redirects (so existing inbound links + search index don't break):

| Old | New |
|---|---|
| `/sell` | `/list-property?purpose=sale` |
| `/listing-portal` | `/list-property?mode=browse` |
| `/listing-portal/submit` | `/list-property?mode=ai` |
| `/listing-portal/my-listings` | `/dashboard/my-listings` |
| `/seller-listing` | `/list-property?mode=manual` |
| `/property-management/list` | `/list-property?purpose=rent&mode=manual` |
| `/landlord-portal` | `/dashboard/my-listings` |
| `/investor-faq` | `/faq` |

SEO:
- Single canonical for `/list-property` with proper `<title>`, `<meta description>`, OG tags, and `RealEstateAgent` + `WebPage` JSON-LD.
- Update `public/sitemap.xml` and `scripts/generate-sitemap.ts` to add `/list-property`, remove the merged duplicates.
- Rescan via SEO tool after merge.

### 8. Nav cleanup (`GlobalVerticalNav.tsx`, `PropertiesVerticalNav.tsx`, `Footer.tsx`)
- Replace every link to `/sell`, `/listing-portal`, `/listing-portal/submit`, `/seller-listing`, `/property-management/list`, `/landlord-portal`, `/list-property` (dead) with single canonical `/list-property`.
- Drop "Submit Listing" + "My Listings" + "Sell With Us" + "Property Valuation/Selling Advisory" from generic nav (advisory keeps a `/services/selling-advisory` link only inside Services).
- Replace 7 FAQ links with 1 "FAQ Hub" link.

## Files to add / change

**Add**
- `src/pages/ListProperty.tsx` — new unified page (purpose + mode tabs).
- `src/components/list-property/ManualWizard.tsx` — `SellerListing` content extracted as embeddable component, with the new/enhanced fields.
- `src/components/list-property/AIWizard.tsx` — `ListingPortalSubmit` content as embeddable component, same expanded field set.
- `src/components/list-property/BrowseListings.tsx` — `ListingPortal` grid as embeddable component.
- `src/components/dashboard/MyListingsPanel.tsx` — dashboard widget with status timeline.

**Edit**
- `src/routes/PublicRoutes.tsx` — add `/list-property`, add all 301 `<Navigate>` redirects, remove `LandlordRentalPortal`, `InvestorFAQ` routes.
- `src/components/navigation/GlobalVerticalNav.tsx` — collapse sell/list/FAQ items.
- `src/components/navigation/PropertiesVerticalNav.tsx` — same.
- `src/components/Footer.tsx` — same.
- `src/pages/Dashboard.tsx` (or `MyDashboard.tsx`) — mount `MyListingsPanel`.
- `public/sitemap.xml` + `scripts/generate-sitemap.ts`.

**Schema (one small migration)**
Add the few missing columns to `portal_listings` that the upgraded form captures but the table lacks: `unit_number text`, `plot_size_sqft numeric`, `view text`, `floor text`, `parking integer`, `property_age integer`, `availability_date date`, `current_rent numeric`, `min_acceptable_price numeric`, `purchase_price numeric`, `service_charge numeric`, `is_mortgaged boolean`, `mortgage_bank text`, `rera_permit text`, `cover_image_url text`, `video_url text`, `tour_url text`, `dld_consent_at timestamptz`, `tnc_consent_at timestamptz`. (RLS already in place — no policy changes needed.)

**Delete / deprecate** (kept on disk as thin redirects only)
- Logic-wise: `SellWithUs.tsx`, `ListingPortal.tsx`, `ListingPortalSubmit.tsx`, `SellerListing.tsx`, `LandlordListForm.tsx`, `LandlordRentalPortal.tsx`, `InvestorFAQ.tsx` no longer reachable from nav. We keep the underlying wizard/AI logic by extracting into the new components above; the page files themselves can be deleted in a follow-up after we confirm nothing else imports them.

## Acceptance checklist
- One canonical `/list-property` page with purpose toggle + 3 tabs that work.
- Manual + AI flows submit into `portal_listings` with all upgraded fields.
- A submitted listing immediately shows in the user's dashboard with live status (Submitted → Review → Approved → Published).
- Admin approval page (`/admin/listings-approval`) sees the new fields and approves to publish.
- All redirects in section 7 land on the right place.
- Nav (global + properties + footer) has no duplicates; FAQ collapsed to single hub link.
- Investor FAQ + Landlord Portal removed everywhere.
- Sitemap + SEO scan clean.