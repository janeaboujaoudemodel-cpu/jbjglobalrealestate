

## Split-Screen Map View for Properties Page

### Overview
When the user clicks the "Map" button in the FilterShortcutBar, the Properties page will switch to a split-screen layout: project listing cards on the LEFT, interactive map on the RIGHT. The main header navigation will transform into a vertical sidebar on the left side when the filter bar is fixed during scroll, and revert back to horizontal when scrolling to the "Ready to Get Started" section.

### Layout (Reference: Reelly screenshots)

```text
+------------------------------------------------------------------+
| [FilterShortcutBar - horizontal, full width]                     |
+------------------------------------------------------------------+
| [Logo]        |                                          |       |
| Off-plan      |  Project Cards (2-col grid, scrollable)  |  MAP  |
| Market        |  - Card 1          - Card 2              |       |
| Events        |  - Card 3          - Card 4              |  All  |
| My Deals      |  ...                                     | proj  |
| University    |                                          | pins  |
| Settings      |                                          |       |
|               |                                          |       |
| [Contact]     |                                          |       |
| [JBJ Logo]    |                                          |       |
+------------------------------------------------------------------+
```

### Detailed Changes

#### 1. New Component: `PropertiesMapView.tsx`
Create `src/components/maps/PropertiesMapView.tsx` -- a Leaflet map that:
- Displays all `finalProjects` as markers using the existing approved map card pattern (DynamicTileLayer, MapViewToggle, MapNavigationControls)
- Shows project popups on hover with: cover image, developer logo, project name, developer name, price, handover date (same pattern as AreaMapSection popups)
- Wrapped in `MapErrorBoundary`
- Satellite default view with 3-way toggle
- Auto-fits bounds to visible project markers
- Highlights the marker when hovering a card on the left panel

#### 2. New Component: `PropertiesVerticalNav.tsx`
Create `src/components/navigation/PropertiesVerticalNav.tsx` -- a vertical sidebar that:
- Shows the JBJ logo at top
- Lists main navigation items vertically: Properties (active), Market Intelligence, Guides, Services, About, Contact
- Styled with champagne/gold theme matching the filter bar
- Shows "Contact Support" at the bottom and the JBJ logo/branding
- Only visible when `isMapMode && isFilterFixed`

#### 3. Update `Properties.tsx` -- Map Mode State + Split Layout
- Add `isMapMode` state (boolean), toggled by the Map button in FilterShortcutBar
- When `isMapMode === true`:
  - The results section renders as a flex row: LEFT = scrollable card list (50-60% width, 2-col grid), RIGHT = map (40-50% width, sticky/fixed height)
  - The project cards list becomes independently scrollable
  - When `isFilterFixed`, show the vertical nav sidebar on the left and the FilterShortcutBar horizontally at the top
  - When user scrolls to "Ready to Get Started" section (detected via IntersectionObserver on existing sentinel), exit the split layout: hide vertical nav, restore horizontal header

#### 4. Update `FilterShortcutBar.tsx` -- Map Button Callback
- Change the Map button from navigating to `/properties?view=map` to calling a callback prop
- Add optional `onMapToggle?: (active: boolean) => void` and `isMapMode?: boolean` props
- When `isMapMode` is true, style the Map button as active (gold highlight)

#### 5. Interaction: Card-Map Sync
- Hovering a project card highlights the corresponding marker on the map
- Hovering/clicking a marker on the map scrolls the card list to show the corresponding project card
- Share a `hoveredProjectId` state between the card list and map

### Files to Create
| File | Purpose |
|------|---------|
| `src/components/maps/PropertiesMapView.tsx` | Full map component with project markers, popups, and sync |
| `src/components/navigation/PropertiesVerticalNav.tsx` | Vertical sidebar navigation for map mode |

### Files to Edit
| File | Changes |
|------|---------|
| `src/pages/Properties.tsx` | Add `isMapMode` state, split-screen layout logic, vertical nav integration, card-map hover sync |
| `src/components/filters/FilterShortcutBar.tsx` | Add `onMapToggle` and `isMapMode` props, change Map button to use callback |

### Behavior Summary
1. User clicks "Map" button in filter bar -> page splits into cards (left) + map (right)
2. User scrolls down -> filter bar becomes fixed at top, GlobalHeader hides (existing behavior), vertical nav appears on left
3. User scrolls to "Ready to Get Started" -> vertical nav disappears, GlobalHeader returns (existing behavior)
4. User clicks "Map" again or clicks "List" -> returns to normal full-width card grid

