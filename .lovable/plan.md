
Goal: Make the listing admin preview match Provident exactly (card → full page), fix broken photos and missing fields (bedrooms/size/payment plan/brochure), stop sections “mixing into each other”, and update the “Stay in the Loop” / footer structure exactly as you specified (licensed line above the logo, no extra duplicate newsletter section).

-------------------------------------------------------------------------------
1) What’s objectively broken right now (verified on your current listing)
Route you’re on: /listing-admin/preview/54289763-0590-456f-8aaf-4ca1d9f7a93b

Backend record (pending_project_imports) for this item shows:
- images[0].url = "<Base64-Image-Removed>"  → this guarantees a broken image in UI (it is not a URL).
- documents = []  → brochure/payment-plan docs not present, so brochure section cannot work.
- bedrooms_min/max = null, size_min/max = null  → UI falls back to “Contact us” (the exact issue you reported).
- payment_breakdown only has during_construction: "80%"  → incomplete payment plan display.
- location_distances empty, faqs empty  → checklist stays red.

So: your report matches the data + there are also UI rendering and navigation issues to address.

-------------------------------------------------------------------------------
2) Fix broken photos (outside + inside) immediately (UI + data hygiene)
2.1 UI filtering (so broken placeholders never render)
Changes to implement:
- In all mapping layers that feed images into cards and ProjectDetailLayout (PendingImportCard, TestOneListingPanel preview card, PendingImportPreview mapping, ProjectDetailLayout):
  - Filter out any image entries where:
    - url is not a string
    - url does not start with http(s)
    - url contains known placeholders like "Base64-Image-Removed"
    - url is a data: URI
  - Normalize Provident CDN “/x/{size}/” images to safe working size "/x/464x312/" on-the-fly for display, so mixed old sizes don’t keep 403’ing.

Outcome:
- Even if extraction writes a bad first image, the UI will skip it and use the next valid one, eliminating “broken gallery” visuals.

2.2 Data repair (so the DB stops carrying broken first-image placeholders)
Changes to implement:
- Update the extraction/repair backend functions so they never write placeholders like "<Base64-Image-Removed>" into images.
- Add a “sanitize images” step during extraction updates:
  - Remove placeholder entries entirely
  - Deduplicate URLs
  - Normalize sizes to safe size
  - Ensure display_order is re-numbered sequentially from 0

Outcome:
- Your queue cards and full preview become stable and deterministic.

-------------------------------------------------------------------------------
3) Fix “View Full Page” not opening (the click should always navigate)
You reported: clicking “View Full Page” doesn’t open.

Likely causes (based on current implementation patterns):
- Button may be treated as type="submit" in some contexts, or click propagation/navigation is being interrupted in the card layout.
- Some “Review card” wrappers may be capturing clicks in a way that prevents your intended navigation call from firing consistently.

Changes to implement (robust fix, no guessing):
- Replace “navigate() onClick” for the “View Full Page” action with a real React Router <Link to="/listing-admin/preview/:id"> inside:
  - TestOneListingPanel’s preview card
  - PendingImportCard queue card action area
- Add stopPropagation on Approve/Reject buttons so the card click and the button click never conflict.

Acceptance test:
- From /listing-admin: click “View Full Page” → URL changes to /listing-admin/preview/:id and the full page loads every time.

-------------------------------------------------------------------------------
4) Extraction: stop “old extraction” and make it match Provident page-data deterministically
Right now, batch-extract-pending is still primarily driven by Firecrawl markdown + regex extraction.
You already have a page-data extractor file, but:
- It is not currently being used as the primary source in batch-extract-pending.
- Its parsing paths do not correctly match the real page-data JSON shape (for this listing the meaningful fields live under result.serverData.data.data).

4.1 Fix page-data parsing to match real Provident structure
Implement in supabase/functions/_shared/provident/pagedata-detail.ts:
- Correctly unwrap page-data to the inner “property detail” object:
  - result.serverData.data.data (this is where title, developer, min_bedrooms, max_bedrooms, price, images, etc. exist)
- Map fields exactly:
  - name: title
  - developerName: developer
  - location: display_address (and/or community)
  - bedroomsMin/Max: min_bedrooms / max_bedrooms
  - handover: completion_year (or completion)
  - priceFrom: price + display_price if needed
  - images: use tile_image.url, banner_image.url, gallery images, etc. (normalized to safe size)
  - locationDistances: parse time_to / nearby / distances if present (and only those)
  - floorPlanTypes: parse only true floor plan objects/links, never mix distances
  - paymentBreakdown: parse full breakdown fields if present (not just one key)
  - brochure/payment PDFs: extract from page-data and normalize to absolute URLs

