

## Fix: Filter Bar Shows on Load Because Sentinel Below Viewport = "Not Intersecting"

### Root Cause

The `IntersectionObserver` callback does `setIsFixed(!entry.isIntersecting)`. On page load, the sentinel (`placeholderRef`) sits inside the projects section which is far below the viewport (the hero is full-screen). Since the sentinel is not visible, `isIntersecting` is `false`, so `isFixed` becomes `true` immediately -- showing the fixed bar under the header before the user has scrolled at all.

### Fix (single file: `src/components/area-detail/AreaProjectsGrid.tsx`)

Change the observer callback to check the sentinel's vertical position. The bar should only be fixed when the sentinel has scrolled **above** the header (i.e., the user scrolled past it going down), NOT when the sentinel is below the viewport (page just loaded).

**Line 60 change:**

Replace:
```js
([entry]) => setIsFixed(!entry.isIntersecting)
```

With:
```js
([entry]) => {
  // Only fix the bar when sentinel has scrolled ABOVE the header area
  // (boundingClientRect.top < ~140px means it's past the header)
  // When sentinel is below viewport (initial load), don't fix
  setIsFixed(!entry.isIntersecting && entry.boundingClientRect.top < 140);
}
```

This single condition change ensures:
- Page load (sentinel far below viewport): `isIntersecting=false` but `top > 140` --> `isFixed = false` (bar hidden)
- Scrolled to projects section: sentinel enters viewport --> `isIntersecting=true` --> `isFixed = false` (inline bar visible naturally)
- Scrolled past sentinel (past header): `isIntersecting=false` and `top < 140` --> `isFixed = true` (fixed bar appears)
- Scroll back up: sentinel re-enters viewport --> `isIntersecting=true` --> `isFixed = false` (back to inline)

No other changes needed. Single line fix.

