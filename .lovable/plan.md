

# Fix Plan: 6 Issues -- Area Hero, Search Dropdown, Prices, and Marquee

## Issue 1: Area Hero Missing Photo (Dubai Land Residence Complex)

**Root Cause:** The `areas` table has `hero_image_url: NULL` and `image_url: NULL` for "Dubai Land Residence Complex". When both are null, the hero shows a plain gradient instead of a photo.

**Fix:** We need to find an appropriate image for this area. I will search for a suitable image URL or use a placeholder approach. Additionally, other areas may also lack images. We should set a fallback image for areas without photos.

**Changes:**
- `src/components/area-detail/AreaHeroSection.tsx`: Add a high-quality fallback image when both `hero_image_url` and `image_url` are null (e.g., a generic Dubai skyline image from the project's existing assets).

---

## Issue 2: Clickable Stats in Area Hero (Projects/Developers count)

**Root Cause:** The "63 Projects" and "33 Developers" stats in the hero are plain `<div>` elements -- they are not clickable.

**Fix:** Make them clickable:
- "63 Projects" scrolls down to `#projects-section` (which already exists in `AreaDetail.tsx` line 61)
- "33 Developers" scrolls down to the Developers section (need to add an `id="developers-section"` to `AreaDevelopersBar`)

**Changes:**
- `src/components/area-detail/AreaHeroSection.tsx` (lines 124-141): Wrap the Projects stat in a `<button>` that calls `scrollToId('projects-section')`, and the Developers stat in a `<button>` that calls `scrollToId('developers-section')`. Add cursor-pointer and hover effect.
- `src/components/area-detail/AreaDevelopersBar.tsx` (line 44): Add `id="developers-section"` to the `<section>` element.

---

## Issue 3: Search Hover Dropdown -- Layout Improvements

The user wants three changes to the search dropdown (embedded `GlobalSearchModal`):

### 3a: Popular Pages -- 3 columns instead of 2
Currently the "Popular Pages" grid is `grid-cols-2`. Change to `grid-cols-3` so items spread evenly with less vertical gap.

### 3b: Add a vertical divider between columns
Add subtle gold dividers between the Popular Pages columns for visual separation.

### 3c: Search input area -- premium champagne/gold background
The search input area at the top should have a distinct champagne-gold background to look more premium.

### 3d: Placeholder text inside search box
Move the hint text "Type to search projects, developers, tools & more" inside the input as placeholder text, replacing the current "Search anything..." placeholder.

### 3e: Search connected to full site
The search already uses `searchItems()` which indexes pages, tools, and routes. It needs to also search actual projects and developers from the database. I will enhance the search to query projects/developers dynamically.

**Changes:**
- `src/components/GlobalSearchModal.tsx`:
  - Line 216: Change `grid-cols-2` to `grid-cols-3` for Popular Pages
  - Line 156: Add champagne gradient background to the search input container
  - Line 163: Change placeholder to "Search projects, developers, tools & more..."
  - Remove the bottom hint text (line 252-254)
  - Add dynamic project/developer search via Supabase query when user types

---

## Issue 4: Remove Decimal Points from All Prices

**Root Cause:** The database stores prices with decimal precision (e.g., `1100000.017025`). The formatting functions don't always round before displaying.

**Fix:** Apply `Math.round()` to all prices before formatting, globally.

**Changes:**
- `src/components/home/FeaturedListings.tsx` (line 19-24): Update local `formatPrice` to use `Math.round(price)` before formatting
- `src/components/ProjectCard.tsx` (line 49-61): Update `formatPriceWithCurrency` to ensure `Math.round` is applied before conversion (it already does `Math.round` on converted value, but the conversion amplifies decimals for some currencies)
- `src/utils/formatNumber.ts` (line 47): The global `formatPrice` already rounds with `Math.round(num)` -- this is correct. But `formatPriceAbbreviated` (line 67-81) uses raw num for division which can produce decimals -- add rounding.

---

## Issue 5: Developer Marquee Logos Overlapping

**Root Cause:** The CSS marquee animation translates by `-loopWidth` pixels, but if `loopWidth` measurement happens before all images are fully rendered at their natural size, the calculated width is too small, causing Loop B to overlap with Loop A.

**Fix:** Multiple improvements:
1. Add `min-width` to each logo container to guarantee minimum spacing even if images haven't loaded
2. Add a third duplicate loop (Loop C) to ensure seamless wrapping even with measurement inaccuracies
3. Force `flex-shrink-0` and `white-space: nowrap` on the parent container
4. Add a small gap between loops using CSS gap

**Changes:**
- `src/components/DeveloperPartnersMarquee.tsx`:
  - Line 80-81: Add `min-w-[120px] md:min-w-[160px] lg:min-w-[180px]` to each logo container to guarantee minimum width
  - Line 132: Add `gap-0` and `will-change-transform` to the animation container
  - Ensure the animation container has `flex-nowrap` behavior

---

## Issue 6: Area Projects Section -- "View All" CTA

The user wants the area page projects grid to show 3-6 featured projects with an "Explore All Projects" CTA button, even when there are fewer than 12 projects.

**Fix:** Show the "View All Projects" CTA always (not just when >= 12), since it serves as a navigation element.

**Changes:**
- `src/components/area-detail/AreaProjectsGrid.tsx` (line 88): Remove the `projects.length >= 12` condition and always show the CTA.

---

## Summary

| # | Issue | Files | Change Type |
|---|-------|-------|-------------|
| 1 | Missing area hero photo | AreaHeroSection.tsx | Fallback image |
| 2 | Clickable stats | AreaHeroSection.tsx, AreaDevelopersBar.tsx | Add scroll-to buttons |
| 3 | Search dropdown layout | GlobalSearchModal.tsx | 3-col grid, champagne bg, placeholder, dynamic search |
| 4 | Price decimals | FeaturedListings.tsx, ProjectCard.tsx, formatNumber.ts | Math.round everywhere |
| 5 | Marquee overlapping | DeveloperPartnersMarquee.tsx | Min-width on containers |
| 6 | Area projects CTA | AreaProjectsGrid.tsx | Always show CTA |

