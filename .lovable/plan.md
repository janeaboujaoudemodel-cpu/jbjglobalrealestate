

## Fix Properties Page: Hero Section, Data Quality, Mega Menu, and Mobile Nav

### Issues Identified

1. **No Hero Section on /properties** -- The page opens directly with the filter bar and vertical nav. It needs a hero video section first (like project detail pages), and the vertical nav should only appear after scrolling past it.
2. **Wrong project count (2,480)** -- The database has 2,480 projects but 686 have NO cover image. These incomplete projects inflate the count and show "Media Pending Verification" placeholders.
3. **Projects without photos** -- 686 projects have no `cover_image_url`. These should be filtered out from the listing until they have images.
4. **Mega menu panels too large and don't close on hover-out** -- The panel needs to be smaller (max-w-[500px] instead of 700px) and must close instantly when the mouse leaves.
5. **Mobile hamburger menu** -- Should use the same vertical sidebar style as the desktop vertical nav.

---

### Part 1: Restore Hero Section on /properties with Scroll-Based Transition

**File: `src/pages/PropertiesReelly.tsx`**

- Re-add the `PropertiesHeroVideo` component at the top of the page (before the filter bar and listings)
- Add hero content inside it (headline, subheading, CTA buttons -- similar to how `Properties.tsx` had it)
- Remove the immediate `filter-bar-fixed` class on mount (lines 103-107)
- Add scroll-based logic (like `ProjectDetailLayout.tsx` lines 230-249):
  - Track scroll position with `showStickyNav` state
  - When `scrollY > window.innerHeight - 150`, set `filter-bar-fixed` class and show vertical nav + filter bar
  - When scrolling back to hero, remove class, hide vertical nav, show normal transparent GlobalHeader
- The vertical nav `<div>` (line 246-248) should be conditionally rendered based on `showStickyNav` state
- The filter bar section (line 251-276) should also be conditionally rendered based on `showStickyNav`

### Part 2: Filter Out Projects Without Images

**File: `src/pages/PropertiesReelly.tsx`**

- In the `dbProjectsMapped` memo (line 137-140), add a filter:
  ```
  .filter(p => p.thumbnail && p.thumbnail !== '')
  ```
- This ensures only projects with actual images appear in the listing
- The count will automatically reflect only projects with images (approximately 1,794)
- The `totalCount` variable (line 171) will naturally update since it uses `dbProjectsMapped.length`

### Part 3: Smaller Mega Menu Panels + Instant Close on Hover-Out

**File: `src/components/navigation/PropertiesVerticalNav.tsx`**

- Reduce mega menu panel from `max-w-[700px]` to `max-w-[500px]` (line 80)
- Reduce `max-h-[85vh]` to `max-h-[70vh]`
- Add `onMouseLeave` handler to the mega menu panel container that calls `closeMegaMenu()` instantly
- Add `onMouseLeave` on the backdrop that also calls `closeMegaMenu()`
- The panel should close immediately when the mouse moves outside it -- no delays

### Part 4: Mobile Hamburger Menu Using Vertical Nav Style

**File: `src/components/GlobalHeader.tsx`**

- Replace the current mobile Sheet/sidebar content with the `PropertiesVerticalNav` component (or a mobile-adapted version of it)
- The mobile hamburger menu should open a sliding panel from the left (matching the vertical nav design) with the same champagne gradient, same nav items, same mega-menu-on-click behavior
- This ensures consistency between the desktop vertical nav and mobile navigation

---

### Technical Summary

| # | File | Change |
|---|------|--------|
| 1 | `src/pages/PropertiesReelly.tsx` | Add `PropertiesHeroVideo` at top, scroll-based transition for vertical nav |
| 2 | `src/pages/PropertiesReelly.tsx` | Filter out projects where `cover_image_url` is null/empty |
| 3 | `src/components/navigation/PropertiesVerticalNav.tsx` | Smaller panel (500px), instant close on mouse leave |
| 4 | `src/components/GlobalHeader.tsx` | Mobile menu uses vertical nav style |

### Data Impact

- Current total: 2,480 projects in database
- Projects with images: 1,794
- Projects without images (hidden): 686
- The displayed count will accurately reflect ~1,794 available properties with verified media

