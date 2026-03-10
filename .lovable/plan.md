

## Plan: Map Popup Fixes, Nav Deduplication, and Scrollbar Improvements

### Issues Identified

1. **Map popup images cropped with white borders** — All map popups across 4 files use `rounded` on images and have padding/margins from Leaflet's default `.leaflet-popup-content` styling. The images need negative margins to go edge-to-edge and `rounded-t` only (not full `rounded`).

2. **Missing bedrooms/sqft data in popups** — Popups don't show bedroom count or size info even when available in the data.

3. **Popup hidden under navigation arrows** — Leaflet's zoom controls overlap popups. Need to adjust `popupAnchor` or add CSS z-index fixes.

4. **Duplicate "Buy Properties" + "Properties" section** — The highlighted hubs area has "Buy Properties" pointing to `/properties`, and the PROPERTIES accordion section has "Off-plan" also pointing to `/properties`. User wants one merged hub.

5. **Scrollbar doesn't extend full sidebar height** — The scrollable `<nav>` only covers the accordion section (Properties to My Account). The highlighted hubs above it and utility bar below are outside the scroll area. User wants scrollbar from top items down to My Account.

---

### Changes

#### 1. Global map popup CSS fix — `src/index.css`
Add global Leaflet popup overrides to remove internal padding on the content wrapper, making images truly edge-to-edge:
```css
.leaflet-popup-content { margin: 0 !important; padding: 0 !important; }
.leaflet-popup-content-wrapper { padding: 0 !important; border-radius: 12px !important; overflow: hidden; }
```

#### 2. Fix popup images in all 4 map files
- **`PropertiesMapView.tsx`** (line 173): Change image from `rounded mb-2` to negative margins (`-mx-[1px] -mt-[1px]`) + `rounded-t-xl` + remove `rounded`. Add bedroom/size data if available from `UnifiedProject`.
- **`AreaMapSection.tsx`** (line 206): Same edge-to-edge image fix. Remove `rounded mb-2`, use `rounded-t-xl` with negative margins.
- **`PropertyMap.tsx`** (lines 559-567): Already uses negative margins (`-mx-3 -mt-3`) — verify it works with the global CSS. Keep as-is or adjust.
- **`ProjectNearbyPropertiesMap.tsx`**: Popups are text-only, no image fix needed.
- **`DeveloperProjectsMap.tsx`** (line 88): Uses inline HTML — already has `margin: -12px -12px 8px -12px`. Adjust to cover full width.

#### 3. Add bedrooms & size to popup content
In `PropertiesMapView.tsx`, after price, add bedroom count and size range if available on the `UnifiedProject` type. Same for `AreaMapSection.tsx` popup.

#### 4. Merge "Buy Properties" into PROPERTIES section — `GlobalVerticalNav.tsx`
- Remove the `{ label: "Buy Properties", ... highlight: true }` entry from highlighted hubs (line 56).
- Rename "Off-plan" in the PROPERTIES section to "Buy / Off-Plan" and attach the `megaMenu: 'buy'` to it, so the buy mega menu is accessible from the PROPERTIES accordion.
- Keep AI Tools Hub, Listing Portal, Careers & Join, and Resale Properties as highlighted hubs.

#### 5. Extend scrollbar to cover full nav — `GlobalVerticalNav.tsx`
- Move the highlighted hubs ("My Shortcuts", AI Tools Hub, etc.) **inside** the scrollable `<nav>` element so the scrollbar encompasses everything from the top items down to My Account.
- Keep Logo/minimize at top and Utility Bar + Support pinned at bottom (outside scroll).

#### 6. Popup z-index above nav controls
Add CSS to ensure popups render above map controls: `.leaflet-popup { z-index: 1000 !important; }`.

---

### Files Modified
- `src/index.css` — Global Leaflet popup CSS overrides
- `src/components/maps/PropertiesMapView.tsx` — Edge-to-edge images, add bedrooms/size
- `src/components/area-detail/AreaMapSection.tsx` — Edge-to-edge images
- `src/components/developer/DeveloperProjectsMap.tsx` — Verify/fix inline HTML margins
- `src/pages/PropertyMap.tsx` — Verify popup image styling
- `src/components/navigation/GlobalVerticalNav.tsx` — Merge Buy Properties into PROPERTIES section, extend scrollbar

