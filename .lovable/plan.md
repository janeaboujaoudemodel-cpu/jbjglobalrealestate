## Goal
Restore the project gallery/lightbox to one clean standard viewing screen on every device, with fixed navigation, gold header controls, and no duplicated low/high-resolution versions of the same photo.

## Tasks

1. **Repair the fullscreen gallery layout**
   - Update `src/components/ImageCarousel.tsx` so fullscreen is always one stable viewport, not a giant image that changes size by photo ratio.
   - Use a fixed header, fixed image stage, and fixed thumbnail filmstrip.
   - The main photo will use `object-contain` inside the stage so every photo fits the same screen without cropping or pushing layout.
   - Remove the broken behavior where portrait/landscape photos resize the whole modal.

2. **Connect the header properly**
   - Keep the top bar attached to the gallery, always visible.
   - Show the project name and counter as: `Project name  2 / 20`.
   - Keep the close and download buttons in the same header row.
   - Repaint the close/download icon buttons to gold icon/border styling, with black text/icons only where needed for contrast.

3. **Fix navigation controls**
   - Keep left/right arrows inside the gallery stage and centered vertically.
   - Make arrow buttons responsive: smaller on mobile, larger on desktop.
   - Prevent arrows from overlapping the header or thumbnails.

4. **Fix thumbnail strip**
   - Keep the thumbnails as a bottom filmstrip, horizontally scrollable.
   - Make it a stable height on desktop/tablet/mobile.
   - Highlight the selected image with gold border.

5. **Harden duplicate photo removal globally for this gallery**
   - Move/strengthen URL normalization in the gallery image pipeline so `/x/464x312/`, `/x/1920x1080/`, query transforms, thumbnail suffixes, and repeated storage variants collapse into one photo.
   - Always keep the best/highest quality variant.
   - Ensure the count in the header and thumbnail strip uses the de-duplicated list only, so the same image cannot appear twice as low-res + high-res.

6. **Responsive validation checklist before claiming completion**
   - Test desktop: `1366×768` and `1920×1080`.
   - Test tablet: `1024×768` and `834×1194`.
   - Test mobile: `390×844` and `360×800`.
   - For each viewport, verify:
     - One standard gallery screen.
     - Header stays visible.
     - Counter updates correctly.
     - Gold close/download controls are visible.
     - Main image fits the stage.
     - Thumbnails do not cover the image.
     - Arrows work and do not overlap critical controls.
     - Duplicate low/high-res variants are not shown.

## Technical notes
- Primary files to modify:
  - `src/components/ImageCarousel.tsx`
  - likely `src/lib/imageUtils.ts` only if shared image dedupe helpers should be centralized.
- I will not modify unrelated listing content, project data, or owner media management behavior beyond preventing duplicate display in the gallery.