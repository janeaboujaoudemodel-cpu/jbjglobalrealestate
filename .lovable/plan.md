

# Fix Plan: 6 Critical Tasks from Listing Admin & Homepage

## Task 1: Enrichment Checklist Completeness (Titania Test)

The Before/After enrichment cards currently show 8 metrics. The user wants ALL sections visible on Provident listings to be tracked in the checklist. Missing from the current UI:

**Current checklist (8 items):**
- Images, Documents, Amenities, FAQs, Floor Plans, Unit Types, Description, Payment Plan

**Missing from checklist (need to add):**
- USPs (usp_bullets)
- Location Distances (location_distances)
- Brochure (specific document type check)
- Highlights
- Service Charge
- ROI Estimate
- Video

**Changes:**
- `src/components/listing-admin/ReellyImportPanel.tsx` (lines 1004-1015): Expand the Before/After card grid from 8 items to 15 items, adding rows for USPs, Location Distances, Brochure, Video, Highlights, Service Charge, ROI. Show checkmark/cross for each.

---

## Task 2: Reelly Source Link Not Working

The enrichment test results show a "Reelly Source" link (line 986) that points to the raw API URL (`https://api-reelly.up.railway.app/api/v2/clients/projects/{id}`). This is an API endpoint, not a user-facing page -- clicking it fails or shows raw JSON.

**Fix:**
- Remove the external link or change it to open the project's own detail page (`/project/{slug}`) in a new tab instead.

---

## Task 3: Access Denied Flash on Page Reload

When the ListingAdmin page reloads, the auth check is async (`checkingAdmin || ownerLoading`). The loading spinner appears briefly, but if auth takes longer, the "Access Denied" card flashes before resolving.

**Fix:**
- Extend the loading state duration: keep showing the spinner for at least 2-3 seconds before deciding to show "Access Denied"
- Cache the owner verification result in sessionStorage so re-checks resolve instantly on reload

---

## Task 4: Enriched Projects Must Be Clickable

In the enrichment Before/After cards (lines 994-1018), the project name and cover image are not clickable. The user wants to click to view the live project page and compare.

**Fix:**
- Wrap the project name in a Link to `/project/{slug}` (opens in new tab)
- Add a "View Live" button below the Apply button that opens the project detail page
- Add a "View on Site" link next to the project name

---

## Task 5: Persist Enrichment State Across Reloads (Stop Wasting Firecrawl Credits)

All enrichment/extraction state is stored in React useState, so every page reload loses progress and may re-trigger Firecrawl requests.

**Fix:**
- Persist `enrichTestResult`, `enrichTestSlug`, `providentResult`, `bulkEnrichResult`, `fullProvidentProgress` to `sessionStorage`
- On component mount, restore persisted state so the user sees previous results without re-scraping
- Clear persisted state only when user explicitly starts a new operation

---

## Task 6: Developer Marquee/Strap Restoration

The user says the developer strap on the homepage was changed to look like "developer cards" instead of a simple logo strip. Looking at the current code, the logos are in `w-16 h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 rounded-xl` boxes with 3px gold borders and gold box shadows, making them look like cards.

**Fix (restore to simpler strap style):**
- Remove the rounded-xl box styling, gold border, and box-shadow from individual logos
- Make logos display as simple flat images in a continuous scrolling strip without card-like containers
- Keep the bg-white container for logo visibility but make it borderless and shadowless (or just a subtle separator)
- Keep the marquee animation behavior

---

## Technical Implementation Summary

| # | File(s) | Change |
|---|---------|--------|
| 1 | `ReellyImportPanel.tsx` lines 1004-1015 | Expand checklist to 15 items |
| 2 | `ReellyImportPanel.tsx` line 986 | Change Reelly link to project page link |
| 3 | `ListingAdmin.tsx` + `AuthContext` | Cache owner verification, extend loading grace period |
| 4 | `ReellyImportPanel.tsx` lines 978-1043 | Add clickable project links in Before/After cards |
| 5 | `ReellyImportPanel.tsx` multiple state vars | Persist enrichment state to sessionStorage |
| 6 | `DeveloperPartnersMarquee.tsx` lines 80-103 | Remove card-like styling, restore flat logo strap |