4.2 Make page-data the primary extraction source (Firecrawl becomes fallback only)
Implement in supabase/functions/batch-extract-pending/index.ts:
- For each listing:
  1) Fetch page-data.json and parse it (no Firecrawl credits required)
  2) Fill ALL structured fields from page-data:
     - bedrooms_min/max, size_min/max (if present), amenities_list, usp_headline/bullets, usp_image_url, location distances, FAQs, payment breakdown
  3) Then only if something essential is missing, run Firecrawl scrape as fallback.

Outcome:
- Bedrooms and sizes stop showing “Contact us” when the source already provides real values.
- Payment plan stops being partial when the source provides the full plan.

4.3 If size/payment are missing in page-data: brochure-assisted fallback
You requested: “If you’re not able to find the details, you can read the brochure also.”

Implement fallback strategy:
- If page-data does not contain size/payment breakdown:
  - Mirror brochure PDF to internal storage (already the intended architecture).
  - Attempt a lightweight PDF text extraction path (backend function) to detect:
    - size ranges (sqft)
    - payment milestone percentages
  - If PDF parsing is not reliable for a given brochure, use AI on extracted text (not on screenshots) to produce exact values.
- Store results in:
  - size_min / size_max
  - payment_breakdown (down_payment / during_construction / on_completion)
  - payment_plan (summary string like "80/20" only if it is explicitly stated, otherwise null)

Outcome:
- “Contact us” placeholders disappear for the majority of listings.
- Payment plan matches Provident structure.

-------------------------------------------------------------------------------
5) Documents: brochures/payment plans must be present and must be internal (no external links)
You reported: brochure missing, brochure photo missing, and content missing.

Fixes:
- Ensure batch-extract-pending always attempts:
  - page-data PDFs + mirroring into the project-files bucket
- Ensure repair-project-extraction does NOT leave external PDF URLs in the DB:
  - If it finds PDF links, it must mirror them before saving documents[].
- Update the preview UI to only show brochure/payment/floorplan actions when a mirrored (internal) URL exists.

Acceptance test:
- This pending import shows at least:
  - 1 brochure document (mirrored URL)
  - optional payment plan PDF (mirrored URL)
  - optional floor plan PDFs (mirrored URLs)

-------------------------------------------------------------------------------
6) Stop sections mixing into each other (Floor Plans vs Location Distances vs USPs)
You described:
- Floor plan content mixed
- “30 minutes to Dubai Marina” appearing in the wrong section
This is almost always caused by extraction writing the wrong data to the wrong columns.

Fixes (two layers):
6.1 Extraction correctness:
- Enforce strict field validation before writing:
  - location_distances entries must be objects like {label,time} and time must contain “min” or a distance unit
  - floor_plan_types labels must contain "Studio/1BR/2BR/3BR/Floor Plan" patterns or have a pdfUrl; reject distance-like strings
  - usp_bullets must be plain bullets; reject anything that looks like a floor plan filename or distance line

6.2 Frontend defensive rendering:
- Add sanitization when rendering:
  - If a floor plan label contains “minutes”/“km” and has no pdfUrl, do not render it in FloorPlanGallery.
  - If a location distance item looks malformed, skip it rather than polluting the UI.

Outcome:
- Even a single bad extraction row will not break the page layout.

-------------------------------------------------------------------------------
7) Brochure cover: add the Provident-style photo + improve “JBJ Global Real Estate” readability
You asked:
- Brochure cover must show a skyline/downtown/Burj Khalifa day-view image (like Provident)
- Project name must sync automatically
- “JBJ Global Real Estate” on the brochure must be more readable

Implementation approach:
- Update PremiumBrochureCard so the cover image source is:
  1) project.brochure_cover_image_url if present (new optional field in extracted data), else
  2) project.images[0] (first valid hero image), else
  3) a fixed “Downtown skyline day” fallback asset from your existing site assets
- Increase brand text contrast (stronger text shadow, larger type) and ensure it never becomes unreadable over bright areas (add a subtle dark overlay gradient on the cover).

Note: If you require “the exact same Provident brochure cover photo”, we will attempt to extract the specific banner/tile image from page-data (banner_image/tile_image), which is usually the same visual they use.

-------------------------------------------------------------------------------
8) Replace the listing “Stay in the Loop” section with your normal page version (no duplicates)
You said:
- The listing page’s Stay in the Loop is not acceptable; use the normal page version.
- Remove the extra “below section”.
- And restructure footer so the licensed line is above the logo, logo down, across all pages.

