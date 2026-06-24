## Site-wide alignment normalization

### What I already verified
- Scroll bug (page jumping back to hero on `/`): caused by a stale HMR module crash in `OverseasInvestorsStrip` (`Cannot read properties of null (reading 'useRef')`). After dev-server restart the homepage scrolls correctly (verified at scrollY=1389 → 1400 stable, zero pageerrors). I'll keep this verified at the end too.
- Total page files under `src/pages`: **427 `.tsx` files** (this includes admin, portal, broker, developer hub, owner, toolkit, AI tools, public marketing, legal, etc.).

### Why I won't edit 427 files one by one
Editing each page is unsafe and unmaintainable. The codebase already has a single canonical token system (`--jj-global-container-max: 1760px`, `.jj-global-container`, `.jj-content-track`). The right fix is to make **every page inherit the canonical container automatically** through CSS — no page-specific edits — and let the homepage opt out.

### The plan

**1. Centralized CSS normalization (one edit in `src/index.css`)**

Add a global rule scoped to `body:not([data-homepage]) main` that normalizes every common content container to the canonical width + gutter:

- Targets: `.container`, `.max-w-7xl.mx-auto`, `.max-w-6xl.mx-auto`, `.max-w-5xl.mx-auto`, `.max-w-4xl.mx-auto`, `.max-w-[1280px].mx-auto`, `.max-w-[1400px].mx-auto`, `.max-w-[1440px].mx-auto`, `.max-w-[1500px].mx-auto`, `.max-w-[1600px].mx-auto`, `.max-w-[1760px].mx-auto`.
- Applies: `max-width: var(--jj-global-container-max)`, responsive `padding-left/right` from existing tokens.
- Hero opt-out (untouched, always full-width): any descendant of `[data-hero-dark]`, `[data-hero]`, `.jj-fullbleed`, `[data-no-rail-safe]`, `header`, `nav`.
- Print mode opt-out: respects existing `[data-print-mode]`.

**2. Homepage opt-out + 4 full-width exception bands**

- Add `data-homepage` to `<body>` while on `/` (small effect in `src/pages/Index.tsx`).
- Mark the 4 exception sections with `data-fullbleed-band` so their background spans edge-to-edge while their inner content still aligns to the canonical track:
  - Get Verified / Mode Portal pair (`ModePortalBanner` area)
  - Continue Searching For Your Dream Property
  - Handpicked For You (`FeaturedListings`)
  - Guides & Reports library (`HomepageBookMarquee`)
- Add a `.jj-fullbleed-band` utility that paints background full width and centers inner children to canonical width.

**3. Scroll-bug guard**

`OverseasInvestorsStrip` is fine code, but I'll add a tiny defensive boundary (lazy-mount the IntersectionObserver only after first paint) so any future HMR/lazy-chunk failure doesn't unmount and yank the scroll. No visual change.

**4. Validation (visual, with screenshots)**

Drive Playwright across a representative slice of every page family:
- Public marketing: `/`, `/about`, `/contact`, `/careers`, `/legal`
- Listings: `/projects`, `/project/<slug>`, `/areas`, `/area/<slug>`
- Tools: `/tools`, `/tools/mortgage`, `/tools/ai-home-finder`, `/tools/property-evaluator`, `/tools/compare-projects`, `/tools/compare-units`
- AI tools: 4 sample pages from `src/pages/AI*`
- Portals: `/owner`, `/broker`, `/developers-portal`, `/developer-hub`
- Admin: `/admin`, `/admin-crm`

For each I capture (a) viewport screenshot, (b) measured left/right offset of the primary content container, and (c) confirm offsets match the canonical track within ±1px. Homepage gets a second pass confirming the 4 exception bands are full-bleed and that the page scrolls without jumping.

### Files I will touch
- `src/index.css` — 1 normalization block, 1 fullbleed-band utility.
- `src/pages/Index.tsx` — add `data-homepage` body attribute (via `useEffect`) and `data-fullbleed-band` on the 4 exception wrappers.
- `src/components/home/OverseasInvestorsStrip.tsx` — defensive observer mount.
- No edits to any of the other 426 pages. No hero edits anywhere.

### What I will NOT do
- Will not touch any hero section on any page.
- Will not edit the homepage layout outside of the 4 named exception sections + body attribute.
- Will not touch backend, RLS, or data code.

Approve and I'll execute, then post the screenshot grid + alignment measurements.