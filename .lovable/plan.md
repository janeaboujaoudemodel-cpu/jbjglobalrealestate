

## Remaining Tasks: Area Pages Unification, Admin Fixes, Edge Function Debugging

### Status of Previously Approved Plan

**Completed:**
- Properties page: Single unified FilterShortcutBar, shortcut filters wired to data, 50/50 map split, vertical nav in both modes, CurrencyTooltip removed
- useProjectsListing: Filters out projects without cover images, batch fetching past 1,000 limit
- RecommendedProjects: Champagne gradient background
- SectionDivider: Champagne variant added
- ListingAdmin cards: Now show cover images, developer name, price

**Still Pending (this plan):**

---

### Task 1: Replace AreaGuides.tsx Search with Unified Filter Pattern

The Areas index page (`/areas`) currently has a custom search bar with Input + Emirates pills + Building2/Flame/A-Z sort toggles. This needs to be replaced with the same `ProjectFilters` + `FilterShortcutBar` pattern from the Developer page, with fixed-on-scroll behavior.

**Changes to `src/pages/AreaGuides.tsx`:**
- Import `ProjectFilters` and `FilterShortcutBar` (same as DeveloperDetail)
- Replace lines 162-247 (custom search, Emirates pills, sort toggles) with:
  - A champagne card containing `ProjectFilters` (search input + dropdowns)
  - `FilterShortcutBar` below it
  - Three area-specific sort toggles (Building2 for property count, Flame for trending, A-Z) integrated into the bar
- Add IntersectionObserver + createPortal for fixed-on-scroll behavior
- Add `filter-bar-fixed` body class to trigger header replacement
- Since this page filters Areas (not Projects), the ProjectFilters search will filter area names, and the sort toggles will control area ordering

---

### Task 2: Replace AreaProjectsGrid.tsx Inline Filters with Unified Pattern

The Area detail page's project grid currently has custom Select dropdowns (Developer, Status, Bedrooms, Sort). This needs to match the Developer page pattern.

**Changes to `src/components/area-detail/AreaProjectsGrid.tsx`:**
- Remove the custom `filterBarContent` block (lines 185-289) containing inline Search, Select dropdowns for Developer/Status/Bedrooms/Sort, Filter icon, and Clear button
- Replace with `ProjectFilters` + `FilterShortcutBar` matching DeveloperDetail pattern
- Keep the existing IntersectionObserver and createPortal fixed behavior (already works)
- Wire filter state through the shortcut filters

---

### Task 3: Delete AreaStickySearchBar.tsx

This component is already unused (not imported by AreaDetail.tsx). Delete the file to clean up dead code.

**Delete:** `src/components/area-detail/AreaStickySearchBar.tsx`

---

### Task 4: Investigate and Fix Edge Function Enrichment Errors

The Listing Admin "Test Project Enrichment" and "Enrich All Provident Projects" features fail. During implementation, I will:
- Check edge function logs for the enrichment functions
- Identify the specific error causing "failed to send request"
- Fix the Provident enrichment showing all zeros
- Ensure the page-data.json fetching logic works correctly

---

### Task 5: ListingAdmin Project Fetch - Remove Cover Image Restriction

The ListingAdmin uses `useProjects()` which fetches ALL projects (including those without images). For admin purposes this is correct -- admin needs to see all projects to manage them. However, the cards should gracefully handle missing images with a placeholder. This is already handled (the card checks `project.cover_image_url || project.images?.[0]?.image_url`). No change needed here.

---

### Summary of Changes

| File | Change |
|------|--------|
| `src/pages/AreaGuides.tsx` | Replace custom search/sort with ProjectFilters + FilterShortcutBar + fixed-on-scroll + header replacement |
| `src/components/area-detail/AreaProjectsGrid.tsx` | Replace custom inline filter dropdowns with ProjectFilters + FilterShortcutBar |
| `src/components/area-detail/AreaStickySearchBar.tsx` | Delete (unused dead code) |
| Edge functions | Investigate and fix enrichment errors (Test Project + Provident) |

