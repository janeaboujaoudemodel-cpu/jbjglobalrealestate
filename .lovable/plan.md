## Root cause found

- Amra has **85 saved photos** in the backend under `project_images`; they are not lost.
- The public project query fetches those photos, but the gallery/media rendering path can still show zero because the project detail page normalizes/dedupes images in multiple places and the media section is currently video-only.
- Amra currently has **0 rows in `project_videos`** and storage search found **0 video files** in the relevant media buckets, so there are no backend videos attached to restore from the current saved project data. The fix must still make future video uploads persist and display immediately.
- Construction progress is hardcoded/fallbacked for Amra to July 2026 + 0%, and the visual line uses progress percent only, so “started this month” and the first milestone can look inconsistent.

## Plan

1. **Stop the gallery zero-render issue at the source**
   - Normalize Amra/project images once in the project-detail mapping layer and pass all 85 saved `project_images` through consistently.
   - Add a visible owner/debug-safe count path so the gallery section cannot silently disappear when backend rows exist.
   - Remove any over-aggressive filtering/deduping that can collapse valid owner-uploaded filenames like `1.jpg`, `02.jpg`, etc.

2. **Make Project Media handle both photos and videos correctly**
   - Keep `Project Gallery` for photos.
   - Rebuild `Project Media` so uploaded videos play inline in the same section without a tiny modal.
   - Add a clear empty video state for owner mode only: if no videos exist, it says no videos are attached instead of pretending there is a fake video.
   - Ensure future video uploads route to `project_videos`, invalidate the exact project query, and appear on the public page immediately.

3. **Attempt safe video recovery from backend storage**
   - Re-scan relevant storage paths and document tables for video MIME types/extensions.
   - If real video objects exist but are not linked, create/repair `project_videos` rows.
   - If the backend truly has zero video objects, do not use fake fallback video; leave the owner upload path fixed.

4. **Fix construction progress logic and contrast**
   - Replace static “Started this month” logic with date-based labels:
     - current start month: “Started this month”
     - after current month: “Construction started” + elapsed months/automatic status
     - future start date: “Pre-construction” / “Starts in …”
   - Make the first timeline segment visibly filled from the start even when progress is 0, while still showing `0%` as the backend progress.
   - Lock the status pill, icons, and progress line to correct white-on-emerald / champagne contrast so the guard cannot flip them.

5. **Rebuild House Details and Standard Inclusions**
   - Replace the current uneven card layout with equal-height, responsive premium cards.
   - Rebuild standard inclusions as aligned tiles/pills with stable dimensions, not wrapping unevenly or misaligning.

6. **Fix Amra amenity photos and white borders**
   - Remap Smart Home / IoT, 24-7 Security, Yacht-Limo, Fully Furnished, Fully Serviced, Smart Kitchen/Smeg to real Amra uploaded or brochure-derived images only.
   - Avoid lobby photos for security and avoid inaccurate kitchen imagery.
   - Use image containers that crop cleanly with no white side borders.
   - For amenities without a verified photo, show a premium icon tile instead of a wrong/random photo.

7. **Fix pagination circles**
   - Rebuild the amenity page number controls as fixed square/circle buttons with stable width/height and centered numerals.
   - Verify they remain circles on tablet width and do not stretch vertically.

8. **Sidebar/wordmark parity**
   - Align backend owner sidebar wordmark sizing, one-line black title, spacing, and vertical sidebar behavior to the front-end vertical sidebar pattern.

9. **Validation before claiming fixed**
   - Run database checks for Amra image/video counts.
   - Run Playwright on `/project/amra-the-first-integrative-wellness-resort-mr9hh3ia` at the requested preview viewport and desktop viewport.
   - Capture screenshots for: gallery with photos, media/video section state, construction progress, house details, standard inclusions, amenities with pagination, and backend sidebar.
   - Only mark items fixed after screenshot and data validation pass.