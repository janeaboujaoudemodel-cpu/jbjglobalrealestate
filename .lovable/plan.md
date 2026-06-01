## Root causes

### 1. Header / sidebar "blinking" — animated shimmer on persistent chrome
The class `.jbj-shimmer-champagne` runs a 3s linear infinite gold gradient sweep:

```css
/* src/index.css:741 */
.jbj-shimmer-champagne {
  background-image: linear-gradient(110deg, #E6D3A8 0%, #F5E9CC 25%, #D8BE82 50%, #F5E9CC 75%, #E6D3A8 100%) !important;
  background-size: 200% 100% !important;
  animation: jbj-champagne-shimmer 3s linear infinite;
}
```

It is applied to **always-visible** chrome that should be perfectly stable:
- `src/components/navigation/HorizontalUtilityBar.tsx:99` — entire fixed top header bar
- `src/components/navigation/HorizontalUtilityBar.tsx:158, 167` — the active `sq ft` / `sq m` pill
- `src/components/navigation/GlobalVerticalNav.tsx:1007` — vertical nav logo tile (expanded)
- `src/components/navigation/GlobalVerticalNav.tsx:1282` — vertical nav logo tile (collapsed)

User-perceived effect: the header pulses gold every 3 s, and because only the **active** unit pill shimmers, the eye reads the highlight as "moving from sq ft to sq m". The vertical sidebar's JBJ tile shimmers in the same rhythm.

### 2. "Contact us" launcher flickering on anonymous sessions
`useOverHero` in `src/components/support/SupportLauncher.tsx:99-128`:

- Defaults `overHero = true` → tag starts invisible (`opacity-0`).
- A `scroll` listener fires `check()` on every scroll tick and toggles `overHero` whenever the homepage hero video crosses the threshold `r.top <= vh*0.15`.
- On the homepage that boundary is exactly where the page sits after first paint, so tiny layout shifts (fonts, images, cookie banner mount) flip the flag on/off → 300 ms opacity fade in, fade out, in, out.
- After sign-in the user lands on a route with no `[data-hero-dark]` video, so `hit` stays `false` and the tag stabilizes. That matches the user's report.

## Fix plan (frontend only, no business logic)

### A. Stop the shimmer on persistent chrome
1. `src/index.css` — narrow `.jbj-shimmer-champagne` so it is a one-shot reveal only (or move the animation behind `@media (hover: hover)` + `:hover` so it only animates on user interaction). Concretely: drop `animation: ... infinite` from the base class; expose a new `.jbj-shimmer-champagne--hover:hover` variant for places that actually want the sweep on hover.
2. Replace the four persistent usages with the static champagne gradient already used elsewhere:
   - `HorizontalUtilityBar.tsx:99` — drop `jbj-shimmer-champagne`, keep existing `bg-gradient-to-r from-[#F7F2EA] via-[#EFE6D6] to-[#F7F2EA]`.
   - `HorizontalUtilityBar.tsx:158/167` — for the active unit pill, replace the shimmer with the locked active style (cream `#EFE6D6` + 1 px gold ring + ink text), matching `.jj-pill-active` from the CTA primitive system. This also removes the perceived "movement" between sq ft and sq m.
   - `GlobalVerticalNav.tsx:1007/1282` — drop `jbj-shimmer-champagne`, keep the existing static `bg-gradient-to-b` champagne fill.
3. Leave the class itself in place for any opt-in marketing surfaces; just remove the infinite animation from the base rule.

### B. Stabilise the support launcher
In `src/components/support/SupportLauncher.tsx`:
1. Default `overHero` to `false` on routes that have no `[data-hero-dark]` video element at mount time — compute the initial value synchronously inside `useState(() => …)` so there is no initial fade-out.
2. Throttle `check()` to once per animation frame (`requestAnimationFrame` guard) and add a 6 px hysteresis around the threshold so micro layout shifts don't flip the flag.
3. Stop listening to `scroll` on routes with no qualifying hero (early-return when `document.querySelector('[data-hero-dark] video')` is null at mount; re-evaluate on `routechange`).
4. Replace the 300 ms `transition-opacity` fade with `visibility` toggling once the value is committed, so even if it does flip, there is no animated flash.

### C. Verify
1. `browser--navigate_to_sandbox /` (anonymous) → record 6 s of the header strip and right edge; confirm zero animation on the header bar, sidebar logo tile, and Contact us tag (a single mount fade-in is fine).
2. Refresh five times: confirm the active unit pill stays put on the value persisted in `localStorage.jj_area_unit` with no swap.
3. Navigate to `/properties`, `/jbj-academy`, `/contact` → confirm Contact us tag stays visible and steady on every route.
4. Sign in → confirm parity with anonymous behaviour (no regression).

## Files touched
- `src/index.css` — defang `.jbj-shimmer-champagne` (no infinite animation by default; add hover-only variant).
- `src/components/navigation/HorizontalUtilityBar.tsx` — remove shimmer from header bar + unit pills; use `.jj-pill-active` for active unit.
- `src/components/navigation/GlobalVerticalNav.tsx` — remove shimmer from both logo tiles.
- `src/components/support/SupportLauncher.tsx` — sync default for `overHero`, rAF-throttled + hysteresis check, scroll listener only when a hero exists, `visibility` toggle instead of opacity fade.

No database, no auth, no routing changes.
