
# Master Blueprint Implementation Plan

## Executive Summary
This plan provides a comprehensive gap analysis between the provided Master Blueprint specification and the current JBJ Global Real Estate website, followed by a detailed implementation roadmap. The current site is substantially built but requires targeted alignment to match the blueprint's exact specifications.

---

## A) ASSUMPTIONS (Declared Per Blueprint Rules)

1. **Market**: Dubai, UAE (English-first; Arabic optional later) ✅ Already implemented
2. **Business**: Real estate broker/agent (small brokerage) focused on residential sales + rentals + property management ✅ Already implemented
3. **Inventory**: Listings imported from CRM/property feed ✅ Already implemented via Supabase
4. **Primary Conversion**: WhatsApp, phone, inquiry forms ✅ Partially implemented
5. **Target Segments**: Buyers, sellers, renters, landlords, investors ✅ Already implemented

---

## B) SITEMAP GAP ANALYSIS

### Currently Exists (Aligned)
```text
✅ / (Home)
✅ /properties (Buy/Rent Listings)
✅ /project/:slug (Listing Detail)
✅ /areas (Area Index)
✅ /area/:slug (Area Detail)
✅ /buyer-guide
✅ /seller-guide
✅ /tenant-guide
✅ /landlord-guide
✅ /services/property-management
✅ /developers (New Developments Index)
✅ /developer/:slug (Development Detail)
✅ /investor-education
✅ /about
✅ /team (Our Team)
✅ /contact
✅ /news (Blog/Insights equivalent)
✅ /privacy, /cookies, /terms
✅ 404 Page
```

### Missing or Requires Reconfiguration
```text
❌ /buy (dedicated Buy search - currently merged with /properties)
❌ /rent (dedicated Rent search - currently merged with /properties)
❌ /sell (Sell With Us landing page - redirect needed)
❌ /sell/valuation (Dedicated valuation form page)
❌ /property-management (root route - exists at /services/property-management)
❌ /property-management/list (Landlord lead form page)
❌ /guides/buying (blueprint route vs current /buyer-guide)
❌ /guides/renting (blueprint route vs current /rent-guide)
❌ /guides/selling (blueprint route vs current /seller-guide)
❌ /guides/landlords (blueprint route vs current /landlord-guide)
❌ /investors (Investor Services page)
❌ /investors/join (Join Investor List form)
❌ /reviews (Reviews & Case Studies page)
❌ /blog (Blueprint calls for /blog, current uses /news)
❌ /blog/:slug (Individual blog post)
❌ /disclaimers (Licensing & Disclaimers page)
❌ /thank-you (Generic confirmation page with query params)
```



Do NOT create any new pages or new blueprint routes unless I explicitly ask. Most of what you listed is NOT “missing” — it’s a routing / alias / redirect decision.

✅ RULES (NON-NEGOTIABLE)
	1.	No UI changes. No styling changes. No component changes.
	2.	No new pages unless required. Prefer route aliases + redirects to existing pages.
	3.	Keep our current structure and fix “missing” routes by:
	•	301 redirects (or internal routing redirects)
	•	route aliases (multiple slugs pointing to the same page)
	4.	Do NOT rename existing working pages.
	5.	When you finish, send me:
	•	A list of the routes fixed
	•	Screenshots showing each “missing” route now loads correctly

⸻

✅ DECISIONS: HOW TO HANDLE EACH ITEM YOU LISTED

1) /buy and /rent

❌ Do NOT create new pages.
✅ Implement route aliases:
	•	/buy → load the existing /properties page with filter preset = BUY
	•	/rent → load the existing /properties page with filter preset = RENT

Implementation requirement:
	•	Filters must work, not just visual selection.
	•	URL can keep query params like ?mode=buy or ?mode=rent.

⸻

2) /sell

✅ Make /sell a redirect to the existing “List Your Property” flow (or the existing Sell advisory if that’s what we already have).
Do NOT build a new landing page unless I ask.

If we currently have:
	•	“List Your Property” = /properties/list-your-property (or similar)
Then: /sell → redirect there.

⸻

3) /sell/valuation

✅ Create this ONLY if we don’t already have a valuation form inside List Your Property.
Preferred solution (no new page):
	•	/sell/valuation → scroll/jump to “Instant Valuation” section on the existing sell/list page.

If there is no valuation module at all:
	•	then create a simple valuation section inside the existing page (content only), NOT a new page.

⸻

4) /property-management and /property-management/list

✅ Route alias:
	•	/property-management → /services/property-management

For /property-management/list:
✅ Do NOT build a new page if the property management page already has a landlord lead form.
	•	/property-management/list → open the lead form section (anchor) on /services/property-management

Only if no form exists:
	•	Add the form section to /services/property-management (do not create a separate page).

⸻

5) Guides blueprint routes vs current routes

We already use:
	•	/buyer-guide
	•	/rent-guide
	•	/seller-guide
	•	/landlord-guide

✅ Do NOT change or recreate guides pages.
✅ Add route aliases:
	•	/guides/buying → /buyer-guide
	•	/guides/renting → /rent-guide
	•	/guides/selling → /seller-guide
	•	/guides/landlords → /landlord-guide

⸻

6) /investors and /investors/join

