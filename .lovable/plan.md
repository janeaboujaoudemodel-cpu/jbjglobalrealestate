

# Fix Plan: Continue Searching Title, Shimmer Overlap, Golden Visa Button Layout, and Why Dubai Video

## Issues Identified

### 1. Continue Searching — Title and Shimmer
- **Title**: Currently says "Continue Searching for {projectName}" which is too narrow. Change to a more inclusive title like "Continue Your Search" with a "Register Your Interest" CTA button next to it.
- **Shimmer/fade edges**: The left/right fade gradients (lines 119-120 in `ContinueSearching.tsx`) use `from-background` which doesn't match the black background, causing a visible light overlay that hides part of the cards. Fix by using `from-black` to match the section's actual background.

### 2. Golden Visa Slide — Button Layout on Mobile
- **Problem**: In `ExploreServicesCard.tsx`, the Golden Visa slide (line 281-286) has TWO buttons ("Get Your Golden Visa" + "Read Guide") plus nav arrows, all in a `flex-wrap` row. On mobile, the long CTA text causes the buttons to stack vertically and the arrow buttons get pushed down.
- **Fix**:
  - Shorten primary CTA to "Golden Visa" or "Get Started"
  - Make the "Read Guide" secondary button smaller
  - Ensure the button row uses `flex-wrap` properly with smaller text on mobile
  - Reduce button `size` from `lg` to `default` on mobile for long-text CTAs

### 3. Why Dubai Video Not Playing
- **Problem**: The video element has `preload="metadata"` which is too lazy. Combined with the `AnimatePresence` re-mounting on `currentScene` change (every 6s), the video may never fully load before being swapped out. Since there's only 1 scene, the re-mount is unnecessary but the preload strategy is too conservative.
- **Fix**:
  - Change `preload` from `"metadata"` to `"auto"` for immediate loading
  - Remove the `AnimatePresence`/`motion.div` wrapping since there's only one scene — this prevents unnecessary re-mounts that reset the video element
  - Add an `onLoadedData` handler to fade out the poster image once the video is ready

## Files to Modify

### `src/components/ContinueSearching.tsx`
- Change title from "Continue Searching for {name}" to "Continue Your Search"
- Add a "Register Your Interest" button/CTA next to the title
- Fix fade edge gradients: replace `from-background` with `from-black` on both left and right edges

### `src/components/home/ExploreServicesCard.tsx`
- Shorten the Golden Visa CTA label in `CTA_LABELS` from "Get Your Golden Visa" to "Golden Visa"
- Make the "Read Guide" button use `size="default"` instead of `lg`
- Add responsive text sizing to all long CTA buttons (use `text-sm` on mobile)

### `src/components/home/WhyDubaiCapitalSection.tsx`
- Remove `AnimatePresence` and `motion.div` around the video (single scene, no crossfade needed)
- Change video `preload` from `"metadata"` to `"auto"`
- Add state to track video loaded, fade out poster `<img>` once video plays
- Keep `IntersectionObserver` for lazy initialization but ensure video loads aggressively once visible

