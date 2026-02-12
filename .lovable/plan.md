

## Root Cause Analysis: Why Nothing Works

All previous changes (map toggle, vertical sidebar, FilterShortcutBar, project count) were applied to `src/pages/Properties.tsx`, but the route `/properties` actually renders `src/pages/PropertiesReelly.tsx` (confirmed in `App.tsx` line 406). The `Properties.tsx` file is **dead code** -- it is never used.

`PropertiesReelly.tsx` is a completely different component that:
- Fetches projects via the `reelly-projects` edge function (not the database)
- Has NO map mode
- Has NO vertical sidebar navigation
- Has NO FilterShortcutBar component
- Has its own separate filter system

This means every "completed" task was applied to the wrong file.

---

### What Must Be Done

All features must be added to `PropertiesReelly.tsx` (the file that actually renders at `/properties`).

#### 1. Add Map/List Split-Screen Toggle to PropertiesReelly

- Add `isMapMode` state, initialized from `?view=map` URL param
- Add a Map/List toggle button in the filter bar (line ~438, alongside sort buttons)
- When Map mode is active: render a split-screen layout (55% scrollable card list left, 45% Leaflet map right) -- same pattern as was built in Properties.tsx
- The button label switches between "Map" and "List"
- Import `PropertiesMapView` and `PropertiesVerticalNav`

#### 2. Add Vertical Sidebar Navigation

- When in map mode (and on desktop), show `PropertiesVerticalNav` on the left side of the split layout
- This gives the JBJ logo + nav items (Off-plan, Market, Guides, Services, About, Contact)

#### 3. Fix Project Count Display

- The count already shows at line 486: `Showing X of Y properties`
- Verify this works after the edge function returns data (it should -- the 9.8s load time in the network request suggests it IS loading, just slowly)

#### 4. Add FilterShortcutBar

- Import and render `FilterShortcutBar` between the filter section and results section
- Pass `isMapMode` and `onMapToggle` props to wire the Map button
- This adds the Row 1 (Map, Saved, Currency) and Row 2 (Price, Bedrooms, etc.) shortcut pills

#### 5. Header Replacement on Scroll

- Add `isFilterFixed` state with IntersectionObserver on a sentinel element
- When filter becomes fixed, add `filter-bar-fixed` class to body (triggers GlobalHeader hide)

---

### Files to Modify

| File | Change |
|------|--------|
| `src/pages/PropertiesReelly.tsx` | Add map mode state, split-screen layout, vertical nav, FilterShortcutBar, scroll-based header replacement, Map/List toggle |

### Files NOT Changed (confirmed working already)
- `PropertiesVerticalNav.tsx` -- component exists and works
- `PropertiesMapView.tsx` -- component exists and works
- `FilterShortcutBar.tsx` -- component exists with `isMapMode`/`onMapToggle` props already built

### What the User Will See After This Fix
- Properties page loads projects (via reelly-projects edge function)
- Project count displays correctly ("Showing X of Y properties")
- Clicking "Map" splits the page: cards on left, interactive Leaflet map on right
- Clicking "List" returns to full grid view
- Vertical sidebar with JBJ logo appears on desktop in map mode
- FilterShortcutBar appears with all filter pills
- GlobalHeader hides when filter bar becomes fixed on scroll