✅ Do NOT create new pages unless Investor Hub pages are empty.
Preferred routing:
	•	/investors → redirect to the existing Investor Hub landing (Investor Dashboard or Investor Tools, whichever is the entry)
	•	/investors/join → redirect to an existing “Join Investor List” form (inside Investor Hub or Contact page)

If the form does not exist anywhere:
	•	Add a “Join Investor List” form section to the Investor Hub landing page (content only).

⸻

7) /reviews

✅ We already have “Testimonials” (or should have it).
So:
	•	/reviews → redirect/alias to /services/testimonials (or the existing testimonials page)

Do NOT create a new Reviews page.

⸻

8) /blog and /blog/:slug

We use /news now.

✅ Route alias:
	•	/blog → /news
	•	/blog/:slug → /news/:slug (or whatever the current post route is)

If individual posts are not implemented yet:
	•	Then implement /news/:slug using the SAME existing blog post component logic (no UI redesign).

⸻

9) /disclaimers

✅ Do NOT create a separate disclaimers page.
We already have Terms + Privacy + Trust/Audit/Methodology components.

So:
	•	/disclaimers → redirect to /terms OR /trust-audit-center (choose the best existing legal hub page).

Preferred:
	•	If /trust-audit-center exists: route /disclaimers → /trust-audit-center
	•	Else: /disclaimers → /terms

⸻

10) /thank-you

✅ Create one generic confirmation page ONLY if we don’t already have a success state component.
It must support query params like:
	•	/thank-you?source=contact
	•	/thank-you?source=list-property
	•	/thank-you?source=investor

This page must be minimal, premium, and reuse existing UI components.

⸻

✅ DELIVERY REQUIREMENTS

After you implement all the above:
	1.	Confirm all “missing routes” now resolve correctly (no 404).
	2.	Provide screenshots showing each route loads:
/buy, /rent, /sell, /sell/valuation, /property-management, /property-management/list, /guides/buying, /guides/renting, /guides/selling, /guides/landlords, /investors, /investors/join, /reviews, /blog, /blog/:slug (sample), /disclaimers, /thank-you
	3.	Confirm: No UI changes were made. Only routing/redirect fixes.


---

## C) GLOBAL DESIGN SYSTEM - CURRENT STATE

### Already Implemented ✅
- 12-column grid desktop, responsive mobile
- Spacing scale (4-64px)
- Typography hierarchy (H1/H2/H3)
- Button variants (Primary/Secondary/Tertiary)
- Single-column forms on mobile
- Header with mega menu
- Footer with legal links
- Sticky CTA bar (mobile WhatsApp/Call)
- Breadcrumbs
- Listing cards
- Trust bar (TrustBar.tsx)
- Testimonial sections
- FAQ accordion
- Agent cards
- Map modules (Leaflet)

### Requires Addition/Updates
- Search bar component standardization across pages
- Lead form module standardization per blueprint
- Blog card component
- Thank You page variants

---

## D) DATA MODEL - CURRENT STATE

### ✅ Listing Schema
Already defined in `src/types/blueprint.ts` - matches blueprint exactly

### ✅ Area Schema  
Already defined in `src/types/blueprint.ts` - matches blueprint exactly

### ✅ Lead Schema
Already defined in `src/types/blueprint.ts` - matches blueprint with all required fields:
- formType, consents, source (UTM tracking)

---

## E) USER JOURNEYS - IMPLEMENTATION STATUS

### E1) Buyer Lead Flow ✅ Mostly Complete
- Listings page with filters
- Listing detail with WhatsApp/Call CTAs
- Contact forms exist
- **Gap**: Thank You page routing, CRM integration confirmation

### E2) Seller Valuation Flow ⚠️ Partial
- **Exists**: Seller Guide page
- **Missing**: Dedicated `/sell` landing page and `/sell/valuation` form page
- **Requires**: Route creation + form page

### E3) Landlord Onboarding Flow ⚠️ Partial
- **Exists**: Property Management service page, Landlord Guide
- **Missing**: `/property-management/list` dedicated form page
- **Requires**: Route creation + form page

### E4) Investor List Flow ⚠️ Partial
- **Exists**: Investor Education page
- **Missing**: Dedicated `/investors` services page and `/investors/join` form
- **Requires**: Route creation + pages

---


FIX: USER JOURNEYS – IMPLEMENTATION PLAN (NO UI CHANGES, ROUTING + FORMS ONLY)

Global rules
	1.	Do NOT change layout/components/colors.
	2.	Prefer route aliases + filter presets + anchors.
	3.	Create a new page only if there is no existing equivalent form section.
	4.	Every form submission must route to /thank-you?source=... and log to CRM.

⸻

E1) Buyer Lead Flow ✅ Mostly Complete → CLOSE THE GAPS

Required fixes

1) Thank You routing
	•	Create/ensure a single /thank-you page exists.
	•	Support query param source (examples):
	•	/thank-you?source=buyer-inquiry
	•	/thank-you?source=property-viewing
	•	/thank-you?source=general-contact
	•	All buyer forms must redirect to it on success.

2) CRM integration confirmation
	•	On every buyer form submit:
	•	Save lead to CRM (existing lead store).
	•	Show success state AND redirect to thank-you.
	•	Add internal log field: lead_source, page_path, listing_id (if applicable), timestamp.

Deliverable proof
	•	Screenshot: submission → redirect → thank-you.
	•	Confirm CRM record created (show DB row screenshot or admin UI record).

