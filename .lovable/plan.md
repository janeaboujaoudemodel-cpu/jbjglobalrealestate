

## Properties Page Overhaul: Instant Layout, Edge-to-Edge Background, 2-Column Grid, and Pagination

### Problem Summary

1. **Hero section causes slow initial load** -- Users must scroll past a full-screen video hero before seeing any listings. The layout feels broken during load.
2. **Black edges visible** -- The card container uses `border border-gold/30 rounded-2xl` inside a padded wrapper, exposing the dark `bg-[hsl(var(--premium-bg))]` parent background on the left/right edges.
3. **3 cards per row** -- Currently `xl:grid-cols-3`. User wants 2 per row (like Reelly reference) when the vertical nav + filter bar are active.
4. **Infinite scroll** -- "Load More" button instead of numbered pagination. User wants page numbers at the bottom.
5. **Vertical nav + GlobalHeader overlap** -- Both show simultaneously during the transition, looking broken.

### Solution

#### 1. Skip Hero on Page Load -- Direct to Listing Mode

Remove the `PropertiesHeroVideo` hero section from `PropertiesReelly.tsx`. The page will open directly with the filter bar at top and vertical nav on the left (desktop). This eliminates the "broken loading" state and makes the page feel instant.

- On load, immediately set `isFilterFixed = true` and add `filter-bar-fixed` to body
- This means the vertical nav appears instantly and the GlobalHeader is hidden from the start
- The filter bar renders inline at `top-0` without needing to scroll past a hero

#### 2. Edge-to-Edge Background -- Remove Card Container Border

Remove the inner card container wrapper (`border border-gold/30 rounded-2xl p-4`) that creates visible edges. The champagne gradient background will stretch full width from edge to edge, with only the content grid using padding.

**Before:**
```text
[dark bg][  padded container with border  ][dark bg]
```

**After:**
```text
[full-width champagne background, no border]
[  content grid with padding only  ]
```

#### 3. Two Cards Per Row

Change grid from `xl:grid-cols-3` to `grid-cols-1 sm:grid-cols-2` maximum. This matches the Reelly reference layout where two cards sit side-by-side with the map (or just two wide cards in list mode).

#### 4. Pagination Instead of Infinite Scroll

Replace the "Load More" button with proper page-based pagination:

- Add `currentPage` state (default: 1)
- Define `ITEMS_PER_PAGE = 24` (configurable)
- Slice `sortedProjects` to show only the current page
- Render page number buttons at the bottom: Previous, 1, 2, 3, ..., Next
- Show "Page X of Y" indicator
- Scroll to top on page change

#### 5. View Mode Toggle (Grid vs List)

Add a toggle in the filter bar area for "Grid" (thumbnail cards) vs "List" (compact rows) view, matching the Reelly reference UI. The list view shows more projects per page in a compact table-like format.

### Technical Changes

**File: `src/pages/PropertiesReelly.tsx`**

1. Remove `PropertiesHeroVideo` import and the entire hero section (lines 231-264)
2. Remove the `filterSentinelRef` and IntersectionObserver -- the filter bar is always fixed from page load
3. On mount, immediately set `document.body.classList.add('filter-bar-fixed')` and clean up on unmount
4. The filter bar section renders as `fixed top-0` always (no conditional)
5. The vertical nav renders always on desktop (no `isFilterFixed` condition)
6. Remove the inner card container `div` with `border border-gold/30 rounded-2xl` -- let the section background stretch full width
7. Change grid to `grid-cols-1 sm:grid-cols-2` (2 cards max per row)
8. Add pagination state and logic:
   - `const [currentPage, setCurrentPage] = useState(1)`
   - `const ITEMS_PER_PAGE = 24`
   - Paginate `sortedProjects` and render page navigation buttons at bottom
9. Add `lg:pl-[200px]` to main content area instead of the flex-based sidebar spacer approach for consistent edge-to-edge backgrounds

**File: `src/pages/AreaGuides.tsx`** (same treatment)

1. Remove the fullscreen hero section
2. Start directly with filter bar fixed and vertical nav visible
3. Remove the `sentinelRef` IntersectionObserver logic
4. Make backgrounds edge-to-edge (remove any inner border containers)
5. Add pagination to the areas grid

### Layout Diagram

```text
Immediately on page load (no hero):

+--------+----------------------------------------+
| Vert   |  Filter Bar (fixed top-0)              |
| Nav    +----------------------------------------+
| 200px  |  [Card]  [Card]                        |
|        |  [Card]  [Card]                        |
|        |  [Card]  [Card]                        |
|        |  ...                                   |
|        |  < 1  2  3  4  5 ... 100 >             |
+--------+----------------------------------------+
```

Background stretches edge-to-edge with no visible black borders. Content is padded with `lg:pl-[200px]` so it clears the vertical nav.

