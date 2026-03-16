

## Plan: Global Fixed FilterShortcutBar Under Horizontal Utility Bar

### What changes

1. **Add FilterShortcutBar to MainLayout** — render a global `FilterShortcutBar` as a second fixed row directly below the `HorizontalUtilityBar` (at `top-[48px]`), matching the same champagne gold gradient. This becomes part of the L-shaped header on desktop, visible on all pages.

2. **Create a `GlobalFilterBar` wrapper component** (`src/components/navigation/GlobalFilterBar.tsx`) that:
   - Manages its own `ShortcutFilterState` (using `defaultShortcutFilters`)
   - Reads URL search params on mount to sync state (so navigating from filters goes to the right page)
   - On filter change, navigates to `/properties` with the filter params encoded in the URL
   - Uses the same champagne gradient background (`from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3]`) with gold border-bottom
   - Positioned fixed at `top-[48px]`, left-aligned with sidebar (`left-[200px]` / `left-[48px]` collapsed)
   - Hidden on mobile (`hidden md:block`)

3. **Update `MainLayout.tsx`**:
   - Import and render `<GlobalFilterBar />` right after `<HorizontalUtilityBar />`
   - Update the `<main>` top padding from `md:pt-[52px]` to `md:pt-[100px]` (48px utility bar + ~52px filter bar) to account for the new row

4. **Remove per-page fixed filter bars**:
   - `src/pages/Properties.tsx`: Remove the `isFilterFixed && createPortal(...)` block (lines 1140-1208) and the hero section filter bar. Keep the inline filter in the hero section's initial view or remove it since the global bar replaces it.
   - `src/pages/PropertiesReelly.tsx`: Remove the `showStickyNav` fixed FilterShortcutBar portal
   - `src/pages/DeveloperDetail.tsx`: Remove duplicate fixed FilterShortcutBar

5. **Remove HeroSearchBar from homepage**:
   - `src/pages/Index.tsx`: Remove `<HeroSearchBar />` import and rendering (the global filter bar replaces it)
   - The hero section can keep its visual content (video/image, tagline) but the search/filter UI moves to the global bar

6. **Adjust stacking**: The global filter bar uses `z-[9996]` (below utility bar at 9998, above page content)

### Files to edit
- **Create**: `src/components/navigation/GlobalFilterBar.tsx`
- **Edit**: `src/components/MainLayout.tsx` — add GlobalFilterBar, adjust main padding
- **Edit**: `src/pages/Properties.tsx` — remove fixed filter portal and hero filter
- **Edit**: `src/pages/PropertiesReelly.tsx` — remove fixed filter portal
- **Edit**: `src/pages/DeveloperDetail.tsx` — remove fixed filter bar
- **Edit**: `src/pages/Index.tsx` — remove HeroSearchBar

### Key implementation detail
The GlobalFilterBar will dispatch filter changes by navigating to `/properties?priceMin=X&bedrooms=Y...` so the Properties page picks them up. On the Properties page itself, the global bar's state will be synced with the page's local filter state via URL params.