⸻

E2) Seller Valuation Flow ⚠️ Partial → DO NOT BUILD NEW LANDING IF WE CAN ALIAS

Route logic (preferred)

1) /sell
	•	Implement as alias/redirect to existing “List Your Property” page (the sell pathway).
	•	/sell must open the sell context (no new landing page).

2) /sell/valuation
	•	Preferred: route to the same existing page using an anchor:
	•	/sell/valuation → existing list-property page + auto-scroll to #valuation-form
	•	If the valuation form section does not exist yet:
	•	Add a valuation form section inside the existing list-property/sell page (content only).
	•	Do NOT create a separate new valuation page unless anchor routing is impossible.

Valuation form requirements (inside existing page or dedicated ONLY if forced)

Fields:
	•	Name, phone (WhatsApp), email (optional), property type, community/building, bedrooms, size, expected rent/sale, ownership status (title deed / SPA), timeline (urgent/1–3 months/3–6 months), notes, upload (optional: title deed / SPA).
Rules:
	•	Consent checkbox (Terms/Privacy link).
	•	Submission → /thank-you?source=sell-valuation.
	•	CRM record tag: lead_type = valuation.

Deliverable proof
	•	/sell resolves correctly
	•	/sell/valuation resolves correctly (scrolls to the form)
	•	Form works + CRM entry created

⸻

E3) Landlord Onboarding Flow ⚠️ Partial → NO NEW PAGE IF FORM EXISTS

Route logic

1) /property-management
	•	Already exists at /services/property-management
	•	Add route alias: /property-management → /services/property-management

2) /property-management/list
	•	Preferred: alias to same page + scroll to landlord lead form:
	•	/property-management/list → /services/property-management#landlord-form
	•	If landlord lead form section does not exist:
	•	Add the landlord lead form section to /services/property-management (content only).
	•	Do NOT create a new separate page unless anchor routing is impossible.

Landlord form requirements

Fields:
	•	Name, phone (WhatsApp), email, property address/community, unit type, bedrooms, furnished Y/N, availability date, asking rent (optional), current tenant status, preferred cheques, notes, upload (optional: title deed).
Rules:
	•	Submission → /thank-you?source=landlord-onboarding
	•	CRM tag: lead_type = landlord

Deliverable proof
	•	/property-management/list works and lands on form section
	•	Form works + CRM entry created

⸻

E4) Investor List Flow ⚠️ Partial → USE EXISTING INVESTOR HUB, DON’T DUPLICATE

Route logic

1) /investors
	•	Do NOT create a new services page if Investor Hub already exists.
	•	Set /investors as alias to the existing Investor entry page (Investor Dashboard or Investor Tools).
	•	It should present Investor actions clearly (join list / request report / consultation).

2) /investors/join
	•	Preferred: route to an existing “Join Investor List” form section via anchor:
	•	/investors/join → /investors#join-investor-form
	•	If no join form exists anywhere:
	•	Add “Join Investor List” form section to the Investor entry page (content only).
	•	Do NOT create a new standalone page unless anchor routing is impossible.

Investor join form requirements

Fields:
	•	Name, phone (WhatsApp), email, residency status (resident/non-resident), investor goal (end-use / rental / flip / land), budget range, timeline, preferred areas, property type, notes.
Rules:
	•	Submission → /thank-you?source=investor-join
	•	CRM tag: lead_type = investor

Deliverable proof
	•	/investors resolves correctly
	•	/investors/join resolves correctly to join form
	•	Form works + CRM entry created

⸻

FINAL DELIVERY CHECKLIST (MUST SEND BACK)
	1.	List of implemented route aliases/redirects:
	•	/sell, /sell/valuation, /property-management, /property-management/list, /investors, /investors/join
	2.	Screenshot proof for each route
	3.	Confirmation: No UI changes
	4.	Confirmation: Every form routes to /thank-you and saves to CRM

⸻





## F) PAGE-BY-PAGE IMPLEMENTATION

### Phase 1: Route Aliases & Redirects (Quick Wins)

| Blueprint Route | Current Route | Action |
|-----------------|---------------|--------|
| `/buy` | `/properties?transactionType=buy` | Add redirect |
| `/rent` | `/properties?transactionType=rent` | Add redirect |
| `/sell` | New page needed | Create page |
| `/property-management` | `/services/property-management` | Add redirect |
| `/blog` | `/news` | Add redirect |
| `/guides/buying` | `/buyer-guide` | Add redirect |
| `/guides/renting` | `/rent-guide` | Add redirect |
| `/guides/selling` | `/seller-guide` | Add redirect |
| `/guides/landlords` | `/landlord-guide` | Add redirect |

### Phase 2: New Pages Required

#### 2.1 Sell With Us Page (`/sell`)
```text
Route: /sell
Purpose: Convert sellers
Primary CTA: Request valuation
Blocks:
  1. Hero with "Request a Valuation" CTA
  2. Proof bar (recent sales, testimonials)
  3. How we sell (5 steps)
  4. Marketing package bullets
  5. Case studies (3 cards)
  6. Seller FAQ (8 items)
  7. CTA band → /sell/valuation
```

