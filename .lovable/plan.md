

## Fix Properties Page: Multiple Issues

### Issues Identified

1. **Duplicate Search Bars**: The page has TWO search/filter sections -- the old inline filter section (lines 436-607 with Select dropdowns for Emirate, Sale Status, Construction, Developer, Currency, Size, Sort buttons) AND the `FilterShortcutBar` component below it. The old one needs to be removed entirely and replaced by the single `FilterShortcutBar` which already has all these filters built in.

2. **Shows Only ~1,000 Properties**: The hero says "1,000 properties available" because `totalCount` falls back to `reellyTotal` (from the expired API) when it returns a non-zero cached value. The count must always reflect the actual merged dataset count (2,410).

3. **Map Split-Screen Too Small**: The map section uses `lg:w-[55%]` for cards and `flex-1` for the map, BUT the vertical nav takes 200px, squeezing the map. The split should be calculated from the content area only (excluding the sidebar), with a true 50/50 split between cards and map.

4. **Map Toggle Slow/Broken**: The map toggle triggers a URL param change via `setSearchParams` which causes a re-render cycle. Need to ensure the toggle is instant by using local state only and not triggering unnecessary re-fetches.

5. **Vertical Sidebar Not Showing in List Mode**: The `PropertiesVerticalNav` only renders inside the `isMapMode` block. Per spec, it should also show in list mode when the filter bar becomes fixed (header replacement pattern).

6. **Recommended Projects Section**: Uses `bg-black` background which doesn't match the premium champagne UI. Needs to be updated to use champagne gradient background with gold accents matching the rest of the page.

7. **Section Divider Between Listings and Market Intelligence**: Currently uses black background. Should match the page background (champagne) with a premium gold divider line.

---

### Technical Changes

#### File: `src/pages/PropertiesReelly.tsx`

**Remove old filter section** (lines 436-607): Delete the entire champagne card with inline Select dropdowns for Emirate, Sale Status, Construction Status, Developer, Currency, Size Unit, Sort buttons, and Hide Sold Out toggle. These are ALL already available in the `FilterShortcutBar` component.

**Keep only the FilterShortcutBar** (lines 609-620): Move it up to replace the removed section. Change its container background from `bg-black` to the champagne gradient to match the page style.

**Fix total count** (line 298): Change from `reellyTotal > 0 ? reellyTotal : dbProjectsMapped.length` to simply use `projects.length` for "showing" and `dbProjectsMapped.length` for "of total" so it always reflects the real database count (2,410).

**Fix map split-screen layout** (lines 626-693):
- Change from `lg:w-[55%]` cards / `flex-1` map to a true 50/50 split within the content area
- The vertical nav (200px) sits outside the split; the remaining space is divided equally
- Use `flex-1` for both the cards panel and the map panel so they share space equally

**Show vertical nav in list mode** when `isFilterFixed` is true (desktop only), wrapping the list section in a flex container similar to map mode.

**Wire FilterShortcutBar filters to actual data filtering**: Currently `shortcutFilters` state exists but is never used to filter projects. Connect the shortcut filter values (price, bedrooms, status, sort, hideSoldOut, etc.) to the sorting/filtering logic.

#### File: `src/components/project-detail/RecommendedProjects.tsx`

- Change `bg-black` to champagne gradient background: `bg-gradient-to-br from-champagne-light via-champagne to-champagne-dark`
- Update text colors: headings from `text-white` to `text-black`, description text accordingly
- Update card borders and styling to match the premium champagne card pattern used elsewhere
- Update the Sparkles icon color and "View All" link styling for champagne background contrast

#### File: `src/components/ui/section-divider.tsx`

- Add a prop option for champagne background variant (e.g., `variant="champagne"`) that uses the champagne gradient instead of `bg-black`
- This allows pages to use the divider on light backgrounds

---

### Summary of Changes

| File | Change |
|------|--------|
| `src/pages/PropertiesReelly.tsx` | Remove duplicate old filter section; keep only FilterShortcutBar; fix project count to show 2,410; fix 50/50 map split; show vertical nav in list mode when scrolled; wire shortcut filters to data |
| `src/components/project-detail/RecommendedProjects.tsx` | Change from black to champagne background with matching text and card colors |
| `src/components/ui/section-divider.tsx` | Add champagne variant for use on light-background pages |

### Result
- Single unified search/filter bar (no duplication)
- All 2,410 properties shown in count
- Map splits page exactly 50/50 (excluding sidebar)
- Vertical sidebar appears in both list and map modes on scroll
- Recommended Projects section matches premium champagne UI
- Section dividers use matching champagne background

