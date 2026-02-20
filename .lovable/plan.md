
# 3 Targeted Fixes: Handover Dropdown, Instant Map, and Faster Project Loading

## Fix 1 — Handover Date Range Dropdown Content Broken

### Root Cause
The `HandoverDateRange` trigger button sits inside the fixed `FilterShortcutBar` section which uses `overflow-hidden` styling. The two-column grid inside the `PopoverContent` uses Radix UI `Select` dropdowns (`SelectContent`). When `SelectContent` tries to render inside a scrollable overflow row, it gets clipped.

Looking at the component: the `PopoverContent` itself has `w-[260px]` which is fine, but the two `SelectTrigger` + `SelectContent` elements inside that `grid grid-cols-2` are each only allocated `~120px` — too narrow for the year text ("2025", "2026" etc.) plus the chevron icon. The `SelectTrigger` has `h-10` but no explicit width, so it collapses.

Additionally, the trigger `Button` has `min-w-[160px]` — but inside a scrollable filter row with tight spacing, it may not have room to display `"Handover Date"` + calendar icon + chevron.

### Fix
In `HandoverDateRange.tsx`:
1. Change the trigger button to `min-w-[140px]` and truncate display text with `truncate` class to prevent overflow
2. Give the popover `z-[10500]` to ensure it renders above the fixed filter bar
3. Fix the `SelectTrigger` widths — give each an explicit `w-full` within the grid columns
4. Change the `PopoverContent` `align` from `"start"` to `"start"` with a `sideOffset={8}` and add `avoidCollisions={true}` (this is already Radix default but making it explicit)
5. The From/To `SelectContent` needs `position="popper"` to avoid being clipped

In `FilterShortcutBar.tsx` (where `HandoverDateRange` is rendered inside Row 2):
- The Row 2 `div` has `overflow-x-auto` which clips dropdown portals — this is the real root cause. Radix `PopoverContent` renders in a portal so it bypasses this, but `SelectContent` inside the popover does NOT portal past the overflow container unless `position="popper"` is used. Solution: add `position="popper"` to each `SelectContent` in `HandoverDateRange`.

---

## Fix 2 — Map Mode Loads Instantly

### Root Cause
When the user clicks "Map", `isMapMode` flips to `true`. React re-renders `PropertiesReelly` which then renders `PropertiesMapView`. Leaflet's `MapContainer` is lazy-loaded (it imports CSS and creates a DOM node). The `unifiedProjects` memo runs over 1,835 items converting each to `UnifiedProject`. The map must also compute `FitBounds` which runs `map.fitBounds()` on all coordinates.

The issue is NOT slow data — the data is already loaded. The issue is:
1. Leaflet is loaded synchronously as a regular import (not lazy), but the DOM setup takes ~300-500ms
2. `unifiedProjects` is recomputed on every mode switch because `sortedProjects` changes (re-sorted on each render)
3. The map tiles load from external tile servers (satellite = ArcGIS) — not cacheable on first load

### Fix in `PropertiesReelly.tsx`:
1. Pre-render `PropertiesMapView` as a **hidden div** (not unmounted) when in list mode, so Leaflet initializes in the background. Use `display: none` on the map container when `!isMapMode` so the DOM exists but isn't visible. This pre-warms Leaflet tile loading.
2. Increase `staleTime` on `useProjectsListing` from undefined (0) to `10 * 60 * 1000` (10 minutes) so the data is cached between visits

### Fix in `useProjects.ts` (`useProjectsListing`):
Add `staleTime: 10 * 60 * 1000` and `gcTime: 30 * 60 * 1000` so projects stay in React Query cache for 10 minutes without refetching.

---

## Fix 3 — Instant Project Count (No "0 of 0" Flash)

### Root Cause
The count displayed is `paginatedProjects.length of sortedProjects.length`. Both start at `0` because:

1. `useProjectsListing()` runs TWO sequential database pages (2 × network round trips) before returning any data
2. `dbProjectsMapped` is filtered (`.filter(p => p.cover_image_url)`) and mapped — only populated AFTER both pages load
3. `totalCount = dbProjectsMapped.length || mergedProjects.length` — this is `0` until the filter runs
4. There's no `staleTime` on `useProjectsListing` so every navigation refetches

The hero text "Browse X curated developments" also shows a stale/zero count until both fetch pages complete.

### Fix:

**A — Add staleTime to `useProjectsListing`** (same as Fix 2 — shared fix):
```typescript
staleTime: 10 * 60 * 1000,  // 10 minutes
gcTime: 30 * 60 * 1000,     // 30 minutes
```
This means: first visit fetches, subsequent visits within 10 minutes show cached data instantly.

**B — Show total from DB count, not from filtered array**:
The `useProjectsListing` query fetches ALL rows. The total count should be derived from `dbProjects.length` (raw, before the `cover_image_url` filter) or better — from a separate count query that runs instantly.

Currently:
```typescript
const totalCount = dbProjectsMapped.length || mergedProjects.length;
```
This is `0` until data loads. Fix: use `dbProjects?.length ?? 0` which is the raw DB array (same data, no filter applied) as a reliable count indicator once data lands. Even better — show `isDbLoading ? '...' : count` in the hero and listing header so there's no "0 of 0" — it shows a loading skeleton instead.

**C — Show skeleton immediately instead of "0 of 0"**:
In `PropertiesReelly.tsx`, the results count text `Showing X of Y` currently shows when `paginatedProjects.length === 0` and `sortedProjects.length === 0`. Change the condition so the skeleton renders while `isDbLoading` is true (which it already does), but the count text only renders when `!isDbLoading && sortedProjects.length > 0` — otherwise show a "Loading curated developments..." indicator.

---

## Summary of File Changes

| File | What Changes |
|---|---|
| `src/components/filters/HandoverDateRange.tsx` | Add `position="popper"` to both `SelectContent` elements; add `z-[10500]` to `PopoverContent`; fix trigger truncation |
| `src/hooks/useProjects.ts` | Add `staleTime: 10 * 60 * 1000` and `gcTime: 30 * 60 * 1000` to `useProjectsListing` |
| `src/pages/PropertiesReelly.tsx` | Pre-render map hidden when in list mode; fix count display to show skeleton instead of "0 of 0"; fix `totalCount` to use `dbProjects?.length` |

## What This Does NOT Change
- No structural changes to filters, layout, or the map component itself
- The project detail page (Reelly parity) requires the emergency data mirror to run first — the structure is already correct, the data just needs to be backfilled via the admin panel
- No database migrations needed
