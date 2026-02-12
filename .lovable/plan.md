
## Add FilterShortcutBar to Developer, Area, and Project Pages

### Problem
The Reelly-style filter shortcut pills (Price, Payments, Handover, Property Type, Bedrooms, Status, Reset All, Save Filter) were created but only added to the Properties listing page and the Homepage hero. They are missing from:
- Developer Detail page (`/developer/binghatti`)
- Area Detail page (AreaStickySearchBar)
- Project Detail page

The user wants these pill-shaped filter shortcuts visible on every page that has a search/filter header, using the same JBJ champagne/gold styling.

### What Will Change

#### 1. Developer Detail Page -- Add FilterShortcutBar
**File: `src/pages/DeveloperDetail.tsx`**

- Import `FilterShortcutBar` and its state/defaults
- Add `shortcutFilters` state with `useState(defaultShortcutFilters)`
- Render the `FilterShortcutBar` (variant="light") inside the existing champagne filter card, directly below the `ProjectFilters` component -- in BOTH the inline filter bar AND the fixed portal filter bar
- This gives the developer page the same pill row (Price, Payments, Handover, Property Type, Bedrooms, Status) beneath the existing search/filter dropdowns

#### 2. Area Detail Page -- Add FilterShortcutBar to Sticky Search Bar
**File: `src/components/area-detail/AreaStickySearchBar.tsx`**

- Import `FilterShortcutBar` and its state/defaults
- Add `shortcutFilters` state
- Render the `FilterShortcutBar` (variant="light") below the search input, both in the normal and sticky states
- This adds the pill row beneath the area search bar

#### 3. Area Projects Grid -- Add FilterShortcutBar
**File: `src/components/area-detail/AreaProjectsGrid.tsx`**

- If this component has its own filter bar (separate from AreaStickySearchBar), add the `FilterShortcutBar` there as well
- Import and render below existing filter controls in both inline and fixed-portal states

#### 4. Properties Page -- Ensure Visibility
**File: `src/pages/Properties.tsx`**

- The FilterShortcutBar is already imported and rendered at line 548. Verify it is visually prominent and not hidden by overflow or z-index issues. Ensure it renders correctly in both the inline champagne card section and the fixed portal bar when scrolling.

### Technical Details

- `FilterShortcutBar` already supports `variant="light"` which uses champagne gradient pills with gold borders -- this matches the JBJ UI standard
- Each page manages its own `shortcutFilters` state independently via `useState(defaultShortcutFilters)`
- The pill buttons and their popovers (Price with tabs, Payments with slider, Handover with quarter/year, Property Type multi-select, Bedrooms multi-select, Status with color dots) are all already built in `FilterShortcutBar.tsx`
- No new components or backend changes needed -- just importing and rendering the existing component in more places

### Files Summary

| File | Action |
|------|--------|
| `src/pages/DeveloperDetail.tsx` | Import and render FilterShortcutBar in inline + fixed portal filter bars |
| `src/components/area-detail/AreaStickySearchBar.tsx` | Import and render FilterShortcutBar below search input |
| `src/components/area-detail/AreaProjectsGrid.tsx` | Import and render FilterShortcutBar in inline + fixed portal filter bars |
| `src/pages/Properties.tsx` | Ensure FilterShortcutBar is visible in both inline and fixed-portal states |
