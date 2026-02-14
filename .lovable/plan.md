

## Fix Mobile Layout, Popups, and Filter Bar

### Problems Identified (from screenshots)

1. **Popups showing simultaneously**: The `PropertyRecommendationPopup` does NOT use the `PopupCoordinator` system -- it manages visibility independently. This means it can appear at the same time as the Cookies banner, PageNavigation buttons, and chat widget, all stacking on mobile.

2. **Filter bar broken on mobile**: The fixed filter bar in `PropertiesReelly.tsx` uses `style={{ left: isMapMode ? '0' : '200px' }}` which reserves 200px for the vertical sidebar. On mobile, there is no sidebar, so the filter bar starts 200px from the left edge, causing it to be cut off. The sort pills in Row 1 of `FilterShortcutBar` do not wrap or scroll on mobile, causing text to overlap ("Newest-High-LowZ").

3. **Map view broken on mobile**: The split-screen map layout uses fixed `w-1/2` for both the card list and map panels. On a phone (~390px wide), each half is only ~195px, making cards unreadable and the map unusable.

4. **PageNavigation buttons overlapping content**: The floating navigation buttons (scroll up/down, back) at `z-[11000]` overlap with popups and content on mobile.

5. **Project detail page filter bar stacking**: On project detail pages, the sticky filter bar rows (Row 1 + Row 2 + project sub-nav) all stack at the top, consuming too much vertical space on mobile.

---

### Fix 1: Integrate PropertyRecommendationPopup into PopupCoordinator

**File**: `src/components/PropertyRecommendationPopup.tsx`

- Replace independent `isOpen` state with `usePopupVisibility('app-download-popup')` (reuse existing priority slot, or better, register a new one)
- Add a new popup ID `'property-recommendation'` to the coordinator
- Use `requestToShow` when recommendations are ready, `dismiss` on close
- Use `isVisible` to control rendering instead of local `isOpen`

**File**: `src/contexts/PopupCoordinatorContext.tsx`

- Add `'property-recommendation'` to the `PopupId` type
- Add its priority entry (priority 6, after cookies consent)

This ensures only ONE popup shows at a time.

---

### Fix 2: Fix Filter Bar Left Offset on Mobile

**File**: `src/pages/PropertiesReelly.tsx` (line ~294)

Change the fixed filter bar's `left` style to account for mobile:
- Current: `style={{ left: isMapMode ? '0' : '200px', right: '0' }}`
- Fix: Use `left: 0` on mobile (no sidebar), `left: 200px` only on `lg:` screens
- Implementation: Replace inline `style` with responsive Tailwind classes: `left-0 lg:left-[200px]` (when not in map mode)

---

### Fix 3: Make FilterShortcutBar Row 1 Scrollable on Mobile

**File**: `src/components/filters/FilterShortcutBar.tsx` (line ~259-317)

Row 1 is a connected toolbar that doesn't scroll. On mobile, the sort pill labels ("Newest", "Low-High", "High-Low", "A-Z") all compress and overlap.

- Add `overflow-x-auto scrollbar-hide` to the Row 1 container
- Ensure all inner buttons have `flex-shrink-0` so they don't compress

---

### Fix 4: Make Map View Stack Vertically on Mobile

**File**: `src/pages/PropertiesReelly.tsx` (lines ~328-377)

Change the 50/50 split layout to stack vertically on mobile:
- Current: `<div className="w-1/2 ...">` for both panels
- Fix: Use `w-full md:w-1/2` for both panels and `flex-col md:flex-row` for the parent
- On mobile, show map at a fixed height (e.g., 300px) above the scrollable card list
- Or hide the map entirely on mobile and show a "View on Map" toggle

---

### Fix 5: Reduce PageNavigation Button Overlap on Mobile

**File**: `src/components/PageNavigation.tsx`

- Reduce button size on mobile: `h-10 w-10 sm:h-12 sm:w-12`
- Lower z-index from `z-[11000]` to `z-[9990]` so it sits below popups and modals but above regular content
- Move to `bottom-20` on mobile to avoid overlap with the cookies banner area

---

### Fix 6: Reduce Sticky Header Height on Mobile (Project Detail)

**File**: `src/components/project-detail/ProjectDetailLayout.tsx`

- Add `hidden sm:block` to Row 1 (FilterShortcutBar) when sticky on mobile -- users can access filters from the main properties page
- Or make the sub-navigation tabs horizontally scrollable with smaller text on mobile

---

### Summary of Files to Edit

| File | Change |
|------|--------|
| `src/contexts/PopupCoordinatorContext.tsx` | Add `property-recommendation` popup ID |
| `src/components/PropertyRecommendationPopup.tsx` | Integrate with PopupCoordinator |
| `src/pages/PropertiesReelly.tsx` | Fix filter bar left offset; fix map split-screen for mobile |
| `src/components/filters/FilterShortcutBar.tsx` | Make Row 1 scrollable on mobile |
| `src/components/PageNavigation.tsx` | Reduce size and z-index on mobile |
| `src/components/project-detail/ProjectDetailLayout.tsx` | Reduce sticky header on mobile |

