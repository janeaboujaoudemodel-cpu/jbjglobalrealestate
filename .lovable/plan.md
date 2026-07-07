I will implement the Amra fixes in focused batches and validate with Playwright screenshots on desktop and mobile.

## Batch 1 — Floor-plan loading and document titles
- Replace the inline floor-plan PDF renderer with a fast first-page preview on desktop and a stable document preview/download card on mobile so it stops hanging on “Loading document…”.
- Force every document loader/spinner to pure white on emerald, including Suspense fallbacks and nested PDF page loaders.
- Stop rendering all PDF pages inside the floor-plan card; keep full viewing/downloading in the document modal/download flow.
- Ensure floor-plan labels do not show noise such as `FINAL`, file extensions, or raw filenames.

## Batch 2 — Project location map
- Replace the red/black pin with a larger premium JBJ-style project pin.
- Apply the exact active metallic pill effect used by the `sq ft / sq m` active toggle to Satellite / Street / Terrain without changing the button colors or palette.
- Move premium view controls beside the Open Maps action using labels like “Survey view” / “Detail view” instead of “far/close”.
- Fix zoom controls so plus/minus respond instantly and do not scroll or redirect the page.

## Batch 3 — Nearby projects map
- Rename the heading from “Other projects in Al Raudah” to a clean Umm Al Quwain/emirate-based title.
- Rebuild the three map header tabs as one connected emerald/champagne bar with the same active pill effect as `sq ft`.
- Remove disabled/blocked cursor behavior from clickable tabs; only truly unavailable tabs will be inactive.
- Force all price/currency text on map markers to pure white.
- Replace the ugly current-project pin with the same premium visible pin.
- Fix marker click and zoom behavior and keep the map stable without automatic route/home redirects.

## Batch 4 — Presentation and brochure cards
- Lift the Generate Presentation monogram and “Click to start / ~30 seconds” content upward and redistribute padding cleanly inside the emerald card.
- Make the project brochure cover photo more visible from the center while keeping the same card design.
- Remove the live React `fetchPriority` console warning from the brochure image.

## Batch 5 — Project status and visible off-plan label
- Mark Amra as off-plan in the visible project status/category UI.
- Keep mortgage logic hidden/blocked for off-plan unless the existing rules allow it.
- Ensure the status is visible to users in the hero/quick facts where the project status is shown.

## Batch 6 — Section ordering and manual-project report rule
- Reorder bottom sections exactly as requested:
  1. Who’s buying here
  2. More projects by Citi Developers
  3. Noticed something incorrect? only for scraped/imported projects
  4. Expert consultation / request a callback
  5. Recommended Projects
  6. Dubai Market Intelligence
- Hide “Noticed something incorrect?” for manually added projects.
- Keep it available only for scraped/imported projects.

## Batch 7 — Videos, amenities, and Citi Buddy assets
- Restore the video gallery section so uploaded videos appear on the project page even when there is no main `video_url`.
- Use existing uploaded/project gallery images for amenities first.
- For missing amenity photos, use images extracted from the fact sheet/documents; only generate images if no real source exists.
- Add the real Citi Buddy robot visual from the Citi Buddy document/gallery into the Citi Buddy card, cropped/transparent-style if possible, not as a fake background.
- Use the Citi Buddy robot image as the document cover for Citi Buddy instead of repeating the generic project photo.

## Batch 8 — Location facts cleanup
- Remove/avoid unsupported false distance claims.
- Correct Vida Resort wording to reflect it is next to the project / about 25 meters away unless the official source states otherwise.
- Keep “flagship” next to Amra where appropriate.

## Batch 9 — Responsive and stability fixes
- Fix mobile cropping in the payment-plan timeline, starting price, floor-plan section, and cards.
- Prevent project-page refresh/redirect from returning users to the homepage; preserve the current project/search route after refresh.
- Reduce map/PDF work on initial render to improve perceived page speed.

## Validation deliverables
- Run Playwright on the Amra project page with desktop viewport `1280x1800` and a mobile viewport.
- Capture screenshots for: floor plans loader/preview, location map active pill + premium pin, nearby map tabs + white marker labels, generate presentation card, brochure card, off-plan label, videos, amenities/Citi Buddy, reordered bottom sections, and payment/mobile layout.
- Check console output and report zero relevant errors/warnings after the fixes.