#### 2.2 Valuation Form Page (`/sell/valuation`)
```text
Route: /sell/valuation
Purpose: Capture seller lead
Form Fields:
  - Name (required)
  - Phone (required)
  - Email (optional)
  - Property type (required)
  - Area/community (required)
  - Bedrooms, Size, Condition (optional)
  - Timeline (required)
  - Message (optional)
  - Consent checkbox (required)
Success: /thank-you?type=valuation
```

#### 2.3 Landlord List Form Page (`/property-management/list`)
```text
Route: /property-management/list
Purpose: Capture landlord lead
Form Fields:
  - Name (required)
  - Phone (required)
  - Email (optional)
  - Property type (required)
  - Area (required)
  - Bedrooms, Desired rent, Availability (optional)
  - Services needed (checkboxes)
  - Consent (required)
Success: /thank-you?type=landlord
```

#### 2.4 Investor Services Page (`/investors`)
```text
Route: /investors
Purpose: Attract investors
Blocks:
  1. What we provide (deal flow, ROI focus)
  2. Simple yield explanation
  3. CTA: Join investor list
```

#### 2.5 Join Investor List Page (`/investors/join`)
```text
Route: /investors/join
Form Fields:
  - Name, Phone, Email
  - Preferred areas, Budget range
  - Strategy (checkboxes: flip/yield/off-plan)
  - Consent
Success: /thank-you?type=investor
```

#### 2.6 Reviews & Case Studies Page (`/reviews`)
```text
Route: /reviews
Blocks:
  1. Review summary
  2. Testimonials list
  3. Case studies cards
```

#### 2.7 Thank You Page (`/thank-you`)
```text
Route: /thank-you
Behavior:
  - Reads query param `type` (viewing/valuation/landlord/investor/contact)
  - Shows matching confirmation + next steps + WhatsApp CTA
Events: thank_you_view
```

#### 2.8 Disclaimers Page (`/disclaimers`)
```text
Route: /disclaimers
Content:
  - License disclosure
  - Investment disclaimers
  - Image/availability disclaimers
```

### Phase 3: Existing Page Updates

#### 3.1 Homepage (`/`) - Mostly Complete
**Current State**: TrustBar, ServicesGrid, CTABand, HeroSearchBar exist
**Updates Required**:
- Verify exact copy matches blueprint specification
- Ensure "Areas we cover" shows 12 area links
- Verify testimonials section shows 3 items
- Add tracking events per blueprint

#### 3.2 Properties Page (`/properties`)
**Current State**: Full filter bar, listing cards, pagination
**Updates Required**:
- Add sidebar lead module "Want a curated shortlist?"
- Add FAQ section (5 items)
- Implement blueprint tracking events

#### 3.3 Listing Detail (Project Detail)
**Current State**: Gallery, key facts, agent card, similar properties
**Updates Required**:
- Add "Book viewing" form modal
- Verify WhatsApp deep link includes listing title + ref code
- Add FAQ section (context-aware)

#### 3.4 Areas Index (`/areas`)
**Current State**: Area cards grid
**Updates Required**:
- Add search field "Search areas"
- Add CTA "Tell us what you want"

#### 3.5 Area Detail (`/area/:slug`)
**Current State**: Summary, map, listings modules
**Updates Required**:
- Verify "For Sale in {Area}" and "For Rent in {Area}" modules
- Add price snapshot (avg buy/rent)
- Add FAQ accordion
- Add "Get a shortlist in {Area}" form

#### 3.6 Contact Page (`/contact`)
**Current State**: Contact form, WhatsApp/Phone/Email
**Updates Required**:
- Add reason dropdown (buy/rent/sell/management)
- Add office details placeholder
- Add map embed

### Phase 4: Navigation Updates

#### Header Mega Menu
- Ensure Buy/Rent includes Areas link
- Verify all navigation items match blueprint

#### Footer Updates
- Verify 3 columns + legal row structure
- Include: Areas, Buyer Guide, Seller Guide, Landlord Guide, Privacy, Terms, Disclaimers, Contact, Social

---

## G) TRACKING EVENTS

All events are already defined in `src/types/blueprint.ts`:
```typescript
// 32+ standardized events including:
home_search_submit, home_whatsapp_click, home_call_click
buy_filter_apply, listing_card_whatsapp_click, buy_shortlist_submit
listing_whatsapp_click, listing_call_click, viewing_form_submit
// ... etc
```

**Action Required**: Implement event firing at each interaction point

---

## H) COMPLIANCE & TRUST CHECKLIST

| Requirement | Status | Action |
|-------------|--------|--------|
| Display brokerage license in footer | ⚠️ Placeholder | Add actual license number |
| Display license in About page | ⚠️ Placeholder | Add actual license details |
| No "guaranteed returns" claims | ✅ | Verified clean |
| Disclaimer: availability subject to change | ⚠️ | Add to listing pages |
| Disclaimer: prices are indicative | ⚠️ | Add to listing pages |
| Privacy consent checkbox on forms | ✅ | Already implemented |
| Cookie consent banner | ✅ | Already implemented |
| Honeypot anti-spam | ⚠️ | Add to forms |
| Rate limiting | ⚠️ | Add to edge functions |

---

## I) LAUNCH CHECKLIST

