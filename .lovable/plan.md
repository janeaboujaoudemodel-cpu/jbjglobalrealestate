

## Fix: Filter Bar — Hidden on Load, Visible on Scroll + Developer Icons + Consistency

### What's Wrong Now

1. **Reversed visibility**: The filter bar currently shows inline on page load and becomes invisible (opacity: 0) when fixed. It should be the **opposite** — hidden on initial load, and only appear as a fixed bar when the user scrolls past the hero/section header.

2. **Missing developer icons**: The developer dropdown in AreaProjectsGrid uses plain text. It needs a Building2 icon on the trigger (matching PropertySearchBar) and developer logo icons next to each developer name in the dropdown.

3. **Inconsistency**: AreaStickySearchBar (used higher up on the area page) has only a basic search input with no developer filter, no status filter, no bedroom filter. It should be removed and replaced by the AreaProjectsGrid bar which has all filters.

---

### Changes

#### File 1: `src/components/area-detail/AreaProjectsGrid.tsx`

**A) Reverse visibility logic:**
- Remove the inline bar entirely (no more "always rendered for measurement")
- Remove the `opacity: 0 / pointer-events: none` trick
- Remove `barHeight` state and its measuring useEffect — not needed anymore
- The placeholder sentinel remains (height: 0, used only for IntersectionObserver)
- When `isFixed` is false: render nothing (bar is hidden)
- When `isFixed` is true: render the portal bar (fixed under header)
- This means on initial load, no bar is visible. Once the user scrolls past the sentinel, the bar appears fixed under the header.

**B) Add Building2 icon to developer trigger + developer logos in dropdown:**
- Import `Building2` from lucide-react
- Add `<Building2 className="w-4 h-4 mr-2 text-black/40" />` inside the developer SelectTrigger
- Fetch developer data with logos: update the query to join `developers` table data for each unique developer name, then show `dev.logo_url` as a small image next to each developer name in the dropdown items (same pattern as PropertySearchBar)

**C) Add Filter icon button:**
- Import `Filter` from lucide-react
- Add a filter icon button to the bar (matching PropertySearchBar's advanced filter link)

#### File 2: `src/components/area-detail/AreaStickySearchBar.tsx`

- No changes needed — it serves a different purpose (navigates to /properties page). It will remain as-is.

#### File 3: `src/components/PropertySearchBar.tsx`

- Already has developer dropdown with logos and Building2 icons — this is the reference design. No changes needed unless we want to extract a shared component (out of scope for this fix).

---

### Technical Details

**Visibility reversal in AreaProjectsGrid.tsx:**

```text
Current:
  - Inline bar always rendered (opacity 0 when fixed)
  - Portal bar rendered when isFixed=true

New:
  - No inline bar at all
  - Portal bar rendered ONLY when isFixed=true
  - Placeholder sentinel (height: 0) always present for observer
  - barRef and barHeight removed (not needed)
```

**Developer icons pattern (from PropertySearchBar):**
```text
SelectTrigger:
  <Building2 icon /> <SelectValue />

SelectItem for each developer:
  <img src={dev.logo_url} /> or <Building2 fallback icon />
  {dev.name}
```

**Portal fixed bar classes:**
- `fixed top-24 sm:top-28 lg:top-32` (matches header responsive heights)
- `left-0 right-0 z-[9998]`
- Same champagne gradient background and gold border
- Container-wrapped content for horizontal alignment

### Summary

After this fix:
- Page loads with NO filter bar visible
- User scrolls past the "Projects in [Area]" heading
- Filter bar slides in fixed under the header with search, developer (with icons), status, bedrooms, sort, and clear
- Consistent with PropertySearchBar's developer dropdown design