Implementation changes:
- In ProjectDetailLayout.tsx:
  - Remove the custom NewsletterSection block before footer (so the detail page does not have a duplicate stay-in-loop).
- In Footer.tsx:
  - Restructure to match your instruction:
    - Move the “Licensed BUY SELL RENT REAL ESTATE In The UAE” block above the logo/wordmark section
    - Keep the logo section lower
  - Ensure no white backgrounds; pure black + champagne/gold accents only.

Outcome:
- Every page ends consistently with the footer’s official “Stay in the Loop” + licensed line in the correct order, with the logo placed below as requested.

-------------------------------------------------------------------------------
9) Fix “Request a Call Back Now” white layer and unify consultation form in listings
You said:
- Never use white.
- The listing page should use the consultation request form style (from contact page).
- Unify Contact Us cards.

Changes:
- In CallToActionSection.tsx:
  - Replace the white form container gradient (#FDFBF7 etc.) with champagne/card layers (no white).
- Replace/merge the listing form blocks so only one consistent consultation form is used on listing pages:
  - Use the existing ConsultationRequestForm component as the standardized form for “Register Your Interest / Request a callback” in the listing detail pages.
  - Ensure the heading stays “Get expert guidance” where you specified.

Outcome:
- One consistent, premium, champagne-on-black consultation form across listings (and eventually across other pages).

-------------------------------------------------------------------------------
10) Checklist: make it reflect Provident requirements accurately (and match your expectations)
Update TestOneListingPanel checklist rules so they align with what you actually want to approve:
- Core:
  - 2+ valid images (after filtering placeholders)
  - brochure present (mirrored URL)
  - description present
  - developer present
- Provident mirror:
  - bedrooms_min/max present
  - size_min/max present (or explicit “not provided by source” flag if truly absent)
  - payment_breakdown has at least 2 keys, not just 1
  - location distances present if Provident shows them for that listing
  - FAQs present if Provident shows them

Outcome:
- Red items correlate to real missing source data, not parsing mistakes.

-------------------------------------------------------------------------------
11) Step-by-step verification (what we will test after implementing)
Using the exact listing ID you are on:
1) /listing-admin
   - Card shows 1 photo (not broken)
   - Approve/Reject works
   - View Full Page always navigates
2) /listing-admin/preview/54289763-...
   - Hero image and gallery images load (no placeholders)
   - Bedrooms show 1–3 (not “Contact us”)
   - Sizes show real values if present in page-data or brochure
   - Payment plan shows exact Provident structure (not partial)
   - Location distances appear only in location section (not in floor plan)
   - Floor plans appear only as floor plans (not distances)
   - Brochure card shows cover image + readable JBJ branding, and download works using internal mirrored file

-------------------------------------------------------------------------------
12) One critical clarification (only if needed during implementation)
If Provident’s page-data does NOT include size ranges or full payment breakdown for some projects:
- Do you want those listings to be blocked from approval (remain red), or can they be approved if brochure + bedrooms + images + description are present?

I can enforce either rule, but it changes how strict the gate is.

-------------------------------------------------------------------------------
Files that will be involved (implementation phase)
Frontend:
- src/pages/listing-admin/PendingImportPreview.tsx
- src/components/listing-admin/TestOneListingPanel.tsx
- src/components/listing-admin/PendingImportCard.tsx
- src/components/project-detail/ProjectDetailLayout.tsx
- src/components/project-detail/FloorPlanGallery.tsx
- src/components/project-detail/PremiumBrochureCard.tsx
- src/components/project-detail/CallToActionSection.tsx (or replace with ConsultationRequestForm usage)
- src/components/Footer.tsx

Backend functions:
- supabase/functions/batch-extract-pending/index.ts
- supabase/functions/repair-project-extraction/index.ts
- supabase/functions/_shared/provident/pagedata-detail.ts
- supabase/functions/_shared/provident/pagedata.ts (PDF discovery improvements if needed)

-------------------------------------------------------------------------------
Execution order (fastest path to visible improvement)
1) UI image filtering + safe-size normalization (immediately stops broken photos)
2) Fix View Full Page navigation (Link-based, stopPropagation)
3) Fix page-data parser + make batch extraction use it first (bedrooms/size/payment)
4) Ensure PDF mirroring + documents population (brochure works)
5) Section separation hardening + defensive filtering (no “mixed” content)
6) Remove duplicate listing newsletter section + restructure footer ordering (licensed line above logo)
7) CTA form color/style changes (no white) + unify consultation form usage

