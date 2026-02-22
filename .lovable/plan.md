
# Critical Fixes: Mega Menu Scene, Route Persistence, Monogram, Description Formatting, and More

This plan addresses all the outstanding issues reported across the project.

---

## 1. Remove Old "Burj Khalifa Day-to-Night" Video Scene from Mega Menu

**Problem:** The `MegaMenuProjects.tsx` dropdown still uses `burj-khalifa-day-to-night.mp4` -- the old scene the user has repeatedly asked to remove.

**Fix in `src/components/header/MegaMenuProjects.tsx`:**
- Remove the import of `burj-khalifa-day-to-night.mp4`
- Replace with a premium static image from existing assets (e.g., `menu-offplan-project.jpg` is already imported but the video overrides it)
- Remove the `video` prop from `MegaMenuFeaturedCard` so only the static premium image is used
- Also remove usage in `src/pages/Developers.tsx` (line 28) and `src/pages/PropertyEvaluator.tsx` (line 328) -- replace with static images or remove the video element

---

## 2. Fix Page Refresh Losing Current Route (RouteResume)

**Problem:** Refreshing takes the user back to the homepage instead of staying on the current page. The `RouteResume` component uses `sessionStorage` which loses data on tab close, and may have race conditions.

**Fix in `src/components/RouteResume.tsx`:**
- Switch `sessionStorage` to `localStorage` for `last-route` persistence -- this survives tab closes and browser restarts
- Add a guard: if `window.location.pathname !== "/"` on initial load, the browser already has the correct route (direct URL or refresh) -- do NOT redirect at all. Only restore from storage when the app genuinely loads on `/` but has a saved deep route
- This prevents the race condition where the app loads on the correct route but the component overwrites it

---

## 3. AI Analyzer Monogram -- Use Correct Logo (No Background Behind B)

**Problem:** The AI Analyzer in `ProjectAIAnalyzer.tsx` uses `jbj-monogram-transparent.png` which has a black box behind the B letter. The user wants `jbj-monogram-nobuffer.png` (clean, no background behind B).

**Fix in `src/components/project-detail/ProjectAIAnalyzer.tsx`:**
- Change import from `jbj-monogram-transparent.png` to `jbj-monogram-nobuffer.png`
- Keep the size at `w-32 h-32 md:w-40 md:h-40` (already updated in previous change)

Also audit all other loading/analyzer components to ensure they use the correct monogram:
- `BrandedLoader.tsx` -- uses `jbj-monogram-dark-on-light.png` and `jbj-monogram-light-on-dark.png` -- verify these are the correct variants without the black box behind B

---

## 4. Project Description -- Add Spacing Between Paragraphs and Visual Breaks

**Problem:** The "About" section description renders as one continuous block with no paragraph spacing.

**Fix in `src/components/project-detail/ProjectDetailLayout.tsx` (lines 726-732):**
- Add proper prose spacing classes to the description container: `prose-p:mb-4 prose-headings:mt-6 prose-headings:mb-3`
- In `src/lib/markdownUtils.ts` -- ensure `formatReellyDescription` converts double newlines into proper paragraph breaks (`<p>` tags) instead of `<br>` tags
- Add a subtle gold accent divider above and below the description block for visual separation

---

## 5. Project Hero Section Slow Loading

**Problem:** The hero section takes too long to load, showing nothing while the image loads.

**Fix in `src/components/project-detail/ProjectDetailLayout.tsx`:**
- Add a champagne gradient placeholder background behind the hero image so users see a premium background immediately while the image loads
- Change the fallback from `bg-premium-bg` (line 515) to a champagne gradient: `bg-gradient-to-br from-[#1a1510] via-[#0d0b08] to-[#000]` with a subtle gold shimmer animation
- Add `BrandedLoader` as a loading state overlay that fades out once the hero image loads (using an `onLoad` callback on `SafeImage`)

---

## 6. BrandedLoader Monogram Size -- Make It Larger Everywhere

**Problem:** The loading monogram across the site is too small (`w-24 h-24`).

**Fix in `src/components/ui/BrandedLoader.tsx`:**
- Increase the monogram size from `w-24 h-24 md:w-32 md:h-32` to `w-32 h-32 md:w-44 md:h-44`
- Add a gold fill animation effect (clip-path or mask-based) that progressively fills the monogram with gold color while loading, instead of just pulsing

---

## 7. Project Page Hero Gradient Overlay Fix (from-black for description fade)

**Problem:** The description fade gradient uses `from-black` (line 734) which may not match the champagne background of the content area.

**Fix:**
- Change `from-black` to `from-[#EDE0C8]` to match the champagne content background
- This applies to the "Read More" truncation gradient

---

## Technical Summary

| File | Changes |
|------|---------|
| `src/components/header/MegaMenuProjects.tsx` | Remove old video, use only static premium image |
| `src/pages/Developers.tsx` | Remove old video import, use alternative hero |
| `src/pages/PropertyEvaluator.tsx` | Remove old video reference |
| `src/components/RouteResume.tsx` | Switch to localStorage, fix race condition logic |
| `src/components/project-detail/ProjectAIAnalyzer.tsx` | Use `jbj-monogram-nobuffer.png` |
| `src/components/ui/BrandedLoader.tsx` | Larger monogram, gold fill animation |
| `src/components/project-detail/ProjectDetailLayout.tsx` | Description paragraph spacing, hero loading state, gradient fix |
