
# Fix: Hero Video Not Loading on Phone + Filter Dropdowns Rendering Behind Screen

## Problem 1: Homepage Hero Video Not Loading on Mobile

**Root cause:** In `src/pages/Index.tsx` (line 100-117), the hero video has `preload="none"` and relies on `onLoadStart` to trigger loading after a 2-second delay. On mobile browsers, `onLoadStart` never fires when `preload="none"` because the browser never initiates a load. The video stays at `opacity: 0` permanently -- showing only the fallback image.

**Fix:** Replace the broken `onLoadStart` deferred-loading pattern with an IntersectionObserver approach or a simple `useEffect` timeout that sets `preload="auto"` after a delay. The video element should start with `preload="metadata"` (which does fire `onLoadStart` on mobile) and transition to playing once `canplay` fires.

## Problem 2: Filter Dropdowns Opening Behind the Screen

**Root cause:** The `SaleStatusSelect` and `SaleStatusFilter` components use Radix `Popover` which renders via a Portal. However, the `PopoverContent` has `z-[10100]` while the sticky filter section is `z-40`. The issue is that on mobile, the Radix portal's `PopoverContent` may render visually behind the viewport or get clipped. The `bg-white/90` background on the popover trigger also makes the dropdown panel semi-transparent and hard to see on the champagne background.

Additionally, the `PopoverContent` does not have explicit `position` or `side` preferences set, so on mobile it may render above the trigger and get pushed off-screen.

**Fix:**
- Add `side="bottom"` and `avoidCollisions={true}` to all `PopoverContent` elements in `SaleStatusFilter.tsx`
- Increase the z-index of `PopoverContent` to match the Select dropdowns (`z-[10200]`)
- Change `bg-white/90` to `bg-white` (fully opaque) on popover trigger buttons
- Apply same fixes to any other Popover-based filters across the project

## Problem 3: WhyDubaiCapitalSection Video (Homepage, further down)

**Root cause:** `WhyDubaiCapitalSection.tsx` uses static ES module imports (`import burjAlArabVideo from ...`) which bundles 3 large video files into the JS bundle. This blocks page load and contributes to the "stuck" feeling on mobile. Same pattern that was already fixed in `PropertiesHeroVideo.tsx`.

**Fix:** Convert static imports to dynamic `new URL()` references, same as was done for PropertiesHeroVideo.

---

## Technical Details: Files to Modify

### 1. `src/pages/Index.tsx` (lines 95-129)
- Change `preload="none"` to `preload="metadata"`
- Replace `onLoadStart` setTimeout hack with a `useEffect` that sets video.src after a delay, or use `preload="metadata"` + proper `onCanPlay` handler
- Ensure `opacity` transitions from 0 to 1 when video is ready

### 2. `src/components/filters/SaleStatusFilter.tsx`
- On `PopoverContent` (line 91-96 and 200-205): add `side="bottom"` `sideOffset={8}` and increase z-index class to `z-[10200]`
- Change `bg-white/90` to solid `bg-white` on trigger buttons (line 68, 187)

### 3. `src/components/ui/popover.tsx`
- Update default `PopoverContent` z-index from `z-[10100]` to `z-[10200]` to match Select dropdowns and ensure popovers always render above sticky headers

### 4. `src/components/home/WhyDubaiCapitalSection.tsx`
- Convert 3 static video imports to `new URL()` dynamic references to avoid blocking the bundle

### 5. `src/pages/PropertiesReelly.tsx`
- Apply same PopoverContent fixes if SaleStatusFilter/SaleStatusSelect is used there