| Item | Status |
|------|--------|
| A) Brand basics | ✅ Logo, colors, typography, favicon |
| B) Domain + SSL | ⏳ Deployment stage |
| C) Analytics (GA4) | ⚠️ Needs event implementation |
| D) Search Console | ⏳ Post-deployment |
| E) CRM integration | ✅ Supabase crm_leads table |
| F) Listings feed | ✅ Import system exists |
| G) SEO (titles/meta/schema) | ✅ SEOHead + GlobalSEO |
| H) Performance | ✅ WebP, lazy load, minify |
| I) Accessibility | ⚠️ Verify contrast, alt text |
| J) Legal pages | ✅ Privacy/Terms/Cookies exist |
| K) Contact links tested | ✅ WhatsApp/Call/Email work |
| L) QA | ⏳ Manual testing needed |
| M) Security | ⚠️ Add rate limiting |
| N) Backup | ✅ Supabase handles |
| O) Launch | ⏳ |

---

## Technical Implementation Summary

### Files to Create
1. `src/pages/SellWithUs.tsx`
2. `src/pages/RequestValuation.tsx`
3. `src/pages/ListYourProperty.tsx`
4. `src/pages/InvestorServices.tsx`
5. `src/pages/JoinInvestorList.tsx`
6. `src/pages/Reviews.tsx`
7. `src/pages/ThankYou.tsx`
8. `src/pages/Disclaimers.tsx`


1) src/pages/SellWithUs.tsx ✅ Create (but keep it “routing-first”)

Purpose: A clean Seller landing that explains the sell journey + CTA buttons.
Must include:
	•	Hero: “Sell with JBJ Global Real Estate”
	•	3 CTAs:
	•	Request Valuation → /sell/valuation
	•	List Your Property → /list-your-property?mode=sale
	•	Talk to Advisor → Contact/WhatsApp
	•	Brief seller flow section (steps)
	•	Testimonials preview block (link to /reviews)
	•	Compliance disclaimer block (reuse existing component)

Important: This page is not the valuation form. It routes to it.

⸻

2) src/pages/RequestValuation.tsx ✅ Create (dedicated form page)

Route: /sell/valuation
Purpose: A focused valuation form (conversion page).
Must include:
	•	Hero + short trust copy
	•	Valuation form (seller)
	•	Upload optional: Title Deed / SPA
	•	Submit → /thank-you?source=sell-valuation
	•	Save to CRM with:
	•	lead_type=valuation
	•	lead_source=sell-valuation
	•	page_path=/sell/valuation

⸻

3) src/pages/ListYourProperty.tsx ⚠️ Create ONLY if it doesn’t already exist

This is the biggest risk of duplication.

If you already have a “List Your Property” page:

✅ Do NOT create a new one.
Just ensure the existing page supports:
	•	?mode=sale and ?mode=rent
	•	Submit → routed to the correct admin approval pipeline
	•	Submit → /thank-you?source=list-property-sale or /thank-you?source=list-property-rent

If it does NOT exist:

✅ Then create it.

Must include:
	•	Two tabs: Sell / Rent
	•	Smart assistant panel (your “JBJ Seller Assistant” / “JBJ Landlord Assistant”)
	•	Listing form + file uploads
	•	Approval timeline UI (Emily → David → Amanda → You) (status only; no promises)
	•	After approval: listing goes live in the correct portal automatically

⸻

4) src/pages/InvestorServices.tsx ✅ Create

Route: /investors
Purpose: This is NOT Investor Education (guide). This is “how we support investors” + CTA.

Must include:
	•	Hero: “Investor Services”
	•	Services cards:
	•	Portfolio Strategy
	•	Deal Screening
	•	Shortlisting & Comparisons
	•	Market Intelligence Reports
	•	Golden Visa support via licensed partners (only if already on site)
	•	CTA buttons:
	•	Join Investor List → /investors/join
	•	Access Reports → existing Investor Hub report access (do not duplicate reports page)
	•	Disclaimer: no guaranteed returns + data sources

⸻

5) src/pages/JoinInvestorList.tsx ✅ Create (form page)

Route: /investors/join
Must include:
	•	Investor onboarding form
	•	Tags in CRM:
	•	lead_type=investor
	•	lead_source=investors-join
	•	Submit → /thank-you?source=investor-join

⸻

6) src/pages/Reviews.tsx ✅ Create

Route: /reviews
Purpose: testimonials + case studies + trust proof.
Must include:
	•	Reviews/testimonials grid
	•	Optional: video testimonials section
	•	“How we work” trust section
	•	CTA: book consultation / WhatsApp

⸻

7) src/pages/ThankYou.tsx ✅ Create (mandatory)

Route: /thank-you
Must include:
	•	Read query param source
	•	Show dynamic confirmation message by source:
	•	buyer inquiry / valuation / landlord listing / investor join / contact etc.
	•	Next steps:
	•	buttons back to relevant hub
	•	No UI redesign (reuse existing section components)

⸻

8) src/pages/Disclaimers.tsx ✅ Create ONLY if you truly want a dedicated “Disclaimers” page

Route: /disclaimers
Purpose: a public consolidated page listing:
	•	Brokerage scope (licensed Buy/Sell/Rent)
	•	Partner introductions scope
	•	AI tools informational disclaimer
	•	Data sources / not endorsed by government disclaimer
	•	IP notice

Create pages 1,2,4,5,6,7 immediately. Page 3 only if missing. Page 8 only if required by routing blueprint. No UI changes—reuse existing components and styling.



