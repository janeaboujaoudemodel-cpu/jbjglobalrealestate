

## Plan: FilterShortcutBar & HorizontalUtilityBar UI Refinements

### What's Being Fixed

The user wants to clean up the 2-row filter bar and the horizontal header to remove duplication, improve visual polish, and ensure consistent behavior across all property-related pages.

---

### 1. Row 1 Visual Improvements (FilterShortcutBar)

**Heart icon** — Change from `text-red-500 fill-red-500` to `text-black` (Saved button, line 848).

**sqft/sqm toggle** — Wrap in a bordered block with a divider between ft² and m², making it look like a single segmented control (similar to how it looks in the horizontal header but more prominent).

**Tooltips on hover** — Add `title` attributes or wrap with `Tooltip` for:
- Language: "Select or change your language"
- Currency: "Select your currency"
- Filter: "Open advanced filters"
- Mode: "Switch your viewing mode"
- Map: "Toggle map view"
- Saved: "View saved filters"
- Search: "Search area, project, keyword"

**Files:** `src/components/filters/FilterShortcutBar.tsx`

---

### 2. Remove Duplicates Between FilterShortcutBar Row 1 & HorizontalUtilityBar

Currently duplicated in both:
- **Filter button** (SlidersHorizontal) — exists in both Row 1 and horizontal header
- **Favorites/Heart** — horizontal header has a heart link, Row 1 has "Saved filters" heart

These are NOT exact duplicates (one is favorites, one is saved filters), so both stay. The sort options (Newest, Low-High, etc.), Map, Currency, and Mode in Row 1 are NOT in the horizontal header, so no removal needed.

**Action:** No items need removing — they serve different purposes. The user's main concern is that when the FilterShortcutBar is NOT visible (not scrolled to it), the horizontal header should show the key controls.

---

### 3. Horizontal Header — Show Filter Controls When FilterShortcutBar Is Hidden

When the sticky filter bar is NOT showing (user hasn't scrolled past hero), the horizontal header should display inline: Search, AED currency, Map, Mode Investor, Filter + "Filter" text, Saved, Trending.

**Changes to `HorizontalUtilityBar.tsx`:**
- The filter/advanced button already exists — add the word "Filter" next to the icon (currently icon-only)
- Currency already shows via `CurrencySwitcher` — keep as-is
- Add "Trending" link/button next to the filter controls
- These controls are already present, just need the "Filter" label added

**Files:** `src/components/navigation/HorizontalUtilityBar.tsx`

---

### 4. Mode Investor Colors — Match Row 1 Highlight Style

The `ConnectedModeButton` in FilterShortcutBar Row 1 uses `bg-gold/20 text-gold` for the active mode. The user wants the same color highlighting used in Row 1's other buttons (green/purple/blue section colors).

**Changes:** Update `ConnectedModeButton` active state to use role-aware colors:
- Investor → emerald highlight
- Broker → blue highlight  
- Both → purple highlight

Match the dropdown popover styling to use the same color scheme.

**Files:** `src/components/filters/FilterShortcutBar.tsx` (ConnectedModeButton, lines 906-948)

---

### 5. Global Application

All pages using `FilterShortcutBar` already import the same component, so changes apply globally:
- `Properties.tsx`
- `PropertiesReelly.tsx`
- `AreaGuides.tsx`
- `AreaDetail.tsx`
- `DeveloperDetail.tsx` (if applicable)
- `ProjectDetailLayout.tsx`

No per-page changes needed — the component is shared.

---

### Summary

| Change | File |
|--------|------|
| Heart icon to black, sqft/sqm block styling, tooltips | `FilterShortcutBar.tsx` |
| Mode button color-coded by role | `FilterShortcutBar.tsx` |
| Add "Filter" label to horizontal header filter button | `HorizontalUtilityBar.tsx` |

