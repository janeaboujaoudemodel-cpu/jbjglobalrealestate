
## What I verified (current behavior)
- I opened **/developers**, clicked a developer card (example route: `/developer/stamn-real-estate-development`).
- The Developer Detail page immediately shows a full-screen **Boot Error** overlay and becomes unusable.
- The browser console error is consistently:

  `TypeError: render2 is not a function`
  
  Stack starts at React internals: `updateContextConsumer(...)` (React context consumer rendering path).

This confirms the issue is real, reproducible, and not developer-specific.

---

## Diagnosis (what this error means in practice)
`updateContextConsumer` is React’s internal code path for **rendering a `<SomeContext.Consumer>`**.

That error typically happens when a Context Consumer is rendered but its “children” prop is not a function (Consumer requires a render-prop function), or when there’s a **React/Context mismatch** (e.g., multiple React copies / incompatible prebundled dependency) that causes React to mis-handle a consumer element at runtime.

### Why the Boot Error overlay appears (and why it “crashes”)
Your `index.html` installs a global `window.onerror` handler that creates a blocking overlay for any uncaught error. So even if we can “recover” in-app, any uncaught error will still hard-stop the UI.

---

## Most likely trigger on DeveloperDetail
DeveloperDetail conditionally mounts the **DeveloperProjectsMap** (Leaflet map) when the developer has projects.

Even though the page uses `MapErrorBoundary`, the Boot overlay indicates the error is **not being contained** (likely occurs outside React error boundaries: module evaluation / global, or an effect/error that bypasses the boundary).

Given:
- the failure happens immediately after route navigation,
- the error is React context consumer-related,
- the Developer page is the one pulling in the developer map chunk,

…the highest-probability root cause is: **the current react-leaflet-based developer map path is triggering the uncaught context-consumer error in this environment**.

---

## Implementation approach (global fix, applies to all developers)
We’ll solve this in two layers:
1) **Eliminate the crash source** for the Developer page map (so the page never hard-fails).
2) **Harden the Boot overlay** so it only shows for true “boot” failures (pre-mount), not runtime route errors.

This ensures:
- Developer pages stop crashing for all developers (even future data).
- Maps still work (or fail gracefully without breaking the page).
- The app doesn’t get locked behind a full-screen overlay due to a runtime error.

---

## Step-by-step changes

### A) Replace DeveloperProjectsMap implementation to avoid the failing Context path
**Goal:** Keep the same UI/UX (tile toggle, markers, fit bounds), but remove the dependency path that’s triggering the `Context.Consumer` crash.

**Plan: rewrite `src/components/developer/DeveloperProjectsMap.tsx` to use Leaflet imperatively (no react-leaflet).**
- Render a simple `<div ref={mapDivRef} />` container.
- In `useEffect`:
  - `L.map(mapDivRef.current, options)` create map instance once.
  - Create & manage `L.tileLayer(...)` for street/satellite toggle.
  - Create markers using `L.marker(..., { icon: L.divIcon(...) })`.
  - Bind popups via `marker.bindPopup(htmlString)` (or a small DOM node).
  - Fit bounds using `L.latLngBounds(...); map.fitBounds(...)`.
  - Cleanup on unmount: `map.remove()` and clear layers.
- This removes any React Context plumbing from the map portion of the Developer page while keeping Leaflet.

**Routing inside popups**
- Since popups will be raw HTML (not React `<Link>`), we will:
  - Use standard `<a href="/project/{slug}">` links (works with SPA routing).
  - Or intercept click with a `data-slug` attribute + `useNavigate` binding.
  
We’ll pick the safest approach:
- Use `<a href="/project/${slug}">View</a>`; the router will handle it.

**Why this solves the crash**
- It completely avoids react-leaflet’s React-context integration on the Developer page, which is the area implicated by the error’s context-consumer stack path.

**Scope note**
- We will only change the Developer page map first. Other map pages (ProjectLocationMap/PropertyMap) can remain as-is if they are stable. If they also fail after this change, we’ll apply the same approach there too.

---

### B) Ensure DeveloperDetail never “hard crashes” even if maps fail
In `src/pages/DeveloperDetail.tsx`:
- Keep `MapErrorBoundary` (it’s still valuable for render-time errors).
- Add an additional defensive layer:
  - Make the map section independent from the rest of the page (already mostly is).
  - Ensure any map initialization errors are caught and converted into a graceful fallback UI (this will happen inside the rewritten DeveloperProjectsMap since initialization is in an effect; we’ll wrap Leaflet setup in try/catch and set local error state).

Result:
- Even if a tile server blocks, or coordinates are malformed, the Developer page stays stable.

---

### C) Fix the “Boot Error” overlay so it’s truly boot-only (pre-mount)
In `index.html`:
- Introduce a global flag: `window.__APP_MOUNTED__ = false` initially.
- Modify the boot overlay `showError(...)` so it **does nothing if `__APP_MOUNTED__ === true`**.
- In `src/main.tsx` (after the first successful render tick):
  - set `window.__APP_MOUNTED__ = true`.

This ensures:
- Boot overlay still catches real boot failures (JS errors before React mounts).
- Runtime route/component errors do not lock the whole app behind an overlay (they should be handled by error boundaries / fallback UI).

---

### D) Confirm developer listing → developer page flow end-to-end
After code changes:
- Open `/developers`
- Scroll several screens (varied developers).
- Click at least:
  1) A developer with projects (map should render; no crash).
  2) A developer with **0 projects** (page should render stable; no map section; no crash).
- Confirm:
  - No Boot overlay.
  - No `render2 is not a function` console error.
  - Page remains navigable and styled.

---

## QA checklist (explicit, for your request)
- Developer cards page loads and scrolling works.
- Clicking any developer card:
  - page does not flash then crash
  - no Boot Error overlay
  - no `render2 is not a function`
- DeveloperDetail shows:
  - title, logo, description, stats
  - projects grid (if any)
  - map section (if any) without breaking page
- Verify with at least 5 developers including one with 0 projects.

---

## Files that will be changed (implementation phase)
- `src/components/developer/DeveloperProjectsMap.tsx` (rewrite to imperative Leaflet)
- `src/pages/DeveloperDetail.tsx` (map integration stays, but aligned with new map implementation and error-safe behavior)
- `index.html` (boot overlay becomes “boot-only”)
- `src/main.tsx` (set app-mounted flag after mount)

---

## Why I’m confident this fixes it globally
- The crash is consistently reproducible and tied to a React Context Consumer failure path.
- The developer page is the place that reliably triggers it.
- Replacing the developer map implementation with non-react-leaflet Leaflet removes the most likely failing React-context path from that route entirely.
- Hardening the boot overlay prevents a single runtime error from taking down the whole app experience, ensuring the Developer pages remain usable.