### Files to Update
1. `src/App.tsx` - Add new routes and redirects
2. `src/pages/Properties.tsx` - Add sidebar lead module, FAQ
3. `src/pages/ProjectDetail.tsx` - Add viewing form, FAQ
4. `src/pages/AreaGuides.tsx` - Add search field
5. `src/pages/AreaDetail.tsx` - Add shortlist form, FAQ
6. `src/pages/Contact.tsx` - Add reason dropdown, map
7. `src/components/Footer.tsx` - Verify structure, add disclaimers link

### Estimated Effort
- **Phase 1 (Redirects)**: 1 hour
- **Phase 2 (New Pages)**: 8-12 hours
- **Phase 3 (Page Updates)**: 4-6 hours
- **Phase 4 (Navigation)**: 2 hours
- **Tracking Implementation**: 3-4 hours
- **Compliance Items**: 2 hours
- **Testing**: 4 hours

**Total Estimated**: 24-31 hours of development

---

## Recommendation

Proceed in priority order:
1. **Immediate**: Create `/thank-you` page (all forms depend on it)
2. **High Priority**: Create seller flow (`/sell`, `/sell/valuation`)
3. **High Priority**: Create landlord flow (`/property-management/list`)
4. **Medium Priority**: Create investor flow (`/investors`, `/investors/join`)
5. **Medium Priority**: Add redirects for blueprint routes
6. **Lower Priority**: Reviews page, tracking events, compliance polish
1) Immediate: /thank-you ✅

Why: every lead form should end somewhere consistent, trackable, and branded.

Must do:
	•	Create /thank-you
	•	Accept ?source= query param (ex: sell-valuation, list-sale, list-rent, investor-join, contact, buyer-inquiry)
	•	Show different confirmation copy + next steps buttons based on source
	•	Keep same UI components (no redesign)

Form rules:
	•	Every form must redirect to /thank-you?source=<X>
	•	Also log source into your CRM payload

⸻

2) High priority: Seller flow /sell + /sell/valuation ✅

/sell (Sell With Us landing)
	•	Explains the seller journey
	•	CTA buttons:
	•	Request Valuation → /sell/valuation
	•	List Property for Sale → /list-your-property?mode=sale
	•	Speak to Advisor → WhatsApp/Contact

/sell/valuation (Dedicated valuation form)
	•	Short, focused form
	•	Optional file upload
	•	Submit → /thank-you?source=sell-valuation

Important: This avoids mixing “Seller Guide” with “Seller Services.”
Seller Guide = education. /sell = conversion.

⸻

3) High priority: Landlord flow /property-management/list ✅

This should exist even if you already have “List Your Property,” because the landlord path is different:

/property-management/list (Landlord listing lead form)
	•	Pre-filled intent = rent
	•	Form for landlord rental listing
	•	Submit → /thank-you?source=landlord-list

Links:
	•	From Property Management service page → CTA to /property-management/list
	•	From Landlord Guide → CTA to /property-management/list

⸻

4) Medium priority: Investor flow /investors + /investors/join ✅

/investors (Investor Services landing)
	•	Explains investor support + market intelligence access
	•	CTA:
	•	Join list → /investors/join
	•	Reports access → link to your existing Investor Hub reports page (don’t duplicate)

/investors/join (Form page)
	•	Investor intake form
	•	Submit → /thank-you?source=investor-join

⸻

5) Medium priority: Redirects for blueprint routes ✅ (no duplicate pages)

Do 301 redirects (or router redirects) instead of rebuilding content:

Examples:
	•	/guides/buying → /buyer-guide
	•	/guides/selling → /seller-guide
	•	/guides/landlords → /landlord-guide
	•	/blog → /news (if you’re using /news as the blog hub)
	•	/buy and /rent → ideally redirect to /properties?mode=buy and /properties?mode=rent (or create dedicated filtered routes if your router supports it cleanly)

Key rule: redirect > duplicate.

⸻

6) Lower priority: Reviews, tracking events, compliance polish ✅

/reviews
	•	Testimonials, case studies, trust

Tracking
	•	events for form_submit, whatsapp_click, call_click, valuation_submit, investor_join_submit

Compliance polish
	•	Only after flows are stable, otherwise you’ll redo it twice.
Understood. No more Seller Guide / Landlord Guide / anything already done.
And yes: I will write the FULL page content so Lovable AI does not add anything — he only implements using your existing UI.

Copy-paste this to Lovable AI exactly:

⸻

✅ CONTENT-ONLY IMPLEMENTATION (NO UI CHANGES)

GLOBAL RULES (MANDATORY)
	•	CONTENT ONLY. Do not change UI, layout, spacing, colors, buttons, components, tokens, or styling.
	•	If a page already exists: replace content only.
	•	If a page does not exist: create it using existing page template + existing components, then insert the content below.
	•	Keep routing exactly as specified.

⸻

1) /sell  — Sell With Us (Landing)

PAGE TITLE: Sell With JBJ
H1: Sell Your Property with a Licensed Brokerage Approach

HERO

Headline: Sell Your Property with Confidence in Dubai
Subheadline: Pricing accuracy, qualified demand, and structured execution — handled by a licensed brokerage team.
Primary CTA button: Request a Valuation
Secondary CTA button: Speak to a Selling Advisor
Trust line (small): Licensed real estate brokerage for Buy, Sell & Rent (Dubai Mainland)

