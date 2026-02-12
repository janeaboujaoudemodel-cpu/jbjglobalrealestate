

## Fix: Sticky Filter Bar + Add Developer Filter

### Problem
The current approach toggles `sticky` on/off via JavaScript scroll events, which **breaks CSS sticky behavior**. CSS `position: sticky` already handles this natively -- the element stays in normal flow until it reaches the `top` threshold, then pins itself. Toggling the class via JS defeats this mechanism entirely.

### Solution

**1. Always apply `sticky top-[72px]`** on the filter bar (no JS toggle needed). CSS sticky naturally:
- Keeps the bar inside the card in normal document flow
- Pins it under the header (at `top: 72px`) once scrolled past
- Returns it to its original position when scrolling back up

The `useEffect` scroll listener and `isSticky` state will be removed entirely. Instead, an `IntersectionObserver` on a sentinel element (similar to `AreaStickySearchBar.tsx`) will only be used for the visual shadow effect (so the bar gets a shadow when pinned).

**2. Add Developer Filter** as a new `Select` dropdown between Status and Bedrooms, populated dynamically from the project data.

### Technical Details

**File: `src/components/area-detail/AreaProjectsGrid.tsx`**

- Remove `isSticky` state and the `useEffect` scroll listener
- Add a sentinel `div` just above the filter bar
- Use `IntersectionObserver` on the sentinel to toggle a `hasShadow` state (for visual feedback only)
- Set the filter bar to always have `sticky top-[72px] z-30`
- Add `hasShadow` conditional class for shadow when pinned
- Add `developerFilter` state
- Derive `developerOptions` from project data (unique developer names)
- Add developer filter `Select` in the toolbar
- Include developer filter in the filtering logic and `hasActiveFilters` / `clearFilters`

