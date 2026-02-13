

## Add Page-Level FilterShortcutBar to Area Detail Page

### Current State
The Area Detail page (`/area/:slug`) currently has a `FilterShortcutBar` embedded **inside** the `AreaProjectsGrid` child component. This means:
- It only appears within the "Projects in [Area]" section, not at the top of the page
- It does not match the unified pattern used on Properties, Areas index, and Developer detail pages where the bar sits at the **page level**

### What Changes

**1. Add FilterShortcutBar state and imports to `AreaDetail.tsx`**
- Import `FilterShortcutBar`, `ShortcutFilterState`, `defaultShortcutFilters`
- Import `applyShortcutFilters`
- Add `shortcutFilters` state at the page level
- Add a sentinel ref for IntersectionObserver-based sticky behavior

**2. Render the FilterShortcutBar at page level in `AreaDetail.tsx`**
- Place it between the Hero/About sections and the Projects grid (matching the DeveloperDetail pattern)
- Include both inline and fixed-portal versions (inline in flow, fixed when scrolled past)
- Use the same champagne gradient styling as other pages
- Include a search input slot for searching projects within the area

**3. Pass filters down to `AreaProjectsGrid`**
- Add `shortcutFilters` and `searchQuery` as props to `AreaProjectsGrid`
- Remove the duplicate FilterShortcutBar and filter state from inside `AreaProjectsGrid`
- Keep the grid rendering and project fetching logic within `AreaProjectsGrid`

**4. Clean up `AreaProjectsGrid.tsx`**
- Remove the local `shortcutFilters` state, search input, and inline/fixed FilterShortcutBar rendering
- Remove the IntersectionObserver and `filter-bar-fixed` body class logic (moved to parent)
- Accept `shortcutFilters` and `searchQuery` as props instead
- Keep only the filtered grid rendering logic

### Technical Details

```text
Before:
  AreaDetail.tsx
    -> AreaHeroSection
    -> AreaAboutSection
    -> AreaProjectsGrid (contains FilterShortcutBar + filters + sticky logic)
    -> AreaDevelopersBar
    -> ...

After:
  AreaDetail.tsx
    -> AreaHeroSection
    -> AreaAboutSection
    -> [Sentinel div]
    -> FilterShortcutBar (inline, page-level)
    -> FilterShortcutBar (fixed portal, when scrolled)
    -> AreaProjectsGrid (receives filters as props, renders grid only)
    -> AreaDevelopersBar
    -> ...
```

### Files Modified
- `src/pages/AreaDetail.tsx` -- Add FilterShortcutBar at page level with sticky behavior
- `src/components/area-detail/AreaProjectsGrid.tsx` -- Remove embedded FilterShortcutBar, accept filters as props

