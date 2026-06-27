# Fix homepage scroll + global scroll audit

## Problem
Homepage (`/`) does not scroll. `src/pages/Index.tsx` already has a "scroll safety net" that releases inline `overflow/position/pointer-events` locks via a MutationObserver, but the bug persists — meaning the lock is coming from a source the guard doesn't cover (e.g. a CSS class like `overflow-hidden` on `<html>`/`<body>`, a full-viewport overlay swallowing wheel/touch events, `touch-action: none`, or a wrapper with `height: 100vh; overflow: hidden`).

## Phase 1 — Reproduce and diagnose (no code changes yet)
1. Drive Playwright against `localhost:8080/`, scripted wheel + touch scroll, capture:
   - `documentElement` / `body` computed `overflow`, `position`, `height`, `touch-action`, `pointer-events`, and `classList`.
   - Any element with `position: fixed`/`absolute` covering the viewport with `pointer-events: auto` above the fold.
   - `window.scrollY` before/after a `window.scrollBy(0, 800)` call.
   - Screenshots at 0 / mid / bottom.
2. Inspect the splash screen + mobile nav overlays (recent additions) and the `usePopupCoordinator` drawers — confirm none leave a lingering overlay or `overflow-hidden` class on `<html>`.
3. Check `src/index.css` and `src/App.css` for any `html, body { overflow: hidden }` rule that might have shipped recently.

## Phase 2 — Fix the homepage
Apply the minimum fix based on Phase 1 evidence. Likely candidates:
- Extend the Index scroll guard to also strip `overflow-hidden` / `overflow-y-hidden` **classes** (not just inline styles) and reset `touch-action`/`height` on `html`+`body`.
- Remove/repair the offending overlay (most likely a splash screen or mobile menu that doesn't unmount or leaves `pointer-events: auto` after close).
- If a CSS rule in `index.css` globally locks scroll, scope it to the route that needs it.

## Phase 3 — Per-page scroll audit
Script Playwright to visit each top-level route, attempt a scroll, and assert `scrollY > 0` after `scrollBy`. Routes covered:
- `/`, `/projects`, `/developers`, `/services/*`, `/market-intelligence`, `/news`, `/guides`, `/faq`, `/join`, `/about`, `/contact`
- Owner: `/owner`, `/owner/documents/forms`, `/owner/crm`
- Broker: `/broker/crm`, `/broker/training`
- Tools: `/tools/*` (mortgage, compare, ai-home-finder, property-evaluator)

For any failing route, apply the same class-of-fix used on the homepage (no scope creep into business logic or layout redesign).

## Phase 4 — Validate
- Re-run the Playwright audit headless, attach before/after screenshots.
- Manual desktop + mobile viewport (390×844) check on `/`.
- Confirm modals/drawers still correctly lock scroll *while open* and release *on close* (Concierge, ActionGate, Support, Mobile Nav, Splash).

## Out of scope
No visual redesign, no removal of features, no business-logic changes. Strictly scroll/overlay/lock-state fixes.

## Technical notes
- Files most likely touched: `src/pages/Index.tsx` (scroll guard), `src/index.css` (any global overflow rule), splash/mobile-nav components added in the recent mobile rebuild, `usePopupCoordinator` cleanup.
- Keep the `MutationObserver` approach but widen its trigger to `attributeFilter: ['style','class']` and re-run release on `transitionend` of overlay components.
