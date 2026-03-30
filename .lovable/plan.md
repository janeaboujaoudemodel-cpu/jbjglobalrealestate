

# Fix Map Page Floating Card & State Bugs

## Problem

The selected project detail card (lines 381-434) uses `fixed` positioning (`fixed bottom-4 left-4`), making it float relative to the **viewport** — not the map container. Since the page lives inside MainLayout which can scroll, the card persists visually over footer/contact sections when scrolling. Additionally, `selectedProject` state is never cleared on view mode changes, filter changes, or when the source marker becomes invalid.

## Changes — `src/pages/PropertyMap.tsx` only

### 1. Add state cleanup effects

Add three `useEffect` hooks after the existing filter listener (after line 129):

- **Clear on view mode change**: `useEffect(() => { setSelectedProject(null); }, [viewMode]);`
- **Clear on filter/sort change**: `useEffect(() => { setSelectedProject(null); }, [filters, sortMode, hideSold]);`
- **Clear when selected project no longer in filtered results**: `useEffect(() => { if (selectedProject && !filteredProjects.some(p => p.id === selectedProject.id)) setSelectedProject(null); }, [selectedProject, filteredProjects]);`

### 2. Add IntersectionObserver to auto-close card when map leaves viewport

Add a `useRef` on the map container div (line 260) and an `IntersectionObserver` effect that sets `selectedProject(null)` when the map container is less than 15% visible. This handles the scroll-past-map scenario.

```tsx
const mapContainerRef = useRef<HTMLDivElement>(null);

useEffect(() => {
  const el = mapContainerRef.current;
  if (!el) return;
  const io = new IntersectionObserver(
    ([entry]) => { if (!entry.isIntersecting) setSelectedProject(null); },
    { threshold: 0.15 }
  );
  io.observe(el);
  return () => io.disconnect();
}, []);
```

Apply `ref={mapContainerRef}` to the flex-1 map container div (line 260).

### 3. Change selected card from `fixed` to `absolute` within map container

Move the selected project card (lines 381-434) **inside** the map container div (the `flex-1 relative overflow-hidden` div at line 260). Change positioning from `fixed bottom-4 left-4` to `absolute bottom-4 left-4`. This ensures the card is bounded by the map container and cannot float over other page sections.

The card's z-index `z-[1000]` stays — it only needs to beat the map's internal elements, and since the parent has `overflow-hidden`, it can't leak out.

### 4. Add click-outside-to-close on map container

On the map container div (line 260), add an `onClick` handler that closes the card when clicking the container background (not a child):

```tsx
onClick={(e) => { if (e.target === e.currentTarget) setSelectedProject(null); }}
```

## Summary of changes

| What | How |
|------|-----|
| Card floats over footer | Move card inside map container, change `fixed` → `absolute` |
| Card survives view/filter changes | Add cleanup effects on `viewMode`, `filters`, `sortMode`, `hideSold` |
| Card stays when marker filtered out | Add effect checking `selectedProject` against `filteredProjects` |
| Card visible when scrolled past map | IntersectionObserver closes card when map <15% visible |
| Click outside doesn't close | Add click-on-background handler |

### File modified
- `src/pages/PropertyMap.tsx`

