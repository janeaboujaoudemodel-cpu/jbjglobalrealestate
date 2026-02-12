

## Fix: Sticky Filter Bar (for real this time)

### Root Cause

CSS `position: sticky` is broken because `MainLayout.tsx` applies `overflow-x-hidden` on the `<main>` element (line 205). Any `overflow` property on an ancestor element creates a new scrolling context, which prevents `sticky` from working relative to the viewport. This is a known CSS limitation.

### Solution: JavaScript-based fixed positioning

Since we cannot remove `overflow-x-hidden` from `<main>` (it prevents horizontal scrollbar issues globally), we will switch to a JavaScript approach that manually toggles between static (in-flow) and fixed positioning.

### Technical Details

**File: `src/components/area-detail/AreaProjectsGrid.tsx`**

1. Replace the `hasShadow` IntersectionObserver with a scroll-based approach using `useEffect` + `scroll` event listener
2. Add a `placeholderRef` div that reserves space when the bar goes fixed (prevents layout jump)
3. Add a `barRef` on the filter bar itself to measure its height
4. On scroll:
   - Get the placeholder element's `getBoundingClientRect().top`
   - If `top <= 72` (header height) AND the section bottom is still in view, set `isFixed = true`
   - Otherwise set `isFixed = false`
5. When `isFixed` is true:
   - The placeholder div gets the bar's measured height (to prevent content jumping up)
   - The bar gets `position: fixed; top: 72px; left: 0; right: 0; z-index: 30` plus a shadow
   - The bar's inner content stays within a `container mx-auto px-4` wrapper for proper alignment
6. When `isFixed` is false:
   - The placeholder has `height: 0`
   - The bar is in its normal flow position inside the card

This is the same pattern used successfully in `AreaStickySearchBar.tsx` (which uses fixed positioning when `isSticky` is true).

### No other changes

The layout (search input, developer filter, status, bedrooms, sort) stays exactly as it is now. Only the positioning mechanism changes from broken CSS sticky to working JS-driven fixed.
