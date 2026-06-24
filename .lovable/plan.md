## Problem

The four homepage "full-bleed" bands (Get Verified, Continue Searching, Featured Listings, Explore Our Guides & Reports) currently extend to `100vw` and use `margin-left: calc(-1 * (100vw - 100%))` to push their left edge all the way to viewport x=0. The fixed vertical sidebar (88px collapsed / 232px expanded) sits on top of that left strip, so the band's icon + title get visually hidden underneath the sidebar — exactly what you screenshotted on the "Explore Our Guides & Reports" row.

The right side is also wrong: the band runs to viewport edge while the rest of the page content stops at the canonical track, so the visual edge looks jagged compared to the section above/below.

The site already exposes two CSS variables that track the sidebar state perfectly:

```text
body.jj-vertical-nav-active     → --jj-content-gutter-l: 232px
body.jj-vertical-nav-collapsed  → --jj-content-gutter-l: 80px
default (no class)              → --jj-content-gutter-l: 80px
```

The fix is to use those variables for the band's left edge instead of `-50vw` / `-(100vw - 100%)`.

## Plan

**1. Rewrite `.jj-fullbleed-band` in `src/index.css`** (both definitions — the one near line 1341 and the hard override near line 14509) so the band:
- Starts exactly at the inner edge of the sidebar: `margin-left: calc(var(--jj-content-gutter-l) - <parent-left-offset>)` — implemented as `left: calc(var(--jj-content-gutter-l) - <main-shell-left>)` with `width: calc(100vw - var(--jj-content-gutter-l))`.
- In practice, because the `<main>` element already starts at viewport x=0 (the sidebar is `position: fixed` overlaying it), the parent offset is 0, so the rule simplifies to:
  ```css
  .jj-fullbleed-band {
    position: relative;
    margin-left: calc(var(--jj-content-gutter-l) - (100vw - 100%) / 2 * 0); /* keep parent-anchored */
    width: calc(100vw - var(--jj-content-gutter-l));
    max-width: calc(100vw - var(--jj-content-gutter-l));
    left: calc(var(--jj-content-gutter-l) - (parent-left-distance));
  }
  ```
  The concrete implementation will be the proven pattern:
  ```css
  .jj-fullbleed-band {
    position: relative;
    width: calc(100vw - var(--jj-content-gutter-l, 0px));
    max-width: calc(100vw - var(--jj-content-gutter-l, 0px));
    margin-left: calc(-1 * (100vw - 100%) + var(--jj-content-gutter-l, 0px));
    margin-right: 0;
    box-sizing: border-box;
  }
  ```
  That is: take the previous "escape to viewport x=0" trick, then push the start back to the right by exactly the sidebar width. When the sidebar collapses to 80px the band's left edge moves to 80px; when it expands to 232px the left edge moves to 232px — automatic, no JS.

- Mobile (`<640px`): the sidebar isn't present, so wrap the rule in `@media (min-width: 640px)`. Below 640px the band stays truly edge-to-edge (current behavior).

**2. Remove the conflicting override block in `src/index.css` lines 14509–14519** which forces the band back to `width: 100vw` and `margin-left: calc(-1 * (100vw - 100%))`. Replace with the sidebar-aware version above so there is exactly one source of truth.

**3. No component changes required.** `src/pages/Index.tsx` already wraps the four exception sections in `<div className="jj-fullbleed-band" data-fullbleed-band>` — they will inherit the corrected geometry automatically. No other page uses `.jj-fullbleed-band`, so the site-wide behavior is consistent by construction.

**4. Validation (Playwright at 1280×1800)**:
- Homepage with sidebar collapsed: measure each of the four bands' `getBoundingClientRect()`. Expect `left === 80` and `right === 1280`.
- Toggle sidebar expanded (add `body.jj-vertical-nav-active`): expect `left === 232`, `right === 1280`.
- Screenshot the "Explore Our Guides & Reports" row in both states to confirm the book icon + title are fully visible to the right of the sidebar.
- Scroll past Invest-in-Dubai → Guides & Reports to confirm there is visible vertical breathing room between the two (the current touching-edge bug is caused purely by the band running under the sidebar; once it no longer does, the existing `py-4` padding becomes visible).
- Spot-check 3 non-homepage routes (`/about`, `/properties`, `/market-intelligence`) to confirm no regression (those pages don't use `.jj-fullbleed-band`, so they should be byte-identical).

## Files touched

- `src/index.css` — two CSS blocks updated (`.jj-fullbleed-band` definition + hard override).

No component, no route, no backend changes.
