

## Fix Filter Bar Scroll Behavior, Save Filter UX, and Homepage Cleanup

### Problem 1: Filter bar reappears after scrolling past "Ready to Get Started"

The `IntersectionObserver` currently sets `bottomReached` based on `entry.isIntersecting`. When the "Ready to Get Started" section scrolls into view, `bottomReached = true` and the filter bar hides. But once you scroll further down past it (into the footer), the section is no longer intersecting, so `bottomReached` goes back to `false` -- causing the filter bar to reappear.

**Fix**: Change the observer logic to check `entry.boundingClientRect.top < 0` (section has scrolled above viewport) in addition to `isIntersecting`. Once the section enters the viewport OR is above it, `bottomReached` stays true. This applies to:

| File | Location |
|------|----------|
| `src/pages/DeveloperDetail.tsx` | Lines 66-77 |
| `src/components/area-detail/AreaStickySearchBar.tsx` | Lines 42-54 |
| `src/components/area-detail/AreaProjectsGrid.tsx` | Lines 73-85 |
| `src/components/project-detail/ProjectDetailLayout.tsx` | Similar observer logic |

The fix for each: change the observer callback from `setBottomReached(entry.isIntersecting)` to `setBottomReached(entry.isIntersecting || entry.boundingClientRect.top < 0)`. This ensures that once the "Ready to Get Started" section enters or passes above the viewport, the filter bar stays hidden for the remainder of the page.

### Problem 2: Save Filter needs delete confirmation

Currently, the delete button in the Saved Filters popover deletes immediately without confirmation.

**Fix in `src/components/filters/FilterShortcutBar.tsx`**:
- Add a confirmation state (`confirmDeleteIndex`) to the `UtilityButtons` component
- When the trash icon is clicked, instead of deleting immediately, show "Are you sure?" inline with Yes/No buttons
- On "Yes", delete the filter; on "No", cancel
- The heart icon for the "Saved" button is already red from the previous change

### Problem 3: Save button should save current active filters

The save functionality already works correctly -- `handleSaveFilter` in FilterShortcutBar (line 162-166) saves the current `filters` state to localStorage with the user-provided name. This is already correct behavior.

### Problem 4: Homepage hero FilterShortcutBar should be removed

The user says the filter shortcuts in the homepage hero section should not be there -- they belong inside the filter panel. 

**Fix in `src/components/home/HeroSearchBar.tsx`**:
- Remove the `FilterShortcutBar` component and its import from the hero search bar (lines 1022-1029)
- Remove the `shortcutFilters` state and related imports

### Summary of files to change

| File | Change |
|------|--------|
| `src/pages/DeveloperDetail.tsx` | Fix bottom sentinel to stay hidden past "Ready to Get Started" |
| `src/components/area-detail/AreaStickySearchBar.tsx` | Same bottom sentinel fix |
| `src/components/area-detail/AreaProjectsGrid.tsx` | Same bottom sentinel fix |
| `src/components/project-detail/ProjectDetailLayout.tsx` | Same bottom sentinel fix |
| `src/components/filters/FilterShortcutBar.tsx` | Add delete confirmation dialog for saved filters |
| `src/components/home/HeroSearchBar.tsx` | Remove FilterShortcutBar from homepage hero |
