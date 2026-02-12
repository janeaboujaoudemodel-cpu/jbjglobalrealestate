

## Apply Two-Phase Scroll-to-Fix Filter Logic to Properties and Developers Pages

### Goal
Both the Properties page and the Developers page currently show their filter bars using CSS `sticky`, which means they are visible immediately after the hero section ends. The user wants the same behavior as the area detail page: filters are **hidden during the hero**, appear **inline** when the listings section is reached, and become **fixed under the header** when scrolled further.

### Current State
- **Properties** (`src/pages/Properties.tsx`, line 425): Filter section uses `sticky top-14 sm:top-16 md:top-20 lg:top-[72px]` -- always visible after hero
- **Developers** (`src/pages/Developers.tsx`, line 227): Filter section uses `sticky top-24 lg:top-20` -- always visible after hero
- **Area detail** (`AreaProjectsGrid.tsx`): Already uses IntersectionObserver + `createPortal` two-phase system (working correctly)

### Changes

#### File 1: `src/pages/Properties.tsx`

1. Add imports: `useRef, useEffect` (useRef already may be missing), `createPortal` from `react-dom`
2. Add state: `const [isFixed, setIsFixed] = useState(false)` and `const sentinelRef = useRef<HTMLDivElement>(null)`
3. Add IntersectionObserver effect (same pattern as AreaProjectsGrid):
   - Observe `sentinelRef`
   - `rootMargin: "-140px 0px 0px 0px"`
   - Callback: `setIsFixed(!entry.isIntersecting && entry.boundingClientRect.top < 140)`
4. Remove `sticky top-14 sm:top-16 md:top-20 lg:top-[72px]` from the filter `<section>` (line 425) -- make it a normal flow element
5. Place `<div ref={sentinelRef} className="h-0" />` just above the filter section
6. Keep the filter section rendered inline (always visible in its natural position within the page flow)
7. When `isFixed` is true, render a portal copy of the entire filter section fixed under the header with `fixed top-14 sm:top-16 md:top-20 lg:top-[72px] left-0 right-0 z-[9998]`

#### File 2: `src/pages/Developers.tsx`

1. Add imports: `useRef, useEffect` from react, `createPortal` from `react-dom`
2. Add state: `const [isFixed, setIsFixed] = useState(false)` and `const sentinelRef = useRef<HTMLDivElement>(null)`
3. Add same IntersectionObserver effect
4. Remove `sticky top-24 lg:top-20` from the filter `<section>` (line 227) -- make it a normal flow element
5. Place `<div ref={sentinelRef} className="h-0" />` just above the filter section
6. Keep filter section inline
7. When `isFixed` is true, render portal copy fixed under header

### Technical Details

The pattern is identical for both pages:

```text
Structure (same as AreaProjectsGrid):

  <Hero Section />

  <div ref={sentinelRef} className="h-0" />   <!-- scroll sentinel -->

  <section className="z-40 bg-... py-3 ...">  <!-- inline filter, NO sticky -->
    {filterContent}
  </section>

  {isFixed && createPortal(
    <div className="fixed top-14 sm:top-16 md:top-20 lg:top-[72px] left-0 right-0 z-[9998] bg-... py-3 ...">
      {filterContent}                          <!-- duplicate fixed copy -->
    </div>,
    document.body
  )}

  <section>                                    <!-- listings grid -->
    ...
  </section>
```

**Observer callback** (proven working from AreaProjectsGrid):
```text
([entry]) => {
  setIsFixed(!entry.isIntersecting && entry.boundingClientRect.top < 140);
}
```

This ensures:
- Hero visible (sentinel below viewport): `isFixed = false` (no fixed bar)
- Scrolled to filters section: sentinel in view, inline filters visible naturally
- Scrolled past filters: sentinel above header threshold, portal fixed copy appears
- Scroll back up: sentinel re-enters viewport, portal disappears

**For Properties**: The filter content is large (3 rows: transaction tabs, search, filter dropdowns + sort). The entire `<section>` content will be shared between inline and portal versions. Since the filter state is managed by React state in the parent component, both copies share the same state seamlessly.

**For Developers**: The filter content (search input, developer dropdown, tier filter, results count, clear button) will be similarly shared.

### Summary
- 2 files modified: `Properties.tsx` and `Developers.tsx`
- Same proven IntersectionObserver + createPortal pattern from AreaProjectsGrid
- Filters hidden during hero, inline at section, fixed on scroll past
