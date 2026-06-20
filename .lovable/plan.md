# Global Layout Gutter + Anti-Underflow Fix

## Problem (from screenshots)

1. **Project page** — KPI cards (Starting Price / Handover / Bedrooms / Size), property-type tile, and chip sub-nav (Price / Payments / Handover / Property Type / Bedrooms / Status) sit flush against the vertical sidebar's right edge. No breathing room.
2. **Dubai Market Intelligence** — KPI grid (`AED 145.5B`, `+24…`, `TRANSACTIONS 48,980`, etc.) is clipped on the **left** by the sidebar and on the **right** by the viewport. The section is rendering wider than the post-sidebar viewport and sliding underneath the fixed chrome.
3. Same pattern repeats on every page that uses `.jj-band` full-bleed sections or wide grids.

## Root cause

`src/components/MainLayout.tsx` line 289 — `<main>` reserves left padding equal to the sidebar width (`sm:pl-[200px]` / `sm:pl-[48px]`) but never adds an **inner horizontal gutter**. Pages and `.jj-band` sections then render edge-to-edge inside `<main>`, so:

- Cards touch the 0px right edge of the sidebar (no `px-*` on the page wrappers).
- `.jj-band` full-bleed sections (defined in `src/index.css`) use `margin-left: calc(50% - 50vw)` style tricks that compute against the **viewport**, not against the post-sidebar inner box — so they extend *under* the fixed sidebar.

## Fix — 3 layers

### 1. Global inner gutter on `<main>` (the primary fix)

`src/components/MainLayout.tsx`, line 289 — add responsive horizontal padding to the `<main>` element so EVERY page automatically gets breathing room from both the sidebar and the right viewport edge:

```
px-4 sm:px-6 lg:px-8
```

Skip the gutter only when `usesStandalonePortalChrome` (back-office / broker portal already manages its own chrome).

Add CSS variable `--jj-content-gutter: clamp(16px, 2vw, 32px)` to `:root` in `src/index.css` so bands/sections can reference the same value.

### 2. Clamp `.jj-band` full-bleed to the post-sidebar viewport

`src/index.css` — `.jj-band` (and `.jj-band-page`, `.jj-band-surface`, `.jj-band-raised`) currently extend to `100vw`. Replace the full-bleed math so it spans the **inner viewport** (viewport width minus active sidebar width) instead of true viewport width:

```css
.jj-band {
  /* old: margin-left: calc(50% - 50vw); width: 100vw; */
  margin-left: calc(-1 * var(--jj-content-gutter));
  margin-right: calc(-1 * var(--jj-content-gutter));
  width: auto;
}
```

This makes bands break out of the page gutter but stay inside `<main>`, which is already offset by the sidebar. No more underflow.

Add a body-level fallback for legacy `margin-left: calc(50% - 50vw)` usages: 

```css
body.jj-vertical-nav-active main [style*="50vw"],
body.jj-vertical-nav-active main .full-bleed {
  max-width: 100% !important;
}
```

### 3. Horizontal scrollers stay inside the gutter

The project-detail chip sub-nav and Market Intel KPI grid use `overflow-x-auto` rows. They're fine — once the parent `<main>` has `px-4 sm:px-6 lg:px-8`, the scroll track starts inside the gutter automatically. No per-component changes required.

For the KPI grid specifically (Dubai Market Intel) — verify in `src/pages/owner/OwnerMarketIntel.tsx` that the grid is not wrapped in a `<div className="-mx-*">` negative-margin bleed. If it is, remove it.

## Out of scope

- No changes to sidebar width, header height, or `.jj-cta-*` primitives.
- No changes to mobile (`<sm`) — the sidebar isn't fixed there.
- No new design tokens beyond `--jj-content-gutter`.
- No content/layout edits inside individual pages; the gutter must come from the shell.

## Verification (after build)

1. Project page `/project/vindera` at 1920×1080 — KPI cards must show ≥16px gap from the sidebar's right edge and the right viewport edge.
2. `/owner/market-intel` — first KPI card's left edge must be ≥16px from the sidebar; `+24%` must be fully visible on the right.
3. Home page bands (Royal Tools, Top Areas, Continue Searching) — band background still spans full inner width but no card touches the sidebar.
4. Mobile 390×844 — no regression; layout unchanged.
5. Sidebar collapsed state (`body.jj-vertical-nav-collapsed`) — gutter unchanged, content still has breathing room.

## Memory update

Add to `mem://ui-ux/navigation/header-sidebar-alignment-standard-v11-locked`:
> Global content gutter is `px-4 sm:px-6 lg:px-8` on `<main>` (variable `--jj-content-gutter`). Full-bleed `.jj-band` clamps to inner viewport via negative gutter margins — never `100vw`. No section may extend under the fixed sidebar.
