---
name: Page shell & rail-safe horizontal padding standard
description: Global tokens + .jj-page/.jj-band/.jj-rail-safe utilities that reserve safe horizontal gutters AND clear the fixed right Contact-Us rail on lg+. Auto-applied to common centered containers inside <main>.
type: design
---

# Page shell & section rhythm

## Tokens (in `src/index.css` `:root`)
- `--page-px-mobile: 16px`
- `--page-px-tablet: 24px`  (≥768px)
- `--page-px-desktop: 32px` (≥1024px)
- `--page-max-w: 1440px`
- `--rail-safe-right: 56px` — clearance for the fixed right Contact-Us launcher rail on lg+
- `--section-gap-y: clamp(32px, 5vw, 64px)`

## Utilities
- `.jj-page` — page wrapper: centered, `max-w-[var(--page-max-w)]`, mobile/tablet/desktop padding, **right padding on lg includes rail-safe**.
- `.jj-section` — vertical rhythm only, `padding-block: var(--section-gap-y)`.
- `.jj-band` — full-bleed marketing band; inner padding identical to `.jj-page` (right padding adds rail-safe on lg).
- `.jj-rail-safe` — opt-in `padding-right: var(--rail-safe-right)` on lg+.

## Auto rail-safe rule
On lg+ screens, any of the following classes nested in `<main>` automatically get `padding-right: max(var(--rail-safe-right), 1rem)`:
`.container`, `.max-w-7xl.mx-auto`, `.max-w-6xl.mx-auto`, `.max-w-5xl.mx-auto`, `.max-w-[1600px].mx-auto`, `.max-w-[1440px].mx-auto`, `.max-w-[1280px].mx-auto`.

Opt out per-element with `class="jj-fullbleed"` or `data-no-rail-safe`. Opt out per-page with `<body data-no-rail-safe>`.

## GlobalFilterBar
`src/components/navigation/GlobalFilterBar.tsx` uses `pl-3 pr-3 lg:pr-[64px] py-1` so the last chip (Construction / Views / Hide Sold) never clips behind the rail.

## Do not
- Don't hard-code `px-4 md:px-8` on new page roots — use `.jj-page` instead.
- Don't add right-side margin/padding to `<main>` directly (breaks full-bleed heroes).
- Don't change tokens per-page; if a page needs different rhythm, override the CSS var inline on that page root.
