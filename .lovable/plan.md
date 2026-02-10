
# Header Search, Mobile Menu, Properties Page, and Project Card Fixes

## Overview

This plan addresses 7 distinct issues: search dropdown duplication (still happening), mobile hamburger divider alignment, properties hero scene dots removal, replacing the tower-shape video, developer logos on project cards, "...more" linking to project details, and featured ad images.

---

## Part 1: Fix Search -- Still Two Dropdowns

**Problem:** The search icon on hover opens `GlobalSearchModal` (correct), BUT the `MegaMenuSearch` component is still imported and potentially being triggered elsewhere. Looking at the code, the search icon at line 1433-1449 does call `setSearchOpen(true)` directly -- this is correct. However, `MegaMenuSearch` is still imported (line 55) and may be rendered through the mega menu system if `activeMegaMenu === 'search'` is somehow set.

**Root cause:** The search button uses `setSearchOpen(true)` which opens `GlobalSearchModal` -- but it does NOT close any active mega menu first. If a user hovers from another mega menu item to search, the mega menu stays open AND the search modal opens on top.

Additionally, `MegaMenuSearch` is still imported but the code at line 1485-1486 only renders language/account panels. The issue may be that hovering on the search icon doesn't close the currently-open mega menu panel, creating visual overlap.

**Fix in `src/components/GlobalHeader.tsx`:**
- In the search button's `onMouseEnter` and `onClick`, add `closeMegaMenu()` before `setSearchOpen(true)` to ensure any open mega menu is dismissed
- Remove the `MegaMenuSearch` import entirely (cleanup)
- Ensure the `GlobalSearchModal` closes on: clicking X, clicking outside, clicking search icon again, or pressing Escape
- Add toggle behavior: if `searchOpen` is already true and user clicks search icon, close it

---

## Part 2: Mobile Hamburger Menu -- Divider Alignment

**Problem:** The mobile menu (Sheet) has a logo header section with a `border-b border-gold/30` divider at line 655. The main header has a bottom divider at lines 545-553. When the hamburger opens, these two dividers don't align visually because the mobile menu's header has different padding/height than the main header.

**Fix in `src/components/GlobalHeader.tsx`:**
- Match the mobile menu header height to the main header height. The main header is `h-24 sm:h-28` on mobile. The mobile menu header uses `py-4` with a `w-16 h-16` logo
- Set the mobile menu header div to use a fixed height matching the main header: `h-24 sm:h-28` with `flex items-center`
- Ensure the bottom border of the mobile menu header aligns with the main header's bottom border by using the same positioning

---

## Part 3: Remove Scene Indicator Dots from Properties Hero

**Problem:** The `PropertiesHeroVideo` component shows clickable scene indicator dots (lines 103-123). The user wants these removed permanently -- scenes should auto-advance silently.

**Fix in `src/components/PropertiesHeroVideo.tsx`:**
- Delete the entire scene indicator dots block (lines 103-123)
- Also remove the `WhyDubaiCapitalSection` dots if they exist (they don't -- that component has no dots)

---

## Part 4: Replace `dubai-landmarks-hero.mp4` (Tower Shape Video) Globally

**Problem:** The video `dubai-landmarks-hero.mp4` shows a stylized tower/landmark shape that the user dislikes. It's used in:
1. `PropertiesHeroVideo.tsx` (imported as `downtownVideo` but NOT used in the scenes array -- already replaced by `burjKhalifaVideo`)
2. `MegaMenuProjects.tsx` (line 4 -- used in the featured card video)
3. `Developers.tsx` (line 24 -- used as hero video)
4. `PropertyEvaluator.tsx` (line 328 -- path reference)

**Fix:**
- Replace all imports/references of `dubai-landmarks-hero.mp4` with `burj-khalifa-day-to-night.mp4` which is the Burj Khalifa daylight drone shot the user wants
- In `PropertiesHeroVideo.tsx`: Remove the unused `downtownVideo` import
- In `MegaMenuProjects.tsx`: Change import to `burj-khalifa-day-to-night.mp4`
- In `Developers.tsx`: Change import to `burj-khalifa-day-to-night.mp4`
- In `PropertyEvaluator.tsx`: Change the path reference

---

## Part 5: Developer Logo on All Project Cards

**Problem:** The `ProjectCard.tsx` already shows developer logos (lines 196-204) when `(project.developer as any)?.logo_url` exists. The `ReellyProjectCard.tsx` may not have this. Need to verify and ensure both card types show the logo.

**Fix in `src/components/ReellyProjectCard.tsx`:**
- Add the same developer logo overlay in the top-left corner of the image area, matching the `ProjectCard` implementation
- Use `project.developer?.logo_url` with a white rounded container

**Fix in `src/components/home/FeaturedListings.tsx`:**
- The internal `ProjectCard` in FeaturedListings also needs the developer logo overlay added (it's a separate simplified component)

---

## Part 6: "...more" Link Should Open Project Details

**Problem:** In `ProjectCard.tsx` (line 342-347), the "...more" link already links to `/project/${project.slug}` -- this is correct. But the user reports it's not working. The issue may be that the `...more` text is inside a parent `<Link>` (line 192) that already wraps the entire card, so the inner `<Link>` creates a nested anchor tag which is invalid HTML.

**Fix in `src/components/ProjectCard.tsx`:**
- Change the inner `<Link>` for "...more" to a `<span>` since the parent `<Link>` already navigates to the project page on click
- The entire card is already clickable and goes to `/project/${project.slug}`

---

## Part 7: Featured Ad Cards Need Images (Not Black Background)

**Problem:** The `FeaturedProjectAd` component uses `imageUrl` from `FEATURED_ADS` which point to external CDN URLs. If these images fail to load, the card shows a black background (`#1a1a1a`).

**Fix in `src/components/FeaturedProjectAd.tsx`:**
- Add an `onError` handler on the `<img>` tag to show a fallback gradient or placeholder image instead of pure black
- Alternatively, add a champagne/gold gradient as the fallback background behind the image

---

## Files to Modify

| File | Change |
|---|---|
| `src/components/GlobalHeader.tsx` | Fix search toggle (close mega menu first), remove MegaMenuSearch import, fix mobile menu header height/divider alignment |
| `src/components/PropertiesHeroVideo.tsx` | Remove scene indicator dots, remove unused `downtownVideo` import |
| `src/components/header/MegaMenuProjects.tsx` | Replace `dubai-landmarks-hero.mp4` with `burj-khalifa-day-to-night.mp4` |
| `src/pages/Developers.tsx` | Replace `dubai-landmarks-hero.mp4` with `burj-khalifa-day-to-night.mp4` |
| `src/pages/PropertyEvaluator.tsx` | Replace video path reference |
| `src/components/ReellyProjectCard.tsx` | Add developer logo overlay in top-left of image |
| `src/components/home/FeaturedListings.tsx` | Add developer logo overlay to the simplified ProjectCard |
| `src/components/ProjectCard.tsx` | Fix nested Link for "...more" (change to span) |
| `src/components/FeaturedProjectAd.tsx` | Add image error fallback |

## Execution Order

1. Fix search behavior (close mega menu, toggle logic)
2. Fix mobile menu header divider alignment
3. Remove scene dots from PropertiesHeroVideo
4. Replace tower-shape video globally
5. Add developer logos to ReellyProjectCard and FeaturedListings
6. Fix "...more" nested link in ProjectCard
7. Fix FeaturedProjectAd image fallback
