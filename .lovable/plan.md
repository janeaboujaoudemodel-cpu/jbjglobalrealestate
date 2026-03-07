

# Performance Audit & Speed Optimization Plan

## Current State (Measured)

| Metric | Value | Target |
|--------|-------|--------|
| FCP | **9.7s** | < 1.8s |
| DOM Content Loaded | **9.4s** | < 3s |
| Full Page Load | **10.3s** | < 5s |
| DOM Nodes | **12,282** | < 3,000 |
| Event Listeners | **1,894** | < 500 |
| JS Resources | **250 scripts** | Reduce by 60%+ |
| Total Script Size | **1,976KB** | < 800KB initial |

The site is extremely slow. Here is why, and what to fix.

---

## Root Causes

### 1. ExploreServicesCard imports 10 large JPG files statically
`src/components/home/ExploreServicesCard.tsx` imports 10 service background images at module level. Since this is a lazy-loaded component, the images are bundled as base64 or asset URLs that Vite processes eagerly. These should be loaded on-demand from `/assets/services/` or moved to the public folder.

### 2. WhyDubaiCapitalSection bundles a video file
`src/components/home/WhyDubaiCapitalSection.tsx` imports `why-dubai-scenes.mp4` as a static asset. This forces Vite to process and potentially inline a large video file into the bundle. Should use a URL string pointing to storage instead.

### 3. FeaturedListings images use `loading="lazy"` but are above-the-fold
The Featured Listings section is the 3rd section on the homepage (directly visible after a small scroll). Images and developer logos use `loading="lazy"`, which delays their appearance. The first 4 cards should use `loading="eager"`.

### 4. Every homepage section wrapped in framer-motion `whileInView`
75+ `whileInView` animations across 9 homepage components. Each registers its own IntersectionObserver. This creates hundreds of observers and delays paint. Most should be replaced with CSS animations or removed.

### 5. Hero video loads from Supabase storage with no CDN headers
The hero video URL `https://mdafrewypkkrildjgtey.supabase.co/storage/v1/object/public/videos/hero-video.mp4` has no cache headers and no CDN optimization.

### 6. FeaturedListings fetches 200 projects to show 8
The query fetches `.limit(200)` and filters client-side. This wastes bandwidth and processing time.

---

## Fix Plan

### Fix 1: Move service images to public folder (ExploreServicesCard)
**File**: `src/components/home/ExploreServicesCard.tsx`
- Remove all 10 static `import` statements for service images
- Reference images as `/services/buy-property-bg.jpg` etc. from the `public/` folder
- Move the 10 JPGs from `src/assets/services/` to `public/services/`
- This removes ~2-5MB from the Vite bundle processing pipeline

### Fix 2: Replace WhyDubai video import with storage URL
**File**: `src/components/home/WhyDubaiCapitalSection.tsx`
- Remove `import whyDubaiVideo from "@/assets/why-dubai-scenes.mp4"`
- Upload the video to storage and use a URL string instead (same pattern as hero video)
- This removes a large binary from the JS bundle graph

### Fix 3: Eager-load first 4 FeaturedListings images
**File**: `src/components/home/FeaturedListings.tsx`
- Pass an `index` prop to `ProjectCard`
- For index < 4, use `loading="eager"` and `fetchPriority="high"` on both project image and developer logo
- Keep `loading="lazy"` for cards 5-8

### Fix 4: Replace framer-motion `whileInView` with CSS for simple fade-ins
**Files**: `FeaturedListings.tsx`, `AreasWeCover.tsx`, `WhyChooseUs.tsx`, `OverseasInvestorsBanner.tsx`, `ToolkitShowcaseCard.tsx`
- Replace `<motion.div whileInView>` with a simple CSS class using `@keyframes fadeInUp` and IntersectionObserver via a lightweight shared hook
- This eliminates dozens of heavy framer-motion observers per section
- Keep framer-motion only for complex animations (hero, WhyDubai stats)

### Fix 5: Reduce FeaturedListings query from 200 to 40
**File**: `src/components/home/FeaturedListings.tsx`
- Change `.limit(200)` to `.limit(40)` — there are only 9 elite developers, so 40 rows is more than enough to pick 1 per developer
- Add `.select()` to exclude `description` field from the query (it's stripped of HTML anyway, wasteful to fetch)

### Fix 6: Preload critical above-the-fold assets
**File**: `index.html`
- Add `<link rel="preload">` for the JBJ logo (`jbj-fulllogo-light.png`) since it's in the hero
- Add `<link rel="preconnect">` for `img.youtube.com` (used by project detail pages)

### Fix 7: Reduce DOM complexity in DeveloperPartnersMarquee
**File**: `src/components/DeveloperPartnersMarquee.tsx`
- The marquee duplicates all 11 developer cards twice (22 DOM nodes with images). Use `will-change: transform` and CSS animation instead of JS-driven measurement for smoother performance
- Add `loading="eager"` to marquee logos since they're immediately visible

### Fix 8: Defer PopupLayer and non-critical MainLayout components
**File**: `src/components/MainLayout.tsx`
- Lazy-load `MarketingScripts`, `SecurityShield`, `GuidedTour`, and `CommandPaletteRoot` — these are not needed for initial render
- Delay `PopupLayer` mounting by an additional 1-2s beyond current logic

---

## Expected Impact

| Metric | Before | After (Est.) |
|--------|--------|-------------|
| FCP | 9.7s | < 2.5s |
| DOM Nodes | 12,282 | ~6,000 |
| Initial JS | 1,976KB | ~800KB |
| Featured images | Delayed | Instant |

## Files to Modify
1. `src/components/home/ExploreServicesCard.tsx` — remove static image imports
2. `src/components/home/WhyDubaiCapitalSection.tsx` — remove video import
3. `src/components/home/FeaturedListings.tsx` — eager load first 4, reduce query limit
4. `src/components/home/AreasWeCover.tsx` — CSS animations
5. `src/components/home/WhyChooseUs.tsx` — CSS animations
6. `src/components/home/OverseasInvestorsBanner.tsx` — CSS animations
7. `src/components/home/ToolkitShowcaseCard.tsx` — CSS animations
8. `src/components/DeveloperPartnersMarquee.tsx` — eager logos
9. `src/components/MainLayout.tsx` — lazy-load non-critical components
10. `index.html` — additional preloads
11. Move 10 service images from `src/assets/services/` to `public/services/`

