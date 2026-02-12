

## Comprehensive Fix Plan: Properties, Areas, Listing Admin, and UI Issues

This plan addresses all the issues you've raised, organized by priority.

---

### Issue 1: Project Count Mismatch (2,410 in DB vs 1,822 in Reelly API)

**Root Cause**: The database contains 2,410 projects, but only 1,803 have cover images. The Reelly API currently lists 1,822 projects. The extra ~588 records in the DB are likely orphaned or duplicated entries that no longer exist in the API.

**Fix**:
- The Properties page should show the actual Reelly API count (1,822) as the canonical "available" count
- Projects without images (607 records) still appear but look broken -- these should be filtered or flagged
- Add a filter in `useProjectsListing` to only return projects that have a cover image AND match active Reelly records
- Update the hero count text to say "1,800+ properties available" based on projects with images

**File**: `src/pages/PropertiesReelly.tsx`
- Change `totalCount` to use `projects with cover_image_url` count instead of raw DB count
- Filter `dbProjectsMapped` to exclude entries with no `thumbnail`/`cover_image_url`

**File**: `src/hooks/useProjects.ts` (`useProjectsListing`)
- Add `.not('cover_image_url', 'is', null)` filter to the query so only projects with images are fetched

---

### Issue 2: Unified Search/Filter Across All Pages (Areas, Area Detail, Properties, Developers)

**What the user wants**: The same search + filter bar pattern from the Developer page (Binghatti) should be used everywhere -- Areas index, Area detail, Properties. This means `ProjectFilters` component (search input + developer dropdown + status + bedrooms + sort) combined with `FilterShortcutBar` below it, with the same fixed-on-scroll behavior.

**Changes**:

#### File: `src/pages/AreaGuides.tsx`
- Remove the current custom search bar (lines 162-244: Input + Emirates pills + sort buttons)
- Replace with `ProjectFilters` + `FilterShortcutBar` in the same champagne card pattern used in DeveloperDetail
- Add IntersectionObserver for fixed-on-scroll behavior with `createPortal`
- Add the three sort toggle buttons (Building2 for property count, Flame for trending, A-Z for alphabetical) inside the FilterShortcutBar area
- Add `filter-bar-fixed` body class for header replacement

#### File: `src/components/area-detail/AreaProjectsGrid.tsx`
- Remove the current custom inline filter bar (lines 186-289: search input + Select dropdowns)
- Replace with `ProjectFilters` + `FilterShortcutBar` matching the Developer page pattern
- Keep the existing IntersectionObserver and createPortal fixed behavior (already works)

#### File: `src/components/area-detail/AreaStickySearchBar.tsx`
- Remove entirely (replaced by the unified filter in AreaProjectsGrid)

---

### Issue 3: Map Mode Split-Screen Not Working Properly

**Problem**: The map is too small and the split doesn't account for the sidebar correctly.

**Fix in `src/pages/PropertiesReelly.tsx`**:
- The split layout should NOT include the vertical nav width in the 50/50 calculation
- Structure: `[VerticalNav 200px] [Cards 50%] [Map 50%]` where 50/50 is of the remaining space after the nav
- Use `flex-1` wrapper for the content area, then `w-1/2` for each half inside it (this is already the structure, but verify it renders correctly)
- When in list mode AND filter is fixed, the vertical nav should also appear (full height from top to bottom)

---

### Issue 4: Vertical Navigation Persistence

**What the user wants**: The vertical nav (JBJ logo + links) should be a full-height left sidebar that appears from top to bottom when the filter bar becomes fixed. The fixed search/filter header starts AFTER (to the right of) this sidebar, not covering it.

**Fix in `src/pages/PropertiesReelly.tsx`**:
- When `isFilterFixed` is true, wrap the entire page in a flex layout: `[VerticalNav full-height fixed left] [Content area with fixed filter bar at top]`
- The fixed FilterShortcutBar should have `left: 200px` (sidebar width) instead of `left: 0` so it starts after the sidebar
- The vertical nav should be `position: fixed; top: 0; left: 0; height: 100vh;` when active

---

### Issue 5: Currency Tooltip Position

**Problem**: The currency change popup appears at a random position (bottom-right) instead of near the currency selector.

**Fix in `src/components/CurrencyTooltip.tsx`**:
- Remove the tooltip entirely OR anchor it to appear near the currency button in the FilterShortcutBar
- Since there's no standalone currency button visible on the current page (it's inside FilterShortcutBar), the safest fix is to remove this tooltip component from rendering in PropertiesReelly.tsx

**File**: `src/pages/PropertiesReelly.tsx`
- Remove `<CurrencyTooltip />` from the render

---

### Issue 6: Listing Admin Issues (Enrichment Failures, Card Layout)

**Problem**: Test Project Enrichment fails with edge function errors. Provident enrichment shows zeros. Cards have no photos.

**Files to investigate and fix**:
- `src/pages/ListingAdmin.tsx` -- Project cards need to display cover images and full details (currently showing minimal text-only cards)
- Edge function errors need investigation (will check logs during implementation)
- Card background needs to extend to contain all content
- Cards should use the same `ProjectCard` component used elsewhere (with photo, developer, price, status)

**Fix in `src/pages/ListingAdmin.tsx`**:
- Replace minimal text cards with `ProjectCard` component (same as used on Properties/Developer pages)
- Ensure the query fetches `cover_image_url`, `developer_name`, `price_from`, etc.
- Fix the card container background to fully contain cards (add `overflow-hidden` or extend background)
- Remove the 1,000 project limit -- fetch all projects (use batch fetching like PropertiesReelly)

---

### Issue 7: Section Divider Colors

**Problem**: Dividers between sections still use black background.

**Fix**: Already have `variant="champagne"` in `section-divider.tsx`. Need to apply it in all pages where dividers appear on champagne backgrounds.

---

### Issue 8: Recommended Projects Section UI

**Problem**: Background doesn't match premium champagne theme.

**Already fixed** in previous iteration -- `RecommendedProjects.tsx` was updated to champagne gradient. Will verify during implementation.

---

### Summary of All File Changes

| File | Change |
|------|--------|
| `src/pages/PropertiesReelly.tsx` | Fix project count (filter projects without images); fix vertical nav full-height layout; fix filter bar left offset when fixed; remove CurrencyTooltip |
| `src/hooks/useProjects.ts` | Add `cover_image_url IS NOT NULL` filter to `useProjectsListing` |
| `src/pages/AreaGuides.tsx` | Replace custom search with `ProjectFilters` + `FilterShortcutBar` + sort toggles (Building2/Flame/A-Z); add fixed-on-scroll behavior |
| `src/components/area-detail/AreaProjectsGrid.tsx` | Replace custom filter bar with `ProjectFilters` + `FilterShortcutBar` matching Developer page |
| `src/components/area-detail/AreaStickySearchBar.tsx` | Remove file (replaced by unified filter) |
| `src/pages/AreaDetail.tsx` | Remove AreaStickySearchBar usage if present |
| `src/components/CurrencyTooltip.tsx` | Remove or reposition to anchor near currency button |
| `src/pages/ListingAdmin.tsx` | Use ProjectCard with photos; remove 1,000 limit; fix card containers |
| `src/pages/DeveloperDetail.tsx` | Verify filter bar left offset accounts for sidebar (if applicable) |

