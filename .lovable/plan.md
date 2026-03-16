

## Plan: Fix Multiple UX Issues Across Properties, Areas, Developers Pages

### Issues Identified (7 items)

---

### 1. ContinueSearching Marquee: Left-to-Right Direction + Duplicate Prevention

**Problem**: The marquee scrolls right-to-left. User wants left-to-right. Also, duplicates still appear because `trackView` in `useRecentSearches.ts` deduplicates by `id+type` OR `slug+type`, but the `WalkingStrip` only deduplicates by `id+type` — if the same project has different IDs (e.g. from different data sources) but the same slug, it shows twice.

**Fix** (`src/components/ContinueSearching.tsx`):
- In `WalkingStrip`, change the animation direction: start `pos` at `singleSetWidth` and decrement by `speed` each tick (move right). Reset when `pos <= 0`.
- In `WalkingStrip`, deduplicate by `type+slug` (not `type+id`) to match the hook's dedup logic.

**Fix** (`src/hooks/useRecentSearches.ts`):
- In `trackView`, also deduplicate by `slug+type` consistently.

---

### 2. Properties Page Shows Only 59 Results for "Dubai" (Should Show All)

**Problem**: Line 172 in `PropertiesReelly.tsx` filters out projects without `cover_image_url`, reducing 2400+ to ~59 when combined with text search. The `applyShortcutFilters` search query filter (line 113 in `applyShortcutFilters.ts`) only matches `name`, `developer_name`, and `area_name` — not `emirate`. So searching "Dubai" misses projects that have `emirate: "Dubai"` but don't have "Dubai" in name/developer/area.

**Fix** (`src/utils/applyShortcutFilters.ts`):
- Add `emirate` field to the search query matching (line ~113): also check `p.emirate` or `p.location_emirate`.

**Fix** (`src/pages/PropertiesReelly.tsx`):
- Remove the `cover_image_url` filter from `mergedProjects` — show all projects regardless of image.

---

### 3. Sort By Visible Immediately on Page Load

**Problem**: No sort control is visible on the properties grid section. The GlobalFilterBar has sort but it's in the fixed header.

**Fix** (`src/pages/PropertiesReelly.tsx`):
- Add a sort dropdown inline in the results count row (line ~349) so it's immediately visible when the grid loads.

---

### 4. "No Properties Found" Layout Broken (DLD Widget Padding)

**Problem**: When no results are found, the DLD Market Widget section (lines 469-476) has broken padding — it touches edges and isn't centered. The widget wrapper uses `showStickyNav` conditional padding but doesn't apply consistent container spacing.

**Fix** (`src/pages/PropertiesReelly.tsx`):
- Wrap the DLD widget section in proper `px-4 sm:px-6 lg:px-8 max-w-[1600px] mx-auto` container padding, matching the grid section above.
- Add top padding/margin to separate it from the "No Properties Found" state.

---

### 5. Sidebar: Merge "TOOLS" and "AI TOOLS" into One Section

**Problem**: `SECTION_KEYS` (line 568) has both `"TOOLS"` and `"AI TOOLS"`. NAV_ITEMS assigns items to separate sections.

**Fix** (`src/components/navigation/GlobalVerticalNav.tsx`):
- Remove `"AI TOOLS"` from `SECTION_KEYS`.
- Change all items with `section: "AI TOOLS"` to `section: "TOOLS"`.
- Remove `"AI TOOLS"` from `SECTION_ICONS`.

---

### 6. Divider Between Hero and ContinueSearching

**Fix** (`src/pages/PropertiesReelly.tsx`):
- Add a gold gradient divider (`h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent`) between the hero section and the ContinueSearching component.

---

### 7. Areas Page: Separate Emirates Section from Areas

**Problem**: The AreaGuides page mixes Emirates and Areas in one grid. User wants a distinct Emirates section.

**Fix** (`src/pages/AreaGuides.tsx`):
- Add an "Emirates" toggle/tab section above the areas grid that groups areas by emirate, with clickable emirate cards that filter the grid below.
- The existing emirate badge buttons in the hero already do this partially — make the grid section show areas grouped by emirate headers when no filter is active.

---

### Files to Edit
1. `src/components/ContinueSearching.tsx` — marquee direction + dedup by slug
2. `src/hooks/useRecentSearches.ts` — strengthen dedup in trackView
3. `src/utils/applyShortcutFilters.ts` — add emirate to search query match
4. `src/pages/PropertiesReelly.tsx` — remove cover_image filter, add sort dropdown, fix DLD padding, add divider
5. `src/components/navigation/GlobalVerticalNav.tsx` — merge TOOLS + AI TOOLS
6. `src/pages/AreaGuides.tsx` — group areas by emirate with section headers

