# Amra + Platform Truth & UI Fix Plan

Scope is large. I'll ship in 6 patches, each validated with Playwright screenshots before moving on. No fabricated data — empty fields stay empty.

## Patch 1 — Truth restore (data)
- Amra project: force `location = "Umm Al Quwain"`, remove any "Al Hamra"/"Ras Al Khaimah" strings from title, subtitle, description, seo, address, nearby text.
- Amra: set `property_type` to include **Hotel Apartment / Serviced Apartment**, set `is_fully_furnished = true` (already user-entered — repair if flag was lost).
- Citi Developers profile: strip any invented "Al Hamra / RAK landscape" copy. Replace with neutral verified-only text (reuse `getSafeDeveloperDescription`).
- Sweep **all** projects (published + unpublished): null out any AI-generated `description`, `neighborhood_highlights`, `developer_bio` fields flagged by `hasUnsafeDeveloperCopy` or containing "Al Jazeera Al Hamra" when the stored `emirate` ≠ RAK. Prefer empty over wrong.

## Patch 2 — Payment plan UI
- Remove "Pending verification — confirm with our team" badge for **manually uploaded** plans (only show for scraped/Reelly source).
- Remove any "Verified" chip on manual uploads.
- Icons inside the two tab pills ("Payment Plan (70/30)", "100% Payment") and inside the % circle stage badges: force `text-white` (currentColor white on emerald bg). Fix in `PaymentPlanVisualization.tsx`.
- Stage number circles: white numerals on emerald (WCAG AA).
- "Detailed Payment Structure" collapsed by default (`<details>` closed / `useState(false)`), expand on click.

## Patch 3 — Documents library
- Card label = actual document type from filename/metadata ("Fact Sheet", "Brochure", "City Buddy"), not blanket "BROCHURE".
- Card cover image: for Brochure use project main hero photo; for other docs try to match a related photo by filename token, else neutral placeholder.
- Split single "VIEW / DOWNLOAD" strip into two buttons: `View` and `Download`.
- Viewer modal: full-width (sidebar-right → viewport-right), min-height 90vh, PDF canvas scales to container.
- On viewport < md, show banner: "For the full experience, open on desktop."
- Download resolver: if user clicks a "Brochure" card and brochure file exists → serve brochure; if only fact sheet exists → serve fact sheet (priority order).

## Patch 4 — Floor plans
- `FloorPlanGallery`: currently caps at 2 visible. Remove slice, render all pages of the PDF/all uploaded images with pagination or scroll. Verify all pages load via `pdf.numPages`.

## Patch 5 — Map + card prices
- Fix "Other projects in Al Jazeera Al Hamra" heading — pull from project's actual `area` field (Umm Al Quwain here). Empty area → "Other nearby projects".
- Map container: remove trailing white gutter (set `w-full` + `.leaflet-container { width:100% }` audit).
- Price pill on map markers and project cards: force `text-white` inside emerald pill — audit `ProjectCard.tsx`, `ReellyProjectCard.tsx`, marker HTML in `PropertiesMapView.tsx`.

## Patch 6 — Validation
Playwright on `/project/amra-...`:
- screenshot: hero (Hotel Apartment + Fully Furnished chip), Payment Plan tab (white icons, collapsed detail), 100% tab, Floor Plans (all pages), Documents (2 buttons + correct labels), Fact-sheet viewer full width, Location (Umm Al Quwain heading, no white gutter), Developer card (no fake RAK copy).
- Save all to `/mnt/documents/amra-fix/`.

## Technical notes
- Data repair via `supabase--migration` (UPDATE statements scoped to Amra + a cleanup UPDATE for all projects setting suspect AI-copy fields to NULL where `content_source = 'ai_generated'`).
- No schema changes.
- No new dependencies.
- Every visual change verified with a screenshot before I claim done.
