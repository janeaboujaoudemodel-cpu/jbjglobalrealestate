
# Properties Map — 4 Fixes: Markers, Size, Scroll Behaviour & Touch Zoom

## What the user reported

1. **No markers showing on the map** — projects are not visible as pins
2. **Map too large** — the split-screen takes the full viewport height; the map panel should be shorter so users can see context
3. **Scroll wheel on the map scrolls the map zoom** — it should scroll the page instead; only a two-finger pinch should zoom the map
4. **Two-finger scroll on the map scrolls the map instead of the page** — pinch-to-zoom (spread/close fingers) should zoom; two-finger scroll should scroll the page

---

## Root Cause Analysis

### Bug 1 — No markers (Critical)

`PropertiesMapView.tsx` filters projects like this:

```ts
projects.filter(p => p.latitude && p.longitude)
```

The `UnifiedProject` type stores coordinates as `string | null | number`. When a coordinate value is `"0"` or `0` the filter treats it as falsy and drops the project. More importantly, the `PropertiesReelly` page passes `unifiedProjects` which is the merged list from the Reelly API + the database. If Reelly projects lack `latitude`/`longitude` fields, or those fields are named differently on the Reelly side, every project is filtered out.

The fix is to make the coordinate filter strict: check `!= null && !isNaN(Number(p.latitude))` instead of relying on truthiness.

### Bug 2 — Map too large / fixed viewport trap

`PropertiesReelly.tsx` wraps the split-screen in:

```tsx
<section style={{ height: 'calc(100vh - 60px)' }}>
```

This pins the section to the full viewport, so users are trapped and cannot scroll to the DLD widget or footer below. The user wants:
- The split is **relative** in the page flow (not fixed/trapped)
- A **shorter** map panel so the bottom of the page is reachable by scrolling
- The map panel itself should have a defined height (e.g. `600px` or `70vh` max)

### Bug 3 — Scroll wheel zooms the map

`MapContainer` is currently configured with `scrollWheelZoom={true}`. This intercepts the mouse wheel when the cursor is anywhere over the map, preventing page scrolling. It should be `scrollWheelZoom={false}` so the page scrolls normally with the mouse wheel.

### Bug 4 — Touch scroll/zoom behaviour

Currently:
- `touchAction: "none"` on the container wrapper — this blocks ALL native touch behaviour including two-finger page scroll
- `touchZoom={true}` — this enables pinch-zoom correctly, but combined with `touchAction: none` it also captures two-finger scroll

The correct behaviour:
- Mouse wheel → scroll the page (no map zoom)
- Two-finger pinch (spread/close) → zoom the map in/out
- Two-finger scroll (both fingers moving in the same direction) → scroll the page, not the map

Leaflet handles this natively when `touchAction` is **not** set to `"none"` on the container. The correct CSS value is `touch-action: pan-y pinch-zoom` which tells the browser: allow vertical scrolling AND allow pinch-zoom, but capture pinch for the map. Removing `touchAction: "none"` and using `touch-action: pan-y` on the wrapper achieves the right split.

---

## Files to Change

### 1. `src/components/maps/PropertiesMapView.tsx`

**a) Fix coordinate filter:**
```ts
// Before
projects.filter(p => p.latitude && p.longitude)

// After
projects.filter(p =>
  p.latitude != null && p.longitude != null &&
  !isNaN(Number(p.latitude)) && !isNaN(Number(p.longitude)) &&
  Number(p.latitude) !== 0 && Number(p.longitude) !== 0
)
```

**b) Disable scroll-wheel zoom:**
```tsx
// Before
scrollWheelZoom={true}

// After
scrollWheelZoom={false}
```

**c) Fix touch-action on wrapper:**
```tsx
// Before
style={{ touchAction: "none" }}

// After — allow pan-y (two-finger scroll) + pinch-zoom (two-finger spread) to pass through correctly
style={{ touchAction: "pan-y" }}
```

**d) Keep `touchZoom={true}`** — pinch-to-zoom stays enabled so spreading fingers zooms the map in and closing them zooms out.

### 2. `src/pages/PropertiesReelly.tsx`

**Change the split-screen layout** from a full-viewport fixed height to a relative, shorter layout that sits in the page flow:

```tsx
// Before
<section style={{ height: 'calc(100vh - 60px)' }}>
  <div className="flex flex-col md:flex-row h-full">
    ...
    {/* Map panel */}
    <div className="w-full md:w-1/2 h-[50%] md:h-full">

// After — remove the viewport lock, let it flow naturally
<section className="relative bg-gradient-to-br from-champagne-light via-champagne to-champagne-dark">
  <div className="flex flex-col md:flex-row" style={{ minHeight: '600px', maxHeight: '85vh' }}>
    ...
    {/* Map panel — defined height so map isn't tiny on mobile */}
    <div className="w-full md:w-1/2 h-[420px] md:h-full">
```

This makes the section sit **in the page flow** so the user can scroll down past it to reach the DLD widget and footer. The map and card list are given a bounded height so they look compact and premium rather than full-screen.

---

## Summary of Changes

| File | Change |
|---|---|
| `PropertiesMapView.tsx` | Fix coordinate filter (null+NaN+zero check), disable `scrollWheelZoom`, set `touchAction: pan-y` |
| `PropertiesReelly.tsx` | Remove `height: calc(100vh - 60px)` viewport lock; use natural flow with `maxHeight: 85vh` so the rest of the page is scrollable |

Both changes are surgical — no layout structure is removed, only the height constraint and map interaction flags are corrected.