SECTION: What This Page Is

H2: A Selling Process Built for Clarity
Body:
Selling isn’t only about listing a property — it’s about pricing correctly, positioning the asset, qualifying buyers, and coordinating the transaction from offer to transfer. Our role is to manage the selling process professionally and transparently, with clear steps and documented progress.

SECTION: Who This Is For (3 cards)

H2: Who We Support
Card 1 title: End-Users Selling Their Home
Card 1 text: Clear pricing guidance and buyer screening to reduce wasted viewings and delays.
Card 2 title: Investors Exiting a Unit
Card 2 text: Strategy-driven positioning, timeline planning, and negotiation support aligned with your exit goal.
Card 3 title: Off-Plan Resale (Secondary Off-Plan)
Card 3 text: Assignment/resale handling aligned with developer requirements and transaction structure.

SECTION: The 6-Step Selling Framework

H2: Our Selling Framework
Step 1 — Discovery & Document Check: Title deed / Oqood, owner details, mortgage status, and unit specifics.
Step 2 — Market Pricing Strategy: Comparable evidence, positioning, and price corridor (not inflated promises).
Step 3 — Listing & Exposure: Portals + qualified broker network + buyer database outreach.
Step 4 — Enquiries & Viewings: Screening, scheduling, feedback loop, and offer readiness checks.
Step 5 — Negotiation & Offer Management: Offer validation, terms alignment, and buyer credibility verification.
Step 6 — Transfer Coordination: NOC coordination, trustee transfer support, mortgage settlement coordination where applicable.

SECTION: What You Prepare (checklist)

H2: What We’ll Ask You For
	•	Title Deed (or Oqood for off-plan)
	•	Owner passport/Emirates ID (if available)
	•	Unit details (size, view, parking, upgrades)
	•	Service charge status (if available)
	•	Mortgage details (if applicable)

SECTION: Valuation CTA Block

H2: Ready to Start?
Body: Request a valuation and our team will confirm the next steps and required documents.
Primary CTA: Request a Valuation → links to /sell/valuation
Secondary CTA: Speak to a Selling Advisor → links to Contact or your existing consult flow

FOOTER NOTICE (short)

JBJ Global Real Estate provides licensed brokerage support. Pricing guidance is based on available market evidence and buyer demand conditions.

⸻

2) /sell/valuation — Request Valuation (Form Page)

PAGE TITLE: Request a Property Valuation
H1: Request a Valuation

HERO

Headline: Get a Professional Valuation Review
Subheadline: Submit your property details. Our team will review and contact you with the next steps.
Primary CTA: Submit Valuation Request (this is the form submit button)

SECTION: Form Intro (above form)

H2: What Happens After You Submit
	1.	We review the information and confirm the ownership documents required.
	2.	We validate the unit profile and pricing context.
	3.	We contact you with the valuation range and recommended positioning approach.

FORM FIELDS (use your existing form component)
	•	Full Name
	•	Mobile Number (WhatsApp enabled)
	•	Email
	•	Property Type (Apartment / Villa / Townhouse / Plot / Other)
	•	Community / Area
	•	Building / Project Name
	•	Bedrooms
	•	Size (sq ft)
	•	Furnishing (Furnished / Unfurnished / Partly)
	•	View / Key Features (text)
	•	Mortgage Status (No / Yes)
	•	If mortgaged: Bank name + outstanding estimate (text)
	•	Ownership document upload (Title Deed / Oqood)
	•	Preferred selling timeline (ASAP / 30–60 days / 60–90 days / flexible)
	•	Notes (optional)

AFTER SUBMIT

Redirect to: /thank-you?type=valuation

FOOTER NOTICE (short)

Your submission is confidential and reviewed by authorized JBJ administrators only.

⸻

3) /property-management/list — Landlord Lead Form Page

PAGE TITLE: List Your Property for Rent
H1: List Your Rental Property

HERO

Headline: List Your Property for Rent with Structured Handling
Subheadline: Submit your rental details for review. Our team will contact you with next steps for tenant screening, contract coordination, and listing activation.
Primary CTA: Submit Rental Listing

SECTION: What Happens Next

H2: What Happens After You Submit
	1.	Our team reviews details and confirms documents.
	2.	We validate rental positioning and target tenant profile.
	3.	We activate the listing and begin tenant outreach (after approval).

FORM FIELDS
	•	Full Name
	•	Mobile (WhatsApp)
	•	Email
	•	Property Type
	•	Community / Area
	•	Building / Project
	•	Bedrooms
	•	Size (sq ft)
	•	Furnishing
	•	Desired annual rent (AED)
	•	Cheque preference (1 / 2 / 4 / 6 / 12)
	•	Availability date
	•	Title deed upload (or proof of ownership)
	•	Unit photos upload (optional)
	•	Notes (optional)

AFTER SUBMIT

Redirect to: /thank-you?type=landlord

FOOTER NOTICE (short)

All listings are subject to internal review and compliance checks prior to publication.

⸻

4) /investors — Investor Services (Landing)

PAGE TITLE: Investor Services
H1: Investor Services & Market Intelligence Access

HERO

