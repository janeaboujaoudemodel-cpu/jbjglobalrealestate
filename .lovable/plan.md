

## Fix: Two-Phase Filter Bar — Inline First, Then Fixed on Scroll

### Current Problem

The bar is completely hidden on page load and only appears as a fixed bar when scrolled. It skips the inline phase entirely. The user wants:

1. Hero section visible: no bar
2. Scroll to "Projects in JVC": bar visible **inline** in its natural position within the section
3. Scroll past the bar: bar becomes **fixed under the header**

### Changes (single file: `src/components/area-detail/AreaProjectsGrid.tsx`)

**A) Always render the filter bar inline in the projects section**

The filter bar content will always be rendered in its natural document flow position, right after the "Projects in [Area]" heading. This means when the user scrolls to the projects section, they see the bar naturally.

**B) Use the sentinel (placeholderRef) at the bar's position to detect when it leaves the viewport**

Move `placeholderRef` to sit right at/above the inline bar. When the sentinel scrolls out of view (past the header), `isFixed` becomes true.

**C) When `isFixed` is true, ALSO render the portal copy**

The inline bar stays in the DOM (it's part of the section). The fixed portal copy appears on top. This gives seamless transition — the bar is always visible once you reach the projects section, and it pins under the header when you scroll past.

### Technical Details

```text
Layout structure:
  <h2>Projects in JVC</h2>
  <div ref={placeholderRef} />     <!-- sentinel for observer -->
  <div className="py-3 ...">      <!-- inline bar, always rendered -->
    {filterBarContent}
  </div>
  {isFixed && createPortal(        <!-- fixed copy, only when scrolled past -->
    <div className="fixed top-24 ...">
      {filterBarContent}
    </div>,
    document.body
  )}
  <div className="grid ...">      <!-- project cards -->
```

**Key behavior:**
- The `placeholderRef` sentinel sits just above the inline bar
- IntersectionObserver rootMargin stays at `-140px` (accounts for header height)
- When sentinel leaves viewport: `isFixed = true`, portal renders fixed bar under header
- When user scrolls back up: `isFixed = false`, portal disappears, inline bar is naturally visible
- No height measurement needed since inline bar is always in the DOM

**No other files need changes.**

