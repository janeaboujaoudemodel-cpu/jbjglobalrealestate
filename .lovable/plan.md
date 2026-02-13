
## Fix Properties Page Layout (Map Mode) + Area Images

### Problem A: Properties Map Mode Layout is Broken

From the screenshots, these critical issues are visible:

1. **Vertical nav shows on hero section** -- `PropertiesVerticalNav` renders on the left even before scrolling, overlapping the hero and header
2. **Header overlap** -- Both the GlobalHeader AND the vertical nav show simultaneously, with the vertical nav covering the header logo area
3. **Filter bar positioning** -- When fixed, the filter bar starts at `left: 200px` but the main header still spans full width, creating a visual disconnect
4. **Cards are too tall in map mode** -- Each card includes full description, size info, AND Email/Call/WhatsApp CTA buttons, making them excessively vertical for a 50/50 split view
5. **Scroll conflicts** -- The page scrolls the entire document instead of just the card panel, causing sections to hide behind the sidebar
6. **Footer/DLD widget renders below map mode** -- These shouldn't appear in map mode since it's a full-viewport layout

### Problem B: 14+ Areas Still Have NULL Images

14 areas were reset to NULL but the `enrich-area-images` function hasn't successfully found replacements. Al Marjan Island and Maryam Island still use Reelly API single-building renders. The enrichment function's project-image fallback (`Step 1`) still pulls individual building renders from `projects.main_image_url` which are often the same Reelly single-building photos the user rejected.

---

### Fix Plan

#### Part 1: Fix Map Mode Layout in `PropertiesReelly.tsx`

**Changes:**

1. **Remove vertical nav from map mode section entirely** -- In map mode (`isMapMode` is true), do NOT render `PropertiesVerticalNav`. The header remains visible and provides navigation. The vertical nav is only useful in list mode when the filter bar replaces the header.

2. **Make map mode truly full-viewport** -- Remove the 200px sidebar offset. The map mode section should use `100vw` width with the filter bar spanning the full width at top.

3. **Compact cards in map mode** -- In the left card panel (50% width), use a simplified card layout:
   - Remove Email/Call/WhatsApp CTA buttons
   - Remove description text
   - Remove size info
   - Keep only: image, name, location, price, developer, handover date
   - Use `grid-cols-1` (one card per row) for the narrow panel

4. **Fix scroll containment** -- The map mode section already has `height: calc(100vh - 80px)` and the left panel has `overflow-y-auto`, but the outer page still scrolls. Add `overflow: hidden` to the map mode wrapper to prevent document-level scrolling.

5. **Hide DLD widget and footer in map mode** -- Move the `DLDMarketWidget` inside the non-map-mode section, or conditionally render it only when `!isMapMode`.

6. **Fix filter bar in map mode** -- When `isFilterFixed` and `isMapMode`, the filter bar should span from `left: 0` (no sidebar offset).

#### Part 2: Fix Area Images via Updated `enrich-area-images`

**Changes to `supabase/functions/enrich-area-images/index.ts`:**

1. **Block project render URLs in Step 1** -- Add `isGoodAreaImage()` check to project images too. If `main_image_url` contains `reelly-backend` or `api.reelly.io`, skip it.

2. **Fix Al Marjan Island and Maryam Island** -- Their current images (`api.reelly.io/vault/...`) are single-building renders. Add `api.reelly.io` to the bad URL patterns in `isGoodAreaImage()`.

3. **Improve search queries** -- Change from generic "aerial view" to more specific searches:
   - For well-known areas (Al Marjan Island, Palm Jumeirah, etc.): search `"{area name}" aerial view drone` 
   - Include `site:visitdubai.com OR site:bayut.com` for higher quality editorial photos

4. **Run the function** -- After deploying, trigger it to process all 16 areas (14 NULL + Al Marjan Island + Maryam Island).

#### Part 3: Fix Card Component for Map Mode

**Changes to `ReellyProjectCard.tsx`:**

Add an optional `compact` prop that hides the CTA buttons, description, and size info. The map mode in `PropertiesReelly.tsx` will pass `compact={true}`.

---

### Files to Change

| File | Change |
|------|--------|
| `src/pages/PropertiesReelly.tsx` | Remove vertical nav from map mode; fix filter bar positioning; hide DLD widget in map mode; use compact cards; fix scroll containment |
| `src/components/ReellyProjectCard.tsx` | Add `compact` prop to hide CTA buttons, description, size info |
| `supabase/functions/enrich-area-images/index.ts` | Add `api.reelly.io` to bad URL patterns; add `isGoodAreaImage` check to project image step; improve search queries |

### Execution Order

1. Fix `ReellyProjectCard.tsx` -- add compact mode
2. Fix `PropertiesReelly.tsx` -- map mode layout overhaul
3. Update and deploy `enrich-area-images` -- fix bad URL patterns
4. Trigger `enrich-area-images` to process 16 areas
5. Verify via screenshots