Headline: Invest with Structure, Not Noise
Subheadline: Access research-driven guidance, area intelligence, and portfolio support designed for Dubai real estate investors.
Primary CTA: Join Investor Network
Secondary CTA: Access Market Intelligence

SECTION: What We Provide

H2: Investor Support, Delivered Professionally
	•	Deal sourcing across developer and resale opportunities
	•	Area intelligence and demand/supply context
	•	Rental strategy alignment (yield vs appreciation focus)
	•	Portfolio structuring and risk positioning
	•	Transaction coordination support through closing

SECTION: Investor Tracks (4 cards)

H2: Choose Your Investor Track
Card 1: Yield Strategy (Rental income focus)
Card 2: Appreciation Strategy (Capital growth focus)
Card 3: Off-Plan Strategy (Phased entry and exits)
Card 4: Portfolio Builder (Multi-asset allocation)

SECTION: What You Get (modules)

H2: What You Get After Joining
	•	Investor onboarding profile
	•	Saved areas & watchlist
	•	Report access (market + area intelligence)
	•	Curated shortlists by strategy
	•	Investor-ready comparisons

CTA BLOCK

H2: Join the Investor Network
Body: Submit your investor profile to unlock investor tools and reporting access.
Primary CTA: Join Investor List → links to /investors/join

FOOTER NOTICE (short)

No returns are guaranteed. Market intelligence is descriptive and based on available data sources.

⸻

5) /investors/join — Join Investor List (Form Page)

PAGE TITLE: Join Investor Network
H1: Join the Investor List

HERO

Headline: Unlock Investor Tools & Research Access
Subheadline: Submit your investor profile. Our team will review and activate access based on your objectives.
Primary CTA: Submit Investor Profile

SECTION: Form Intro

H2: Why We Ask These Details
Body: This helps us match you with suitable areas, inventory types, and risk profiles without wasting your time.

FORM FIELDS
	•	Full Name
	•	Mobile (WhatsApp)
	•	Email
	•	Nationality (dropdown)
	•	Residency status (UAE resident / non-resident)
	•	Budget range (dropdown)
	•	Investment goal (yield / appreciation / both)
	•	Preferred areas (multi-select)
	•	Unit type (apartment / villa / townhouse / plot)
	•	Timeline (now / 30–90 days / 3–6 months / flexible)
	•	Financing plan (cash / mortgage / mix)
	•	Notes (optional)

AFTER SUBMIT

Redirect to: /thank-you?type=investor

FOOTER NOTICE (short)

Your details are confidential and accessible only to authorized JBJ administrators.

⸻

6) /reviews — Reviews & Case Studies

PAGE TITLE: Reviews & Client Stories
H1: Client Experiences & Case Studies

HERO

Headline: Real Outcomes, Real Process
Subheadline: A selection of client feedback and transaction stories across buying, selling, renting, and investing.
Primary CTA: Speak to Our Team
Secondary CTA: View Properties

SECTION: Testimonials Grid

H2: Testimonials
(Use placeholder cards that you can later edit in CMS/admin)
Each card fields:
	•	Client Name (or initials)
	•	Category (Buyer / Seller / Landlord / Investor)
	•	Area / Community
	•	Short review text (2–4 lines)

SECTION: Case Study Format (3 blocks)

H2: Case Studies
Case Study Template:
	•	Objective
	•	Asset type & location
	•	Approach
	•	Outcome (non-financial promise language; factual process outcomes only)

FOOTER NOTICE (short)

Client stories reflect individual experiences and do not guarantee outcomes.

⸻

7) /thank-you — Universal Confirmation Page

PAGE TITLE: Thank You
H1: Thank You — We Received Your Submission

HERO

Headline: Your Request Has Been Submitted
Subheadline: Our team will review it and contact you shortly.

SECTION: Dynamic Message (based on query param ?type=)

If type=valuation:
Message: Your valuation request has been received. We’ll review your details and contact you with next steps.
If type=landlord:
Message: Your rental listing request has been received. We’ll review your details and coordinate the next steps.
If type=investor:
Message: Your investor profile has been received. We’ll review it and activate access accordingly.

CTA BLOCK

Primary CTA: Back to Home
Secondary CTA: Contact Us

⸻

8) /disclaimers — Licensing & Disclaimers Page (Readable Public Page)

PAGE TITLE: Licensing & Disclaimers
H1: Licensing, Disclosures & Important Notices

SECTION: Brokerage Licensing

H2: Brokerage Scope
JBJ Global Real Estate is a licensed real estate brokerage operating for property buy, sell, and rent services.

SECTION: Partner Introductions

H2: Third-Party Partner Services
For legal, mortgage, visa, corporate services, and other regulated services, JBJ may introduce independent licensed partners. Clients contract directly with partners under their terms.

SECTION: Market Intelligence

H2: Market Intelligence & Data Use
Market insights are descriptive and informational, based on available aggregated data sources referenced inside reports where applicable.

SECTION: AI Tools Disclosure

H2: AI Tools & Outputs
AI tools provide informational support and may be incomplete or outdated. Outputs must be validated before decisions.

SECTION: Intellectual Property

H2: Intellectual Property
All branding, content, and platform elements are protected. Unauthorized reproduction is prohibited.

⸻

DELIVERY REQUIREMENT

After implementing:
	•	Confirm which routes already existed vs newly created.
	•	Provide screenshots for all 8 pages.

⸻
