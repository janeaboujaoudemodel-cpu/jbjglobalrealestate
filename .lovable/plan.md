
# Fix: Color Preset Buttons Blocked by Floating Navigation Buttons

## Root Cause

The `PageNavigation` component renders three floating buttons (`fixed bottom-6 left-6 z-[9990]`) — Scroll Up, Back, and Scroll Down — that sit in the bottom-left corner of every page.

On the stamp generator route (`/toolkit/stamp-generator/:id/generate`), the left color panel is anchored to the left side of the page. The color swatches (Gold, Deep Gold, Rose Gold, Black, Charcoal, White) are near the bottom of that panel, which happens to overlap with the floating navigation buttons physically on screen.

The session replay confirmed this exactly:
- The "Scroll to Top" button has `opacity-0 pointer-events-none` (user hasn't scrolled yet), but it still visually doesn't interfere.
- The "Scroll to Bottom" button has `opacity-100 pointer-events-auto` and is sitting directly on top of the first Gold swatch, blocking mouse events from reaching it. This is why clicking "Gold" does nothing (the click hits the floating button, not the swatch), but "Deep Gold" (the next one along, slightly to the right, further from the left edge) is reachable.

## The Fix — Two Targeted Changes

### Change 1 — `src/components/PageNavigation.tsx`

On desktop (`lg` screens), move the floating nav widget to the **right side** of the screen when on stamp-generator routes, OR add an additional horizontal offset so it clears the left panel entirely.

The simplest fix: add `lg:left-auto lg:right-6` so on large screens the nav widget anchors to the right side instead of the left, where there is empty space on the stamp generator and on all other pages it won't conflict with anything.

```tsx
// Change the container positioning from:
isRTL ? "right-6" : "left-6"

// To:
isRTL ? "right-6" : "left-6 lg:left-auto lg:right-6"
```

This moves the widget to the right on desktop — away from the left panel — while keeping it on the left on mobile where there is no left panel.

### Change 2 — `src/components/PageNavigation.tsx` (secondary fix)

Additionally detect the stamp-generator route and suppress the scroll-to-bottom button there, since the generator page uses a sticky layout and the scroll detection can be inaccurate inside nested scrollers:

```tsx
const isStampGenerator = location.pathname.includes('/stamp-generator/');
// In render: hide scroll-to-bottom on stamp generator pages
{!isStampGenerator && <button ... scrollToBottom ... />}
```

This ensures even on mobile, the nav overlay is reduced to 2 buttons max on the stamp generator.

## What Changes

| File | Change |
|---|---|
| `src/components/PageNavigation.tsx` | Move floating nav to right side on `lg` screens (`lg:left-auto lg:right-6`); suppress scroll-bottom button on stamp-generator routes |

## What Does NOT Change

- No stamp generator page files touched
- No color palette code touched — the presets are fine, they're just blocked
- Mobile behavior is unchanged (nav stays bottom-left)
- All other pages are unaffected — the nav widget moving to the right on desktop is a net improvement everywhere since the left side is where most main navigation is anyway
