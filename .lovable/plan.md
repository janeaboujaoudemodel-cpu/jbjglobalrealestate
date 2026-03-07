

# Fix: Explore Services Image Loading, Scroll, Mobile Layout, and Headset Icon

## 3 Issues to Fix

### 1. Explore Services — Slow Image Loading
**Root cause**: The slideshow uses `AnimatePresence mode="wait"` which unmounts/remounts the `<img>` element on every slide change (every 3 seconds). Each remount forces a fresh image load — the browser can't cache effectively because the DOM element is destroyed. Also, images lack `loading="eager"` and there's no preloading of upcoming slides.

**Fix in `ExploreServicesCard.tsx`**:
- Remove `AnimatePresence` pattern. Instead, render ALL slide images in a stack (absolute positioned), and only toggle visibility/opacity via CSS transitions. This keeps all `<img>` elements in the DOM so the browser caches them after first load.
- Add `loading="eager"` and `fetchPriority="high"` to the first 3 images, `loading="lazy"` for the rest.
- Preload the next slide's image using a hidden `<link rel="prefetch">` or simply keep all images mounted.

### 2. Explore Services — Scroll Stuck / Mobile Compatibility
**Root cause**: The slideshow is a fixed-height card (`h-80 md:h-[420px]`) with `overflow-hidden`. On mobile, the content area buttons + nav arrows may overflow. The "scroll stuck" issue is likely from `AnimatePresence` re-rendering causing layout jank or the `onMouseEnter`/`onMouseLeave` handlers interfering with touch events.

**Fix in `ExploreServicesCard.tsx`**:
- Replace mouse enter/leave auto-play handlers with touch-aware logic (use `onPointerEnter`/`onPointerLeave` or just remove the pause-on-hover for mobile).
- Ensure the content area uses `overflow-y-auto` on mobile if content exceeds the fixed height, or adjust minimum height.
- Add touch swipe support using simple touch event handlers for mobile navigation.

### 3. Support Headset Icon — Premium Apple AirPods Max Style
**Current**: The SVG (lines 439-456) is a basic geometric headset with rectangular ear cups and thin lines — looks flat and cheap.

**Fix in `SupportTicketBox.tsx`**:
- Replace the entire SVG with a premium AirPods Max-inspired design featuring:
  - Thick, smooth headband arc with mesh-pattern crown detail
  - Rounded, deep ear cup shapes (oval/capsule) with inner depth shading
  - Multiple opacity layers for 3D metallic appearance
  - Subtle highlight strokes on the headband for a polished look
  - Proper proportions within the 64x64 viewBox at 28px render size

## Files to Modify

### `src/components/home/ExploreServicesCard.tsx`
- Replace AnimatePresence slide-swap with a persistent image stack (all images mounted, CSS opacity transition for active slide)
- Add eager loading for first few images
- Add touch swipe handlers for mobile
- Remove mouse-based auto-play pause or make it pointer-aware
- Ensure mobile-friendly button/arrow layout within the fixed-height card

### `src/components/SupportTicketBox.tsx`
- Replace SVG at lines 439-456 with a new premium AirPods Max-style headset icon featuring rounded ear cups, mesh crown detail, metallic depth layers, and highlight accents

