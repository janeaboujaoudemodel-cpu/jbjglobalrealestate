
## Fix: Sticky Filter Bar — Use IntersectionObserver Instead of Scroll Events

### Root Cause (verified)

The `window.addEventListener('scroll', ...)` approach does not reliably fire because `overflow-x: hidden` on the `<main>` element in MainLayout can cause the browser to implicitly compute `overflow-y: auto`, which interferes with window-level scroll events.

The existing `AreaStickySearchBar.tsx` component already solves this same problem successfully using `IntersectionObserver` instead of scroll events. We need to follow the same pattern.

### Fix (single file: `src/components/area-detail/AreaProjectsGrid.tsx`)

Replace the `useEffect` scroll listener (lines 28-50) with an `IntersectionObserver` on the placeholder/sentinel element:

1. Remove the scroll event listener entirely
2. Remove `sectionRef` (no longer needed)
3. Keep `placeholderRef` and `barRef`
4. Add an `IntersectionObserver` on `placeholderRef` with `rootMargin: "-80px 0px 0px 0px"` (same as AreaStickySearchBar)
5. When the sentinel is NOT intersecting (scrolled past), set `isFixed = true`
6. When the sentinel IS intersecting (visible), set `isFixed = false`

Everything else (the fixed positioning classes, placeholder height, container wrapping, filter layout) stays exactly as it is now.

### Why this will work

- `IntersectionObserver` uses the viewport as root by default and works correctly regardless of `overflow` settings on ancestor elements
- This is the exact same pattern that `AreaStickySearchBar.tsx` uses successfully on the same page
- No scroll event dependency means no scrolling-context issues
